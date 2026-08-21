# 07 · Integration

Attendance mengonsumsi data Core HR dan menyediakan rekap ke Payroll & status ke Leave.

---

## 1. Dengan Core HR

| Data | Guna |
|---|---|
| Karyawan aktif & cabang | Siapa yang dijadwal & dicatat |
| Reporting line (manager) | Rute approval koreksi & lembur |
| Status karyawan | Hanya karyawan aktif yang dijadwalkan |

---

## 2. Dengan Payroll (konsumen utama)

Attendance menyediakan **variabel** yang dipakai formula Payroll.

```
Payroll: calculate run
   └─ GET /attendance/summary?period=..&employee=..
        → work_days, present_days, overtime_hours,
          late_minutes, absent_days, leave_days
```

Pemetaan ke komponen Payroll:
| Rekap Attendance | Komponen Payroll |
|---|---|
| `overtime_hours` + multiplier | `OVERTIME` (formula) |
| `absent_days` | potongan alpha (deduction) |
| `late_minutes` / `late_count` | potongan telat (bila aturan aktif) |
| `present_days` | tunjangan harian (mis. transport/makan) |

> Attendance hanya mengirim **angka & jam**; perhitungan uang dilakukan Payroll (memakai formula & tarif).

---

## 3. Dengan Leave

Hubungan dua arah ringan:
- **Leave → Attendance:** hari cuti yang disetujui menandai status harian `on_leave` (mencegah alpha).
- **Attendance → Leave:** data kehadiran dapat memvalidasi pengajuan (mis. sakit dengan bukti).

Kontrak: Attendance menanyakan cuti aktif per karyawan/tanggal ke modul Leave sebelum menetapkan status harian.

---

## 4. Gerbang Entitlement & RBAC

```
request → Entitlement: tenant punya fitur "attendance"?
        → RBAC: izin (attendance:self / read / write / approve)?
        → scope: karyawan (self), manajer (team), branch admin (branch)
```

Attendance bisa berada di plan lebih rendah daripada Payroll (mis. Starter), sehingga tenant bisa memakai absensi tanpa payroll. Bila keduanya aktif, datanya tersambung.

---

## 5. Dengan Notification (titik picu)

- Pengingat clock-in/out.
- Permintaan approval koreksi/lembur ke manajer.
- Peringatan pola (mis. sering telat).

> Sampai modul Notification ada, titik-titik ini disiapkan sebagai event.

---

## 6. Integrasi Mesin Absensi (eksternal)

Untuk tenant yang memakai mesin fingerprint/wajah, data masuk via integrasi:
- Mesin push ke endpoint, atau sistem tarik berkala.
- Data dipetakan ke `attendance_records` (source `machine`).
- Detail protokol per vendor = bahasan integrasi eksternal.
