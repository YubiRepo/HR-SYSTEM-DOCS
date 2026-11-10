<!-- 📁 plans/2026-11-05-approval-berjenjang.md -->
# Rencana: Engine Approval Berjenjang (Generik, Leave Duluan)

| | |
|---|---|
| **Status** | **Fase 0 selesai (2026-11-10)** — kode API + Backoffice + docs Core HR; migrasi `20261110000001_job_grades` ditulis, belum dijalankan. Fase 1–3 belum dikerjakan. |
| **Tanggal** | 2026-11-05 |
| **Pemicu** | Admin perlu mengatur bahwa sebuah jenis dokumen (mulai dari pengajuan cuti) butuh persetujuan **beberapa orang secara berjenjang**, misalnya atasan langsung → user tertentu dari role HR → direktur. Saat ini approval leave dipaksa satu step, sedangkan dokumen lain hanya punya approve/reject satu langkah yang digate permission. |
| **Keputusan user** | (1) Engine **generik lintas modul**, leave menjadi consumer pertama. (2) Approver konkret ditentukan **admin di konfigurasi**; sistem me-resolve otomatis saat submit. (3) Record per step menyimpan **`user_id` approver**, bukan role id atau kode entitas. (4) Sumber atasan: **`manager_id`, fallback kepala unit**. (5) **Grade jabatan** dimasukkan ke Fase 0. (6) Atasan dihitung dari **subject employee** (pemilik dokumen), bukan dari pengaju. Dokumen internal tanpa subject employee memakai pengaju sebagai titik awal. Lihat §3. |
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

Grade jabatan menjadi **master data Core HR** (entity sendiri, bukan common code), karena punya `rank` yang dipakai untuk logika approval dan ke depan bisa dipakai modul lain (payroll, benefit).

> Catatan sejarah: tabel `job_grades` pernah ada lalu dihapus di `20260903000003_remove_catalog`. Saat itu fungsinya katalog untuk merekonsiliasi org per cabang, dan masalah itu sudah hilang setelah org structure lepas dari cabang. Kali ini fungsinya berbeda: **tingkatan jabatan**.

**Tabel `job_grades`** (modul core-hr, domain `jobgrade`):

| Field | Tipe | Keterangan |
|---|---|---|
| `id`, `tenant_id` | UUID | |
| `code` | string | Unik per tenant, mis. `STAFF`, `SPV`, `MGR`, `GM`, `DIR` |
| `name` | string | |
| `rank` | int | Makin besar makin tinggi. **Tidak unik** — rank yang sama diperbolehkan (agar urutan bisa diubah tanpa tabrakan constraint; logika cukup membandingkan ≥) |
| `is_active` | boolean | |
| `created_at`, `updated_at` | timestamp | |

- **Position punya grade:** kolom `positions.job_grade_id` (nullable, FK ke `job_grades`). Validasi di create/update position: grade ada, satu tenant, dan aktif.
- **Karyawan tidak punya grade sendiri.** Grade karyawan = grade jabatan yang sedang dia pegang (via assignment aktif). Tidak ada syarat grade saat assign karyawan ke jabatan.
- Grade tidak boleh dinonaktifkan/dihapus selama masih dipakai position aktif (`JOB_GRADE_IN_USE`).
- API CRUD `/api/v1/core-hr/job-grades` dengan permission **`org:read` / `org:write`** (sama dengan positions — grade adalah master struktur organisasi; tidak perlu seeding permission baru).
- Seed default (Staff → Supervisor → Manager → General Manager → Director) lewat migrasi **untuk tenant yang sudah ada**; tenant baru mulai dari daftar kosong. Tenant boleh mengubah.
- Belum dipakai engine di Fase 1; disiapkan untuk step `position` / "atasan pertama dengan grade ≥ X" (Fase 3).

### 2.5 Backoffice

- Munculkan lagi field **Direct Manager** di `pages/tenants/employee/create.vue` dan `pages/tenants/employee/[id].vue` (kode yang di-comment tinggal dipulihkan) + tampilkan error validasi dari API.
- Profil karyawan: tampilkan **"Effective manager"** hasil resolver beserta sumbernya (manager langsung / kepala unit).
- Halaman baru **Job Grades** (`hr-setting/job-grades.vue`, master Core HR: code, name, rank, active), gate `org:write`.
- Halaman positions: field **Grade** (select dari `job_grades`, urut `rank`) + kolom Grade di list.
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
| 5 | Grade jabatan | Masuk Fase 0 sebagai master data Core HR `job_grades` (code, name, rank). Position punya grade (`positions.job_grade_id`); karyawan mewarisi grade dari jabatannya. |
| 6 | Atasan dari siapa | Dari **subject employee**, yaitu karyawan pemilik dokumen (untuk leave: `leave_requests.employee_id`). **Bukan** dari user yang menekan submit, karena HR bisa mengajukan atas nama karyawan (`SubmitLeaveRequestUseCase`: `actorUserID` ≠ `req.EmployeeID`). Titik awal diatur per step lewat `manager_of` (§4.2). |
| 7 | Dokumen internal tanpa subject employee | Didukung. `subject_employee_id` nullable; step `direct_manager` memakai `manager_of = submitter` (atasan si pengaju). Lihat §4.6. |

