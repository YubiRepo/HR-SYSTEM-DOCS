# 03 · API Contract

Endpoint entitlement, prefix `/api/v1/entitlement`. Terutama dikonsumsi **service internal** (modul lain) untuk gerbang Feature/Limit. Mengikuti envelope standar HRMS.

---

## Ringkasan Endpoint

| Method | Endpoint | Deskripsi | Konsumen |
|---|---|---|---|
| GET | `/entitlement/tenants/{id}` | Entitlement efektif tenant | service internal |
| POST | `/entitlement/check` | Cek satu/lebih Feature & Limit | service internal |
| GET | `/entitlement/tenants/{id}/usage` | Ringkasan pemakaian vs limit | admin/tenant |

> Definisi & perubahan Plan/Feature/Limit ada di modul **Billing**. Override tenant diterapkan di Billing, dibaca di sini.

---

## 1. `GET /entitlement/tenants/{id}`

**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "tenant_id": "tenant_01H8...",
    "features": ["core_hr","attendance","leave","payroll","performance","recruitment","sso"],
    "limits": { "max_employees": 700, "max_branches": 10, "payroll.max_payslips_month": 600 },
    "subscription_status": "active"
  }
}
```

---

## 2. POST /entitlement/check

Cek cepat untuk gerbang di modul lain (hemat round-trip).

**Request**
```json
{
  "tenant_id": "tenant_01H8...",
  "features": ["payroll"],
  "limits": [{ "key": "max_employees", "current": 498, "adding": 5 }]
}
```
**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "features": { "payroll": true },
    "limits": { "max_employees": { "allowed": false, "limit": 500, "would_be": 503 } },
    "allow": false
  }
}
```
`allow` = true hanya bila semua Feature terpenuhi & semua Limit tidak terlampaui.

---

## 3. `GET /entitlement/tenants/{id}/usage`

Ringkasan pemakaian terkini vs limit (untuk dashboard & peringatan "mendekati batas").

**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "max_employees": { "used": 498, "limit": 500, "pct": 99.6 },
    "max_branches": { "used": 4, "limit": 10, "pct": 40 }
  }
}
```

---

## 4. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `FEATURE_NOT_IN_PLAN` | 403 | Tenant tak berlangganan fitur |
| `LIMIT_EXCEEDED` | 402 | Melewati batas kapasitas |
| `TENANT_NOT_FOUND` | 404 | Tenant tidak ditemukan |
| `VALIDATION_ERROR` | 400 | Input cek tidak valid |
