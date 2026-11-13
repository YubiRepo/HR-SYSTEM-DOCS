<!-- 📁 modules/payroll/06-data-model.md -->
# 06 · Data Model

Entitas milik modul Payroll. `employees` dirujuk dari Core HR. Uang = integer minor unit + currency.

---

## 1. Diagram Relasi

```
  pay_components (katalog) ──< employee_components >── employees (Core HR)
  payroll_runs ──< payslips ──< payslip_lines
  tax_ter_rates (config, versioned)
  bpjs_config   (config, versioned)
  employee_tax_profile (PTKP, NPWP) ── employees
```

---

## 2. Entitas

### 2.1 `pay_components` (katalog, tenant-level)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `paycmp_...` |
| `tenant_id` | string (FK) | |
| `code` | string | mis. `basic`, `trans`, `meal` |
| `name` | string | Nama tampil |
| `type` | enum | `earning` / `deduction` |
| `value_type` | enum | `fixed` / `formula` |
| `formula` | string (nullable) | Rumus bila `formula` |
| `taxable` | boolean | Masuk basis PPh 21 |
| `bpjs_base` | boolean | Masuk dasar iuran BPJS |
| `fixed_recurring` | boolean | Tetap tiap periode |
| `one_time` | boolean | Komponen sekali-pakai (single-period / until-revoked) |
| `one_time_mode` | enum (nullable) | `single_period` / `until_revoked` |
| `is_system` | boolean | Komponen dihitung sistem (BPJS/PPh21) |
| `sequence` | int | Urutan tampil di slip (P1) |
| `type` = `rate` | — | Selain `earning` / `deduction`: nilai yang **tidak dibayar** tetapi dibaca formula lewat kodenya (mis. tarif harian). Selalu `fixed`, tidak taxable, bukan dasar BPJS, bukan one-time; tidak masuk gross, potongan, maupun `payslip_lines` |
| `is_active` | boolean | `false` = tidak bisa ditambahkan ke structure / di-assign baru; assignment lama tetap dihitung (P1) |

### 2.2 `employee_components` (assignment)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `employee_id` | string (FK) | |
| `component_id` | string (FK) | |
| `amount` | int (nullable) | Nilai untuk komponen `fixed` |
| `effective_period` | string (nullable) | Untuk one-time single-period, mis. `2026-03` |
| `revoked_at` | timestamp (nullable) | Untuk one-time until-revoked (null = masih aktif) |
| `effective_from` / `effective_to` | date | Masa berlaku |

### 2.3 `employee_tax_profile`
| Field | Tipe | Keterangan |
|---|---|---|
| `employee_id` | string (PK, FK) | |
| `ptkp_status` | enum | `TK/0`, `K/0`, `K/1`, `K/2`, `K/3`, ... |
| `pph21_method` | enum | `gross` (default) / `nett`. `gross_up` hanya data lama, ditolak saat simpan (P12) |
| `tax_treatment` | enum | `subject` / `dtp` / `exempt` (P11), default `subject` |
| `employment_tax_status` | enum | `permanent` / `non_permanent` (P17), default `permanent`; hanya `permanent` yang direkonsiliasi |

Kategori TER tidak disimpan: selalu dari master `pph21_ptkp_rates` (response API memakai versi hari ini, calculate memakai versi tahun pajak run). `has_npwp` juga tidak disimpan: diturunkan dari NPWP karyawan di Core HR (P15).

> Data payroll per karyawan (P15) = **kompensasi** (`employee_compensations`: structure, cabang, nilai komponen; nanti schedule di P4) + **tax profile** + **kepesertaan BPJS**, ditambah komponen manual / one-time. Tabel `payroll_employee_profiles` sudah dihapus: cabang dari kompensasi, `salary_type` dari structure, jenis kepegawaian dari kontrak aktif Core HR, dan "ikut payroll" = punya versi kompensasi yang berlaku.

