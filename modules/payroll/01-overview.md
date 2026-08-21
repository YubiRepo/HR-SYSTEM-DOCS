# 01 · Overview

## 1. Tujuan

Modul Payroll menjawab satu pertanyaan inti: **berapa uang yang benar-benar diterima tiap karyawan setiap periode, dan dari mana angka itu berasal.** Ia merangkai komponen gaji, memotong iuran & pajak sesuai aturan, lalu menghasilkan slip gaji & instruksi pembayaran.

---

## 2. Rumus Besar

```
GAJI KOTOR (gross)  = gaji pokok + tunjangan + lembur + bonus
POTONGAN            = iuran BPJS (karyawan) + PPh 21 + potongan lain
GAJI BERSIH (net)   = gaji kotor − potongan          ← yang ditransfer
```

Kerumitan payroll ada pada menghitung **potongan** secara benar (BPJS & PPh 21 diatur pemerintah) dan pada menjaga **proses** tetap aman (review, approval, penguncian).

---

## 3. Konsep Inti

| Konsep | Penjelasan |
|---|---|
| **Pay Component** | Satu baris di slip gaji (earning/deduction) yang dapat dikonfigurasi |
| **Payroll Run** | Satu siklus gajian untuk satu periode (mis. "Gaji Januari 2026") |
| **Payslip** | Rincian gaji satu karyawan dalam satu run |
| **PPh 21** | Pajak penghasilan; dipotong perusahaan lalu disetor ke negara |
| **BPJS** | Iuran jaminan sosial (Kesehatan + Ketenagakerjaan) |
| **PTKP / TER** | Dasar & tarif perhitungan PPh 21 |
| **Off-cycle Run** | Pembayaran di luar jadwal (THR, bonus, pesangon) |

---

## 4. Aktor

| Aktor | Peran |
|---|---|
| **Payroll Officer** (maker) | Menyiapkan & menghitung run |
| **Finance/HR Manager** (checker) | Meninjau & menyetujui run |
| **Karyawan** | Menerima & melihat slip gaji sendiri |
| **Tenant Admin** | Mengonfigurasi komponen gaji & aturan |

> Maker ≠ checker — pemisahan peran mencegah kesalahan/kecurangan (via RBAC).

---

## 5. Relasi dengan Modul Lain

| Modul | Hubungan |
|---|---|
| **Core HR** | Sumber data karyawan aktif, gaji pokok, status PTKP, cabang |
| **Attendance & Leave** | Sumber lembur & potongan absen (bila modul aktif) |
| **Entitlement** | Gerbang: tenant harus punya fitur `payroll` |
| **RBAC** | Izin `payroll:run`, `payroll:approve`, dll |
| **Billing** | Menyediakan jumlah karyawan aktif (seat count PEPM) |
| **Notification** | Mengirim slip gaji ke karyawan |
| **Integrasi eksternal** | File/April transfer bank; ekspor lapor pajak |

---

## 6. Alur Ringkas

```
kumpulkan data → hitung (kotor→BPJS→PPh21→bersih)
   → review → approve → bayar (slip + transfer) → tutup
   → setor & lapor (PPh21 & BPJS)
```
Detail perhitungan di `03-calculation.md`; detail run di `04-payroll-run.md`.

---

## 7. Batasan & Asumsi

- Mengikuti Tenancy 2-level: payroll dihitung per karyawan, dapat dikelompokkan per cabang (`branch_id`).
- Tarif pajak/BPJS & plafon adalah **data konfigurasi** (berubah tiap tahun).
- Payroll adalah fitur premium — akses dijaga Entitlement (plan Pro ke atas).
- Modul tidak melakukan transfer bank atau lapor pajak secara langsung; ia menghasilkan data/berkas untuk itu.
