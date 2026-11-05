<!-- 📁 plans/2026-11-05-approval-berjenjang.md -->
# Rencana: Engine Approval Berjenjang (Generik, Leave Duluan)

| | |
|---|---|
| **Status** | **Rencana — belum dikerjakan.** |
| **Tanggal** | 2026-11-05 |
| **Pemicu** | Admin perlu mengatur bahwa sebuah jenis dokumen (mulai dari pengajuan cuti) butuh persetujuan **beberapa orang secara berjenjang**, misalnya atasan langsung → user tertentu dari role HR → direktur. Saat ini approval leave dipaksa satu step, sedangkan dokumen lain hanya punya approve/reject satu langkah yang digate permission. |
| **Keputusan user** | (1) Engine **generik lintas modul**, leave menjadi consumer pertama. (2) Approver konkret ditentukan **admin di konfigurasi**; sistem me-resolve otomatis saat submit. (3) Record per step menyimpan **`user_id` approver**, bukan role id atau kode entitas. (4) Sumber atasan: **`manager_id`, fallback kepala unit**. (5) **Grade jabatan** dimasukkan ke Fase 0. Lihat §3. |
| **Modul terdampak** | Core HR (reporting line, position), Leave, Auth/RBAC (permission baru), modul baru `approval`, Backoffice. Fase berikutnya: Attendance (lembur, koreksi), Core HR (mutasi), Payroll |
| **Repo terkait** | HR-SYSTEM-API, HR-SYSTEM-BACKOFFICE, HR-SYSTEM-DOCS |
| **Mengubah keputusan** | [modules/leave/04-request-approval.md](../modules/leave/04-request-approval.md) §2–§3 dan [modules/leave/06-data-model.md](../modules/leave/06-data-model.md) §2.4–§2.5 (approval flow milik modul leave dipindah ke modul `approval`) |

---

## 1. Ringkasan

Kondisi saat ini:

- Leave punya `approval_flows`, `approval_steps`, dan `leave_request_approvals`, tapi semua tenant dipaksa memakai flow satu step "1 Level (Atasan Direct)" (migrasi `20261016000002`). Approver di-resolve **dinamis saat approve** (`manager_id` atau nama role), jadi tidak ada snapshot siapa yang seharusnya meng-approve.
- Lembur (request, order, transaksi), koreksi absensi, mutasi, dan payroll run masing-masing punya approve/reject satu langkah sendiri, hanya digate permission (`attendance:approve`, `mutation_request:approve`, `payroll:approve`).

Target: satu engine approval yang menyimpan approval dalam beberapa layer record:

```
KONFIGURASI (template)                            RUNTIME (per dokumen)
approval_policies ─< approval_policy_steps        approval_requests ─< approval_request_steps ─< approval_actions
(per document_type,  (urutan + cara               (1 per dokumen,      (snapshot per step:        (log keputusan,
 opsional per subtype) menentukan approver)         status, step aktif)  approver_user_id)          immutable)
```

Engine baru bisa dipakai dengan aman setelah reporting line di Core HR dimatangkan (Fase 0, §2).

---

## 2. Fase 0 — Pematangan Struktur Organisasi (prasyarat)

### 2.1 Hasil audit

