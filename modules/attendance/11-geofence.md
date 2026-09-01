<!-- 📁 modules/attendance/11-geofence.md -->
# 11 · Geofence & Validasi Lokasi

Bagaimana sistem memastikan karyawan benar-benar berada di lokasi kerja saat absen: menghitung jarak ke titik cabang, membandingkan dengan radius izin, dan mencegah manipulasi (fake GPS).

---

## 1. Konsep

Geofence = "pagar virtual" berbentuk lingkaran di sekitar lokasi kerja.
```
titik cabang (pusat) + radius → area sah untuk absen
karyawan di dalam radius  → boleh absen
karyawan di luar radius   → ditolak (OUTSIDE_GEOFENCE)
```

Komponen:
| Bagian | Sumber |
|---|---|
| Titik pusat (`lat`/`lng`) | `branches` (Platform/Tenant) |
| Radius (`geofence_radius_m`) | `attendance_rules` (configurable) |
| Aktif/tidak (`geofence_enabled`) | `attendance_rules` |
| Koordinat karyawan | Dikirim app saat clock in/out |

---

## 2. Logika Cek Radius (Haversine)

Jarak antara dua titik koordinat (bumi = bola) dihitung dengan rumus **Haversine** — standar untuk jarak GPS.

```
input:
  cabang   : (lat1, lng1)
  karyawan : (lat2, lng2)
  radius   : R meter

jarak = haversine(lat1, lng1, lat2, lng2)   // hasil dalam meter

within_geofence = (jarak ≤ R)
```

**Contoh:**
```
cabang    : -6.2088, 106.8456
karyawan  : -6.2090, 106.8460
radius    : 100 m

jarak ≈ 50 m  →  50 ≤ 100  →  within_geofence: true  (boleh)
jarak ≈ 150 m →  150 > 100 →  OUTSIDE_GEOFENCE       (ditolak)
```

> Haversine cukup akurat untuk jarak pendek (puluhan–ratusan meter) seperti area kantor/pabrik. Tak perlu rumus geodesik yang lebih berat.

---

## 3. Di Mana Cek Dijalankan: SERVER (final)

**Keputusan akhir selalu di server**, bukan di HP.

```
HP (client)                     Server
  ├─ ambil koordinat GPS          
  ├─ (opsional) hitung jarak      
  │   untuk PREVIEW ke user       
  │   "kamu di luar radius"       
  └─ kirim koordinat mentah ──▶   ├─ hitung jarak (Haversine)
                                  ├─ bandingkan radius
                                  ├─ cek sinyal anti-fake (§4)
                                  └─ PUTUSKAN: terima / tolak
```

| Sisi | Peran |
|---|---|
| **Client (HP)** | Ambil GPS, boleh hitung jarak untuk **preview** (UX: kasih tahu user sebelum submit). Tidak menentukan. |
| **Server** | Hitung ulang, cek anti-fake, **putuskan**. Sumber kebenaran. |

**Kenapa server yang final:** bila HP yang memutuskan, karyawan bisa mengirim "sudah di lokasi kok" tanpa benar-benar di sana. Server tak percaya klaim client — hanya percaya koordinat mentah yang diverifikasi sendiri.

### 3.1 Preview Real-time di HP (UX)

Agar karyawan tahu statusnya **sebelum** menekan tombol absen, HP menghitung jarak **secara lokal & live** — tanpa memanggil server tiap detik.

```
1. Buka app → GET /attendance/me/geofence  (SEKALI)
      → dapat titik cabang + radius
2. Di layar absen → GPS HP bergerak
      → app hitung jarak lokal (Haversine) tiap update GPS
      → UI live:
          dalam radius  → tombol absen aktif, "Siap absen ✅"
          luar radius   → tombol nonaktif, "Di luar zona · 150m dari kantor ❌"
3. Tekan absen → POST /attendance/clock
      → SERVER hitung ulang + cek anti-fake → keputusan final
```

| Momen | Di mana | Tujuan |
|---|---|---|
| **Preview** (live) | HP, pakai config yang di-load | UX — kasih tahu user status zona |
| **Final** (submit) | Server, saat clock | Keputusan sah + anti-fake |

**Penting:** preview lokal **tidak** menggantikan validasi server. HP bisa saja salah/dimanipulasi; server tetap cek ulang. Preview hanya membuat pengalaman mulus (user tak submit lalu ditolak).

**Endpoint:**
- `GET /attendance/me/geofence` → ambil titik cabang + radius (untuk hitung lokal). Lihat `mobile/api/attendance.md`.
- `POST /attendance/clock` → submit; server putuskan final.

