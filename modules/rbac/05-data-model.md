# 05 · Data Model

Model data RBAC. Entitas `users` & `tenants` dimiliki modul Auth; di sini hanya direferensikan.

---

## 1. Diagram Relasi

```
  roles ─────< role_permissions >───── permissions
    │ 1
    │
    │ N
  role_assignments >── users     (users milik modul Auth; per tenant + scope)
    (join user ↔ role)
```

---

## 2. Entitas

### 2.1 `roles`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `role_...` |
| `tenant_id` | string (FK) | Milik tenant; null = peran sistem global |
| `name` | string | mis. `hr_admin`, `manager` |
| `description` | string | |
| `is_system` | boolean | Peran bawaan (tak bisa dihapus/ubah) |
| `created_at` / `updated_at` | timestamp | |

**Constraint:** `UNIQUE(tenant_id, name)`.

### 2.2 `permissions`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `perm_...` |
| `key` | string | Format `resource:action`, unik |
| `description` | string | |

### 2.3 `role_permissions` (join)
| Field | Tipe |
|---|---|
| `role_id` | string (FK) |
| `permission_id` | string (FK) |
> PK gabungan `(role_id, permission_id)`.

### 2.4 `role_assignments`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string | Tenant tempat assignment berlaku (company = tenant); null hanya untuk peran platform |
| `user_id` | string | Referensi ke `users` (modul Auth); wajib member tenant tersebut |
| `role_id` | string (FK) | Role milik tenant yang sama |
| `scope_type` | enum | `tenant` (seluruh tenant), `branch` (satu cabang), `platform` (staf platform) |
| `scope_id` | string | `tenant` → = `tenant_id`; `branch` → id cabang; `platform` → null |
| `assigned_at` | timestamp | |
| `assigned_by` | string | Aktor yang menetapkan |
> Unik per `(user_id, role_id, scope_type, scope_id)`: satu role bisa dipegang di beberapa cabang (satu baris per cabang). Scope `team` tidak ada lagi. Batas data sebuah grant = irisan scope permission dan scope assignment: permission `self` tetap data sendiri; `tenant`/`branch` dibatasi ke seluruh tenant atau cabang assignment. Lihat [plans/2026-11-04-tenant-member-email-global.md](../../plans/2026-11-04-tenant-member-email-global.md) §3.3.

---

## 3. Indeks yang Disarankan

| Tabel | Indeks | Alasan |
|---|---|---|
| `roles` | `(tenant_id, name)` unik | Keunikan & lookup |
| `role_permissions` | `role_id` | Expand permission per role |
| `role_assignments` | `(user_id, tenant_id)`, `role_id` | Resolusi izin user per tenant |
| `permissions` | `key` unik | Lookup permission |

---

## 4. Seed Data

Saat provisioning tenant baru, seed peran sistem (`tenant_admin`, `branch_admin`, `employee`) beserta mapping permission bawaannya dari `role_templates`. Peran lain (mis. `payroll_officer`, `manager`, `hr_admin`) dibuat sebagai peran kustom per tenant — termasuk lewat duplikasi peran sistem. Katalog `permissions` bersifat global dan di-seed sekali di level sistem.