| Komponen | Kondisi | Dampak ke approval |
|---|---|---|
| `employees.manager_id` | Tersimpan dan perubahannya tercatat di `employment_history` (`manager_change`). Query bawahan rekursif sudah ada (`ListSubordinates`). **Tidak ada validasi**: atasan tidak dicek ada/satu tenant/aktif, bisa diri sendiri, rantai melingkar tidak dicegah (`create_employee.go`, `update_employee.go`, bulk import). | Step "atasan level 2" harus naik rantai; siklus membuat resolusi tidak berhenti. |
| Field Direct Manager (Backoffice) | **Di-comment** di form create & edit karyawan (commit `55cc495`). Hanya bisa diisi lewat bulk import. | Data atasan praktis kosong → step "atasan" selalu jatuh ke fallback. |
| Org unit | Pohon via `parent_id` dengan cek siklus saat reparent. `head_employee_id` bisa diisi dari UI. **Belum dipakai modul mana pun.** | Bisa menjadi sumber atasan berbasis unit (sudah disebut di [core-hr/02-org-structure.md](../modules/core-hr/02-org-structure.md) §4) tapi belum diimplementasikan. |
| Position | Hanya judul, unit, headcount. Tidak ada level/grade (`job_grades` dihapus di `20260903000003_remove_catalog`). | Step berbasis jabatan belum bisa dibuat. |
| Assignment | Matang: riwayat cabang/unit/jabatan. | Dipakai untuk menentukan unit karyawan saat submit. |
| `employees.user_id` | Opsional — tidak semua karyawan punya akun. | Atasan tanpa akun tidak bisa menjadi approver (engine memakai `user_id`). |

### 2.2 Validasi `manager_id` (API, Core HR)

- Domain method `Employee.AssignManager(managerID *string)` dipanggil dari use case create, update, dan bulk import.
- Aturan:
  - manager harus ada, satu tenant, dan aktif;
  - tidak boleh dirinya sendiri;
  - **cek siklus**: naik rantai `manager_id` dari calon atasan (recursive CTE, pola sama dengan `ListSubordinates`); tolak bila bertemu karyawan itu sendiri.
- Error code baru: `MANAGER_SELF`, `MANAGER_CYCLE`, `MANAGER_INVALID`.
- Saat karyawan diterminasi/nonaktif: bawahan yang masih menunjuk dia **tidak** di-auto-clear, cukup ditampilkan sebagai peringatan di UI (memakai `GET /employees/:id/subordinates`).
- `OrgUnit.SetHead`: kepala unit harus karyawan aktif satu tenant.

### 2.3 Reporting line resolver (API, Core HR contract)

Satu fungsi yang dipakai engine approval dan modul lain:

```go
// core-hr contract.go
ResolveManagerChain(ctx, tenantID, employeeID string, levels int) ([]ReportingManager, error)
// ReportingManager{EmployeeID string, UserID *string, Source: "manager_id" | "org_unit_head"}
```

Aturan per level:

1. Pakai `manager_id` bila terisi dan aktif.
2. Bila kosong → **kepala unit** dari `current_org_unit_id`. Bila kepala unit adalah karyawan itu sendiri (atau kosong) → naik ke kepala unit induk (`parent_id`) sampai ketemu atau habis.
3. Level berikutnya diulang dari atasan yang ditemukan.

- Ada batas iterasi sebagai pengaman terhadap data lama yang rusak.
- Hasil dengan `UserID == nil` tetap dikembalikan; engine yang memutuskan lewat `on_unresolved` (§4.2).

### 2.4 Grade jabatan

- Common code group baru `job_grade` (tenant-defined, mis. Staff → Supervisor → Manager → General Manager → Director). **Urutan elemen = rank.** Seed default via migrasi, mengikuti pola `20261023000003_employee_common_codes`.
- Kolom `positions.grade_code` (nullable) + validasi code tersedia di create/update position (pola sama dengan validasi `organization_type` di `CreateOrgUnitUseCase`).
- Belum dipakai engine di Fase 1; disiapkan untuk step `position` / "atasan pertama dengan grade ≥ X" (Fase 3).

### 2.5 Backoffice

- Munculkan lagi field **Direct Manager** di `pages/tenants/employee/create.vue` dan `pages/tenants/employee/[id].vue` (kode yang di-comment tinggal dipulihkan) + tampilkan error validasi dari API.
- Profil karyawan: tampilkan **"Effective manager"** hasil resolver beserta sumbernya (manager langsung / kepala unit).
- Halaman positions: field **Grade** (select dari common code `job_grade`).
- Halaman organizations: peringatan bila unit tidak punya kepala.
- (Opsional) laporan "karyawan tanpa atasan efektif / atasan tanpa akun user" untuk pembersihan data sebelum approval multi-step diaktifkan.

