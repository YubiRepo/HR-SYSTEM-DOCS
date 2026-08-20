# 01 · Overview

## 1. Tujuan

Admin Console adalah "ruang kendali" operasional Yubiteck. Ia tidak mendefinisikan aturan bisnis (itu tugas Tenant/Billing/Entitlement) — ia **memantau** kesehatan platform, **membantu** pelanggan (support), dan **mencatat** semua aksi.

---

## 2. Aktor

| Aktor | Peran |
|---|---|
| **Platform Super Admin** | Akses penuh, audit, aksi kritikal |
| **Support Agent** | Tenant inspector, impersonation (terbatas) |
| **Platform Viewer** | Read-only monitoring/analitik |

---

## 3. Konsep

| Konsep | Penjelasan |
|---|---|
| **Metric** | Angka agregat lintas tenant (tenant aktif, MRR, konversi) |
| **Health** | Status operasional sistem (uptime, error, job) |
| **Impersonation** | Sesi dukungan "sebagai tenant", time-boxed & teraudit |
| **Audit log** | Jejak semua aksi backoffice |

---

## 4. Relasi dengan Modul Lain

| Modul | Hubungan |
|---|---|
| **Tenant** | Baca status & detail tenant untuk inspector |
| **Billing** | Baca subscription/invoice untuk metrik & support |
| **Entitlement** | Baca usage vs limit untuk peringatan |
| **Auth** | Menerbitkan token impersonation (klaim `act_as`) |

---

## 5. Prinsip
- Membaca & mengoperasikan, bukan mendefinisikan.
- Impersonation & audit adalah fitur paling sensitif → dijaga ketat.
- Dashboard menampilkan data agregat/aman, bukan data pribadi karyawan.
