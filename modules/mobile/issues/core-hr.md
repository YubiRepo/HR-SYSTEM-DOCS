<!-- 📁 modules/mobile/issues/core-hr.md -->
# Issues Backend — Core HR

Kekurangan endpoint modul **Core HR** di [API docs](../api/README.md) yang ditemukan saat integrasi aplikasi mobile. Tiap issue mengacu ke endpoint yang terdokumentasi dan dicek langsung ke server (akun karyawan `budi@gmail.com`, admin `nurdiansyah@gmail.com`, 11 Nov 2026). Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [CORE-1](#core-1) | Karyawan hanya bisa ubah kontak | P1 | `Done` |
| [CORE-2](#core-2) | Karyawan belum bisa upload dokumen sendiri | P1 | `Done` |
| [CORE-3](#core-3) | Belum ada endpoint `/me/` untuk kontrak, riwayat, work policy | P2 | `Done` |
| [CORE-4](#core-4) | Perubahan rekening oleh karyawan butuh approval HR | P2 | Perlu keputusan |

---

### CORE-1
**Karyawan hanya bisa ubah kontak** · P1 · `Done`

- **Endpoint:** `PATCH /core-hr/me/employee` (Update My Employee Contact) — saat ini hanya `phone`, `address`, `emergency_contact`.
- **Kebutuhan:** karyawan melengkapi data pribadi sendiri: field pribadi, keluarga & fisik, NPWP, `bank_accounts` (key sama dengan `PATCH /core-hr/employees/{id}`). UI app sudah siap.
- **Terkait:** CORE-4 (rekening).
- **Keputusan:** (26 Nov 2026, sementara) karyawan boleh mengubah **semua** data dirinya lewat `PATCH /core-hr/me/employee`, **kecuali data yang terkait mutasi**: `branch_id`, `org_unit_id`, `position_id`, job grade, pola kerja, dan status kepegawaian. Data ini sejak awal hanya berubah lewat mutation request. Kebijakan lebih ketat (approval) menyusul. Dikonfirmasi juga dikecualikan: `employee_number`, `manager_id` (atasan diatur HR), `custom_fields`, dan catatan milik HR `appraisal_records`, `reward_warning_records`.
- **Catatan BE:** diimplementasikan 26 Nov 2026 (Fase 4). `PATCH /core-hr/me/employee` menerima body `PATCH /employees/{id}` dikurangi `employeedto.SelfServiceDeniedFields` (`branch_id`, `org_unit_id`, `position_id`, `manager_id`, `custom_fields`, `appraisal_records`, `reward_warning_records`). Field ditolak / tidak dikenal → `422 VALIDATION_ERROR` untuk seluruh request. Termasuk `bank_accounts` (sementara, CORE-4). Test `TestSelfServiceFieldsAreDecided` memaksa setiap field baru di DTO admin diputuskan: boleh diubah karyawan atau masuk daftar tolak. Lihat [api/core-hr.md](../api/core-hr.md) §2.

### CORE-2
**Karyawan belum bisa upload dokumen sendiri** · P1 · `Done`

- **Endpoint:** saat ini hanya `GET /core-hr/me/documents` dan `GET /core-hr/me/documents/{doc_id}`. Upload hanya ada di route admin: `POST /core-hr/employees/{id}/documents/presign` + `POST /core-hr/employees/{id}/documents`.
- **Usulan:** `POST /core-hr/me/documents/presign` + `POST /core-hr/me/documents` dengan body yang sama. UI app sudah siap.
- **Keputusan:** (26 Nov 2026) **boleh**, file langsung tersimpan tanpa verifikasi HR, sama seperti upload oleh admin. Implementasi: `POST /core-hr/me/documents/presign` + `POST /core-hr/me/documents`.
- **Catatan BE:** diimplementasikan 26 Nov 2026 (Fase 4): `POST /core-hr/me/documents/presign` + `POST /core-hr/me/documents` (`employees:self`), memakai use case admin. Sekaligus diperketat untuk admin & self: `key` harus berawalan `pending/employee-documents/{employee_id}/` (sebelumnya cukup `pending/`, sehingga upload milik orang/fitur lain bisa diklaim), dan file yang tidak ada → `422 VALIDATION_ERROR` (sebelumnya `500`). Lihat [api/core-hr.md](../api/core-hr.md) §3a.

### CORE-3
**Belum ada endpoint `/me/` untuk kontrak, riwayat, work policy** · P2 · `Done`

- **Endpoint:** tersedia untuk admin: `GET /core-hr/employees/{id}/contracts`, `/history`, `/work-policies`, `/reporting-line`. Versi `/me/` belum ada.
- **Usulan:** `GET /core-hr/me/contracts`, `/me/history`, `/me/work-policies`, `/me/reporting-line` (read-only).
- **Catatan BE:** semua tersedia (read-only, izin `employees:self` / `employees:read`): `GET /core-hr/me/history`, `/me/work-policies`, `/me/contracts` (sudah ada sebelumnya), dan `GET /core-hr/me/reporting-line?levels=` (ditambahkan 26 Nov 2026, Fase 2). Bentuk respons sama dengan versi `/employees/{id}/…`. Lihat [api/core-hr.md](../api/core-hr.md) §6.

### CORE-4
**Perubahan rekening oleh karyawan butuh approval HR** · P2 · `Perlu keputusan`

- **Konteks:** bila CORE-1 membuka `bank_accounts`, rekening gaji bisa diganti tanpa sepengetahuan HR (risiko fraud).
- **Usulan:** perubahan `bank_accounts` lewat approval HR, atau minimal notifikasi ke HR.
- **Keputusan:** (26 Nov 2026) **belum diatur.** Untuk sementara `bank_accounts` ikut terbuka bersama CORE-1, langsung tersimpan tanpa approval/notifikasi. Risiko fraud rekening tetap tercatat; approval HR dibahas lagi nanti.
- **Catatan BE:** —
