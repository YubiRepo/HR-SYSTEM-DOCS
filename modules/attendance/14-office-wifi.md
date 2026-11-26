<!-- 📁 modules/attendance/14-office-wifi.md -->
# 14 · WiFi Kantor (Validasi Jaringan)

Opsi pada **attendance rule**: absen dari app mobile hanya sah bila HP tersambung ke **WiFi kantor** yang terdaftar. WiFi adalah lapisan lokasi kedua di samping [geofence](./11-geofence.md), dan HR memilih apakah keduanya wajib lolos atau cukup salah satu.

> **Status (26 Nov 2026):** API ✅ (migrasi `20261127000001_attendance_office_wifi`, belum dijalankan) · Backoffice ✅ · Mobile ⏳ belum (§6).

| | |
|---|---|
| **Level konfigurasi** | Attendance rule: default tenant + override per cabang (sama dengan geofence) |
| **Sumber data** | SSID/BSSID yang dibaca HP dan dikirim saat clock-in/out |
| **Dicek untuk** | `source` = `mobile` dan `web` (web selalu gagal WiFi, lihat §4) |
| **Tidak dicek** | `kiosk`, `machine`, `manual` |

---

## 1. Konsep & Batasan

- **Kenapa WiFi:** GPS sering meleset di dalam gedung atau lantai tinggi. Tersambung ke WiFi kantor adalah bukti kuat bahwa karyawan berada di lokasi.
- **Cara cocok:**
  - **BSSID** adalah MAC address access point, unik per perangkat AP. Ini pencocokan yang disarankan.
  - **SSID** adalah nama jaringan, yang mudah ditiru (hotspot HP bisa diberi nama yang sama). Hanya dipakai bila entri tidak punya BSSID.
  - Kantor dengan banyak AP mendaftarkan **setiap** BSSID-nya (satu entri per AP).
- **Batasan, sengaja diterima:** SSID/BSSID adalah **klaim dari HP**. Server tidak bisa memverifikasinya sendiri, sehingga pemanggilan API langsung atau HP yang di-root bisa memalsukan nilainya. Ini setara dengan koordinat GPS yang juga dikirim HP. Penguatan yang mungkin di masa depan (di luar scope): allowlist **IP publik kantor** yang dicek server dari IP asal request.

---

## 2. Data Model

### 2.1 `attendance_rules` (kolom baru)

| Kolom | Tipe | Default | Keterangan |
|---|---|---|---|
| `wifi_enabled` | `BOOLEAN NOT NULL` | `false` | Wajib WiFi kantor |
| `wifi_networks` | `JSONB NOT NULL` | `'[]'` | Daftar jaringan sah, maks 50 entri (format di bawah) |
| `location_match_mode` | `TEXT NOT NULL` | `'all'` | `all` = geofence **dan** WiFi wajib lolos · `any` = salah satu cukup. Hanya berpengaruh bila keduanya aktif. `CHECK (location_match_mode IN ('all','any'))` |

```json
[
  { "label": "HQ Lantai 3", "ssid": "KANTOR-HQ", "bssid": "a4:2b:b0:12:34:56" },
  { "label": "HQ Lantai 5", "ssid": "KANTOR-HQ", "bssid": "a4:2b:b0:12:34:9a" },
  { "label": "Gudang",      "ssid": "GUDANG-01", "bssid": null }
]
```

Migrasi: `ALTER TABLE attendance_rules ADD COLUMN IF NOT EXISTS ...`, mengikuti pola `20261106000002_attendance_rule_geofence_accuracy`. Rule lama otomatis `wifi_enabled = false`, jadi tidak ada perubahan perilaku.

### 2.2 `attendance_records` (kolom baru, jejak untuk review HR)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `in_wifi_ssid` / `out_wifi_ssid` | `TEXT NULL` | SSID yang dikirim HP |
| `in_wifi_bssid` / `out_wifi_bssid` | `TEXT NULL` | BSSID (lowercase) yang dikirim HP |
| `in_wifi_matched` / `out_wifi_matched` | `BOOLEAN NULL` | Hasil cek. `NULL` = WiFi tidak dicek (rule off atau source tidak dicek) |

