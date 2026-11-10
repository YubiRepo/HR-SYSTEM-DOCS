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
| `ter_category` | enum | `A` / `B` / `C` — cache tampilan, diisi dari master `pph21_ptkp_rates` saat simpan. Calculate selalu membaca ulang dari master tahun pajak run |
| `has_npwp` | boolean | Cache dari NPWP Core HR saat simpan (P11); calculate membaca Core HR langsung |
| `pph21_method` | enum | `gross` (default) / `nett`. `gross_up` hanya data lama, ditolak saat simpan (P12) |
| `tax_treatment` | enum | `subject` / `dtp` / `exempt` (P11), default `subject` |
| `dtp_eligible` | boolean | **Deprecated** — disinkronkan dengan `tax_treatment = dtp`, tidak dibaca lagi |

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
| `target_filter` | json (nullable) | Filter peserta: grade/dept/salary_type/employment_type/pay_cycle/employee_ids |
| `period` | string | `YYYY-MM` |
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
| `tax_treatment`, `ptkp_status`, `ter_category`, `ter_rate`, `has_npwp`, `npwp` | snapshot (nullable) | Nilai saat calculate (P11). Null pada slip sebelum P11. `ter_*` null di Desember dan untuk `exempt` |
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