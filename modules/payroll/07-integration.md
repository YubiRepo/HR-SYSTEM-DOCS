# 07 · Integration

Payroll bergantung pada beberapa modul & menyediakan data ke beberapa modul lain. Ia tidak menyimpan data karyawan/kehadiran sendiri — hanya mengonsumsinya.

---

## 1. Sumber Data (yang dikonsumsi Payroll)

| Modul | Data | Dipakai untuk |
|---|---|---|
| **Core HR** | Karyawan aktif, gaji pokok, cabang, `user_id` | Menentukan peserta run & nilai dasar |
| **Core HR** | Status karyawan (aktif/probation) | Hanya karyawan aktif ikut run |
| **Core HR** (`GetActiveContractTypes`) | Jenis kontrak aktif | Filter `employment_type` run & kolom daftar Compensations (P15) |
| **Core HR** (`ListBankAccounts`) | Rekening bank karyawan (flag rekening utama) | Payment batch & file bank (P8) |
| **employee_compensations** | Versi kompensasi berlaku (structure, cabang) | Peserta run, cabang & `salary_type` karyawan (P15) |
| **Attendance & Leave** | Jam lembur, potongan absen, cuti tak berbayar | Komponen variabel (uang lembur, potongan) |
| **employee_tax_profile** | PTKP, perlakuan pajak | Perhitungan PPh 21 |
| **Core HR** (`FindEmployeeTaxIdentity`) | NPWP, NIK, tanggal masuk | `has_npwp` & snapshot NPWP di slip; tanggal mulai kepesertaan BPJS awal (P11) |
| **employee_bpjs_enrollments** | Program yang diikuti, nomor kepesertaan, kelas risiko JKK | Iuran BPJS per karyawan (P11) |
| **Config (TER, BPJS)** | Tarif & plafon berlaku | Perhitungan pajak & iuran |

> Bila modul Attendance tidak aktif (plan lebih rendah), komponen lembur/absen dapat diinput manual atau diabaikan.

### 1.1 Dampak Attendance & Leave ke Gaji (konkret)

Attendance (termasuk lembur) dan Leave adalah **sumber variabel** utama: kehadiran menaikkan & menurunkan gaji. Semua angka di bawah dihitung per karyawan untuk **rentang tanggal periode run** (lihat §1.2) dan masuk ke formula sebagai variabel (daftar lengkap: `08` §2).

| Variabel | Sumber | Arti | Contoh pemakaian |
|---|---|---|---|
| `work_days` | Attendance | Hari kerja (workday + cuti + day off yang tetap masuk; libur tidak dihitung) | pro-rata gaji |
| `scheduled_days` | Attendance | Hari yang punya shift terjadwal (termasuk pola fixed) | pembagi pro-rata |
| `present_days` | Attendance | Hari hadir (present/incomplete) | tunjangan harian (transport/makan) |
| `absent_days` | Attendance | Workday tanpa clock-in (alpha) | **potongan alpha** |
| `incomplete_days` | Attendance | Hari lupa clock-out | sanksi/administrasi |
| `late_count`, `late_minutes` | Attendance | Telat setelah toleransi shift | potongan telat |
| `early_leave_count`, `early_leave_minutes` | Attendance | Pulang cepat (status `early_leave`) | potongan pulang cepat |
| `auto_clock_out_count` | Attendance | Clock-out diisi sistem | sanksi/administrasi |
| `holiday_count`, `holiday_worked_days` | Attendance | Hari libur & libur yang tetap masuk | insentif hari libur |
| `day_off_count`, `day_off_worked_days` | Attendance | Day off & day off yang tetap masuk | insentif masuk di hari off |
| `actual_work_minutes` | Attendance | Total menit clock-in→clock-out (tanpa hari auto clock-out) | upah per jam |
| `duty_call_days` | Attendance | Hari dengan jadwal duty call | tunjangan siaga |
| `shift_days_<KODE_SHIFT>` | Attendance | Hari terjadwal per shift | tunjangan shift malam |
| `overtime_hours` | Attendance (OT transaction `validated`) | Menit lembur eligible / 60 | uang lembur |
| `overtime_weighted_hours` | Attendance (OT transaction) | Σ menit × multiplier tier / 60 | uang lembur gaya Kepmen 102 |
| `ot_min_<KODE>`, `ot_wmin_<KODE>` | Attendance (OT transaction) | Menit (biasa / terbobot) per komponen OT | tarif berbeda per tier |
| `attendance_leave_days` | Attendance | Hari berstatus `on_leave` (untuk rekonsiliasi) | — |
| `paid_leave_days`, `unpaid_days` | Leave | Hari cuti berbayar / tak berbayar di dalam rentang (pro-rata per hari kerja) | **potongan cuti tak berbayar** |
| `leave_days_<KODE_CUTI>` | Leave | Hari cuti per jenis cuti | aturan per jenis (mis. sakit) |

