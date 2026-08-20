# 01 · Overview

## 1. Tujuan

Modul Tenant melahirkan & mengelola "wadah" pelanggan. Setiap perusahaan yang berlangganan HRMS adalah satu tenant. Modul ini yang membuat tenant, mengelola cabangnya, dan mengatur status hidupnya.

---

## 2. Konsep

| Konsep | Penjelasan |
|---|---|
| **Tenant** | Organisasi pelanggan (perusahaan) — unit isolasi & billing |
| **Branch** | Cabang di dalam tenant (tenancy 2-level) |
| **Slug** | Nama unik URL-friendly → dasar subdomain (`acme.hrms.com`) |
| **Lifecycle** | Status hidup tenant (trial, active, suspended, dst) |

---

## 3. Aktor

| Aktor | Peran |
|---|---|
| **Platform Super Admin** | Provisioning, suspend, terminate tenant |
| **Support Agent** | Lihat tenant, bantu (via Admin Console) |

Semua aktor adalah admin platform Yubiteck (bukan pengguna tenant).

---

## 4. Relasi dengan Modul Lain

| Modul | Hubungan |
|---|---|
| **Auth** | Membuat akun tenant admin pertama saat provisioning |
| **RBAC** | Seed peran sistem tenant saat provisioning |
| **Billing** | Membuat subscription awal (plan + trial) |
| **Entitlement** | Menghitung entitlement awal dari plan |
| **Core HR** | Data karyawan hidup di dalam tenant & cabang yang dibuat di sini |

---

## 5. Batasan
- Mengikuti Tenancy Model final: **2 level (Tenant → Cabang), shared DB**.
- Billing per tenant (1 perusahaan = 1 tagihan) — detail di Billing.
- Setiap tenant punya minimal satu cabang (default).
