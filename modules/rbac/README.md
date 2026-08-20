# RBAC Module

Modul otorisasi berbasis peran (Role-Based Access Control) untuk HR Management System. Menyediakan model peran, permission, scope, dan mesin evaluasi akses yang **dipakai bersama oleh seluruh modul HRMS**.

| | |
|---|---|
| **Modul** | RBAC |
| **Versi** | 1.0 |
| **Sifat** | Stack-agnostic (konseptual) |
| **Multi-tenant** | Ya |
| **Relasi** | Dikonsumsi semua modul; menerima identitas dari modul Auth |

---

## Kenapa Modul Terpisah?

RBAC dipisah dari Auth karena:
- **Lintas modul** — setiap modul (Core HR, Payroll, Attendance, dst) mengevaluasi izin, bukan hanya Auth.
- **Lifecycle sendiri** — peran & permission berevolusi terpisah dari mekanisme login/token.
- **Dikelola berbeda** — admin tenant mengelola peran tanpa menyentuh konfigurasi autentikasi.

**Batas tanggung jawab:**
| Modul | Tanggung jawab |
|---|---|
| **Auth** | *Authentication* — "siapa kamu" (identitas, token, klaim `roles`/`scope`) |
| **RBAC** | *Authorization* — "boleh apa" (definisi peran/permission & evaluasi akses) |

Auth menaruh `roles` & `scope` ke dalam token; RBAC mendefinisikan arti keduanya dan mengevaluasi izin di resource server.

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks & ikhtisar modul (dokumen ini) |
| [`01-model.md`](./01-model.md) | Model inti: user→role→permission, format permission, scope |
| [`02-roles.md`](./02-roles.md) | Peran bawaan, kustomisasi per tenant, audit perubahan |
| [`03-evaluation.md`](./03-evaluation.md) | Algoritma evaluasi akses & data-level scoping |
| [`04-api-contract.md`](./04-api-contract.md) | Endpoint manajemen peran, permission & penetapan (production-ready) |
| [`05-data-model.md`](./05-data-model.md) | Skema entitas RBAC (roles, permissions, join) |
| [`06-integration.md`](./06-integration.md) | Cara modul lain berintegrasi (middleware, klaim token) |

---

## Prinsip

1. **Deny by default** — akses ditolak kecuali ada permission eksplisit.
2. **Least privilege** — beri izin sekecil mungkin; gabungkan lewat peran.
3. **Granular permission** — pola `resource:action`, digabung dalam peran.
4. **Tenant-scoped** — semua evaluasi dalam konteks `tenant_id`.
5. **Auditable** — setiap perubahan peran/permission dicatat.
