# Auth Module

Modul autentikasi untuk HR Management System. Menyediakan identitas pengguna, penerbitan token, klaim peran/scope, dan integrasi SSO — dipakai bersama oleh seluruh modul HRMS. Otorisasi (RBAC) ditangani modul terpisah [`../rbac/`](../rbac/README.md).

| | |
|---|---|
| **Modul** | Auth |
| **Versi** | 1.0 |
| **Mekanisme** | OAuth 2.0 + JWT |
| **Sifat** | Stack-agnostic (konseptual) |
| **Multi-tenant** | Ya |

---

## Ruang Lingkup

- Registrasi & manajemen identitas pengguna
- Login/logout, penerbitan & rotasi token (access + refresh)
- OAuth 2.0 authorization flows
- Multi-factor authentication (MFA)
- SSO (OIDC/SAML) untuk enterprise
- Reset & ganti password, verifikasi email
- Audit & keamanan (rate limit, lockout, revocation)
- Menerbitkan klaim `roles`/`scope` ke token (definisi & evaluasi ada di modul RBAC)

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks & ikhtisar modul (dokumen ini) |
| [`01-overview.md`](./01-overview.md) | Tujuan, konsep inti, terminologi, komponen |
| [`02-architecture.md`](./02-architecture.md) | Arsitektur, token, OAuth2 flows, komponen internal |
| [`03-api-contract.md`](./03-api-contract.md) | Endpoint REST: request/response tiap operasi |
| [`04-data-model.md`](./04-data-model.md) | Skema entitas & relasi (users, roles, tokens, dll) |
| [`05-flows.md`](./05-flows.md) | Alur end-to-end: login, refresh, reset, MFA, SSO |
| [`06-security.md`](./06-security.md) | Kebijakan keamanan, hardening, ancaman & mitigasi |
| [`07-errors.md`](./07-errors.md) | Katalog error code & penanganan |
| [`08-config.md`](./08-config.md) | Parameter konfigurasi & environment variables |

> **Otorisasi (RBAC)** kini dipisah menjadi modul tersendiri: [`../rbac/`](../rbac/README.md). Auth menangani autentikasi & menerbitkan klaim `roles`/`scope`; RBAC mendefinisikan arti peran/permission dan mengevaluasi akses.

---

## Prinsip Desain

1. **Stateless** — access token JWT tervalidasi tanpa lookup DB; state minimal.
2. **Least privilege** — akses default ditolak; hanya permission eksplisit yang lolos.
3. **Defense in depth** — berlapis: transport, token, rate limit, MFA, audit.
4. **Multi-tenant isolation** — setiap identitas & token terikat `tenant_id`.
5. **Standards-based** — mengikuti OAuth 2.0 & OIDC, bukan skema buatan sendiri.

---

## Dependensi & Konsumen

**Menyediakan untuk semua modul:** identitas terverifikasi, klaim token (`sub`, `tenant_id`, `roles`, `scope`), dan endpoint validasi.

**Bergantung pada:** Data & Storage (fondasi platform), Notifikasi (email verifikasi/reset), dan opsional Identity Provider eksternal (SSO).
