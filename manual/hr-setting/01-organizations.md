# 01 · Organizations (Struktur Organisasi)

Menyusun struktur organisasi perusahaan — divisi, departemen, dan tim — dalam
satu pohon (org tree) per perusahaan. Unit organisasi dipilih saat menempatkan
karyawan dan saat membuat slot posisi di halaman **Positions**.

**Akses:** `/tenants/hr-setting/organizations` (menu **HR Setting →
Organizations**) · **Permission:** menu tampil bila punya `core_hr:write` atau
`org:write`; tombol **Create org unit** dan aksi baris (edit, nonaktifkan,
aktifkan) hanya untuk `org:write`

## Tampilan

<!-- ui-mock: hr-setting-organizations -->
```html
<div aria-label="Mockup Organizations" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Organizations</div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
        <div><div style="font-weight:800;font-size:15px">Organizations</div><div style="color:#71717a;font-size:11px;margin-top:3px">One org tree per tenant — org units &amp; positions belong to the tenant as a whole, not to any branch.</div></div>
        <div style="display:flex;gap:8px;white-space:nowrap"><span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">↻ Refresh</span><span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">+ Create org unit</span></div>
      </div>
      <div style="margin-top:14px;border:1px solid #e4e4e7;border-radius:14px;background:#fff;padding:14px">
        <div style="font-weight:600">Org Chart</div>
        <div style="color:#71717a;font-size:11px;margin-top:2px">Visual structure (GET /org-chart) — drag to pan</div>
        <div style="display:flex;flex-direction:column;align-items:center;margin-top:14px">
          <div style="width:190px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:8px;text-align:center">
            <span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Root Unit</span>
            <div style="font-weight:600;margin-top:4px">PT Maju Bersama Sejahtera</div><div style="color:#71717a;font-size:11px">Company</div>
          </div>
          <div style="width:1px;height:14px;background:#e4e4e7"></div>
          <div style="width:440px;height:1px;background:#e4e4e7"></div>
          <div style="display:flex;gap:24px;margin-top:14px">
            <div style="width:190px;border:1px solid #e4e4e7;background:#fafafa;border-radius:10px;padding:8px;text-align:center"><div style="font-weight:600">Divisi Keuangan</div><div style="color:#71717a;font-size:11px">Division</div></div>
            <div style="width:190px;border:1px solid #e4e4e7;background:#fafafa;border-radius:10px;padding:8px;text-align:center"><div style="font-weight:600">Divisi Operasional</div><div style="color:#71717a;font-size:11px">Division</div></div>
            <div style="width:190px;border:1px solid #e4e4e7;background:#fafafa;border-radius:10px;padding:8px;text-align:center;opacity:.5"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Inactive</span><div style="font-weight:600;margin-top:4px">Tim Ekspor</div><div style="color:#71717a;font-size:11px">Team</div></div>
          </div>
        </div>
      </div>
      <div style="margin-top:14px;display:flex;justify-content:space-between;border:1px solid #e4e4e7;border-radius:10px;background:#fafafa;padding:8px">
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa;width:240px">🔍 Search unit name...</span>
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px">Display ⚙</span>
      </div>
      <div style="margin-top:8px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:2fr 1fr 40px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:700;text-transform:uppercase">
          <div style="padding:9px 10px">Unit</div><div style="padding:9px 10px">Status</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 1fr 40px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:700;font-size:12px">Divisi Keuangan</div><div style="color:#71717a;font-size:11px">Division · Parent: PT Maju Bersama Sejahtera</div></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 1fr 40px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:700;font-size:12px">Department Accounting</div><div style="color:#71717a;font-size:11px">Department · Parent: Divisi Keuangan</div></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 1fr 40px;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:700;font-size:12px">Tim Ekspor <span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 6px;font-size:10px;font-weight:400">Inactive</span></div><div style="color:#71717a;font-size:11px">Team · Parent: PT Maju Bersama Sejahtera</div></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Inactive</span></div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid #e4e4e7;padding:9px 10px;color:#71717a;font-size:11px"><span>Total 3 data.</span><span>Rows per page 10 · ‹ 1 ›</span></div>
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
| **Refresh** | Muat ulang daftar unit di tabel |
| **Create org unit** | Buka modal unit baru (tampil bila punya `org:write`) |
| **Org Chart** | Bagan pohon organisasi. Unit teratas diberi badge **Root Unit**, unit nonaktif tampil pudar dengan badge **Inactive**. Bagan bisa digeser dengan klik-tahan lalu seret (*drag to pan*) |
| Kolom pencarian | *Search unit name...* — cari berdasarkan nama unit |
| **Display** | Pilih kolom tabel yang ditampilkan |
| **⋯** (aksi baris) | **Edit unit**, lalu **Deactivate unit** (unit aktif) atau **Activate unit** (unit nonaktif). Aksi nonaktif (abu-abu) bila tidak punya `org:write` |
| Footer tabel | *Total (n) data.*, **Rows per page**, dan navigasi halaman |

Bila belum ada unit, area bagan menampilkan *No org units yet. Create one to get
started.*

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Unit** | Nama unit (+ badge **Inactive** bila nonaktif), di bawahnya *(jenis) · Parent: (unit induk)* — tanda **—** bila unit tidak punya induk |
| **Status** | **Active** (hijau) atau **Inactive** (abu-abu) |

## Modal Create Org Unit

*"Define a division, department, or team in the tenant's org structure."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Unit name** | teks | Ya | Placeholder *Department Accounting* | Department Accounting |
| **Type** | pilihan | Ya | Placeholder *Select type*. Isinya diambil dari Common Codes kategori **Organization Type** | Department |
| **Parent unit** | pilihan | Tidak | Placeholder *None (root unit)*. Kosongkan untuk membuat unit teratas | Divisi Keuangan |

Tombol: **Cancel** / **Create unit**. Berhasil → toast **Org Unit Created**
(*'(nama unit)' was added successfully.*); gagal → **Failed to Create Unit**.

> **Tip:** Bila jenis unit yang dibutuhkan belum ada, pengguna dengan
> `settings:write` bisa menambahkannya langsung dari dropdown **Type** lewat
> **Add new option** (modal **Add Option**: **Name**, **Code** → **Add
> option**). Pilihan baru juga muncul di **Company Settings → Common Codes**.

## Modal Edit Org Unit

*"Rename, retype, re-parent, or assign a head for this unit."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Unit name** | teks | Ya | — | Department Accounting |
| **Type** | pilihan | Ya | Jenis yang sudah dinonaktifkan di Common Codes tetap tampil dengan akhiran *(inactive)* | Department |
| **Parent unit** | pilihan | Tidak | *None (root unit)*. Unit itu sendiri tidak muncul di daftar | Divisi Keuangan |
| **Head employee** | pencarian karyawan | Tidak | Placeholder *None*; ketik di *Type a name or employee number...* untuk mencari karyawan (nama + nomor karyawan) | Siti Rahmawati |

Tombol: **Cancel** / **Save changes**. Berhasil → toast **Org Unit Updated**;
gagal → **Failed to Update Unit**.

> Field **Head employee** hanya ada di modal edit — kepala unit ditetapkan
> setelah unit dibuat.

## Modal Deactivate Unit?

*"**(nama unit)** will be marked inactive. It can be reactivated later, but the
deactivation is rejected if the unit still has child units or assigned
employees."* Tombol **Cancel** / **Deactivate** (merah). Berhasil → toast **Org
Unit Deactivated**; ditolak/gagal → **Failed to Deactivate Unit** beserta
alasannya.

**Activate unit** langsung dijalankan tanpa konfirmasi → toast **Org Unit
Activated** (gagal → **Failed to Activate Unit**).

## Langkah — Membuat Unit Organisasi

1. Buka **HR Setting → Organizations**.
2. Klik **Create org unit**.
3. Isi **Unit name** dan pilih **Type**.
4. Pilih **Parent unit** bila unit ini berada di bawah unit lain; biarkan
   *None (root unit)* untuk unit teratas.
5. Klik **Create unit**. Unit langsung muncul di **Org Chart** dan tabel.

## Langkah — Menetapkan Kepala Unit

1. Pada baris unit, klik **⋯ → Edit unit**.
2. Di **Head employee**, ketik nama atau nomor karyawan, lalu pilih karyawannya.
3. Klik **Save changes**.

## Langkah — Menonaktifkan Unit

1. Pindahkan dulu karyawan dan sub-unit yang masih berada di unit tersebut.
2. Pada baris unit, klik **⋯ → Deactivate unit**.
3. Baca peringatan, lalu klik **Deactivate**.

## Catatan & Aturan

- Struktur organisasi berlaku untuk seluruh perusahaan, **tidak** per cabang.
  Cabang (lokasi kerja) diatur terpisah di **Company Settings → Branches**.
- Unit yang masih punya sub-unit atau karyawan tidak bisa dinonaktifkan.
- Menonaktifkan unit tidak menghapusnya; unit tetap tampil (pudar) di bagan dan
  bisa diaktifkan kembali lewat **⋯ → Activate unit**.
- Unit organisasi dipakai saat menempatkan karyawan (data karyawan & mutasi)
  dan sebagai induk slot posisi di **HR Setting → Positions**.
- Tombol **Refresh** hanya memuat ulang tabel; bagan **Org Chart** diperbarui
  otomatis setelah membuat, mengubah, menonaktifkan, atau mengaktifkan unit.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/organizations.vue` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrOrgChartNode.vue` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/CommonCodeSelect.vue` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/AppDataTable.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useOrgUnits.ts` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useEmployees.ts` (`useEmployeeSearch`) |
| Navigasi | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Modul | `modules/core-hr/**` |
