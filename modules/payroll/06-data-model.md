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
| `is_system` | boolean | Komponen dihitung sistem (BPJS/PPh21) |

### 2.2 `employee_components` (assignment)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `employee_id` | string (FK) | |
| `component_id` | string (FK) | |
| `amount` | int (nullable) | Nilai untuk komponen `fixed` |
| `effective_from` / `effective_to` | date | Masa berlaku |

### 2.3 `employee_tax_profile`
| Field | Tipe | Keterangan |
|---|---|---|
| `employee_id` | string (PK, FK) | |
| `ptkp_status` | enum | `TK/0`, `K/0`, `K/1`, `K/2`, `K/3`, ... |
| `ter_category` | enum | `A` / `B` / `C` (turunan dari PTKP) |
| `has_npwp` | boolean | Memengaruhi tarif |
| `pph21_method` | enum | `nett` / `gross` / `gross_up` |
| `dtp_eligible` | boolean | PPh 21 ditanggung pemerintah |

### 2.4 `payroll_runs`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `run_...` |
| `tenant_id` | string (FK) | |
| `branch_id` | string (FK, nullable) | null = seluruh tenant |
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
| `pph21` | int | |
| `other_deductions` | int | |
| `net` | int | |

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

### 2.8 `bpjs_config` (config, versioned)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `program` | enum | `kesehatan`, `jht`, `jp`, `jkk`, `jkm` |
| `employee_pct` / `employer_pct` | number | Porsi masing-masing |
| `wage_cap` | int (nullable) | Plafon upah (null = tanpa plafon) |
| `risk_class` | string (nullable) | Untuk JKK (tarif per risiko) |
| `effective_from` | date | Versi berlaku |

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
