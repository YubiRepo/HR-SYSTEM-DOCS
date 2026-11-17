<!-- 📁 integrations/jewelry/02-company-branch-user.md -->
# 02 — Company, Branch, dan User

## Proyeksi

Tabel `tenants`, `branches`, `users` di HR tetap ada dan tetap direferensikan seluruh modul, tetapi isinya **proyeksi** data Jewelry (id sama). Kolom `external_synced_at` mencatat kapan baris terakhir disinkron.

| Data | Milik Jewelry (read-only di HR) | Milik HR |
|---|---|---|
| Company → `tenants` | nama, status | timezone, profil perusahaan HR (direktur, NPWP, alamat, …), `hr_bootstrapped_at` |
| Branch → `branches` | nama, status aktif | timezone, `is_default` |
| User → `users` | nama, email, status | avatar HR |

## Kapan diproyeksikan

1. **JIT (request pertama).** Hook `idpsync` di `PrincipalMiddleware` memastikan company aktif, branch-nya, dan user ada di HR. Data dianggap segar 1 jam; ada memo in-process 5 menit agar tidak memanggil Jewelry tiap request.
2. **Sync periodik.** Worker menjalankan `idpsync` setiap 15 menit (`*/15 * * * *`), incremental berdasarkan `updated_since` dengan kursor di tabel `idp_sync_state`. Perubahan nama/status di Jewelry ikut masuk.

## Bootstrap tenant

Saat company pertama kali terlihat (JIT atau sync), `BootstrapTenantUseCase` berjalan **idempotent**:
- memilih cabang default = cabang aktif tertua (bila belum ada);
- seed default cuti (tipe & alur persetujuan), payroll (komponen & tarif BPJS), dan common code;
- menandai baseline backfill; lalu mengisi `hr_bootstrapped_at`.

Bila salah satu seeder gagal, tenant tidak ditandai selesai dan dicoba lagi pada sync berikutnya.

## Cabang

`/api/v1/branches` hanya membaca dan mengubah `timezone` serta `is_default`. Tambah, ganti nama, dan tutup cabang dilakukan di backoffice Jewelry.

## Akun karyawan

| Aksi di HR | Yang terjadi di Jewelry |
|---|---|
| Buat karyawan dengan *create account* | Service API membuat user (email wajib) di tenant company, assign role HR `employee` pada company; HR menampilkan password sementara sekali |
| Tautkan ke akun yang ada | Assign role `employee`; akun lama tidak berubah |
| Offboarding (cabut akses) | Status/role akun dicabut lewat service API |
| Kirim reset password (tab Account karyawan) | Jewelry mengirim email reset |

Karyawan tanpa email tidak bisa dibuatkan akun (login Jewelry berbasis email).

## Direktori akun (read-only)

`GET /api/v1/auth/users` dan `GET /api/v1/auth/users/:id` menampilkan akun company dari service API Jewelry — dipakai picker approver di Approval Policies dan tab Account karyawan. Daftar ini belum membawa role user, sehingga filter peran di approval policy belum menyaring.
