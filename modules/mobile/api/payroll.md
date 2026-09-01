<!-- 📁 modules/mobile/api/payroll.md -->
# Mobile API · Payroll

Endpoint Payroll yang dipakai aplikasi mobile — terbatas pada **lihat slip & pinjaman sendiri**, dan **approval run** untuk manajer. Setup payroll tetap di web.

> Referensi lengkap: [`../../payroll/05-api-contract.md`](../../payroll/05-api-contract.md). Data gaji sensitif — akses ketat sesuai RBAC.

---

## 1. Daftar Slip Gaji Saya — `GET /payroll/me/payslips`
**Role:** karyawan.

```json
{
  "success": true,
  "data": [
    { "period": "2026-08", "net_pay": 9137000, "status": "paid", "pay_date": "2026-08-25" },
    { "period": "2026-07", "net_pay": 9137000, "status": "paid", "pay_date": "2026-07-25" }
  ]
}
```

---

## 2. Detail Slip — `GET /payroll/me/payslips/{period}`
**Role:** karyawan.

`GET /payroll/me/payslips/2026-08`
```json
{
  "success": true,
  "data": {
    "period": "2026-08",
    "earnings": [
      { "name": "Gaji Pokok", "amount": 8000000 },
      { "name": "Tunjangan Transport", "amount": 500000 },
      { "name": "Uang Lembur", "amount": 416000 }
    ],
    "deductions": [
      { "name": "BPJS (karyawan)", "amount": -320000 },
      { "name": "PPh 21", "amount": -259000 },
      { "name": "Cicilan Pinjaman", "amount": -500000 }
    ],
    "gross": 8916000,
    "net_pay": 9137000,
    "status": "paid"
  }
}
```
> Slip hanya untuk diri sendiri (`payslip:self`). Angka dalam minor unit / rupiah penuh sesuai konvensi API.

---

## 3. Pinjaman & Sisa Saya — `GET /payroll/me/loans`
**Role:** karyawan.

```json
{
  "success": true,
  "data": [
    { "id": "loan_...", "type": "loan", "principal": 3000000, "outstanding": 2000000, "installment": 500000, "status": "active" }
  ]
}
```

---

## 4. Approval Payroll Run — `POST /payroll/runs/{id}/approve`
**Role:** manajer/approver (maker-checker). Aksi ringkas dari mobile.

**Request**
```json
{ "decision": "approve", "note": "sesuai" }
```
**Response `200`** → run status `approved`.
**Error:** `409 NOT_APPROVER`, `409 INVALID_STATE` (run belum `in_review`).

> Menjalankan/menghitung run (`calculate`) tetap di web; mobile hanya untuk **menyetujui** run yang sudah siap.

---

## Catatan Mobile
- **Tidak ada** setup komponen/grade/tarif di mobile — itu web.
- Slip bisa diunduh sebagai PDF (link dari detail slip).
- Semua akses gaji dijaga RBAC; manajer tanpa izin payroll tidak melihat rupiah, hanya jam (lihat Attendance).