### 2.3a `employee_bpjs_enrollments` (P11)
Satu baris per karyawan per program per rentang berlaku. Tidak boleh overlap per (karyawan, program) — divalidasi aplikasi; `PUT` mengganti seluruh baris karyawan dalam satu transaksi.
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (PK) | |
| `tenant_id` / `employee_id` | uuid | |
| `program` | enum | `kesehatan`, `jht`, `jp`, `jkk`, `jkm` |
| `is_enrolled` | boolean | `false` = tidak dipotong dan tidak dibebankan ke perusahaan |
| `membership_number` | string (nullable) | No. KPJ / JKN |
| `risk_class` | string (nullable) | Hanya `jkk`; memilih baris `bpjs_config` dengan kelas sama |
| `wage_base_override` | int (nullable) | Mengganti Σ komponen `bpjs_base`; plafon tetap berlaku |
| `exclusion_reason` | enum (nullable) | `retirement_age` / `spouse_coverage` / `foreign_worker` / `other`, hanya bila tidak ikut |
| `effective_from` / `effective_to` | date | `effective_to` null = berlaku terus |

### 2.4 `payroll_runs`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `run_...` |
| `tenant_id` | string (FK) | |
| `branch_id` | string (FK, nullable) | null = seluruh tenant |
| `target_filter` | json (nullable) | Filter peserta: branch/salary_type/employment_type/employee_ids (P15: `pay_cycle` tidak lagi difilter, diganti schedule P4) |
| `period_id` | uuid (FK, nullable) | Periode payroll (P4) yang dibayar run; null = run off-cycle / sebelum P4 |
| `period` | string | `YYYY-MM` — **masa pajak** (bulan `pay_date` periode bila ada `period_id`) |
| `type` | enum | `regular`, `thr`, `bonus`, `final` |
| `status` | enum | `draft`, `calculated`, `in_review`, `approved`, `paid`, `closed` |
| `pay_date` | date | |
| `created_by` | string | Maker |
| `approved_by` | string (nullable) | Checker |
| `totals` | json | gross, bpjs_ee, bpjs_er, pph21, net, count |

### 2.5 `payslips`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `slip_...` |
| `run_id` | string (FK) | |
| `employee_id` | string (FK) | |
| `status` | enum | `ok` / `error` / `excluded` (P5). Hanya `ok` yang masuk total run, file bank, laporan, YTD pajak, dan slip karyawan |
| `error_message` | text (nullable) | Alasan karyawan tidak bisa dihitung (tetap tersimpan saat di-exclude) |
| `compensation_id` / `schedule_id` | uuid (nullable) | Versi kompensasi & schedule yang dipakai (P5) |
| `gross` | int | |
| `bpjs_employee` | int | |
| `bpjs_employer` | int | |
| `pph21` | int | PPh 21 yang **dipotong** dari karyawan (0 untuk `dtp` / `exempt`) |
| `other_deductions` | int | |
| `net` | int | |
| `taxable_gross` / `bpjs_employee_pph21_base` | int | Dasar rekonsiliasi Desember |
| `pph21_dtp` | int | PPh 21 ditanggung pemerintah — dilaporkan, tidak dipotong (P11) |
| `pph21_employer_borne` | int | PPh 21 ditanggung perusahaan (`nett`) — P12 |
| `pph21_method` | string (nullable) | Metode saat calculate (`gross`/`nett`) — P12 |
| `tax_treatment`, `ptkp_status`, `ter_category`, `ter_rate`, `has_npwp`, `npwp` | snapshot (nullable) | Nilai saat calculate (P11). Null pada slip sebelum P11. `ter_*` null pada slip yang direkonsiliasi dan untuk `exempt` |
| `tax_reconciliation_override` | enum (nullable) | Pilihan HR per karyawan di run: `none` / `year_end` / `termination`; null = ikut run. Bertahan saat hitung ulang (P17) |
| `tax_reconciliation`, `employment_tax_status` | snapshot (nullable) | Rekonsiliasi yang dipakai slip dan status pajak karyawan saat calculate (P17) |
| `tax_note` | text (nullable) | Peringatan rekonsiliasi: pegawai tidak tetap dilewati, rekonsiliasi ulang, atau dibayar TER setelah direkonsiliasi (P17) |
| `bpjs_details` | json (nullable) | Per program: `program`, `institution` (`kesehatan`/`ketenagakerjaan`), `membership_number`, `risk_class`, `base`, `employee_rate`, `employer_rate`, `employee_amount`, `employer_amount` (P11), `employer_taxable` (P12) |

