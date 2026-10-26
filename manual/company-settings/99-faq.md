# 99 · FAQ & Troubleshooting — Company Settings

## Umum

**Tombol "Edit Info Perusahaan" / "Tambah Cabang" / "Add Code" tidak muncul atau
penyimpanan ditolak.**
Akun Anda tidak punya izin yang diperlukan (`settings:write`, `branch:write`).
Minta admin utama (peran `tenant_admin`) menambahkan izinnya.

**Tab "Activity" tidak ada.**
Log aktivitas belum tersedia dan tab-nya sedang dinonaktifkan.

**Jam telat/lembur karyawan cabang terasa salah 1–2 jam.**
Periksa zona waktu cabang di tab **Branches**. Bila *Default*, cabang mengikuti
**Zona Waktu Default Perusahaan** di tab **Overview** (Edit Info Perusahaan).

## Cabang

**Cabang default tidak bisa ditutup.**
Memang demikian — cabang default adalah cabang utama perusahaan.

**Cabang yang sudah ditutup bisa dibuka lagi?**
Tidak. Menutup cabang bersifat permanen; buat cabang baru bila diperlukan.

## Common Codes

**Salah ketik kode, bagaimana mengubahnya?**
Kode tidak bisa diubah karena tersimpan di data. Nonaktifkan kode tersebut
(**⋯ → Deactivate code**) lalu buat kode baru dengan **Add Code**.

**Kategori PTKP / TER / BPJS tidak ada.**
Nilai-nilai tersebut ditetapkan regulasi sehingga tidak dikelola per perusahaan.

## Billing

**Tombol "Ubah Paket" tidak muncul.**
Butuh izin `entitlement:manage` (dimiliki `tenant_admin`).

**Muncul peringatan "Read-only: subscription lapsed".**
Langganan lewat jatuh tempo. Data tetap bisa dilihat, tetapi perubahan diblokir.
Bayar invoice berstatus **Open** lewat **⋯ → Bayar (Kirim Bukti)**.

**Bukti pembayaran sudah dikirim tapi invoice belum Paid.**
Pembayaran manual berstatus **Pending** sampai diverifikasi tim billing. Cek
kolom **Catatan Review** di **Riwayat Pembayaran Saya**.

## Pengguna & Peran

**Password sementara hilang sebelum disalin.**
Gunakan **⋯ → Reset Password** pada user tersebut, lalu salin password baru.

**Muncul "Peran ini membutuhkan cabang (branch) tertentu".**
Peran yang dipilih punya izin bercakupan cabang. Pilih cabang pada field
**Cabang (wajib)**.

**User sudah diberi peran tapi tetap tidak bisa membuka menu tertentu.**
Buka **⋯ → Inspeksi Izin Efektif (Union)** untuk melihat izin yang benar-benar
dimiliki user. Periksa juga apakah izinnya dibatasi ke cabang lain.

**Status "Locked" kembali menjadi "Active" setelah refresh.**
Fitur kunci akun saat ini baru mengubah tampilan dan belum tersimpan.

**Peran tidak bisa diedit atau dihapus.**
Peran bertipe **Sistem** dilindungi. Buat peran **Kustom** bila butuh variasi.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/settings/**` |
| Gate/permission | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue`, `app/composables/usePermissions.ts` |
| Modul | `modules/rbac/02-roles.md`, `modules/platform/**` |
