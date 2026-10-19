# 99 · FAQ & Troubleshooting — Employees

## Umum

**Tombol "Tambah Karyawan" atau "Simpan" tidak muncul.**
Periksa permission `employees:write`. Tombol tersembunyi bila akun Anda tidak
punya hak tulis.

**Menu "Mutasi" tidak tampil di sidebar.**
Menu Mutasi mengikuti gate `core_hr:write` / `org:write`. Hubungi admin bila
Anda membutuhkannya.

**Karyawan yang dicari tidak muncul di daftar.**
Daftar memuat maksimal 100 baris. Gunakan kolom pencarian atau filter
(Branch/Employment/Lifecycle). Bila tetap tidak ada, karyawan mungkin sudah
diarsipkan.

**Muncul pesan "Mohon Lengkapi Form" saat menyimpan karyawan.**
Field wajib belum lengkap: **Nama Lengkap**, **NIK/KTP**, **Email Kerja**,
**Unit Organisasi**, **Posisi/Jabatan**, dan **Tanggal Bergabung**.

## Akun Login

**Password sementara hilang sebelum saya salin.**
Password hanya tampil sekali. Gunakan **Actions → Reset Password** pada karyawan
yang sudah punya akun (perlu `users:write`), lalu salin password baru.

**"Link Existing Account" tidak menampilkan pilihan.**
Dropdown hanya berisi akun yang **belum** tertaut ke karyawan lain. Bila kosong,
berarti semua akun sudah dipakai — buat akun baru lewat **Create New Account**.

**Tab "Account Settings" tidak muncul.**
Tab ini hanya tampil bila karyawan sudah punya akun login (`userId` terisi).
Buat atau tautkan akun terlebih dahulu lewat menu **Actions**.

## Kepegawaian

**Kolom "Employment" menampilkan "Belum ada kontrak".**
Tipe kepegawaian diambil dari kontrak aktif. Buat kontrak di tab **Contracts**
([`04-kontrak-kerja.md`](./04-kontrak-kerja.md)).

**"Change lifecycle status" tidak aktif.**
Target status harus valid dari status saat ini. Contoh: dari `Probation` hanya
bisa ke `Active` atau `Terminated`; dari `Resigned` hanya ke `Offboarded`.

**Kenapa unit/posisi tidak bisa diedit di tab Profile?**
Field penempatan sengaja read-only. Perubahan unit/posisi harus lewat **Actions
→ Transfer or promotion** (langsung) atau **Mutasi** (butuh approval), agar
riwayat karier tetap utuh.

## Mutasi

**Tidak bisa mengedit atau menghapus baris di batch.**
Baris berstatus **Disetujui** bersifat kekal (immutable) dan harus dipertahankan
saat menyimpan perubahan.

**Karyawan tidak bisa ditambahkan dua kali dalam satu batch.**
Satu karyawan hanya boleh muncul sekali per batch. Muncul pesan *"Karyawan ini
sudah ditambahkan dalam pengajuan ini"*.

**Pesan "Pilih unit & posisi tujuan terlebih dahulu".**
Jenis **Promosi Jabatan** dan **Mutasi Unit / Posisi** wajib mengisi Unit dan
Posisi tujuan.

**Baris muncul sebagai "Gagal Diterapkan".**
Penyebab kegagalan ditampilkan pada baris tersebut. Gunakan **Revisi** untuk
memperbaiki lalu ajukan kembali.

**Perbedaan "Transfer or promotion" (Actions) dengan "Mutasi".**
Actions di detail karyawan **langsung diterapkan**; Mutasi **menunggu
persetujuan** dan bisa massal.

## Dokumen

**Unggah dokumen gagal.**
Format yang didukung: JPG, PNG, WEBP, dan PDF. Pastikan file tidak rusak dan
koneksi stabil, lalu ulangi.

## Sumber

| Jenis | Path |
|---|---|
| Gate/permission | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue`, `app/composables/usePermissions.ts` |
| Daftar & detail | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/**` |
| Mutasi | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/mutasi/**` |
| Aturan | `HR-SYSTEM-BACKOFFICE/CLAUDE.md` |
