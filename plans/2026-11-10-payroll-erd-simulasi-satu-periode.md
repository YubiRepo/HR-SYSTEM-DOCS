<!-- 📁 plans/2026-11-10-payroll-erd-simulasi-satu-periode.md -->
# Simulasi Data: Satu Periode Payroll (ERD v2)

| | |
|---|---|
| **Status** | Lampiran ilustrasi untuk [2026-11-06-payroll-erd-adaptation.md](./2026-11-06-payroll-erd-adaptation.md). Bukan seed, bukan fixture test. |
| **Tanggal** | 2026-11-10 |
| **Tujuan** | Menunjukkan isi setiap tabel (existing + baru dari P1–P8) untuk **satu periode payroll November 2026**, dari setup master sampai run ditutup, termasuk satu adjustment run. |
| **Skenario** | 1 tenant, 2 cabang, 3 karyawan, schedule bulanan dengan cutoff absensi 26–25, approval 2 step, split payment, satu karyawan error lalu di-exclude. **§11:** 2 karyawan non-bulanan — operator harian dibayar mingguan dan pekerja paruh waktu per jam dibayar dua mingguan. |

**Konvensi penulisan**

- ID ditulis singkat agar mudah dibaca (`emp-andi`, `run-nov`). Di database semuanya UUID. `tenant_id` tidak ditulis per baris; nilainya selalu `tnt-maju`.
- Uang ditulis `8.500.000` agar mudah dibaca, disimpan sebagai `BIGINT` rupiah penuh (`8500000`).
- `created_at`/`updated_at` hanya ditulis bila relevan dengan alur.
- Perhitungan mengikuti `domain/payrollrun/service/calculator.go` yang berlaku sekarang (§1 [03-calculation.md](../modules/payroll/03-calculation.md)). Pembulatan half-up ke rupiah.

---

## 0. Pelaku & Karyawan

**Tenant:** PT Contoh Maju (`tnt-maju`). **Cabang:** Jakarta (`br-jkt`), Bandung (`br-bdg`).

| User | Peran | Keterangan |
|---|---|---|
| `usr-rina` | Payroll Staff | Maker: membuat, menghitung, submit, dan menutup run |
| `usr-dewi` | HR Manager | Approver step 1 |
| `usr-eko` | Finance Director | Approver step 2 |
| `usr-fajar` | Finance Staff | Membuat batch pembayaran dan mencatat transaksi |

| Karyawan | Cabang | Structure | PTKP / TER | Catatan skenario |
|---|---|---|---|---|
| `emp-andi` Andi Pratama | JKT | STAFF-L1 → **STAFF-L2** (promosi 1 Nov) | TK/0 / A | Lembur, insentif one-time, input manual, dapat adjustment lembur Oktober |
| `emp-budi` Budi Santoso | BDG | STAFF-L1 | K/1 / B | Override tunjangan jabatan, 1 hari unpaid leave, split payment 2 rekening |
| `emp-citra` Citra Lestari | JKT | STAFF-L1 | — | Karyawan baru, **tax profile belum diisi** → payslip `error` → di-exclude |

---

## 1. Master Komponen & Structure (P1)

### 1.1 `pay_components`

| id | code | name | type | value_type | formula_id | taxable | bpjs_base | one_time / mode | is_system | sequence | is_active |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `pc-basic` | BASIC | Gaji Pokok | earning | fixed | — | ✔ | ✔ | — | ✔ | 10 | ✔ |
| `pc-pos` | POS | Tunjangan Jabatan | earning | fixed | — | ✔ | ✔ | — | | 20 | ✔ |
| `pc-trans` | TRANS | Tunjangan Transport | earning | formula | `fm-trans` | ✔ | | — | | 30 | ✔ |
| `pc-ot` | OT | Lembur | earning | formula | `fm-ot` | ✔ | | — | | 40 | ✔ |
| `pc-inc` | INCENTIVE | Insentif Proyek | earning | fixed | — | ✔ | | ✔ / `single_period` | | 50 | ✔ |
| `pc-unpaid` | UNPAID | Potongan Unpaid Leave | deduction | formula | `fm-unpaid` | | | — | | 90 | ✔ |

Kolom `formula` (legacy) masih berisi ekspresi versi 1 hasil backfill P3, tetapi tidak dipakai selama `formula_id` terisi.

> `UNPAID` sengaja **tidak** ber-flag `taxable`. Calculator sekarang menjumlahkan semua komponen ber-flag `taxable` ke bruto pajak tanpa melihat `type`, sehingga deduction ber-flag `taxable` justru **menambah** bruto pajak. Lihat §9 catatan 1.

### 1.2 `salary_structures`

| id | code | name | salary_type | pay_cycle | job_grade_id | is_active |
|---|---|---|---|---|---|---|
| `str-l1` | STAFF-L1 | Staff Level 1 | monthly | monthly | `jg-g1` | ✔ |
| `str-l2` | STAFF-L2 | Staff Level 2 | monthly | monthly | `jg-g2` | ✔ |

Implementasi P1 memakai `job_grade_id` (job grade Core HR), bukan `grade_code`.

### 1.3 `salary_structure_components`

| id | structure_id | component_id | default_amount | is_locked | sequence |
|---|---|---|---|---|---|
| `ssc-l1-basic` | `str-l1` | `pc-basic` | 6.000.000 | ✔ | 10 |
| `ssc-l1-pos` | `str-l1` | `pc-pos` | 500.000 | | 20 |
| `ssc-l1-trans` | `str-l1` | `pc-trans` | — | ✔ | 30 |
| `ssc-l1-ot` | `str-l1` | `pc-ot` | — | ✔ | 40 |
| `ssc-l1-unpaid` | `str-l1` | `pc-unpaid` | — | ✔ | 90 |
| `ssc-l2-basic` | `str-l2` | `pc-basic` | 8.000.000 | ✔ | 10 |
| `ssc-l2-pos` | `str-l2` | `pc-pos` | 1.500.000 | ✔ | 20 |
| `ssc-l2-trans` | `str-l2` | `pc-trans` | — | ✔ | 30 |
| `ssc-l2-ot` | `str-l2` | `pc-ot` | — | ✔ | 40 |
| `ssc-l2-unpaid` | `str-l2` | `pc-unpaid` | — | ✔ | 90 |

`INCENTIVE` tidak masuk structure karena one-time; diberikan manual per karyawan (§3.2).

### 1.4 `salary_structure_branch_overrides`

