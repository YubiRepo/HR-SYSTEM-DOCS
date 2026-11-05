<!-- 📁 modules/mobile/api/attendance.md -->
# Mobile API · Attendance

Endpoint Attendance untuk aplikasi mobile. Prefix `/api/v1/attendance`, envelope standar, Bearer token. Akses dijaga entitlement `attendance` (lembur juga butuh `attendance.overtime`) dan RBAC.

> Referensi lengkap: [`../../attendance/05-api-contract.md`](../../attendance/05-api-contract.md).

---

## 1. Config Geofence — `GET /attendance/me/geofence`
**Permission:** `attendance:self`. Dimuat sekali saat layar absen dibuka. App memakainya untuk menghitung "di dalam/luar zona" secara lokal (Haversine).

```json
{
  "success": true,
  "data": {
    "geofence_enabled": true,
    "branch_id": "…",
    "branch_name": "Jakarta",
    "office": { "lat": -6.2088, "lng": 106.8456 },
    "radius_m": 100,
    "accuracy_threshold_m": 50
  }
}
```
- Nilainya diambil dari **attendance rule** efektif untuk cabang karyawan: rule cabang bila ada, kalau tidak rule default tenant. Titik kantor adalah `office_lat`/`office_lng` milik rule, bukan dari data cabang.
- `geofence_enabled: false` berarti tidak perlu cek lokasi. Ini terjadi bila rule belum ada, geofence nonaktif, atau titik kantor belum diisi.
- `accuracy_threshold_m` bisa tidak ada (= akurasi tidak dicek). Bila akurasi GPS lebih buruk dari nilai ini, minta user menunggu sinyal.
- Endpoint ini **hanya untuk preview**. Keputusan akhir tetap di server saat clock-in/out.

## 2. Clock In / Clock Out — `POST /attendance/clock-in` · `POST /attendance/clock-out`
**Permission:** `attendance:self`. Response clock-in `201`, clock-out `200`.

```json
{
  "source": "mobile",
  "timestamp": "2026-09-01T08:03:00+07:00",
  "lat": -6.2088,
  "lng": 106.8456,
  "accuracy_m": 12,
  "is_mock": false,
  "photo_ref": "…"
}
```
- `source` (wajib): `mobile` / `web` / `machine` / `kiosk` / `manual`. Dari app selalu `mobile`.
- `timestamp` (opsional, RFC3339): kosong berarti waktu server.
- `lat`/`lng`/`accuracy_m`: kirim bila geofence aktif.
- `is_mock`: flag mock-location dari OS. Bila `true`, request ditolak.
- `photo_ref`: referensi foto (opsional).

Response berisi record absen: `id`, `date`, `clock_in`, `clock_out`, `status[]`, `late_minutes`, `in_within_geofence`, `in_distance_m`, dll.

| Error | Arti |
|---|---|
| `409 ALREADY_CLOCKED_IN` / `409 NOT_CLOCKED_IN` | Sudah clock-in / belum clock-in |
| `422 NO_SCHEDULE` | Tidak ada shift hari ini |
| `422 OUTSIDE_CLOCK_WINDOW` | Di luar jendela clock-in/out shift |
| `422 OUTSIDE_GEOFENCE` | Di luar radius kantor |
| `422 MOCK_LOCATION_DETECTED` | `is_mock: true` |
| `422 GPS_ACCURACY_TOO_LOW` | `accuracy_m` lebih besar dari `geofence_accuracy_threshold_m` |
| `422 OVERTIME_NOT_APPROVED` / `422 OUTSIDE_OVERTIME_WINDOW` | Hari libur tanpa dokumen lembur / terlalu awal |

## 3. Ringkasan Hari Ini — `GET /attendance/me/today`
**Permission:** `attendance:self`.
```json
{
  "success": true,
  "data": {
    "date": "2026-09-01",
    "shift": { "name": "Pagi", "start": "08:00", "end": "17:00" },
    "day_kind": "workday",
    "overtime_required": false,
    "clock_in": "08:03",
    "clock_out": null,
    "status": ["workday", "incomplete", "on_time"],
    "can_clock_out": true
  }
}
```
- `day_kind`: `workday` / `day_off` / `holiday` / `on_leave`.
- Di hari libur, `overtime_required: true` dan `overtime_access` berisi dokumen lembur yang membuka hari itu (`source`, `label`, `start`, `end`). Bila `overtime_access` tidak ada, clock-in akan ditolak.

## 4. Jadwal Saya — `GET /attendance/me/schedule?date_from=2026-09-01&date_to=2026-09-07`
**Permission:** `attendance:self`. Mengembalikan satu baris per hari: `date`, `shift_id`, `duty_call`, `source`.

## 5. Riwayat Absen Saya — `GET /attendance/me?date_from=…&date_to=…`
**Permission:** `attendance:self`.

## 6. Koreksi (Lupa Absen) — `POST /attendance/records/{record_id}/correction`
**Permission:** `attendance:self`. Koreksi selalu menempel pada record hari itu.
```json
{ "field": "clock_out", "new_value": "2026-08-31T17:00:00+07:00", "reason": "lupa absen pulang" }
```
- `field`: `clock_in` / `clock_out` (`new_value` RFC3339) atau `status`.
- Daftar koreksi sendiri: `GET /attendance/me/corrections`.
- Error: `409 CORRECTION_ALREADY_PENDING`, `409 CORRECTION_NOT_ALLOWED`, dan error periode payroll terkunci.

## 7. Lembur Saya
| Endpoint | Fungsi |
|---|---|
| `POST /attendance/overtime` | Ajukan lembur: `date`, `planned_start_at`, `planned_end_at`, `reason`, `task_description` |
| `GET /attendance/me/overtime` | Ajuan lembur saya |
| `POST /attendance/overtime/{id}/cancel` | Batalkan ajuan (yang sudah approved hanya bisa dibatalkan sebelum mulai) |
| `GET /attendance/me/overtime-orders` · `/{id}/pdf` | Surat Perintah Lembur yang menyebut saya |
| `GET /attendance/me/overtime/transactions` | Realisasi lembur |

> `employee_id` saat ini wajib ada di body `POST /attendance/overtime`. Untuk caller self-service, nilainya selalu ditimpa server dengan employee milik caller.

## 8. Approval (Manajer/HR)
**Permission:** `attendance:approve`.
- Koreksi: `GET /attendance/corrections`, `POST /attendance/corrections/{id}/approve` · `/reject`, body `{ "notes": "…" }`.
- Lembur: `GET /attendance/overtime`, `POST /attendance/overtime/{id}/approve` · `/reject`, body `{ "approved_end_at": null, "note": "…" }`. Approver tidak boleh menyetujui ajuannya sendiri (`403 OVERTIME_SELF_APPROVAL`).

> **Menyusul:** kehadiran tim hari ini, inbox "menunggu saya", dan pembatasan approve hanya untuk bawahan langsung.

---

## Catatan Mobile
- **Enrollment** (fingerprint/face/NFC) dilakukan saat onboarding, bukan di app harian. Mesin absen tersambung lewat attendance-agent, bukan lewat app.
- **Offline:** clock event bisa diantre lalu dikirim dengan `timestamp` asli. Server tetap memvalidasi window dan geofence terhadap timestamp tersebut.
- **Config admin:** `geofence_accuracy_threshold_m` diatur di `POST /attendance/rules` (web). Bila field tidak dikirim, nilai lama dipertahankan; kirim `0` untuk menghapusnya.
