# 02 · Lifecycle

## 1. Provisioning Tenant

Membuat tenant baru = melahirkan "wadah" pelanggan. Langkah saat provisioning:

1. Buat record **tenant** (nama, slug/subdomain, status awal).
2. Buat **cabang default** (tenancy 2-level selalu punya minimal 1 cabang).
3. Tetapkan **subscription** awal (plan + trial bila ada).
4. Buat akun **tenant admin** pertama (via modul Auth) & kirim undangan.
5. Seed peran sistem tenant (via modul RBAC).
6. Hitung **entitlement** awal dari plan.
7. Seed **data awal modul** (best-effort; kegagalan satu modul tidak menggagalkan provisioning): Leave (jenis cuti + policy approval cuti), Payroll (BPJS, PPh 21, PTKP, TER, jadwal payroll bulanan (periode tgl 25 bulan lalu s/d 24, cutoff absensi tgl 20, gajian hari kerja terakhir; **periode tidak di-generate** — HR generate sendiri), komponen sistem, komponen **Basic Salary** + struktur **Standard Monthly**), common codes, lalu **HR setting defaults** (§1.1).

### 1.1 HR setting defaults

Didaftarkan lewat `platform.Module.AddTenantDefaultsSeeder` (urut), setelah common codes. Setiap seeder **hanya mengisi area yang masih kosong** untuk tenant — tidak pernah mengubah data yang sudah ada.

| Modul | Yang di-seed | Syarat (area kosong) |
|---|---|---|
| Core HR | Org unit root **Head Office** (`company`); posisi **Staff** (20), **Supervisor** (5), **Manager** (2) di unit root; job grade **L1** Level 1, **L2** Level 2, **L3** Level 3 (rank 1–3) | belum ada org unit / posisi / job grade |
| Attendance | OT code `OT1` (1.5x), `OT2` (2x), `OT3` (3x), `OT4` (4x); overtime rule **STANDARD** (PP 35/2021, 5 hari kerja: hari kerja 1.5x jam pertama lalu 2x; hari libur/istirahat 2x s/d 8 jam, 3x jam ke-9, 4x selanjutnya; tanpa dokumen/melebihi window → `needs_review`); shift **REG** 08:00–17:00 (istirahat makan 12:00–13:00, 8 jam, toleransi telat 15 menit; lembur dihitung sejak jam pulang (threshold 0), pembulatan 30 menit, toleransi 0); pola kerja **Regular (Mon–Fri)** dengan shift & OT rule tsb.; attendance rule default tenant (lembur perlu approval, tanpa geofence/auto clock-out) | belum ada overtime rule / shift / pola kerja / rule default; OT code per kode; pola hanya bila shift-nya di-seed di run yang sama |
| Approval | Policy default (1 step atasan langsung, `any_approver` bila tidak ditemukan) untuk **setiap** document type | belum ada policy apa pun untuk document type tsb. |

Tenant lama: backfill `20261126090000_seed_hr_setting_defaults_for_tenant` menjalankan seeder yang sama (Core HR, Attendance, Payroll, Approval) dengan aturan yang sama — konflik = lewati.

