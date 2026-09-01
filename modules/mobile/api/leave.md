<!-- 📁 modules/mobile/api/leave.md -->
# Mobile API · Leave

Endpoint Leave (cuti) yang dipakai aplikasi mobile. Envelope standar + auth. Dijaga Entitlement + RBAC.

> Referensi lengkap: [`../../leave/05-api-contract.md`](../../leave/05-api-contract.md).

---

## 1. Saldo Cuti Saya — `GET /leave/me/balance`
**Role:** karyawan.

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

## 2. Ajukan Cuti — `POST /leave/requests`
**Role:** karyawan.

**Request**
```json
{
  "type_code": "annual",
  "date_from": "2026-09-10",
  "date_to": "2026-09-12",
  "reason": "keperluan keluarga",
  "document_ref": null
}
```
**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "lreq_01H...",
    "days": 3,
    "status": "pending",
    "current_step": { "step": 1, "approver_role": "manager" }
  }
}
```
**Error:** `422 INSUFFICIENT_BALANCE`, `422 NOT_ELIGIBLE`, `422 DOCUMENT_REQUIRED`, `409 DATE_CONFLICT`.

---

## 3. Riwayat Pengajuan Saya — `GET /leave/me/requests`
**Role:** karyawan.

```json
{
  "success": true,
  "data": [
    { "id": "lreq_01H...", "type_code": "annual", "date_from": "2026-09-10", "date_to": "2026-09-12", "days": 3, "status": "pending" }
  ]
}
```

---

## 4. Batalkan Pengajuan — `POST /leave/requests/{id}/cancel`
**Role:** karyawan (sebelum final).

**Response `200`** → status `cancelled` (saldo dikembalikan bila sudah terpotong).
**Error:** `409 INVALID_STATE`.

---

## 5. Approve / Reject Cuti — `POST /leave/requests/{id}/approve` · `/reject`
**Role:** manajer/HR.

**Request (approve)**
```json
{ "note": "disetujui" }
```
**Response `200`** — bila ada step berikutnya → lanjut; bila terakhir → `approved`.
```json
{ "success": true, "data": { "status": "pending", "current_step": { "step": 2, "approver_role": "hr_admin" } } }
```
**Error:** `409 NOT_CURRENT_APPROVER`.

---

## 6. Kalender Cuti Tim — `GET /leave/calendar`
**Role:** manajer/HR.

`GET /leave/calendar?team=div_it&month=2026-09`
```json
{
  "success": true,
  "data": [
    { "employee_id": "emp_budi", "type_code": "annual", "from": "2026-09-10", "to": "2026-09-12" }
  ]
}
```

---

## Catatan Mobile
- Lampiran (surat dokter) di-upload dulu → `document_ref` dikirim di pengajuan.
- Approval memakai reporting line (Core HR); app menampilkan yang perlu diputuskan manajer.