Polanya sama dengan `in_within_geofence` / `in_distance_m`.

---

## 3. Konfigurasi — `POST /attendance/rules`

Field baru pada body (upsert tetap **mengganti seluruh rule**):
```json
{
  "branch_id": null,
  "geofence_enabled": true, "geofence_radius_m": 100, "office_lat": -6.2, "office_lng": 106.8,
  "wifi_enabled": true,
  "wifi_networks": [
    { "label": "HQ Lantai 3", "ssid": "KANTOR-HQ", "bssid": "A4-2B-B0-12-34-56" }
  ],
  "location_match_mode": "all"
}
```

Validasi (gagal → `422 VALIDATION_ERROR`, sama dengan validasi geofence di `upsert_attendance_rule.go`):

| Aturan | Keterangan |
|---|---|
| `wifi_enabled = true` → minimal 1 network | Daftar boleh tetap tersimpan saat `wifi_enabled = false` (supaya bisa dimatikan sementara) |
| Tiap entri punya `ssid` atau `bssid` | Keduanya kosong ditolak |
| `ssid` 1–32 karakter | Batas SSID 802.11. Dicocokkan **persis** (case-sensitive), spasi di awal dan akhir di-trim |
| `bssid` = 6 oktet hex | Pemisah `:` atau `-` diterima, lalu dinormalisasi ke `aa:bb:cc:dd:ee:ff` lowercase |
| Tidak ada duplikat | Dua entri dengan BSSID sama, atau SSID sama tanpa BSSID, ditolak |
| `label` opsional, maks 50 karakter | Hanya untuk tampilan |
| Maks 50 entri | |
| `location_match_mode` ∈ `all`, `any` | Kosong → `all` |

Respons `GET /attendance/rules`, `POST /attendance/rules`, dan `GET /attendance/me/rules` menambah `wifi_enabled`, `wifi_networks`, `location_match_mode`. Di kode ada dua mapper yang perlu diperbarui: `command.toAttendanceRuleResponse` dan `query.toResponse`. `GET /attendance/me/geofence` **tidak berubah**.

---

## 4. Validasi Saat Clock-in / Clock-out

### 4.1 Request

`POST /attendance/clock-in` dan `/clock-out` menambah dua field opsional:
```json
{
  "source": "mobile",
  "lat": -6.20901, "lng": 106.84601, "accuracy_m": 12, "is_mock": false,
  "wifi_ssid": "KANTOR-HQ",
  "wifi_bssid": "a4:2b:b0:12:34:56"
}
```
Kirim hanya bila HP benar-benar tersambung WiFi dan nilainya terbaca (lihat §6.2 untuk nilai placeholder).

### 4.2 Urutan Cek (source `mobile` / `web`)

```
1. is_mock = true                        → MOCK_LOCATION_DETECTED   (tetap seperti sekarang)
2. Geofence (bila geofence_enabled)      → lolos | gagal(OUTSIDE_GEOFENCE / GPS_ACCURACY_TOO_LOW)
3. WiFi (bila wifi_enabled):
     source = web                        → gagal(WIFI_UNVERIFIABLE)
     wifi_ssid & wifi_bssid kosong       → gagal(WIFI_NOT_CONNECTED)
     cocok dengan wifi_networks          → lolos
     tidak cocok                         → gagal(OUTSIDE_OFFICE_WIFI)
4. Gabungkan hasil (§4.3)
```

**Cocok** bila ada entri yang:
- punya `bssid` dan sama dengan `wifi_bssid` (setelah normalisasi), **atau**
- tidak punya `bssid` dan `ssid`-nya sama persis dengan `wifi_ssid`.

Entri yang punya BSSID **tidak** bisa dicocokkan lewat SSID saja. Kalau tidak begitu, hotspot tiruan bernama sama akan lolos.

### 4.3 Tabel Keputusan

