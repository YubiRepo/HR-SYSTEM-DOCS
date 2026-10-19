# 03 · API Contract

Mengikuti envelope standar HRMS. Prefix platform staff: `/api/v1/platform`. Prefix self-service tenant: `/api/v1/entitlement`.

---

## Ringkasan Endpoint

### Master benefit & plan (platform, `platform_entitlement:*`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/platform/benefits` | Daftar master benefit |
| POST | `/platform/benefits` | Buat benefit (`key, name, description, module, type, unit, sort_order`) |
| PATCH | `/platform/benefits/{key}` | Ubah benefit (key & type tetap) |
| DELETE | `/platform/benefits/{key}` | Nonaktifkan (soft). `409 BENEFIT_IN_USE` bila masih aktif di plan aktif |
| GET/POST | `/platform/plans` | Daftar / buat plan (dengan `benefits[]`) |
| GET/PATCH/DELETE | `/platform/plans/{id}` | Detail / ganti seluruh atribut & matriks / arsipkan |
| PUT | `/platform/plans/{id}/benefits/{key}` | Ubah satu sel matriks: `{enabled, quota}` atau `{remove: true}` |
| POST | `/platform/plans/{id}/reorder` | Geser urutan katalog |

### Subscription & entitlement tenant

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/platform/tenants/{id}/subscription` | Plan, periode, access mode, snapshot benefit |
| POST | `/platform/tenants/{id}/subscription` | Ganti plan (+ `period_end` opsional), snapshot ulang |
| POST | `/platform/tenants/{id}/overrides` | Terapkan override benefit |
| GET | `/platform/entitlement/tenants/{id}` | Entitlement efektif |
| POST | `/platform/entitlement/check` | Cek benefit & quota |
| GET | `/platform/entitlement/tenants/{id}/usage` | Pemakaian vs quota |
| GET | `/entitlement/me` | Entitlement efektif tenant sendiri (tanpa permission, untuk gating menu) |
| GET | `/entitlement/subscription` | Subscription tenant sendiri (termasuk snapshot) |
| POST | `/entitlement/subscription/change` | Ganti plan self-service (`period_end` diabaikan) |
| GET | `/entitlement/usage` | Pemakaian tenant sendiri |

---

## 1. Plan dengan benefit

```json
{
  "id": "…",
  "name": "Starter",
  "benefits": [
    { "key": "attendance", "enabled": true, "quota": null },
    { "key": "max_employees", "enabled": true, "quota": 50 },
    { "key": "payroll", "enabled": false, "quota": null }
  ],
  "pricing": { "model": "pepm", "currency": "IDR", "rate": 15000 },
  "billing_cycles": [{ "code": "monthly", "months": 1, "discount_pct": 0 }],
  "is_public": true, "trial_days": 14, "is_active": true, "sort_order": 2
}
```
Benefit `quota` yang `enabled` wajib punya `quota` ≥ -1 (`422 INVALID_BENEFIT`). Key yang tidak terdaftar atau nonaktif → `422 UNKNOWN_BENEFIT`.

---

## 2. `POST /platform/tenants/{id}/subscription`

```json
{ "plan_id": "…", "billing_cycle": "monthly", "seat_count": 25, "proration": true, "period_end": "2026-12-31" }
```
- `period_end` (opsional, inklusif) = "aktif sampai" untuk kontrak khusus. Default: sekarang + bulan siklus.
- Snapshot benefit diambil dari plan tujuan dalam transaksi yang sama.
- Ditolak `402 LIMIT_EXCEEDED` bila pemakaian saat ini melebihi quota plan tujuan.

Respons `GET …/subscription`:
```json
{
  "tenant_id": "…", "plan_id": "…", "plan_name": "Free", "billing_cycle": "monthly",
  "status": "active", "period_start": "2026-10-19T07:25:47Z", "period_end": "2027-01-01T00:00:00Z",
  "seat_count": 1, "access_mode": "full", "grace_ends_at": "2027-01-08T00:00:00Z",
  "benefits": [
    { "key": "max_branches", "name": "Branches", "type": "quota", "enabled": true, "quota": 1,
      "source_plan_id": "…", "snapshot_at": "2026-10-19T07:25:47Z" }
  ]
}
```

---

## 3. `POST /platform/tenants/{id}/overrides`

```json
{ "benefits": { "payroll": { "enabled": true }, "max_employees": { "enabled": true, "quota": 40 } },
  "reason": "pilot payroll", "expires_at": "2026-12-31" }
```

---

## 4. `POST /platform/entitlement/check`

```json
{ "tenant_id": "…", "benefits": ["payroll"], "quotas": [{ "key": "max_employees", "current": 498, "adding": 5 }] }
```
```json
{ "access_mode": "full", "benefits": { "payroll": true },
  "quotas": { "max_employees": { "allowed": false, "quota": 500, "would_be": 503 } }, "allow": false }
```
`allow` = true hanya bila access mode `full`, semua benefit aktif, dan tidak ada quota terlampaui.

---

## 5. Usage

```json
{ "max_employees": { "name": "Active Employees", "used": 12, "quota": 15, "pct": 80 },
  "max_branches":  { "name": "Branches", "used": 1, "quota": -1, "pct": 0 } }
```

---

## 6. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `FEATURE_NOT_IN_PLAN` | 403 | Benefit tidak termasuk subscription tenant |
| `LIMIT_EXCEEDED` | 402 | Melewati quota (atau downgrade di bawah pemakaian) |
| `SUBSCRIPTION_READ_ONLY` | 402 | Subscription lewat `period_end + grace` / tenant suspended: write diblok |
| `SUBSCRIPTION_INACTIVE` | 402 | Tidak ada subscription / canceled / terminated |
| `UNKNOWN_BENEFIT` | 422 | Key benefit tidak terdaftar / nonaktif |
| `INVALID_BENEFIT` | 422 | Nilai benefit tidak valid (key, tipe, quota) |
| `BENEFIT_EXISTS` | 409 | Key benefit sudah ada |
| `BENEFIT_IN_USE` | 409 | Benefit masih aktif di plan aktif |