### 2.6 `payslip_lines`
Rincian tiap komponen pada slip (untuk transparansi & audit).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `payslip_id` | string (FK) | |
| `component_code` | string | |
| `name` | string | |
| `type` | enum | `earning` / `deduction` |
| `amount` | int | |
| `component_id` | uuid (nullable) | Pay component (P5) |
| `source` | enum (nullable) | `fixed` / `formula` / `system` (mis. `PPH21_DTP`) — P5 |
| `formula_version_id` | uuid (nullable) | Versi formula yang menghasilkan nilai (P3) |
| `sequence` | int | Urutan di slip (sequence pay component) — P5 |

### 2.6a `payroll_run_inputs` (P5)
Snapshot variabel periode per run per karyawan — dikunci ke `run_id + employee_id` (bukan payslip) agar bertahan saat hitung ulang.
| Field | Tipe | Keterangan |
|---|---|---|
| `run_id` (FK, cascade) / `employee_id` | uuid | |
| `variable_name` | string | Nama variabel formula (mis. `present_days`, `leave_days_annual`) |
| `value` | numeric | |
| `source` | enum | `attendance` / `leave` (snapshot) / `manual` (override HR) |
| `note`, `created_by` | | Catatan input manual |

UNIQUE `(run_id, employee_id, variable_name, source)`; nilai efektif = `manual` bila ada, selain itu snapshot.

### 2.7 `tax_ter_rates` (config, versioned)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `category` | enum | `A` / `B` / `C` |
| `income_from` / `income_to` | int | Rentang bruto bulanan |
| `rate_pct` | number | Tarif efektif |
| `effective_from` | date | Versi berlaku |

### 2.7a `pph21_ptkp_rates` (config, versioned)
Satu baris per status PTKP per versi. Satu versi = semua baris dengan `effective_from` yang sama; calculate memakai versi yang berlaku pada 1 Januari tahun pajak.

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `ptkp_status` | string | `TK/0` … `K/3` (bebas, maks 10 karakter) |
| `annual_amount` | int | PTKP setahun (rekonsiliasi Desember) |
| `ter_category` | enum | `A` / `B` / `C` (tarif TER Jan–Nov) |
| `effective_from` | date | Versi berlaku. UNIQUE `(tenant_id, ptkp_status, effective_from)` |

### 2.7b `pph21_tax_parameters` (config, versioned)
Parameter skalar PPh 21, satu baris per versi (UNIQUE `(tenant_id, effective_from)`).

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `occupational_expense_pct` | number | Biaya jabatan, % bruto setahun |
| `occupational_expense_annual_cap` | int | Batas biaya jabatan setahun |
| `effective_from` | date | Versi berlaku |

### 2.8 `bpjs_config` (config, versioned)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `program` | enum | `kesehatan`, `jht`, `jp`, `jkk`, `jkm` |
| `employee_pct` / `employer_pct` | number | Porsi masing-masing |
| `wage_cap` | int (nullable) | Plafon upah (null = tanpa plafon) |
| `risk_class` | string (nullable) | Untuk JKK: satu baris per kelas risiko. Duplikat dicek per (program, risk_class, effective_from) |
| `effective_from` | date | Versi berlaku — calculate memakai baris terbaru per (program, risk_class) |
| `employer_contribution_taxable` | boolean | Iuran perusahaan masuk bruto PPh 21 (P12) |
| `employee_contribution_deductible` | boolean | Iuran karyawan mengurangi neto rekonsiliasi Desember (P12) |

