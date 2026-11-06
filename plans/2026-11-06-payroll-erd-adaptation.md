<!-- 📁 plans/2026-11-06-payroll-erd-adaptation.md -->
# Rencana: Adaptasi ERD Payroll v2 ke Sistem Existing

| | |
|---|---|
| **Status** | **Rencana — belum dikerjakan.** |
| **Tanggal** | 2026-11-06 |
| **Pemicu** | ERD payroll baru (27 tabel) mendeskripsikan payroll yang lebih lengkap: salary structure, kompensasi berversi, formula berversi, schedule & period, approval berjenjang, dan pembayaran. Sistem payroll sekarang sudah jalan end-to-end, tetapi beberapa bagian masih sederhana (formula tanpa versi, periode hanya string, approval satu langkah, pembayaran hanya flip status) atau masih mock di Backoffice (grade template, adjustment). |
| **Keputusan user** | (1) **Nama tabel existing dipertahankan.** ERD diadaptasi dengan menambah kolom/tabel, bukan rename massal. (2) Semua area ERD masuk cakupan, dikerjakan **bertahap per fase** yang masing-masing bisa di-merge sendiri. Lihat §2. |
| **Modul terdampak** | Payroll (utama), Core HR (contract rekening bank), modul `approval` (consumer baru), Scheduler (opsional, generate periode), Backoffice |
| **Repo terkait** | HR-SYSTEM-API, HR-SYSTEM-BACKOFFICE, HR-SYSTEM-DOCS |
| **Mengubah keputusan** | [modules/payroll/09-grade-templates.md](../modules/payroll/09-grade-templates.md) §7 (grade template → salary structure), [modules/payroll/06-data-model.md](../modules/payroll/06-data-model.md) §2, [modules/payroll/04-payroll-run.md](../modules/payroll/04-payroll-run.md) §2, §4, §6 (period, approval, adjustment run) |

---

## 1. Ringkasan

### 1.1 Kondisi saat ini

| Area | Kondisi | Lokasi |
|---|---|---|
| Komponen gaji | Katalog `pay_components` (earning/deduction, fixed/formula, flag taxable/bpjs_base/one_time). Formula disimpan **langsung** di kolom `formula`, tanpa versi. | `internal/modules/payroll/domain/paycomponent` |
| Assignment ke karyawan | `employee_components` per karyawan (amount, effective_from/to, one-time `single_period`/`until_revoked`). Tidak ada konsep struktur/paket. | `domain/employeecomponent` |
| Profil gaji | `payroll_employee_profiles`: `salary_type`, `pay_cycle`, `employment_type`, `base_rate` — pengganti sementara karena Core HR belum punya grade. | `domain/payrollprofile` |
| Grade template | **Hanya mock** di Backoffice (`grade-templates.vue` via `usePayroll()`), belum ada tabel/API. | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/payroll/` |
| Periode | String `payroll_runs.period` (`YYYY-MM`). Tidak ada schedule, cutoff, atau tanggal bayar per siklus. | `domain/payrollrun/entity/payroll_run.go` |
| Input attendance/leave | Dihitung **live** saat calculate (`periodvars`), tidak di-snapshot → recalculate bisa berubah bila data absensi berubah. | `application/payrollrun/periodvars` |
| Hasil run | `payslips` (gross, BPJS, PPh 21, net, taxable_gross) + `payslip_lines` (code, name, type, amount). Recalculate = hapus & insert ulang. | `domain/payslip` |
| Lifecycle | `draft → calculated → in_review → approved → paid → closed`. | `payroll_run.go` |
| Approval | Maker-checker satu langkah (`approved_by`), escape hatch `PAYROLL_ALLOW_SELF_APPROVAL`. | `application/payrollrun/command/approve_run.go` |
| Pembayaran | `pay` hanya flip status + audit. Bank file = stub (kolom `employee_id`, tanpa nomor rekening). Rekening ada di `employees.bank_accounts` (JSONB, Core HR) tetapi tidak diekspos ke payroll. | `pay_run.go`, `query/bank_file_query.go` |
| Konfigurasi regulasi | `bpjs_config`, `tax_ter_rates`, `pph21_tax_brackets` sudah **berversi** via `effective_from`. `payroll_config` satu baris per tenant. | `domain/payrollconfig` |
| Adjustment & loan | **Hanya mock** di Backoffice (`adjustments.vue`, `loans.vue`). | — |

### 1.2 Target (setelah semua fase)

```
KATALOG & STRUKTUR                         KARYAWAN
pay_components ──< salary_structure_components >── salary_structures
                         │                              │
                         └──< salary_structure_component_formulas
                                   │                    │
