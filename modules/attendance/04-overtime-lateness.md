# 04 · Overtime & Lateness

Perhitungan selisih antara **jadwal** dan **kehadiran aktual**. Semua aturan bersifat konfigurasi per tenant.

---

## 1. Lembur (Overtime)

Jam kerja melebihi jadwal. Basis untuk komponen `OVERTIME` di Payroll.

```
jadwal  : 08:00–17:00 (8 jam)
aktual  : 08:00–18:30
lembur  : 1,5 jam
```

**Pengukuran (Attendance Rule):**
- **OT mulai setelah** (`ot_threshold_min`) — menit sebelum `jam pulang + ambang` dibuang. Contoh: pulang 17:00, ambang 30, clock out 17:45 → 15 menit.
- **Pembulatan** (`ot_rounding_min`) — satuan pembulatan.
- **Toleransi** (`ot_tolerance_min`) — sisa ≥ `pembulatan − toleransi` dinaikkan menjadi satu satuan penuh. Contoh: satuan 30, toleransi 5 → 55' jadi 60', 54' jadi 30'.
- **Perlu persetujuan** — lembur hanya dihitung bila ada request yang disetujui (kebijakan lembur tanpa request diatur per Overtime Rule).

Pembagian ke komponen (OT1, OT2, …) dan multiplier diatur di **Overtime Rule** per *day type* (hari kerja / rest day / libur), bukan di request atau holiday. Selengkapnya: [13-overtime-management.md](./13-overtime-management.md).

---

## 2. Lembur Hari Libur / Nasional

Kerja di rest day atau hari libur: seluruh durasi kerja adalah lembur (pembulatan & toleransi berlaku, ambang tidak). Jenis hari ditentukan klasifikasi modul sumber (`REST_DAY` dari jadwal, `PUBLIC_HOLIDAY` dari kalender libur) dan dicocokkan ke day type Overtime Rule — lihat [13 §3](./13-overtime-management.md#3-klasifikasi-hari).

---

## 3. Keterlambatan (Lateness)

Masuk melewati **toleransi**.
```
jadwal masuk : 08:00
toleransi    : 15 menit
clock-in     : 08:20 → telat 20' (5' melewati toleransi)
```

**Konsekuensi (konfigurabel):**
- Sekadar catatan, atau
- **Potongan** (feed ke Payroll sebagai deduction), atau
- Akumulasi (mis. 3× telat = potong 1 hari).

---

## 4. Pulang Cepat & Mangkir

- **Early leave** — pulang sebelum jadwal (bisa jadi potongan).
- **Alpha (absent)** — tidak hadir tanpa keterangan → potongan penuh hari itu.
- **Setengah hari** — hadir sebagian (aturan tenant).

> Sebelum menandai alpha, sistem cek modul **Leave** — bila ada cuti sah, bukan alpha.

**Penandaan alpha (implementasi):** karyawan yang tidak clock-in tidak punya record, jadi alpha/cuti baru tercatat lewat **evaluasi periode** (`POST /attendance/records/evaluate`, tombol *Evaluate Attendance* di Daily Records). Evaluasi membuat record `source=system` untuk setiap hari kosong, dengan urutan status yang sama seperti clock-in: cuti approved → `on_leave`, libur → `holiday`, tanpa jadwal → `day_off`, selain itu `absent`. Record system dihitung ulang tiap evaluasi (cuti yang di-approve belakangan mengubah absent → on_leave); koreksi yang di-approve atas record system menjadikannya `manual` sehingga tak ditimpa lagi. Tanggal yang periode payroll-nya terkunci dan tanggal sebelum tanggal masuk di-skip. Rencana: job harian yang mengevaluasi "kemarin" memakai use case yang sama.

---

## 5. Rekap Periode (untuk Payroll)

Pada akhir periode, Attendance menghasilkan rekap per karyawan:

```
Rekap Budi · 2026-01
  hari kerja   : 22
  hadir        : 20
  telat        : 3× (akumulasi 40')
  lembur       : 6 jam (disetujui)
  alpha        : 1 hari
  cuti         : 1 hari (dari Leave)
```

Rekap ini yang ditarik Payroll saat `calculate` run → jadi variabel formula (`overtime_hours`, `late_days`, `unpaid_days`, `present_days`). Rekap juga memuat blok `overtime` berisi total menit **per komponen OT** dari transaksi lembur yang tervalidasi ([13 §8](./13-overtime-management.md#8-rekap-untuk-payroll)).

---

## 6. Pembulatan & Ketepatan

- Satuan waktu konsisten (menit), dikonversi ke jam saat kirim ke Payroll.
- Aturan pembulatan didokumentasikan & konsisten agar hasil reproducible.
- Setiap angka rekap dapat ditelusuri ke catatan harian (audit).
