# 05 · Data Model

Model data RBAC. Entitas `users` & `tenants` dimiliki modul Auth; di sini hanya direferensikan.

---

## 1. Diagram Relasi

```
  roles ─────< role_permissions >───── permissions
    │ 1
    │
    │ N
  user_roles >───── users        (users milik modul Auth)
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

### 2.4 `user_roles` (join)
| Field | Tipe | Keterangan |
|---|---|---|
| `user_id` | string (FK) | Referensi ke `users` (modul Auth) |
| `role_id` | string (FK) | |
| `assigned_at` | timestamp | |
| `assigned_by` | string | Aktor yang menetapkan |
> PK gabungan `(user_id, role_id)`.

---

## 3. Indeks yang Disarankan

| Tabel | Indeks | Alasan |
|---|---|---|
| `roles` | `(tenant_id, name)` unik | Keunikan & lookup |
| `role_permissions` | `role_id` | Expand permission per role |
| `user_roles` | `user_id`, `role_id` | Resolusi izin user |
| `permissions` | `key` unik | Lookup permission |

---

## 4. Seed Data

Saat provisioning tenant baru, seed peran sistem (`employee`, `manager`, `hr_admin`, `payroll_officer`, `tenant_admin`, `service`) beserta mapping permission bawaannya. Katalog `permissions` bersifat global dan di-seed sekali di level sistem.