payroll_formulas ──< payroll_formula_versions           │
                         └──< payroll_formula_variables │
                                                        │
employee_compensations (berversi) ─────────────────────┘
   └──< employee_components (nilai per versi + one-time)

JADWAL & PERIODE                           RUN
payroll_schedules ──< payroll_schedule_rules
   ├──< employee_payroll_assignments
   └──< payroll_periods ──< payroll_runs ──< payslips ──< payslip_lines
                               │   ▲            ├──< payroll_run_inputs
                               │   └ parent_run_id (adjustment)
                               │                └──< payroll_payments ──< payroll_payment_transactions
                               └──< payroll_payment_batches ──┘
payroll_adjustments ──> payroll_runs (type = adjustment)

APPROVAL (modul approval, generik)
approval_requests (document_type = payroll_run) ──< approval_request_steps ──< approval_actions
```

---

## 2. Keputusan

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Rename tabel mengikuti ERD? | **Tidak.** `pay_components`, `employee_components`, `payroll_runs`, `payslips`, `payslip_lines`, `payroll_config` tetap. Nama ERD dipakai hanya untuk tabel yang benar-benar baru. |
| 2 | Approval payroll pakai tabel sendiri (`payroll_approval_flows/steps`, `payroll_run_approvals`)? | **Tidak.** Payroll run menjadi consumer engine approval generik ([2026-11-05-approval-berjenjang.md](./2026-11-05-approval-berjenjang.md)) dengan `document_type = payroll_run`. Nama `approval_flows` juga sudah dipakai modul leave. |
| 3 | `employee_bank_accounts` milik siapa? | **Core HR** (`employees.bank_accounts`). Payroll membaca lewat contract dan menyimpan **snapshot** rekening di `payroll_payments`, sehingga pembayaran lama tetap bisa diaudit walau rekening diubah. |
| 4 | Override per cabang (doc 09 §3) tidak ada di ERD | **Dipertahankan** sebagai `salary_structure_branch_overrides`. |
| 5 | `payroll_policies` / `payroll_policy_versions` | `payroll_config` = policy. Tarif BPJS/TER/Pasal 17 sudah berversi via `effective_from`, jadi tidak dibuat ulang. `payroll_policy_versions` ditunda (P9, opsional). |
| 6 | Loan / kasbon ([10-loan-deduction.md](../modules/payroll/10-loan-deduction.md)) | Di luar cakupan rencana ini (tidak ada di ERD). Tetap rencana terpisah. |
| 7 | Data lama | Setiap fase menyediakan **backfill** (ditulis tim, dijalankan user) dan jalur **fallback** di kode, sehingga tenant yang belum dimigrasi tetap menghitung seperti sekarang. |

---

## 3. Peta ERD → Sistem

| Domain ERD | Tabel ERD | Status | Di sistem |
|---|---|---|---|
| Salary Component | `salary_components` | Sudah ada | `pay_components` (+`sequence`, `is_active`) |
| Salary Structure | `salary_structures` | Baru | `salary_structures` — menggantikan `salary_grade_templates` di doc 09 §7 |
| Salary Structure Detail | `salary_structure_components` | Baru | `salary_structure_components` (+ tabel tambahan `salary_structure_branch_overrides`) |
| Employee Compensation | `employee_compensations` | Baru | `employee_compensations` (berversi) |
| Employee Compensation Value | `employee_compensation_component_values` | Adaptasi | `employee_components` (+`compensation_id`, `source`) |
| Formula Master | `payroll_formulas` | Baru | `payroll_formulas` |
| Formula Version | `payroll_formula_versions` | Baru | `payroll_formula_versions` |
| Formula Variables | `payroll_formula_variables` | Baru | `payroll_formula_variables` (variabel yang dirujuk tiap versi) |
| Structure Formula Assignment | `salary_structure_component_formulas` | Baru | `salary_structure_component_formulas` |
| Payroll Schedule | `payroll_schedules` | Baru | `payroll_schedules` |
| Schedule Rules | `payroll_schedule_rules` | Baru | `payroll_schedule_rules` |
| Employee Schedule Assignment | `employee_payroll_assignments` | Baru | `employee_payroll_assignments` (menggantikan `payroll_employee_profiles.pay_cycle`) |
| Payroll Period | `payroll_periods` | Baru | `payroll_periods` |
| Payroll Run | `payroll_runs` | Sudah ada | `payroll_runs` (+`period_id`, `parent_run_id`, type `adjustment`) |
| Payroll Run Employee | `payroll_run_employees` | Adaptasi | `payslips` (+`status`, `error_message`, snapshot id) |
| Payroll Input | `payroll_run_inputs` | Baru | `payroll_run_inputs` |
| Payroll Detail | `payroll_run_details` | Adaptasi | `payslip_lines` (+`component_id`, `source`, `formula_version_id`, `sequence`) |
| Approval Flow | `payroll_approval_flows` | Diganti | `approval_policies` (modul `approval`) |
| Approval Steps | `payroll_approval_steps` | Diganti | `approval_policy_steps` |
| Payroll Approvals | `payroll_run_approvals` | Diganti | `approval_requests` / `approval_request_steps` / `approval_actions` |
| Employee Bank Account | `employee_bank_accounts` | Tetap di Core HR | `employees.bank_accounts` via contract |
| Payment Batch | `payroll_payment_batches` | Baru | `payroll_payment_batches` |
| Payment | `payroll_payments` | Baru | `payroll_payments` |
| Payment Transaction | `payroll_payment_transactions` | Baru | `payroll_payment_transactions` |
| Payroll Adjustment | `payroll_adjustments` | Baru | `payroll_adjustments` |
| Payroll Policy | `payroll_policies` | Sudah ada | `payroll_config` (+ `bpjs_config`, `tax_ter_rates`, `pph21_tax_brackets`) |
| Payroll Policy Version | `payroll_policy_versions` | Ditunda | P9 (opsional) |

### 3.1 Aturan relasi

| Relasi ERD | Aturan | Diterapkan sebagai |
|---|---|---|
| `salary_structures` → `salary_structure_components` | Satu structure punya banyak component | FK `structure_id`, UNIQUE `(structure_id, component_id)` |
| `salary_components` → `salary_structure_components` | Satu component dipakai banyak structure | FK `component_id` → `pay_components` |
| `employee_compensations` → `employee_compensation_component_values` | Satu versi kompensasi punya banyak nilai fixed | `employee_components.compensation_id` (nullable; NULL = one-time/manual di luar struktur) |
| `employee_compensations` → `salary_structures` | Setiap kompensasi memakai satu structure | FK `structure_id` NOT NULL |
| `salary_structure_components` → `salary_structure_component_formulas` | Formula per komponen structure berversi per periode berlaku | FK + `effective_from/to`, tanpa overlap |
| `payroll_periods` → `payroll_runs` | Satu periode bisa punya beberapa run (regular, adjustment, THR, …) | `payroll_runs.period_id` |
| `payroll_runs` → `payroll_run_employees` | Satu run menghitung banyak karyawan | `payslips.run_id` (sudah ada) |
| `payroll_run_employees` → `payroll_run_details` | Satu karyawan punya banyak detail komponen | `payslip_lines.payslip_id` (sudah ada) |
| `payroll_run_employees` → `payroll_payments` | Satu hasil payroll bisa dibayar lewat beberapa transaksi | `payroll_payments.payslip_id`, Σ amount = `payslips.net` |

---

## 4. Fase Implementasi

Konvensi yang berlaku di semua fase:

- Semua tabel punya `tenant_id`; FK hanya di dalam modul payroll; `employee_id`/`branch_id` tanpa FK (lintas modul).
- Uang `BIGINT` (rupiah penuh), persen `NUMERIC`. Migrasi `IF NOT EXISTS` + file `down`.
- Migrasi & backfill **ditulis** tim, **dijalankan** user.
- Teks UI Backoffice dalam bahasa Inggris.
- Setiap fase selesai dengan `go build ./... && go test ./internal/modules/payroll/...` hijau dan dokumen modul yang terdampak sudah diperbarui.

### Peta dependensi

```
P1 Salary Structure ──> P2 Employee Compensation ──> P3 Formula Versioning
                                    │
