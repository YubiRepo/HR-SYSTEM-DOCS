# 99 · FAQ & Troubleshooting — Employees

## Umum

**Tombol "Tambah Karyawan" atau "Simpan" tidak muncul.**
Periksa permission `employees:write`. Tombol tersembunyi bila akun Anda tidak
punya hak tulis.

**Menu "Mutasi" tidak tampil di sidebar.**
Menu Mutasi mengikuti gate `core_hr:write` / `org:write`. Hubungi admin bila
Anda membutuhkannya.

**Karyawan yang dicari tidak muncul di daftar.**
Daftar memuat maksimal 100 karyawan. Gunakan kolom pencarian atau filter
**All branches**. Bila tetap tidak ada, karyawan mungkin sudah
diarsipkan.

**Muncul pesan "Incomplete Form" saat menyimpan karyawan.**
Field wajib belum lengkap: **Full Name**, **NIK**, **Work Email**,
**Org Unit**, **Position**, dan **Hire Date**. Field yang kosong ditandai
*Required*.

**Field "Direct Manager" tidak ada di form.**
Untuk sementara field ini disembunyikan dari form tambah dan detail karyawan.

**Tab "Career History" / "Documents Vault" tidak ada lagi.**
Kedua tab tersebut saat ini tidak ditampilkan di halaman detail. Dokumen kontrak
tetap bisa dikelola lewat **Contracts → ⋮ → Manage Documents**.

## Akun Login

**Password sementara hilang sebelum saya salin.**
Password hanya tampil sekali. Buka tab **Account Settings** lalu klik **Reset
Password** (perlu `users:write`), kemudian salin password baru.

**"Link Existing Account" tidak menampilkan pilihan.**
Dropdown hanya berisi akun yang **belum** tertaut ke karyawan lain. Bila kosong,
berarti semua akun sudah dipakai — buat akun baru lewat **Create New Account**.

**Tab "Account Settings" tidak muncul.**
Tab ini hanya tampil bila karyawan sudah punya akun login (`userId` terisi).
Buat atau tautkan akun terlebih dahulu lewat menu **Actions**.

## Kepegawaian

**"Employment Type" di ringkasan profil kosong.**
Tipe kepegawaian diambil dari kontrak aktif. Buat kontrak di tab **Contracts**
([`04-kontrak-kerja.md`](./04-kontrak-kerja.md)) atau isi bagian **Contract**
saat menambah karyawan.

**Pilihan "Contract Type" tidak sesuai kebutuhan.**
Daftar tipe kontrak diambil dari master common code kategori `contract_type`.
Minta admin menambah/mengubah kode di master tersebut.

**"Change lifecycle status" tidak aktif.**
Target status harus valid dari status saat ini. Contoh: dari `Probation` hanya
bisa ke `Active` atau `Terminated`; dari `Resigned` hanya ke `Offboarded`.

**Kenapa unit/posisi tidak bisa diedit di tab Profile?**
Penempatan di kartu ringkasan sengaja read-only. Perubahan unit/posisi harus lewat **Actions
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

## Import Excel

**Tombol "Import Excel" tidak ada.**
Fitur ini masih **rencana** dan belum tersedia di aplikasi. Lihat spesifikasi di
[`08-import-karyawan.md`](./08-import-karyawan.md).

**Banyak baris error "Org unit not found" / "is not a position in".**
Nama unit/posisi harus sama persis dengan data di HR Setting. Salin nilainya
dari sheet **Reference** di template, dan buat dulu unit/posisi yang belum ada.

**Sebagian baris berhasil, sebagian dilewati — apakah harus mengulang semua?**
Tidak. Baris yang berhasil sudah tersimpan. Unduh **Download Skipped Rows**,
perbaiki, lalu impor ulang file itu saja.

**Karyawan hasil impor belum menerima email undangan.**
Undangan sengaja ditahan secara default. Klik **Send Invitations** di layar hasil
impor setelah data final.

## Work Policy

**Tab "Work Policy" tidak muncul.**
Fitur ini masih **rencana** dan belum tersedia di aplikasi. Lihat spesifikasi di
[`07-work-policy.md`](./07-work-policy.md).

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
