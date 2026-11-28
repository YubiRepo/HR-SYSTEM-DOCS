# 03 · API Contract

Dua kelompok endpoint:
- **Platform** (`/api/v1/platform/*`) — untuk admin **Yubiteck** (peran platform + MFA): provisioning, suspend, terminate tenant. Cabang di sini hanya untuk dukungan/troubleshoot.
- **Tenant-facing** (`/api/v1/branches/*`) — untuk **tenant admin** (orang perusahaan) mengelola cabangnya sendiri (self-service).

Envelope standar HRMS. Aksi berbahaya butuh re-auth + `Idempotency-Key`.

---

## Ringkasan Endpoint

### Platform (admin Yubiteck)
| Method | Endpoint | Deskripsi | Peran |
|---|---|---|---|
| GET | `/platform/tenants` | Daftar tenant (filter/search) | viewer+ |
| POST | `/platform/tenants` | Provisioning tenant baru | super_admin |
| GET | `/platform/tenants/admin-account?email=` | Cek apakah email admin sudah punya akun & company-nya | super_admin |
| GET | `/platform/tenants/{id}` | Detail tenant | viewer+ |
| PATCH | `/platform/tenants/{id}` | Ubah data tenant | super_admin |
| POST | `/platform/tenants/{id}/suspend` | Tangguhkan | super_admin |
| POST | `/platform/tenants/{id}/reactivate` | Aktifkan kembali | super_admin |
| POST | `/platform/tenants/{id}/terminate` | Hentikan permanen (re-auth) | super_admin |
| GET | `/platform/tenants/{id}/branches` | Lihat cabang (dukungan) | viewer+ |