```
POST /platform/tenants
   ├─ tenant dibuat (status: trial/active)
   ├─ cabang default dibuat
   ├─ subscription dibuat (plan terpilih)
   ├─ akun tenant_admin diundang (Auth)
   ├─ peran sistem di-seed (RBAC)
   ├─ entitlement dihitung
   └─ data awal modul di-seed (leave, payroll, common codes, HR setting defaults)
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
- Cabang adalah unit di dalam tenant untuk memisahkan payroll, approval, absensi, laporan per lokasi.
- Cabang **bukan** batas billing — billing tetap per tenant.

### 3.1 Siapa yang Mengelola

| Aktor | Kewenangan cabang |
|---|---|
| **Tenant admin** (orang perusahaan, mis. PT A) | Buat, ubah, nonaktifkan, tutup cabang perusahaannya |
| **Branch admin** | Hanya melihat/kelola operasional cabangnya (tidak membuat cabang baru) |
| **Platform admin** (Yubiteck) | Tidak mengelola isi cabang; hanya menyediakan fitur & membatasi jumlah via limit plan |

> **Penting:** manajemen cabang adalah urusan **tenant** (self-service), bukan Yubiteck. Yubiteck hanya membatasi jumlah cabang lewat limit `max_branches` (Entitlement). Definisi entitas ada di modul ini; hak akses dijaga RBAC.

### 3.2 Atribut Cabang

| Atribut | Fungsi |
|---|---|
| `id` / `tenant_id` | Identitas & induk |
| `code` | Kode cabang (mis. `JKT-01`), unik per tenant |
| `name` | Nama cabang |
| `address`, `city`, `province`, `postal_code`, `country` | Lokasi |
| `timezone` | Zona waktu (WIB/WITA/WIT) — dipakai absensi & jadwal |
| `lat` / `lng` | Koordinat — pusat geofence Attendance |
| `phone`, `pic_employee_id` | Kontak & penanggung jawab |
| `is_default` | Cabang bawaan |
| `status` | `active` / `inactive` / `closed` |

### 3.3 Lifecycle Cabang

```
(buat) → ACTIVE → (INACTIVE sementara) → CLOSED
```
| Status | Arti |
|---|---|
| `active` | Beroperasi normal |
| `inactive` | Ditutup sementara (mis. renovasi) — data tetap, tak menerima operasional baru |
| `closed` | Ditutup permanen |

**Batasan penting saat menutup/menonaktifkan:**
- Cabang **default tidak bisa** ditutup/dihapus (tenant harus punya ≥1 cabang aktif).
- Cabang yang **masih berisi karyawan aktif** tidak bisa langsung ditutup — karyawan harus dipindah dulu (mutasi antar cabang di Core HR) atau di-offboard.
- Menutup cabang tidak menghapus data historis (payroll, absensi lampau tetap untuk audit).

**Membuat cabang baru:**
```
tenant admin buat cabang
   → cek limit max_branches (Entitlement)
        ├─ masih ada kuota → cabang dibuat (status active)
        └─ kuota habis → ditolak, tawarkan upgrade plan
```

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
| `trial` | `active` | Trial berakhir: dikonversi ke plan pilihan, turun ke plan default, atau plan diubah dengan trial diakhiri. Tenant tanpa trial langsung `active` saat provisioning |
| `trial` | `expired` | Trial habis tanpa konfirmasi plan **dan** tidak ada plan default aktif (bila ada plan default, tenant turun ke sana dan menjadi `active`) |
| `expired` | `active` | Plan dipilih (staff/self-service), atau plan default diset lalu job trial-expiry berikutnya |
| `active` | `past_due` | Invoice gagal dibayar |
| `past_due` | `active` | Pembayaran berhasil |
| `past_due` | `suspended` | Grace period habis |
| `suspended` | `active` | Pelunasan — otomatis hanya untuk suspend `nonpayment` setelah tidak ada lagi invoice lewat grace; suspend `manual` hanya oleh admin |
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
   Subscription dibatalkan (`canceled`) sehingga renewal berhenti menerbitkan invoice.
2. Data diarsipkan (tidak langsung dihapus).
3. Setelah periode retensi (`data_retention_days`, default 90 hari, sesuai kebijakan & UU PDP), data dapat diekspor untuk pelanggan lalu dihapus permanen.
   **Saat ini manual:** tidak ada job penghapusan otomatis. Admin platform meninjau sendiri tenant `terminated` yang masa retensinya sudah lewat, lalu melakukan ekspor & penghapusan secara manual.

> Sediakan **ekspor data** sebelum penghapusan sebagai kewajiban & goodwill.

---

## 7. Migrasi Data Awal

Untuk onboarding tenant besar, sediakan jalur impor massal (karyawan, struktur) — dieksekusi lewat modul Core HR (`/employees/import`), dipicu setelah tenant aktif.
