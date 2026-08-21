# 08 · Device & Method Integration

Karyawan bisa absen lewat banyak cara: aplikasi mobile (GPS/wajah), mesin fingerprint/wajah, kartu NFC/RFID, atau web. Dokumen ini menjelaskan bagaimana semua metode diintegrasikan tanpa membuat logika inti berantakan.

---

## 1. Prinsip: Pisahkan "Cara Menangkap" dari "Logika"

Semua metode hanyalah **pintu masuk** berbeda; ujungnya mengirim data yang sama: *siapa, kapan, di mana, terverifikasi bagaimana*. Logika (hitung telat/lembur) tidak peduli absen datang dari mana.

```
BERAGAM SUMBER          SATU PINTU MASUK        SATU LOGIKA
  mobile GPS   ─┐
  mobile face  ─┤
  mesin FP     ─┼──▶  Attendance Ingestion ──▶  hitung status
  kartu NFC    ─┤       (format standar)         (telat/lembur/dll)
  web          ─┘
```

Semua diterjemahkan ke **event absensi standar** dulu, baru masuk logika. Field `source` (`mobile`/`web`/`machine`/`kiosk`/`manual`) menandai asalnya.

---

## 2. Event Absensi Standar

Apa pun metodenya, ingestion menerima bentuk seragam:
```json
{
  "employee_id": "emp_01H8...",
  "timestamp": "2026-01-15T08:03:00+07:00",
  "type": "in",
  "source": "machine",
  "device_id": "dev_fp_01",
  "location": { "lat": -6.20, "lng": 106.81 },
  "verification": "fingerprint",
  "raw_ref": "..."
}
```
`verification`: `gps` / `face` / `fingerprint` / `nfc` / `none`. Field yang tak relevan diisi null (mis. mesin fingerprint tanpa GPS).

---

## 3. Metode & Cara Integrasinya

### 3.1 Mobile — GPS / Geofence
- Karyawan clock-in dari app → app kirim `{waktu, lat, lng}` ke API.
- Sistem cek geofence (dalam radius lokasi kerja).
- **Model: push** (app langsung hit `POST /attendance/clock-in`).

### 3.2 Mobile — Face Recognition
- Verifikasi wajah dilakukan **sebelum** kirim (on-device atau server).
- Yang masuk ke sistem tetap event standar + `verification: face`.
- Face recognition = lapisan verifikasi di depan, tidak mengubah alur inti.

### 3.3 Mesin Fingerprint / Face (hardware pihak ketiga)
- Mesin merek tertentu (mis. Fingerspot, Solution) menyimpan absen lokal.
- Integrasi via **adapter** (lihat §4) → diterjemahkan ke event standar (`source: machine`).
- **Model: push atau pull** (lihat §5).

### 3.4 Kartu NFC / RFID
- Karyawan tap kartu ke reader → reader kirim ID kartu.
- Sistem memetakan kartu → karyawan (tabel `device_cards`).
- Mirip mesin: via adapter, push atau pull.

### 3.5 Web
- Clock-in dari browser (mis. WFH), `verification: none`/`gps` opsional.
- **Model: push.**

### 3.6 Kiosk (HP/Tablet Shared)
- Satu HP/tablet Android (punya perusahaan) dipasang di pintu masuk sebagai **titik absen bersama** — bukan HP pribadi karyawan.
- Karyawan mengidentifikasi diri di kiosk, lalu tercatat absen.
- **Hemat:** tak perlu beli mesin khusus; cukup tablet + app dalam mode kiosk. Cocok untuk UMKM & lokasi dengan banyak pekerja yang tak semua bawa HP.
- **Model: push** (kiosk online, kirim langsung).

Lihat §9 untuk detail kiosk.

---

## 9. Kiosk Mode (Shared Device)

Kiosk = HP/tablet perusahaan yang ditaruh di titik masuk, dipakai **banyak karyawan bergantian**. Berbeda dari mobile personal (HP milik karyawan sendiri).

| | Mobile personal | Kiosk (shared) |
|---|---|---|
| **Perangkat** | HP milik karyawan | HP/tablet perusahaan di pintu |
| **Identitas** | Dari akun login karyawan | Dari metode yang di-tap/input di kiosk |
| **Cocok untuk** | Karyawan yang punya HP | Banyak pekerja / tak semua bawa HP |

### Metode identifikasi di kiosk (semua yang mungkin)
| Metode | Cara |
|---|---|
| **NFC/RFID** | Tap kartu ke tablet ber-NFC → UID → karyawan |
| **Face** | Tablet memindai wajah → cocokkan template |
| **PIN** | Karyawan ketik nomor induk + PIN |
| **QR** | Tampilkan/scan QR karyawan |

Kiosk bisa mendukung beberapa metode sekaligus (mis. NFC utama, PIN cadangan bila kartu tertinggal).