---

## 3. Keputusan

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Cakupan engine | Generik lintas modul. Leave consumer pertama, dokumen lain menyusul bertahap. |
| 2 | Siapa yang menentukan approver konkret | Admin di konfigurasi. Sistem me-resolve otomatis saat submit. |
| 3 | Apa yang disimpan di record per step | `user_id` approver hasil resolve (snapshot), bukan role id / kode entitas. Role hanya filter di UI saat admin memilih user. |
| 4 | Sumber atasan | `manager_id`, fallback kepala unit (naik ke unit induk). |
| 5 | Grade jabatan | Masuk Fase 0, via common code `job_grade`. |

---

## 4. Data Model (modul `approval`)

### 4.1 `approval_policies` — dokumen apa yang butuh approval

| Field | Tipe | Keterangan |
|---|---|---|
| `id`, `tenant_id` | UUID | |
| `document_type` | string | `leave_request` (nanti `overtime_request`, `attendance_correction`, `mutation_request`, …) |
| `subject_ref` | UUID (nullable) | Mis. `leave_type_id` agar flow bisa beda per jenis cuti. Null = default untuk `document_type` |
| `name` | string | |
| `is_active` | boolean | |
| `created_at`, `updated_at` | timestamp | |

**Unik:** `(tenant_id, document_type, subject_ref)`. Resolusi saat submit: cari policy spesifik (`subject_ref`), lalu fallback ke default (`subject_ref` null).

### 4.2 `approval_policy_steps` — siapa saja dan urutannya

| Field | Tipe | Keterangan |
|---|---|---|
| `id`, `policy_id` | UUID | |
| `step_order` | int | 1..N tanpa celah/duplikat |
| `approver_type` | enum | `direct_manager` / `user` |
| `manager_level` | int (nullable) | Untuk `direct_manager`: 1 = atasan langsung, 2 = atasan dari atasan (via `ResolveManagerChain`) |
| `approver_user_id` | UUID (nullable) | Untuk `user`: user yang dipilih admin |
| `role_id_hint` | UUID (nullable) | **Hanya untuk UI** (filter "pilih user dengan role X" + label). Tidak dipakai untuk otorisasi |
| `on_unresolved` | enum | `skip` / `fallback_user` — bila atasan tidak ditemukan atau tidak punya akun |
| `fallback_user_id` | UUID (nullable) | |

### 4.3 `approval_requests` — instance per dokumen

| Field | Tipe | Keterangan |
|---|---|---|
| `id`, `tenant_id` | UUID | |
| `document_type`, `document_id` | string, UUID | Referensi polimorfik, tanpa FK (konvensi lintas modul) |
| `policy_id` | UUID | Policy yang dipakai saat submit |
| `requester_user_id`, `requester_employee_id` | UUID | |
| `status` | enum | `pending` / `approved` / `rejected` / `cancelled` |
| `current_step` | int | |
| `submitted_at`, `completed_at` | timestamp | |

**Unik:** `(tenant_id, document_type, document_id)` untuk instance aktif.

### 4.4 `approval_request_steps` — snapshot approver

| Field | Tipe | Keterangan |
|---|---|---|
| `id`, `approval_request_id` | UUID | |
| `step_order` | int | |
| `approver_user_id` | UUID | **User konkret hasil resolve saat submit** |
| `source` | string | `direct_manager:L1`, `user`, `fallback` — penjelasan di UI |
| `status` | enum | `waiting` (belum giliran) / `pending` (giliran) / `approved` / `rejected` / `skipped` |
| `decided_at` | timestamp (nullable) | |
| `note` | string | |

Satu baris per step, karena tipe `direct_manager` dan `user` selalu menghasilkan satu orang. **Perubahan policy setelah submit tidak mempengaruhi dokumen yang sudah berjalan.**

### 4.5 `approval_actions` — audit log immutable

