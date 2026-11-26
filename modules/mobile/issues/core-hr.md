<!-- 📁 modules/mobile/issues/core-hr.md -->
# Issues Backend — Core HR

Kekurangan endpoint modul **Core HR** di [API docs](../api/README.md) yang ditemukan saat integrasi aplikasi mobile. Tiap issue mengacu ke endpoint yang terdokumentasi dan dicek langsung ke server (akun karyawan `budi@gmail.com`, admin `nurdiansyah@gmail.com`, 11 Nov 2026). Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [CORE-1](#core-1) | Karyawan hanya bisa ubah kontak | P1 | Perlu keputusan |
| [CORE-2](#core-2) | Karyawan belum bisa upload dokumen sendiri | P1 | Perlu keputusan |
| [CORE-3](#core-3) | Belum ada endpoint `/me/` untuk kontrak, riwayat, work policy | P2 | `Done` |
| [CORE-4](#core-4) | Perubahan rekening oleh karyawan butuh approval HR | P2 | Perlu keputusan |

---

### CORE-1
**Karyawan hanya bisa ubah kontak** · P1 · `Perlu keputusan`

- **Endpoint:** `PATCH /core-hr/me/employee` (Update My Employee Contact) — saat ini hanya `phone`, `address`, `emergency_contact`.
- **Kebutuhan:** karyawan melengkapi data pribadi sendiri: field pribadi, keluarga & fisik, NPWP, `bank_accounts` (key sama dengan `PATCH /core-hr/employees/{id}`). UI app sudah siap.
- **Terkait:** CORE-4 (rekening).
- **Catatan BE:** —

### CORE-2
**Karyawan belum bisa upload dokumen sendiri** · P1 · `Perlu keputusan`

- **Endpoint:** saat ini hanya `GET /core-hr/me/documents` dan `GET /core-hr/me/documents/{doc_id}`. Upload hanya ada di route admin: `POST /core-hr/employees/{id}/documents/presign` + `POST /core-hr/employees/{id}/documents`.
- **Usulan:** `POST /core-hr/me/documents/presign` + `POST /core-hr/me/documents` dengan body yang sama. UI app sudah siap.
- **Catatan BE:** —

### CORE-3
**Belum ada endpoint `/me/` untuk kontrak, riwayat, work policy** · P2 · `Done`

- **Endpoint:** tersedia untuk admin: `GET /core-hr/employees/{id}/contracts`, `/history`, `/work-policies`, `/reporting-line`. Versi `/me/` belum ada.
- **Usulan:** `GET /core-hr/me/contracts`, `/me/history`, `/me/work-policies`, `/me/reporting-line` (read-only).
- **Catatan BE:** semua tersedia (read-only, izin `employees:self` / `employees:read`): `GET /core-hr/me/history`, `/me/work-policies`, `/me/contracts` (sudah ada sebelumnya), dan `GET /core-hr/me/reporting-line?levels=` (ditambahkan 26 Nov 2026, Fase 2). Bentuk respons sama dengan versi `/employees/{id}/…`. Lihat [api/core-hr.md](../api/core-hr.md) §6.

### CORE-4
**Perubahan rekening oleh karyawan butuh approval HR** · P2 · `Perlu keputusan`

- **Konteks:** bila CORE-1 membuka `bank_accounts`, rekening gaji bisa diganti tanpa sepengetahuan HR (risiko fraud).
- **Usulan:** perubahan `bank_accounts` lewat approval HR, atau minimal notifikasi ke HR.
- **Catatan BE:** —