| Geofence | WiFi | Mode | Hasil |
|---|---|---|---|
| off | off | — | Lolos (perilaku sekarang) |
| on | off | — | Hasil geofence |
| off | on | — | Hasil WiFi |
| on | on | `all` | Keduanya harus lolos. Error = cek pertama yang gagal (geofence dulu, lalu WiFi) |
| on | on | `any` | Lolos bila salah satu lolos. Keduanya gagal → `OUTSIDE_WORK_AREA` |

Contoh per source saat WiFi aktif:

| Source | Mode `all` (geofence on) | Mode `any` (geofence on) | Geofence off |
|---|---|---|---|
| `mobile` di WiFi kantor & dalam radius | ✅ | ✅ | ✅ |
| `mobile` di WiFi kantor, GPS meleset | ❌ `OUTSIDE_GEOFENCE` | ✅ | ✅ |
| `mobile` dalam radius, data seluler | ❌ `WIFI_NOT_CONNECTED` | ✅ | ❌ `WIFI_NOT_CONNECTED` |
| `web` dalam radius | ❌ `WIFI_UNVERIFIABLE` | ✅ (lewat geofence) | ❌ `WIFI_UNVERIFIABLE` |
| `kiosk` / `machine` / `manual` | ✅ tidak dicek | ✅ tidak dicek | ✅ tidak dicek |

> Web ESS tidak bisa membaca WiFi (batasan browser). Dengan WiFi wajib, absen dari web hanya mungkin di mode `any` lewat geofence. Di mode lain karyawan diarahkan ke app mobile.

### 4.4 Error Baru

Semua `422`, didaftarkan di `internal/shared/httperror/status_map.go`, konstanta di `attendancerecord/constant`.

| Code | Kapan | Pesan mobile (ID) |
|---|---|---|
| `WIFI_NOT_CONNECTED` | WiFi wajib, HP tidak mengirim SSID/BSSID | "Sambungkan HP ke WiFi kantor untuk absen." |
| `OUTSIDE_OFFICE_WIFI` | SSID/BSSID tidak ada di daftar | "WiFi yang tersambung bukan WiFi kantor." |
| `WIFI_UNVERIFIABLE` | WiFi wajib, source `web` | "Absen harus lewat aplikasi mobile yang tersambung ke WiFi kantor." |
| `OUTSIDE_WORK_AREA` | Mode `any`, geofence **dan** WiFi gagal | "Anda di luar area kantor dan tidak tersambung ke WiFi kantor." |

`OUTSIDE_WORK_AREA` membawa `details` agar app bisa menjelaskan:
```json
{ "success": false, "error": { "code": "OUTSIDE_WORK_AREA", "message": "…",
  "details": { "geofence": "OUTSIDE_GEOFENCE", "wifi": "WIFI_NOT_CONNECTED" } } }
```

### 4.5 Respons Record

`AttendanceRecordResponse` menambah `in_wifi_ssid`, `in_wifi_matched`, `out_wifi_ssid`, `out_wifi_matched`. `*_wifi_matched` bernilai `null` bila WiFi tidak dicek. BSSID disimpan di DB tetapi tidak perlu ditampilkan di list.

### 4.6 Catatan Implementasi API

- Cek WiFi diletakkan di samping `buildGeoPoint` (`attendancerecord/command/clock_in.go`, dipakai juga oleh `clock_out.go`). Geofence diubah agar mengembalikan **hasil** (lolos/gagal + kode), bukan langsung error, supaya bisa digabung sesuai mode.
- `ruleView` (`resolve.go`) menambah `WifiEnabled`, `WifiNetworks`, `LocationMatchMode`.
- Entity `AttendanceRule`, `UpsertAttendanceRuleRequest`, repo (`attendanceRuleColumns`, `Save`, `scanOne`) diperluas. `wifi_networks` dibaca/ditulis sebagai JSON.
- Unit test berupa matriks: geofence on/off × WiFi on/off × mode × source × cocok BSSID/SSID/tidak cocok/kosong.
- **Kompatibilitas upsert:** `wifi_enabled`, `wifi_networks`, `location_match_mode` di request bersifat opsional. Field yang tidak dikirim **mempertahankan nilai tersimpan**, jadi client lama tidak menghapus setting WiFi. Rule baru: `false` / `[]` / `all`.
- **Geofence tanpa koordinat** (app tidak mengirim `lat`/`lng`) tetap dilewati seperti sebelumnya pada rule geofence-saja. Di mode `any`, koordinat yang tidak dikirim **tidak** dihitung lolos.
- `kernel.AppError` mendapat field opsional `Details` (`WithDetails`), dirender sebagai `error.details`. Dipakai `OUTSIDE_WORK_AREA`.
- BSSID dari HP dinormalisasi (lowercase, `-` → `:`). Nilai rusak atau placeholder `02:00:00:00:00:00` dianggap tidak terkirim.

