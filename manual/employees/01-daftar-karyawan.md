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
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:7px 12px;background:#fff">↻ Refresh</span>
        <span style="background:#2563eb;color:#fff;border-radius:8px;padding:7px 12px;font-weight:600">+ Tambah Karyawan</span>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;align-items:center">
      <span style="flex:1;border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa">Search employee name, email, or ID...</span>
      <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px">All branches ▾</span>
      <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px">Display ⚙</span>
    </div>
    <div style="margin-top:12px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
      <div style="display:grid;grid-template-columns:90px 1.2fr 1.4fr 0.9fr 1.4fr 0.9fr;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
        <div style="padding:10px">Emp No</div><div style="padding:10px">Name</div><div style="padding:10px">Email</div><div style="padding:10px">Branch</div><div style="padding:10px">Assignment</div><div style="padding:10px">Auth Account</div>
      </div>
      <div style="display:grid;grid-template-columns:90px 1.2fr 1.4fr 0.9fr 1.4fr 0.9fr;border-bottom:1px solid #f4f4f5;align-items:center">
        <div style="padding:10px;font-family:monospace;font-size:11px;color:#71717a">EMP-0001</div>
        <div style="padding:10px;font-weight:600">Budi Santoso</div>
        <div style="padding:10px">budi@perusahaan.co.id</div>
        <div style="padding:10px">Jakarta HQ</div>
        <div style="padding:10px"><div style="font-weight:500">Software Engineer</div><div style="color:#71717a;font-size:10px">Engineering</div></div>
        <div style="padding:10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 8px;font-size:11px">Linked</span></div>
      </div>
      <div style="display:grid;grid-template-columns:90px 1.2fr 1.4fr 0.9fr 1.4fr 0.9fr;align-items:center">
        <div style="padding:10px;font-family:monospace;font-size:11px;color:#71717a">EMP-0002</div>
        <div style="padding:10px;font-weight:600">Dewi Lestari</div>
        <div style="padding:10px">dewi@perusahaan.co.id</div>
        <div style="padding:10px">Bandung</div>
        <div style="padding:10px"><div style="font-weight:500">HR Officer</div><div style="color:#71717a;font-size:10px">People Ops</div></div>
        <div style="padding:10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:2px 8px;font-size:11px">Not linked</span></div>
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
| **Refresh** | Memuat ulang daftar karyawan, unit organisasi, dan posisi |
| **Tambah Karyawan** | Buka form pendaftaran (butuh `employees:write`) |
| **Import Excel** *(rencana — belum ada di aplikasi)* | Daftarkan banyak karyawan sekaligus dari file Excel — lihat [`08-import-karyawan.md`](./08-import-karyawan.md) |
| Kolom pencarian | Placeholder *Search employee name, email, or ID...* — mencari berdasarkan nama |
| **All branches** | Filter berdasarkan cabang |
| **Display** | Atur kolom mana yang ditampilkan |
| Baris tabel (dobel klik) | Buka halaman detail karyawan |

## Kolom Tabel

| Kolom | Isi |
|---|---|
| **Emp No** | Nomor karyawan (huruf monospace) |
| **Name** | Nama lengkap |
| **Email** | Email kerja |
| **Branch** | Nama cabang kerja |
| **Assignment** | Posisi/jabatan di atas, unit organisasi di bawah |
| **Auth Account** | `Linked` bila punya akun login, `Not linked` bila belum |

> **Catatan:** Kolom Direct Manager, Employment, dan Lifecycle Status (beserta
> filternya) sudah **tidak** ditampilkan di daftar. Informasi tersebut tetap
> bisa dilihat di halaman detail karyawan.

## Langkah

1. Masuk ke menu **Employees → Employees Info** di sidebar.
2. (Opsional) ketik kata kunci pada kolom pencarian.
3. (Opsional) pilih cabang pada filter **All branches**.
4. **Dobel klik** baris karyawan untuk membuka detail
   ([`03-detail-karyawan.md`](./03-detail-karyawan.md)).
5. Klik **Tambah Karyawan** untuk mendaftarkan karyawan baru
   ([`02-tambah-karyawan.md`](./02-tambah-karyawan.md)).
6. *(Rencana)* Klik **Import Excel** untuk mendaftarkan banyak karyawan
   sekaligus ([`08-import-karyawan.md`](./08-import-karyawan.md)).

## Catatan & Aturan

> **Tip:** Daftar ini memuat maksimal 100 karyawan sekaligus. Untuk data yang
> lebih besar, gunakan pencarian/filter agar karyawan yang dituju langsung tampil.

- Aksi per karyawan (transfer, ubah status, buat/tautkan akun, offboarding,
  arsip) **tidak** ada di halaman ini — semuanya ada di menu **Actions** pada
  halaman detail.
- Tombol **Tambah Karyawan** hanya tampil bila Anda memiliki `employees:write`.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/index.vue` |
| Wrapper | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee.vue` |
| Tabel | `HR-SYSTEM-BACKOFFICE/app/components/AppDataTable.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useEmployees.ts`, `useOrgUnits.ts`, `usePositions.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