| Field | Tipe | Keterangan |
|---|---|---|
| `id`, `approval_request_id` | UUID | |
| `step_id` | UUID (nullable) | |
| `actor_user_id` | UUID | |
| `action` | enum | `submit` / `approve` / `reject` / `cancel` / `skip` |
| `note` | string | |
| `created_at` | timestamp | |

**Indeks:** `approval_request_steps (approver_user_id, status)` untuk inbox.

---

## 5. Aturan Runtime

| Aksi | Aturan |
|---|---|
| **Submit** | Resolve policy → resolve `user_id` tiap step → insert request + steps (step pertama `pending`, sisanya `waiting`) → action `submit`. Satu transaksi dengan pembuatan dokumen. |
| Resolve gagal | Ikuti `on_unresolved` (`skip` / `fallback_user`). |
| Approver = pemohon | Step di-`skip`. |
| User sama di step berurutan | Step kedua di-`skip` (mempertahankan aturan "satu user tak boleh approve dua step"). |
| Tidak ada policy aktif | Dokumen auto-approved (action `skip`). |
| **Approve** | Hanya `approver_user_id` step `pending` (plus permission modul, mis. `leave:approve`). Row request di-lock (`FOR UPDATE`). Step → `approved`, step berikutnya → `pending`; bila step terakhir, request → `approved` dan outcome `FinalApproved`. |
| **Reject** | Step dan request → `rejected`, outcome `Rejected`. |
| **Cancel** | Oleh pemohon selama `pending`: request → `cancelled`. |
| Approver salah | `NOT_CURRENT_APPROVER`. |
| Dua approve bersamaan di step sama | Yang kedua mendapat `INVALID_STATE` (sama seperti leave sekarang). |

---

## 6. Arsitektur Kode (API)

Modul baru `internal/modules/approval/` mengikuti pola DDD yang ada (`domain/`, `application/`, `infrastructure/persistence`, `interfaces/http`, `module.go`, `contract.go`), di-wire di `cmd/api/main.go`.

**Contract** yang dipakai modul pemilik dokumen:

```go
type Engine interface {
    Submit(ctx, tx, SubmitInput{DocumentType, DocumentID, SubjectRef, RequesterUserID, RequesterEmployeeID}) (*Request, error)
    Decide(ctx, tx, DecideInput{DocumentType, DocumentID, ActorUserID, Decision, Note}) (Outcome, error) // Advanced | FinalApproved | Rejected
    Cancel(ctx, tx, CancelInput{...}) error
    GetByDocument(ctx, docType, docID string) (*RequestView, error) // timeline
}
```

- Modul pemilik dokumen **tetap memegang status dokumen dan efek bisnisnya** (saldo cuti, dsb.). Ia memanggil `Decide` di dalam transaksinya sendiri lalu bertindak berdasarkan `Outcome`. Tanpa callback/event → lebih sederhana dan atomik.
- Port `ManagerResolver` → gateway ke `coreHR.ResolveManagerChain` (§2.3). `FindEmployeeByUserID` sudah tersedia di contract Core HR.

**Endpoint** (`/api/v1/approval`):

| Endpoint | Permission | Keterangan |
|---|---|---|
| `GET/POST/PUT/DELETE /policies` (+ steps nested) | `approval:config` (baru) | Konfigurasi |
| `GET /inbox` | login | Step `pending` milik user login, lintas `document_type` |
| `GET /requests/by-document/:type/:id` | sesuai dokumen | Timeline step + actions |

### 6.1 Integrasi Leave (consumer pertama)

- Submit leave → `Engine.Submit` dalam transaksi yang sama, `SubjectRef = leave_type_id`.
- `review_leave_request.go` → logika `GuardStep` + `approvalflow/service/authorize.go` diganti `Engine.Decide`. `FinalApproved` → konsumsi saldo + ledger (logika lama). `Rejected` → lepas reservasi (logika lama).
- Cancel → `Engine.Cancel`.
- `leave_requests.current_step` dipertahankan sementara (diisi dari engine) agar list lama tidak rusak. Endpoint `/leave/approval-flows` ditandai deprecated.