### Publik (self signup — tanpa login, rate limit auth per IP)
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/signup` | Daftar perusahaan; kirim email verifikasi |
| POST | `/signup/verify` | Verifikasi tautan → provisioning tenant |
| GET | `/signup/plans` | Plan yang bisa dipilih di form signup |

### Tenant-facing (tenant admin — kelola cabang sendiri)
| Method | Endpoint | Deskripsi | Izin (RBAC) |
|---|---|---|---|
| GET | `/branches` | Daftar cabang tenant | `branch:read` |
| POST | `/branches` | Buat cabang (cek limit) | `branch:write` (tenant) |
| GET | `/branches/{id}` | Detail cabang | `branch:read` |
| PATCH | `/branches/{id}` | Ubah cabang | `branch:write` |
| POST | `/branches/{id}/deactivate` | Nonaktifkan sementara | `branch:write` (tenant) |
| POST | `/branches/{id}/close` | Tutup permanen (cek karyawan) | `branch:write` (tenant) |

> Tenant-facing di-scope RBAC: `tenant_admin` (scope tenant) kelola semua cabang & buat baru; `branch_admin` (scope branch) hanya lihat/ubah operasional cabangnya, tidak membuat/menutup cabang.

---

## 1. POST /platform/tenants

**Request**
```json
{
  "name": "PT Acme Indonesia",
  "plan_id": "plan_pro",
  "billing_cycle": "monthly",
  "admin": { "display_name": "Siti", "email": "siti@acme.com" },
  "start_trial": true
}
```
`admin.display_name` = `users.display_name` akun admin (bukan `full_name` employee). **Wajib hanya bila email belum punya akun**; bila email sudah terdaftar, akun itu diundang ke tenant baru, tetap memakai namanya sendiri, dan `display_name` diabaikan (boleh dikosongkan).

`custom_rate` (int, IDR/bulan, ≥ 0) = harga nego. **Wajib bila plan bermodel `custom`** — tanpa itu provisioning ditolak `CUSTOM_RATE_REQUIRED` sebelum tenant dibuat (aturan sama dengan assign plan, lihat billing/03-subscription-billing.md §4). Diabaikan untuk plan katalog. Tanpa trial, invoice periode pertama langsung terbit memakai rate ini.
**Response `201 Created`**
```json
{
  "success": true,
  "data": {
    "id": "tenant_01H8...",
    "slug": "acme",
    "status": "trial",
    "default_branch_id": "branch_01H8...",
    "subscription": { "plan_id": "plan_pro", "status": "trialing", "trial_ends": "2026-08-25" },
    "admin_invited": true,
    "admin_existing_account": false
  }
}
```
`admin_existing_account: true` = email sudah punya akun → diundang (tanpa `admin_temp_password`).

`slug` (kode tenant) opsional dan biasanya tidak dikirim: API membuatnya dari `name` (`pt-acme-indonesia`, lalu `-2`, `-3` bila sudah dipakai). Bila dikirim, harus unik.

**Error:** `409 SLUG_TAKEN` (hanya bila `slug` dikirim dan sudah dipakai), `422 INVALID_PLAN`, `400 VALIDATION_ERROR` (`admin.display_name` kosong untuk email baru), `CUSTOM_RATE_REQUIRED` (plan custom tanpa `custom_rate`).

### GET /platform/tenants/admin-account?email=

Dipakai form provisioning sebelum submit, agar admin platform tahu email admin sudah terdaftar di company mana.

```json
{
  "success": true,
  "data": {
    "exists": true,
    "display_name": "Siti Rahmawati",
    "companies": [
      { "tenant_id": "…", "name": "PT Acme Indonesia", "slug": "acme", "tenant_status": "active", "membership_status": "active" }
    ]
  }
}
```
Email belum terdaftar → `{ "exists": false, "companies": [] }`. Membership berstatus `removed` tidak ikut.

> Provisioning memicu lintas modul: Billing (subscription), Auth (undang admin), RBAC (seed peran), Entitlement (hitung awal).

---

## 2. POST /platform/tenants/{id}/suspend
```json
{ "reason": "Invoice tertunggak > grace", "mode": "read_only" }
```
**Response `200 OK`** — status → `suspended`; Entitlement dipangkas. `mode`: `read_only` | `block`.

---

## 3. POST /platform/tenants/{id}/terminate
Permanen — butuh **re-auth** & `Idempotency-Key`.
```json
{ "reason": "Kontrak berakhir", "data_retention_days": 60, "confirm": "acme" }
```
**Response `202 Accepted`** — proses: cabut akses (Auth), arsip data, jadwalkan hapus.

---

## 4. POST /branches (tenant admin buat cabang)
```json
{
  "code": "SBY-01",
  "name": "Cabang Surabaya",
  "address": "Jl. Pemuda No. 10",
  "city": "Surabaya",
  "province": "Jawa Timur",
  "timezone": "Asia/Jakarta",
  "lat": -7.2575,
  "lng": 112.7521,
  "pic_employee_id": "emp_..."
}
```
**Response `201 Created`** — cabang baru (status `active`). Cabang bukan batas billing.
**Error:** `403 BRANCH_LIMIT_REACHED` (limit `max_branches` habis → tawarkan upgrade), `409 BRANCH_CODE_TAKEN`.

---

## 5. POST /branches/{id}/close (tutup permanen)
```json
{ "reason": "konsolidasi operasional", "effective_date": "2026-06-30" }
```
Menutup cabang. Ditolak bila cabang default atau masih ada karyawan aktif.
**Response `200 OK`** → status `closed`.
**Error:** `409 CANNOT_CLOSE_DEFAULT_BRANCH`, `409 BRANCH_HAS_ACTIVE_EMPLOYEES` (pindahkan/of-board dulu).

---

## 6. GET /platform/tenants (list)
Parameter: `page`, `per_page`, `sort`, `search`, `filter[status]`, `filter[plan_id]`. Envelope koleksi + pagination.

---

## 6a. Self signup (publik)

Lihat alurnya di [02-lifecycle.md §1.0](02-lifecycle.md).

### POST /signup
```json
{ "company_name": "PT Maju Jaya", "plan_id": "<id dari /signup/plans>", "admin_name": "Budi", "email": "budi@majujaya.co.id", "password": "••••••••" }
```
**202** `{ "email": "budi@majujaya.co.id", "expires_at": "2026-11-29T10:00:00Z" }` — email berisi tautan verifikasi. Error: `INVALID_PLAN` 422 (plan tidak ditawarkan di signup), `EMAIL_ALREADY_EXISTS` 409, `WEAK_PASSWORD` 422, `VALIDATION_ERROR` 400.

### POST /signup/verify
```json
{ "token": "<dari tautan email>" }
```
**200** `{ "tenant_name": "PT Maju Jaya", "email": "budi@majujaya.co.id" }`. Idempoten: token yang sudah dipakai tetap 200. Error: `SIGNUP_TOKEN_INVALID` 400, `SIGNUP_TOKEN_EXPIRED` 410 (kedaluwarsa atau sudah diganti pendaftaran baru). Kode tenant dibuat otomatis dari `company_name`; tenant trial di `plan_id` pendaftaran.

### GET /signup/plans
**200** daftar plan (bentuk sama dengan `GET /platform/plans`) yang publik, aktif, dan gratis (flat Rp 0) atau punya `trial_days > 0`, urut `sort_order`.

---

## 7. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `SLUG_TAKEN` | 409 | Slug yang dikirim eksplisit sudah dipakai |
| `INVALID_PLAN` | 422 | Plan tidak valid saat provisioning |
| `TENANT_NOT_FOUND` | 404 | Tenant tidak ada |
| `BRANCH_LIMIT_REACHED` | 403 | Limit `max_branches` habis (upgrade plan) |
| `BRANCH_CODE_TAKEN` | 409 | Kode cabang sudah dipakai di tenant ini |
| `CANNOT_CLOSE_DEFAULT_BRANCH` | 409 | Cabang default tak bisa ditutup |
| `BRANCH_HAS_ACTIVE_EMPLOYEES` | 409 | Masih ada karyawan aktif (pindah dulu) |
| `REAUTH_REQUIRED` | 401 | Aksi berbahaya butuh re-auth |
| `EMAIL_ALREADY_EXISTS` | 409 | Self signup: email sudah punya akun (login saja) |
| `SIGNUP_TOKEN_INVALID` | 400 | Tautan verifikasi tidak dikenal |
| `SIGNUP_TOKEN_EXPIRED` | 410 | Tautan kedaluwarsa / sudah diganti |