| id | structure_component_id | branch_id | default_amount | Alasan |
|---|---|---|---|---|
| `sbo-1` | `ssc-l1-basic` | `br-jkt` | 6.500.000 | UMP Jakarta lebih tinggi |
| `sbo-2` | `ssc-l2-basic` | `br-jkt` | 8.500.000 | idem |

`GET /payroll/structures/str-l2/preview?branch_id=br-jkt` → BASIC 8.500.000, POS 1.500.000.

---

## 2. Formula Berversi (P3)

### 2.1 `payroll_formulas`

| id | code | name | is_active |
|---|---|---|---|
| `fm-trans` | TRANS | Tunjangan Transport per hari hadir | ✔ |
| `fm-ot` | OT | Lembur berbobot | ✔ |
| `fm-unpaid` | UNPAID | Potongan unpaid leave prorata | ✔ |

### 2.2 `payroll_formula_versions`

| id | formula_id | version_no | expression | effective_from | status | published_by | published_at |
|---|---|---|---|---|---|---|---|
| `fv-trans-1` | `fm-trans` | 1 | `present_days * 40000` | 2000-01-01 | published | (backfill) | 2026-10-01 |
| `fv-trans-2` | `fm-trans` | 2 | `present_days * 50000` | **2026-11-01** | published | `usr-rina` | 2026-10-20 |
| `fv-ot-1` | `fm-ot` | 1 | `round(BASIC / MONTHLY_HOURS * overtime_weighted_hours)` | 2000-01-01 | published | (backfill) | 2026-10-01 |
| `fv-unpaid-1` | `fm-unpaid` | 1 | `round(BASIC / work_days * unpaid_days)` | 2000-01-01 | published | (backfill) | 2026-10-01 |

Versi 1 tetap `published` (tidak di-`retired`), karena recalculate periode Oktober masih harus memakai `present_days * 40000`.

### 2.3 `payroll_formula_variables` (diisi otomatis saat publish)

| version_id | variable_name | source |
|---|---|---|
| `fv-trans-1` | `present_days` | attendance |
| `fv-trans-2` | `present_days` | attendance |
| `fv-ot-1` | `BASIC` | component |
| `fv-ot-1` | `MONTHLY_HOURS` | system |
| `fv-ot-1` | `overtime_weighted_hours` | attendance |
| `fv-unpaid-1` | `BASIC` | component |
| `fv-unpaid-1` | `work_days` | attendance |
| `fv-unpaid-1` | `unpaid_days` | leave |

### 2.4 `salary_structure_component_formulas`

Hanya TRANS yang dipasang eksplisit di structure. OT dan UNPAID tidak punya baris, sehingga calculate jatuh ke langkah 2 resolusi (versi `published` terbaru dari `pay_components.formula_id`).

| id | structure_component_id | formula_version_id | effective_from | effective_to |
|---|---|---|---|---|
| `sscf-1` | `ssc-l1-trans` | `fv-trans-1` | 2024-01-01 | 2026-10-31 |
| `sscf-2` | `ssc-l1-trans` | `fv-trans-2` | 2026-11-01 | — |
| `sscf-3` | `ssc-l2-trans` | `fv-trans-1` | 2024-01-01 | 2026-10-31 |
| `sscf-4` | `ssc-l2-trans` | `fv-trans-2` | 2026-11-01 | — |

Resolusi untuk periode November (akhir periode 2026-11-30):

| Komponen | Langkah resolusi yang kena | Versi dipakai |
|---|---|---|
| TRANS | 1. structure formula berlaku | `fv-trans-2` |
| OT | 2. versi published terbaru `pay_components.formula_id` dengan `effective_from ≤ 2026-11-30` | `fv-ot-1` |
| UNPAID | 2. idem | `fv-unpaid-1` |

---

## 3. Kompensasi Karyawan (P2)

### 3.1 `employee_compensations`

| id | employee_id | branch_id | structure_id | effective_from | effective_to | status | reason | created_by |
|---|---|---|---|---|---|---|---|---|
| `cmp-andi-1` | `emp-andi` | `br-jkt` | `str-l1` | 2024-03-01 | **2026-10-31** | superseded | hire | `usr-rina` |
| `cmp-andi-2` | `emp-andi` | `br-jkt` | `str-l2` | **2026-11-01** | — | active | promotion | `usr-rina` |
| `cmp-budi-1` | `emp-budi` | `br-bdg` | `str-l1` | 2025-07-01 | — | active | hire | `usr-rina` |
| `cmp-citra-1` | `emp-citra` | `br-jkt` | `str-l1` | 2026-10-01 | — | active | hire | `usr-rina` |

`cmp-andi-2` dibuat 2026-10-25 sebagai `draft`, di-activate 2026-10-27. Saat dibuat, `cmp-andi-1` otomatis mendapat `effective_to = 2026-10-31` dan status `superseded`.

### 3.2 `employee_components`

Resolusi nilai: katalog → structure → cabang → override input.

| id | employee_id | compensation_id | component_id | amount | source | effective_from | effective_to | effective_period |
|---|---|---|---|---|---|---|---|---|
| `ec-a1-basic` | `emp-andi` | `cmp-andi-1` | BASIC | 6.500.000 | structure (cabang JKT) | 2024-03-01 | 2026-10-31 | |
| `ec-a1-pos` | `emp-andi` | `cmp-andi-1` | POS | 500.000 | structure | 2024-03-01 | 2026-10-31 | |
| `ec-a1-…` | `emp-andi` | `cmp-andi-1` | TRANS, OT, UNPAID | NULL | structure | 2024-03-01 | 2026-10-31 | |
| `ec-a2-basic` | `emp-andi` | `cmp-andi-2` | BASIC | 8.500.000 | structure (cabang JKT) | 2026-11-01 | — | |
| `ec-a2-pos` | `emp-andi` | `cmp-andi-2` | POS | 1.500.000 | structure | 2026-11-01 | — | |
| `ec-a2-…` | `emp-andi` | `cmp-andi-2` | TRANS, OT, UNPAID | NULL | structure | 2026-11-01 | — | |
| `ec-a-inc` | `emp-andi` | **NULL** | INCENTIVE | 500.000 | manual | 2026-11-01 | 2026-11-30 | `2026-11` |
| `ec-b1-basic` | `emp-budi` | `cmp-budi-1` | BASIC | 6.000.000 | structure | 2025-07-01 | — | |
| `ec-b1-pos` | `emp-budi` | `cmp-budi-1` | POS | **750.000** | **override** | 2025-07-01 | — | |
| `ec-b1-…` | `emp-budi` | `cmp-budi-1` | TRANS, OT, UNPAID | NULL | structure | 2025-07-01 | — | |
| `ec-c1-basic` | `emp-citra` | `cmp-citra-1` | BASIC | 6.500.000 | structure (cabang JKT) | 2026-10-01 | — | |
| `ec-c1-pos` | `emp-citra` | `cmp-citra-1` | POS | 500.000 | structure | 2026-10-01 | — | |
| `ec-c1-…` | `emp-citra` | `cmp-citra-1` | TRANS, OT, UNPAID | NULL | structure | 2026-10-01 | — | |

