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
| **Lampiran** | [2026-11-10-payroll-erd-simulasi-satu-periode.md](./2026-11-10-payroll-erd-simulasi-satu-periode.md) — contoh isi data semua tabel untuk satu periode payroll |
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
| Employee Schedule Assignment | `employee_payroll_assignments` | Adaptasi | `employee_compensations.schedule_id` (P15/P4): schedule ikut versi kompensasi |
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
| *(tidak ada di ERD)* | — | Baru | `employee_bpjs_enrollments` + `employee_tax_profile.tax_treatment` (P11). Saat ini semua karyawan otomatis ikut semua program BPJS dan tidak ada opsi bukan subjek PPh 21. |
| *(tidak ada di ERD)* | — | Baru | `pph21_ptkp_rates`, `pph21_tax_parameters` (P10). Saat ini nominal PTKP, daftar status PTKP, mapping PTKP → kategori TER, dan biaya jabatan masih konstanta Go. |

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
P10 Master PTKP & Parameter Pajak (lepas, tanpa dependensi) ──> P11 Kepesertaan BPJS & Perlakuan Pajak ──> P12 Metode PPh 21 ──> P13 Laporan Setoran BPJS & PPh 21
                                                                    (P4, P6 memperbaiki pengelompokan periode P13)
P2 Employee Compensation ──> P15 Konsolidasi Data Payroll Karyawan ──> P4 Schedule & Period ──> P14 PPh 21 Pegawai Tidak Tetap & Rekonsiliasi Desember Selektif ──> P16 Masa Pajak Terakhir & Data Pajak Tahunan Karyawan
```

Urutan disarankan (diperbarui 2026-11-11): **P10 → P11 → P12 → P13 → P1 → P2 → P3 → P15 → P4 → P5 → P5a → P14 → P16 → P8 → P6 → P7**. P5 didahulukan dari P14/P16 (keputusan user 2026-11-11) selama menunggu jawaban tim pajak (§8a). P3 dikerjakan lebih awal atas keputusan user. P15 merapikan data payroll karyawan (hapus payroll profile, schedule ikut kompensasi) sebelum P4 menambah schedule. P14 (PPh 21 pegawai tidak tetap & rekonsiliasi Desember selektif) butuh schedule non-bulanan dari P4. P16 (masa pajak terakhir selain Desember, karyawan masuk di tengah tahun, penyetahunan, bukti potong pemberi kerja sebelumnya) memperluas jalur rekonsiliasi P14; P14 dan P16 sama-sama menunggu konfirmasi tim pajak.

---

### P1 — Salary Structure

**Status:** selesai dikerjakan 2026-11-11, menunggu review. Migrasi `20261111000001_create_salary_structures` ditulis, **belum dijalankan**. Tidak ada backfill. Catatan implementasi:

- `grade_code` diganti `job_grade_id` (UUID): job grade sekarang entity Core HR (`job_grades`), bukan common code. Divalidasi lewat contract Core HR `GetJobGradeNames`.
- Aturan "komponen sistem BASIC wajib ada" **tidak** diterapkan: belum ada komponen sistem BASIC di katalog. Diganti: structure wajib punya minimal satu komponen earning.
- Halaman baru `hr-setting/salary-structures` (daftar) dan `hr-setting/salary-structures/[id]` (tab Details, Components, Branch Overrides, Preview), sesuai §5.1 — bukan menghubungkan `grade-templates.vue`. Mock `payroll/grade-templates.vue` dan `salaryGradeTemplates` di `usePayroll` dihapus.
- `pay_components.is_active = false`: tidak bisa ditambahkan ke structure atau di-assign baru; assignment lama tetap dihitung calculator (calculator belum memfilter `is_active`).
- `PUT .../components` meng-upsert per komponen sehingga override cabang komponen yang dipertahankan tidak hilang.

**Tindak lanjut review 2026-11-11 (disepakati, sudah dikerjakan 2026-11-11 — migrasi `20261111000002_rate_components_and_structure_cleanup`, belum dijalankan)** — dari simulasi non-bulanan ([lampiran §11](./2026-11-10-payroll-erd-simulasi-satu-periode.md)):

- **Hapus `salary_structures.pay_cycle`.** Siklus pembayaran ditentukan schedule (P4); structure cukup menyimpan `salary_type` (monthly / daily / hourly) sebagai sifat paket, yang di P2 disalin ke profil karyawan.
- **Jenis komponen `rate`** (`pay_components.type = rate`): nilai yang **tidak dibayar** (tidak masuk gross, potongan, maupun payslip) tetapi bisa dibaca formula lewat kodenya. Contoh: `RATE_HARIAN` 170.000 → `UPAH_HARIAN = RATE_HARIAN * present_days`; `RATE_JAM` 75.000 → `UPAH_JAM = RATE_JAM * actual_work_minutes / 60`.
  - Selalu `value_type = fixed`, tidak taxable, bukan dasar BPJS, bukan one-time.
  - Default di structure, bisa di-override per cabang (P1), dan per karyawan lewat kompensasi (P2) bila tidak di-lock.
  - Calculator memasukkan nilainya ke kamus variabel formula, tetapi tidak ke komponen yang dihitung dan tidak ke `payslip_lines`.
  - Preview structure menampilkan rate tanpa menjumlahkannya ke total earning/deduction.
  - Migrasi: ubah CHECK `pay_components.type` menjadi `earning` / `deduction` / `rate`; drop `salary_structures.pay_cycle`.

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

**Status:** selesai dikerjakan 2026-11-11, menunggu review. Migrasi `20261111000003_create_employee_compensations` dan backfill `backfill_legacy_compensations_for_tenant` (`20261111090000`) ditulis, **belum dijalankan**. Catatan implementasi:

- Calculator memilih versi yang berlaku pada **hari terakhir periode** run; pergantian versi di tengah periode **belum diprorata** (catatan untuk P4/P5).
- Satu draft per karyawan; versi baru wajib mulai setelah versi aktif. Aktivasi butuh payroll profile (jenis kepegawaian) yang sudah ada, lalu menyalin cabang & `salary_type` structure ke profil, dan membuat kepesertaan BPJS default bila belum ada (limpahan P11).
- Aktivasi pertama mengakhiri baris manual lama untuk komponen yang sama (hindari bayar dobel). Revoke baris yang berasal dari kompensasi ditolak.
- Backfill LEGACY: `base_rate` → BASIC **tidak** dikerjakan (calculator memang tidak memakai `base_rate`). Karyawan tanpa payroll profile dilewati dan dicatat di log.
- Backoffice: menu **Salary › Compensations** (list + bulk assign structure) dan detail per karyawan; komponen bersama `PayrollEmployeePanel` (sub-tab Compensation + Payroll Profile, Pay Components manual, Tax & BPJS, Payslips) juga dipasang sebagai tab **Payroll** di Employee Info (butuh fitur payroll + `payroll:read`). Halaman `salary/employees.vue` dihapus.
- Limpahan P11: `POST /payroll/bpjs-enrollments/bulk` dan filter "BPJS belum lengkap" selesai; bulk BPJS **belum ada UI**.
- Endpoint baru `GET /payroll/employees/{id}/payslips` untuk sub-tab Payslips.
- Simulator gaji per structure tidak dibuat terpisah; Preview structure (P1) dipakai.

> **Limpahan dari P11:** endpoint `POST /payroll/bpjs-enrollments/bulk` (mis. set kelas risiko JKK satu cabang), filter "BPJS belum lengkap" di menu Compensations, dan pemindahan form tax profile + kepesertaan BPJS dari `salary/employees.vue` ke sub-tab Payroll › Tax & BPJS (`PayrollEmployeePanel`). Enrollment awal juga dibuat saat karyawan pertama kali punya kompensasi.

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
- `GET /payroll/compensations` (`payroll:read`) — list berbasis karyawan untuk menu Compensations: semua karyawan aktif (nama, nomor, cabang via contract Core HR, bukan `employees:read`) + versi kompensasi aktif, flag `has_tax_profile`; filter `structure_id`, `branch_id`, `status`, `missing=compensation|tax_profile`. `POST /payroll/compensations/bulk` untuk bulk assign / kenaikan (membuat versi `draft`).

**Backoffice:** tab assignments & simulator di `grade-templates.vue`; sub-tab **Payroll › Compensation** dan **Pay Components** di Employee Info (§5.3).

**Backfill:** satu versi `reason = legacy` per karyawan yang punya `employee_components`, `structure_id` = structure "LEGACY" per tenant yang dibuat backfill, `effective_from` = `MIN(employee_components.effective_from)`; komponen recurring diikat ke versi itu. BASIC dari `base_rate` bila belum ada sebagai komponen.

**Docs:** `09-grade-templates.md` §5, `06-data-model.md`, `05-api-contract.md`, `03-calculation.md` §1 (sumber komponen).

**Kriteria selesai:** hasil calculate untuk data backfill **identik** dengan sebelum backfill; promosi di tengah tahun menghasilkan dua versi tanpa overlap.

---

### P3 — Formula Versioning

**Status:** selesai dikerjakan 2026-11-11 (dikerjakan sebelum P4 atas keputusan user), menunggu review. Migrasi `20261111000004_create_payroll_formulas` dan backfill `backfill_formulas_for_tenant` (`20261111090001`) ditulis, **belum dijalankan**. Catatan implementasi:

- `salary_structure_component_formulas` **tidak** dibuat: override formula per structure cukup `salary_structure_components.formula_id`, karena waktu berlakunya sudah diatur oleh versi formula.
- Status `retired` tidak dipakai: draft bisa dihapus, published tidak bisa diubah/dihapus, timeline published hanya maju (versi baru wajib mulai setelah versi published terakhir).
- `payslip_lines.formula_version_id` (rencana P5) sudah ditambahkan sekarang.
- Edit formula lewat komponen = versi baru mulai `formula_effective_from` (default hari ini); komponen formula baru otomatis punya formula sendiri (v1 dari 2000-01-01).
- Validasi publish & editor: kompilasi + cek siklus di katalog **dan** di setiap structure yang punya override.
- Tidak ada menu Formulas terpisah: editor ada di Salary Component (validasi live, sisip variabel/operator/fungsi, "Try it", riwayat versi) dan override + buat formula baru di tab Components salary structure. Mock `FormulaStudio.vue` dihapus.
- Backfill: formula lama yang sekarang tidak lolos validasi tetap dimigrasi apa adanya dan dicatat di log.

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

### P15 — Konsolidasi Data Payroll Karyawan

**Status:** selesai dikerjakan 2026-11-11, menunggu review. Migrasi `20261111000005_drop_payroll_employee_profiles` ditulis, **belum dijalankan**. Tidak ada backfill (data di-fresh). Catatan implementasi:
- Core HR: contract baru `GetActiveContractTypes`; sinkronisasi cabang ke payroll saat mutasi (`PayrollBranchSyncer` / `SyncEmployeeBranch`) dihapus — cabang payroll kini hanya dari versi kompensasi.
- Backfill `backfill_bpjs_enrollments_for_tenant` (`20261110090002`) dan `backfill_legacy_compensations_for_tenant` (`20261111090000`) dihapus dari kode & registry. Bila sudah tercatat di tabel backfill DB, catatannya tidak berpengaruh.
- Peserta run: versi kompensasi non-draft yang berlaku di hari terakhir periode; `employee_ids` yang tidak punya kompensasi membuat run gagal (`BUSINESS_RULE_VIOLATED`). `pay_cycle` di `target_filter` masih diterima API tetapi diabaikan (dipakai ulang / diganti schedule di P4); form run Backoffice tidak lagi mengirimnya.
- Akses payslip scope cabang & nama cabang di PDF slip memakai cabang karyawan **saat ini** di Core HR.
- Daftar Compensations menambah kolom `employment_type` (kode kontrak aktif Core HR).
- `SalaryType*` konstanta pindah ke `domain/salarystructure/constant`.

Dikerjakan **sebelum P4**. Data akan di-fresh, jadi tidak perlu kompatibilitas dengan data lama (tanpa backfill).

**Masalah:** informasi payroll yang melekat pada karyawan tersebar dan sebagian dobel:

| Data | Tempat sekarang |
|---|---|
| Cabang | Core HR, `payroll_employee_profiles.branch_id`, `employee_compensations.branch_id` |
| Salary type | `payroll_employee_profiles.salary_type`, `salary_structures.salary_type` |
| Pay cycle | `payroll_employee_profiles.pay_cycle`, (rencana P4) schedule |
| Employment type | `payroll_employee_profiles.employment_type` (input ulang), Core HR kontrak |
| Base rate | `payroll_employee_profiles.base_rate` (tidak dipakai calculator) |
| Ikut payroll | ada/tidaknya `payroll_employee_profiles` |
| TER category, has NPWP | cache di `employee_tax_profiles` (sumber: master PTKP, Core HR) |

**Prinsip:** fakta kepegawaian milik **Core HR** dan tidak disalin; fakta gaji milik **payroll**; yang berubah dari waktu ke waktu disimpan **berversi di satu tempat**.

**Model akhir — data payroll karyawan = 3 hal** (+ komponen manual / one-time di luar structure, seperti sekarang):

| # | Data | Isi | Versi |
|---|---|---|---|
| 1 | **Kompensasi** (`employee_compensations`) | structure, cabang (pemilih override tarif; default cabang Core HR), **schedule** (P4), nilai komponen | Ya — promosi, mutasi, ganti siklus bayar = versi baru |
| 2 | **Pajak** (`employee_tax_profiles`) | PTKP, metode PPh 21, perlakuan pajak, (P14) status pegawai tetap/tidak tetap | Tidak — riwayat ada di snapshot payslip (P11) |
| 3 | **BPJS** (`employee_bpjs_enrollments`) | kepesertaan per program | Ya, per program |

**Yang dihapus**

- Tabel **`payroll_employee_profiles`** beserta subdomain `payrollprofile` (domain, application, HTTP `GET/PUT /payroll/employees/:id/profile`, composable & form Backoffice).
  - Cabang → kompensasi. Salary type → structure. Pay cycle → schedule (P4). Base rate → komponen `rate` (P1).
  - Employment type → **kontrak aktif di Core HR** (jenis kontrak, common code `contract_type`); butuh method contract Core HR baru, mis. `GetActiveContractTypes(ctx, tenantID, employeeIDs) map[employeeID]contractType`.
  - "Ikut payroll" → punya versi kompensasi yang berlaku.
- `employee_tax_profiles`: kolom `ter_category` (selalu dari master PTKP), `has_npwp` (selalu dari Core HR) dan `dtp_eligible` dihapus.
- Rencana P4 **`employee_payroll_assignments` tidak dibuat**: schedule menjadi kolom `employee_compensations.schedule_id` (diisi di P4).

**API**

- **Peserta run** (`resolveTargetEmployees`) ditulis ulang: karyawan yang punya versi kompensasi (bukan draft) berlaku pada hari terakhir periode run; filter `target_filter` tetap jalan dengan sumber baru — `branch_id` dari kompensasi, `salary_type` dari structure, `employment_type` dari kontrak Core HR, `pay_cycle` dihapus dari filter (diganti schedule di P4). Karyawan tanpa kompensasi **tidak ikut** run (jalur pra-P2 dihapus).
- **Calculator**: jalur "karyawan tanpa kompensasi = semua komponen manual" dihapus; komponen manual tetap dihitung bersama versi kompensasi.
- **Aktivasi kompensasi** tidak lagi butuh / menyalin payroll profile.
- Pengguna lain `payroll_employee_profiles` disesuaikan: daftar Compensations (`has_payroll_profile` dihapus), backfill/ensure BPJS (kandidat = karyawan dengan kompensasi), backfill LEGACY P2 (dihapus — data di-fresh), slip PDF/payslip query bila memakai profil untuk cabang.
- Tax profile response: `ter_category` dan `has_npwp` dihitung saat dibaca.
- Migrasi: drop `payroll_employee_profiles`; drop kolom `ter_category`, `has_npwp`, `dtp_eligible` di `employee_tax_profiles`. Backfill yang mengacu payroll profile (P11 enrollment, P2 legacy) dihapus dari registry.

**Backoffice**

- Panel karyawan (`PayrollEmployeePanel`): sub-tab **Compensation** tanpa form Payroll Profile; employment type tampil read-only dari Core HR.
- Menu Compensations: filter "No payroll profile" dihapus (P4 menambah "No schedule").
- Form buat run: filter pay cycle dihapus.

**Docs:** `06-data-model.md` (hapus §2 payroll profile, ubah §2.3), `04-payroll-run.md` (peserta run), `07-integration.md` (employment type dari Core HR), `05-api-contract.md`.

**Kriteria selesai:** tidak ada lagi tabel / endpoint payroll profile; run hanya menghitung karyawan dengan kompensasi berlaku; filter cabang / salary type / employment type run tetap benar; tidak ada data karyawan yang diinput di dua tempat.

---

### P4 — Schedule & Period

**Status:** selesai dikerjakan 2026-11-11, menunggu review. Migrasi `20261111000006_create_payroll_schedules_and_periods` dan backfill `seed_payroll_schedule_for_tenant` (`20261111090002`) ditulis, **belum dijalankan**. Catatan implementasi:
- Schedule, aturan dan periode satu subdomain `domain/schedule` (bukan `domain/schedule` + `domain/period` terpisah). Pay cycle: `monthly`, `weekly` (7 hari), `biweekly` (14), `custom` (N hari); tidak bisa diubah setelah dibuat.
- Aturan bulanan: tanggal bayar adalah tanggal di bulan periode (belum bisa "tgl 1 bulan berikutnya"). Aturan yang dipakai = versi yang berlaku tgl 1 bulan kode periode (bulanan) / tanggal mulai periode (berbasis hari).
- Geser tanggal bayar: Sabtu/Minggu + libur `is_observed` tanpa cabang dari Attendance (contract baru `ObservedHolidayDates`).
- Generate idempoten: periode baru dibuat; `open` tanpa run diperbarui mengikuti aturan terbaru; `locked`/`closed`/terpakai run dibiarkan.
- Status periode `open` → `locked` (bisa `reopen`) → `closed`. `locked`: absensi dalam jendela cutoff dibekukan (`IsPeriodLocked`), run tetap bisa dihitung. `closed`: run baru ditolak dan run draft di periode itu tidak bisa dihitung. Belum ada tipe run `adjustment` (P6), jadi pengecualian "selain adjustment" belum berlaku.
- `IsPeriodLocked` belum tahu schedule karyawan (signature hanya cabang): periode locked/closed schedule **mana pun** membekukan tanggal di cutoff-nya.
- Run regular wajib `period_id` (off-cycle boleh tanpa). Komponen recurring dinilai terhadap `start_date..end_date` periode; komponen one-time `single_period` masih dicocokkan dengan masa pajak (`YYYY-MM`), sehingga untuk schedule mingguan ikut di setiap run masa itu — diselesaikan di P6.
- **Plafon BPJS bulanan dikerjakan** (usulan di atas): `wage_cap` dikurangi dasar BPJS karyawan di run lain (status non-draft) pada masa pajak yang sama, berlaku untuk semua tipe run.
- Seed tenant: schedule `MONTHLY` default (bulan kalender, cutoff = akhir periode, bayar hari kerja terakhir bulan) + periode tahun berjalan.

**Tujuan:** periode gajian sebagai entitas nyata dengan cutoff absensi dan tanggal bayar, mendukung siklus selain bulanan.

**Migrasi**

- `payroll_schedules` — `code`, `name`, `pay_cycle`, `is_default`, `is_active`.
- `payroll_schedule_rules` — `schedule_id`, `period_start_day` (mis. 1 atau 26), `attendance_cutoff_day`, `pay_day`, `pay_day_holiday_shift` (`before` / `after` / `none`), `effective_from`.
- ~~`employee_payroll_assignments`~~ (diganti P15): `employee_compensations` + `schedule_id UUID REFERENCES payroll_schedules` — ganti schedule = versi kompensasi baru.
- `payroll_periods` — `schedule_id`, `code` (`2026-11`, `2026-W45`), `start_date`, `end_date`, `cutoff_from`, `cutoff_to`, `pay_date`, `status` (`open` / `locked` / `closed`); UNIQUE `(schedule_id, code)`.
- `payroll_runs` + `period_id UUID NULL REFERENCES payroll_periods`. Kolom `period` tetap (kompatibilitas & laporan PPh 21 per bulan).

**API**

- Domain baru `domain/schedule`, `domain/period`.
- `GeneratePeriods(schedule, year)` — endpoint manual; job harian di modul `scheduler` opsional.
- `CreateRunUseCase`: menerima `period_id`; `period` (YYYY-MM) diturunkan dari `pay_date` periode untuk kebutuhan pajak.
- Target karyawan run = karyawan yang versi kompensasinya (berlaku di akhir periode) memakai schedule periode tersebut (digabung dengan `target_filter` yang ada; lihat P15).
- `periodvars.Open` memakai `cutoff_from/cutoff_to` periode, bukan menurunkan dari string `YYYY-MM`.
- Period `closed` menolak run baru selain `adjustment`.
- Endpoint: `GET/POST/PATCH /payroll/schedules`, `PUT /payroll/schedules/:id/rules`, `POST /payroll/schedules/:id/periods/generate`, `GET /payroll/periods`, `POST /payroll/periods/:id/lock|close`. Schedule karyawan diisi lewat versi kompensasi (`schedule_id` di `POST /payroll/employees/:id/compensations` dan bulk).

**Backoffice:** halaman Schedules & Periods; dropdown periode di form buat run; field schedule di sub-tab **Payroll › Compensation** Employee Info (§5.3).

**Seed / backfill:** schedule `MONTHLY` default per tenant (start day 1, cutoff = akhir bulan) di seed tenant baru; kompensasi tanpa schedule memakai schedule default tenant. Data di-fresh, sehingga backfill periode untuk run lama tidak diperlukan.

**Docs:** `04-payroll-run.md` (§5 anatomi run + bagian baru "Schedule & Period"), `06-data-model.md`, `07-integration.md` (cutoff absensi), `05-api-contract.md`.

**Dukungan siklus non-bulanan (disepakati review 2026-11-11):** sistem harus mendukung karyawan yang dibayar harian / per jam dengan pembayaran mingguan, dua mingguan, dan seterusnya. Simulasi: [lampiran §11](./2026-11-10-payroll-erd-simulasi-satu-periode.md).

- `payroll_schedule_rules` punya dua bentuk aturan sesuai `pay_cycle` schedule:
  - **Bulanan** (seperti di atas): `period_start_day`, `attendance_cutoff_day`, `pay_day` (tanggal dalam bulan).
  - **Berbasis hari** (`weekly`, `biweekly`, dan siklus N-hari lain): `period_anchor_date` (tanggal mulai periode pertama), `period_length_days` (7 / 14 / …), `cutoff_offset_days` (geser cutoff absensi terhadap periode; 0 = sama), `pay_offset_days` (hari setelah periode berakhir, mis. 3 = Rabu untuk periode Senin–Minggu).
  - `pay_day_holiday_shift` berlaku untuk keduanya.
- `GeneratePeriods` untuk aturan berbasis hari melangkah dari `period_anchor_date` sebanyak `period_length_days`. Kode periode `YYYY-Www` (mingguan, ISO week dari `start_date`) dan `YYYY-Bnn` (dua mingguan, nomor urut dalam tahun).
- `payroll_runs.period` (masa pajak) tetap = bulan `pay_date`; satu masa bisa berisi beberapa run (mis. 4 run mingguan). Periode yang melintasi dua bulan masuk masa bulan dibayarnya.
- Komponen one-time untuk karyawan non-bulanan berlaku per `period_id`, bukan per `YYYY-MM` (dikerjakan bersama P6).
- **Plafon BPJS per bulan** (usulan, menunggu keputusan): plafon `wage_cap` di `bpjs_config` adalah plafon **sebulan**. Untuk run kedua dst. dalam masa yang sama, dasar BPJS yang tersisa = plafon − Σ dasar BPJS karyawan itu di run final/calculated lain pada masa yang sama; iuran dihitung atas `min(dasar run ini, sisa plafon)`. Butuh query "dasar BPJS per program yang sudah terpakai bulan ini" dari `payslips.bpjs_details` (P11). Selisih pembulatan antara iuran per run dan perhitungan bulanan BPJS diterima dan didokumentasikan.

**Kriteria selesai:** tenant dengan cutoff 26–25 menghasilkan variabel absensi sesuai cutoff; schedule mingguan Senin–Minggu dengan bayar Rabu menghasilkan periode W44–W48 seperti simulasi §11.3; run lama tetap terbaca dengan `period_id` hasil backfill.

---

### P14 — PPh 21 Pegawai Tidak Tetap (TER Harian) & Rekonsiliasi Desember Selektif

**Status:** usulan dari review 2026-11-11, **menunggu keputusan** — pertanyaan untuk tim pajak di §8a butir 1–6 (lihat simulasi [lampiran §11](./2026-11-10-payroll-erd-simulasi-satu-periode.md) temuan #3–#4).

**Masalah:**
1. Calculator selalu memakai TER **bulanan** per run. Untuk pegawai tidak tetap yang dibayar harian / mingguan / per jam, hasilnya salah: bruto dua mingguan Rp4,5 jt masuk TER A 0%, padahal per hari ±Rp565 rb dan seharusnya kena TER harian 0,5%.
2. Rekonsiliasi Desember (Pasal 17 setahun) dijalankan untuk **semua** run berperiode `-12`, termasuk pegawai tidak tetap dan setiap run mingguan Desember.

**Aturan yang dipakai** (PP 58/2023 & PMK 168/2023 — **perlu dikonfirmasi tim pajak** sebelum dikerjakan):

| Status | Dibayar | Tarif |
|---|---|---|
| Pegawai tetap | bulanan | TER bulanan Jan–Nov, Pasal 17 setahun di masa terakhir (Desember, atau bulan berhenti bekerja) |
| Pegawai tidak tetap | bulanan | TER bulanan, **tanpa** rekonsiliasi tahunan |
| Pegawai tidak tetap | harian / mingguan / per jam / borongan | **TER harian** atas rata-rata penghasilan per hari: ≤ Rp450.000 → 0%; > Rp450.000 s.d. Rp2.500.000 → 0,5%; > Rp2.500.000 → Pasal 17 atas 50% bruto. Tanpa rekonsiliasi tahunan |

**Migrasi & seed:**
- Master baru `pph21_ter_daily_rates` (berversi `effective_from`, pola P10): `income_from`, `income_to`, `rate_pct`. **Seed baru** per tenant: dua baris (0–450.000 → 0%; 450.001–2.500.000 → 0,5%) + **backfill** untuk tenant lama. Batas Rp2.500.000 dan "50% bruto × Pasal 17" disimpan di `pph21_tax_parameters` (kolom baru `daily_ter_max_daily_income`, `non_permanent_above_cap_bruto_pct`), bukan konstanta.
- `employee_tax_profile` + `employment_tax_status` (`permanent` / `non_permanent`, default `permanent`; backfill semua `permanent`, sehingga angka lama tidak berubah).
- Snapshot payslip + `employment_tax_status`, `ter_method` (`monthly` / `daily` / `annual`), `taxable_days`.

**Calculator:**
- Pilih metode per karyawan per run:
  - `permanent` → TER bulanan; Pasal 17 setahun **hanya** pada run reconciliation (lihat bawah).
  - `non_permanent` + profil `salary_type` monthly → TER bulanan, tanpa rekonsiliasi.
  - `non_permanent` + `salary_type` daily / hourly → TER harian: rata-rata per hari = bruto pajak run ÷ `taxable_days` (hari berpenghasilan dalam cutoff, dari `present_days` + cuti berbayar; bisa diinput manual di P5).
- **Rekonsiliasi Desember selektif** — jalur Pasal 17 setahun hanya bila **semua** terpenuhi:
  1. karyawan `permanent`;
  2. run `type = regular` (bukan bonus / THR / adjustment — itu tetap TER bulanan di masa yang sama, lalu ikut dijumlahkan di rekonsiliasi);
  3. run ini adalah **run regular terakhir** karyawan itu dalam masa Desember: untuk schedule bulanan = run periode Desember; untuk schedule non-bulanan = periode yang `pay_date`-nya paling akhir di Desember. Periode sebelumnya di Desember tetap TER bulanan.
  4. Atau: masa pajak terakhir selain Desember (berhenti bekerja, pensiun, meninggal di tengah tahun) — dirinci di **P16**.
- Run reconciliation menandai payslip `ter_method = annual`; run lain di masa Desember memakai TER dan ikut dihitung sebagai "sudah dibayar" pada YTD.

**API / Backoffice:** field **Employment tax status** di tax profile; tab **TER Harian** di HR Setting › Tax and BPJS; laporan bukti potong (P13) menambah kolom status dan metode.

**Dependensi:** P4 (schedule non-bulanan, `pay_date` periode), P10–P13. Menunggu jawaban tim pajak (§8a); P5 dikerjakan lebih dulu.

**Kriteria selesai:** simulasi §11: Dodi PPh 0 (rata-rata 172.023/hari), Eka 22.622 dan 24.130; pegawai tetap bulanan tidak berubah; run THR/bonus Desember tidak memicu Pasal 17; hanya run regular terakhir Desember yang `ter_method = annual`.

---

### P16 — Masa Pajak Terakhir & Data Pajak Tahunan Karyawan

**Status:** usulan dari diskusi 2026-11-11, **menunggu konfirmasi tim pajak** — pertanyaan di §8a butir 7–12 (aturan di bawah perlu dicek terhadap PMK 168/2023 dan PER Dirjen turunannya). Dikerjakan setelah P14.

**Masalah** — calculator sekarang:
1. Hanya menjalankan Pasal 17 setahun bila `period` berakhiran `-12`. Karyawan yang masa pajak terakhirnya bukan Desember (resign, pensiun, meninggal, pindah ke luar negeri) tetap dihitung TER, sehingga kurang/lebih potong tidak pernah dibereskan di masa terakhirnya.
2. Karyawan yang **masuk di tengah tahun**: YTD Jan–Nov hanya berisi bulan yang dia bekerja (sudah benar), tetapi batas biaya jabatan selalu Rp6 jt setahun. Untuk masa kerja < 12 bulan batasnya diduga **Rp500 rb × jumlah bulan** (perlu konfirmasi).
3. Karyawan yang **baru menjadi subjek pajak dalam negeri** di tengah tahun (WNA datang) atau **berhenti menjadi subjek** (meninggalkan Indonesia selamanya): penghasilan neto seharusnya **disetahunkan**; belum ada.
4. Karyawan pindah kerja dalam tahun yang sama dan menyerahkan **bukti potong 1721-A1 pemberi kerja sebelumnya**: tidak ada tempat menyimpan bruto, iuran pensiun/JHT dan PPh 21 yang sudah dipotong, sehingga tidak bisa ikut diperhitungkan (bila aturannya mengizinkan / mewajibkan).

**Aturan yang diusulkan** (konfirmasi tim pajak per butir):

| Kasus | Masa pajak terakhir | Perlakuan |
|---|---|---|
| Bekerja sampai Desember | Desember (run regular terakhir masa Desember, P14) | Pasal 17 setahun atas penghasilan di pemberi kerja ini (+ A1 sebelumnya bila digabung) |
| Berhenti di tengah tahun (resign, PHK, pensiun) | Bulan tanggal keluar | Pasal 17 atas penghasilan Jan s.d. bulan keluar, **tidak** disetahunkan; kelebihan potong dikembalikan / dikompensasikan di slip terakhir |
| Meninggal dunia | Bulan meninggal | Sama seperti berhenti; dicatat terpisah untuk laporan |
| Masuk di tengah tahun | Desember (atau bulan keluar) | Tidak disetahunkan; PTKP setahun penuh; batas biaya jabatan proporsional jumlah bulan bekerja |
| WNA mulai / berhenti menjadi subjek pajak DN di tengah tahun | Desember / bulan berhenti | Penghasilan neto **disetahunkan** (× 12 / jumlah bulan), PPh setahun lalu dikembalikan proporsional |
| Pindah kerja dengan A1 pemberi kerja sebelumnya | Desember | Opsi: (a) gabung A1 ke YTD (bruto, iuran, PPh dipotong) atau (b) hitung terpisah, karyawan menggabungkan di SPT tahunan. **Keputusan tim pajak**, disimpan sebagai setelan tenant |

**Migrasi**

- `employee_tax_years` (satu baris per karyawan per tahun pajak): `employee_id`, `tax_year`, `start_month` (bulan mulai bekerja / menjadi subjek pajak di tahun itu; default dari tanggal masuk Core HR), `end_month` (nullable; default dari tanggal keluar Core HR), `termination_reason` (`resign` / `retire` / `death` / `leave_indonesia` / `other`, nullable), `annualize` (boolean; true hanya untuk subjek pajak DN yang datang/pergi di tengah tahun), `notes`.
- `employee_previous_employment_taxes` (A1 pemberi kerja sebelumnya, per tahun pajak, bisa lebih dari satu): `employee_id`, `tax_year`, `employer_name`, `employer_npwp`, `period_from`, `period_to` (bulan), `gross`, `pension_contribution` (iuran pensiun/JHT/THT yang dibayar karyawan), `pph21_withheld`, `document_number`, `attachment` (opsional).
- `pph21_tax_parameters` + kolom `occupational_expense_monthly_cap` (Rp500.000) dan setelan tenant `payroll_config.include_previous_employer_a1` (boolean).
- Snapshot payslip + `tax_reconciliation` (`none` / `december` / `termination`), `months_worked`, `annualized` (boolean), `previous_employer_gross`, `previous_employer_pph21`.

**Calculator**

- Penentu **masa pajak terakhir** per karyawan per run (memperluas syarat rekonsiliasi P14): run regular terakhir masa Desember, **atau** run yang masa pajaknya = `end_month` (tanggal keluar Core HR / input manual), **atau** run `type = final`. Run `final` tanpa tanggal keluar ditolak dengan pesan jelas.
- Pasal 17 setahun memakai:
  - YTD = slip tenant ini dari `start_month` s.d. masa sebelumnya (+ A1 bila `include_previous_employer_a1`).
  - Biaya jabatan = min(5% × bruto, `occupational_expense_monthly_cap` × bulan bekerja di pemberi kerja ini) — perlu konfirmasi apakah A1 ikut menambah bulan.
  - Bila `annualize`: neto × 12 / bulan bekerja → PPh setahun × bulan bekerja / 12.
  - PPh masa terakhir = PPh setahun − PPh yang sudah dipotong (tenant ini + A1 bila digabung). Hasil negatif = **kelebihan potong**, dikembalikan sebagai earning `PPH21_REFUND` (komponen sistem) di slip itu.
- Setelah masa terakhir karena berhenti, run berikutnya di tahun yang sama menolak karyawan itu (kecuali dibuat baris tahun pajak baru karena masuk kembali).

**Integrasi Core HR:** contract `GetEmploymentDates(ctx, tenantID, employeeIDs)` → tanggal masuk, tanggal keluar, alasan keluar (bila sudah ada di Core HR). Baris `employee_tax_years` dibuat otomatis saat calculate bila belum ada, lalu bisa dikoreksi manual.

**API / Backoffice**

- `GET/PUT /payroll/employees/:id/tax-years/:year`; `GET/POST/PATCH/DELETE /payroll/employees/:id/previous-employment-taxes` (`?tax_year=`).
- Panel karyawan (`PayrollEmployeePanel`) sub-tab **Tax & BPJS**: kartu **Tahun Pajak** (bulan mulai / berhenti, alasan, disetahunkan) dan daftar **Bukti Potong Pemberi Kerja Sebelumnya** (input A1, unggah dokumen).
- HR Setting › Tax and BPJS: setelan "Gabungkan A1 pemberi kerja sebelumnya" dan batas biaya jabatan per bulan.
- Laporan bukti potong (P13): kolom jenis rekonsiliasi, bulan bekerja, A1 sebelumnya; menjadi dasar 1721-A1 yang diterbitkan untuk karyawan yang berhenti.

**Dependensi:** P14 (penentu run rekonsiliasi, `ter_method`), P4 (masa pajak dari `pay_date`), Core HR tanggal keluar. Dikerjakan sebelum P5.

**Kriteria selesai** (angka dibuat bersama tim pajak dan ditambahkan ke lampiran simulasi): karyawan resign Juni direkonsiliasi di run Juni dan kelebihan potongnya kembali di slip; karyawan masuk Agustus memakai batas biaya jabatan 5 × Rp500 rb; WNA datang Juli disetahunkan; A1 pemberi kerja sebelumnya mengubah PPh Desember hanya bila setelan tenant aktif; karyawan yang bekerja setahun penuh tidak berubah.

---

### P5 — Run Snapshot (run employee, input, detail)

**Status:** selesai dikerjakan 2026-11-11, menunggu review. Migrasi `20261111000007_payroll_run_snapshot` ditulis, **belum dijalankan**. Tidak ada backfill. Catatan implementasi:
- `payroll_run_inputs` dikunci ke `run_id + employee_id` (bukan `payslip_id` seperti rencana) karena hitung ulang membangun ulang payslip; snapshot dan input manual tetap utuh. Unik per `(run, employee, variable, source)`; nilai manual menang, juga setelah `refresh_inputs`.
- Semua variabel katalog absensi/cuti disimpan (termasuk nol), sumber `attendance` / `leave`.
- Error per karyawan = semua error bukan internal: tax profile kosong, PTKP tidak di master, JKK ambigu, TER kosong, **item absensi pending** (sebelumnya memblokir seluruh run), formula sirkular. Error internal (DB) tetap menggagalkan run.
- Exclude dibawa saat hitung ulang (karyawan tetap dihitung, status tetap `excluded`). Include → `ok`, atau `error` bila ada `error_message`.
- Slip `error` / `excluded` dikecualikan dari total run, file bank, laporan P13, YTD Desember, plafon BPJS bulanan (P4), daftar slip karyawan (ESS & tab Payroll).
- Input manual hanya bisa diubah saat run `calculated` dan baru berlaku setelah calculate (Backoffice menyediakan "Save & Recalculate").
- Backoffice: inspector run menampilkan daftar karyawan (status, pesan error, exclude/include, panel input); menu run menambah "Recalculate with Fresh Attendance Data"; halaman Payslips menandai slip error/excluded dan baris formula.

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

### P5a — Kelengkapan Payroll Run (CRUD, reject, preview, UI)

**Status:** selesai dikerjakan 2026-11-11 (permintaan user setelah review UI Payroll Runs), menunggu review. Migrasi `20261111000008_payroll_run_review` ditulis, **belum dijalankan**. Tidak ada backfill.

**Masalah:** run draft tidak bisa diubah / dihapus; checker hanya bisa approve (tidak bisa mengembalikan run); peserta baru terlihat setelah calculate; halaman Payroll Runs masih gaya lama (kartu statistik, label mock, pencarian ID batch, maker/checker berupa potongan ID) dan form buat run tidak bisa memilih karyawan (final pay menghitung semua karyawan).

**API**
- `PUT /payroll/runs/:id` — ubah run **draft** (tipe, periode / masa pajak, tanggal bayar, cabang, filter peserta); validasi sama dengan buat run.
- `DELETE /payroll/runs/:id` — hapus run **draft / calculated** beserta payslip dan input; audit `payroll_run.deleted`.
- `POST /payroll/runs/:id/reject` `{ reason }` (`payroll:approve`) — `in_review` → `calculated`; alasan disimpan di `payroll_runs.review_note` (+ `reviewed_by`, `reviewed_at`), dihapus saat approve; audit `payroll_run.rejected`.
- `POST /payroll/runs/preview` — body sama dengan buat run → `{ period, pay_date, count, employee_ids }` (peserta yang akan dihitung, tanpa membuat run).
- Respons run menambah `created_by_name`, `approved_by_name`, `reviewed_by_name` (username / email dari auth, best effort), `review_note`, `reviewed_at`.

**Backoffice**
- **Payroll Runs** (`salary/runs/index.vue`) memakai `AppListPage` tanpa kartu statistik: filter status, tipe, schedule, tahun pajak; kolom run (periode · schedule atau tipe · masa pajak), status (+ tanda "Rejected"), karyawan ok/error/excluded, net, tanggal bayar, pembuat; aksi Open / Edit (draft) / Delete (draft, calculated).
- **Detail run** (`salary/runs/[id].vue`): tombol sesuai status & izin (Edit, Calculate, Recalculate / dengan data absensi baru, Submit, Delete — maker; Reject, Approve, Bank File, Mark as Paid, Close — checker), semua dengan konfirmasi; peringatan rejected / error; ringkasan total; detail run; daftar karyawan P5.
- **Form run** (`PayrollRunForm`): 1) tipe; 2) regular = schedule → periode (yang berjalan / berikutnya di atas, info cutoff absensi & masa pajak, tanggal bayar bisa diubah), off-cycle = masa pajak + tanggal bayar; 3) peserta = semua (opsional dipersempit cabang / salary type / employment type) atau karyawan terpilih (wajib untuk final pay); pratinjau jumlah karyawan langsung; tombol Create Draft / Create & Calculate.
- Halaman lama `salary/runs.vue` dihapus.

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

**Backoffice:** tab Payments di detail run (batch, status per karyawan, unggah bukti); flag **rekening utama** di section Others › Bank Accounts Employee Info yang sudah ada (bukan tab baru di payroll).

**Backfill:** tidak ada; run lama yang sudah `paid` tidak punya batch (ditampilkan "paid (legacy)").

**Docs:** `04-payroll-run.md` §2, `07-integration.md` (contract rekening), `06-data-model.md`, `05-api-contract.md`.

**Kriteria selesai:** bank file berisi nomor rekening; split payment dua rekening dengan total = net; run berubah `paid` otomatis setelah semua payment lunas.

---

### P9 — Policy Versioning (opsional)

`payroll_policy_versions` — snapshot `payroll_config` per `effective_from`, agar aturan cap potongan yang berlaku pada periode lama bisa diaudit. Dikerjakan bila ada kebutuhan audit nyata.

---

### P10 — Master PTKP & Parameter Pajak

> **Status: selesai dikerjakan 2026-11-10, menunggu review.** Migrasi `20261110000005_create_pph21_ptkp_and_tax_parameters_tables` dan backfill `seed_ptkp_defaults_for_tenant` (`20261110090001`) ditulis, **belum dijalankan**. Tenant existing wajib menjalankan backfill sebelum calculate berikutnya.

**Tujuan:** semua angka PPh 21 menjadi data konfigurasi berversi, sesuai prinsip [03-calculation.md](../modules/payroll/03-calculation.md) §2 ("tarif, persentase, dan plafon tidak di-hardcode").

**Kondisi saat ini**

| Data | Sudah master? | Lokasi sekarang |
|---|---|---|
| Tarif TER A/B/C | ✅ `tax_ter_rates` (berversi, di-seed PP 58/2023) | `seed_ter_defaults.go` |
| Tarif progresif Pasal 17 (5/15/25/30/35%) | ✅ `pph21_tax_brackets` (berversi, di-seed) | `seed_defaults.go` → `seedPPh21BracketDefaults` |
| Nominal PTKP tahunan per status | ❌ konstanta `annualPTKPAmounts` | `domain/payrollrun/service/pph21_constants.go` |
| Daftar status PTKP valid (`TK/0`…`K/3`) | ❌ konstanta `ValidPTKPStatuses` | `domain/taxprofile/constant/constant.go` |
| Mapping PTKP → kategori TER | ❌ `switch` di `deriveTERCategory` | `domain/taxprofile/entity/employee_tax_profile.go` |
| Biaya jabatan (5%, maks Rp6 jt/tahun) | ❌ konstanta `biayaJabatanPct`, `biayaJabatanAnnualCap` | `pph21_constants.go` |

**Migrasi**

`pph21_ptkp_rates` — satu baris per status PTKP per versi. Mapping kategori TER disimpan di baris yang sama karena keduanya ditentukan oleh status PTKP dan berubah bersama regulasi.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id`, `tenant_id` | UUID | |
| `ptkp_status` | varchar | `TK/0`, `TK/1`, …, `K/3` (nanti bisa `K/I/0` dst. bila diperlukan) |
| `annual_amount` | bigint | PTKP setahun, mis. `TK/0` = 54.000.000 |
| `ter_category` | varchar | `A` / `B` / `C` |
| `effective_from` | date | Versi berlaku |
| `created_at`, `updated_at` | timestamptz | |

