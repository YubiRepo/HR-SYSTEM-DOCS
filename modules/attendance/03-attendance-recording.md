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

Setelah clock & dibandingkan jadwal, status tiap hari disimpan sebagai **array** dengan paling banyak satu nilai per dimensi, berurutan **hari → kehadiran → masuk → pulang**. Tiap dimensi di-resolve sendiri, jadi kombinasi tidak hilang (telat sekaligus lembur tetap terlihat). Dimensi yang tidak relevan untuk hari itu tidak muncul di array.

| Dimensi | Nilai | Arti / kapan diisi |
|---|---|---|
| Hari (`day`) | `workday` | Hari kerja terjadwal |
| | `holiday` | Libur nasional/perusahaan |
| | `day_off` | Tidak ada jadwal (libur) |
| | `on_leave` | Cuti (dari modul Leave — bukan alpha) |
| Kehadiran (`presence`) | `present` | Clock-in & clock-out ada |
| | `incomplete` | Sudah clock-in, belum clock-out |
| | `absent` (alpha) | Hari kerja tanpa clock-in |
| Masuk (`arrival`) | `on_time` / `late` | Hanya hari kerja terjadwal yang sudah clock-in; `late` = melewati toleransi |
| Pulang (`departure`) | `left_on_time` / `early_leave` / `overtime` / `auto_clock_out` | Hanya hari kerja terjadwal yang sudah clock-out; `auto_clock_out` didahulukan karena jamnya diisi sistem |

Prioritas dimensi hari: `on_leave` > `holiday` > `day_off` > `workday`.

Contoh:
```
["workday", "present", "late", "overtime"]   telat, tapi lembur
["workday", "incomplete", "on_time"]         sedang bekerja
["workday", "absent"]                        alpha
["holiday", "present"]                       masuk di hari libur (lembur via overtime request)
["on_leave"]                                 cuti
```

- Menit telat/pulang awal/lembur tetap disimpan terpisah (`late_minutes`, `early_leave_minutes`, `overtime_minutes`).
- Koreksi `field=status` berisi **satu nilai**, yang mengganti nilai di dimensi yang sama (mis. `on_leave` mengganti `workday`). `old_value` adalah nilai lama di dimensi itu.
- Shift `flexible`: `arrival` selalu `on_time`; `departure` dihitung dari total jam kerja vs target.

> **Penting:** sistem membaca data **Leave** sebelum menandai `absent`. Karyawan yang cuti sah tidak boleh dihitung alpha.

---

## 5. Lupa Absen & Koreksi

Lupa absen adalah kejadian **sehari-hari** — bila tak ditangani, karyawan bisa salah ditandai alpha atau salah hitung jam. Ditangani berlapis (pencegahan → penanganan → pengaman).

### 5.1 Skenario Umum
| Skenario | Kondisi | Risiko |
|---|---|---|
| Lupa clock-out | ada clock-in, tak ada clock-out | jam kerja tak terhitung |
| Lupa clock-in | tak ada clock-in, ada clock-out | jam kerja tak terhitung |
| Lupa keduanya | tak ada record sama sekali | ditandai alpha padahal masuk |
| Telat clock-out | clock-out jauh setelah shift | lembur palsu |

### 5.2 Mekanisme Berlapis

**1. Reminder (pencegahan)**
Notifikasi bila belum clock-in/out mendekati/melewati jam shift (mis. 17:30 belum clock-out). Mengurangi kejadian lupa. Via Notification (saat modul ada).

**2. Pengajuan Koreksi (penanganan utama)**
```
Karyawan ajukan: "lupa clock-out kemarin, saya pulang 17:00"
   → Manajer ATAU HR review → approve/reject
   → record dibetulkan; perubahan tercatat (audit)
```
- Approver: **manajer (via reporting line Core HR) atau HR** — mana yang tersedia.
- Semua koreksi tercatat: nilai lama → baru, aktor, alasan, waktu.

**3. Auto Clock-out (opsional, per tenant) + Cap Waktu**
Bila lupa clock-out, sistem mengisi otomatis dengan **jam akhir shift**, ditandai `auto`.
```
lupa clock-out, shift berakhir 17:00 → clock_out = 17:00 (flag: auto)
```
- Mencегah record menggantung.
- **Ditandai `auto`** agar HR tahu ini bukan waktu aktual — bisa dikoreksi bila ternyata lembur.
- Dapat dimatikan tenant yang ingin murni manual.

**Cap waktu (configurable):** ada batas berapa lama sesi terbuka boleh berjalan sebelum dianggap lupa & ditutup paksa.
```
cap default: 23 jam (configurable per tenant, mis. 12/18/23 jam)
   clock-in 08:00, belum clock-out sampai lewat cap
   → sistem auto clock-out (flag: auto) & tandai untuk koreksi
```
- Cap **bebas ditentukan tenant** (mis. pabrik 3 shift mungkin < 23 jam agar tak nabrak shift berikutnya).
- Mencegah sesi "menggantung" berhari-hari yang merusak rekap.

**Reminder (pencegahan cap):** sebelum cap tercapai, sistem mengirim **notif pengingat** agar karyawan clock-out.
```
mendekati akhir shift / mendekati cap → push notif "Jangan lupa absen pulang"
```
Via Notification (saat modul ada). Mengurangi kejadian auto clock-out.

**4. Batas Telat Clock-out (anti lembur palsu)**
```
clock-out > X jam setelah shift TANPA lembur disetujui
   → dianggap lupa; dipotong ke jam shift (bukan lembur)
```
Mencegah jam kerja/lembur membengkak karena telat menekan tombol.

### 5.3 Batas Waktu Koreksi (kaitan Payroll)

Koreksi absensi memengaruhi gaji, jadi terikat siklus Payroll:
```
- Koreksi diterima sampai tanggal cut-off periode (mis. tgl 25).
- Setelah payroll run periode itu CLOSED → koreksi masuk run berikutnya
  (sebagai penyesuaian), tidak mengubah run yang sudah dikunci.
```
Sejalan prinsip "closed = terkunci" di Payroll. Endpoint koreksi menolak perubahan pada periode terkunci (`CORRECTION_NOT_ALLOWED`).

### 5.4 Alur Koreksi
```
karyawan (ajukan) → manajer/HR (review) → approve
   → record diperbarui + audit
   → bila periode belum closed: masuk perhitungan periode ini
   → bila sudah closed: penyesuaian di run berikutnya
```

---

## 6. Anti-Kecurangan (ringkas)

- **Geofence** — batasi lokasi absen.
- **Foto/selfie** — verifikasi identitas.
- **Device binding** (opsional) — 1 akun 1 perangkat.
- **Deteksi anomali** — clock-in ganda, lokasi melompat jauh.

> Detail keamanan (mis. mock-location detection) menjadi bahasan lanjutan; dokumen ini menetapkan titik kontrolnya.