Catatan:

- Baris `ec-…-…` adalah ringkasan tiga baris (satu per komponen formula, `amount` NULL).
- Override POS Budi diizinkan karena `ssc-l1-pos.is_locked = false`. Override BASIC atau POS di STAFF-L2 akan ditolak (`is_locked = true`).
- `INCENTIVE` Andi tidak terikat versi kompensasi (`compensation_id` NULL), sehingga tidak ikut ter-supersede bila ada promosi lagi.

### 3.3 `employee_tax_profile` (existing)

| employee_id | ptkp_status | ter_category | has_npwp | pph21_method | dtp_eligible |
|---|---|---|---|---|---|
| `emp-andi` | TK/0 | A | ✔ | gross | |
| `emp-budi` | K/1 | B | ✔ | gross | |
| `emp-citra` | *(belum ada baris)* | | | | |

---

## 4. Schedule & Periode (P4)

### 4.1 `payroll_schedules`

| id | code | name | pay_cycle | is_default | is_active |
|---|---|---|---|---|---|
| `sch-monthly` | MONTHLY | Bulanan | monthly | ✔ | ✔ |

### 4.2 `payroll_schedule_rules`

| id | schedule_id | period_start_day | attendance_cutoff_day | pay_day | pay_day_holiday_shift | effective_from |
|---|---|---|---|---|---|---|
| `sr-1` | `sch-monthly` | 1 | 25 | 25 | before | 2025-01-01 |
| `sr-2` | `sch-monthly` | 1 | 25 | **28** | before | 2026-06-01 |

Periode gaji = bulan kalender (start day 1). Absensi dihitung dari tanggal 26 bulan sebelumnya s.d. tanggal 25 bulan berjalan.

### 4.3 `employee_payroll_assignments`

| id | employee_id | schedule_id | effective_from | effective_to |
|---|---|---|---|---|
| `epa-andi` | `emp-andi` | `sch-monthly` | 2024-03-01 | — |
| `epa-budi` | `emp-budi` | `sch-monthly` | 2025-07-01 | — |
| `epa-citra` | `emp-citra` | `sch-monthly` | 2026-10-01 | — |

### 4.4 `payroll_periods`

Hasil `POST /payroll/schedules/sch-monthly/periods/generate` untuk tahun 2026 (dipotong tiga baris):

| id | schedule_id | code | start_date | end_date | cutoff_from | cutoff_to | pay_date | status |
|---|---|---|---|---|---|---|---|---|
| `per-2026-10` | `sch-monthly` | 2026-10 | 2026-10-01 | 2026-10-31 | 2026-09-26 | 2026-10-25 | 2026-10-28 (Rab) | closed |
| `per-2026-11` | `sch-monthly` | 2026-11 | 2026-11-01 | 2026-11-30 | 2026-10-26 | 2026-11-25 | **2026-11-27 (Jum)** | open → locked → closed |
| `per-2026-12` | `sch-monthly` | 2026-12 | 2026-12-01 | 2026-12-31 | 2026-11-26 | 2026-12-25 | 2026-12-28 (Sen) | open |

Tanggal 28 November 2026 jatuh pada hari Sabtu, sehingga `pay_day_holiday_shift = before` menggeser pay date ke Jumat 27 November.

Hari kerja dalam cutoff 26 Okt – 25 Nov 2026 (Senin–Jumat, tanpa libur nasional) = **23 hari**.

---

## 5. Payroll Run Regular (P4, P5)

### 5.1 `payroll_runs`

| Kolom | `run-nov` |
|---|---|
| `period_id` | `per-2026-11` |
| `period` | `2026-11` (diturunkan dari `pay_date`, untuk PPh 21) |
| `type` | regular |
| `branch_id` | NULL (seluruh tenant) |
| `target_filter` | NULL (semua karyawan yang ter-assign ke `sch-monthly`) |
| `parent_run_id` | NULL |
| `pay_date` | 2026-11-27 |
| `status` | `closed` (riwayat di §8) |
| `created_by` | `usr-rina` |
| `approved_by` | `usr-eko` (approver step terakhir) |
| `totals` | `{"count": 2, "gross": 19768497, "bpjs_ee": 670000, "bpjs_er": 1715200, "pph21": 556740, "other_deductions": 260870, "net": 18280887}` |

### 5.2 `payroll_run_inputs`

Snapshot `periodvars` untuk rentang `cutoff_from`–`cutoff_to`. Hanya variabel yang dirujuk formula yang ditampilkan.

| payslip_id | variable_name | value | source | note |
|---|---|---|---|---|
| `slip-andi` | `work_days` | 23 | attendance | |
| `slip-andi` | `present_days` | 22 | attendance | |
| `slip-andi` | `paid_leave_days` | 1 | leave | Cuti tahunan 12 Nov |
| `slip-andi` | `unpaid_days` | 0 | leave | |
| `slip-andi` | `overtime_weighted_hours` | **7,5** | **manual** | Semula 6 dari Attendance. Lembur 24 Nov (1 jam × 1,5) belum di-approve di Attendance; disetujui HR via memo #12 |
| `slip-budi` | `work_days` | 23 | attendance | |
| `slip-budi` | `present_days` | 21 | attendance | |
| `slip-budi` | `paid_leave_days` | 1 | leave | Sakit dengan surat dokter |
| `slip-budi` | `unpaid_days` | 1 | leave | Izin tanpa upah 18 Nov |
| `slip-budi` | `overtime_weighted_hours` | 0 | attendance | |
| `slip-citra` | `work_days`, `present_days`, … | 23, 23, … | attendance | Tetap disnapshot walaupun payslip error |

`MONTHLY_HOURS` (173) adalah konstanta sistem, tidak disimpan di `payroll_run_inputs`.

