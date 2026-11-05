<!-- 📁 modules/mobile/api/payroll.md -->
# Mobile API · Payroll

Endpoint Payroll untuk aplikasi mobile: **slip gaji sendiri** dan **approval run** untuk approver. Prefix `/api/v1/payroll`, dijaga entitlement `payroll` dan RBAC. Setup payroll tetap di web.

> Referensi lengkap: [`../../payroll/05-api-contract.md`](../../payroll/05-api-contract.md). Data gaji sensitif.

---

## 1. Daftar Slip Saya — `GET /payroll/me/payslips`
**Permission:** `payslip:self`. Hanya slip dari run berstatus `approved` / `paid` / `closed`. Run yang masih `draft` / `calculated` / `in_review` tidak tampil karena angkanya masih bisa berubah.
```json
{
  "success": true,
  "data": [
    {
      "id": "…", "run_id": "…", "employee_id": "…",
      "period": "2026-08", "pay_date": "2026-08-25", "run_status": "paid",
      "gross": 8916000, "bpjs_employee": 320000, "bpjs_employer": 0,
      "pph21": 259000, "other_deductions": 500000, "net": 7837000
    }
  ]
}
```
Nominal dalam rupiah penuh (integer).

## 2. Detail Slip — `GET /payroll/me/payslips/{id}`
**Permission:** `payslip:self`. Bentuknya sama dengan satu item §1. Slip milik orang lain atau slip yang belum rilis mengembalikan `404`.

## 3. Rincian Komponen — `GET /payroll/me/payslips/{id}/lines`
**Permission:** `payslip:self`.
```json
{
  "success": true,
  "data": [
    { "component_code": "BASIC", "name": "Gaji Pokok", "type": "earning", "amount": 8000000 },
    { "component_code": "LOAN", "name": "Cicilan Pinjaman", "type": "deduction", "amount": 500000 }
  ]
}
```
BPJS karyawan dan PPh 21 tidak muncul sebagai baris; nilainya ada di field `bpjs_employee` / `pph21` pada §2.

## 4. Unduh PDF — `GET /payroll/me/payslips/{id}/pdf`
**Permission:** `payslip:self`. Response `application/pdf` (`Content-Disposition: inline`). Isinya kop perusahaan, identitas karyawan, pendapatan, potongan (termasuk BPJS & PPh 21), dan take home pay.

## 5. Approve Payroll Run — `POST /payroll/runs/{id}/approve`
**Permission:** `payroll:approve` (maker-checker). Body kosong. Run harus berstatus `in_review`. Menghitung dan submit run tetap dilakukan di web.

---

## Catatan Mobile
- **Pinjaman & cicilan belum tersedia di API.** Potongan cicilan saat ini hanya terlihat sebagai baris `deduction` di §3.
- Endpoint `GET /payroll/payslips/{id}` (tanpa `/me`) adalah untuk HR (`payslip:read`), bukan untuk karyawan.
