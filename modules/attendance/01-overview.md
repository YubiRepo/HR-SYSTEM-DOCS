# 01 · Overview

## 1. Tujuan

Modul Attendance menjawab: **kapan tiap karyawan seharusnya bekerja, kapan mereka benar-benar hadir, dan apa selisihnya** (telat, lembur, mangkir). Hasilnya menjadi masukan penting bagi Payroll.

---

## 2. Konsep Inti

| Konsep | Penjelasan |
|---|---|
| **Shift** | Pola jam kerja (mis. 08:00–17:00) |
| **Schedule** | Penugasan shift ke karyawan pada tanggal tertentu |
| **Attendance record** | Catatan clock in/out satu karyawan satu hari |
| **Overtime** | Jam kerja melebihi jadwal |
| **Lateness / early-leave** | Telat masuk / pulang cepat |
| **Absence (alpha)** | Tidak hadir tanpa keterangan |
| **Rekap** | Ringkasan periode per karyawan untuk Payroll |

---

## 3. Aktor

| Aktor | Peran |
|---|---|
| **Karyawan** | Clock in/out, lihat kehadiran sendiri |
| **Manajer** | Lihat kehadiran tim, setujui koreksi/lembur |
| **HR / Admin** | Kelola shift, jadwal, aturan; koreksi absensi |
| **Sistem** | Hitung lembur/telat dari jadwal vs catatan |

---

## 4. Relasi dengan Modul Lain

| Modul | Hubungan |
|---|---|
| **Core HR** | Data karyawan, cabang, reporting line (untuk approval) |
| **Leave** | Hari cuti mengurangi kewajiban hadir (tidak dihitung alpha) |
| **Payroll** | Terima jam lembur, hari absen, potongan → komponen gaji |
| **Entitlement/RBAC** | Gerbang fitur & scope cabang |
| **Notification** | Pengingat clock-in, approval lembur (saat modul ada) |

---

## 5. Alur Ringkas

```
jadwalkan shift → karyawan clock in/out
   → sistem bandingkan (jadwal vs aktual)
   → hitung: hadir / telat / lembur / alpha
   → rekap periode → Payroll
```

---

## 6. Batasan & Asumsi

- Mengacu jadwal (shift) sebagai baseline; tanpa jadwal, dipakai jam kerja default tenant.
- Aturan lembur/telat/pembulatan adalah **data konfigurasi** per tenant.
- Attendance tidak mengurus cuti (itu modul Leave) — tetapi membaca status cuti agar tidak salah menandai alpha.
- Scope per cabang mengikuti Tenancy 2-level.