### Karakteristik kiosk
- **Terdaftar sebagai device** (`type: kiosk`) dengan token sendiri.
- **Lokasi tetap** — bisa dikunci geofence (hanya sah di titik itu).
- **Satu app, dua mode:** app yang sama berjalan sebagai *personal* (di HP karyawan) atau *kiosk* (di tablet bersama) — mode dipilih saat setup.
- **Bisa campur di satu tenant:** cabang kantor pakai personal, gudang pakai kiosk tablet.

```
Tablet Android (NFC/face) di dinding pintu
   │ karyawan tap kartu / scan wajah / ketik PIN
   ▼
kiosk baca identitas → kirim event standar (source: kiosk) → sistem
```

> Kiosk memakai event absensi standar yang sama (§2); `source: kiosk`, `verification` sesuai metode yang dipakai (nfc/face/pin/qr).

---

## 4. Adapter per Jenis Alat

Tiap merek mesin/reader "berbahasa" berbeda (format & protokol). Agar sistem inti tak perlu tahu detail tiap merek, dipakai **adapter** — penerjemah antara alat dan event standar.

```
Mesin Fingerspot ─▶ Adapter Fingerspot ─┐
Mesin Solution   ─▶ Adapter Solution    ─┼─▶ Event standar ─▶ Ingestion
Reader NFC-X     ─▶ Adapter NFC-X       ─┘
```

Menambah merek baru = menulis adapter baru; **sistem inti tak berubah**. Sejalan filosofi modular.

---

## 5. Push vs Pull (untuk mesin/hardware)

Sistem mendukung **keduanya** agar kompatibel dengan alat lama maupun baru.

| Model | Cara | Cocok untuk | Kekurangan |
|---|---|---|---|
| **Push** | Alat mengirim ke API tiap ada absen | Mesin modern/online, mobile, web | Alat harus online & dikonfigurasi kirim |
| **Pull** | Sistem menarik dari alat berkala | Mesin lama/murah, simpan lokal, koneksi tak stabil | Ada jeda (tidak real-time) |

**Push flow:**
```
alat/app ──▶ POST /attendance/ingest (via adapter) ──▶ event tersimpan
```

**Pull flow:**
```
job berkala ──▶ tarik data dari mesin (via adapter) ──▶ mapping ──▶ event tersimpan
```

**Realita:** banyak mesin di pasar menyimpan data lokal & di-pull; mesin modern & mobile memakai push. Karena itu keduanya didukung. Mobile app internal **selalu push**.

---

## 6. Endpoint Ingestion

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/attendance/ingest` | Terima event absensi (push, dari adapter/alat) | device token |
| POST | `/attendance/devices` | Daftarkan alat (mesin/reader) | `attendance:config` |
| GET | `/attendance/devices` | Daftar alat terdaftar | `attendance:read` |
| POST | `/attendance/devices/{id}/pull` | Picu tarik data (pull manual) | `attendance:config` |
| POST | `/attendance/cards` | Petakan kartu NFC → karyawan | `attendance:config` |

**Contoh `POST /attendance/ingest`:**
```json
{
  "device_id": "dev_fp_01",
  "events": [
    { "employee_ref": "1023", "timestamp": "2026-01-15T08:03:00+07:00", "type": "in" }
  ]
}
```
`employee_ref` = ID lokal di mesin (mis. nomor pegawai di fingerprint); sistem memetakan ke `employee_id`. Mendukung batch (banyak event sekaligus untuk pull).

---

## 7. Keamanan Alat (ringkas)

- **Device token** — tiap alat/adapter punya kredensial; ingestion menolak alat tak dikenal.
- **Mapping identitas** — `employee_ref`/ID kartu dipetakan ke karyawan; ref tak dikenal → ditolak/ditandai.
- **Anti-duplikasi** — event ganda (retry pull) di-dedup berdasar (device, employee, timestamp).
- **Deteksi anomali** — clock-in di dua lokasi berjauhan dalam waktu mustahil.

> Detail keamanan (mock-location, liveness untuk face, enkripsi transport) menjadi bahasan lanjutan; dokumen ini menetapkan titik kontrolnya.

---

## 8. Entitas Terkait (ringkas)

### `attendance_devices`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `dev_...` |
| `tenant_id` / `branch_id` | string (FK) | Lokasi alat |
| `type` | enum | `fingerprint`, `face`, `nfc_reader`, `mobile`, `kiosk`, `web` |
| `integration` | enum | `push` / `pull` |
| `adapter` | string | Merek/adapter (mis. `fingerspot`) |
| `token` | string | Kredensial alat |
| `last_sync_at` | timestamp | Untuk pull |

### `device_cards` (untuk NFC/RFID)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `card_uid` | string | UID kartu |
| `employee_id` | string (FK) | Pemilik |
| `is_active` | boolean | |

> Event masuk tetap tersimpan sebagai `attendance_records` (lihat `06-data-model.md`) dengan `source` sesuai alat.
