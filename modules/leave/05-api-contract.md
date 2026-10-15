# 05 · API Contract

Prefix `/api/v1/leave`. Envelope standar HRMS. Dijaga Entitlement (fitur `leave`) + RBAC (scope self/branch/tenant).

---

## Ringkasan Endpoint

### Jenis Cuti & Aturan
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/leave/types` | Daftar jenis cuti | `leave:read` |
| POST | `/leave/types` | Buat jenis (custom) | `leave:config` |
| PATCH | `/leave/types/{id}` | Ubah jenis/aturan | `leave:config` |
| GET | `/leave/approval-flows` | Daftar alur approval | `leave:read` |
| POST | `/leave/approval-flows` | Buat/ubah alur | `leave:config` |

### Saldo
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/leave/me/balance` | Saldo cuti sendiri | `leave:self` |
| GET | `/leave/me/balance/preview?type_code=&date=` | Saldo sendiri yang akan dicek bila cuti dimulai `date` (akrual monthly dihitung s/d `date`; saldo belum ada → disimulasikan) | `leave:self` |
| GET | `/leave/balances` | Saldo (filter karyawan/jenis) | `leave:read` |
| GET | `/leave/balances/preview?employee_id=&type_code=&date=` | Sama seperti di atas, untuk karyawan tertentu | `leave:read` |
| POST | `/leave/balances/adjust` | Penyesuaian saldo manual (HR) | `leave:config` |
| POST | `/leave/balances/rollover` | Proses carry-over periode | `leave:config` |

### Pengajuan & Approval
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| POST | `/leave/requests` | Ajukan cuti | `leave:self` |
| GET | `/leave/me/requests` | Riwayat pengajuan sendiri | `leave:self` |
| GET | `/leave/requests` | Daftar pengajuan (manajer/HR) | `leave:read` |
| POST | `/leave/requests/{id}/approve` | Setujui (step berjalan) | `leave:approve` |
| POST | `/leave/requests/{id}/reject` | Tolak | `leave:approve` |
| POST | `/leave/requests/{id}/cancel` | Batalkan (karyawan) | `leave:self` |
| GET | `/leave/calendar` | Kalender cuti tim | `leave:read` |

---

## 1. POST /leave/requests
```json
{
  "type_code": "annual",
  "date_from": "2026-02-10",
  "date_to": "2026-02-12",
  "reason": "keperluan keluarga",
  "document_ref": null
}
```
**Response `201 Created`**
```json
{
  "success": true,
  "data": {
    "id": "lreq_01H8...",
    "type_code": "annual",
    "days": 3,
    "status": "pending",
    "current_step": { "step": 1, "approver_role": "manager" }
  }
}
```
**Error:** `422 INSUFFICIENT_BALANCE`, `422 NOT_ELIGIBLE`, `422 DOCUMENT_REQUIRED`, `409 DATE_CONFLICT`.

---

## 2. GET /leave/me/balance
```json
{
  "success": true,
  "data": [
    { "type_code": "annual", "quota": 12, "used": 4, "pending": 3, "balance": 5 },
    { "type_code": "sick", "quota": null, "used": 2, "balance": null }
  ]
}
```

---

## 3. POST /leave/requests/{id}/approve
Menyetujui step yang sedang berjalan. Bila masih ada step berikutnya → lanjut; bila step terakhir → `approved`.
```json
{ "note": "disetujui" }
```
**Response `200 OK`**
```json
{ "success": true, "data": { "status": "pending", "current_step": { "step": 2, "approver_role": "hr_admin" } } }
```
**Error:** `409 NOT_CURRENT_APPROVER`, `409 INVALID_STATE`.

---

## 4. GET /leave/calendar
`GET /leave/calendar?team=div_it&month=2026-02`
```json
{
  "success": true,
  "data": [
    { "employee_id": "emp_budi", "type_code": "annual", "from": "2026-02-10", "to": "2026-02-12" },
    { "employee_id": "emp_sari", "type_code": "sick", "from": "2026-02-11", "to": "2026-02-11" }
  ]
}
```

---

## 5. POST /leave/balances/rollover
Memproses carry-over akhir periode (job otomatis / manual HR).
```json
{ "period": "2026", "type_code": "annual" }
```
**Response `200 OK`** — sisa diproses sesuai kebijakan (carry-over/hangus).

---

## 6. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `FEATURE_NOT_IN_PLAN` | 403 | Tenant tak berlangganan fitur leave |
| `INSUFFICIENT_BALANCE` | 422 | Saldo cuti tak cukup |
| `NOT_ELIGIBLE` | 422 | Belum memenuhi syarat (masa kerja/gender) |
| `DOCUMENT_REQUIRED` | 422 | Lampiran wajib (mis. surat dokter) |
| `DATE_CONFLICT` | 409 | Bentrok cuti lain / tanggal invalid |
| `NOT_CURRENT_APPROVER` | 409 | Bukan approver step berjalan |
| `INVALID_STATE` | 409 | Transisi status tidak valid |