### 5.3 Perhitungan per karyawan

**Andi** (STAFF-L2, JKT, TER A)

| Langkah | Perhitungan | Hasil |
|---|---|---|
| BASIC | kompensasi `cmp-andi-2` | 8.500.000 |
| POS | kompensasi `cmp-andi-2` | 1.500.000 |
| TRANS | `fv-trans-2`: 22 × 50.000 | 1.100.000 |
| OT | `fv-ot-1`: round(8.500.000 / 173 × 7,5) = round(368.497,11) | 368.497 |
| INCENTIVE | one-time 2026-11 | 500.000 |
| **Gross** | Σ earning | **11.968.497** |
| Dasar BPJS | BASIC + POS | 10.000.000 |
| BPJS karyawan | Kes 1% (cap 12 jt) 100.000 + JHT 2% 200.000 + JP 1% (cap 10.547.400) 100.000 | 400.000 |
| BPJS perusahaan | Kes 4% 400.000 + JHT 3,7% 370.000 + JP 2% 200.000 + JKK 0,24% 24.000 + JKM 0,3% 30.000 | 1.024.000 |
| Bruto pajak | Σ taxable | 11.968.497 |
| PPh 21 | TER A, rentang 11.600.001–12.500.000 = 4% → 478.739,88 | 478.740 |
| **Net** | 11.968.497 − 400.000 − 478.740 | **11.089.757** |

**Budi** (STAFF-L1, BDG, TER B)

| Langkah | Perhitungan | Hasil |
|---|---|---|
| BASIC | kompensasi `cmp-budi-1` | 6.000.000 |
| POS | override | 750.000 |
| TRANS | `fv-trans-2`: 21 × 50.000 | 1.050.000 |
| OT | `fv-ot-1`: 0 jam | 0 |
| **Gross** | Σ earning | **7.800.000** |
| UNPAID (deduction) | `fv-unpaid-1`: round(6.000.000 / 23 × 1) = round(260.869,57) | 260.870 |
| Dasar BPJS | BASIC + POS | 6.750.000 |
| BPJS karyawan | Kes 67.500 + JHT 135.000 + JP 67.500 | 270.000 |
| BPJS perusahaan | Kes 270.000 + JHT 249.750 + JP 135.000 + JKK 16.200 + JKM 20.250 | 691.200 |
| Bruto pajak | Σ taxable (UNPAID tidak taxable) | 7.800.000 |
| PPh 21 | TER B, rentang 7.300.001–9.200.000 = 1% | 78.000 |
| **Net** | 7.800.000 − 270.000 − 78.000 − 260.870 | **7.191.130** |

**Citra**: calculate gagal dengan `MISSING_PTKP` karena tidak ada baris `employee_tax_profile`. Run tetap `calculated`; submit ditolak sampai payslip Citra di-exclude.

### 5.4 `payslips`

| id | run_id | employee_id | status | error_message | compensation_id | schedule_id | gross | taxable_gross | bpjs_employee | bpjs_employer | pph21 | other_deductions | net |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `slip-andi` | `run-nov` | `emp-andi` | ok | | `cmp-andi-2` | `sch-monthly` | 11.968.497 | 11.968.497 | 400.000 | 1.024.000 | 478.740 | 0 | 11.089.757 |
| `slip-budi` | `run-nov` | `emp-budi` | ok | | `cmp-budi-1` | `sch-monthly` | 7.800.000 | 7.800.000 | 270.000 | 691.200 | 78.000 | 260.870 | 7.191.130 |
| `slip-citra` | `run-nov` | `emp-citra` | **excluded** | `MISSING_PTKP: employee tax profile not found` | `cmp-citra-1` | `sch-monthly` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

`error_message` Citra tetap disimpan setelah di-exclude agar alasan exclude bisa ditelusuri. Citra dibayar lewat run berikutnya setelah tax profile dilengkapi (di luar simulasi ini).

### 5.5 `payslip_lines`

| payslip_id | sequence | component_id | component_code | name | type | amount | source | formula_version_id |
|---|---|---|---|---|---|---|---|---|
| `slip-andi` | 10 | `pc-basic` | BASIC | Gaji Pokok | earning | 8.500.000 | fixed | — |
| `slip-andi` | 20 | `pc-pos` | POS | Tunjangan Jabatan | earning | 1.500.000 | fixed | — |
| `slip-andi` | 30 | `pc-trans` | TRANS | Tunjangan Transport | earning | 1.100.000 | formula | `fv-trans-2` |
| `slip-andi` | 40 | `pc-ot` | OT | Lembur | earning | 368.497 | formula | `fv-ot-1` |
| `slip-andi` | 50 | `pc-inc` | INCENTIVE | Insentif Proyek | earning | 500.000 | fixed | — |
| `slip-budi` | 10 | `pc-basic` | BASIC | Gaji Pokok | earning | 6.000.000 | fixed | — |
| `slip-budi` | 20 | `pc-pos` | POS | Tunjangan Jabatan | earning | 750.000 | fixed | — |
| `slip-budi` | 30 | `pc-trans` | TRANS | Tunjangan Transport | earning | 1.050.000 | formula | `fv-trans-2` |
| `slip-budi` | 40 | `pc-ot` | OT | Lembur | earning | 0 | formula | `fv-ot-1` |
| `slip-budi` | 90 | `pc-unpaid` | UNPAID | Potongan Unpaid Leave | deduction | 260.870 | formula | `fv-unpaid-1` |

Komponen UNPAID Andi bernilai 0 dan ditulis sama seperti OT Budi; baris itu tidak ditampilkan di tabel agar ringkas. BPJS dan PPh 21 tidak menjadi `payslip_lines`; nilainya ada di kolom `payslips`.

---

## 6. Approval Berjenjang (P7, modul `approval`)

### 6.1 `approval_policies`

| id | document_type | subtype_ref | name | is_active |
|---|---|---|---|---|
| `apo-payroll` | payroll_run | NULL | Payroll Run – HR & Finance | ✔ |

### 6.2 `approval_policy_steps`

| id | policy_id | step_order | approver_type | approver_user_id | on_unresolved | fallback_user_id |
|---|---|---|---|---|---|---|
| `aps-1` | `apo-payroll` | 1 | user | `usr-dewi` | fallback_user | `usr-eko` |
| `aps-2` | `apo-payroll` | 2 | user | `usr-eko` | skip | — |

### 6.3 `approval_requests`

