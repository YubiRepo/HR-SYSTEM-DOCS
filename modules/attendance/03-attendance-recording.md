# 03 · Attendance Recording

## 1. Clock In / Out

Catatan kehadiran dasar: waktu masuk & pulang satu karyawan satu hari.

```
Budi · 2026-01-15
  clock_in : 08:03
  clock_out: 17:10
```

Satu hari bisa punya beberapa pasang (mis. keluar-masuk saat istirahat) — tergantung kebijakan tenant.

---

## 2. Sumber Absensi (Multi-channel)

| Sumber | Cara | Bukti |
|---|---|---|
| **Mobile app** | Clock in/out dari HP | GPS lokasi, foto (selfie) opsional |
| **Web** | Dari browser | IP, opsional |
| **Mesin absensi** | Fingerprint/kartu/wajah | Device ID (via integrasi) |
| **Manual** | Diinput HR (mis. lupa absen) | Alasan + aktor (audit) |

> Sumber & bukti yang diwajibkan dapat dikonfigurasi (mis. wajib GPS untuk lapangan, bebas untuk kantor).

---

## 3. Validasi Lokasi (Geofence) — Opsional

Untuk mencegah "titip absen", tenant dapat mengaktifkan **geofence**: clock-in hanya sah dalam radius lokasi kerja (kantor/cabang/proyek).

```
lokasi kerja: -6.200, 106.816 (radius 100 m)
clock-in di luar radius → ditandai "di luar area" (tolak / butuh persetujuan)
```
Konfigurabel per cabang/lokasi. Bisa juga dilonggarkan untuk WFH.

---

## 4. Status Kehadiran Harian

Setelah clock & dibandingkan jadwal, tiap hari punya status:

| Status | Arti |
|---|---|
| `present` | Hadir sesuai jadwal |
| `late` | Masuk melewati toleransi |
| `early_leave` | Pulang sebelum jadwal |
| `overtime` | Ada jam lembur |
| `absent` (alpha) | Tidak hadir tanpa keterangan |
| `on_leave` | Cuti (dari modul Leave — bukan alpha) |
| `holiday` / `day_off` | Libur |

> **Penting:** sistem membaca data **Leave** sebelum menandai `absent`. Karyawan yang cuti sah tidak boleh dihitung alpha.

---

## 5. Koreksi Absensi

Kesalahan wajar terjadi (lupa clock-out, HP error). Koreksi:
- Karyawan **ajukan koreksi** (mis. "lupa absen pulang, saya pulang 17:00").
- Manajer/HR **setujui** (pakai reporting line Core HR).
- Semua koreksi **tercatat** (nilai lama → baru, aktor, alasan) untuk audit.

Koreksi setelah periode Payroll ditutup mengikuti aturan koreksi Payroll (lewat run berikutnya).

---

## 6. Anti-Kecurangan (ringkas)

- **Geofence** — batasi lokasi absen.
- **Foto/selfie** — verifikasi identitas.
- **Device binding** (opsional) — 1 akun 1 perangkat.
- **Deteksi anomali** — clock-in ganda, lokasi melompat jauh.

> Detail keamanan (mis. mock-location detection) menjadi bahasan lanjutan; dokumen ini menetapkan titik kontrolnya.