P4 Schedule & Period ──> P5 Run Snapshot ──┬──> P6 Adjustment Run
                                           └──> P8 Bank & Payment
Engine approval (plan 2026-11-05 Fase 1) ──> P7 Approval Berjenjang
P9 Policy Versioning (opsional, lepas)
```

Urutan disarankan: **P1 → P2 → P4 → P5 → P3 → P8 → P6 → P7**. Jalur P1–P2 dan P4–P5 bisa dikerjakan paralel oleh orang berbeda.

---

### P1 — Salary Structure

**Tujuan:** paket komponen gaji per jabatan/level yang bisa dipakai ulang, menggantikan mock grade template.

**Migrasi**

`salary_structures`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id`, `tenant_id` | UUID | |
| `code`, `name` | varchar | UNIQUE `(tenant_id, code)` |
| `salary_type` | varchar | `monthly` / `daily` / `hourly` (sama dengan `payroll_employee_profiles`) |
| `pay_cycle` | varchar | `monthly` / `weekly` / `biweekly` — default untuk karyawan baru, sumber kebenaran tetap schedule (P4) |
| `grade_code` | varchar (nullable) | Merujuk common code `job_grade` (rencana approval Fase 0). Boleh kosong |
| `description` | text | |
| `is_active` | boolean | |
| `created_at`, `updated_at` | timestamptz | |