### 6.2 Migrasi (ditulis, dijalankan oleh user)

1. `create_approval_tables` — 5 tabel di §4 + indeks.
2. Backfill policy default `leave_request` per tenant dari `approval_flows` leave yang ada (`manager` → `direct_manager` L1; `role` → user pertama pemegang role sebagai `fallback`, ditandai untuk ditinjau). Buat `approval_requests`/`steps` untuk leave yang masih `pending`, approver di-resolve dari reporting line saat ini.
3. Seed permission `approval:config` + tambahkan ke role template admin.
4. Tabel leave lama (`approval_flows`, `approval_steps`, `leave_request_approvals`) **tidak dihapus** di fase ini.

Fase 0: migrasi `positions.grade_code` + seed common code `job_grade`.

---

## 7. Backoffice

- Halaman baru `pages/tenants/settings/approval-policies.vue` (pola `AppListPage` + `AppFormSlideover`, contoh `hr-setting/overtime-rules.vue`):
  - editor step yang bisa diurutkan: **Direct manager** (+ level) atau **Specific user** (pilih role sebagai filter → pilih user);
  - fallback bila atasan tidak ditemukan;
  - untuk leave: berlaku untuk semua jenis cuti atau jenis cuti tertentu;
  - gate `approval:config`.
- Composable `useApprovalPolicies.ts`. `useLeaveApprovalFlows.ts` tidak dipakai lagi di `leave-types.vue`.
- `pages/tenants/leave/requests.vue`: teks statis "Awaiting approval from the employee's direct manager…" diganti komponen `ApprovalTimeline` (step, approver, status, catatan). Tombol Approve/Reject hanya tampil bila user login adalah approver step `pending`.
- (Opsional) halaman **My Approvals** dari `GET /approval/inbox`.
- Semua teks UI berbahasa Inggris.

---

## 8. Dokumentasi

- Folder baru `modules/approval/`: `01-overview.md`, `02-data-model.md`, `03-runtime-rules.md`, `04-api-contract.md`.
- Update `modules/leave/04-request-approval.md` & `06-data-model.md` → rujuk ke modul approval.
- Update `modules/core-hr/02-org-structure.md` §3–§4 (grade, resolver, validasi) & `05-data-model.md`.

---

## 9. Tahapan

| Fase | Isi |
|---|---|
| **0** | Validasi `manager_id`, reporting line resolver, grade jabatan, UI Direct Manager & Effective manager, docs Core HR. Bisa di-merge sendiri. |
| **1** | Modul approval (schema, domain, engine, policy CRUD API) + integrasi leave + UI policy + timeline leave + docs. |
| **2** | Inbox lintas dokumen; migrasi overtime request & attendance correction ke engine. |
| **3** | Mutation request, payroll run (opsional); tipe step tambahan (`position`/grade, `role_pool` any/all), delegasi, notifikasi via outbox messaging. |

---

## 10. Verifikasi

- **Fase 0:** unit test `AssignManager` (self, siklus A→B→C→A, lintas tenant, nonaktif) dan resolver (manager_id ada; kosong → kepala unit; karyawan = kepala unit → kepala unit induk; level 2; atasan tanpa akun → `UserID` nil). Manual: set Direct Manager di form, coba buat siklus (harus ditolak), cek "Effective manager" di profil.
- **Engine:** unit test resolve (L1/L2, kosong → skip/fallback, approver = pemohon → skip, duplikat berurutan → skip), transisi status, `NOT_CURRENT_APPROVER`, `INVALID_STATE`. Integration test repository.
- **End-to-end** (setelah migrasi dijalankan): buat policy leave 3 step (atasan → user HR → direktur) → ajukan cuti → login tiap approver berurutan, pastikan hanya approver aktif yang melihat tombol → saldo terpotong hanya di step terakhir → reject di step 2 melepas reservasi saldo.