| id | document_type | document_id | policy_id | subject_employee_id | submitted_by_user_id | status | current_step | submitted_at | completed_at |
|---|---|---|---|---|---|---|---|---|---|
| `apr-nov` | payroll_run | `run-nov` | `apo-payroll` | NULL | `usr-rina` | approved | 2 | 2026-11-26 10:00 | 2026-11-27 08:00 |

`subject_employee_id` NULL karena payroll run adalah dokumen internal tanpa pemilik karyawan.

### 6.4 `approval_request_steps`

| id | approval_request_id | step_order | approver_user_id | source | status | decided_at | note |
|---|---|---|---|---|---|---|---|
| `ars-1` | `apr-nov` | 1 | `usr-dewi` | user | approved | 2026-11-26 14:00 | Sudah cek lembur Andi & exclude Citra |
| `ars-2` | `apr-nov` | 2 | `usr-eko` | user | approved | 2026-11-27 08:00 | |

### 6.5 `approval_actions`

| approval_request_id | step_id | actor_user_id | action | created_at |
|---|---|---|---|---|
| `apr-nov` | — | `usr-rina` | submit | 2026-11-26 10:00 |
| `apr-nov` | `ars-1` | `usr-dewi` | approve | 2026-11-26 14:00 |
| `apr-nov` | `ars-2` | `usr-eko` | approve | 2026-11-27 08:00 |

Maker-checker: `usr-rina` tidak boleh menjadi approver di step mana pun.

---

## 7. Pembayaran (P8)

Rekening dibaca dari Core HR (`employees.bank_accounts`) lewat `ListPrimaryBankAccounts`, lalu disnapshot ke `payroll_payments`. Budi minta gajinya dibagi ke dua rekening, sehingga batch dibuat per bank.

### 7.1 `payroll_payment_batches`

| id | run_id | method | bank_code | file_key | status | created_by | exported_at |
|---|---|---|---|---|---|---|---|
| `pb-bca` | `run-nov` | bank_transfer | BCA | `payroll/tnt-maju/run-nov/pb-bca.csv` | completed | `usr-fajar` | 2026-11-27 08:40 |
| `pb-mdr` | `run-nov` | bank_transfer | MANDIRI | `payroll/tnt-maju/run-nov/pb-mdr.csv` | completed | `usr-fajar` | 2026-11-27 08:42 |

### 7.2 `payroll_payments`

| id | batch_id | payslip_id | employee_id | amount | bank_code | account_number | account_name | status | paid_at |
|---|---|---|---|---|---|---|---|---|---|
| `pay-andi` | `pb-bca` | `slip-andi` | `emp-andi` | 11.089.757 | BCA | 1234567890 | ANDI PRATAMA | paid | 2026-11-27 10:00 |
| `pay-budi-1` | `pb-bca` | `slip-budi` | `emp-budi` | 5.000.000 | BCA | 2233445566 | BUDI SANTOSO | paid | 2026-11-27 10:00 |
| `pay-budi-2` | `pb-mdr` | `slip-budi` | `emp-budi` | 2.191.130 | MANDIRI | 1370011223344 | BUDI SANTOSO | paid | 2026-11-27 13:05 |

Validasi: Budi 5.000.000 + 2.191.130 = 7.191.130 = `slip-budi.net`. Citra (`excluded`) tidak mendapat payment.

### 7.3 `payroll_payment_transactions` (append-only)

| payment_id | attempt | external_ref | status | proof_key | note | created_by | created_at |
|---|---|---|---|---|---|---|---|
| `pay-andi` | 1 | BCA-KB-77120 | paid | `…/proof/pb-bca.pdf` | | `usr-fajar` | 2026-11-27 10:00 |
| `pay-budi-1` | 1 | BCA-KB-77120 | paid | `…/proof/pb-bca.pdf` | | `usr-fajar` | 2026-11-27 10:00 |
| `pay-budi-2` | 1 | MCM-55091 | failed | | Nama penerima tidak sesuai (`BUDI S`) | `usr-fajar` | 2026-11-27 10:10 |
| `pay-budi-2` | 2 | MCM-55102 | paid | `…/proof/pb-mdr-retry.pdf` | Nama rekening diperbaiki di Core HR, kirim ulang | `usr-fajar` | 2026-11-27 13:05 |

Pada attempt 2, `account_name` di `pay-budi-2` diperbarui dari snapshot baru setelah Core HR diperbaiki. Attempt 1 tetap tercatat dengan status `failed`. Setelah `pay-budi-2` lunas, semua payment `paid` → `run-nov` otomatis berstatus `paid`.

---

## 8. Riwayat Status

| Waktu | Aksi | Aktor | Perubahan data |
|---|---|---|---|
| 2026-10-20 | Publish TRANS v2 | `usr-rina` | `fv-trans-2` published, berlaku 2026-11-01 |
| 2026-10-25 / 27 | Promosi Andi dibuat / di-activate | `usr-rina` | `cmp-andi-2` draft → active; `cmp-andi-1` superseded |
| 2026-11-26 09:00 | Buat run | `usr-rina` | `run-nov` draft |
| 2026-11-26 09:05 | Calculate | `usr-rina` | `run-nov` calculated; `slip-citra` error; `payroll_run_inputs` terisi |
| 2026-11-26 09:30 | Input manual lembur Andi | `usr-rina` | `overtime_weighted_hours` 6 → 7,5, `source = manual` |
| 2026-11-26 09:40 | Exclude Citra | `usr-rina` | `slip-citra.status = excluded` |
| 2026-11-26 09:45 | Recalculate (tanpa `refresh_inputs`) | `usr-rina` | Pakai snapshot input; input manual tetap 7,5 |
| 2026-11-26 10:00 | Submit | `usr-rina` | `run-nov` in_review; `apr-nov` pending, step 1 pending |
| 2026-11-26 14:00 | Approve step 1 | `usr-dewi` | `ars-1` approved, `ars-2` pending |
| 2026-11-27 08:00 | Approve step 2 | `usr-eko` | `apr-nov` approved → callback → `run-nov` approved; `per-2026-11` locked |
| 2026-11-27 08:40 | Buat & export batch | `usr-fajar` | `pb-bca`, `pb-mdr` exported |
| 2026-11-27 10:00–13:05 | Catat transaksi | `usr-fajar` | Semua payment paid → `run-nov` paid; batch completed |
| 2026-11-30 | Close run | `usr-rina` | `run-nov` closed; `per-2026-11` closed |

---

## 9. Adjustment Run (P6)