---

## 5. Backoffice — HR Setting → Attendance Rules

File: `app/pages/tenants/hr-setting/attendance-rules.vue` (modal **Edit Policy**), `app/composables/useAttendanceRules.ts`, `app/types/attendance.ts`. Teks UI dalam Bahasa Inggris (konvensi backoffice).

### 5.1 Card "Office WiFi" (di bawah card "Office Geofence")

```
┌ Office WiFi ─────────────────────────────── [switch] ┐
│ Employees must be connected to one of these networks │
│ to clock in/out from the mobile app.                 │
│                                                      │
│  Label          SSID           BSSID                 │
│ [HQ Lantai 3] [KANTOR-HQ]   [a4:2b:b0:12:34:56]  🗑   │
│ [Gudang     ] [GUDANG-01]   [                 ]  🗑   │
│ + Add network                                        │
│                                                      │
│ ⓘ Get the BSSID from the mobile app: Profile →        │
│   Network Info. Without a BSSID, any network with    │
│   the same name (SSID) is accepted.                  │
└──────────────────────────────────────────────────────┘
```

- Baris inline dengan tombol hapus dan "Add network", memakai pola `form.breaks` di `app/components/attendance/WorkingTimeForm.vue` (`addBreak` / `removeBreak`).
- Isi baris hanya tampil saat switch aktif (sama dengan geofence). Daftar tetap disimpan walau switch dimatikan.
- Entri tanpa BSSID diberi badge peringatan kecil "SSID only".

### 5.2 Pilihan "Location check"

Hanya tampil bila **Office Geofence dan Office WiFi** sama-sama aktif:
```
Location check
 (•) Both geofence and WiFi must pass      → location_match_mode = "all"
 ( ) Either geofence or WiFi is enough     → location_match_mode = "any"
```
Gunakan `URadioGroup`. Saat salah satu switch mati, nilai tetap dikirim apa adanya (default `all`).

### 5.3 Validasi Sebelum Simpan (`handleSaveRules`)

- WiFi aktif → minimal 1 baris.
- Tiap baris punya SSID atau BSSID.
- Format BSSID valid. UI menerima `:`/`-`/huruf besar dan menormalisasi sebelum kirim.
- Tidak ada duplikat.
- Gagal → toast, sama dengan validasi geofence yang sudah ada.

### 5.4 Lain-lain

- **Composable:** `AttendanceRuleDto`, mapper `toAttendanceRule`, dan `AttendanceRulePayload` menambah `wifi_enabled`, `wifi_networks`, `location_match_mode`. Field ini selalu dikirim karena upsert mengganti seluruh rule.
- **Header accordion:** ringkasan menjadi "Geofence 100 m · WiFi 2 networks · OT lead …" atau "WiFi off".
- **Detail record** (`app/pages/tenants/attendance/records.vue`, modal detail): tampilkan SSID + badge "Office WiFi ✓ / ✗" bila `in_wifi_matched` tidak `null`. Composable `useAttendanceRecords.ts` memetakan `in_wifi_ssid` / `in_wifi_matched`.

---

## 6. Mobile (App Karyawan)

### 6.1 Izin & Cara Membaca WiFi

