# 02 · Positions (Slot Posisi)

Mengelola slot posisi/jabatan beserta kapasitas yang disetujui (jumlah orang
yang boleh mengisi). Halaman ini menunjukkan berapa slot yang sudah terisi dan
berapa yang masih kosong di setiap unit organisasi.

**Akses:** `/tenants/hr-setting/positions` (menu **HR Setting → Positions**) ·
**Permission:** menu tampil bila punya `core_hr:write` atau `org:write`; tombol
**Create position slot** dan aksi baris (edit, nonaktifkan) hanya untuk
`org:write`

## Tampilan

<!-- ui-mock: hr-setting-positions -->
```html
<div aria-label="Mockup Positions" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Positions</div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
        <div><div style="font-weight:800;font-size:15px">Positions</div><div style="color:#71717a;font-size:11px;margin-top:3px">Slots are decoupled from employees. Track filled vs open capacity across the tenant's org structure.</div></div>
        <div style="display:flex;gap:8px;white-space:nowrap"><span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">↻ Refresh</span><span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">+ Create position slot</span></div>
      </div>
      <div style="margin-top:14px;display:flex;justify-content:space-between;border:1px solid #e4e4e7;border-radius:10px;background:#fafafa;padding:8px">
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa;width:240px">🔍 Search position title...</span>
        <div style="display:flex;gap:8px"><span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px">All units ▾</span><span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px">Display ⚙</span></div>
      </div>
      <div style="margin-top:8px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:1.6fr 1.2fr 1.4fr 0.8fr 40px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:700;text-transform:uppercase">
          <div style="padding:9px 10px">Position Title</div><div style="padding:9px 10px">Org Unit</div><div style="padding:9px 10px">Capacity (Filled / Open)</div><div style="padding:9px 10px">Status</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:1.6fr 1.2fr 1.4fr 0.8fr 40px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Staf Akuntansi</div><div style="color:#71717a;font-size:10px;font-family:monospace">pos_01J8KQ…</div></div>
          <div style="padding:9px 10px">Department Accounting</div>
          <div style="padding:9px 10px"><div style="display:flex;justify-content:space-between;font-size:11px"><span style="font-weight:500">3/4 filled</span><span style="color:#71717a">1 open</span></div><div style="margin-top:5px;height:5px;background:#f4f4f5;border-radius:9px"><div style="width:75%;height:5px;background:#2563eb;border-radius:9px"></div></div></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.6fr 1.2fr 1.4fr 0.8fr 40px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Supervisor Gudang</div><div style="color:#71717a;font-size:10px;font-family:monospace">pos_01J9AB…</div></div>
          <div style="padding:9px 10px">Divisi Operasional</div>
          <div style="padding:9px 10px"><div style="display:flex;justify-content:space-between;font-size:11px"><span style="font-weight:500">2/2 filled</span><span style="color:#71717a">0 open</span></div><div style="margin-top:5px;height:5px;background:#f4f4f5;border-radius:9px"><div style="width:100%;height:5px;background:#2563eb;border-radius:9px"></div></div></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.6fr 1.2fr 1.4fr 0.8fr 40px;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Koordinator Ekspor</div><div style="color:#71717a;font-size:10px;font-family:monospace">pos_01J7ZX…</div></div>
          <div style="padding:9px 10px">Tim Ekspor</div>
          <div style="padding:9px 10px"><div style="display:flex;justify-content:space-between;font-size:11px"><span style="font-weight:500">0/1 filled</span><span style="color:#71717a">1 open</span></div><div style="margin-top:5px;height:5px;background:#f4f4f5;border-radius:9px"></div></div>
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
| **Refresh** | Muat ulang daftar posisi dan daftar unit organisasi |
| **Create position slot** | Buka modal posisi baru (tampil bila punya `org:write`) |
| Kolom pencarian | *Search position title...* — cari berdasarkan nama posisi |
| Filter unit | **All units** atau salah satu unit organisasi yang dipakai posisi |
| **Display** | Pilih kolom tabel yang ditampilkan |
| **⋯** (aksi baris) | **Edit position**, **Deactivate position**. Aksi nonaktif (abu-abu) bila tidak punya `org:write` |
| Footer tabel | *Total (n) data.*, **Rows per page**, dan navigasi halaman |

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Position Title** | Nama posisi + kode unik posisi (teks kecil) |
| **Org Unit** | Unit organisasi tempat posisi berada, atau **—** bila tidak ditautkan ke unit |
| **Capacity (Filled / Open)** | *(terisi)/(kapasitas) filled* dan *(sisa) open*, dengan bilah progres terisi |
| **Status** | **Active** (hijau) atau **Inactive** (abu-abu) |

## Modal Create Position Slot / Edit Position Slot

*"Establish approved job slot capacity decoupled from employee assignments."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Position Title** | teks | Ya | Placeholder *Senior Backend Engineer* | Staf Akuntansi |
| **Org Unit** | pilihan | Tidak | Placeholder *Select org unit*. Daftar unit dari **HR Setting → Organizations** | Department Accounting |
| **Approved Capacity** | angka | Tidak | Minimal 1, default 1. Jumlah orang yang disetujui untuk posisi ini | 4 |

Tombol: **Cancel** / **Create position** (tambah) atau **Save changes** (ubah).

Pesan: **Posisi Dibuat** (*'(nama posisi)' berhasil ditambahkan.*) atau **Posisi
Diperbarui**; gagal → **Gagal Membuat Posisi** / **Gagal Memperbarui Posisi**.

## Menonaktifkan Posisi

**⋯ → Deactivate position** langsung menonaktifkan posisi **tanpa konfirmasi**.
Berhasil → toast **Posisi Dinonaktifkan**; gagal → **Gagal Menonaktifkan
Posisi** beserta alasannya.

> **Penting:** Halaman ini belum menyediakan aksi untuk mengaktifkan kembali
> posisi yang sudah **Inactive**. Pastikan memilih baris yang benar sebelum
> mengklik **Deactivate position**.

## Langkah — Membuat Slot Posisi

1. Pastikan unit organisasinya sudah ada di **HR Setting → Organizations**.
2. Buka **HR Setting → Positions**.
3. Klik **Create position slot**.
4. Isi **Position Title**, pilih **Org Unit**, dan atur **Approved Capacity**.
5. Klik **Create position**. Posisi muncul di tabel dengan status **Active**.

## Langkah — Menambah Kapasitas Posisi

1. Pada baris posisi, klik **⋯ → Edit position**.
2. Ubah **Approved Capacity** (mis. dari 4 menjadi 6).
3. Klik **Save changes**. Kolom **Capacity (Filled / Open)** ikut diperbarui.

## Catatan & Aturan

- Posisi adalah **slot** yang terpisah dari karyawan: kapasitas menunjukkan
  jumlah yang disetujui, sedangkan angka *filled* dihitung dari karyawan yang
  ditempatkan di posisi tersebut.
- Posisi dipilih di field posisi/jabatan saat menambah karyawan, mengubah data
  karyawan, dan mengajukan mutasi.
- Seperti unit organisasi, posisi berlaku untuk seluruh perusahaan, **tidak**
  per cabang.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/positions.vue` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/AppDataTable.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/usePositions.ts` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useOrgUnits.ts` |
| Navigasi | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Modul | `modules/core-hr/**` |
