# Employees — Manual

Menu **Employees** mengelola data induk karyawan sebuah tenant: data pribadi,
penempatan jabatan, manajer langsung, status siklus hidup (lifecycle), akun
login, kontrak, kebijakan kerja (OT type & shift), serta pengajuan **mutasi** (promosi/transfer/berhenti) yang
butuh persetujuan.

| | |
|---|---|
| **Menu** | Employees |
| **Aktor** | `tenant_admin` / HR admin, approver |
| **Akses** | `/tenants/employee`, `/tenants/employee/mutasi` |
| **Tampil bila** | `employees:read` (Employees Info) atau `core_hr:write` / `org:write` (Mutasi) |

## Daftar Halaman

| # | Halaman | Dokumen | Akses | Ringkasan |
|---|---|---|---|---|
| 1 | Employees Info (daftar) | [`01-daftar-karyawan.md`](./01-daftar-karyawan.md) | `/tenants/employee` | Cari, filter, dan buka data karyawan |
| 2 | Tambah Karyawan | [`02-tambah-karyawan.md`](./02-tambah-karyawan.md) | `/tenants/employee/create` | Formulir pendaftaran karyawan baru |
| 3 | Detail Karyawan | [`03-detail-karyawan.md`](./03-detail-karyawan.md) | `/tenants/employee/:id` | Ringkasan profil, data pribadi, riwayat & data lainnya, akun, ubah penempatan/status |
| 4 | Kontrak Kerja | [`04-kontrak-kerja.md`](./04-kontrak-kerja.md) | Tab **Contracts** di halaman detail | Catat/perpanjang/akhiri kontrak kerja |
| 5 | Mutasi (daftar & pengajuan) | [`05-mutasi.md`](./05-mutasi.md) | `/tenants/employee/mutasi` | Ajukan perubahan siklus massal |
| 6 | Detail Mutasi (approval) | [`06-detail-mutasi.md`](./06-detail-mutasi.md) | `/tenants/employee/mutasi/:id` | Setujui/tolak/revisi pengajuan |
| 7 | Work Policy *(rencana)* | [`07-work-policy.md`](./07-work-policy.md) | Tab **Work Policy** di halaman detail | Tetapkan OT Type & Working Time (shift) karyawan |
| 8 | Import Karyawan dari Excel *(rencana)* | [`08-import-karyawan.md`](./08-import-karyawan.md) | `/tenants/employee/import` | Daftarkan banyak karyawan sekaligus: upload → review → result |
| — | FAQ & Troubleshooting | [`99-faq.md`](./99-faq.md) | — | Pertanyaan umum |

## Permission Ringkas

| Aksi | Permission |
|---|---|
| Lihat daftar & detail karyawan | `employees:read` |
| Tambah/ubah karyawan, tautkan & buat akun, kelola dokumen | `employees:write` |
| Import karyawan dari Excel *(rencana)* | `employees:write` |
| Arsipkan (archive) karyawan | `employees:delete` |
| Kelola kontrak kerja | `contracts:write` |
| Ubah Work Policy *(rencana)* | `employees:write` (usulan) |
| Reset password akun karyawan | `users:write` |
| Ajukan mutasi | `mutation_request:submit` |
| Setujui/tolak mutasi | `mutation_request:approve` |

## Dua Cara Mengubah Penempatan

Ada dua jalur yang **berbeda** dan sering tertukar:

1. **Langsung di Detail Karyawan** (menu **Actions**) — transfer/promosi,
   ubah status lifecycle, atau offboarding. Perubahan **langsung diterapkan**
   (tanpa approval) dan tercatat sebagai riwayat karier. Lihat
   [`03-detail-karyawan.md`](./03-detail-karyawan.md).
2. **Lewat Mutasi** — pengajuan massal untuk satu/beberapa karyawan sekaligus.
   Perubahan **menunggu persetujuan** sebelum diterapkan. Lihat
   [`05-mutasi.md`](./05-mutasi.md).

## Alur Umum

1. **Tambah karyawan** — satu per satu lewat
   [`02-tambah-karyawan.md`](./02-tambah-karyawan.md), atau banyak sekaligus
   lewat **Import Excel** *(rencana)* ([`08-import-karyawan.md`](./08-import-karyawan.md)).
   Kontrak pertama bisa langsung dibuat di bagian **Contract**.
2. **Lengkapi data** — buka detail, isi tab **Profile** dan sub-tab di
   **Others** ([`03-detail-karyawan.md`](./03-detail-karyawan.md)).
3. **Catat/perpanjang kontrak** — tab **Contracts**
   ([`04-kontrak-kerja.md`](./04-kontrak-kerja.md)).
4. **Tetapkan Work Policy** *(rencana)* — tab **Work Policy**: OT Type &
   Working Time ([`07-work-policy.md`](./07-work-policy.md)).
5. **Ubah penempatan/status** — lewat Actions (langsung) atau Mutasi (approval).

## Sumber

| Jenis | Path |
|---|---|
| Sidebar/gate | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Wrapper | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee.vue` |
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/**` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useEmployees.ts`, `useEmployeeMovement.ts`, `useMutationRequests.ts`, `useContracts.ts`, `useEmployeeFields.ts`, `useEmployeeRecordSections.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
