# 04 · API Contract

Endpoint billing, prefix `/api/v1/platform`. Admin platform (super_admin, billing) + MFA. Envelope standar HRMS. Refund/adjustment butuh re-auth.

---

## Ringkasan Endpoint

### Plans & Catalog
| Method | Endpoint | Deskripsi | Peran |
|---|---|---|---|
| GET | `/platform/plans` | Daftar plan | viewer+ |
| POST | `/platform/plans` | Buat plan | super_admin |
| GET | `/platform/plans/{id}` | Detail plan | viewer+ |
| PATCH | `/platform/plans/{id}` | Ubah plan | super_admin |
| DELETE | `/platform/plans/{id}` | Arsipkan plan | super_admin |
| GET | `/platform/features` | Katalog Feature | viewer+ |
| POST | `/platform/features` | Daftarkan Feature | super_admin |
| GET | `/platform/limits` | Katalog jenis Limit | viewer+ |

### Subscription
| Method | Endpoint | Deskripsi | Peran |
|---|---|---|---|
| GET | `/platform/tenants/{id}/subscription` | Subscription tenant | viewer+ |
| POST | `/platform/tenants/{id}/subscription` | Buat/ubah (upgrade/downgrade) | billing+ |
| POST | `/platform/tenants/{id}/subscription/cancel` | Batalkan | billing+ |
| POST | `/platform/tenants/{id}/overrides` | Terapkan override Feature/Limit | super_admin |

### Invoice & Payment
| Method | Endpoint | Deskripsi | Peran |
|---|---|---|---|
| GET | `/platform/tenants/{id}/invoices` | Daftar invoice | billing+ |
| GET | `/platform/invoices/{id}` | Detail invoice | billing+ |
| POST | `/platform/invoices/{id}/refund` | Refund/adjustment (re-auth) | billing+ |
| POST | `/platform/webhooks/payment` | Callback payment gateway | service |

---

## 1. POST /platform/plans
```json
{
  "name": "Pro",
  "features": ["core_hr","attendance","leave","payroll","performance","recruitment"],
  "limits": { "max_employees": 500, "max_branches": 10, "payroll.max_payslips_month": 600 },
  "pricing": { "model": "pepm", "currency": "IDR", "rate": 25000 },
  "billing_cycles": [
    { "code": "monthly", "months": 1, "discount_pct": 0 },
    { "code": "quarterly", "months": 3, "discount_pct": 5 },
    { "code": "annual", "months": 12, "discount_pct": 15 }
  ],
  "is_public": true,
  "trial_days": 14
}
```
**Response `201 Created`.** **Error:** `422 UNKNOWN_FEATURE`, `409 PLAN_NAME_EXISTS`, `422 INVALID_CYCLE`.

---

## 2. POST /platform/tenants/{id}/subscription
Upgrade/downgrade/ganti plan.
```json
{ "plan_id": "plan_enterprise", "billing_cycle": "annual", "proration": true }
```
**Response `200 OK`** — subscription diperbarui; bila `proration`, hitung selisih pro-rata. Memicu Entitlement hitung ulang.

---

## 3. POST /platform/tenants/{id}/overrides
```json
{
  "add_features": ["sso"],
  "remove_features": [],
  "limits": { "max_employees": 700 },
  "reason": "Goodwill enterprise",
  "expires_at": "2026-12-31"
}
```
**Response `200 OK`** — override tersimpan; Entitlement dihitung ulang. Teraudit.

---

## 4. POST /platform/invoices/{id}/refund
Butuh **re-auth** & `Idempotency-Key`.
```json
{ "amount": 500000, "reason": "Kompensasi downtime" }
```
**Response `200 OK`** — refund/adjustment dibuat & tercatat.

---

## 5. GET /platform/tenants/{id}/invoices
Parameter: `filter[status]`, `sort=-due_date`, pagination.
```json
{
  "success": true,
  "data": [
    { "id": "inv_01H8...", "period": "2026-08", "amount": 5000000, "currency": "IDR", "status": "paid" }
  ],
  "pagination": { "page": 1, "per_page": 20, "total_items": 1, "total_pages": 1 }
}
```

---

## 6. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `UNKNOWN_FEATURE` | 422 | Feature tak dikenal saat susun plan |
| `INVALID_CYCLE` | 422 | Billing cycle tak valid / tak tersedia di plan |
| `PLAN_NAME_EXISTS` | 409 | Nama plan duplikat |
| `PLAN_IN_USE` | 409 | Plan masih dipakai tenant (hapus ditolak) |
| `INVALID_PLAN` | 422 | Plan tidak valid |
| `INVOICE_NOT_FOUND` | 404 | Invoice tidak ada |
| `REFUND_EXCEEDS_INVOICE` | 422 | Refund melebihi nilai invoice |
| `REAUTH_REQUIRED` | 401 | Aksi berbahaya butuh re-auth |