`salary_structure_components`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id`, `tenant_id`, `structure_id`, `component_id` | UUID | UNIQUE `(structure_id, component_id)` |
| `default_amount` | bigint (nullable) | Hanya untuk komponen `fixed` |
| `is_locked` | boolean | Tidak boleh di-override per karyawan |
| `sequence` | int | Urutan tampil di slip |

`salary_structure_branch_overrides` — `structure_component_id`, `branch_id`, `default_amount`; UNIQUE `(structure_component_id, branch_id)`.

`pay_components` + `sequence INT NOT NULL DEFAULT 0`, `is_active BOOLEAN NOT NULL DEFAULT true`.

**API**

- Domain baru `domain/salarystructure` (entity, constant, repository, service) mengikuti pola `domain/paycomponent`.
- Validasi: komponen harus aktif & satu tenant; `default_amount` hanya untuk `value_type = fixed`; komponen `is_system` (BASIC) wajib ada di structure.
- Endpoint (`payroll:read` / `payroll:config`):
  - `GET/POST /payroll/structures`, `GET/PATCH /payroll/structures/:id`
  - `PUT /payroll/structures/:id/components` (replace-all, satu transaksi)
  - `PUT /payroll/structures/:id/branch-overrides`
  - `GET /payroll/structures/:id/preview?branch_id=` — nilai efektif setelah override cabang
- `pay_components`: endpoint list menerima filter `is_active`.

**Backoffice:** `grade-templates.vue` dihubungkan ke API (tab packages & branch matrix). Tab simulator & assignments menunggu P2.

**Backfill:** tidak ada (fitur baru).

**Docs:** `09-grade-templates.md` (§7 → salary structure), `06-data-model.md`, `05-api-contract.md`.

**Kriteria selesai:** structure bisa dibuat, diisi komponen, di-override per cabang, dan dipreview; mock `salaryGradeTemplates` dihapus dari `usePayroll`.

---

### P2 — Employee Compensation (berversi)

**Tujuan:** setiap perubahan gaji karyawan (promosi, kenaikan) tercatat sebagai versi dengan tanggal berlaku, dan nilai komponennya diambil dari structure.

**Migrasi**

`employee_compensations`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id`, `tenant_id`, `employee_id`, `branch_id` | UUID | `branch_id` menentukan override cabang yang dipakai |
| `structure_id` | UUID FK | |
| `effective_from` | date | |
| `effective_to` | date (nullable) | Diisi otomatis saat versi berikutnya dibuat |
| `status` | varchar | `draft` / `active` / `superseded` |
| `reason` | varchar | `hire` / `promotion` / `adjustment` / `legacy` / … |
| `created_by` | UUID | |

Constraint: tidak boleh ada dua versi `active` yang rentang tanggalnya bertumpuk untuk karyawan yang sama (cek di domain + exclusion constraint `daterange` bila memungkinkan).

`employee_components` + `compensation_id UUID NULL REFERENCES employee_compensations`, `source VARCHAR(20) NOT NULL DEFAULT 'manual'` (`structure` / `override` / `manual`).

- Baris dengan `compensation_id` = nilai komponen recurring versi tersebut.
- Baris dengan `compensation_id` NULL = one-time / manual (perilaku sekarang, tetap berlaku).

**API**

- Domain baru `domain/compensation`.
- Use case:
  - `CreateCompensation` — buat versi baru; versi aktif sebelumnya di-set `effective_to = effective_from - 1` dan `superseded`; generate `employee_components` dengan resolusi nilai **katalog → structure → cabang → override input**; komponen `is_locked` menolak override.
  - `ActivateCompensation` (draft → active), `ListCompensations`, `GetCompensation`.
- `CalculateRunUseCase` (`application/payrollrun/command/calculate_run.go`): ambil versi kompensasi yang berlaku di periode run → komponen dari versi itu + komponen manual/one-time. Karyawan **tanpa** kompensasi → jalur lama (semua `employee_components` aktif).
- `base_rate` di `payroll_employee_profiles` menjadi deprecated: bila karyawan punya kompensasi, nilai BASIC diambil dari kompensasi.
- Endpoint: `GET/POST /payroll/employees/:employeeId/compensations`, `POST .../compensations/:id/activate`.