UNIQUE `(tenant_id, ptkp_status, effective_from)`.

`pph21_tax_parameters` — parameter skalar PPh 21, satu baris per versi.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id`, `tenant_id` | UUID | |
| `occupational_expense_pct` | numeric(6,3) | Biaya jabatan, default 5 |
| `occupational_expense_annual_cap` | bigint | Default 6.000.000 |
| `effective_from` | date | UNIQUE `(tenant_id, effective_from)` |
| `created_at`, `updated_at` | timestamptz | |

Keduanya tenant-scoped dan berversi `effective_from`, sama seperti `bpjs_config`, `tax_ter_rates`, dan `pph21_tax_brackets`.

**API**

- Entity & repository baru di `domain/payrollconfig` (`ptkp_rate.go`, `tax_parameter.go`), mengikuti pola `ter_rate.go` / `pph21_bracket.go`.
- Resolusi versi: baris dengan `effective_from` terbesar yang ≤ **1 Januari tahun pajak** periode run. Status PTKP karyawan ditetapkan per 1 Januari ([03-calculation.md](../modules/payroll/03-calculation.md) §4.3), jadi tabel acuannya juga dikunci per awal tahun.
- `employee_tax_profile`:
  - Validasi `ptkp_status` terhadap status yang ada di versi PTKP terbaru, menggantikan `ValidPTKPStatuses`.
  - `ter_category` tetap disimpan sebagai cache tampilan, diisi dari master saat simpan, menggantikan `deriveTERCategory`.
- `CalculateRunUseCase` / `calculator.go`:
  - Kategori TER bulanan diambil dari master (bukan dari kolom cache), agar perubahan mapping langsung berlaku tanpa menyimpan ulang semua tax profile.
  - `decemberPPh21` menerima `annual_amount` PTKP dan parameter biaya jabatan sebagai input, bukan konstanta.
  - Master tidak ditemukan → `CONFIG_NOT_FOUND` untuk karyawan itu (menjadi payslip `error` setelah P5), bukan fallback diam-diam ke angka lama.
- Hapus `annualPTKPAmounts`, `biayaJabatanPct`, `biayaJabatanAnnualCap`, `ValidPTKPStatuses`, dan `switch` di `deriveTERCategory`. Nilainya pindah ke data seed.
- Seed default per tenant baru di `seed_defaults.go`: PTKP PMK 101/PMK.010/2016 + mapping TER PP 58/2023, dan biaya jabatan 5% / Rp6 jt. `effective_from` sama dengan seed BPJS/bracket (`2026-01-01`).
- Endpoint (`payroll:config`), mengikuti pola `/payroll/config/*`:
  - `GET/POST /payroll/config/pph21-ptkp-rates`
  - `GET/POST /payroll/config/pph21-tax-parameters`
- Versi yang sudah dipakai run `closed` tidak boleh diedit atau dihapus; perubahan = baris baru dengan `effective_from` baru.

**Backoffice:** dua tab baru di **HR Setting › Tax and BPJS** (`tax-bpjs.vue`): **PTKP** (status, nominal tahunan, kategori TER, effective from) dan **Tax Parameters** (biaya jabatan). Dropdown PTKP di tax profile karyawan diisi dari master, bukan daftar statis.

**Backfill:** seeder untuk tenant existing (ditulis tim, dijalankan user) yang mengisi nilai sama persis dengan konstanta sekarang. Idempotent: tenant yang sudah punya baris dilewati.

**Docs:** [03-calculation.md](../modules/payroll/03-calculation.md) §4.2–§4.4 (sumber PTKP & biaya jabatan), [06-data-model.md](../modules/payroll/06-data-model.md) (tabel baru, §2.3 `ter_category` = cache), [05-api-contract.md](../modules/payroll/05-api-contract.md).

**Kriteria selesai:** tidak ada lagi angka PTKP, biaya jabatan, atau mapping kategori TER di kode Go; hasil calculate Januari–November dan rekonsiliasi Desember untuk data hasil backfill **identik** dengan sebelumnya; menambah versi PTKP baru berlaku mulai tahun pajak berikutnya tanpa deploy.

---

### P11 — Kepesertaan BPJS & Perlakuan Pajak per Karyawan

**Status:** selesai dikerjakan 2026-11-10, menunggu review. Migrasi `20261110000006_create_bpjs_enrollments_and_tax_treatment` dan backfill `backfill_bpjs_enrollments_for_tenant` (`20261110090002`) ditulis, **belum dijalankan**. Catatan implementasi:

- Endpoint bulk (`POST /payroll/bpjs-enrollments/bulk`) dan filter "BPJS belum lengkap" di menu Compensations **belum dikerjakan**: menu Compensations baru ada di P2, dan bulk butuh daftar karyawan per cabang. Dipindah ke P2.
- Sub-tab Employee Info › Payroll belum ada (P2). Form perlakuan pajak, NPWP read-only, dan tabel kepesertaan BPJS untuk sementara ditaruh di halaman **Employee Payrolls** (`salary/employees.vue`), lalu dipindah ke `PayrollEmployeePanel` di P2.
- Update tax profile tetap `PUT` (bukan `PATCH`), menerima `tax_treatment`; `dtp_eligible` lama masih diterima.
- `payslips.pph21` **tetap berarti "dipotong dari karyawan"**; DTP disimpan terpisah di `pph21_dtp`. YTD Desember memakai `pph21 + pph21_dtp`.
- Kepesertaan berlaku bila menutupi **hari terakhir periode** run.
- Backfill tidak mengisi `risk_class` JKK: calculator memakai `default_jkk_risk_class`, atau satu-satunya tarif JKK tenant, sehingga angka tidak berubah untuk tenant dengan satu tarif JKK. Tenant dengan beberapa kelas dicatat backfill sebagai warning.
- Kelas risiko JKK (tambahan setelah review): seed kini membuat lima kelas PP 44/2015 (`very_low` 0,24% … `very_high` 1,74%) dan `default_jkk_risk_class = very_low`. Tenant lama: migrasi `20261110000007_rename_seeded_jkk_risk_class` dan `20261110000008_bpjs_config_unique_per_risk_class` (unique lama `(tenant_id, program, effective_from)` diganti unique per risk_class) (baris `low` 0,24% hasil seed → `very_low`) lalu backfill `seed_jkk_risk_classes_for_tenant` (`20261110090003`); tenant dengan tarif JKK sendiri dilewati. Karyawan tanpa kelas tetap 0,24%. Pilihan kelas di UI diambil dari tarif JKK tenant.
- Temuan #11: `bpjs_config` lama `FindApplicable` memakai `DISTINCT ON (program)`, jadi dengan beberapa baris JKK yang terpilih **satu baris sembarang** (bukan dijumlahkan). Diperbaiki: satu baris per (program, risk_class), dipilih per karyawan. Cek duplikat saat tambah tarif BPJS juga kini menyertakan `risk_class`.

**Tujuan:** HR bisa mengatur per karyawan program BPJS mana yang diikuti dan bagaimana PPh 21-nya diperlakukan, dengan riwayat berlaku. Saat ini semua karyawan dalam run otomatis dikenakan semua program BPJS di `bpjs_config`.

**Kondisi saat ini**

| Hal | Kondisi | Lokasi |
|---|---|---|
| Kepesertaan BPJS | Tidak ada. `calculator.go` menerapkan semua baris `bpjs_config` yang berlaku ke setiap karyawan. | `domain/payrollrun/service/calculator.go` |
| Nomor kepesertaan BPJS | Tidak disimpan (hanya kolom BPJS di data keluarga Core HR). | `core-hr/domain/employee/entity/records.go` |
| Kelas risiko JKK | `bpjs_config.risk_class` ada, tetapi calculator tidak memilih per kelas risiko; bila tenant punya beberapa baris JKK, semuanya ikut terjumlah. | `bpjs_config`, `calculator.go` |
| Perlakuan PPh 21 | Hanya `dtp_eligible` (pajak 0). Tidak ada opsi bukan subjek pajak. | `domain/taxprofile` |
| `has_npwp` | Diinput di tax profile, padahal NPWP sudah ada di Core HR (`employees.npwp`). Belum dipakai calculator. | `domain/taxprofile`, `core-hr` |
| `pph21_method` | Disimpan (`nett` / `gross` / `gross_up`), belum dipakai calculator: semua dihitung sebagai `gross`. | `domain/taxprofile` |

**Migrasi**

`employee_bpjs_enrollments` — satu baris per karyawan per program per rentang berlaku.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id`, `tenant_id`, `employee_id` | UUID | |
| `program` | varchar | `kesehatan` / `jht` / `jp` / `jkk` / `jkm` (sama dengan `bpjs_config.program`) |
| `is_enrolled` | boolean | `false` = tidak dipotong dan tidak dibebankan ke perusahaan |
| `membership_number` | varchar (nullable) | No. KPJ (Ketenagakerjaan) / No. JKN (Kesehatan) |
| `risk_class` | varchar (nullable) | Hanya untuk `jkk`; memilih baris `bpjs_config` dengan `risk_class` yang sama |
| `wage_base_override` | bigint (nullable) | Dasar upah yang dilaporkan ke BPJS bila berbeda dari Σ komponen `bpjs_base`. Plafon tetap berlaku |
| `exclusion_reason` | varchar (nullable) | Mis. `retirement_age` (JP), `spouse_coverage` (Kesehatan), `foreign_worker`, `other` |
| `effective_from` | date | |
| `effective_to` | date (nullable) | |

Constraint: tidak boleh overlap per `(employee_id, program)`.

`employee_tax_profile`:

- + `tax_treatment VARCHAR NOT NULL DEFAULT 'subject'` — `subject` / `dtp` / `exempt`. Menggantikan `dtp_eligible` (backfill: `dtp_eligible = true` → `dtp`).
- `has_npwp` deprecated: diturunkan dari `employees.npwp` lewat contract Core HR.

`payroll_config` + `default_bpjs_programs` (array/JSONB, default semua program) dan `default_jkk_risk_class` — dipakai saat membuat enrollment awal karyawan baru.

**API**

- Domain baru `domain/bpjsenrollment` (entity, repository, service) dengan aturan effective-dating tanpa overlap.
- Enrollment awal dibuat otomatis saat karyawan pertama kali punya kompensasi (P2) atau tax profile, dari default `payroll_config`, `effective_from` = tanggal masuk.
- `CalculateRunUseCase` / `calculator.go`:
  - Hanya program dengan enrollment `is_enrolled = true` yang berlaku pada periode run yang dihitung.
  - JKK memakai baris `bpjs_config` sesuai `risk_class` enrollment; tanpa `risk_class` → `default_jkk_risk_class`; tidak ada baris yang cocok → `CONFIG_NOT_FOUND`.
  - `wage_base_override` menggantikan Σ `bpjs_base` bila terisi.
  - Karyawan tanpa enrollment sama sekali → perilaku lama (semua program) sampai backfill dijalankan.
  - `tax_treatment = exempt` → PPh 21 tidak dihitung (0).
  - `tax_treatment = dtp` → PPh 21 **tetap dihitung** normal, lalu dicatat sebagai `pph21_dtp` (ditanggung pemerintah); `pph21` yang dipotong dari gaji = 0. Nilai DTP wajib ada karena tetap dilaporkan di bukti potong.
- **Snapshot ke payslip** — dikerjakan di P11, tidak menunggu P5, karena dibutuhkan laporan setoran (P13). Tujuannya: slip bulan lalu bisa direkonstruksi walau tax profile atau enrollment karyawan sudah diubah.

  | Kolom baru `payslips` | Isi |
  |---|---|
  | `tax_treatment` | `subject` / `dtp` / `exempt` saat dihitung |
  | `ptkp_status` | Status PTKP yang dipakai |
  | `ter_category`, `ter_rate` | Kategori dan tarif TER yang dipakai (bulan Januari–November) |
  | `has_npwp`, `npwp` | Dari Core HR saat dihitung |
  | `pph21_dtp` | PPh 21 yang ditanggung pemerintah (0 bila bukan `dtp`) |
  | `bpjs_details` | JSONB, satu entri per program: `program`, `institution` (`kesehatan` / `ketenagakerjaan`), `membership_number`, `risk_class`, `base` (setelah plafon), `employee_rate`, `employer_rate`, `employee_amount`, `employer_amount`, `employer_taxable` (P12). Σ entri = `bpjs_employee` / `bpjs_employer` |

  Payslip lama (sebelum P11) dibiarkan tanpa snapshot (kolom NULL); laporan P13 menandai periode itu sebagai "tanpa rincian".

  P5 nanti menambah status payslip dan snapshot input, tidak memindahkan kolom ini.
- Contract Core HR: `GetEmployeeNPWP` / ikut `ListEmployeesBasic`, untuk `has_npwp` turunan.
- Endpoint (`payroll:config`):
  - `GET/PUT /payroll/employees/:employeeId/bpjs-enrollments` (replace-all per program, satu transaksi)
  - `POST /payroll/bpjs-enrollments/bulk` (mis. set kelas risiko JKK untuk satu cabang)
  - `PATCH /payroll/employees/:employeeId/tax-profile` menerima `tax_treatment`.
- `pph21_method` belum diimplementasikan di fase ini: dikerjakan di P12.

**Backoffice**

- Sub-tab **Payroll › Tax** diganti **Payroll › Tax & BPJS** (§5.3): tabel enrollment per program (ikut, nomor, kelas risiko, dasar upah, berlaku), perlakuan pajak, NPWP read-only dari Core HR.
- Menu **Compensations**: filter "BPJS belum lengkap" (tanpa enrollment atau tanpa nomor kepesertaan).
- **HR Setting › Tax and BPJS**: default program dan kelas risiko JKK untuk karyawan baru.

**Backfill:** untuk setiap karyawan yang punya `payroll_employee_profiles` atau tax profile: enrollment semua program `is_enrolled = true`, `effective_from` = tanggal masuk, `risk_class` JKK = kelas risiko tunggal tenant bila hanya satu. Tenant dengan lebih dari satu kelas risiko JKK dilaporkan oleh backfill untuk diisi manual. `dtp_eligible` → `tax_treatment`.

**Docs:** [03-calculation.md](../modules/payroll/03-calculation.md) §3 (kepesertaan & JKK per risiko) dan §4.4 (perlakuan pajak), [06-data-model.md](../modules/payroll/06-data-model.md) §2.3 + tabel baru, [07-integration.md](../modules/payroll/07-integration.md) (NPWP dari Core HR), [05-api-contract.md](../modules/payroll/05-api-contract.md).

**Kriteria selesai:** karyawan dengan JP `is_enrolled = false` tidak dipotong dan tidak dibebani JP; dua karyawan dengan kelas risiko JKK berbeda mendapat tarif JKK berbeda; data hasil backfill menghasilkan angka identik dengan sebelum backfill (untuk tenant dengan satu kelas risiko); karyawan `exempt` PPh 21 = 0; karyawan `dtp` punya `pph21_dtp` > 0 dan `pph21` = 0; setiap payslip baru punya snapshot pajak dan `bpjs_details` yang jumlahnya sama dengan total.

---

### P12 — Penerapan Metode PPh 21 (gross / nett)

**Status:** selesai dikerjakan 2026-11-11, menunggu review. Migrasi `20261110000009_pph21_method_and_bpjs_tax_flags` dan backfill `reset_pph21_method_to_gross_for_tenant` (`20261110090004`) ditulis, **belum dijalankan**. Catatan implementasi:

- Flag BPJS untuk baris `bpjs_config` yang sudah ada diisi langsung oleh migrasi (UPDATE per program), bukan oleh backfill.
- Profil `gross_up` lama yang belum di-backfill dihitung dan dicatat sebagai `gross`.
- `PPH21_DTP` di-seed sebagai system component (nama bisa diubah HR); assign komponen sistem ke karyawan kini ditolak.
- `totals` run menambah `pph21_employer_borne` dan `pph21_dtp`; `pph21` tetap = dipotong.
- Response payslip memakai `pph21_total` (terutang), bukan `pph21_withheld`.

**Tujuan:** `employee_tax_profile.pph21_method` benar-benar dipakai calculator. Saat ini kolom itu disimpan tetapi calculator selalu memotong PPh dari gaji (`gross`), dan default entity justru `nett` — jadi karyawan yang tampil "nett" di UI sebenarnya dipotong.

**Cakupan (diputuskan user 2026-11-10):** hanya `gross` dan `nett`. **Gross-up belum disediakan** — `gross_up` ditolak saat simpan tax profile dan tidak ditawarkan di UI (§8 #10).

**Dependensi:** P10 (master PTKP & biaya jabatan), P11 (`tax_treatment`, snapshot payslip). Dikerjakan sebelum P13 agar laporan bisa memisahkan PPh yang dipotong dari karyawan dan yang ditanggung perusahaan.

**Perilaku per metode**

| Metode | PPh 21 dihitung dari | Dipotong dari gaji | Ditanggung perusahaan | Di slip |
|---|---|---|---|---|
| `gross` | Bruto kena pajak | Ya, sebesar PPh | — | Baris potongan PPh 21 (perilaku sekarang) |
| `nett` | Bruto kena pajak | Tidak | Ya, sebesar PPh | PPh 21 tampil sebagai "ditanggung perusahaan", net tidak berkurang |

Aturan bersama:

- `tax_treatment` (P11) lebih dulu: `exempt` → tidak dihitung, metode diabaikan.
- `tax_treatment = dtp` (**diputuskan user 2026-11-10**): PPh tetap dihitung dan seluruhnya dicatat di `pph21_dtp`.
  - `gross` + DTP: tidak dipotong dari gaji (P11).
  - `nett` + DTP: perusahaan tidak menanggung apa pun (`pph21_employer_borne = 0`). Nilai DTP dibayarkan ke karyawan sebagai **earning** `PPH21_DTP` (tidak kena pajak, bukan `bpjs_base`), sehingga net karyawan naik sebesar DTP.
- Rekonsiliasi Desember memakai metode yang sama: `nett` menghitung PPh Desember normal lalu dibebankan ke perusahaan.
- Karyawan pindah metode di tengah tahun: tiap bulan memakai metode yang berlaku saat dihitung; Desember memakai metode yang berlaku di Desember.

**Migrasi & data**

- `payslips` + `pph21_method` (snapshot) dan `pph21_employer_borne BIGINT NOT NULL DEFAULT 0`.
- Arti kolom pajak di payslip (mengikuti implementasi P11):
  - `pph21` = PPh 21 yang **dipotong dari gaji** (tetap seperti sekarang); `net` memakai angka ini.
  - `pph21_employer_borne` = bagian yang ditanggung perusahaan (`nett`).
  - `pph21_dtp` = bagian yang ditanggung pemerintah (P11).
  - PPh 21 terutang (dilaporkan) = `pph21 + pph21_employer_borne + pph21_dtp`. YTD Desember menjumlahkan ketiganya.
- Earning DTP untuk `nett` + DTP disimpan sebagai `payslip_lines` dengan code `PPH21_DTP`, `type = earning`, tidak taxable, bukan `bpjs_base`. Dibuat calculator, bukan pay component tenant; seed menambahkannya sebagai system component agar namanya bisa diatur dan tidak bisa di-assign manual.
- **Premi BPJS perusahaan sebagai bruto pajak** (**diputuskan user 2026-11-10**, menutup §8 #15): flag boolean di master `bpjs_config`, bukan konstanta.
  - `bpjs_config` + `employer_contribution_taxable BOOLEAN NOT NULL DEFAULT false` — bila `true`, bagian perusahaan program ini ditambahkan ke `taxable_gross` (bruto PPh 21), tidak ke `gross` maupun `net`.
  - Sekaligus `bpjs_config` + `employee_contribution_deductible BOOLEAN NOT NULL DEFAULT false` menggantikan konstanta `EmployeeContributionReducesPPh21` (bila `true`, iuran **karyawan** program ini mengurangi **neto** — dasar pajak — pada rekonsiliasi Desember: bruto − biaya jabatan − iuran JHT/JP karyawan = neto; bukan mengurangi angka PPh secara langsung, dan tidak berpengaruh pada bulan TER Januari–November), agar kedua aturan ada di master yang sama.
  - Ringkasan flag default:

    | Program | `employer_contribution_taxable` (iuran perusahaan menambah bruto) | `employee_contribution_deductible` (iuran karyawan mengurangi neto) |
    |---|---|---|
    | Kesehatan | true | false |
    | JKK | true | — (tanpa iuran karyawan) |
    | JKM | true | — (tanpa iuran karyawan) |
    | JHT | false | true |
    | JP | false | true |
  - Seed & backfill: Kesehatan, JKK, JKM → `employer_contribution_taxable = true`; JHT, JP → `employee_contribution_deductible = true`; sisanya `false`.
  - Diedit di HR Setting › Tax and BPJS (tab BPJS) sebagai dua kolom checkbox. Berlaku per versi `effective_from` seperti tarif.
  - Snapshot: `bpjs_details` per program + `employer_taxable` (P11).
  - **Hasil PPh berubah** untuk semua karyawan setelah backfill dijalankan; run yang sudah `approved` / `paid` / `closed` tidak dihitung ulang.
- Default entity `NewEmployeeTaxProfile` diubah dari `nett` ke `gross`.
- **Backfill** (**diputuskan user 2026-11-10**): semua profil existing di-set `gross`, karena itulah yang sebenarnya dihitung selama ini. Backfill mencetak daftar karyawan yang sebelumnya `nett` / `gross_up` agar HR mengubahnya manual bila memang dimaksudkan (`nett` bisa dipilih ulang; `gross_up` belum tersedia).

**API**

- Upsert tax profile menerima `pph21_method`; validasi hanya `gross` / `nett`. `gross_up` → `INVALID_TAX_PROFILE_ARGUMENT` ("gross-up belum didukung"). Konstanta `PPh21MethodGrossUp` tetap ada agar data lama terbaca.
- Response payslip menambah `pph21_method`, `pph21_employer_borne`, `pph21_total` (turunan: terutang).

**Backoffice**

- Tax profile: dropdown metode hanya `Gross` dan `Nett` dengan penjelasan singkat; default `Gross`.
- Payslip: baris "PPh 21 borne by company" untuk `nett`, baris earning DTP untuk `nett` + DTP.
- Payroll Runs detail: total PPh dipisah antara withheld / borne by company / DTP.

**Docs:** [03-calculation.md](../modules/payroll/03-calculation.md) §4 (metode PPh 21), [06-data-model.md](../modules/payroll/06-data-model.md) (kolom payslip), [05-api-contract.md](../modules/payroll/05-api-contract.md).

**Kriteria selesai:**

- `gross`: angka identik dengan sebelum P12 bila semua flag `employer_contribution_taxable = false`; dengan flag seed, `taxable_gross` bertambah tepat Σ premi perusahaan Kesehatan + JKK + JKM.
- `nett` + DTP: `pph21_employer_borne = 0`, line `PPH21_DTP` = `pph21_dtp`, net naik sebesar DTP.
- `nett`: net karyawan = net `gross` + PPh; `pph21_employer_borne = pph21`.
- `gross_up` ditolak saat simpan tax profile.
- Desember: kedua metode lolos test rekonsiliasi, termasuk karyawan yang pindah metode di tengah tahun.

---

### P13 — Laporan Setoran BPJS & PPh 21

**Status:** selesai dikerjakan 2026-11-11, menunggu review. Tidak ada migrasi/backfill. Catatan implementasi: data identitas (nomor, nama, NIK) dibaca per karyawan lewat contract Core HR `FindEmployeeTaxIdentity` (tidak hanya karyawan aktif); filter opsional `branch_id`; endpoint PPh 21 di-gate benefit `payroll.tax`; daftar bukti potong menjumlahkan semua run final di satu periode per karyawan.

**Tujuan:** tim payroll/finance tahu per periode berapa yang harus disetor dan ke mana:

- **BPJS Kesehatan**: Σ bagian karyawan + Σ bagian perusahaan program Kesehatan.
- **BPJS Ketenagakerjaan**: Σ per program JHT, JP, JKK, JKM, masing-masing bagian karyawan + perusahaan.
- **PPh 21**: Σ yang dipotong per masa pajak, plus Σ DTP, beserta daftar per karyawan untuk bukti potong (e-Bupot 21/26).

Bagian karyawan sudah dipotong dari gaji, sehingga yang disetor perusahaan = bagian karyawan + bagian perusahaan.

**Dependensi:** P11 (snapshot), P12 (pemisahan PPh dipotong / ditanggung perusahaan). Bisa dikerjakan sebelum P4/P6 dengan pengelompokan sementara memakai `payroll_runs.period` (`YYYY-MM`); setelah P4/P6 pengelompokan pindah ke `period_id` dan adjustment run ikut masuk.

**Sumber data** — tidak ada tabel baru; semua dari `payslips` (+ snapshot P11) dan `payroll_runs`.

| Laporan | Sumber | Aturan |
|---|---|---|
| Rekap BPJS per lembaga & program | `payslips.bpjs_details` | Hanya run berstatus `approved` / `paid` / `closed`. Run `draft` / `calculated` ditampilkan terpisah sebagai "belum final". |
| Daftar peserta BPJS | `bpjs_details` per karyawan | Nomor kepesertaan, dasar upah, iuran karyawan & perusahaan; karyawan tanpa nomor kepesertaan ditandai. |
| Rekap PPh 21 per masa | `payslips.pph21`, `pph21_employer_borne`, `pph21_dtp`, `taxable_gross` | Masa pajak = bulan periode run (lihat §8 #12). |
| Daftar bukti potong | `payslips` + snapshot pajak + Core HR (NIK, nama) | Satu baris per karyawan per masa: NIK/NPWP, PTKP, kategori & tarif TER, bruto, PPh terutang, dipotong / ditanggung perusahaan / DTP, metode, `tax_treatment`. Masa Desember memakai hasil rekonsiliasi tahunan. |

**API** (`payroll:read`):

- `GET /payroll/reports/bpjs?period=YYYY-MM` — rekap per lembaga & program + total setor.
- `GET /payroll/reports/bpjs/participants?period=&institution=` — daftar per karyawan.
- `GET /payroll/reports/pph21?period=YYYY-MM` — rekap masa.
- `GET /payroll/reports/pph21/withholdings?period=` — daftar bukti potong.
- Semua mendukung `format=csv` untuk diunduh. Format impor e-Bupot / SIPP / e-Dabu belum di fase ini (§8 #13).

**Backoffice**

- Menu baru **Statutory Reports** di grup Salary (§5.2), tab **BPJS** dan **PPh 21**, filter periode, tombol export CSV. Tanpa stat card; total setor tampil sebagai baris ringkasan di atas tabel.

**Docs:** [04-payroll-run.md](../modules/payroll/04-payroll-run.md) (laporan setelah run final), [05-api-contract.md](../modules/payroll/05-api-contract.md), README payroll (cakupan: laporan rekap masuk, integrasi DJP/BPJS tetap di luar).

**Kriteria selesai:** untuk satu periode, total rekap BPJS = Σ `bpjs_employee` + Σ `bpjs_employer` payslip final; rekap per program = Σ `bpjs_details`; total PPh 21 = Σ `pph21` payslip final; karyawan DTP muncul dengan nilai DTP; run belum final tidak ikut total.

---

## 5. Pemetaan Menu Backoffice

Prinsip pembagian:

- **HR Setting**: konfigurasi atau master data yang jarang berubah (komponen, structure, schedule, pajak/BPJS, policy approval).
- **Salary** (grup payroll di sidebar, `/tenants/salary/*`): pekerjaan operasional per periode (kompensasi karyawan, periode, run, adjustment, pembayaran, slip).
- Approval memakai engine generik, sehingga konfigurasi policy-nya ada di HR Setting dan berlaku untuk semua jenis dokumen, bukan khusus payroll.
- Label menu dalam bahasa Inggris. Menu didaftarkan di `app/layouts/default.vue`.

### 5.1 HR Setting

| Sub-grup | Menu | Status | Fase | Isi |
|---|---|---|---|---|
| Payroll | **Salary Component** | Ada (`hr-setting/salary-component.vue`) | P1, P3 | + kolom `sequence`, `is_active`, filter aktif [P1]. Editor formula dengan riwayat versi (draft → published, validate) sebagai drawer/tab [P3]. |
| Payroll | **Salary Structures** | Baru (`hr-setting/salary-structures.vue`) | P1, P2, P3 | Tab **Components** (default amount, locked, sequence), **Branch Overrides**, **Formulas** per komponen structure [P3], **Preview / Simulator** [P2]. Menggantikan mock `payroll/grade-templates.vue`. |
| Payroll | **Payroll Schedules** | Baru (`hr-setting/payroll-schedules.vue`) | P4 | List schedule (code, pay cycle, default). Detail: **Rules** berversi (period start day, attendance cutoff day, pay day, holiday shift) dan aksi **Generate Periods**. |
| Payroll | **Tax and BPJS** | Ada (`hr-setting/tax-bpjs.vue`) | P9, P10, P11 | + tab **PTKP** dan **Tax Parameters** [P10]. Default program BPJS & kelas risiko JKK karyawan baru [P11]. Riwayat policy `payroll_config` ditambahkan di sini bila P9 dikerjakan. |
| Approval | **Approval Policies** | Baru (engine generik) | P7 | Policy per `document_type` (leave, payroll_run, overtime, …). Payroll hanya menambah `document_type = payroll_run`. |

Formula belum diberi menu sendiri. Menu **Formulas** terpisah baru diperlukan bila satu formula dipakai ulang oleh banyak komponen.

### 5.2 Salary (payroll)

| Menu | Status | Fase | Isi |
|---|---|---|---|
| **Overview** | Mock (`payroll/index.vue`) | opsional | Dashboard ringkas periode aktif. Dipindah ke grup Salary bila dipakai. |
| **Compensations** | Baru (`salary/compensations.vue`), **menggantikan Employee Payrolls** (`salary/employees.vue` dihapus) | P2, P4 | Pintu masuk tim payroll untuk data per karyawan. List **berbasis karyawan**: satu baris = satu karyawan + versi kompensasi aktifnya (structure, cabang, BASIC, effective from, schedule). Karyawan **tanpa kompensasi**, **tanpa tax profile**, atau **BPJS belum lengkap** [P11] tetap muncul, dengan filter khusus agar karyawan baru yang belum disetup terlihat sebelum run. Aksi: bulk assign structure, bulk kenaikan/promosi (buat versi draft), activate. Klik baris membuka `PayrollEmployeePanel` (§5.3) sebagai halaman detail, sehingga `payroll_officer` tidak butuh `employees:read`. |
| **Payroll Periods** | Baru (`salary/periods.vue`) | P4 | Daftar periode per schedule (start/end, cutoff, pay date, status), aksi lock/close. |
| **Payroll Runs** | Ada (`salary/runs.vue`) | P4–P8 | Form create memilih **period** [P4]. Detail run: tab **Employees** (status ok/error/excluded, exclude/include) [P5], **Inputs** (snapshot absensi/cuti, input manual, refresh) [P5], **Approval** timeline [P7], **Payments** (batch, split, bank file, bukti bayar) [P8]. |
| **Adjustments** | Baru (`salary/adjustments.vue`) | P6 | Daftar adjustment (pending/applied/cancelled), create & cancel. Menggantikan mock `payroll/adjustments.vue`. |
| **Payments** | Baru, opsional (`salary/payments.vue`) | P8 | Semua payment batch lintas run untuk tim Finance. Alur utama tetap dari tab Payments di detail run. |
| **Payslips** | Ada (`salary/payslips.vue`) | P5, P11, P12 | + sumber nilai per line dan versi formula [P5]. Rincian iuran BPJS per program dan snapshot pajak (PTKP, TER, perlakuan, DTP) [P11]. PPh ditanggung perusahaan dan earning DTP [P12]. |
| **Statutory Reports** | Baru (`salary/statutory-reports.vue`) | P13 | Tab **BPJS** (rekap per lembaga & program, daftar peserta) dan **PPh 21** (rekap masa, daftar bukti potong), filter periode, export CSV. |

### 5.3 Employee Info › tab Payroll

Data payroll yang melekat pada satu karyawan ditampilkan di detail karyawan (`employee/[id].vue`) sebagai **satu tab top-level "Payroll"** dengan sub-tab, mengikuti pola tab Others. Isinya dibuat sebagai komponen bersama (mis. `PayrollEmployeePanel`) yang juga dipakai sebagai halaman detail menu **Compensations** (§5.2), sehingga logikanya tidak dobel.

| Sub-tab | Fase | Isi |
|---|---|---|
| **Compensation** | P2, P4 | Riwayat versi kompensasi (structure, cabang, effective from/to, status, reason), aksi buat versi baru & activate. Field **Payroll Schedule** (assignment + effective date) di sini, tidak dibuat tab sendiri [P4]. |
| **Pay Components** | P2 | Komponen manual / one-time (`employee_components.compensation_id` NULL). Komponen recurring tampil read-only di Compensation. Menggantikan section "Assigned Pay Components" halaman Employee Payrolls. |
| **Tax & BPJS** | ada, P11, P12 | Tax profile (PTKP, metode PPh 21 yang benar-benar dipakai calculator [P12], perlakuan pajak `subject` / `dtp` / `exempt`), NPWP read-only dari Core HR, dan kepesertaan BPJS per program (ikut, nomor kepesertaan, kelas risiko JKK, dasar upah, berlaku) [P11]. Dipindah dari section "Tax Profile" halaman Employee Payrolls (dihapus) ke komponen bersama. |
| **Payslips** | P5 | Riwayat slip per periode (read-only, link ke slip). Adjustment karyawan ditampilkan read-only di sini [P6]; pembuatan adjustment tetap dari menu Adjustments. |

Aturan akses:

- Tab tampil hanya bila fitur payroll aktif dan user punya `payroll:read`. Admin HR dengan `employees:read` saja tidak melihat gaji.
- Data di-load lazy dari endpoint payroll saat tab dibuka, bukan ikut fetch employee.
- Edit Compensation/Pay Components/BPJS enrollment butuh `payroll:config`; edit tax profile mengikuti izin endpoint tax profile yang berlaku sekarang.

Tidak masuk tab ini karena level tenant atau per periode: Salary Structures, Payroll Schedules, Payroll Periods, Payroll Runs, Payments, Approval Policies, Compensations (bulk).

### 5.4 Di luar kedua grup

| Menu | Keterangan |
|---|---|
| **My Approvals** (inbox) | Generik lintas `document_type` (`GET /approval/inbox`), tempat approver memproses payroll run, leave, dan lainnya. Diletakkan di level atas atau ESS, bukan di HR Setting. Detail run tetap bisa approve langsung. |
| Employees → Employee Info | Tab **Payroll** (§5.3). Rekening bank tetap dikelola di Others › Bank Accounts (Core HR); payroll hanya membaca, P8 menambah flag rekening utama di sana. |
| Loans (`payroll/loans.vue`) | Tetap mock, di luar cakupan rencana ini (lihat §2 #6). |

Halaman mock di `/tenants/payroll/*` dihapus setelah penggantinya live.

### 5.5 Pertanyaan terbuka menu

| # | Hal | Usulan |
|---|---|---|
| 1 | Lokasi **Approval Policies** | Plan approval ([2026-11-05-approval-berjenjang.md](./2026-11-05-approval-berjenjang.md) §7) menaruhnya di `settings/approval-policies.vue` (Company Settings). Rencana ini memakai HR Setting. Salah satu plan perlu diselaraskan. |
| 2 | **Payroll Periods** di Salary atau tab di Payroll Schedules | Salary, karena lock/close adalah operasi rutin per periode. |
| 3 | **Compensations** menu sendiri atau cukup sub-tab Payroll › Compensation | **Diputuskan: menu sendiri**, menggantikan Employee Payrolls. Isi Employee Payrolls (payroll profile, tax profile, pay component) sudah terserap ke kompensasi, schedule, dan tab Payroll, dan tim payroll tetap butuh pintu masuk tanpa `employees:read`. |
| 4 | Nama grup **Salary** diganti **Payroll** | Belum diputuskan. |

---

## 6. Dampak ke Kode Existing

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
| `domain/payrollrun/service/pph21_constants.go` (dihapus), `calculator.go`, `domain/taxprofile/*`, `domain/payrollconfig/*`, `seed_defaults.go`, `interfaces/http/payrollconfig/*` | P10 |
| `domain/bpjsenrollment` (baru), `domain/taxprofile/*`, `calculator.go` (filter program, JKK per risiko, rincian iuran), `calculate_run.go`, `domain/payrollconfig/entity/payroll_config.go`, `core-hr/contract.go` (NPWP), `domain/payslip/entity/*` + migrasi kolom snapshot | P11 |
| `calculator.go` (metode PPh 21 gross / nett), `calculate_run.go`, `domain/taxprofile/entity` (default `gross`), `domain/payslip/entity/*` + migrasi, `seed_defaults.go` (system component `PPH21_DTP`, flag BPJS), `domain/payrollconfig/entity/bpjs_config.go` + `constant.EmployeeContributionReducesPPh21` (dihapus), Backoffice `hr-setting/tax-bpjs.vue` (checkbox flag) | P12 |
| `application/payrollreport` (baru, query-only), `interfaces/http/payrollreport` (baru), Backoffice `salary/statutory-reports.vue` | P13 |
| Backoffice `app/pages/tenants/payroll/*`, composable `usePayroll`, `types/payroll` | P1, P2, P4–P8 |
| Backoffice `app/pages/tenants/employee/[id].vue` (tab Payroll), `salary/compensations.vue` (baru, `salary/employees.vue` dihapus), komponen bersama `PayrollEmployeePanel`, `composables/useEmployeeRecordSections.ts` (flag rekening utama) | P2, P4, P5, P8 |

---

## 7. Dokumentasi yang Diubah per Fase

| Dokumen | Fase |
|---|---|
| [06-data-model.md](../modules/payroll/06-data-model.md) | semua fase |
| [05-api-contract.md](../modules/payroll/05-api-contract.md) | semua fase |
| [09-grade-templates.md](../modules/payroll/09-grade-templates.md) | P1, P2 |
| [08-formula-engine.md](../modules/payroll/08-formula-engine.md) | P3 |
| [03-calculation.md](../modules/payroll/03-calculation.md) §4 (PTKP & biaya jabatan dari master) | P10 |
| [03-calculation.md](../modules/payroll/03-calculation.md) §3, §4.4; [07-integration.md](../modules/payroll/07-integration.md) (NPWP) | P11 |
| [03-calculation.md](../modules/payroll/03-calculation.md) §4 (metode PPh 21 gross / nett) | P12 |
| [03-calculation.md](../modules/payroll/03-calculation.md) §4.2 (masa pajak terakhir, penyetahunan, biaya jabatan proporsional, A1 sebelumnya); [07-integration.md](../modules/payroll/07-integration.md) (tanggal masuk/keluar Core HR) | P16 |
| [04-payroll-run.md](../modules/payroll/04-payroll-run.md) (laporan), [README.md](../modules/payroll/README.md) (cakupan) | P13 |
| [04-payroll-run.md](../modules/payroll/04-payroll-run.md) | P4–P8 |
| [03-calculation.md](../modules/payroll/03-calculation.md) | P2, P5, P6 |
| [07-integration.md](../modules/payroll/07-integration.md) | P4, P7, P8 |

---

## 8. Risiko & Pertanyaan Terbuka

| # | Hal | Catatan |
|---|---|---|
| 1 | Hasil calculate berubah setelah backfill P2/P3 | Wajib test perbandingan sebelum/sesudah backfill pada data tenant nyata (staging). |
| 2 | Run lama tanpa `period_id` | Backfill P4; kode tetap toleran `period_id` NULL. |
| 3 | Karyawan tanpa kompensasi | **Diputuskan (P15):** karyawan tanpa versi kompensasi tidak ikut run; jalur pra-P2 dihapus (data di-fresh). |
| 4 | Siklus `weekly` / `biweekly` | **Diputuskan 2026-11-11: wajib didukung** (karyawan harian / per jam, dibayar mingguan, dua mingguan, dst.). Schedule berbasis hari di P4; PPh 21 TER harian & rekonsiliasi Desember selektif di P14; plafon BPJS per bulan di P4 (usulan). |
| 5 | Hubungan structure ↔ `job_grade` | 1:1 (doc 09 §6) atau bebas (banyak structure per grade, mis. beda cabang)? Rencana ini memakai `grade_code` nullable dan **tidak** memaksa 1:1. |
| 6 | Split payment & banyak rekening | Core HR menyimpan banyak rekening; perlu flag rekening utama di Core HR bila belum ada. |
| 7 | Ketergantungan P7 pada engine approval | Bila engine tertunda, P7 ikut tertunda; maker-checker satu langkah tetap berlaku. |
| 8 | Career Mutation mengubah cabang/jabatan tanpa versi kompensasi baru | `employee_compensations.branch_id` menentukan override cabang, jadi karyawan yang pindah Bandung → Jakarta tetap memakai BASIC Bandung. Mutasi yang mengubah cabang/jabatan sebaiknya mengingatkan (atau menawarkan) pembuatan versi kompensasi baru. Diputuskan di P2. |
| 9 | Pajak tanpa NPWP | `HasNPWP` sudah dikirim ke calculator tetapi belum dipakai. Bila tarif lebih tinggi untuk karyawan tanpa NPWP diterapkan, persentasenya menjadi kolom baru di `pph21_tax_parameters`, bukan konstanta. Perlu konfirmasi apakah masih relevan setelah NIK = NPWP. |
| 10 | `pph21_method` gross-up | `gross` dan `nett` dikerjakan di P12. **Gross-up belum disediakan** (diputuskan user 2026-11-10): ditolak saat simpan dan tidak ada di UI. Bila nanti dibutuhkan, menjadi fase sendiri: tunjangan PPh 21 (`PPH21_ALLOWANCE`, taxable) dicari sebagai `T` terkecil dengan `PPh(G + T) ≤ T`, termasuk perlakuan di batas lapisan TER dan rekonsiliasi Desember. |
| 11 | JKK dengan beberapa kelas risiko sebelum P11 | Bila tenant sudah membuat lebih dari satu baris JKK di `bpjs_config`, calculator sekarang kemungkinan menjumlahkan semuanya. Perlu dicek dengan test sebelum P11 dan, bila benar, diperbaiki lebih dulu sebagai bug. |
| 12 | Masa pajak PPh 21 dan run adjustment | Secara aturan masa pajak = bulan penghasilan dibayarkan. Sebelum P4, P13 memakai `payroll_runs.period`; setelah P4 sebaiknya memakai `pay_date` periode. Adjustment (P6) yang membayar selisih bulan lalu masuk masa bulan dibayarnya, bukan bulan asalnya — perlu konfirmasi dengan tim pajak. |
| 13 | Format impor resmi (e-Bupot 21/26, SIPP BPJS TK, e-Dabu BPJS Kes) | P13 hanya CSV rekap. Template impor resmi sering berubah; dibuat fase/ekspor sendiri bila dibutuhkan. Snapshot P11 sudah menyimpan semua kolom yang diperlukan. |
| 14 | Payslip sebelum P11 tanpa snapshot | Laporan periode lama hanya bisa menampilkan total (tanpa rincian per program/PTKP). Backfill dari data saat ini **tidak** dilakukan karena bisa berbeda dengan kondisi saat dihitung. |
| 15 | Premi BPJS yang dibayar perusahaan sebagai bruto pajak | **Diputuskan:** flag `employer_contribution_taxable` di `bpjs_config`, dikerjakan di P12. Default seed Kesehatan, JKK, JKM = `true`. |
| 16 | DTP bersama metode `nett` | **Diputuskan:** DTP dibayarkan sebagai earning `PPH21_DTP`. Kombinasi dengan gross-up belum relevan karena gross-up belum disediakan. |
| 17 | Aturan masa pajak terakhir, penyetahunan, biaya jabatan proporsional, A1 sebelumnya (P16) | **Perlu konfirmasi tim pajak** sebelum P16: (a) batas biaya jabatan Rp500 rb × bulan untuk masa kerja < 12 bulan; (b) penyetahunan hanya untuk subjek pajak DN yang datang/pergi di tengah tahun; (c) A1 pemberi kerja sebelumnya digabung oleh pemberi kerja baru atau oleh karyawan di SPT; (d) pengembalian kelebihan potong di slip terakhir. |

---

### 8a. Pertanyaan untuk Tim Pajak (P14, P16)

Dicatat 2026-11-11. P14 dan P16 baru dikerjakan setelah semua butir dijawab. Mohon sertakan 1–2 contoh angka untuk butir 1, 7, 8 dan 10; contoh itu menjadi kriteria uji di [lampiran simulasi](./2026-11-10-payroll-erd-simulasi-satu-periode.md).

**P14 — PPh 21 pegawai tidak tetap & rekonsiliasi Desember**

| # | Pertanyaan | Jawaban |
|---|---|---|
| 1 | Pegawai tidak tetap yang dibayar harian / mingguan / per jam / borongan memakai **TER harian** atas rata-rata penghasilan per hari: ≤ Rp450.000 → 0%; > Rp450.000 s.d. Rp2.500.000 → 0,5%; > Rp2.500.000 → Pasal 17 atas 50% bruto. Benar? | |
| 2 | Pegawai tidak tetap yang dibayar **bulanan** memakai TER bulanan **tanpa** rekonsiliasi Pasal 17 akhir tahun. Benar? | |
| 3 | Jumlah hari untuk rata-rata per hari: hari hadir + cuti berbayar dalam periode, hari kalender, atau hari kerja terjadwal? | |
| 4 | Karyawan dengan beberapa run di masa Desember (mingguan / dua mingguan): Pasal 17 setahun hanya di **run regular terakhir** (tanggal bayar paling akhir di Desember), run Desember sebelumnya tetap TER. Benar? | |
| 5 | Run THR / bonus di Desember tetap TER dan hanya ikut dijumlahkan di rekonsiliasi (tidak memicu Pasal 17 sendiri). Benar? | |
| 6 | Masa pajak = **bulan penghasilan dibayarkan** (periode 23–29 Nov dibayar 2 Des → masa Desember), termasuk adjustment yang membayar selisih bulan lalu. Benar? | |

**P16 — Masa pajak terakhir & data pajak tahunan**

| # | Pertanyaan | Jawaban |
|---|---|---|
| 7 | Karyawan berhenti di tengah tahun (resign, PHK, pensiun, meninggal): Pasal 17 dihitung di **bulan keluar** atas penghasilan Jan s.d. bulan keluar, tidak disetahunkan? Kelebihan potong dikembalikan langsung di slip terakhir, atau mekanisme lain? | |
| 8 | Karyawan masuk di tengah tahun: tidak disetahunkan, PTKP setahun penuh, dan batas biaya jabatan = **Rp500.000 × jumlah bulan bekerja** (bukan Rp6 jt)? | |
| 9 | Penyetahunan hanya untuk yang **mulai / berhenti menjadi subjek pajak dalam negeri** di tengah tahun (WNA datang, meninggalkan Indonesia selamanya)? Ada kasus lain? | |
| 10 | Bukti potong 1721-A1 pemberi kerja sebelumnya (pindah kerja dalam tahun yang sama): pemberi kerja baru **wajib / boleh / tidak boleh** menggabungkannya di perhitungan Desember, atau digabung karyawan di SPT tahunan? Bila digabung: komponen A1 apa saja (bruto, iuran pensiun/JHT, PPh dipotong), dan apakah bulan di pemberi kerja lama menambah batas biaya jabatan? | |
| 11 | Karyawan keluar lalu masuk kembali di perusahaan yang sama dalam tahun yang sama: satu masa kerja atau dua? | |

**Umum**

| # | Pertanyaan | Jawaban |
|---|---|---|
| 12 | Setelah NIK berlaku sebagai NPWP, apakah tarif lebih tinggi untuk karyawan tanpa NPWP (dulu +20%) masih perlu diterapkan dalam kasus tertentu? (lihat Risiko #9) | |

---

## 9. Verifikasi (per fase)

- Unit test domain untuk setiap entity baru, termasuk aturan effective-dating & larangan overlap (pola `*_test.go` yang sudah ada).
- Test `CalculateRunUseCase`: karyawan jalur lama vs jalur kompensasi menghasilkan angka identik untuk data backfill.
- Formula: publish v2 tidak mengubah recalculate periode sebelum `effective_from` v2.
- Period: variabel absensi mengikuti `cutoff_from/cutoff_to`.
- Snapshot: perubahan absensi setelah calculate tidak memengaruhi recalculate tanpa `refresh_inputs`.
- Approval: policy 1 step = perilaku sekarang; pembuat run ditolak sebagai approver.
- Payment: Σ payment per payslip = net; run otomatis `paid`.
- PTKP & parameter pajak: test `decemberPPh21` dengan master hasil seed = hasil konstanta lama; versi PTKP baru hanya berlaku mulai 1 Januari tahun berikutnya; grep kode tidak menemukan `54_000_000` / `6_000_000` lagi.
- BPJS enrollment: program `is_enrolled = false` tidak dihitung; JKK mengikuti kelas risiko karyawan; tidak ada overlap per `(employee_id, program)`; backfill tenant satu kelas risiko menghasilkan angka identik.
- `go build ./... && go test ./internal/modules/payroll/...`, lalu `graphify update .` di HR-SYSTEM-API.
- Migrasi & backfill dijalankan user.
