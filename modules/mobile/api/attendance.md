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

### 1a. Aturan Absensi Saya — `GET /attendance/me/rules`
**Permission:** `attendance:self`. Aturan absensi **utuh** yang berlaku untuk karyawan (rule cabang, kalau tidak ada rule default tenant), dengan bentuk sama seperti `GET /attendance/rules` admin. Karyawan tidak bisa memilih cabang.

```json
{
  "success": true,
  "data": {
    "id": "…", "tenant_id": "…", "branch_id": "…", "branch_name": "Banyumas",
    "ot_requires_approval": true, "ot_clock_in_lead_min": 60,
    "geofence_enabled": true, "geofence_radius_m": 100,
    "office_lat": -6.200378, "office_lng": 106.815681, "geofence_accuracy_threshold_m": 50,
    "auto_clockout_enabled": false, "forgot_clockout_cap_hours": 23,
    "clockout_reminder_min": 30,
    "created_at": "…", "updated_at": "…"
  }
}
```
- `data: null` bila tenant belum punya aturan sama sekali → anggap tanpa pembatasan.
- `branch_id` / `branch_name` kosong bila aturan berasal dari default tenant.
- Dipakai untuk: pengingat absen pulang (`clockout_reminder_min` menit setelah shift selesai), info absen pulang otomatis (`auto_clockout_enabled`, `forgot_clockout_cap_hours`), jendela absen masuk lembur (`ot_clock_in_lead_min` sebelum lembur mulai), dan geofence. `/me/geofence` tetap tersedia.
- **WiFi kantor:** `wifi_enabled`, `wifi_networks[]` (`label`, `ssid`, `bssid`), `location_match_mode` (`all`/`any`) untuk preview WiFi kantor. Lihat [`attendance/14-office-wifi.md`](../../attendance/14-office-wifi.md) §6.

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
- `wifi_ssid` / `wifi_bssid`: WiFi yang sedang tersambung, untuk rule yang mewajibkan WiFi kantor. Jangan kirim nilai placeholder (`<unknown ssid>`, `02:00:00:00:00:00`). Lihat [`attendance/14-office-wifi.md`](../../attendance/14-office-wifi.md) §4 dan §6.

Response berisi record absen: `id`, `date`, `clock_in`, `clock_out`, `status[]`, `late_minutes`, `in_within_geofence`, `in_distance_m`, dll.

| Error | Arti |
|---|---|
| `409 ALREADY_CLOCKED_IN` / `409 NOT_CLOCKED_IN` | Sudah clock-in / belum clock-in |
| `422 NO_SCHEDULE` | Tidak ada shift hari ini |
| `409 ON_LEAVE` | Sedang cuti seharian (approved). Batalkan cuti dulu bila masuk kerja. Cuti setengah hari tetap bisa clock-in |
| `422 OUTSIDE_CLOCK_WINDOW` | Di luar jendela clock-in/out shift |
| `422 OUTSIDE_GEOFENCE` | Di luar radius kantor |
| `422 MOCK_LOCATION_DETECTED` | `is_mock: true` |
| `422 GPS_ACCURACY_TOO_LOW` | `accuracy_m` lebih besar dari `geofence_accuracy_threshold_m` |
| `422 OVERTIME_NOT_APPROVED` / `422 OUTSIDE_OVERTIME_WINDOW` | Hari libur tanpa dokumen lembur / terlalu awal |
| `422 WIFI_NOT_CONNECTED` · `OUTSIDE_OFFICE_WIFI` · `WIFI_UNVERIFIABLE` · `OUTSIDE_WORK_AREA` | WiFi kantor wajib tidak terpenuhi. Pesan per kode di [`14-office-wifi.md`](../../attendance/14-office-wifi.md) §4.4 |

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
- `day_kind`: `workday` / `day_off` / `holiday`. Cuti **bukan** jenis hari: hari kerja yang tertutup cuti tetap `workday`. Untuk menampilkan info cuti hari ini, panggil `GET /leave/me/requests?status=approved` (lihat [leave.md](./leave.md) §5) dengan `date_from` = `date_to` = hari ini (filter overlap rentang cuti).
- Di hari libur, `overtime_required: true` dan `overtime_access` berisi dokumen lembur yang membuka hari itu (`source`, `label`, `start`, `end`). Bila `overtime_access` tidak ada, clock-in akan ditolak.

## 4. Jadwal Saya — `GET /attendance/me/schedule?date_from=2026-09-01&date_to=2026-09-07`
**Permission:** `attendance:self`. Mengembalikan satu baris per hari (maks 62 hari):
```json
{
  "date": "2026-11-26",
  "shift_id": "…",
  "shift": {
    "name": "Normal", "code": "N", "color": "#2563eb",
    "start_time": "08:00", "end_time": "17:00", "cross_midnight": false,
    "breaks": [{ "type": "meal", "start": "12:00", "end": "13:00", "paid": false, "flexible": false, "duration_minutes": 0 }],
    "late_tolerance_min": 10
  },
  "duty_call": false,
  "source": "fixed",
  "is_holiday": true,
  "holiday_name": "Bos Nikah Lagi"
}
```
- `shift` adalah ringkasan `shift_id` (tidak perlu memanggil `/attendance/shifts`); tidak ada bila hari itu tanpa shift.
- `is_holiday` / `holiday_name`: libur yang berlaku (`is_observed`) untuk tenant atau cabang karyawan — sama dengan yang dipakai clock-in. Di hari libur `shift` tetap ditampilkan bila terjadwal, tetapi clock-in mengikuti aturan hari libur (perlu lembur, lihat §3).

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

> Inbox "menunggu saya" lintas modul: [approval.md](./approval.md). Lembur & koreksi masuk inbox bila tenant punya approval policy untuk keduanya; tanpa policy, pakai daftar `?status=pending` di atas.
>
> **Menyusul:** kehadiran tim hari ini.

---

## Catatan Mobile
- **Enrollment** (fingerprint/face/NFC) dilakukan saat onboarding, bukan di app harian. Mesin absen tersambung lewat attendance-agent, bukan lewat app.
- **Offline:** clock event bisa diantre lalu dikirim dengan `timestamp` asli. Server tetap memvalidasi window dan geofence terhadap timestamp tersebut.
- **Config admin:** `geofence_accuracy_threshold_m` diatur di `POST /attendance/rules` (web). Bila field tidak dikirim, nilai lama dipertahankan; kirim `0` untuk menghapusnya.
