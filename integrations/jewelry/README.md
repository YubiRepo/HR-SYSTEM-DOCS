<!-- 📁 integrations/jewelry/README.md -->
# Integrasi Jewelry — Identity, RBAC, Company & Branch

Dokumentasi teknis cabang integrasi HR dengan backend Jewelry. Dokumen modul awal (`modules/auth`, `modules/rbac`, `modules/platform`, `architectures/HRMS_Tenancy_Model.md`) **tidak diubah** — semuanya tetap menggambarkan produk HR mandiri. Folder ini menjelaskan apa yang berbeda di cabang integrasi.

| | |
|---|---|
| **Status** | Fase 1–30 selesai; Fase 31 (uji E2E) — lihat [`05-hasil-uji-e2e.md`](./05-hasil-uji-e2e.md) |
| **Rencana** | [plans/2026-11-16-integrasi-jewelry-identity-rbac.md](../../plans/2026-11-16-integrasi-jewelry-identity-rbac.md) |
| **Branch** | HR-SYSTEM-API & HR-SYSTEM-BACKOFFICE: `jewerly-integration` · jewelry-be & jewelry-fe: `hr-system` |

## Ringkasan

- **Jewelry = identity provider + master RBAC.** HR tidak menerbitkan token, tidak menyimpan password, tidak mengelola role. HR memverifikasi token Jewelry (JWKS) dan meminta grant HR ke Jewelry.
- **Tenant HR = company Jewelry**, cabang HR = branch Jewelry (UUID sama). HR menyimpan **proyeksi** company/branch/user plus kolom milik HR.
- **Tanpa entitlement/billing.** Setiap company yang terdaftar di Jewelry otomatis memakai semua fitur HR; data awal (cuti, payroll, common code) di-seed saat company pertama kali terlihat.
- **Dua cara masuk HR:** login di halaman HR dengan akun Jewelry, atau SSO dari app launcher backoffice Jewelry.
- **Tema backoffice HR** mengikuti preset tema tenant di Jewelry.

## Isi

| File | Isi |
|---|---|
| [`01-arsitektur.md`](./01-arsitektur.md) | Komponen, token & klaim, principal, grant & scope, cache, kegagalan |
| [`02-company-branch-user.md`](./02-company-branch-user.md) | Proyeksi, JIT, sync periodik, bootstrap tenant, kolom milik HR, akun karyawan |
| [`03-api-dan-alur.md`](./03-api-dan-alur.md) | Endpoint HR & Jewelry yang dipakai, alur login/SSO/pilih company/refresh/pencabutan |
| [`04-config-dan-migrasi.md`](./04-config-dan-migrasi.md) | Environment variable keempat repo, migrasi, urutan menjalankan |
| [`05-hasil-uji-e2e.md`](./05-hasil-uji-e2e.md) | Skenario verifikasi dan hasilnya |