### 2.9 `employee_loans`
Hutang karyawan (kasbon/pinjaman/cicilan/denda) — lihat `10-loan-deduction.md`.
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `loan_...` |
| `tenant_id` / `branch_id` | string (FK) | |
| `employee_id` | string (FK) | |
| `type` | enum | `cash_advance`/`loan`/`installment`/`penalty` |
| `principal` | int | Pokok |
| `installment_amount` | int | Cicilan per periode |
| `installment_type` | enum | `fixed`/`percentage` |
| `outstanding` | int | Sisa berjalan (auto-stop saat 0) |
| `start_period` | string | mis. `2026-02` |
| `status` | enum | `active`/`paid_off`/`cancelled` |
| `approved_by` | string | Audit |

### 2.10 `loan_deductions`
Jejak potong pinjaman per periode.
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `loan_id` | string (FK) | |
| `payroll_run_id` | string (FK) | |
| `period` | string | |
| `amount` | int | Dipotong periode ini |
| `outstanding_after` | int | Sisa setelah potong |

### 2.11 `payroll_config` (config per tenant)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string (FK) | |
| `max_deduction_percent` | number (nullable) | **Cap potongan** (mis. 30% gaji bersih) — configurable |
| `deduction_cap_base` | enum | `net`/`basic` — basis perhitungan cap |
| `on_cap_exceed` | enum | `reduce_installment` / `force` — perilaku bila cicilan lewat cap |
| `default_bpjs_programs` | json array (nullable) | Program yang diikuti karyawan baru (null = semua) — P11 |
| `default_jkk_risk_class` | string (nullable) | Kelas risiko JKK bila kepesertaan karyawan tidak mengisinya — P11 |

---

### 2.12 `salary_structures` (P1)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` / `tenant_id` | uuid | |
| `code` / `name` | string | `code` unik per tenant, disimpan huruf besar |
| `salary_type` | enum | `monthly` / `daily` / `hourly` |
| `job_grade_id` | uuid (nullable) | Job grade Core HR (tanpa FK lintas modul) |
| `description` | text (nullable) | |
| `is_active` | boolean | |

`salary_structure_components`: `structure_id`, `component_id` (UNIQUE bersama), `default_amount` (nullable, hanya komponen `fixed`), `is_locked`, `sequence`.

`salary_structure_branch_overrides`: `structure_component_id`, `branch_id` (UNIQUE bersama), `default_amount`.

### 2.13 `employee_compensations` (P2)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` / `tenant_id` / `employee_id` | uuid | |
| `branch_id` | uuid | Cabang yang override-nya dipakai |
| `structure_id` | uuid (FK) | `salary_structures` |
| `schedule_id` | uuid (FK, nullable) | `payroll_schedules` (P4); null = schedule default tenant. Ganti schedule = versi baru |
| `effective_from` / `effective_to` | date | `effective_to` diisi saat versi berikutnya diaktifkan |
| `status` | enum | `draft` / `active` / `superseded` |
| `reason` | enum | `hire` / `promotion` / `adjustment` / `transfer` / `legacy` / `other` |
| `notes`, `created_by`, `activated_at` | | |

`employee_components` + `compensation_id` (nullable, FK, `ON DELETE CASCADE` — baris draft ikut terhapus) dan `source` (`structure` / `override` / `manual`). `compensation_id` NULL = komponen manual / one-time.

### 2.13a `payroll_schedules` / `payroll_schedule_rules` / `payroll_periods` (P4)
**`payroll_schedules`**: `code` (unik per tenant), `name`, `pay_cycle` (`monthly` / `weekly` / `biweekly` / `custom`), `is_default` (tepat satu per tenant), `is_active`.