Pada 1 Desember, Andi melapor lembur 3 jam berbobot pada 20 Oktober belum dibayar. Run Oktober dan November sudah `closed`, jadi koreksi dibuat sebagai adjustment ke periode November.

### 9.1 `payroll_adjustments`

| id | employee_id | component_id | amount | target_period_id | source_run_id | reason | status | applied_run_id | created_by |
|---|---|---|---|---|---|---|---|---|---|
| `adj-1` | `emp-andi` | `pc-ot` | 112.717 | `per-2026-11` | `run-okt` | Lembur 20 Okt (3 jam berbobot) terlewat | pending → **applied** | `run-nov-adj` | `usr-rina` |

Nominal memakai BASIC Andi saat lembur terjadi (Oktober, `cmp-andi-1`): round(6.500.000 / 173 × 3) = round(112.716,76) = 112.717.

### 9.2 `payroll_runs` (adjustment)

| Kolom | `run-nov-adj` |
|---|---|
| `period_id` / `period` | `per-2026-11` / `2026-11` (periode `closed` hanya menerima run `adjustment`) |
| `type` | adjustment |
| `parent_run_id` | `run-nov` |
| `pay_date` | 2026-12-04 |
| `status` | closed |
| `totals` | `{"count": 1, "gross": 112717, "bpjs_ee": 0, "bpjs_er": 0, "pph21": 4509, "other_deductions": 0, "net": 108208}` |

### 9.3 PPh 21 selisih

| | Bruto pajak Nov | Tarif TER A | PPh 21 |
|---|---|---|---|
| Run regular | 11.968.497 | 4% | 478.740 |
| Regular + adjustment | 12.081.214 | 4% | 483.249 |
| **Dipotong di run adjustment** | | | **4.509** |

BPJS tidak berubah karena OT tidak ber-flag `bpjs_base`.

### 9.4 Payslip & pembayaran adjustment

| Tabel | Baris |
|---|---|
| `payslips` | `slip-andi-adj`: status ok, compensation `cmp-andi-2`, gross 112.717, taxable_gross 112.717, bpjs 0/0, pph21 4.509, net **108.208** |
| `payslip_lines` | seq 40, OT, Lembur, earning, 112.717, source `fixed`, formula_version_id NULL (nilai dari `adj-1`, bukan formula) |
| `payroll_run_inputs` | tidak ada (tidak ada komponen formula) |
| `approval_requests` | `apr-nov-adj`, policy yang sama, 2 step, approved 2026-12-03 |
| `payroll_payment_batches` / `payroll_payments` | `pb-adj-bca` → `pay-andi-adj` 108.208 ke BCA 1234567890, paid 2026-12-04 |

Saat `run-nov-adj` closed, `adj-1.status = applied`. Angka di `run-nov` tidak berubah.

---

## 10. Catatan dari Simulasi

| # | Temuan | Usulan |
|---|---|---|
| 1 | Deduction ber-flag `taxable` menambah bruto pajak (calculator menjumlahkan `taxable` tanpa melihat `type`). Potongan unpaid leave secara pajak seharusnya **mengurangi** bruto. | Calculator: deduction `taxable` mengurangi `TaxableGross` (dan `bpjs_base` mengurangi dasar BPJS). Putuskan di P2 atau P5. Sementara, deduction dibuat tanpa flag `taxable`. |
| 2 | `payslip_lines.source` di plan hanya `fixed` / `formula`. Line dari adjustment terlihat seperti `fixed` biasa. | Tambah nilai `adjustment` dan kolom `adjustment_id` (nullable) di P6 agar line bisa ditelusuri ke `payroll_adjustments`. |
| 3 | Kapan period `locked`. Simulasi memakai: saat run regular `approved`. | Tetapkan di P4: `locked` = tidak menerima run regular baru dan input absensi untuk cutoff ini tidak lagi ditarik. |
| 4 | Retry payment ke rekening yang sudah diperbaiki mengubah snapshot di `payroll_payments`. | Alternatif: payment lama `failed` dibiarkan, buat payment baru. Putuskan di P8. |
| 5 | Payslip `excluded` tetap ada dengan angka 0. | Pastikan laporan PPh 21 & BPJS bulanan mengabaikan payslip non-`ok`. |

---

## 11. Karyawan Non-Bulanan (Mingguan & Dua Mingguan)

Skenario tambahan di tenant yang sama, **November 2026**, untuk karyawan yang **tidak** memakai periode bulanan dengan cutoff 26–25. Tujuannya menguji apakah desain P1, P4, P11 dan P12 masih cocok, dan menemukan apa yang belum. Perhitungan memakai calculator yang berlaku sekarang (termasuk flag pajak BPJS P12), kecuali bagian PPh 21 harian yang **belum ada** di calculator (lihat §11.8).

### 11.1 Karyawan

| Karyawan | Cabang | Status pajak | Structure | Schedule | Catatan |
|---|---|---|---|---|---|
| `emp-dodi` Dodi Saputra | BDG | Pegawai **tidak tetap**, upah harian | OPR-HARIAN | `sch-weekly` | Operator produksi, kerja Senin–Sabtu, dibayar tiap Rabu untuk minggu sebelumnya |
| `emp-eka` Eka Wulandari | JKT | Pegawai **tidak tetap**, upah per jam | PT-HOURLY | `sch-biweekly` | Desainer paruh waktu, kerja Senin–Kamis, dibayar dua minggu sekali |

Keduanya TK/0. Status "pegawai tidak tetap" penting untuk PPh 21 (§11.6), tetapi **belum ada kolomnya** di `employee_tax_profile`.

### 11.2 Komponen & Structure (P1)

`pay_components` tambahan:

| id | code | name | type | value_type | formula | taxable | bpjs_base | sequence |
|---|---|---|---|---|---|---|---|---|
| `pc-daily` | UPAH_HARIAN | Upah Harian | earning | formula | `170000 * present_days` | ✔ | ✔ | 10 |
| `pc-hourly` | UPAH_JAM | Upah per Jam | earning | formula | `75000 * actual_work_minutes / 60` | ✔ | ✔ | 10 |

`salary_structures`:

| id | code | name | salary_type | pay_cycle | job_grade_id |
|---|---|---|---|---|---|
| `str-opr` | OPR-HARIAN | Operator Harian | daily | weekly | `jg-opr` |
| `str-pt` | PT-HOURLY | Paruh Waktu per Jam | hourly | biweekly | — |

