# 05 · API Contract

Prefix `/api/v1/payroll`. Envelope standar HRMS. Semua endpoint dijaga **Entitlement** (fitur `payroll`) + **RBAC**. Aksi kritikal (approve, pay, close) mendukung `Idempotency-Key`.

---

## Ringkasan Endpoint

### Komponen Gaji (katalog & assignment)
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/payroll/components` | Katalog komponen tenant | `payroll:read` |
| POST | `/payroll/components` | Buat komponen | `payroll:config` |
| PATCH | `/payroll/components/{id}` | Ubah komponen | `payroll:config` |
| GET | `/payroll/employees/{id}/components` | Komponen milik karyawan | `payroll:read` |
| PUT | `/payroll/employees/{id}/components` | Set komponen & nilai karyawan | `payroll:config` |

### Konfigurasi Pajak & BPJS
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/payroll/config/ter` | Tabel TER berlaku | `payroll:read` |
| GET | `/payroll/config/bpjs` | Tarif & plafon BPJS berlaku | `payroll:read` |
| PATCH | `/payroll/config/bpjs` | Perbarui tarif/plafon (versi baru) | `payroll:config` |

### Payroll Run
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/payroll/runs` | Daftar run | `payroll:read` |
| POST | `/payroll/runs` | Buat run (draft) | `payroll:run` |
| GET | `/payroll/runs/{id}` | Detail run + total | `payroll:read` |
| POST | `/payroll/runs/{id}/calculate` | Hitung run | `payroll:run` |
| POST | `/payroll/runs/{id}/submit` | Kirim ke review | `payroll:run` |
| POST | `/payroll/runs/{id}/approve` | Setujui run | `payroll:approve` |
| POST | `/payroll/runs/{id}/pay` | Eksekusi pembayaran | `payroll:approve` |
| POST | `/payroll/runs/{id}/close` | Kunci run | `payroll:approve` |
| GET | `/payroll/runs/{id}/payslips` | Daftar slip dalam run | `payroll:read` |
| GET | `/payroll/runs/{id}/bank-file` | Unduh file transfer bank | `payroll:approve` |

### Payslip (karyawan)
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/payroll/payslips/{id}` | Detail slip | `payslip:read` (self/scope) |
| GET | `/payroll/me/payslips` | Slip milik sendiri | `payslip:read` (self) |

---

## 1. POST /payroll/runs
```json
{
  "period": "2026-01",
  "type": "regular",
  "branch_id": null,
  "pay_date": "2026-01-25"
}
```
`type`: `regular` | `thr` | `bonus` | `final`. `branch_id` null = seluruh tenant (butuh scope tenant).
**Response `201 Created`** → run status `draft`.

---

## 2. POST /payroll/runs/{id}/calculate
Menghitung semua karyawan dalam scope (async untuk jumlah besar).
**Response `202 Accepted`**
```json
{ "success": true, "data": { "job_id": "job_...", "status_url": "/api/v1/jobs/job_..." } }
```
Selesai → run status `calculated`; webhook `payroll.run.calculated`.

---

## 3. POST /payroll/runs/{id}/approve
Butuh peran checker; ditolak bila aktor = pembuat run.
**Response `200 OK`** → status `approved`.
**Error:** `409 SELF_APPROVAL_FORBIDDEN`, `409 INVALID_RUN_STATE`.

---

## 4. POST /payroll/runs/{id}/pay
```json
{ "method": "bank_file", "bank": "bca" }
```
Menghasilkan instruksi/berkas transfer & memicu pengiriman slip (Notification).
**Response `200 OK`** → status `paid`.

---

## 5. GET /payroll/runs/`{id}`
```json
{
  "success": true,
  "data": {
    "id": "run_01H8...",
    "period": "2026-01",
    "type": "regular",
    "status": "calculated",
    "totals": {
      "gross": 0, "bpjs_employee": 0, "bpjs_employer": 0,
      "pph21": 0, "net": 0, "employee_count": 120
    }
  }
}
```

---

## 6. GET /payroll/payslips/`{id}`
```json
{
  "success": true,
  "data": {
    "employee_id": "emp_...",
    "period": "2026-01",
    "earnings": [
      { "code": "basic", "name": "Gaji Pokok", "amount": 8000000 },
      { "code": "trans", "name": "Tunjangan Transport", "amount": 500000 }
    ],
    "deductions": [
      { "code": "bpjs_jht_ee", "name": "BPJS JHT (2%)", "amount": 160000 },
      { "code": "pph21", "name": "PPh 21", "amount": 250000 }
    ],
    "gross": 8500000, "total_deduction": 410000, "net": 8090000
  }
}
```

> Akses slip discope: karyawan hanya slip sendiri (`self`); payroll officer sesuai `branch`/`tenant`.

---

## 7. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `FEATURE_NOT_IN_PLAN` | 403 | Tenant tak berlangganan fitur payroll |
| `INVALID_RUN_STATE` | 409 | Transisi status run tidak valid |
| `SELF_APPROVAL_FORBIDDEN` | 409 | Pembuat run tak boleh menyetujui |
| `RUN_LOCKED` | 409 | Run sudah closed (read-only) |
| `MISSING_PTKP` | 422 | Status PTKP karyawan belum diisi |
| `CONFIG_NOT_FOUND` | 422 | Tabel TER/BPJS untuk periode tak tersedia |
| `VALIDATION_ERROR` | 400/422 | Input tidak valid |