---

## 4. Data Model (modul `approval`)

### 4.1 `approval_policies` — dokumen apa yang butuh approval

| Field | Tipe | Keterangan |
|---|---|---|
| `id`, `tenant_id` | UUID | |
| `document_type` | string | `leave_request` (nanti `overtime_request`, `attendance_correction`, `mutation_request`, …) |
| `subtype_ref` | UUID (nullable) | Mis. `leave_type_id` agar flow bisa beda per jenis cuti. Null = default untuk `document_type`. (Sebelumnya bernama `subject_ref`; diganti agar tidak tertukar dengan *subject employee*.) |
| `name` | string | |
| `is_active` | boolean | |
| `created_at`, `updated_at` | timestamp | |

**Unik:** `(tenant_id, document_type, subtype_ref)`. Resolusi saat submit: cari policy spesifik (`subtype_ref`), lalu fallback ke default (`subtype_ref` null).

### 4.2 `approval_policy_steps` — siapa saja dan urutannya

| Field | Tipe | Keterangan |
|---|---|---|
| `id`, `policy_id` | UUID | |
| `step_order` | int | 1..N tanpa celah/duplikat |
| `approver_type` | enum | `direct_manager` / `user` |
| `manager_level` | int (nullable) | Untuk `direct_manager`: 1 = atasan langsung, 2 = atasan dari atasan (via `ResolveManagerChain`) |
| `manager_of` | enum (nullable) | Untuk `direct_manager`: titik awal rantai atasan. `subject` = atasan pemilik dokumen (default); `submitter` = atasan user yang menekan submit (wajib untuk dokumen tanpa subject employee, §4.6) |
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
| `subject_employee_id` | UUID (nullable) | Karyawan pemilik dokumen (untuk leave: `leave_requests.employee_id`). Null untuk dokumen internal (§4.6) |
| `submitted_by_user_id` | UUID | User yang menekan submit (karyawan sendiri atau HR atas nama karyawan) |
| `submitted_by_employee_id` | UUID (nullable) | Employee milik `submitted_by_user_id`, di-resolve via `FindEmployeeByUserID`. Null bila user tidak terhubung ke karyawan (mis. admin murni) |
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
| `source` | string | `direct_manager:subject:L1`, `direct_manager:submitter:L1`, `user`, `fallback` — penjelasan di UI |
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

### 4.6 Dokumen internal tanpa subject employee

Contoh: memo/dokumen HR, permintaan pembelian, atau pengajuan anggaran yang tidak menyangkut satu karyawan tertentu dan ditujukan ke atasan si pengaju atau ke jabatan tertentu.

| Kebutuhan | Cara di engine |
|---|---|
| Tidak ada pemilik dokumen | Modul pemilik mengirim `SubjectEmployeeID = nil`. |
| Ke atasan si pengaju | Step `direct_manager` dengan `manager_of = submitter`; rantai dimulai dari `submitted_by_employee_id`. |
| Ke user tertentu | Step `user` (sudah ada di Fase 1). |
| Ke jabatan tertentu (mis. "HR Manager", "Direktur") | Step `position` (Fase 3, §9). Di-resolve saat submit ke karyawan aktif yang assignment-nya memegang `position_id` tersebut, lalu disimpan sebagai `approver_user_id`. Karena `positions.headcount` bisa > 1: bila pemegang jabatan lebih dari satu → pakai `on_unresolved` (atau `role_pool` any/all di Fase 3); bila kosong atau tanpa akun → `on_unresolved`. |

Validasi:

- **Simpan policy:** bila `document_type` didaftarkan sebagai "tanpa subject" (registry `document_type` di modul approval), step `direct_manager` dengan `manager_of = subject` ditolak (`INVALID_POLICY`).
- **Submit:** step `manager_of = subject` dengan `SubjectEmployeeID` nil, atau `manager_of = submitter` dengan `submitted_by_employee_id` nil (admin tanpa data karyawan), dianggap *unresolved* → ikuti `on_unresolved`.

**Contoh 1 — Dokumen HR internal:** (1) `direct_manager`, `manager_of = submitter`, L1 → (2) `position` = HR Manager → (3) `user` = Direktur.

**Contoh 2 — Payroll run** (`document_type = payroll_run`):

