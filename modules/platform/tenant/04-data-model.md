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
| `slug` | string | Kode tenant unik, dibuat otomatis dari nama (bukan subdomain) |
| `name` | string | Nama perusahaan |
| `status` | enum | `trial`, `active`, `past_due`, `suspended`, `expired`, `terminated` |
| `default_branch_id` | string (FK) | Cabang bawaan |
| `billing_mode` | enum | `self_service` (default) / `managed` — apakah tenant kelola langganan sendiri atau via Yubiteck |
| `data_retention_days` | int | Retensi saat terminasi |
| `created_at` / `updated_at` | timestamp | |

**Constraint:** `UNIQUE(slug)`.

### 2.2 `branches`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `branch_...` |
| `tenant_id` | string (FK) | |
| `code` | string | Kode cabang (mis. `JKT-01`); unik per tenant |
| `name` | string | Nama cabang |
| `address` | string | Alamat lengkap |
| `city` | string | Kota |
| `province` | string | Provinsi |
| `postal_code` | string | Kode pos |
| `country` | string | Default `ID` |
| `timezone` | string | mis. `Asia/Jakarta` (WIB/WITA/WIT) |
| `lat` / `lng` | number (nullable) | Koordinat — dipakai geofence Attendance |
| `phone` | string (nullable) | Telepon cabang |
| `pic_employee_id` | string (FK, nullable) | Penanggung jawab (branch manager) |
| `is_default` | boolean | Cabang bawaan |
| `status` | enum | `active`, `inactive`, `closed` |
| `opened_at` / `closed_at` | date (nullable) | Lifecycle cabang |
| `created_at` / `updated_at` | timestamp | |

**Constraint:** setiap tenant punya tepat satu `is_default = true`; `UNIQUE(tenant_id, code)`.

> Field `timezone` penting untuk multi-cabang lintas zona (WIB/WITA/WIT) — perhitungan absensi & jadwal mengikuti zona cabang. `lat`/`lng` menjadi pusat geofence di modul Attendance.

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

### 2.4 `tenant_signups`
Pendaftaran self signup yang menunggu (atau sudah) verifikasi email. Tenant baru dibuat saat verifikasi.
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (PK) | |
| `company_name` | string | Nama perusahaan → nama tenant |
| `plan_id` | uuid | Plan yang dipilih untuk trial |
| `admin_name` | string | Display name admin |
| `email` | string | Email admin (lowercase) |
| `password_hash` | string | Hash password pilihan pendaftar; dikosongkan setelah selesai/kedaluwarsa |
| `token_hash` | char(64) unik | SHA-256 token tautan (token asli tidak disimpan) |
| `status` | enum | `pending` · `completed` · `expired` (diganti pendaftaran baru) |
| `tenant_id` | uuid (FK, nullable) | Tenant hasil verifikasi |
| `expires_at` | timestamp | Batas tautan (`SIGNUP_TOKEN_TTL_HOURS`) |
| `created_at` / `completed_at` | timestamp | |

---

## 3. Indeks

| Tabel | Indeks | Alasan |
|---|---|---|
| `tenants` | `slug` unik, `status` | Keunikan kode & filter |
| `branches` | `(tenant_id, code)` unik, `status` | Daftar & filter cabang |
| `tenant_status_history` | `tenant_id` | Audit lifecycle |
| `tenant_signups` | `token_hash` unik; `email` unik parsial `WHERE status='pending'` | Lookup tautan; satu tautan aktif per email |

---

## 4. Catatan
- **Shared DB (B1):** data tenant lain (ber-`tenant_id`, mis. karyawan) hidup di modul masing-masing; di sini hanya metadata tenant & cabang.
- Terminasi tidak menghapus data seketika — arsip dulu, hapus setelah `data_retention_days` (UU PDP).
