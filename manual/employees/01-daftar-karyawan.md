# 01 · Employees Info (Daftar Karyawan)

Halaman utama menu **Employees**. Menampilkan seluruh karyawan tenant dalam
tabel yang bisa dicari dan difilter, serta pintu masuk ke detail tiap karyawan.

**Akses:** `/tenants/employee` · **Permission:** `employees:read`

## Tampilan

<!-- ui-mock: employees-info-list -->
```html
<div aria-label="Mockup Employees Info" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:8px 10px;color:#bfdbfe">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e4e4e7;padding-bottom:14px">
      <div>
        <div style="font-size:17px;font-weight:700">Employees Info</div>
        <div style="color:#71717a;font-size:11px;margin-top:3px">Kelola data pribadi karyawan, posisi jabatan, cabang kerja, manajer langsung, dan status akun login.</div>
      </div>
      <div style="display:flex;gap:8px">
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:7px 12px;background:#fff">Refresh</span>
        <span style="background:#2563eb;color:#fff;border-radius:8px;padding:7px 12px;font-weight:600">+ Tambah Karyawan</span>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;padding:10px;margin-top:14px">
      <span style="display:flex;align-items:center;gap:6px;border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;width:280px;color:#a1a1aa">Search employee name, email, or ID...</span>
      <div style="display:flex;gap:8px">
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px">All branches ▾</span>
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px">All employment ▾</span>
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px">All lifecycle ▾</span>
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px">Display ⚙</span>
      </div>
    </div>
    <div style="border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;margin-top:12px;background:#fff">
      <div style="display:grid;grid-template-columns:2fr 1fr 1.6fr 1fr 1fr 1fr 1fr;background:#f4f4f5;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#71717a;font-weight:700">
        <div style="padding:10px">Employee Master</div><div style="padding:10px">Branch</div><div style="padding:10px">Assignment</div><div style="padding:10px">Direct Manager</div><div style="padding:10px">Employment</div><div style="padding:10px">Lifecycle Status</div><div style="padding:10px">Auth Account</div>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr 1.6fr 1fr 1fr 1fr 1fr;border-top:1px solid #f4f4f5;align-items:center">
        <div style="padding:10px"><div style="font-weight:600">Budi Santoso</div><div style="color:#71717a;font-size:10px">EMP-0001 · budi@perusahaan.co.id</div></div>
        <div style="padding:10px">Jakarta HQ</div>
        <div style="padding:10px"><div>Software Engineer</div><div style="color:#71717a;font-size:10px">Engineering</div></div>
        <div style="padding:10px">Siti Rahmawati</div>
        <div style="padding:10px">PKWT</div>
        <div style="padding:10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 8px;font-size:11px">Active</span></div>
        <div style="padding:10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 8px;font-size:11px">Linked</span></div>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr 1.6fr 1fr 1fr 1fr 1fr;border-top:1px solid #f4f4f5;align-items:center">
        <div style="padding:10px"><div style="font-weight:600">Dewi Lestari</div><div style="color:#71717a;font-size:10px">EMP-0002 · dewi@perusahaan.co.id</div></div>
        <div style="padding:10px">Bandung</div>
        <div style="padding:10px"><div>HR Officer</div><div style="color:#71717a;font-size:10px">People Ops</div></div>
        <div style="padding:10px">Siti Rahmawati</div>
        <div style="padding:10px">Intern</div>
        <div style="padding:10px"><span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:2px 8px;font-size:11px">Probation</span></div>
        <div style="padding:10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:2px 8px;font-size:11px">Not linked</span></div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;color:#71717a;font-size:11px;margin-top:10px">
      <span>Total 2 data.</span>
      <span>Rows per page [10] &nbsp; ‹ 1 ›</span>
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
| **Refresh** | Memuat ulang daftar karyawan, unit organisasi, dan posisi |
| **Tambah Karyawan** | Buka form pendaftaran (butuh `employees:write`) |
| Kolom pencarian | Cari berdasarkan nama, email, atau nomor karyawan |
| **All branches** | Filter berdasarkan cabang |
| **All employment** | Filter berdasarkan tipe kepegawaian |
| **All lifecycle** | Filter berdasarkan status siklus hidup |
| **Display** | Atur kolom mana yang ditampilkan |
| Baris tabel (dobel klik) | Buka halaman detail karyawan |

## Kolom Tabel

| Kolom | Isi |
|---|---|
| **Employee Master** | Nama lengkap, nomor karyawan, dan email kerja |
| **Branch** | Nama cabang kerja |
| **Assignment** | Posisi/jabatan di atas, unit organisasi di bawah |
| **Direct Manager** | Nama manajer langsung |
| **Employment** | Tipe kepegawaian (PKWT, PKWTT, Permanent, Contract, Intern, Outsource, atau "Belum ada kontrak") |
| **Lifecycle Status** | Badge status: `Active`, `Probation`, `Resigned`, `Offboarded`, `On leave`, `Terminated` |
| **Auth Account** | `Linked` bila punya akun login, `Not linked` bila belum |

## Langkah

1. Masuk ke menu **Employees** di sidebar.
2. (Opsional) ketik kata kunci pada kolom pencarian.
3. (Opsional) pilih nilai pada filter **All branches**, **All employment**,
   atau **All lifecycle**.
4. **Dobel klik** baris karyawan untuk membuka detail
   ([`03-detail-karyawan.md`](./03-detail-karyawan.md)).
5. Klik **Tambah Karyawan** untuk mendaftarkan karyawan baru
   ([`02-tambah-karyawan.md`](./02-tambah-karyawan.md)).

## Catatan & Aturan

> **Tip:** Daftar ini dibatasi 100 baris pada satu waktu. Untuk data yang lebih
> besar, gunakan pencarian/filter agar karyawan yang dituju langsung tampil.

- Aksi per karyawan (transfer, ubah status, tautkan akun, arsip) **tidak** ada
  di halaman ini — semuanya pindah ke menu **Actions** di halaman detail.
- Tombol **Tambah Karyawan** hanya tampil bila Anda memiliki `employees:write`.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/index.vue` |
| Wrapper | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee.vue` |
| Tabel | `HR-SYSTEM-BACKOFFICE/app/components/AppDataTable.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useEmployees.ts`, `useOrgUnits.ts`, `usePositions.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