- Tidak ada subject employee (`SubjectEmployeeID = nil`); pengaju = staf payroll.
- Policy: (1) `direct_manager`, `manager_of = submitter`, L1 (atasan staf payroll) → (2) `position` = Finance Manager → (3) `user` = Direktur.
- `subtype_ref` opsional: payroll group / cabang bila flow perlu dibedakan; null = default.
- Modul payroll tetap memegang status run. Ajukan approval → `Engine.Submit`; approve/reject → `Engine.Decide`. `FinalApproved` → run di-approve/dikunci (efek tombol approve yang sekarang, `payroll:approve`). `Rejected` → run kembali ke draft untuk dihitung ulang.
- **Pengajuan ulang:** setelah ditolak dan dihitung ulang, run diajukan lagi sebagai **instance baru** untuk `document_id` yang sama (unik di §4.3 hanya untuk instance aktif). Riwayat penolakan sebelumnya tetap tersimpan dan tampil di timeline.
- **Syarat data:** akun staf payroll harus terhubung ke karyawan (`employees.user_id`). Bila tidak, step atasan menjadi *unresolved* → `on_unresolved` (sebaiknya `fallback_user`).

---

## 5. Aturan Runtime

| Aksi | Aturan |
|---|---|
| **Submit** | Resolve policy → resolve `user_id` tiap step (titik awal `direct_manager` sesuai `manager_of`: `subject_employee_id` atau `submitted_by_employee_id`) → insert request + steps (step pertama `pending`, sisanya `waiting`) → action `submit`. Satu transaksi dengan pembuatan dokumen. |
| Resolve gagal | Ikuti `on_unresolved` (`skip` / `fallback_user`). |
| Approver = user milik subject employee | Step di-`skip` (tidak boleh meng-approve dokumen milik sendiri). |
| Approver = `submitted_by_user_id` | Step di-`skip` (HR yang menginput atas nama karyawan tidak meng-approve inputannya sendiri). |
| User sama di step berurutan | Step kedua di-`skip` (mempertahankan aturan "satu user tak boleh approve dua step"). |
| Tidak ada policy aktif | Dokumen auto-approved (action `skip`). |
| **Approve** | Hanya `approver_user_id` step `pending` (plus permission modul, mis. `leave:approve`). Row request di-lock (`FOR UPDATE`). Step → `approved`, step berikutnya → `pending`; bila step terakhir, request → `approved` dan outcome `FinalApproved`. |
| **Reject** | Step dan request → `rejected`, outcome `Rejected`. |
| **Cancel** | Oleh subject employee atau `submitted_by_user_id` selama `pending`: request → `cancelled`. |
| Approver salah | `NOT_CURRENT_APPROVER`. |
| Dua approve bersamaan di step sama | Yang kedua mendapat `INVALID_STATE` (sama seperti leave sekarang). |

---

## 6. Arsitektur Kode (API)

Modul baru `internal/modules/approval/` mengikuti pola DDD yang ada (`domain/`, `application/`, `infrastructure/persistence`, `interfaces/http`, `module.go`, `contract.go`), di-wire di `cmd/api/main.go`.

**Contract** yang dipakai modul pemilik dokumen:

