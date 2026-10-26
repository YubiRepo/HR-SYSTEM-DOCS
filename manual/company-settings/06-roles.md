# 06 · Roles & Permissions (Peran & Hak Akses)

Mengelola peran (role) dan izin (permission) di dalamnya. Peran **Sistem**
adalah bawaan aplikasi dan tidak bisa diubah; perusahaan bisa membuat peran
**Kustom** untuk pembagian wewenang yang lebih spesifik.

**Akses:** `/tenants/settings/roles` (tab **Roles & Permissions**) ·
**Permission:** `roles:read` (lihat), `roles:write` (buat, ubah, hapus)

## Konsep

- **Izin** ditulis dengan format `resource:action` — mis. `employees:read`
  (melihat karyawan), `leave:approve` (menyetujui cuti).
- Setiap izin dalam peran punya **cakupan (scope)**:

| Scope | Artinya |
|---|---|
| **Tenant** | Berlaku untuk seluruh perusahaan |
| **Branch** | Hanya untuk cabang tertentu (cabang dipilih saat peran ditetapkan ke user) |
| **Team** | Hanya untuk tim/departemen tertentu |
| **Self** | Hanya data milik pengguna itu sendiri |

- Peran ditetapkan ke pengguna di tab **Users**
  ([`05-users.md`](./05-users.md)).

### Peran bawaan (Sistem)

| Kode peran | Untuk siapa | Isi utama |
|---|---|---|
| `tenant_admin` | Admin utama perusahaan | Kelola pengguna & peran, pengaturan perusahaan, cabang, billing, dan paket langganan |
| `employee` | Karyawan | Akses portal untuk profil & absensi milik sendiri (scope **Self**). Diberikan otomatis ke akun yang dibuat saat menambah karyawan |

Peran operasional lain — mis. manager, HR admin, admin cabang, petugas payroll —
dibuat sebagai peran **Kustom** sesuai kebutuhan perusahaan.

> **Catatan:** Perusahaan lama mungkin masih melihat peran seperti `manager` atau
> `hr_admin` bertipe Sistem dari versi sebelumnya; peran tersebut tetap berfungsi.

## Tampilan

<!-- ui-mock: company-roles -->
```html
<div aria-label="Mockup Roles and Permissions" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
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
      <span style="padding:6px 10px">Overview</span><span style="padding:6px 10px">Branches</span><span style="padding:6px 10px">Common Codes</span><span style="padding:6px 10px">Billing</span><span style="padding:6px 10px">Users</span>
      <span style="padding:6px 10px;border-radius:6px;background:#f4f4f5;color:#2563eb;font-weight:600">Roles &amp; Permissions</span>
    </div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
        <div><div style="font-weight:800;font-size:15px">Peran &amp; Hak Akses</div><div style="color:#71717a;font-size:11px;margin-top:3px">Peran sistem adalah bawaan dan tidak dapat diubah. Buat peran kustom untuk kebutuhan pembagian wewenang spesifik.</div></div>
        <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600;white-space:nowrap">+ Buat Peran</span>
      </div>
      <div style="margin-top:12px;border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa;width:260px">Cari nama peran...</div>
      <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:1.3fr 2fr 0.7fr 0.7fr 30px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
          <div style="padding:9px 10px">Peran</div><div style="padding:9px 10px">Deskripsi</div><div style="padding:9px 10px">Tipe</div><div style="padding:9px 10px">Pengguna</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 2fr 0.7fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Tenant Admin</div><div style="color:#a1a1aa;font-size:10px;font-family:monospace">tenant_admin</div></div>
          <div style="padding:9px 10px;color:#71717a">Akses penuh ke seluruh pengaturan perusahaan</div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Sistem</span></div>
          <div style="padding:9px 10px;font-family:monospace">2</div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 2fr 0.7fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Employee</div><div style="color:#a1a1aa;font-size:10px;font-family:monospace">employee</div></div>
          <div style="padding:9px 10px;color:#71717a">Akses portal karyawan untuk data milik sendiri</div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Sistem</span></div>
          <div style="padding:9px 10px;font-family:monospace">96</div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 2fr 0.7fr 0.7fr 30px;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Hr Cabang</div><div style="color:#a1a1aa;font-size:10px;font-family:monospace">hr_cabang</div></div>
          <div style="padding:9px 10px;color:#71717a">Kelola karyawan &amp; cuti di cabangnya sendiri</div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Kustom</span></div>
          <div style="padding:9px 10px;font-family:monospace">3</div><div style="color:#71717a">⋯</div>
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
| **Buat Peran** | Buka modal peran baru |
| Pencarian | *Cari nama peran...* |
| **⋯** (aksi baris) | **Lihat Pengguna**, **Edit Peran**, **Hapus Peran** |

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Peran** | Nama tampilan + kode peran |
| **Deskripsi** | Penjelasan fungsi peran |
| **Tipe** | **Sistem** (bawaan, terkunci) atau **Kustom** |
| **Pengguna** | Jumlah pengguna yang memegang peran ini |

> **Penting:** **Edit Peran** dan **Hapus Peran** nonaktif untuk peran **Sistem**.

## Modal Buat Peran Baru / Edit Peran

*"Tetapkan nama, deskripsi, dan izin untuk peran ini."*

| Field | Wajib | Catatan | Contoh |
|---|---|---|---|
| **Nama Peran** | Ya | Disimpan huruf kecil, spasi menjadi `_`. Tidak bisa diubah saat edit | supervisor_gudang |
| **Deskripsi** | Tidak | Uraikan fungsi dan batasan peran | Menyetujui lembur tim gudang |
| **Pilih Izin (N dipilih)** | — | Daftar semua izin (kunci + deskripsi). Klik untuk mencentang; setelah dicentang pilih scope **Self** / **Team** / **Branch** / **Tenant** (default **Tenant**) | `attendance:approve` @ Branch |

Tombol: **Batal** / **Simpan Peran** → toast **Peran Dibuat** / **Peran
Diperbarui**. Nama kosong → **Nama peran wajib diisi**.

## Modal Pengguna dengan Peran

Daftar user pemegang peran: ID user, tanggal ditetapkan, dan badge cakupan
(*Branch: …*, *Team: …*, atau *Tenant-wide*). Klik baris untuk membuka tab
**Users**. Bila kosong: *Belum ada pengguna yang memegang peran ini.*

## Modal Hapus Peran?

*"Peran (nama) akan dihapus, dan seluruh izin yang melekat akan dicabut dari
pemegangnya. Tindakan ini tidak dapat dibatalkan."* Tombol **Batal** / **Hapus
Peran**.

## Langkah — Membuat Peran Supervisor Cabang

1. Buka **Company Settings → Roles & Permissions**, klik **Buat Peran**.
2. Isi **Nama Peran** (mis. *supervisor gudang*) dan **Deskripsi**.
3. Centang izin yang dibutuhkan, lalu atur scope tiap izin — mis. **Branch**
   agar hanya berlaku di cabang yang ditentukan.
4. Klik **Simpan Peran**.
5. Tetapkan peran ke user di tab **Users → ⋯ → Kelola Penetapan Peran &
   Cabang**, lalu pilih cabangnya.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/settings/roles.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useAccessRoles.ts`, `useAccessPermissions.ts` |
| Modul | `modules/rbac/01-model.md`, `modules/rbac/02-roles.md` |
