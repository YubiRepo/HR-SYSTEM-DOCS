<!-- 📁 modules/mobile/api/attendance.md -->
# Mobile API · Attendance

Endpoint Attendance yang dipakai aplikasi mobile. Semua memakai envelope standar HRMS & header auth (Bearer token). Dijaga Entitlement + RBAC.

> Referensi lengkap: [`../../attendance/05-api-contract.md`](../../attendance/05-api-contract.md). Dokumen ini hanya subset yang relevan untuk mobile + contoh.

---

## 1. Clock In / Out — `POST /attendance/clock`
**Role:** karyawan. Fitur inti harian.

**Request**
```json
{
  "type": "in",
  "method": "mobile_gps",
  "timestamp": "2026-09-01T08:03:00+07:00",
  "location": { "lat": -6.2088, "lng": 106.8456, "accuracy_m": 12, "is_mock": false },
  "selfie_ref": "tmp_upload_abc",
  "device_id": "dev_budi_hp"
}
```
- `type`: `in` / `out`
- `method`: `mobile_gps` / `mobile_face` / `nfc`
- `location`: wajib bila geofence aktif; `accuracy_m` & `is_mock` untuk validasi (lihat `../../attendance/11-geofence.md`)
- `selfie_ref`: bila `require_photo`/`mobile_face`

**Response `201`**
```json
{
  "success": true,
  "data": {
    "record_id": "att_01H...",
    "type": "in",
    "clock_in": "08:03",
    "status": "present",
    "late_minutes": 3,
    "within_geofence": true
  }
}
```
**Error:** `422 OUTSIDE_GEOFENCE`, `422 MOCK_LOCATION_DETECTED`, `422 OUTSIDE_CLOCK_WINDOW`, `409 ALREADY_CLOCKED_IN`, `403 METHOD_NOT_ALLOWED`.

---

## 1a. Config Geofence (untuk preview di HP) — `GET /attendance/me/geofence`
**Role:** karyawan. **Di-load sekali** saat buka app / masuk layar absen, agar HP bisa menghitung "di dalam/luar zona" secara **real-time lokal** tanpa memanggil server tiap detik.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "geofence_enabled": true,
    "branch": { "id": "branch_jkt", "name": "Jakarta", "lat": -6.2088, "lng": 106.8456 },
    "radius_m": 100,
    "accuracy_threshold_m": 50
  }
}
```
- `geofence_enabled: false` → app tak perlu cek lokasi (mis. WFH/flexible).
- HP memakai `branch.lat/lng` + `radius_m` untuk menghitung jarak lokal (Haversine) dan memperbarui UI saat GPS bergerak.
- `accuracy_threshold_m` → bila akurasi GPS lebih buruk dari ini, app minta user tunggu sinyal lebih baik.

> Ini **hanya untuk preview UX**. Keputusan akhir tetap di server saat `POST /attendance/clock` (§1) — server menghitung ulang & cek anti-fake. Lihat pola preview vs final di `../../attendance/11-geofence.md`.

---

## 2. Ringkasan Hari Ini — `GET /attendance/me/today`
**Role:** karyawan. Untuk layar utama app.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "date": "2026-09-01",
    "shift": { "name": "Pagi", "start": "08:00", "end": "17:00" },
    "clock_in": "08:03",
    "clock_out": null,
    "status": "present",
    "can_clock_out": true
  }
}
```

---

## 3. Jadwal Saya — `GET /attendance/me/schedule`
**Role:** karyawan.

`GET /attendance/me/schedule?date_from=2026-09-01&date_to=2026-09-07`
```json
{
  "success": true,
  "data": [
    { "date": "2026-09-01", "shift": "Pagi", "start": "08:00", "end": "17:00" },
    { "date": "2026-09-02", "shift": "Pagi", "start": "08:00", "end": "17:00" },
    { "date": "2026-09-03", "shift": null, "note": "Libur" }
  ]
}
```

---

## 4. Ajukan Koreksi (Lupa Absen) — `POST /attendance/corrections`
**Role:** karyawan.

**Request**
```json
{
  "date": "2026-08-31",
  "field": "clock_out",
  "proposed_time": "17:00",
  "reason": "lupa absen pulang"
}
```
**Response `201`** → status `pending` (menunggu approval manajer/HR).
**Error:** `409 PERIOD_LOCKED` (periode payroll sudah closed).

---

## 5. Approval Koreksi/Lembur — `POST /attendance/corrections/{id}/approve`
**Role:** manajer/HR.

**Request**
```json
{ "decision": "approve", "note": "ok" }
```
`decision`: `approve` / `reject`. **Response `200`** → record diperbarui.
**Error:** `409 NOT_APPROVER`.

---

## 6. Kehadiran Tim (Hari Ini) — `GET /attendance/team/today`
**Role:** manajer/HR. Pantau tim.

`GET /attendance/team/today?team=div_it`
```json
{
  "success": true,
  "data": {
    "summary": { "present": 8, "late": 1, "absent": 1, "on_leave": 2 },
    "members": [
      { "employee_id": "emp_budi", "name": "Budi", "status": "present", "clock_in": "08:03" },
      { "employee_id": "emp_sari", "name": "Sari", "status": "on_leave" }
    ]
  }
}
```

---

## Catatan Mobile
- **Enrollment** (fingerprint/face/NFC) dilakukan saat onboarding, bukan lewat app harian — lihat `../../attendance/10-identity-enrollment.md`. App bisa memfasilitasi **self-enroll wajah** (opsional).
- **Offline:** clock event sebaiknya bisa antre bila sinyal hilang, lalu sync (detail di spesifikasi teknis mobile — belum dibuat).
- **Geofence & window** divalidasi server; app hanya mengirim lokasi/waktu.
