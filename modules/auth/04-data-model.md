# 04 · Data Model

Model data konseptual (stack-agnostic). Tipe bersifat generik; sesuaikan dengan database yang dipilih.

---

## 1. Diagram Relasi (ERD)

```
  tenants
     │ 1
     │
     │ N
  users ─────< user_roles >───── roles ─────< role_permissions >───── permissions
     │ 1                            │ 1
     │                              │
     │ N                            │ N
  refresh_tokens              (roles milik tenant)
     │
  mfa_factors (1:N ke users)
  password_resets (1:N ke users)
  audit_logs (1:N ke users)
```

---

## 2. Entitas

### 2.1 `tenants`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `tenant_...` |
| `name` | string | Nama organisasi |
| `status` | enum | `active`, `suspended` |
| `created_at` | timestamp | |

### 2.2 `users`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `usr_...` |
| `email` | string | Nullable; unik global bila ada |
| `phone` | string | Nullable; format E.164; unik global bila ada |
| `username` | string | Nullable; unik global (tidak peka huruf besar/kecil) bila ada |
| `last_tenant_id` | string | Tenant terakhir yang dimasuki; default saat login |
| `password_hash` | string | Hash (mis. Argon2/bcrypt); null bila SSO-only |
| `email_verified` | boolean | Status verifikasi email |
| `phone_verified` | boolean | Status verifikasi telepon |
| `mfa_enabled` | boolean | |
| `status` | enum | `pending`, `active`, `locked`, `disabled` |
| `failed_attempts` | int | Penghitung untuk lockout |
| `last_login_at` | timestamp | |
| `avatar_key` | string (nullable) | Referensi avatar: `s3:<object-key>` (MinIO bucket public) atau `ext:<url>` (URL eksternal) — lihat `architectures/object-storage.md` |
| `created_at` / `updated_at` | timestamp | |

**Constraint:** setiap identifier unik global (partial unique, hanya bila nilai tidak null): `UNIQUE(email)`, `UNIQUE(phone)`, `UNIQUE(lower(username))`. User tidak menyimpan tenant; keanggotaan ada di `tenant_members`. `status` adalah status keamanan akun (global), bukan status di tenant.

### 2.2a `tenant_members`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string | |
| `user_id` | string (FK users) | |
| `status` | enum | `invited`, `active`, `suspended`, `removed` |
| `invited_by` | string | Aktor (nullable) |
| `joined_at` | timestamp | Diisi saat menjadi `active` |
| `created_at` / `updated_at` | timestamp | |

> `UNIQUE(tenant_id, user_id)`. Staf platform tidak pernah punya baris di sini.
**Aturan:** minimal salah satu dari `email` / `phone` / `username` wajib terisi agar user dapat login.

### 2.3 `roles`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `role_...` |
| `tenant_id` | string (FK) | Peran milik tenant (null = peran sistem global) |
| `name` | string | mis. `hr_admin`, `manager`, `employee` |
| `description` | string | |
| `is_system` | boolean | Peran bawaan yang tak bisa dihapus |

### 2.4 `permissions`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `perm_...` |
| `key` | string | Format `resource:action`, mis. `employees:read` |
| `description` | string | |

### 2.5 `role_assignments`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string | Null hanya untuk peran platform |
| `user_id` | string | |
| `role_id` | string (FK roles) | |
| `scope_type` | enum | `tenant`, `branch`, `platform` |
| `scope_id` | string | `tenant` → = `tenant_id`; `branch` → id cabang; `platform` → null |
| `assigned_by` / `assigned_at` | | |
> Unik per `(user_id, role_id, scope_type, scope_id)`: satu role bisa dipegang di beberapa cabang. Scope `team` dihapus. Grant efektif = irisan scope permission (`role_permissions.scope`: `self`/`branch`/`tenant`) dengan scope assignment.

### 2.6 `role_permissions` (join)
| Field | Tipe |
|---|---|
| `role_id` | string (FK) |
| `permission_id` | string (FK) |
> PK gabungan `(role_id, permission_id)`.

### 2.7 `refresh_tokens`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `rt_...` |
| `user_id` | string (FK) | |
| `tenant_id` | string | Tenant sesi ini (null = staf platform) |
| `token_hash` | string | Hash refresh token (tak pernah plaintext) |
| `family_id` | string | Untuk deteksi reuse (rotation family) |
| `expires_at` | timestamp | |
| `revoked_at` | timestamp | Null jika masih aktif |
| `replaced_by` | string | ID token pengganti (rotation) |
| `user_agent` / `ip` | string | Konteks perangkat |
| `created_at` | timestamp | |

### 2.8 `mfa_factors`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `user_id` | string (FK) | |
| `type` | enum | `totp`, `sms`, `email` |
| `secret` | string | Terenkripsi (untuk TOTP) |
| `verified` | boolean | |
| `created_at` | timestamp | |

### 2.9 `password_resets`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `user_id` | string (FK) | |
| `token_hash` | string | Hash token reset |
| `expires_at` | timestamp | Umur pendek (mis. 30 menit) |
| `used_at` | timestamp | Sekali pakai |

### 2.10 `token_blacklist` (opsional, untuk logout instan access token)
| Field | Tipe | Keterangan |
|---|---|---|
| `jti` | string (PK) | ID access token |
| `expires_at` | timestamp | Auto-purge setelah exp |

### 2.11 `audit_logs`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string | |
| `user_id` | string | Aktor (nullable) |
| `event` | string | mis. `login.success`, `password.reset` |
| `ip` / `user_agent` | string | |
| `metadata` | json | Detail tambahan |
| `created_at` | timestamp | |

---

## 3. Indeks yang Disarankan

| Tabel | Indeks | Alasan |
|---|---|---|
| `users` | `(email)`, `(phone)`, `(lower(username))` unik parsial | Login lookup per identifier & keunikan global |
| `tenant_members` | `(tenant_id, user_id)` unik, `(user_id, status)` | Keanggotaan & daftar tenant saat login |
| `role_assignments` | `(user_id, tenant_id)`, `(role_id)` | Resolusi principal per tenant |
| `refresh_tokens` | `token_hash`, `family_id`, `user_id` | Validasi & revocation |
| `password_resets` | `token_hash`, `expires_at` | Lookup & purge |
| `token_blacklist` | `expires_at` | Purge otomatis |
| `audit_logs` | `(tenant_id, created_at)` | Query audit |

---

## 4. Kebijakan Retensi

| Data | Retensi |
|---|---|
| Refresh token kedaluwarsa/dicabut | Hapus/arsip setelah 90 hari |
| Password reset terpakai | Hapus setelah 7 hari |
| Token blacklist | Purge otomatis setelah `exp` |
| Audit log | Simpan minimal sesuai kebijakan kepatuhan |
