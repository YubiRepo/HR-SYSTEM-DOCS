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

**Aturan konfigurabel:**
- **Ambang mulai** — lembur dihitung setelah X menit lewat jadwal (mis. min. 30').
- **Pembulatan** — per 30'/60' (mis. 1 jam 20' → 1 jam).
- **Perlu persetujuan** — lembur hanya dihitung bila disetujui manajer (mencegah lembur liar).
- **Multiplier** — sesuai aturan (jam pertama 1,5×, berikutnya 2×; hari libur beda).

> Multiplier & jam dikirim ke Payroll; perhitungan uang lembur memakai formula di Payroll (`(BASIC/173) × jam × multiplier`).

---

## 2. Lembur Hari Libur / Nasional

Kerja di hari libur mingguan atau libur nasional dihitung dengan multiplier khusus (biasanya lebih tinggi), mengikuti aturan ketenagakerjaan. Ditandai terpisah agar Payroll menerapkan multiplier yang benar.

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

Rekap ini yang ditarik Payroll saat `calculate` run → jadi variabel formula (`overtime_hours`, `late_days`, `unpaid_days`, `present_days`).

---

## 6. Pembulatan & Ketepatan

- Satuan waktu konsisten (menit), dikonversi ke jam saat kirim ke Payroll.
- Aturan pembulatan didokumentasikan & konsisten agar hasil reproducible.
- Setiap angka rekap dapat ditelusuri ke catatan harian (audit).