`salary_structure_components`: `str-opr` → `pc-daily`; `str-pt` → `pc-hourly`. Keduanya formula, jadi `default_amount` kosong dan **override cabang tidak bisa dipakai**.

> **Masalah tarif:** tarif harian (170.000) dan tarif per jam (75.000) terpaksa ditulis di dalam formula. Akibatnya tarif tidak bisa berbeda per cabang (override P1 hanya untuk komponen `fixed`), tidak bisa berbeda per karyawan, dan kenaikan tarif berarti mengubah formula. Komponen `fixed` bernilai 170.000 juga tidak bisa dipakai sebagai tarif karena akan **ikut dibayar** sebagai earning. Lihat §11.8 #2.

### 11.3 Schedule & Periode (P4)

`payroll_schedules`:

| id | code | name | pay_cycle |
|---|---|---|---|
| `sch-weekly` | WEEKLY | Mingguan | weekly |
| `sch-biweekly` | BIWEEKLY | Dua Mingguan | biweekly |

Aturan yang dibutuhkan:

| Schedule | Periode | Cutoff absensi | Tanggal bayar |
|---|---|---|---|
| `sch-weekly` | Senin–Minggu | sama dengan periode | Rabu setelah periode berakhir (+3 hari) |
| `sch-biweekly` | 14 hari mulai Senin 26 Okt 2026 | sama dengan periode | Rabu setelah periode berakhir (+3 hari) |

> Kolom `payroll_schedule_rules` di plan P4 (`period_start_day`, `attendance_cutoff_day`, `pay_day`) adalah **tanggal dalam bulan**, sehingga tidak bisa menyatakan "Senin–Minggu, bayar Rabu berikutnya". Lihat §11.8 #1.

`payroll_periods` (hasil generate):

| id | schedule | code | start_date | end_date | cutoff | pay_date | Masa PPh 21 |
|---|---|---|---|---|---|---|---|
| `per-w44` | weekly | 2026-W44 | 2026-10-26 | 2026-11-01 | = periode | 2026-11-04 | **2026-11** |
| `per-w45` | weekly | 2026-W45 | 2026-11-02 | 2026-11-08 | = periode | 2026-11-11 | 2026-11 |
| `per-w46` | weekly | 2026-W46 | 2026-11-09 | 2026-11-15 | = periode | 2026-11-18 | 2026-11 |
| `per-w47` | weekly | 2026-W47 | 2026-11-16 | 2026-11-22 | = periode | 2026-11-25 | 2026-11 |
| `per-w48` | weekly | 2026-W48 | 2026-11-23 | 2026-11-29 | = periode | 2026-12-02 | **2026-12** |
| `per-bw1` | biweekly | 2026-B22 | 2026-10-26 | 2026-11-08 | = periode | 2026-11-11 | 2026-11 |
| `per-bw2` | biweekly | 2026-B23 | 2026-11-09 | 2026-11-22 | = periode | 2026-11-25 | 2026-11 |
| `per-bw3` | biweekly | 2026-B24 | 2026-11-23 | 2026-12-06 | = periode | 2026-12-09 | 2026-12 |

Periode W44 sebagian besar jatuh di Oktober, tetapi dibayar 4 November, sehingga masuk **masa pajak November**. Periode W48 bekerja di November tetapi dibayar 2 Desember, sehingga masuk masa Desember. Ini sesuai plan §8 #12 (masa pajak = bulan dibayar).

Dalam November ada **4 run mingguan** dan **2 run dua mingguan** — semuanya `payroll_runs.period = 2026-11` dengan `period_id` berbeda.

### 11.4 Kepesertaan BPJS (P11)

| employee | program | is_enrolled | risk_class | exclusion_reason |
|---|---|---|---|---|
| `emp-dodi` | jkk | ✔ | `medium` (0,89%) | |
| `emp-dodi` | jkm | ✔ | | |
| `emp-dodi` | kesehatan / jht / jp | ✗ | | `other` (pekerja harian lepas, terdaftar mandiri) |
| `emp-eka` | jht | ✔ | | |
| `emp-eka` | jkk | ✔ | `very_low` (0,24%) | |
| `emp-eka` | jkm | ✔ | | |
| `emp-eka` | kesehatan / jp | ✗ | | `other` |

### 11.5 Perhitungan per run

Input dari `payroll_run_inputs` (cutoff = periode, tanpa libur nasional).

**Dodi** — operator harian, dibayar mingguan

| Periode | present_days | UPAH_HARIAN (gross) | JKK 0,89% | JKM 0,3% | Bruto pajak¹ | Rata-rata per hari | PPh 21² | Net |
|---|---|---|---|---|---|---|---|---|
| W44 | 6 | 1.020.000 | 9.078 | 3.060 | 1.032.138 | 172.023 | 0 | 1.020.000 |
| W45 | 6 | 1.020.000 | 9.078 | 3.060 | 1.032.138 | 172.023 | 0 | 1.020.000 |
| W46 | 5 (1 hari absen) | 850.000 | 7.565 | 2.550 | 860.115 | 172.023 | 0 | 850.000 |
| W47 | 6 | 1.020.000 | 9.078 | 3.060 | 1.032.138 | 172.023 | 0 | 1.020.000 |

¹ Gross + premi JKK & JKM perusahaan (flag `employer_contribution_taxable`, P12). Tidak ada iuran karyawan karena Dodi hanya ikut JKK & JKM.
² TER harian: rata-rata ≤ Rp450.000 per hari → 0%.

**Eka** — paruh waktu per jam, dibayar dua mingguan

| Periode | Hari kerja | Jam (`actual_work_minutes`/60) | UPAH_JAM (gross) | JHT karyawan 2% | JHT perusahaan 3,7% | JKK 0,24% | JKM 0,3% | Bruto pajak | Rata-rata per hari | PPh 21 (TER harian 0,5%) | Net |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B22 | 8 | 60 | 4.500.000 | 90.000 | 166.500 | 10.800 | 13.500 | 4.524.300 | 565.538 | 22.622 | 4.387.378 |
| B23 | 8 | 64 | 4.800.000 | 96.000 | 177.600 | 11.520 | 14.400 | 4.825.920 | 603.240 | 24.130 | 4.679.870 |

Rata-rata harian Eka di atas Rp450.000 dan di bawah Rp2.500.000, sehingga TER harian 0,5% dari bruto.