**Backoffice:** tab assignments & simulator di `grade-templates.vue`; tab Compensation di detail karyawan (riwayat versi).

**Backfill:** satu versi `reason = legacy` per karyawan yang punya `employee_components`, `structure_id` = structure "LEGACY" per tenant yang dibuat backfill, `effective_from` = `MIN(employee_components.effective_from)`; komponen recurring diikat ke versi itu. BASIC dari `base_rate` bila belum ada sebagai komponen.

**Docs:** `09-grade-templates.md` §5, `06-data-model.md`, `05-api-contract.md`, `03-calculation.md` §1 (sumber komponen).

**Kriteria selesai:** hasil calculate untuk data backfill **identik** dengan sebelum backfill; promosi di tengah tahun menghasilkan dua versi tanpa overlap.

---

### P3 — Formula Versioning

**Tujuan:** perubahan formula tidak mengubah hasil periode yang sudah lewat; formula bisa berbeda per structure.

**Migrasi**

- `payroll_formulas` — `code`, `name`, `description`, `is_active`; UNIQUE `(tenant_id, code)`.
- `payroll_formula_versions` — `formula_id`, `version_no`, `expression`, `effective_from`, `status` (`draft` / `published` / `retired`), `published_by`, `published_at`; UNIQUE `(formula_id, version_no)`.
- `payroll_formula_variables` — `version_id`, `variable_name`, `source` (`component` / `attendance` / `leave` / `system`); diisi otomatis saat publish dari hasil parsing.
- `salary_structure_component_formulas` — `structure_component_id`, `formula_version_id`, `effective_from`, `effective_to`.
- `pay_components` + `formula_id UUID NULL`.

**API**

- Domain baru `domain/formula`. Reuse `FormulaEvaluator` dan `DependencyGraph` (`domain/paycomponent/service`) serta validasi `application/paycomponent/command/validate_formula.go`.
- Versi `published` immutable; edit = buat versi baru.
- Resolusi formula saat calculate, untuk periode run:
  1. `salary_structure_component_formulas` yang berlaku (bila karyawan punya kompensasi);
  2. versi `published` terbaru dari `pay_components.formula_id` dengan `effective_from ≤ akhir periode`;
  3. `pay_components.formula` (legacy).
- Cek siklus dependensi memakai `payroll_formula_variables` lintas komponen.
- Variabel sistem tetap konstanta Go (`domain/paycomponent/constant`) + `variablecodegateway`; `payroll_formula_variables` hanya mencatat rujukan.
- Endpoint: `GET/POST /payroll/formulas`, `POST /payroll/formulas/:id/versions`, `POST .../versions/:vid/publish`, `POST .../versions/:vid/validate`.

**Backoffice:** editor formula dengan riwayat versi pada halaman komponen; pilihan formula per komponen di structure.

**Backfill:** setiap `pay_components.formula` non-null → `payroll_formulas` + versi 1 `published`, `effective_from = '2000-01-01'`; isi `pay_components.formula_id`.

**Docs:** `08-formula-engine.md` (§6–§7 + bagian baru "Versioning"), `02-salary-components.md`, `06-data-model.md`.

**Kriteria selesai:** publish formula v2 berlaku mulai periode X; recalculate run periode sebelum X tetap memakai v1.

---

### P4 — Schedule & Period

**Tujuan:** periode gajian sebagai entitas nyata dengan cutoff absensi dan tanggal bayar, mendukung siklus selain bulanan.

**Migrasi**

- `payroll_schedules` — `code`, `name`, `pay_cycle`, `is_default`, `is_active`.
- `payroll_schedule_rules` — `schedule_id`, `period_start_day` (mis. 1 atau 26), `attendance_cutoff_day`, `pay_day`, `pay_day_holiday_shift` (`before` / `after` / `none`), `effective_from`.
- `employee_payroll_assignments` — `employee_id`, `schedule_id`, `effective_from`, `effective_to`; tanpa overlap per karyawan.
- `payroll_periods` — `schedule_id`, `code` (`2026-11`, `2026-W45`), `start_date`, `end_date`, `cutoff_from`, `cutoff_to`, `pay_date`, `status` (`open` / `locked` / `closed`); UNIQUE `(schedule_id, code)`.
- `payroll_runs` + `period_id UUID NULL REFERENCES payroll_periods`. Kolom `period` tetap (kompatibilitas & laporan PPh 21 per bulan).

**API**

