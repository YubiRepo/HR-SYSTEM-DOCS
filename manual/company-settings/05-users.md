# 05 · Users (Pengguna)

Mengelola akun login di perusahaan: membuat akun, menetapkan satu atau lebih
peran beserta cakupan cabangnya, melihat izin efektif, dan reset password.

**Akses:** `/tenants/settings/users` (tab **Users**) · **Permission:**
`users:read` (lihat), `users:write` (buat akun, reset password),
`roles:assign` (tetapkan peran)

## Konsep

- **Satu pengguna bisa memegang beberapa peran.** Izin akhirnya adalah
  **gabungan** semua peran yang dipegang (disebut *izin efektif*).
- Sebagian peran perlu **cakupan**: cabang tertentu (**Branch**) atau tim
  tertentu (**Team**). Contoh: peran *HR Cabang* hanya berlaku di cabang
  Surabaya.
- Akun login berbeda dengan data karyawan. Akun bisa **ditautkan** ke data
  karyawan agar pemiliknya juga bisa memakai portal karyawan.

## Tampilan

<!-- ui-mock: company-users -->
```html
<div aria-label="Mockup Users" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;color:#bfdbfe">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="flex:1;min-height:120px"></div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Company Settings</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Company Settings</div>
    <div style="display:flex;gap:4px;padding:6px 16px;border-bottom:1px solid #e4e4e7;background:#fff;font-size:12px">
      <span style="padding:6px 10px">Overview</span><span style="padding:6px 10px">Branches</span><span style="padding:6px 10px">Common Codes</span><span style="padding:6px 10px">Billing</span>
      <span style="padding:6px 10px;border-radius:6px;background:#f4f4f5;color:#2563eb;font-weight:600">Users</span>
      <span style="padding:6px 10px">Roles &amp; Permissions</span>
    </div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;border:1px solid #e4e4e7;background:#fff;border-radius:18px;padding:14px 16px">
        <div><div style="font-weight:800;font-size:14px">Identitas User &amp; Penetapan Peran (Multi-Role)</div><div style="color:#71717a;font-size:11px;margin-top:3px">Satu user dapat memegang beberapa peran. Izin efektif merupakan gabungan (union) seluruh peran dan dapat dibatasi ke cabang tertentu (Branch Scope).</div></div>
        <div style="display:flex;gap:8px;white-space:nowrap"><span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">+ Buat Akun Baru</span><span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">Penetapan Massal (Bulk)</span></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px"><span style="flex:1;border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa">Cari nama, email, atau ID user...</span><span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px">Semua Status ▾</span></div>
      <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:1.6fr 1.6fr 0.8fr 1fr 30px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
          <div style="padding:9px 10px">Identitas User</div><div style="padding:9px 10px">Peran &amp; Scope Penugasan</div><div style="padding:9px 10px">Status Akun</div><div style="padding:9px 10px">Login Terakhir</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:1.6fr 1.6fr 0.8fr 1fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:8px;align-items:center"><span style="width:28px;height:28px;border-radius:999px;background:#dbeafe;display:grid;place-items:center;font-size:11px;font-weight:700;color:#1d4ed8">SR</span><div><div style="font-weight:600">Siti Rahmawati</div><div style="color:#71717a;font-size:10px;font-family:monospace">usr_01J8… · siti@majubersama.co.id</div></div></div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 6px;font-size:10px">tenant_admin</span> <span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 6px;font-size:10px">hr_admin</span></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div>
          <div style="padding:9px 10px;color:#52525b">2026-10-26 08:02</div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.6fr 1.6fr 0.8fr 1fr 30px;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:8px;align-items:center"><span style="width:28px;height:28px;border-radius:999px;background:#fef3c7;display:grid;place-items:center;font-size:11px;font-weight:700;color:#b45309">RH</span><div><div style="font-weight:600">Rudi Hartono</div><div style="color:#71717a;font-size:10px;font-family:monospace">usr_01J9… · rudi@majubersama.co.id</div></div></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 6px;font-size:10px">hr_cabang</span> <span style="border:1px solid #7dd3fc;color:#0369a1;border-radius:6px;padding:1px 6px;font-size:10px">@ branch Kantor Cabang Makassar</span></div>
          <div style="padding:9px 10px"><span style="background:#e0f2fe;color:#0369a1;border-radius:6px;padding:1px 8px;font-size:10px">Invited</span></div>
          <div style="padding:9px 10px;color:#52525b">—</div><div style="color:#71717a">⋯</div>
        </div>
      </div>
    </div>
  </main>
</div>
```
<!-- /ui-mock -->

> **Prompt gambar:** "Ubah HTML di dalam blok `ui-mock` menjadi screenshot UI
> aplikasi HR backoffice yang realistis dan utuh: render semua elemen persis
> seperti tertulis, pertahankan layout, warna, dan teks. Gunakan data nyata
> bergaya perusahaan Indonesia. Latar terang, sudut membulat, bayangan halus.
> Keluarkan sebagai satu gambar."

## Elemen Halaman

| Elemen | Fungsi |
|---|---|
| **Buat Akun Baru** | Buka modal pembuatan akun |
| **Penetapan Massal (Bulk)** | Tetapkan/cabut satu peran untuk banyak user sekaligus |
| Pencarian | *Cari nama, email, atau ID user...* |
| Filter status | **Semua Status**, **Active**, **Invited**, **Locked**, **Suspended** |

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Identitas User** | Foto/inisial, nama, ID user, dan email |
| **Peran & Scope Penugasan** | Badge tiap peran; bila berlaku untuk cabang/tim tertentu ada badge tambahan *@ branch …* / *@ team …* |
| **Status Akun** | **Active** (hijau), **Invited** (biru), **Locked** (merah), **Suspended** |
| **Login Terakhir** | Waktu login terakhir |

