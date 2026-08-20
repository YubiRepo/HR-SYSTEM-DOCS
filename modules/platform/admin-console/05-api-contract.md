# 05 · API Contract

Endpoint operasional, prefix `/api/v1/platform`. Admin platform + MFA. Impersonation & audit sangat dibatasi.

---

## Ringkasan Endpoint

| Method | Endpoint | Deskripsi | Peran |
|---|---|---|---|
| GET | `/platform/metrics` | Metrik agregat platform | viewer+ |
| GET | `/platform/health` | Status kesehatan sistem | viewer+ |
| GET | `/platform/tenants/{id}/usage` | Pemakaian vs limit tenant | support+ |
| POST | `/platform/tenants/{id}/impersonate` | Mulai sesi impersonation | support+ |
| POST | `/platform/impersonation/{id}/end` | Akhiri sesi impersonation | support+ |
| GET | `/platform/audit-logs` | Log audit platform | super_admin |

---

## 1. GET /platform/metrics
Parameter: `range`, `group_by=status|plan|month`.
```json
{
  "success": true,
  "data": {
    "tenants": { "total": 320, "active": 260, "trial": 45, "suspended": 15 },
    "mrr": 0,
    "trial_conversion_rate": 0.38
  }
}
```

---

## 2. GET /platform/health
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime_pct": 99.97,
    "error_rate": 0.002,
    "jobs": { "queued": 3, "failed_24h": 1 }
  }
}
```

---

## 3. `POST /platform/tenants/{id}/impersonate`
```json
{ "reason": "Bantu setup payroll", "scope": "read_only", "duration_minutes": 30 }
```
**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "impersonation_id": "imp_01H8...",
    "impersonation_token": "imp_tok_...",
    "expires_at": "2026-08-11T17:30:00Z",
    "scope": "read_only"
  }
}
```
Token mengikuti Auth (klaim `act_as`, masa berlaku pendek). Semua aksi selama sesi tercatat. **Error:** `403 IMPERSONATION_NOT_ALLOWED`.

---

## 4. GET /platform/audit-logs
Parameter: `filter[event]`, `filter[tenant_id]`, `filter[admin_user_id]`, `sort=-created_at`, pagination.
```json
{
  "success": true,
  "data": [
    { "event": "impersonation.started", "admin_user_id": "usr_...", "tenant_id": "tenant_...", "created_at": "2026-08-11T17:00:00Z" }
  ],
  "pagination": { "page": 1, "per_page": 20, "total_items": 1, "total_pages": 1 }
}
```

---

## 5. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `IMPERSONATION_NOT_ALLOWED` | 403 | Scope/aksi dilarang untuk impersonation |
| `IMPERSONATION_EXPIRED` | 401 | Sesi impersonation kedaluwarsa |
| `PERMISSION_DENIED` | 403 | Peran platform tak mencukupi |
| `REAUTH_REQUIRED` | 401 | Aksi sensitif butuh re-auth |