- Domain baru `domain/schedule`, `domain/period`.
- `GeneratePeriods(schedule, year)` — endpoint manual; job harian di modul `scheduler` opsional.
- `CreateRunUseCase`: menerima `period_id`; `period` (YYYY-MM) diturunkan dari `pay_date` periode untuk kebutuhan pajak.
- Target karyawan run = karyawan dengan assignment ke schedule periode tersebut (digabung dengan `target_filter` yang ada).
- `periodvars.Open` memakai `cutoff_from/cutoff_to` periode, bukan menurunkan dari string `YYYY-MM`.
- Period `closed` menolak run baru selain `adjustment`.
- `payroll_employee_profiles.pay_cycle` deprecated (dibaca dari schedule).
- Endpoint: `GET/POST/PATCH /payroll/schedules`, `PUT /payroll/schedules/:id/rules`, `POST /payroll/schedules/:id/periods/generate`, `GET /payroll/periods`, `POST /payroll/periods/:id/lock|close`, `PUT /payroll/employees/:employeeId/schedule`.

**Backoffice:** halaman Schedules & Periods; dropdown periode di form buat run.

**Backfill:** schedule `MONTHLY` default per tenant (start day 1, cutoff = akhir bulan); assignment untuk semua karyawan yang punya `payroll_employee_profiles`; satu `payroll_periods` per `payroll_runs.period` distinct; isi `payroll_runs.period_id`.

**Docs:** `04-payroll-run.md` (§5 anatomi run + bagian baru "Schedule & Period"), `06-data-model.md`, `07-integration.md` (cutoff absensi), `05-api-contract.md`.

**Kriteria selesai:** tenant dengan cutoff 26–25 menghasilkan variabel absensi sesuai cutoff; run lama tetap terbaca dengan `period_id` hasil backfill.

---

### P5 — Run Snapshot (run employee, input, detail)

**Tujuan:** hasil run bisa ditelusuri dan direproduksi; kegagalan satu karyawan tidak menggagalkan seluruh run.

**Migrasi**

- `payslips` + `status` (`ok` / `error` / `excluded`), `error_message`, `compensation_id`, `schedule_id`.
- `payslip_lines` + `component_id`, `source` (`fixed` / `formula`), `formula_version_id`, `sequence`.
- `payroll_run_inputs` — `payslip_id` (FK, `ON DELETE CASCADE`), `variable_name`, `value NUMERIC`, `source` (`attendance` / `leave` / `manual`), `note`.

**API**

- `CalculateRunUseCase`:
  - Menyimpan hasil `periodvars` ke `payroll_run_inputs`.
  - Recalculate memakai snapshot input yang ada, kecuali request `refresh_inputs = true`.
  - Error per karyawan (mis. tax profile kosong) → `payslips.status = error` + pesan; run tetap `calculated`. Submit ditolak selama ada payslip `error` yang tidak di-`exclude`.
- Input manual: `PUT /payroll/runs/:id/payslips/:payslipId/inputs` (hanya saat run `calculated`), `POST .../payslips/:payslipId/exclude|include`.
- Slip & detail menampilkan versi formula dan sumber nilai.

**Backoffice:** detail run menampilkan status per karyawan, panel input per karyawan, dan aksi exclude.

**Backfill:** tidak ada (kolom baru nullable/default).

**Docs:** `04-payroll-run.md`, `03-calculation.md` §6 (jejak audit), `06-data-model.md` §2.5–§2.6.

**Kriteria selesai:** mengubah data absensi setelah calculate tidak mengubah hasil recalculate tanpa `refresh_inputs`; run dengan satu karyawan error tetap bisa di-review setelah karyawan itu di-exclude.

---

### P6 — Adjustment Run

**Tujuan:** koreksi run yang sudah `closed` tanpa mengedit angka lama (sesuai prinsip "closed = terkunci").

**Migrasi**

- `payroll_adjustments` — `employee_id`, `component_id`, `amount`, `target_period_id`, `source_run_id` (run yang dikoreksi, nullable), `reason`, `status` (`pending` / `applied` / `cancelled`), `applied_run_id`, `created_by`.
- `payroll_runs` + `parent_run_id UUID NULL`; CHECK type tambah `adjustment`.

**API**

- Adjustment dibuat dengan izin `payroll:run`; status `pending` sampai dikonsumsi.
- Opsi konsumsi: (a) ikut run `regular` periode target berikutnya sebagai komponen tambahan, atau (b) run `adjustment` khusus di periode yang sama (`parent_run_id` → run regular) yang hanya memuat karyawan ber-adjustment.
- PPh 21 run adjustment dihitung atas gabungan penghasilan bulan itu (regular + adjustment), selisihnya yang dipotong.
- Saat run `closed`, adjustment terkait menjadi `applied`.
- Endpoint: `GET/POST /payroll/adjustments`, `POST /payroll/adjustments/:id/cancel`.

