# 09 · Custom Fields

Menambah **field data karyawan khusus perusahaan** yang tidak tersedia di form
standar — mis. *Nomor Anggota Koperasi* atau *Ukuran Seragam*. Field yang aktif
otomatis muncul di form **Add Employee** dan di halaman detail karyawan.

**Akses:** `/tenants/hr-setting/custom-fields` · **Permission:** `settings:write`
(menu, tambah, ubah, nonaktifkan)

## Tampilan

<!-- ui-mock: hr-custom-fields -->
```html
<div aria-label="Mockup Custom Fields" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Custom Fields</div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #e4e4e7;padding-bottom:14px">
        <div><div style="font-weight:800;font-size:16px">Custom Fields</div><div style="color:#71717a;font-size:11px;margin-top:3px">Define tenant-specific extra fields (e.g. "Nomor Anggota Koperasi") collected alongside standard employee data.</div></div>
        <div style="display:flex;gap:8px;white-space:nowrap">
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 12px;font-weight:600">↻ Refresh</span>
          <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">+ Add Custom Field</span>
        </div>
      </div>
      <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;border:1px solid #e4e4e7;background:#fafafa;border-radius:10px;padding:8px 10px">
        <div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa;width:280px">Search field label...</div>
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:5px 10px">Display ⚙</span>
      </div>
      <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:1.8fr 0.8fr 1fr 0.8fr 0.8fr 36px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
          <div style="padding:9px 10px">Field</div><div style="padding:9px 10px">Type</div><div style="padding:9px 10px">Section</div><div style="padding:9px 10px">Required</div><div style="padding:9px 10px">Status</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:1.8fr 0.8fr 1fr 0.8fr 0.8fr 36px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Nomor Anggota Koperasi</div><div style="color:#71717a;font-size:11px;font-family:monospace">koperasi_no</div></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Text</span></div>
          <div style="padding:9px 10px">Kepegawaian</div>
          <div style="padding:9px 10px"><span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:1px 8px;font-size:10px">Wajib</span></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div>
          <div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.8fr 0.8fr 1fr 0.8fr 0.8fr 36px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Ukuran Seragam</div><div style="color:#71717a;font-size:11px;font-family:monospace">ukuran_seragam</div></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Select</span></div>
          <div style="padding:9px 10px">Fasilitas</div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Opsional</span></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div>
          <div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.8fr 0.8fr 1fr 0.8fr 0.8fr 36px;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Tanggal Vaksin Terakhir</div><div style="color:#71717a;font-size:11px;font-family:monospace">tgl_vaksin</div></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Date</span></div>
          <div style="padding:9px 10px">—</div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Opsional</span></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Inactive</span></div>
          <div style="color:#71717a">⋯</div>
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
| **Refresh** | Memuat ulang daftar field |
| **Add Custom Field** | Membuka modal **Create Custom Field** (`settings:write`) |
| Kolom pencarian | *Search field label...* — mencari berdasarkan label |
| **Display** | Menampilkan/menyembunyikan kolom tabel |
| **⋯** (aksi baris) | **Edit field**, **Deactivate field** (nonaktif bila field sudah **Inactive** atau tanpa `settings:write`) |

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Field** | Label field + key (teks kecil) |
| **Type** | **Text**, **Number**, **Date**, **Select**, atau **Boolean** |
| **Section** | Label pengelompokan, atau — bila kosong |
| **Required** | **Wajib** atau **Opsional** |
| **Status** | **Active** atau **Inactive** |

### Tempat field muncul

| Lokasi | Tampilan |
|---|---|
| **Employees → Add Employee** | Bagian **Custom Fields** (*"Additional fields defined by your company."*) di akhir form; field wajib bertanda wajib |
| Detail karyawan → **Others → Custom Fields** | Sub-tab untuk melihat & mengubah nilai, disimpan dengan tombol **Save Custom Fields** (butuh `employees:write`) |
| Portal karyawan (ESS) → Profil | Bagian **Custom Fields** berisi nilai milik karyawan (hanya baca) |

Hanya field **Active** yang ditampilkan. Bila belum ada field aktif, bagian dan
sub-tab **Custom Fields** tidak muncul. Bentuk input mengikuti tipe: kotak teks
(**Text**), angka (**Number**), pemilih tanggal (**Date**), dropdown dari daftar
pilihan (**Select**), atau sakelar ya/tidak (**Boolean**).

## Modal Create Custom Field / Edit Custom Field

Deskripsi modal: *"Key and type can't be changed after a field is created."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Key** | teks | Ya | Placeholder *koperasi_no*. *"Lowercase, no spaces — e.g. koperasi_no. Used as the wire identifier, can't be changed later."* Nonaktif saat edit | `koperasi_no` |
| **Type** | pilihan | Ya | **Text** (default), **Number**, **Date**, **Select**, **Boolean**. Nonaktif saat edit | Text |
| **Label** | teks | Ya | Placeholder *Nomor Anggota Koperasi*. Teks yang tampil di form karyawan | Nomor Anggota Koperasi |
| **Section** | teks | Tidak | Placeholder *Kepegawaian*. *"Display grouping label, optional."* | Kepegawaian |
| **Options** | daftar tag | Tidak* | Hanya muncul bila **Type** = **Select**. Placeholder *Add option...*; *"Press enter to add each choice."* | S, M, L, XL |
| **Required** | centang | Tidak | *Wajib diisi saat menambah karyawan* | ✓ |

\* Untuk tipe **Select**, isi minimal satu pilihan agar dropdown tidak kosong.

Tombol: **Cancel** / **Create field** (tambah) atau **Save changes** (ubah).

Pesan:

- Berhasil tambah → **Field Custom Dibuat** (*"'(label)' berhasil
  ditambahkan."*); gagal → **Gagal Membuat Field**
- Berhasil ubah → **Field Custom Diperbarui**; gagal → **Gagal Memperbarui
  Field**
- Berhasil nonaktifkan → **Field Custom Dinonaktifkan**; gagal → **Gagal
  Menonaktifkan Field**

## Langkah — Menambah Field Pilihan

1. Buka **HR Setting → Custom Fields**.
2. Klik **Add Custom Field**.
3. Isi **Key** (mis. `ukuran_seragam`), pilih **Type** = **Select**.
4. Isi **Label** = Ukuran Seragam dan **Section** bila perlu.
5. Di **Options**, ketik setiap pilihan lalu tekan Enter (S, M, L, XL).
6. Centang **Required** bila wajib diisi saat menambah karyawan.
7. Klik **Create field**. Field langsung muncul di form **Add Employee**.

## Langkah — Mengisi Nilai untuk Karyawan Lama

1. Buka **Employees**, pilih karyawan.
2. Buka tab **Others → Custom Fields**.
3. Isi nilainya, lalu klik **Save Custom Fields**.

## Langkah — Menonaktifkan Field

1. Pada baris field, klik **⋯ → Deactivate field**.
2. Status berubah menjadi **Inactive** dan field hilang dari form karyawan.

## Catatan & Aturan

- **Key** dan **Type** tidak bisa diubah. Bila salah, nonaktifkan field lalu
  buat field baru.
- **Deactivate field** langsung dijalankan tanpa dialog konfirmasi.
- Field yang sudah **Inactive** tetap tercantum di daftar, tetapi halaman ini
  tidak menyediakan aksi untuk mengaktifkannya kembali.
- **Section** saat ini hanya tampil di tabel halaman ini; form karyawan
  menampilkan semua field aktif dalam satu bagian **Custom Fields**.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/custom-fields.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useEmployeeFields.ts` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/AppDataTable.vue` |
| Form karyawan | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/create.vue`, `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/[id].vue`, `HR-SYSTEM-BACKOFFICE/app/pages/ess/employee.vue` |
| Gate menu | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Modul | [Core HR](/modules/core-hr/01-overview), [Siklus Karyawan](/modules/core-hr/03-employee-lifecycle) |
