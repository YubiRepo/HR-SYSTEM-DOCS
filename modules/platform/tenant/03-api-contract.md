# 03 · API Contract

Endpoint tenant & cabang, prefix `/api/v1/platform`. Hanya untuk admin platform (peran platform + MFA). Envelope standar HRMS. Aksi berbahaya butuh re-auth + `Idempotency-Key`.

---

## Ringkasan Endpoint

| Method | Endpoint | Deskripsi | Peran |
|---|---|---|---|
| GET | `/platform/tenants` | Daftar tenant (filter/search) | viewer+ |
| POST | `/platform/tenants` | Provisioning tenant baru | super_admin |
| GET | `/platform/tenants/{id}` | Detail tenant | viewer+ |
| PATCH | `/platform/tenants/{id}` | Ubah data tenant | super_admin |
| POST | `/platform/tenants/{id}/suspend` | Tangguhkan | super_admin |
| POST | `/platform/tenants/{id}/reactivate` | Aktifkan kembali | super_admin |
| POST | `/platform/tenants/{id}/terminate` | Hentikan permanen (re-auth) | super_admin |
| GET | `/platform/tenants/{id}/branches` | Daftar cabang | viewer+ |
| POST | `/platform/tenants/{id}/branches` | Tambah cabang | super_admin |
| PATCH | `/platform/branches/{id}` | Ubah cabang | super_admin |
| DELETE | `/platform/branches/{id}` | Nonaktifkan cabang | super_admin |

---

## 1. POST /platform/tenants

**Request**
```json
{
  "name": "PT Acme Indonesia",
  "slug": "acme",
  "plan_id": "plan_pro",
  "billing_cycle": "monthly",
  "admin": { "full_name": "Siti", "email": "siti@acme.com" },
  "start_trial": true
}
```
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
    "admin_invited": true
  }
}
```
**Error:** `409 SLUG_TAKEN`, `422 INVALID_PLAN`.

> Provisioning memicu lintas modul: Billing (subscription), Auth (undang admin), RBAC (seed peran), Entitlement (hitung awal).

---

## 2. `POST /platform/tenants/{id}/suspend`
```json
{ "reason": "Invoice tertunggak > grace", "mode": "read_only" }
```
**Response `200 OK`** — status → `suspended`; Entitlement dipangkas. `mode`: `read_only` | `block`.

---

## 3. `POST /platform/tenants/{id}/terminate`
Permanen — butuh **re-auth** & `Idempotency-Key`.
```json
{ "reason": "Kontrak berakhir", "data_retention_days": 60, "confirm": "acme" }
```
**Response `202 Accepted`** — proses: cabut akses (Auth), arsip data, jadwalkan hapus.

---

## 4. `POST /platform/tenants/{id}/branches`
```json
{ "name": "Cabang Surabaya" }
```
**Response `201 Created`** — cabang baru. Cabang bukan batas billing.

---

## 5. GET /platform/tenants (list)
Parameter: `page`, `per_page`, `sort`, `search`, `filter[status]`, `filter[plan_id]`. Envelope koleksi + pagination.

---

## 6. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `SLUG_TAKEN` | 409 | Slug sudah dipakai |
| `INVALID_PLAN` | 422 | Plan tidak valid saat provisioning |
| `TENANT_NOT_FOUND` | 404 | Tenant tidak ada |
| `BRANCH_NOT_EMPTY` | 409 | Cabang masih berisi data (hapus ditolak) |
| `CANNOT_DELETE_DEFAULT_BRANCH` | 409 | Cabang default tak bisa dihapus |
| `REAUTH_REQUIRED` | 401 | Aksi berbahaya butuh re-auth |
