# 05 · API Contract

Prefix `/api/v1/attendance`. Envelope standar HRMS. Dijaga Entitlement (fitur `attendance`) + RBAC (scope cabang/self).

---

## Ringkasan Endpoint

### Clock & Records
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| POST | `/attendance/clock-in` | Clock in | `attendance:self` |
| POST | `/attendance/clock-out` | Clock out | `attendance:self` |
| GET | `/attendance/me` | Kehadiran sendiri (catatan absen) | `attendance:self` |
| GET | `/attendance/me/schedule` | **Jadwal sendiri** (shift ke depan) | `attendance:self` |
| GET | `/attendance/me/today` | Jadwal & status hari ini | `attendance:self` |
| GET | `/attendance/records` | Daftar catatan (filter) | `attendance:read` |
| POST | `/attendance/records` | Input manual (HR) | `attendance:write` |
| POST | `/attendance/records/{id}/correction` | Ajukan/terapkan koreksi | `attendance:self` / `attendance:write` |
| POST | `/attendance/corrections/{id}/approve` | Setujui koreksi | `attendance:approve` |

### Shift & Schedule
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/attendance/shifts` | Katalog shift | `attendance:read` |
| POST | `/attendance/shifts` | Buat shift | `attendance:config` |
| GET | `/attendance/schedules` | Jadwal (filter tanggal/karyawan) | `attendance:read` |
| POST | `/attendance/schedules` | Tugaskan shift (single/pola/rotasi) | `attendance:write` |
| POST | `/attendance/schedules/generate` | Generate baris dari pola (rentang tertentu) | `attendance:write` |
| GET | `/attendance/holidays` | Kalender libur | `attendance:read` |
| POST | `/attendance/holidays` | Kelola libur | `attendance:config` |

### Overtime & Rekap
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| POST | `/attendance/overtime/{id}/approve` | Setujui lembur | `attendance:approve` |
| GET | `/attendance/summary` | Rekap periode (untuk Payroll) | `attendance:read` |

---

## 1. POST /attendance/clock-in
```json
{ "timestamp": "2026-01-15T08:03:00+07:00", "lat": -6.200, "lng": 106.816, "source": "mobile", "photo_ref": "storage://..." }
```
**Response `201 Created`**
```json
{
  "success": true,
  "data": { "id": "att_01H8...", "clock_in": "08:03", "status": "present", "geofence": "ok" }
}
```
**Error:** `422 OUTSIDE_GEOFENCE`, `409 ALREADY_CLOCKED_IN`.

---

## 2. POST /attendance/schedules
Menugaskan shift — mendukung pola & rotasi.
```json
{
  "employee_ids": ["emp_01H8..."],
  "pattern": "weekly",
  "days": ["mon","tue","wed","thu","fri"],
  "shift_id": "shift_pagi",
  "date_from": "2026-01-01",
  "date_to": "2026-01-31"
}
```
**Response `201 Created`** — jadwal dibuat untuk rentang tanggal.

> **Scope:** `GET/POST /attendance/schedules` untuk HR/manajer (izin `read`/`write`, lihat/atur jadwal orang lain, difilter cabang). Karyawan memakai `/attendance/me/schedule` (izin `self`, hanya jadwal sendiri).

---

## 2b. GET /attendance/me/schedule

Karyawan melihat **jadwal shift-nya sendiri** ke depan. Read-only.

`GET /attendance/me/schedule?date_from=2026-01-15&date_to=2026-01-21`
```json
{
  "success": true,
  "data": [
    { "date": "2026-01-15", "shift": { "name": "Reguler", "start": "08:00", "end": "17:00" }, "status": "scheduled" },
    { "date": "2026-01-16", "shift": { "name": "Reguler", "start": "08:00", "end": "17:00" }, "status": "scheduled" },
    { "date": "2026-01-17", "shift": null, "status": "day_off" },
    { "date": "2026-01-18", "shift": null, "status": "holiday", "holiday_name": "Contoh Libur" }
  ]
}
```
Menampilkan shift per tanggal, hari libur, dan day-off — agar karyawan tahu kapan & jam berapa harus masuk.

---

## 2c. GET /attendance/me/today

Ringkasan hari ini untuk layar utama karyawan (mobile): jadwal hari ini + apakah sudah clock-in.
```json
{
  "success": true,
  "data": {
    "date": "2026-01-15",
    "shift": { "name": "Reguler", "start": "08:00", "end": "17:00" },
    "clock_in": "08:03",
    "clock_out": null,
    "status": "present"
  }
}
```

---

## 3. GET /attendance/summary
Rekap periode per karyawan — endpoint utama yang dikonsumsi Payroll.

`GET /attendance/summary?period=2026-01&employee_id=emp_01H8...`
```json
{
  "success": true,
  "data": {
    "employee_id": "emp_01H8...",
    "period": "2026-01",
    "work_days": 22,
    "present_days": 20,
    "late_count": 3,
    "late_minutes": 40,
    "overtime_hours": 6,
    "absent_days": 1,
    "leave_days": 1
  }
}
```

---

## 4. POST /attendance/overtime/{id}/approve
```json
{ "approved_hours": 1.5, "note": "Lembur closing" }
```
**Response `200 OK`** — lembur disetujui & masuk rekap. Hanya lembur disetujui yang dikirim ke Payroll (bila aturan `perlu persetujuan` aktif).

---

## 5. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `FEATURE_NOT_IN_PLAN` | 403 | Tenant tak berlangganan fitur attendance |
| `OUTSIDE_GEOFENCE` | 422 | Clock-in di luar area kerja |
| `ALREADY_CLOCKED_IN` | 409 | Sudah clock-in & belum clock-out |
| `NO_SCHEDULE` | 422 | Tidak ada jadwal & tanpa default |
| `CORRECTION_NOT_ALLOWED` | 409 | Periode sudah dikunci Payroll |
| `VALIDATION_ERROR` | 400/422 | Input tidak valid |
