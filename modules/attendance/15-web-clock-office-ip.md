<!-- 📁 modules/attendance/15-web-clock-office-ip.md -->
# 15 · Absen via Web (IP Publik Kantor)

Opsi pada **attendance rule**: absen dari halaman **ESS web** hanya boleh bila diaktifkan, dan hanya dari **IP publik kantor** yang terdaftar. Browser tidak bisa membuktikan lokasi (GPS mudah dipalsukan lewat DevTools, WiFi tidak bisa dibaca), tapi IP asal request dilihat sendiri oleh server.

> **Status (27 Nov 2026):** API ✅ (migrasi `20261127000008_attendance_web_clock_office_ip`, belum dijalankan) · Backoffice ✅ · Mobile tidak terdampak.

| | |
|---|---|
| **Level konfigurasi** | Attendance rule: default tenant + override per cabang |
| **Default** | **Mati.** Tanpa rule atau dengan rule yang belum mengaktifkannya, absen web ditolak `WEB_CLOCK_DISABLED` |
| **Syarat aktif** | Minimal satu IP publik kantor |
| **Dicek untuk** | Request dari browser (lihat §3) |

---

## 1. Kenapa IP Publik

- Koordinat dan WiFi adalah **klaim dari client**. IP asal koneksi **tidak**: server membacanya dari koneksi TCP (atau dari proxy tepercaya, §4).
- Kantor tanpa IP publik statis (IP dinamis atau CGNAT) **tidak bisa** memakai fitur ini. Karyawannya absen lewat app mobile. IP CGNAT dipakai bersama banyak pelanggan ISP lain, sehingga tidak bisa dijadikan bukti lokasi.

---

## 2. Data Model

### 2.1 `attendance_rules` (kolom baru)

| Kolom | Tipe | Default | Keterangan |
|---|---|---|---|
| `web_clock_enabled` | `BOOLEAN NOT NULL` | `false` | Izinkan absen dari ESS web |
| `office_ips` | `JSONB NOT NULL` | `'[]'` | Daftar IP publik kantor, maks 50 entri |

```json
[
  { "label": "HQ ISP 1", "cidr": "203.0.113.7/32" },
  { "label": "HQ ISP 2", "cidr": "198.51.100.0/28" }
]
```

Validasi (`entity.NormalizeOfficeIPs`):
- Input boleh IP tunggal (`203.0.113.7`) atau CIDR, lalu disimpan dalam bentuk prefix (`203.0.113.7/32`).
- Alamat privat, loopback, dan link-local ditolak, karena tidak pernah sampai ke server sebagai IP client.
- Rentang terlalu lebar ditolak: IPv4 di bawah `/16`, IPv6 di bawah `/32`.
- Duplikat ditolak, dan label maksimal 50 karakter.

### 2.2 `attendance_records` (kolom baru, audit)

| Kolom | Keterangan |
|---|---|
| `in_client_ip` / `out_client_ip` | IP yang dilihat server saat clock-in/out, untuk semua source |

---

## 3. Menentukan Channel (Web vs Mobile)

`source` di body **tidak dipercaya mentah-mentah**:

- Endpoint karyawan (`POST /attendance/clock-in`, `/clock-out`) hanya menerima `source` = `mobile` atau `web`. Nilai `kiosk`, `machine`, dan `manual` sudah punya jalurnya sendiri.
- Bila request membawa header **`Sec-Fetch-Mode`**, source **dipaksa menjadi `web`**. Header ini selalu dikirim browser modern dan tidak bisa dihapus atau diubah oleh JavaScript halaman, sedangkan HTTP client native (Flutter/RN/Kotlin/Swift) tidak mengirimnya.

> **Batasan:** pemanggilan API langsung (curl/Postman) dengan token karyawan bisa mengaku `mobile` tanpa header itu. Cara itu tetap menjalani cek mobile (geofence, WiFi, mock), dan penutupnya adalah device binding + request signing di app mobile (rencana berikutnya). App mobile memakai Expo (React Native): HTTP client native, tidak mengirim `Sec-Fetch-Mode`, jadi tetap terdeteksi `mobile`. Bila suatu saat dibuat versi WebView, deteksi ini perlu disesuaikan.

---

## 4. IP Client & Proxy Tepercaya

- IP diambil dengan `gin.Context.ClientIP()`.
- Env **`TRUSTED_PROXIES`** (IP/CIDR, dipisah koma) berisi reverse proxy di depan API. Hanya `X-Forwarded-For` dari proxy tersebut yang dipercaya. Penjelasan lengkap dan contoh kasus: [Trusted proxy & IP client](/architectures/trusted-proxy-client-ip).
- **Wajib diisi di production.** Bila kosong, Gin mempercayai `X-Forwarded-For` dari siapa pun, sehingga karyawan bisa menulis IP kantor sendiri di header. API mencatat warning saat start bila env bukan `development`.

---

## 5. Urutan Cek (source `web`)

```
web_clock_enabled = false            → gagal(WEB_CLOCK_DISABLED)
IP client ∉ office_ips               → gagal(OUTSIDE_OFFICE_NETWORK)
lalu cek biasa:
  WiFi wajib                         → dianggap lolos (IP kantor menggantikan WiFi)
  geofence aktif + koordinat dikirim → dicek seperti biasa
```

Interaksi dengan [WiFi kantor](./14-office-wifi.md): sebelumnya web **selalu** gagal `WIFI_UNVERIFIABLE` bila WiFi wajib. Kini web yang lolos cek IP kantor dianggap berada di jaringan kantor, sehingga cek WiFi dilewati untuk web.

---

## 6. API

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| `POST` | `/attendance/rules` | config | Field baru `web_clock_enabled`, `office_ips`. Bila dihilangkan, nilai tersimpan dipertahankan |
| `GET` | `/attendance/rules` · `/attendance/me/rules` | read · self | Response memuat `web_clock_enabled`, `office_ips` |
| `GET` | `/attendance/rules/client-ip` | config | `{ "ip": "…" }`, yaitu IP yang dilihat server. Dipakai tombol "Use my current IP" |

### Error

| Code | HTTP | Kapan | Pesan ke karyawan |
|---|---|---|---|
| `WEB_CLOCK_DISABLED` | 422 | Absen web belum diaktifkan di rule | "Absen via web belum diaktifkan untuk kantor Anda, gunakan app mobile." |
| `OUTSIDE_OFFICE_NETWORK` | 422 | IP bukan IP kantor | "Absen via web hanya bisa dari jaringan kantor." |

---

## 7. Backoffice

- **HR Setting → Attendance Rules → modal rule:** bagian *Web clock-in (ESS)* berisi switch, daftar IP (label + IP/CIDR), dan tombol *Use my current IP*.
- **ESS → Attendance:** mengirim `source: 'web'`. Error dari API ditampilkan sebagai toast.

---

## 8. Dampak Rollout

- Setelah migrasi, absen web **langsung ditolak** di semua tenant sampai HR mengaktifkannya per rule. Ini disengaja, dan HR perlu diberi tahu sebelum deploy.
- Isi `TRUSTED_PROXIES` sesuai topologi deploy sebelum mengaktifkan fitur.
