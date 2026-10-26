# Company Settings — Manual

Menu **Company Settings** adalah pusat pengaturan perusahaan (tenant): profil
dan legalitas perusahaan, cabang, master kode (common codes), langganan &
tagihan, akun pengguna, serta peran & hak akses.

| | |
|---|---|
| **Menu** | Company Settings (bagian bawah sidebar) |
| **Aktor** | `tenant_admin` / admin perusahaan |
| **Akses** | `/tenants/settings` |
| **Tampil bila** | Selalu tampil untuk pengguna backoffice perusahaan; isi tiap tab mengikuti permission masing-masing |

## Daftar Halaman

Semua halaman berupa **tab** di bagian atas halaman Company Settings.

| # | Tab | Dokumen | Akses | Ringkasan |
|---|---|---|---|---|
| 1 | Overview | [`01-overview.md`](./01-overview.md) | `/tenants/settings` | Ringkasan perusahaan, ubah info perusahaan & zona waktu default |
| 2 | Branches | [`02-branches.md`](./02-branches.md) | `/tenants/settings/branches` | Tambah, ubah, dan tutup cabang |
| 3 | Common Codes | [`03-common-codes.md`](./03-common-codes.md) | `/tenants/settings/common-codes` | Kelola pilihan dropdown (agama, bank, jenis kontrak, dll.) |
| 4 | Billing | [`04-billing.md`](./04-billing.md) | `/tenants/settings/billing` | Paket langganan, fitur & kuota, invoice, bukti pembayaran |
| 5 | Users | [`05-users.md`](./05-users.md) | `/tenants/settings/users` | Akun pengguna, penetapan peran & cabang, reset password |
| 6 | Roles & Permissions | [`06-roles.md`](./06-roles.md) | `/tenants/settings/roles` | Peran bawaan & kustom beserta izinnya |
| — | FAQ & Troubleshooting | [`99-faq.md`](./99-faq.md) | — | Pertanyaan umum |

> **Catatan:** Tab **Activity** (log aktivitas) ada di kode tetapi sedang
> dinonaktifkan dan tidak tampil.

## Permission Ringkas

| Aksi | Permission |
|---|---|
| Ubah info perusahaan & zona waktu default | `settings:write` |
| Lihat cabang / tambah, ubah, tutup cabang | `branch:read` / `branch:write` |
| Tambah, ubah, nonaktifkan common code | `settings:write` (melihat tidak butuh permission) |
| Lihat billing / kirim bukti pembayaran | `billing:read` / `billing:write` |
| Ubah paket langganan | `entitlement:manage` |
| Lihat / buat akun pengguna, reset password | `users:read` / `users:write` |
| Lihat peran / buat, ubah, hapus peran | `roles:read` / `roles:write` |
| Menetapkan peran ke pengguna | `roles:assign` |

## Alur Umum (setup awal perusahaan)

1. **Lengkapi profil perusahaan** dan zona waktu default — tab **Overview**.
2. **Tambah cabang** bila perusahaan punya lebih dari satu lokasi — tab
   **Branches**.
3. **Sesuaikan pilihan dropdown** (bank, jenis kontrak, jenjang pendidikan,
   dll.) — tab **Common Codes**.
4. **Siapkan peran** sesuai pembagian tugas (mis. HR cabang, supervisor) — tab
   **Roles & Permissions**.
5. **Buat akun pengguna** dan tetapkan peran + cabangnya — tab **Users**.
6. **Pantau langganan & tagihan** — tab **Billing**.

## Sumber

| Jenis | Path |
|---|---|
| Sidebar | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` (`bottomLinks`) |
| Wrapper & tab | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/settings.vue` |
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/settings/**` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useMyTenant.ts`, `useTenantBranches.ts`, `useCommonCodes.ts`, `useMyBilling.ts`, `useAccessUsers.ts`, `useAccessRoles.ts`, `useAccessPermissions.ts` |
| Modul | `modules/platform/tenant/**`, `modules/platform/billing/**`, `modules/rbac/**` |