### Menu aksi (⋯) per user

| Item | Fungsi |
|---|---|
| **Inspeksi Izin Efektif (Union)** | Panel samping berisi seluruh izin hasil gabungan peran, beserta cakupannya |
| **Kelola Penetapan Peran & Cabang** | Ubah peran dan cakupan cabang/tim user |
| **Buat Data Karyawan** | Hanya muncul bila akun belum tertaut ke karyawan; membuat data karyawan baru lalu menautkannya |
| **Reset Password** | Buat password sementara baru |
| **Kunci Akun (Lock)** / **Buka Kunci Akun** | Ubah status akun menjadi Locked / Active |

> **Catatan:** Saat ini **Kunci Akun (Lock)** / **Buka Kunci Akun** baru mengubah
> status di layar dan **belum tersimpan** — status kembali seperti semula
> setelah halaman dimuat ulang.

## Modal Buat Akun Baru

*"Buat akun baru di bawah akun Anda dan tetapkan perannya."*

| Field | Wajib | Catatan | Contoh |
|---|---|---|---|
| **Username** | Ya | — | budi.admin |
| **Email** | Ya | Format email | budi.admin@perusahaan.com |
| **Peran** | Ya | Pilih satu peran | HR Admin |
| **Cabang (wajib)** | Ya* | Muncul bila peran membutuhkan cabang | Kantor Cabang Makassar |
| **Team/Departemen (wajib)** | Ya* | Muncul bila peran membutuhkan tim; diketik manual | Finance |
| **Juga buat sebagai Employee** | — | Sakelar: sekaligus membuat data karyawan yang ditautkan ke akun ini | — |

Bila sakelar **Juga buat sebagai Employee** dinyalakan, muncul field karyawan:
**Nama Lengkap**\*, **NIK / KTP (16 Digit)**\*, **Email Kerja**\*,
**Tanggal Bergabung**\*, **Unit Organisasi**\*, **Posisi / Jabatan**\*, dan
**Cabang**.

Tombol: **Batal** / **Buat Akun**. Setelah berhasil muncul modal **Kredensial
Akun Baru** berisi password sementara — salin (ikon salin), lalu klik **Saya
sudah menyalin password ini** (baru aktif setelah disalin).

> **Penting:** Password sementara hanya tampil sekali dan harus disampaikan
> manual ke pemilik akun (belum ada pengiriman email).

## Modal Kelola Peran & Scope

*"Atur peran dan batasi wewenang user ke cabang tertentu sesuai kebutuhan
operasional."*

1. **Pilih Peran yang Ditetapkan:** klik kartu peran untuk mencentang/melepas
   (boleh lebih dari satu).
2. **Konfigurasi Cakupan (Branch/Team) per Peran:** muncul untuk peran yang
   butuh cakupan — pilih cabang (*Pilih cabang (wajib untuk peran ini)...*) atau
   ketik nama tim.
3. Klik **Simpan Penetapan** → toast **Penetapan Peran Disimpan 🎉**.

## Modal Penetapan Peran Massal (Bulk Assignment)

| Field | Wajib | Catatan |
|---|---|---|
| **Operasi** | Ya | **Tetapkan Peran (Assign)** atau **Cabut Peran (Revoke)** |
| **Target Peran** | Ya | Satu peran |
| **Cabang (wajib)** / **Team/Departemen (wajib)** | Ya* | Hanya untuk Assign dan bila peran membutuhkannya |
| **Pilih Target User** | Ya | Centang satu atau lebih user dari daftar |

Tombol: **Batal** / **Proses Massal** → toast **Operasi Massal Selesai 🎉**.

## Panel Izin Efektif

Judul **Izin Efektif: (nama user)** — menampilkan peran yang dipegang dan
**Kalkulasi Izin Efektif (N Permission Keys)** dengan badge *Deny by default
enforced*. Tiap baris berisi kunci izin dan badge cakupan **tenant** /
**branch** / **team** / **self**; izin bercakupan cabang/tim menyebut nama
cabang/timnya.

## Langkah — Membuat Akun Admin Cabang

1. Buka **Company Settings → Users**, klik **Buat Akun Baru**.
2. Isi **Username** dan **Email**, pilih **Peran** (mis. HR cabang).
3. Pilih **Cabang** yang dikelola.
4. (Opsional) nyalakan **Juga buat sebagai Employee** bila orang ini juga
   karyawan, lalu lengkapi datanya.
5. Klik **Buat Akun**, salin password sementara, lalu klik **Saya sudah
   menyalin password ini**.

## Pesan Validasi

| Kondisi | Pesan |
|---|---|
| Username/email/peran kosong | **Username, email, dan peran wajib diisi** |
| Peran butuh cabang tapi belum dipilih | **Peran ini membutuhkan cabang (branch) tertentu** |
| Peran butuh tim tapi belum diisi | **Peran ini membutuhkan tim (team) tertentu** |
| Data karyawan belum lengkap | **Mohon Lengkapi Data Karyawan** |
| Akun dibuat tapi data karyawan gagal dibuat | **Akun Dibuat, Tapi Gagal Menautkan Karyawan** — tautkan manual dari halaman karyawan |
| Bulk tanpa user terpilih | **Pilih minimal satu user untuk operasi massal** |

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/settings/users.vue` |
| Field karyawan | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrEmployeeRequiredFields.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useAccessUsers.ts`, `useAccessRoles.ts`, `useEmployees.ts` |
| Modul | `modules/rbac/**`, `modules/auth/**` |
