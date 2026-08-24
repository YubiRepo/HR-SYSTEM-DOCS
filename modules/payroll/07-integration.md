# 07 · Integration

Payroll bergantung pada beberapa modul & menyediakan data ke beberapa modul lain. Ia tidak menyimpan data karyawan/kehadiran sendiri — hanya mengonsumsinya.

---

## 1. Sumber Data (yang dikonsumsi Payroll)

| Modul | Data | Dipakai untuk |
|---|---|---|
| **Core HR** | Karyawan aktif, gaji pokok, cabang, `user_id` | Menentukan peserta run & nilai dasar |
| **Core HR** | Status karyawan (aktif/probation) | Hanya karyawan aktif ikut run |
| **Attendance & Leave** | Jam lembur, potongan absen, cuti tak berbayar | Komponen variabel (uang lembur, potongan) |
| **employee_tax_profile** | PTKP, NPWP | Perhitungan PPh 21 |
| **Config (TER, BPJS)** | Tarif & plafon berlaku | Perhitungan pajak & iuran |

> Bila modul Attendance tidak aktif (plan lebih rendah), komponen lembur/absen dapat diinput manual atau diabaikan.

### 1.1 Dampak Attendance ke Gaji (konkret)

Attendance adalah **sumber variabel** utama: kehadiran menaikkan & menurunkan gaji.

| Rekap Attendance | Efek | Komponen Payroll |
|---|---|---|
| `overtime_hours` | **naik** | uang lembur (formula) |
| `present_days` | naik/turun | tunjangan harian (transport/makan, tipe daily) |
| `absent_days` | **turun** | potongan alpha |
| `late_minutes` | turun | potongan telat (bila aturan aktif) |
| `leave_days` | tergantung | cuti berbayar = tak memotong; tak berbayar = memotong |

**Contoh** — Budi gaji pokok Rp8.000.000, rekap Januari: lembur 6 jam, masuk 20 hari, alpha 1 hari.
```
+ Uang lembur = (8.000.000/173) × 6 × 1.5  ≈ 416.000
+ Transport   = 25.000 × 20                 = 500.000
− Alpha       = (8.000.000/22) × 1          ≈ 363.000
```
Tanpa data attendance, angka-angka ini tak bisa dihitung. Payroll menarik rekap via `GET /attendance/summary` saat calculate run; karena itu **koreksi absensi harus selesai sebelum run di-close** (lihat attendance `03` §5.3).

---

## 2. Konsumen (yang memakai output Payroll)

| Modul | Output | Kegunaan |
|---|---|---|
| **Notification** | Slip gaji siap kirim | Kirim slip ke karyawan (email/app) |
| **Billing** | Jumlah karyawan aktif (seat) | Basis PEPM (walau sumber utama tetap Core HR) |
| **Integrasi eksternal** | File transfer bank | Eksekusi pembayaran |
| **Integrasi/ekspor** | Data PPh 21 & BPJS | Setor & lapor ke DJP / BPJS |

---

## 3. Gerbang Entitlement & RBAC

```
request payroll → 1) Entitlement: tenant punya fitur "payroll"?
                → 2) RBAC: user punya izin (payroll:run / approve / read)?
                → 3) scope: branch admin dibatasi cabangnya
                → lolos → eksekusi
```
Payroll adalah fitur premium (plan Pro ke atas). Bila tenant tak berlangganan → `403 FEATURE_NOT_IN_PLAN` (arahkan upgrade).

---

## 4. Alur Data saat Run

```
calculate run
   ├─ ambil karyawan aktif (Core HR, scope cabang)
   ├─ ambil komponen tetap tiap karyawan (employee_components)
   ├─ ambil variabel bulan ini (Attendance: lembur/absen)
   ├─ ambil PTKP/NPWP (tax profile)
   ├─ ambil tarif TER & BPJS berlaku (config, sesuai period)
   ├─ hitung per karyawan (kotor → BPJS → PPh21 → net)
   └─ simpan payslip + payslip_lines (snapshot)
```

---

## 5. Ketergantungan Longgar pada Attendance

Attendance memberi **angka variabel** (jam lembur, hari absen). Kontraknya:
- Payroll meminta rekap periode: `GET (Attendance) /overtime?period=..&employee=..`.
- Bila tidak tersedia, komponen variabel = 0 atau input manual.
- Ini menjaga Payroll tetap bisa jalan meski Attendance belum dipakai.

---

## 6. Penyediaan Seat Count ke Billing

Billing memakai jumlah karyawan **aktif** untuk PEPM. Sumber kebenaran utama adalah **Core HR** (status aktif). Payroll dapat memakai angka yang sama; tidak menghitung ulang definisi seat sendiri agar konsisten.

---

## 7. Notifikasi (titik picu)

Payroll memicu notifikasi di beberapa titik (dikirim modul Notification saat sudah dibangun):
- Slip gaji terbit → kirim ke karyawan.
- Run butuh persetujuan → ingatkan checker.
- Jatuh tempo setor PPh 21 / BPJS → ingatkan admin.

> Sampai modul Notification ada, titik-titik ini disiapkan sebagai event; pengiriman aktual menyusul.