---

## 4. Anti-Kecurangan (Fake GPS)

**Masalah:** aplikasi "fake GPS" membuat HP melaporkan lokasi palsu — karyawan absen dari rumah seolah di kantor. Tanpa penangkal, geofence jadi percuma.

### 4.1 Deteksi Mock Location
Android & iOS menandai bila koordinat berasal dari aplikasi palsu (`isFromMockProvider` / indikator setara). App membaca flag ini dan mengirim ke server.
```
clock request:
  location: { lat, lng, is_mock: false }
   → server: bila is_mock = true → tolak (MOCK_LOCATION_DETECTED)
```

### 4.2 Lapisan Sinyal Tambahan
Tak bergantung satu sinyal saja — kombinasikan:
| Sinyal | Deteksi |
|---|---|
| **Mock flag** | Lokasi dari app palsu |
| **Kecepatan tak wajar** | Absen di Jakarta jam 08:00, lalu di Surabaya jam 08:10 (mustahil) |
| **Konsistensi IP vs GPS** | GPS bilang kantor, IP dari jaringan luar kota |
| **Integritas perangkat** | Perangkat di-root/jailbreak (risiko lebih tinggi) — opsional |
| **Face + GPS** | Gabung biometrik: harus di lokasi **dan** wajah cocok |

### 4.3 Respons Bertingkat (Configurable)
Tenant memilih ketegasan:
```
deteksi fake:
  ├─ tolak langsung (ketat)               → MOCK_LOCATION_DETECTED
  ├─ terima tapi tandai (flag untuk HR)   → butuh review
  └─ minta verifikasi tambahan (face)     → step-up
```

> **Face + GPS** adalah kombinasi terkuat untuk lokasi rawan: fake GPS bisa memalsukan lokasi, tetapi tak bisa memalsukan wajah yang cocok di titik itu.

---

## 5. Kasus Khusus

| Kasus | Perilaku |
|---|---|
| **GPS lemah/tak akurat** | Toleransi akurasi (mis. terima bila akurasi < X meter); bila buruk, minta ulang/koreksi |
| **Kerja lapangan (sales)** | Geofence dimatikan / multi-titik / radius besar per peran (configurable) |
| **Multi-lokasi cabang** | Cek terhadap titik cabang karyawan; bisa beberapa titik sah |
| **WFH** | Geofence off untuk shift `flexible`/WFH |
| **Kiosk/mesin** | Tak pakai GPS — lokasi sudah pasti (device terpasang di titik itu) |

---

## 6. Kaitan dengan Recording & Config

- **Recording** (`03-attendance-recording.md`): geofence adalah bagian validasi clock in/out.
- **Method config** (`09-method-config.md`): `require_geofence` diaktifkan per tenant/cabang.
- **Branch** (`platform/tenant`): menyimpan `lat`/`lng` titik pusat.
- **Rules**: `geofence_radius_m`, `geofence_enabled`.

---

## 7. API (ringkas)

Geofence tidak punya endpoint terpisah — ia bagian dari clock in/out. Koordinat & sinyal dikirim di `POST /attendance/clock` (lihat `mobile/api/attendance.md`).

**Request (relevan geofence):**
```json
{
  "type": "in",
  "method": "mobile_gps",
  "location": { "lat": -6.2090, "lng": 106.8460, "accuracy_m": 12, "is_mock": false }
}
```
**Response bila di luar / fake:**
```json
{ "success": false, "error": { "code": "OUTSIDE_GEOFENCE", "message": "Anda di luar radius lokasi kerja", "distance_m": 150, "radius_m": 100 } }
```
```json
{ "success": false, "error": { "code": "MOCK_LOCATION_DETECTED", "message": "Lokasi palsu terdeteksi" } }
```

---

## 8. Data Model (tambahan)

Field pada `attendance_records` untuk jejak geofence:
| Field | Tipe | Keterangan |
|---|---|---|
| `clock_lat` / `clock_lng` | number (nullable) | Koordinat saat absen |
| `location_accuracy_m` | int (nullable) | Akurasi GPS yang dilaporkan |
| `within_geofence` | boolean | Hasil cek radius |
| `distance_m` | int (nullable) | Jarak ke titik cabang |
| `is_mock_location` | boolean | Flag lokasi palsu |
| `location_flag` | enum (nullable) | `ok` / `outside` / `mock` / `suspicious` (untuk review HR) |

> Config radius/aktif ada di `attendance_rules`; titik pusat di `branches`. Lihat `06-data-model.md`.
