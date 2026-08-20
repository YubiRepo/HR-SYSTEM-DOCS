# 04 · Data Model

Entitas milik modul Tenant. `users` (admin) dirujuk dari Auth; subscription/invoice ada di Billing.

---

## 1. Diagram Relasi

```
  tenants ───< branches
     │
     └── default_branch_id ─▶ branches
```
(Relasi ke subscription/invoice ada di modul Billing; ke entitlement dihitung di modul Entitlement.)

---

## 2. Entitas

### 2.1 `tenants`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `tenant_...` |
| `slug` | string | Unik; dasar subdomain |
| `name` | string | Nama perusahaan |
| `status` | enum | `trial`, `active`, `past_due`, `suspended`, `expired`, `terminated` |
| `default_branch_id` | string (FK) | Cabang bawaan |
| `data_retention_days` | int | Retensi saat terminasi |
| `created_at` / `updated_at` | timestamp | |

**Constraint:** `UNIQUE(slug)`.

### 2.2 `branches`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `branch_...` |
| `tenant_id` | string (FK) | |
| `name` | string | |
| `is_default` | boolean | |
| `is_active` | boolean | |
| `created_at` | timestamp | |

**Constraint:** setiap tenant punya tepat satu `is_default = true`.

### 2.3 `tenant_status_history`
Jejak perubahan status (audit lifecycle).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string (FK) | |
| `status` | enum | Status baru |
| `reason` | string | |
| `changed_by` | string | Admin platform |
| `created_at` | timestamp | |

---

## 3. Indeks

| Tabel | Indeks | Alasan |
|---|---|---|
| `tenants` | `slug` unik, `status` | Resolusi & filter |
| `branches` | `tenant_id` | Daftar cabang |
| `tenant_status_history` | `tenant_id` | Audit lifecycle |

---

## 4. Catatan
- **Shared DB (B1):** data tenant lain (ber-`tenant_id`, mis. karyawan) hidup di modul masing-masing; di sini hanya metadata tenant & cabang.
- Terminasi tidak menghapus data seketika — arsip dulu, hapus setelah `data_retention_days` (UU PDP).
