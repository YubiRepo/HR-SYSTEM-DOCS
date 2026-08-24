# 07 · Integration

Leave terhubung ke Core HR (data & approval), Attendance (status kehadiran), dan Payroll (potongan cuti tak berbayar).

---

## 1. Dengan Core HR

| Data | Guna |
|---|---|
| Karyawan & masa kerja | Kelayakan cuti (mis. tahunan setelah 12 bulan) |
| Reporting line | Menentukan approver "atasan" |
| Status karyawan | Set `on_leave` saat cuti panjang (mis. melahirkan) |
| Cabang | Scope & kalender cuti per cabang |

---

## 2. Dengan Attendance

Hubungan dua arah:

**Leave → Attendance:**
```
cuti disetujui (10–12 Feb) → Attendance tandai hari itu `on_leave`
   → TIDAK dihitung alpha
```

**Attendance → Leave:**
- Perhitungan **jumlah hari cuti** (`days`) memakai kalender hari kerja & libur dari Attendance — mis. cuti Jumat–Senin bisa 2 hari kerja (Sabtu–Minggu libur), bukan 4.
- Attendance menanyakan status cuti sebelum menandai alpha (lihat attendance `03` §4).

> Kontrak: saat approve cuti, Leave mengirim rentang tanggal ke Attendance; saat hitung status harian, Attendance cek cuti aktif.

---

## 3. Dengan Payroll

| Kategori cuti | Efek gaji |
|---|---|
| **Berbayar** (tahunan, sakit, melahirkan, khusus) | Gaji pokok + tunjangan tetap tetap dibayar; tunjangan kehadiran (transport/makan) tidak diberikan (tak hadir) |
| **Tak berbayar** (unpaid) | Potongan gaji sesuai hari (no work no pay) |
| **Cuti sakit berkepanjangan** | Upah bertingkat (100/75/50/25%) — Payroll menerapkan sesuai durasi |
| **Sisa cuti saat PHK** | Encashment → Payroll final pay (kompensasi uang) |

**Alur ke Payroll:**
```
Payroll: calculate run
   └─ tarik data cuti periode dari Leave:
        unpaid_days, paid_leave_days, sick_leave_tier
   └─ unpaid_days → potongan; tunjangan harian disesuaikan hari hadir
```

Rekap cuti masuk sebagai variabel (mis. `unpaid_days`) yang dipakai formula Payroll. Leave mengirim **jumlah hari & kategori**; Payroll menghitung uangnya.

---

## 4. Gerbang Entitlement & RBAC

```
request → Entitlement: tenant punya fitur "leave"?
        → RBAC: izin (leave:self / read / approve / config)?
        → scope: karyawan (self), manajer (team), branch admin (branch)
```

Leave bisa berada di plan yang berbeda dari Payroll. Bila keduanya aktif, cuti tak berbayar otomatis memotong gaji.

---

## 5. Dengan Notification (titik picu)

- Pengajuan cuti → notifikasi ke approver.
- Cuti disetujui/ditolak → notifikasi ke karyawan.
- Pengingat saldo akan hangus (carry-over kedaluwarsa).
- Pengingat approver bila ada pengajuan menunggu.

> Sampai modul Notification ada, titik-titik ini disiapkan sebagai event.

---

## 6. Ringkasan Aliran Data

```
Core HR (karyawan, reporting line)
      │
      ▼
   LEAVE  ──approved──▶ Attendance (on_leave, bukan alpha)
      │
      └──unpaid/encashment──▶ Payroll (potongan / kompensasi)
```