**Backoffice:** `adjustments.vue` dihubungkan ke API (mock `overtimeAdjustments` dihapus).

**Backfill:** tidak ada.

**Docs:** `04-payroll-run.md` §3 & §6, `03-calculation.md` (pajak adjustment), `06-data-model.md`.

**Kriteria selesai:** koreksi run closed menghasilkan run adjustment dengan PPh 21 selisih yang benar; run asal tetap tidak berubah.

---

### P7 — Approval Berjenjang

**Tujuan:** approval payroll run multi-level (mis. HR Manager → Finance → Direktur).

**Prasyarat:** engine approval generik selesai ([2026-11-05-approval-berjenjang.md](./2026-11-05-approval-berjenjang.md) Fase 1).

**Migrasi:** tidak ada tabel baru di payroll; seed policy default `document_type = payroll_run` satu step (`approver_type = user` / permission `payroll:approve`) bila diperlukan engine.

**API**

- `SubmitRunUseCase`: selain `calculated → in_review`, membuat `approval_request` (`subject_ref` = `branch_id` run bila ada policy per cabang).
- Approve/reject dilakukan lewat engine; saat request final `approved`, engine memanggil callback payroll → `PayrollRun.Approve`. Reject → run kembali ke `calculated`.
- Maker-checker: pembuat run tidak boleh menjadi approver di step mana pun (`PAYROLL_ALLOW_SELF_APPROVAL` tetap untuk testing lokal).
- Tenant tanpa policy `payroll_run` → perilaku sekarang (satu langkah, izin `payroll:approve`).
- `GET /payroll/runs/:id` menyertakan ringkasan progres approval.

**Backoffice:** timeline approval di detail run; konfigurasi policy di halaman approval generik.

**Docs:** `04-payroll-run.md` §4, `07-integration.md`.

**Kriteria selesai:** policy 1 step = perilaku sekarang; policy 2 step butuh 2 approver berbeda dan tidak bisa dilompati.

---

### P8 — Bank & Payment

**Tujuan:** pembayaran tercatat per karyawan, mendukung split payment, dan bank file berisi rekening nyata.

**Migrasi**

- `payroll_payment_batches` — `run_id`, `method` (`bank_transfer` / `cash` / `other`), `bank_code`, `file_key`, `status` (`draft` / `exported` / `completed` / `cancelled`), `created_by`, `exported_at`.
- `payroll_payments` — `batch_id`, `payslip_id`, `employee_id`, `amount`, `bank_code`, `account_number`, `account_name` (snapshot), `status` (`pending` / `paid` / `failed`), `paid_at`.
- `payroll_payment_transactions` — `payment_id`, `attempt`, `external_ref`, `status`, `proof_key`, `note`, `created_by`, `created_at` (append-only).

**API**

- Contract Core HR baru `ListPrimaryBankAccounts(ctx, tenantID, employeeIDs)` di `core-hr/contract.go`, dikonsumsi lewat `infrastructure/corehrgateway`.
- Alur:
  1. `POST /payroll/runs/:id/payment-batches` (run `approved`) → batch + satu payment per payslip `ok` (default rekening utama; split bisa diatur sebelum export).
  2. `GET .../payment-batches/:batchId/file` → bank file dari batch, disimpan via `internal/shared/storage`, `file_key` dicatat.
  3. `POST .../payments/:paymentId/transactions` → tandai paid/failed, unggah bukti.
  4. Run menjadi `paid` saat semua payment `paid` (atau aksi manual `pay` dengan izin `payroll:approve` seperti sekarang).
- Validasi: Σ `payroll_payments.amount` per payslip = `payslips.net`; karyawan tanpa rekening ditandai di batch (tidak dipalsukan).
- `PayRunUseCase` dan `BankFileQuery` dialihkan ke batch; endpoint lama `GET /runs/:id/bank-file` tetap sebagai alias batch terakhir.
- Belum ada integrasi API bank (host-to-host) — di luar cakupan.

**Backoffice:** tab Payments di detail run (batch, status per karyawan, unggah bukti).

**Backfill:** tidak ada; run lama yang sudah `paid` tidak punya batch (ditampilkan "paid (legacy)").

**Docs:** `04-payroll-run.md` §2, `07-integration.md` (contract rekening), `06-data-model.md`, `05-api-contract.md`.

**Kriteria selesai:** bank file berisi nomor rekening; split payment dua rekening dengan total = net; run berubah `paid` otomatis setelah semua payment lunas.