```go
type Engine interface {
    Submit(ctx, tx, SubmitInput{DocumentType, DocumentID, SubtypeRef, SubjectEmployeeID /* nullable */, SubmittedByUserID}) (*Request, error)
    // SubmittedByEmployeeID di-resolve engine via FindEmployeeByUserID.
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

- Submit leave → `Engine.Submit` dalam transaksi yang sama, `SubtypeRef = leave_type_id`, `SubjectEmployeeID = req.EmployeeID`, `SubmittedByUserID = actorUserID`. Step leave memakai `manager_of = subject`.
- `review_leave_request.go` → logika `GuardStep` + `approvalflow/service/authorize.go` diganti `Engine.Decide`. `FinalApproved` → konsumsi saldo + ledger (logika lama). `Rejected` → lepas reservasi (logika lama).
- Cancel → `Engine.Cancel`.
- `leave_requests.current_step` dipertahankan sementara (diisi dari engine) agar list lama tidak rusak. Endpoint `/leave/approval-flows` ditandai deprecated.

### 6.2 Migrasi (ditulis, dijalankan oleh user)

1. `create_approval_tables` — 5 tabel di §4 + indeks.
2. Backfill policy default `leave_request` per tenant dari `approval_flows` leave yang ada (`manager` → `direct_manager` L1; `role` → user pertama pemegang role sebagai `fallback`, ditandai untuk ditinjau). Buat `approval_requests`/`steps` untuk leave yang masih `pending`, approver di-resolve dari reporting line saat ini.
3. Seed permission `approval:config` + tambahkan ke role template admin.
4. Tabel leave lama (`approval_flows`, `approval_steps`, `leave_request_approvals`) **tidak dihapus** di fase ini.

Fase 0: migrasi `20261110000001_job_grades` (tabel + `positions.job_grade_id` FK) + seed grade default untuk tenant yang sudah ada.

---

## 7. Backoffice

- Halaman baru `pages/tenants/settings/approval-policies.vue` (pola `AppListPage` + `AppFormSlideover`, contoh `hr-setting/overtime-rules.vue`):
  - editor step yang bisa diurutkan: **Direct manager** (+ level, + "of document owner" / "of submitter") atau **Specific user** (pilih role sebagai filter → pilih user); pilihan "of document owner" disembunyikan untuk document type tanpa subject;
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
- Update `modules/core-hr/02-org-structure.md` §3–§4 (job grades, position ↔ grade, resolver, validasi) & `05-data-model.md` (tabel `job_grades`, `positions.job_grade_id`).

---

## 9. Tahapan

| Fase | Isi |
|---|---|
| **0** ✅ | Validasi `manager_id`, reporting line resolver, master `job_grades` + grade di position (API & UI), UI Direct Manager & Effective manager, docs Core HR. Bisa di-merge sendiri. |
| **1** | Modul approval (schema, domain, engine, policy CRUD API) + integrasi leave + UI policy + timeline leave + docs. |
| **2** | Inbox lintas dokumen; migrasi overtime request & attendance correction ke engine. |
| **3** | Mutation request, payroll run (opsional); tipe step tambahan (`position` → pemegang jabatan, grade, `role_pool` any/all) untuk dokumen internal (§4.6), delegasi, notifikasi via outbox messaging. |

---

## 10. Verifikasi

- **Fase 0:** unit test `AssignManager` (self, siklus A→B→C→A, lintas tenant, nonaktif) dan resolver (manager_id ada; kosong → kepala unit; karyawan = kepala unit → kepala unit induk; level 2; atasan tanpa akun → `UserID` nil). Unit test `job_grades` (code/rank unik per tenant, grade nonaktif tidak bisa dipasang ke position, `JOB_GRADE_IN_USE`). Manual: set Direct Manager di form, coba buat siklus (harus ditolak), cek "Effective manager" di profil, buat grade lalu pasang ke position.
- **Engine:** unit test resolve (L1/L2, kosong → skip/fallback, `manager_of` subject vs submitter, HR submit atas nama karyawan → atasan karyawan yang dipakai, subject nil + `manager_of = subject` → unresolved, approver = subject/submitter → skip, duplikat berurutan → skip), transisi status, `NOT_CURRENT_APPROVER`, `INVALID_STATE`. Integration test repository.
- **End-to-end** (setelah migrasi dijalankan): buat policy leave 3 step (atasan → user HR → direktur) → ajukan cuti → login tiap approver berurutan, pastikan hanya approver aktif yang melihat tombol → saldo terpotong hanya di step terakhir → reject di step 2 melepas reservasi saldo.

---

## 11. Catatan Implementasi Fase 0 (2026-11-10)

Yang dikerjakan:

- **API (core-hr):**
  - `application/reportingline`: `ValidateManager` (`MANAGER_INVALID` / `MANAGER_SELF` / `MANAGER_CYCLE`) dipanggil di create/update (bulk import ikut lewat create); `Resolver.ResolveChain` (manager_id → kepala unit → kepala unit induk). `Employee.AssignManager` di domain.
  - Contract Core HR: `ResolveManagerChain` + DTO `ReportingManager`. Endpoint `GET /employees/{id}/reporting-line?levels=N`.
  - Org unit: validasi `head_employee_id` (`INVALID_ORG_UNIT_HEAD`); `""` menghapus kepala unit.
  - Job grades: domain/aplikasi/persistence/HTTP `/job-grades`; `positions.job_grade_id` + validasi + `job_grade` di response position.
  - Migrasi `20261110000001_job_grades` (ditulis, **belum dijalankan**).
  - Test: `reportingline` (self, siklus, lintas tenant, nonaktif, fallback kepala unit, kepala = diri sendiri → unit induk, L2, atasan tanpa akun, data lama melingkar), job grade commands, update employee (self/siklus/tidak dikenal).
- **Backoffice:** field Direct Manager dipulihkan di create & detail karyawan (pencarian server-side); baris "Manager" di profil menampilkan atasan efektif + sumbernya; halaman Job Grades + menu; kolom/filter/field Grade di Positions; badge, filter, dan stat "No head" di Organizations.
- **Docs:** `core-hr/02-org-structure.md` §3.1 & §4, `04-api-contract.md`, `05-data-model.md`.

Penyimpangan dari rencana awal: permission `org:read`/`org:write` (bukan `job_grade:*`), `rank` tidak unik, seed hanya untuk tenant yang sudah ada.
