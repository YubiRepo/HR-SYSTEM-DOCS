# 05 · API Contract

Prefix `/api/v1/payroll`. Envelope standar HRMS. Semua endpoint dijaga **Entitlement** (fitur `payroll`) + **RBAC**. Aksi kritikal (approve, pay, close) mendukung `Idempotency-Key`.

---

## Ringkasan Endpoint

### Komponen Gaji (katalog & assignment)
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/payroll/components` | Katalog komponen tenant | `payroll:read` |
| GET | `/payroll/components/variables` | Variabel formula selain kode komponen: konstanta sistem, variabel Attendance/Leave, dan variabel per kode tenant (`ot_min_/ot_wmin_<KODE>`, `leave_days_<KODE>`, `shift_days_<KODE>`) — `[{name, group, code?}]` | `payroll:read` |
| POST | `/payroll/components` | Buat komponen | `payroll:config` |
| PATCH | `/payroll/components/{id}` | Ubah komponen | `payroll:config` |
| GET | `/payroll/employees/{id}/components` | Komponen milik karyawan | `payroll:read` |
| PUT | `/payroll/employees/{id}/components` | Set komponen & nilai karyawan | `payroll:config` |

### Konfigurasi Pajak & BPJS
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET / PUT | `/payroll/config` | Konfigurasi umum: cap potongan, `default_bpjs_programs` (null = semua), `default_jkk_risk_class`. PUT mengganti seluruh baris — kirim ulang field yang tidak diubah | `payroll:read` / `payroll:config` |
| GET / POST | `/payroll/config/bpjs` | Tarif & plafon BPJS (POST = baris versi baru). JKK boleh satu baris per `risk_class`; duplikat dicek per (program, risk_class, effective_from) | `payroll:read` / `payroll:config` |
| GET / POST | `/payroll/config/pph21-ter-rates` | Tabel TER A/B/C | `payroll:read` / `payroll:config` |
| GET / POST | `/payroll/config/pph21-brackets` | Tarif progresif Pasal 17 (rekonsiliasi Desember) | `payroll:read` / `payroll:config` |
| GET / POST | `/payroll/config/pph21-ptkp-rates` | Master PTKP: status, PTKP tahunan, kategori TER. `GET ?as_of=YYYY-MM-DD` = hanya versi yang berlaku pada tanggal itu (dipakai dropdown PTKP tax profile). POST duplikat `(ptkp_status, effective_from)` → `409 CONFLICT` | `payroll:read` / `payroll:config` |
| GET / POST | `/payroll/config/pph21-tax-parameters` | Biaya jabatan (`occupational_expense_pct`, `occupational_expense_annual_cap`). POST duplikat `effective_from` → `409 CONFLICT` | `payroll:read` / `payroll:config` |

Semua tabel konfigurasi pajak/BPJS **append-only**: perubahan = baris baru dengan `effective_from` baru, tidak ada edit/hapus, sehingga run lama tetap bisa direproduksi.

`PUT /payroll/employees/{id}/tax-profile`: `ptkp_status` divalidasi terhadap master PTKP yang berlaku hari ini dan `ter_category` diisi dari master. Status tidak ada di master → `INVALID_TAX_PROFILE_ARGUMENT`; tenant belum punya master → `CONFIG_NOT_FOUND`.
- `tax_treatment`: `subject` (default) / `dtp` / `exempt` (P11). `dtp_eligible: true` masih diterima bila `tax_treatment` kosong (→ `dtp`); response tetap mengirim `dtp_eligible` turunan.
- `has_npwp` di request diabaikan: nilainya diturunkan dari NPWP karyawan di Core HR. Response menambah `npwp` (read-only).
- Simpan pertama membuat kepesertaan BPJS awal dari default tenant bila karyawan belum punya.

### Kepesertaan BPJS (P11)
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/payroll/employees/{id}/bpjs-enrollments` | Semua baris kepesertaan karyawan. Kosong = masih dikenakan semua program | `payroll:read` |
| PUT | `/payroll/employees/{id}/bpjs-enrollments` | Body `{ "enrollments": [ { program, is_enrolled, membership_number, risk_class, wage_base_override, exclusion_reason, effective_from, effective_to } ] }` — mengganti seluruh baris dalam satu transaksi. Overlap per program / `risk_class` di luar JKK → `INVALID_BPJS_ENROLLMENT_ARGUMENT` (422) | `payroll:config` |

Payslip (`GET /payroll/payslips/{id}`, `/runs/{id}/payslips`) menambah snapshot P11: `taxable_gross`, `pph21_dtp`, `tax_treatment`, `ptkp_status`, `ter_category`, `ter_rate`, `has_npwp`, `npwp`, `bpjs_details[]`.

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
  "pay_date": "2026-01-25",
  "target": {
    "branch_id": null,
    "department_id": null,
    "grade_id": null,
    "salary_type": "monthly",
    "employment_type": null,
    "pay_cycle": "monthly",
    "employee_ids": []
  }
}
```
`type`: `regular` | `thr` | `bonus` | `final`. `target` = filter peserta fleksibel (semua opsional; kosong = semua karyawan aktif dalam scope). Kombinasi filter menentukan siapa yang masuk run.
**Response `201 Created`** → run status `draft`.

---

## 2. POST /payroll/runs/{id}/calculate
Menghitung semua karyawan dalam scope (async untuk jumlah besar).
**Response `202 Accepted`**
```json
{ "success": true, "data": { "job_id": "job_...", "status_url": "/api/v1/jobs/job_..." } }
```
Selesai → run status `calculated`; webhook `payroll.run.calculated`.

Response juga membawa `warnings` (array string, tidak memblokir) — mis. karyawan yang belum punya kepesertaan BPJS dan masih dikenakan semua program (P11). JKK tanpa kelas risiko yang bisa ditentukan (beberapa tarif JKK, tanpa kelas di kepesertaan maupun `default_jkk_risk_class`) → `422 CONFIG_NOT_FOUND`.

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

## 5. GET /payroll/runs/{id}
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

## 6. GET /payroll/payslips/{id}
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
| `ATTENDANCE_PENDING_ITEMS` | 409 | Masih ada OT `pending_review` / koreksi absensi `pending` di rentang periode (lihat `07` §1.3) |
| `ATTENDANCE_NOT_READY` | 422 | Evaluasi attendance gagal untuk sebagian hari, atau data Attendance/Leave gagal dibaca |
| `CONFIG_NOT_FOUND` | 422 | Tabel TER/BPJS untuk periode tak tersedia |
| `VALIDATION_ERROR` | 400/422 | Input tidak valid |