> Calculator **sekarang** akan menghitung PPh 21 Eka dengan **TER bulanan kategori A** untuk tiap run dua mingguan: bruto 4.524.300 per run masuk rentang TER A 0% (≤ 5.400.000), sehingga PPh 21 = 0 — padahal per bulan Eka berpenghasilan > Rp9 juta. Dodi juga 0 karena kebetulan memang 0%. Lihat §11.8 #3.

### 11.6 Payslip (ringkas)

| id | run (periode) | employee | gross | taxable_gross | bpjs_employee | bpjs_employer | pph21 | net | pph21_method | tax_treatment |
|---|---|---|---|---|---|---|---|---|---|---|
| `slip-dodi-w44` | W44 | `emp-dodi` | 1.020.000 | 1.032.138 | 0 | 12.138 | 0 | 1.020.000 | gross | subject |
| `slip-dodi-w45` | W45 | `emp-dodi` | 1.020.000 | 1.032.138 | 0 | 12.138 | 0 | 1.020.000 | gross | subject |
| `slip-dodi-w46` | W46 | `emp-dodi` | 850.000 | 860.115 | 0 | 10.115 | 0 | 850.000 | gross | subject |
| `slip-dodi-w47` | W47 | `emp-dodi` | 1.020.000 | 1.032.138 | 0 | 12.138 | 0 | 1.020.000 | gross | subject |
| `slip-eka-b22` | B22 | `emp-eka` | 4.500.000 | 4.524.300 | 90.000 | 190.800 | 22.622 | 4.387.378 | gross | subject |
| `slip-eka-b23` | B23 | `emp-eka` | 4.800.000 | 4.825.920 | 96.000 | 206.400 | 24.130 | 4.679.870 | gross | subject |

### 11.7 Laporan setoran November (P13)

Semua slip di atas berasal dari run dengan `payroll_runs.period = 2026-11`, sehingga satu laporan masa November menjumlahkan **6 run**.

| Laporan | Dodi | Eka | Total |
|---|---|---|---|
| BPJS TK · JHT (karyawan + perusahaan) | — | 186.000 + 344.100 | 530.100 |
| BPJS TK · JKK | 34.799 | 22.320 | 57.119 |
| BPJS TK · JKM | 11.730 | 27.900 | 39.630 |
| BPJS Kesehatan | — | — | 0 |
| PPh 21 dipotong (TER harian) | 0 | 46.752 | 46.752 |

Daftar bukti potong menampilkan Dodi dan Eka masing-masing **satu baris** (penjumlahan semua run masa November), seperti yang sudah diimplementasikan P13.

### 11.8 Temuan dari simulasi non-bulanan

| # | Temuan | Usulan |
|---|---|---|
| 1 | `payroll_schedule_rules` (P4) hanya punya tanggal dalam bulan, tidak bisa menyatakan periode mingguan / dua mingguan. | Tambah di P4: `period_anchor_date` (tanggal mulai periode pertama), `period_length_days` (7 / 14) dan `pay_offset_days` / `cutoff_offset_days` untuk schedule non-bulanan; kolom tanggal-dalam-bulan tetap untuk bulanan. Kode periode `YYYY-Www` (mingguan) dan `YYYY-Bnn` (dua mingguan). |
| 2 | Tarif harian / per jam harus ditulis di formula, sehingga tidak bisa dioverride per cabang atau per karyawan, dan komponen `fixed` sebagai tarif akan ikut dibayar. `payroll_employee_profiles.base_rate` ada tetapi **tidak** tersedia sebagai variabel formula. | Pilihan: (a) jenis komponen baru **rate** (tidak masuk gross, nilainya tersedia di formula sebagai variabel kode komponen), memakai default structure + override cabang P1 dan override per karyawan P2; atau (b) variabel formula `base_rate` dari kompensasi (P2). Rekomendasi (a). Putuskan sebelum P2. |
| 3 | PPh 21 pegawai tidak tetap dengan upah harian / mingguan / per jam memakai **TER harian** (rata-rata sehari ≤ Rp450.000 → 0%, s.d. Rp2.500.000 → 0,5%; di atas itu Pasal 17 atas 50% bruto — **perlu dikonfirmasi tim pajak**, PMK 168/2023). Calculator sekarang selalu memakai TER bulanan, sehingga run mingguan/dua mingguan menghasilkan PPh terlalu kecil. | Fase pajak baru (setelah P4): `employee_tax_profile.employment_tax_status` (`permanent` / `non_permanent`), master `pph21_ter_daily_rates` (berversi, seperti P10), dan variabel jumlah hari berpenghasilan per run untuk rata-rata harian. |
| 4 | Rekonsiliasi Desember (Pasal 17 setahun) tidak berlaku untuk pegawai tidak tetap, tetapi calculator memakai jalur Desember untuk **semua** run berperiode `-12`. Run mingguan Desember (bisa 4–5 run) masing-masing akan direkonsiliasi ulang. | Jalur Desember hanya untuk pegawai tetap, dan hanya pada run regular terakhir masa Desember. Masuk fase pajak di #3. |
| 5 | Plafon BPJS (Kesehatan Rp12 jt, JP Rp10.547.400) adalah **per bulan**, tetapi calculator menerapkan plafon per run. Untuk upah tinggi yang dibayar mingguan, plafon per run terlalu longgar (4 × plafon sebulan). | Plafon dihitung atas akumulasi dasar BPJS dalam masa yang sama (run sebelumnya di bulan pembayaran yang sama ikut dihitung). Masuk P4 atau P5. |
| 6 | Iuran BPJS dilaporkan per bulan, tetapi dihitung per run. Pembulatan per run bisa selisih beberapa rupiah dari perhitungan bulanan BPJS. | Terima selisih pembulatan (didokumentasikan), atau hitung ulang di laporan P13. Rekomendasi: terima, catat di 03-calculation. |
| 7 | `salary_structures.pay_cycle` (P1) dobel dengan schedule (P4). Untuk Dodi dan Eka yang menentukan siklus adalah `sch-weekly` / `sch-biweekly`. | Sesuai diskusi: hapus `pay_cycle` dari structure, cukup `salary_type`; siklus dari schedule. |
| 8 | Satu periode mingguan bisa melintasi dua bulan (W44: 26 Okt – 1 Nov). Variabel absensi diambil dari cutoff periode, jadi benar; tetapi komponen one-time `effective_period = 2026-11` tidak jelas berlaku untuk run mingguan yang mana. | One-time untuk karyawan non-bulanan memakai `period_id` (P4/P6), bukan `YYYY-MM`. |