> `<KODE>` dinormalisasi: huruf besar, karakter selain `A-Z 0-9 _` diganti `_` (mis. komponen OT `ot-1` → `ot_wmin_OT_1`). Kode yang tidak punya data di periode tersebut tetap tersedia dengan nilai 0.

**Contoh** — Budi gaji pokok Rp8.000.000, rekap Januari: lembur 6 jam, masuk 20 hari, alpha 1 hari.
```
+ Uang lembur = (8.000.000/173) × 6 × 1.5  ≈ 416.000
+ Transport   = 25.000 × 20                 = 500.000
− Alpha       = (8.000.000/22) × 1          ≈ 363.000
```
Tanpa data attendance, angka-angka ini tak bisa dihitung. Payroll menarik rekap lewat `attendance.Contract`/`leave.Contract` saat calculate run (data yang sama dengan `GET /attendance/summary?date_from=&date_to=`).

### 1.2 Periode & Rentang Tanggal

- Attendance dan Leave **hanya mengenal rentang tanggal** (`date_from`..`date_to`). Konsep periode milik Payroll.
- Rentang absensi run = **jendela cutoff periode payroll** (P4: `cutoff_from`..`cutoff_to`, mis. 26 Okt – 25 Nov, atau Senin–Minggu untuk schedule mingguan). Run tanpa periode (off-cycle) memakai bulan kalender `period`.
- Kunci periode (`IsPeriodLocked`): tanggal terkunci bila berada dalam jendela cutoff periode `locked`/`closed` schedule mana pun (P4), atau bila ada run `closed` untuk bulan tanggal itu (perilaku lama).
- Payroll membaca libur nasional tenant dari Attendance (`ObservedHolidayDates`: `is_observed`, tanpa cabang) untuk menggeser tanggal bayar.
- Lembur dihitung berdasarkan `effective_date` OT transaction: tanggal kerja untuk transaksi biasa; tanggal booking untuk adjustment/transaksi yang dibukukan ke periode terbuka karena periode asalnya sudah terkunci.

### 1.3 Syarat Sebelum Calculate Run (bila Attendance aktif)

1. **Evaluasi periode** dijalankan otomatis untuk rentang run (sampai **kemarin**) agar hari terjadwal tanpa clock-in tercatat sebagai alpha. Bila ada hari yang gagal dievaluasi → run ditolak `422 ATTENDANCE_NOT_READY`.
2. **Item pending memblokir run**: bila ada karyawan target yang masih punya OT `pending_review` atau koreksi absensi `pending` di rentang → `409 ATTENDANCE_PENDING_ITEMS` (pesan memuat daftar karyawan). Selesaikan review dulu, lalu calculate ulang.
3. Bila Attendance/Leave **aktif** tetapi datanya gagal dibaca → run ditolak (`ATTENDANCE_NOT_READY`), bukan dihitung dengan angka 0.

> Hari setelah kemarin belum bisa dievaluasi; run yang dihitung sebelum akhir rentang tidak menghitung hari-hari tersebut (tidak jadi alpha, tidak jadi `scheduled_days`).

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
   ├─ terjemahkan period → rentang tanggal (bulan kalender)
   ├─ evaluasi attendance rentang tsb; tolak run bila ada item pending
   ├─ ambil variabel rentang tsb (Attendance: kehadiran/lembur; Leave: cuti)
   ├─ ambil PTKP/NPWP (tax profile)
   ├─ ambil tarif TER & BPJS berlaku (config, sesuai period)
   ├─ hitung per karyawan (kotor → BPJS → PPh21 → net)
   └─ simpan payslip + payslip_lines (snapshot)
```

---

## 5. Ketergantungan Longgar pada Attendance

Attendance memberi **angka variabel** (jam lembur, hari absen). Kontraknya:
- Payroll meminta rekap per rentang tanggal lewat `attendance.Contract` (`GetSummary`, `EvaluateRange`, `PendingItems`) dan `leave.Contract` (`GetRangeSummary`).
- Bila modul **tidak ada di plan** tenant, variabelnya = 0 atau input manual.
- Bila modul **ada di plan** tetapi datanya belum siap/gagal dibaca, run ditolak (lihat §1.3).
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