---

### P9 — Policy Versioning (opsional)

`payroll_policy_versions` — snapshot `payroll_config` per `effective_from`, agar aturan cap potongan yang berlaku pada periode lama bisa diaudit. Dikerjakan bila ada kebutuhan audit nyata.

---

## 5. Dampak ke Kode Existing

| File / area | Fase |
|---|---|
| `internal/modules/payroll/application/payrollrun/command/calculate_run.go` | P2, P3, P4, P5, P6 |
| `application/payrollrun/command/create_run.go`, `resolve_target_employees.go` | P4, P6 |
| `application/payrollrun/command/submit_run.go`, `approve_run.go` | P5, P7 |
| `application/payrollrun/command/pay_run.go`, `query/bank_file_query.go` | P8 |
| `application/payrollrun/periodvars/periodvars.go` | P4, P5 |
| `domain/payrollrun/entity/payroll_run.go`, `domain/payrollrun/constant` | P4, P6, P7 |
| `domain/payslip/entity/*` | P5 |
| `domain/paycomponent/*`, `application/paycomponent/command/validate_formula.go` | P1, P3 |
| `domain/employeecomponent/*` | P2 |
| `module.go`, `seed_defaults.go`, `contract.go` | semua fase |
| `infrastructure/corehrgateway`, `internal/modules/core-hr/contract.go` | P8 |
| Backoffice `app/pages/tenants/payroll/*`, composable `usePayroll`, `types/payroll` | P1, P2, P4–P8 |

---

## 6. Dokumentasi yang Diubah per Fase

| Dokumen | Fase |
|---|---|
| [06-data-model.md](../modules/payroll/06-data-model.md) | semua fase |
| [05-api-contract.md](../modules/payroll/05-api-contract.md) | semua fase |
| [09-grade-templates.md](../modules/payroll/09-grade-templates.md) | P1, P2 |
| [08-formula-engine.md](../modules/payroll/08-formula-engine.md) | P3 |
| [04-payroll-run.md](../modules/payroll/04-payroll-run.md) | P4–P8 |
| [03-calculation.md](../modules/payroll/03-calculation.md) | P2, P5, P6 |
| [07-integration.md](../modules/payroll/07-integration.md) | P4, P7, P8 |

---

## 7. Risiko & Pertanyaan Terbuka

| # | Hal | Catatan |
|---|---|---|
| 1 | Hasil calculate berubah setelah backfill P2/P3 | Wajib test perbandingan sebelum/sesudah backfill pada data tenant nyata (staging). |
| 2 | Run lama tanpa `period_id` | Backfill P4; kode tetap toleran `period_id` NULL. |
| 3 | Karyawan tanpa kompensasi | Jalur lama tetap aktif sampai semua tenant di-backfill; setelah itu bisa diwajibkan. |
| 4 | Siklus `weekly` / `biweekly` | Perlu konfirmasi apakah dibutuhkan sekarang. PPh 21 TER bulanan perlu aturan agregasi untuk siklus mingguan — **pertanyaan terbuka**. |
| 5 | Hubungan structure ↔ `job_grade` | 1:1 (doc 09 §6) atau bebas (banyak structure per grade, mis. beda cabang)? Rencana ini memakai `grade_code` nullable dan **tidak** memaksa 1:1. |
| 6 | Split payment & banyak rekening | Core HR menyimpan banyak rekening; perlu flag rekening utama di Core HR bila belum ada. |
| 7 | Ketergantungan P7 pada engine approval | Bila engine tertunda, P7 ikut tertunda; maker-checker satu langkah tetap berlaku. |

---

## 8. Verifikasi (per fase)

- Unit test domain untuk setiap entity baru, termasuk aturan effective-dating & larangan overlap (pola `*_test.go` yang sudah ada).
- Test `CalculateRunUseCase`: karyawan jalur lama vs jalur kompensasi menghasilkan angka identik untuk data backfill.
- Formula: publish v2 tidak mengubah recalculate periode sebelum `effective_from` v2.
- Period: variabel absensi mengikuti `cutoff_from/cutoff_to`.
- Snapshot: perubahan absensi setelah calculate tidak memengaruhi recalculate tanpa `refresh_inputs`.
- Approval: policy 1 step = perilaku sekarang; pembuat run ditolak sebagai approver.
- Payment: Σ payment per payslip = net; run otomatis `paid`.
- `go build ./... && go test ./internal/modules/payroll/...`, lalu `graphify update .` di HR-SYSTEM-API.
- Migrasi & backfill dijalankan user.
