# 01 · Overview

## 1. Tujuan

Modul Billing mengurus semua yang berkaitan dengan **uang & paket**: mendefinisikan Plan, mengikat tenant ke plan lewat subscription, menagih via invoice, dan menyediakan definisi Feature/Limit yang nantinya dihitung Entitlement.

---

## 2. Konsep

| Konsep | Penjelasan |
|---|---|
| **Feature** | Kemampuan on/off (mis. `payroll`, `sso`) |
| **Limit** | Batas kapasitas (global/per-fitur) |
| **Plan** | Rakitan Feature + Limit + harga |
| **Subscription** | Ikatan tenant ↔ plan pada periode |
| **Invoice** | Tagihan satu periode |
| **Payment** | Pembayaran atas invoice |
| **Override** | Penyesuaian Feature/Limit khusus tenant |

---

## 3. Aktor

| Aktor | Peran |
|---|---|
| **Super Admin** | Kelola plan, feature, override |
| **Billing Admin** | Kelola subscription, invoice, refund |

---

## 4. Relasi dengan Modul Lain

| Modul | Hubungan |
|---|---|
| **Tenant** | Subjek langganan; provisioning membuat subscription awal |
| **Entitlement** | Membaca Plan/Feature/Limit & override untuk hitung efektif |
| **Core HR** | Sumber `seat_count` (jumlah karyawan aktif) untuk PEPM |
| **Eksternal** | Payment gateway untuk penagihan |

---

## 5. Prinsip
- **Configurable** — Plan adalah data, dikelola tanpa deploy.
- **Billing per tenant** — 1 perusahaan = 1 tagihan (selaras Tenancy Model).
- **PEPM sebagai basis** — harga mengikuti jumlah karyawan aktif.
- **Auditable** — perubahan plan, refund, override tercatat.
