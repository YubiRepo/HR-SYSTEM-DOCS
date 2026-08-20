# 02 · Lifecycle

## 1. Provisioning Tenant

Membuat tenant baru = melahirkan "wadah" pelanggan. Langkah saat provisioning:

1. Buat record **tenant** (nama, slug/subdomain, status awal).
2. Buat **cabang default** (tenancy 2-level selalu punya minimal 1 cabang).
3. Tetapkan **subscription** awal (plan + trial bila ada).
4. Buat akun **tenant admin** pertama (via modul Auth) & kirim undangan.
5. Seed peran sistem tenant (via modul RBAC).
6. Hitung **entitlement** awal dari plan.

```
POST /platform/tenants
   ├─ tenant dibuat (status: trial/active)
   ├─ cabang default dibuat
   ├─ subscription dibuat (plan terpilih)
   ├─ akun tenant_admin diundang (Auth)
   ├─ peran sistem di-seed (RBAC)
   └─ entitlement dihitung
```

---

## 2. Identitas Tenant

| Atribut | Fungsi |
|---|---|
| `id` | ID internal (`tenant_...`) |
| `slug` | Nama unik URL-friendly (mis. `acme`) → dasar subdomain `acme.hrms.com` |
| `name` | Nama perusahaan tampil |
| `status` | Status lifecycle (lihat bawah) |

Slug dipakai untuk resolusi tenant saat login (subdomain), sesuai Tenancy Model.

---

## 3. Branch (Cabang)

- Setiap tenant punya **minimal satu cabang** (default dibuat saat provisioning).
- Cabang adalah unit di dalam tenant untuk memisahkan payroll, approval, laporan per lokasi.
- Cabang **bukan** batas billing — billing tetap per tenant.

| Atribut | Fungsi |
|---|---|
| `id` | `branch_...` |
| `tenant_id` | Induk tenant |
| `name` | Nama cabang (mis. "Jakarta") |
| `is_default` | Cabang bawaan |
| `is_active` | Status |

> Struktur organisasi (divisi/departemen) berada **di dalam** cabang — itu ranah Core HR, bukan sini.

---

## 4. Tenant Lifecycle

| Status | Arti | Akses tenant |
|---|---|---|
| `trial` | Masa uji coba | Penuh sesuai plan trial |
| `active` | Langganan berjalan | Penuh sesuai plan |
| `past_due` | Pembayaran terlambat | Penuh dengan peringatan (grace period) |
| `suspended` | Ditangguhkan (nunggak/permintaan) | Login diblok / read-only |
| `expired` | Trial habis tanpa lanjut | Diblok, data ditahan sementara |
| `terminated` | Berhenti permanen | Data diarsipkan → dihapus sesuai retensi |

### Transisi utama
| Dari | Ke | Pemicu |
|---|---|---|
| `trial` | `active` | Pembayaran pertama |
| `trial` | `expired` | Masa trial habis tanpa bayar |
| `active` | `past_due` | Invoice gagal dibayar |
| `past_due` | `active` | Pembayaran berhasil |
| `past_due` | `suspended` | Grace period habis |
| `suspended` | `active` | Pelunasan |
| `suspended`/`expired` | `terminated` | Tidak diselesaikan dalam batas waktu |

---

## 5. Suspend & Reaktivasi

- **Suspend** memblokir akses tenant tetapi **tidak menghapus data** (grace demi pemulihan & kepatuhan).
- Saat suspended: opsi read-only atau blok total (konfigurabel).
- **Reaktivasi** mengembalikan akses penuh setelah masalah (mis. pembayaran) selesai.

---

## 6. Termination & Retensi Data

Saat tenant `terminated`:
1. Akses dicabut total (semua akun tenant dinonaktifkan via Auth).
2. Data diarsipkan (tidak langsung dihapus).
3. Setelah periode retensi (mis. 30–90 hari, sesuai kebijakan & UU PDP), data dapat diekspor untuk pelanggan lalu dihapus permanen.

> Sediakan **ekspor data** sebelum penghapusan sebagai kewajiban & goodwill.

---

## 7. Migrasi Data Awal

Untuk onboarding tenant besar, sediakan jalur impor massal (karyawan, struktur) — dieksekusi lewat modul Core HR (`/employees/import`), dipicu setelah tenant aktif.