**`payroll_schedule_rules`** (berversi `effective_from`, unik per schedule):

| Bentuk | Field | Keterangan |
|---|---|---|
| Bulanan | `period_start_day` | 1 = bulan kalender; 26 = tgl 26 bulan lalu s.d. 25 |
| | `attendance_cutoff_day` | null = sama dengan periode; mis. 25 = absensi 26 bulan lalu s.d. 25 |
| | `pay_day` | Tanggal bayar dalam bulan periode (dipotong ke akhir bulan) |
| Berbasis hari | `period_anchor_date`, `period_length_days` | Periode = anchor + k × panjang (7 / 14 / N) |
| | `cutoff_offset_days` | Geser jendela absensi terhadap periode |
| | `pay_offset_days` | Hari setelah periode berakhir |
| Keduanya | `pay_day_holiday_shift` | `before` / `after` / `none` — geser dari Sabtu/Minggu & libur nasional tenant (Attendance, `is_observed`, tanpa cabang) |

**`payroll_periods`**: `schedule_id`, `code` (`2026-11`, `2026-W45`, `2026-B22`, `2026-P007`), `start_date`, `end_date`, `cutoff_from`, `cutoff_to`, `pay_date`, `status` (`open` → `locked` → `closed`); UNIQUE `(schedule_id, code)`. Masa pajak = bulan `pay_date`.

### 2.13b `payroll_payment_batches` / `payroll_payments` / `payroll_payment_transactions` (P8)
- **Batch:** `run_id`, `method` (`bank_transfer` / `cash` / `other`), `bank_code` (opsional, satu file per bank), `status` (`draft` → `exported` → `completed`; `cancelled`), `note`, `created_by`, `exported_at`, `completed_at`.
- **Payment:** `batch_id`, `payslip_id`, `employee_id`, `amount`, snapshot rekening (`bank_code`, `account_number`, `account_name`), `status` (`pending` / `paid` / `failed`), `paid_at`. Split = beberapa payment per payslip, Σ = net.
- **Transaction (append-only):** `payment_id`, `attempt`, `status` (`paid` / `failed`), `external_ref`, `note`, `created_by`.

### 2.14 `payroll_formulas` / `payroll_formula_versions` / `payroll_formula_variables` (P3)
| Tabel | Field utama |
|---|---|
| `payroll_formulas` | `code` (unik per tenant, A-Z0-9_), `name`, `description`, `is_active` |
| `payroll_formula_versions` | `formula_id`, `version_no` (unik per formula), `expression`, `effective_from` (unik per formula untuk yang published), `status` `draft` / `published`, `notes`, `created_by`, `published_by`, `published_at` |
| `payroll_formula_variables` | `version_id`, `variable_name`, `source` — dicatat saat publish |

Kolom baru: `pay_components.formula_id`, `salary_structure_components.formula_id` (override formula di structure), `payslip_lines.formula_version_id`.

## 3. Indeks

| Tabel | Indeks | Alasan |
|---|---|---|
| `payroll_runs` | `(tenant_id, period)`, `status` | Lookup & filter |
| `payslips` | `run_id`, `employee_id` | Rakit run & slip karyawan |
| `employee_components` | `employee_id` | Rakit gaji karyawan |
| `tax_ter_rates` | `(category, effective_from)` | Lookup tarif |
| `bpjs_config` | `(program, effective_from)` | Lookup tarif/plafon |

---

## 4. Catatan Desain

- **Config versioned:** `tax_ter_rates` & `bpjs_config` menyimpan `effective_from` agar run periode lama tetap memakai tarif yang benar saat itu (reproducible).
- **Snapshot slip:** `payslip_lines` menyimpan nilai hasil hitung (bukan hanya rujukan), sehingga slip yang sudah closed tidak berubah walau komponen/tarif diperbarui kemudian.
- **Uang** integer minor unit + currency.
- **Audit:** run closed bersifat read-only; koreksi lewat run berikutnya.