# 01 · Overview

## 1. Tujuan

Modul Leave menjawab: **berapa hak cuti tiap karyawan, berapa sisanya, bagaimana mengajukan & menyetujui, dan apa dampaknya** ke kehadiran & gaji. Ia mengelola hak (entitlement) cuti — berbeda dari Attendance yang mencatat kehadiran harian.

---

## 2. Konsep Inti

| Konsep | Penjelasan |
|---|---|
| **Leave type** | Jenis cuti (tahunan, sakit, melahirkan, dll) — preset + custom |
| **Balance** | Saldo per jenis per karyawan: jatah, terpakai, sisa |
| **Accrual** | Cara saldo bertambah (sekaligus di awal, atau per bulan) |
| **Carry-over** | Sisa cuti dibawa ke tahun depan atau hangus |
| **Leave request** | Pengajuan cuti oleh karyawan |
| **Approval flow** | Alur persetujuan (configurable per jenis) |

---

## 3. Aktor

| Aktor | Peran |
|---|---|
| **Karyawan** | Ajukan cuti, lihat saldo & riwayat sendiri |
| **Manajer** | Setujui/tolak cuti tim (via reporting line) |
| **HR / Admin** | Kelola jenis cuti, saldo, aturan; approval level lanjut |
| **Sistem** | Hitung saldo, akrual, carry-over otomatis |

---

## 4. Relasi dengan Modul Lain

| Modul | Hubungan |
|---|---|
| **Core HR** | Data karyawan, reporting line (rute approval), status `on_leave` |
| **Attendance** | Hari cuti disetujui → status `on_leave` (bukan alpha) |
| **Payroll** | Cuti tak berbayar (unpaid) → potongan gaji; cuti berbayar → tidak |
| **Entitlement/RBAC** | Gerbang fitur & scope (self/branch) |
| **Notification** | Pengingat approval, notifikasi status cuti (saat modul ada) |

---

## 5. Alur Ringkas

```
karyawan ajukan cuti → cek saldo cukup?
   → approval (sesuai alur jenis cuti)
   → disetujui → saldo berkurang
   → Attendance ditandai on_leave (hari itu bukan alpha)
   → bila unpaid → Payroll potong gaji
```

---

## 6. Paid vs Unpaid (kaitan Payroll)

| Kategori | Contoh | Dampak gaji |
|---|---|---|
| **Cuti berbayar** | Tahunan, sakit, melahirkan, cuti khusus | Gaji tetap (pokok + tunjangan tetap); tunjangan kehadiran (transport/makan) tidak diberikan karena tak hadir |
| **Cuti tak berbayar** | Unpaid leave (jatah habis / keperluan pribadi) | Gaji dipotong sesuai hari (no work no pay) |

> Detail pemetaan ke komponen gaji di `07-integration.md`.

---

## 7. Batasan & Asumsi

- Saldo & aturan cuti = data konfigurasi per tenant (boleh > minimum UU).
- Approval memakai reporting line dari Core HR.
- Leave tidak mencatat absensi harian (itu Attendance) — hanya hak & pengajuan.
- Scope per cabang & self mengikuti Tenancy 2-level + RBAC.
