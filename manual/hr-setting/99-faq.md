# 99 · FAQ & Troubleshooting — HR Setting

## Umum

**Sub-menu tertentu (mis. Working Time atau Salary Component) tidak muncul.**
Sub-halaman hanya tampil bila fiturnya termasuk paket langganan **dan** Anda
punya izinnya. Lihat tabel *Syarat Tampil Sub-Halaman* di
[`README.md`](./README.md) dan cek paket di **Company Settings → Billing**.

**Tombol Edit terlihat, tapi saat disimpan muncul pesan gagal.**
Di beberapa halaman (Working Time, Holiday & Leave Calendar, Attendance Rules,
Leave Types, Salary Component) tombol ubah tetap tampil walau akun Anda hanya
punya izin melihat. Penyimpanan baru ditolak saat dikirim. Minta admin
menambahkan izin konfigurasi yang sesuai.

**Pencarian tidak menemukan data yang jelas ada.**
Di beberapa tabel pencarian hanya mencocokkan **kode** (Leave Types, Salary
Component) atau hanya data di halaman tabel yang sedang tampil (Working Time,
Holiday & Leave Calendar). Coba cari dengan kode, atau pindah halaman tabel.

## Organisasi & Posisi

**Unit/posisi tidak bisa dipilih saat menambah karyawan.**
Pastikan unit dan posisinya berstatus **Active**, dan posisi berada di unit yang
dipilih.

**Menekan tombol simpan tidak terjadi apa-apa.**
Ada field wajib yang belum diisi; form tidak menampilkan pesan. Periksa kembali
semua field bertanda wajib.

**Posisi yang sudah dinonaktifkan tidak bisa diaktifkan lagi.**
Halaman Positions belum menyediakan aksi aktifkan kembali.

## Jam Kerja & Kalender

**Hari libur hasil Import from National Calendar menampilkan pengali lembur 0x.**
Libur hasil impor belum punya pengali lembur. Buka **Edit** pada libur tersebut,
isi pengali yang benar, lalu simpan.

**Jam telat karyawan cabang terasa salah 1–2 jam.**
Periksa zona waktu cabang di **Company Settings → Branches**; kebijakan absensi
memakai jam cabang tersebut.

## Payroll & Custom Fields

**Custom field yang dinonaktifkan tidak bisa diaktifkan lagi.**
Halaman Custom Fields belum menyediakan aksi aktifkan kembali; buat field baru
bila diperlukan.

**Isian Section pada custom field tidak mengelompokkan field di form karyawan.**
Saat ini Section hanya tersimpan sebagai informasi dan belum dipakai untuk
pengelompokan.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/**` |
| Gate/permission | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