| Platform | Kebutuhan |
|---|---|
| **Android** | `ACCESS_FINE_LOCATION` (diizinkan) + **layanan lokasi aktif** (wajib untuk membaca SSID/BSSID sejak Android 10) + `ACCESS_WIFI_STATE`. Android 12+: baca dari `ConnectivityManager.NetworkCallback` dengan `FLAG_INCLUDE_LOCATION_INFO` → `WifiInfo`. Di bawah itu `WifiManager.getConnectionInfo()` |
| **iOS** | Capability **Access WiFi Information** + izin lokasi (presisi), lalu `NEHotspotNetwork.fetchCurrent` (iOS 14+) → `ssid`, `bssid` |

Izin lokasi sudah diminta untuk geofence, jadi cukup ditambah pembacaan WiFi.

### 6.2 Nilai Tidak Valid

Anggap **tidak tersambung atau tidak terbaca** (jangan dikirim) bila:
- SSID `<unknown ssid>` atau kosong;
- BSSID `02:00:00:00:00:00` atau kosong (nilai yang dikembalikan Android bila izin kurang);
- HP tidak tersambung WiFi (pakai data seluler).

Bila izin kurang, tampilkan ajakan "Izinkan lokasi agar WiFi kantor bisa dideteksi" sebelum absen.

### 6.3 Preview di Layar Absen

Config dimuat sekali dari `GET /attendance/me/rules` (`wifi_enabled`, `wifi_networks`, `location_match_mode`, geofence). App lalu menghitung status secara lokal, sama seperti preview geofence ([11 §3.1](./11-geofence.md)):

```
WiFi    : ✅ Terhubung ke WiFi kantor (HQ Lantai 3)  |  ❌ Bukan WiFi kantor  |  ⚠️ WiFi tidak terdeteksi
Lokasi  : ✅ Dalam radius 100 m                       |  ❌ 150 m dari kantor
Tombol  : aktif bila gabungan sesuai location_match_mode lolos
```

- Pencocokan lokal memakai aturan yang sama dengan server (§4.2): BSSID dulu, SSID hanya untuk entri tanpa BSSID.
- Perbarui status saat jaringan berubah (listener konektivitas).
- Preview **tidak** menggantikan validasi server.

### 6.4 Clock-in / Clock-out

- Kirim `wifi_ssid` dan `wifi_bssid` (lowercase) bersama koordinat bila terbaca.
- Tangani 4 error baru (§4.4) dengan pesan Bahasa Indonesia. `OUTSIDE_WORK_AREA` memakai `details` untuk menampilkan kedua alasan.

### 6.5 Info Jaringan (helper untuk HR)

Browser tidak bisa membaca BSSID, jadi HR mengambilnya dari app:
- Menu **Profil → Info Jaringan** menampilkan SSID dan BSSID yang sedang tersambung, plus tombol **Salin**.
- Tersedia untuk semua user (tidak berisi data sensitif). HR berdiri di dekat tiap AP, menyalin BSSID, lalu memasukkannya di backoffice.

---

## 7. Rencana Implementasi

| Urutan | Bagian | Isi |
|---|---|---|
| 1 | API | Migrasi (rules + records) → entity/DTO/mapper ganda/repo → validasi upsert → cek WiFi + penggabungan mode di clock-in/out → kolom record & response → error code + status map → unit test matriks |
| 2 | Docs | `05-api-contract.md`, `mobile/api/attendance.md` (field & error baru; sudah ditandai "spec") |
| 3 | Backoffice | Composable + type → card Office WiFi + Location check + validasi → ringkasan accordion → detail record |
| 4 | Mobile | Izin & baca WiFi → preview → payload clock → pesan error → layar Info Jaringan |

Backward compatible: rule lama `wifi_enabled = false`, dan app lama yang tidak mengirim `wifi_*` tetap bisa absen selama HR belum menyalakan WiFi wajib.

---

## 8. Kaitan

- [11-geofence.md](./11-geofence.md): lapisan lokasi pertama, preview lokal, anti fake-GPS.
- [05-api-contract.md](./05-api-contract.md): kontrak endpoint.
- [mobile/api/attendance.md](../mobile/api/attendance.md): endpoint yang dipakai app.
