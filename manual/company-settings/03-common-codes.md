# 03 · Common Codes

Mengelola **pilihan dropdown** yang dipakai di seluruh aplikasi — mis. daftar
agama, bank, jenjang pendidikan, atau jenis kontrak. Perusahaan bisa menambah
pilihan sendiri atau menonaktifkan pilihan yang tidak dipakai.

**Akses:** `/tenants/settings/common-codes` (tab **Common Codes**) ·
**Permission:** melihat — semua admin; tambah/ubah/nonaktifkan — `settings:write`

## Tampilan

<!-- ui-mock: company-common-codes -->
```html
<div aria-label="Mockup Common Codes" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
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
      <span style="padding:6px 10px">Overview</span><span style="padding:6px 10px">Branches</span>
      <span style="padding:6px 10px;border-radius:6px;background:#f4f4f5;color:#2563eb;font-weight:600">Common Codes</span>
      <span style="padding:6px 10px">Billing</span><span style="padding:6px 10px">Users</span><span style="padding:6px 10px">Roles &amp; Permissions</span>
    </div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
        <div><div style="font-weight:800;font-size:15px">Common Codes</div><div style="color:#71717a;font-size:11px;margin-top:3px">Lookup values used to tag records (religion, bank, PTKP status, ...). Records store the code value, so a code can't be renamed once created — deactivate it instead.</div></div>
        <div style="display:flex;gap:8px;white-space:nowrap"><span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">↻ Refresh</span><span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">+ Add Code</span></div>
      </div>
      <div style="display:grid;grid-template-columns:170px 1fr;gap:14px;margin-top:14px">
        <div style="font-size:12px">
          <div style="color:#71717a;font-size:10px;font-weight:600;text-transform:uppercase;margin-bottom:6px">Categories</div>
          <div style="padding:6px 8px">Organization Type</div><div style="padding:6px 8px">Break Type</div><div style="padding:6px 8px">Holiday Category</div><div style="padding:6px 8px">Religion</div>
          <div style="padding:6px 8px;border-radius:6px;background:#dbeafe;color:#1d4ed8;font-weight:600">Bank</div>
          <div style="padding:6px 8px">Family Relationship</div><div style="padding:6px 8px">Occupation</div><div style="padding:6px 8px">Education Level</div><div style="padding:6px 8px">Contract Type</div><div style="padding:6px 8px">Salary Type</div>
        </div>
        <div>
          <div style="font-weight:700">Bank <code style="background:#f4f4f5;border-radius:4px;padding:1px 6px;font-size:11px;color:#71717a">bank</code></div>
          <div style="display:flex;gap:8px;margin-top:10px"><span style="flex:1;border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa">Search name...</span><span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px">All statuses ▾</span></div>
          <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
            <div style="display:grid;grid-template-columns:90px 1.6fr 50px 80px 80px 30px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
              <div style="padding:9px 10px">Code</div><div style="padding:9px 10px">Name</div><div style="padding:9px 10px">Sort</div><div style="padding:9px 10px">Source</div><div style="padding:9px 10px">Status</div><div></div>
            </div>
            <div style="display:grid;grid-template-columns:90px 1.6fr 50px 80px 80px 30px;border-bottom:1px solid #f4f4f5;align-items:center">
              <div style="padding:9px 10px;font-family:monospace;font-size:11px">bca</div><div style="padding:9px 10px;font-weight:500">Bank Central Asia</div><div style="padding:9px 10px">10</div>
              <div style="padding:9px 10px"><span style="background:#e0f2fe;color:#0369a1;border-radius:6px;padding:1px 8px;font-size:10px">System</span></div><div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋯</div>
            </div>
            <div style="display:grid;grid-template-columns:90px 1.6fr 50px 80px 80px 30px;border-bottom:1px solid #f4f4f5;align-items:center">
              <div style="padding:9px 10px;font-family:monospace;font-size:11px">bank_jago</div><div style="padding:9px 10px;font-weight:500">Bank Jago<div style="color:#71717a;font-size:10px">Rekening payroll tim Jakarta</div></div><div style="padding:9px 10px">200</div>
              <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Custom</span></div><div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋯</div>
            </div>
            <div style="display:grid;grid-template-columns:90px 1.6fr 50px 80px 80px 30px;align-items:center">
              <div style="padding:9px 10px;font-family:monospace;font-size:11px">bank_lama</div><div style="padding:9px 10px;font-weight:500">Bank Lama (merger)</div><div style="padding:9px 10px">210</div>
              <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Custom</span></div><div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Inactive</span></div><div style="color:#71717a">⋯</div>
            </div>
          </div>
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
| **Refresh** | Muat ulang kategori & kode |
| **Add Code** | Tambah kode baru ke kategori yang sedang dipilih (`settings:write`) |
| **Categories** (kiri) | Daftar kategori; klik untuk menampilkan kodenya. Kategori pertama terpilih otomatis |
| Judul kategori | Nama kategori + kunci kategori + deskripsi (bila ada) |
| Pencarian & filter | *Search name...* dan **All statuses / Active / Inactive** |
| **⋯** (aksi baris) | **Edit code**, **Deactivate code** / **Activate code** |

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Code** | Kode yang tersimpan di data (tidak bisa diubah) |
| **Name** | Nama yang tampil di dropdown + deskripsi |
| **Sort** | Urutan tampil di dropdown (kecil = lebih atas) |
| **Source** | **System** (bawaan aplikasi) atau **Custom** (dibuat perusahaan) |
| **Status** | **Active** atau **Inactive** |

### Kategori & tempat dipakai

| Kategori | Dipakai di |
|---|---|
| **Organization Type** | Jenis unit organisasi (HR Setting → Organizations) |
| **Break Type** | Jenis istirahat pada jam kerja (HR Setting → Working Time) |
| **Holiday Category** | Kategori hari libur (HR Setting → Holiday & Leave Calendar) |
| **Religion** | Agama karyawan (data pribadi) |
| **Bank** | Rekening bank karyawan |
| **Family Relationship**, **Occupation** | Data keluarga karyawan |
| **Education Level** | Riwayat pendidikan karyawan |
| **Contract Type** | Jenis kontrak kerja (PKWT, PKWTT, …) |
| **Salary Type** | Jenis gaji (Salary) |

> Daftar kategori mengikuti aplikasi dan bisa bertambah. Status PTKP, kategori
> TER, dan program BPJS **tidak** dikelola di sini karena nilainya ditetapkan
> regulasi.

## Modal Add Code / Edit Code

Deskripsi modal: *Category: (nama kategori)*.

| Field | Tipe | Wajib | Validasi / Catatan | Contoh |
|---|---|---|---|---|
| **Code** | teks | Ya | Terisi otomatis dari **Name** (boleh diubah). Huruf, angka, `_ . / -`, maks 50. **Tidak bisa diubah setelah dibuat** (nonaktif saat edit) | `bank_jago` |
| **Sort Order** | angka | Tidak | Minimal 0; default = urutan terbesar + 10 | 200 |
| **Name** | teks | Ya | Maks 150 | Bank Jago |
| **Description** | teks panjang | Tidak | — | Rekening payroll tim Jakarta |

Tombol: **Cancel** / **Add code** (tambah) atau **Save changes** (ubah).

## Modal Deactivate code?

*"(kode) will no longer be offered for new records. Records already tagged with
it keep their value, and you can reactivate it at any time."* Tombol **Cancel** /
**Deactivate**. Kode nonaktif bisa diaktifkan lagi lewat **⋯ → Activate code**.

## Langkah — Menambah Pilihan Bank

1. Buka **Company Settings → Common Codes**.
2. Pilih kategori **Bank** di kiri.
3. Klik **Add Code**, isi **Name** (kode terisi otomatis), atur **Sort Order**
   bila perlu.
4. Klik **Add code**. Pilihan baru langsung muncul di dropdown bank pada data
   karyawan.

## Catatan & Aturan

- Karena data menyimpan **kode**, kode tidak bisa diganti. Bila salah ketik,
  nonaktifkan kode lama dan buat kode baru.
- Menonaktifkan kode tidak mengubah data lama; kode hanya hilang dari pilihan
  untuk data baru.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/settings/common-codes.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useCommonCodes.ts` |
| Data awal | `HR-SYSTEM-API/migrations/*common_code*` |
