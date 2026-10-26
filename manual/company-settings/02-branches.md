# 02 · Branches (Cabang)

Mengelola cabang perusahaan. Cabang dipakai sebagai lokasi kerja karyawan,
penentu zona waktu untuk absensi, dan **cakupan (scope)** saat memberi peran ke
pengguna — mis. HR yang hanya mengelola cabang Surabaya.

**Akses:** `/tenants/settings/branches` (tab **Branches**) · **Permission:**
`branch:read` (lihat), `branch:write` (tambah, ubah, tutup)

## Tampilan

<!-- ui-mock: company-branches -->
```html
<div aria-label="Mockup Branches" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
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
      <span style="padding:6px 10px">Overview</span>
      <span style="padding:6px 10px;border-radius:6px;background:#f4f4f5;color:#2563eb;font-weight:600">Branches</span>
      <span style="padding:6px 10px">Common Codes</span><span style="padding:6px 10px">Billing</span><span style="padding:6px 10px">Users</span><span style="padding:6px 10px">Roles &amp; Permissions</span>
    </div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
        <div><div style="font-weight:800;font-size:15px">Kelola Cabang (Branch Self-Service)</div><div style="color:#71717a;font-size:11px;margin-top:3px">Setiap cabang baru dapat dijadikan cakupan (scope) saat menetapkan peran ke pengguna. Cabang default tidak dapat ditutup.</div></div>
        <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600;white-space:nowrap">+ Tambah Cabang</span>
      </div>
      <div style="margin-top:12px;border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa;width:260px">Cari nama cabang...</div>
      <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:1.6fr 1fr 0.8fr 1fr 40px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
          <div style="padding:9px 10px">Nama Cabang</div><div style="padding:9px 10px">Cabang Default</div><div style="padding:9px 10px">Status</div><div style="padding:9px 10px">Zona Waktu</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:1.6fr 1fr 0.8fr 1fr 40px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Jakarta HQ</div><div style="color:#a1a1aa;font-size:10px;font-family:monospace">br_01J8KQ…</div></div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Default</span></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Aktif</span></div>
          <div style="padding:9px 10px">Default</div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.6fr 1fr 0.8fr 1fr 40px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Kantor Cabang Makassar</div><div style="color:#a1a1aa;font-size:10px;font-family:monospace">br_01J9AB…</div></div>
          <div style="padding:9px 10px"></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Aktif</span></div>
          <div style="padding:9px 10px">Asia/Makassar</div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.6fr 1fr 0.8fr 1fr 40px;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:600">Gudang Bekasi</div><div style="color:#a1a1aa;font-size:10px;font-family:monospace">br_01J7ZX…</div></div>
          <div style="padding:9px 10px"></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Ditutup</span></div>
          <div style="padding:9px 10px">Default</div><div style="color:#71717a">⋯</div>
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
| **Tambah Cabang** | Buka modal cabang baru (tampil bila punya `branch:write`) |
| Kolom pencarian | *Cari nama cabang...* |
| **⋯** (aksi baris) | **Edit Nama**, **Tutup Cabang** |

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Nama Cabang** | Nama cabang + kode unik cabang (teks kecil) |
| **Cabang Default** | Badge **Default** untuk cabang utama perusahaan |
| **Status** | **Aktif** (hijau) atau **Ditutup** (abu-abu) |
| **Zona Waktu** | Zona waktu cabang, atau *Default* bila mengikuti zona waktu perusahaan |

## Modal Tambah Cabang Baru / Edit Cabang

*"Nama & zona waktu cabang — detail lokasi belum tersedia."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Nama Cabang** | teks | Ya | — | Kantor Cabang Surabaya |
| **Zona Waktu** | pilihan | Tidak | *Ikuti default tenant/platform*, **WIB — Asia/Jakarta**, **WITA — Asia/Makassar**, **WIT — Asia/Jayapura**. Menentukan jam yang dipakai untuk menghitung telat/lembur karyawan cabang ini | WITA — Asia/Makassar |

Tombol: **Batal** / **Simpan**. Pesan: **Cabang Ditambahkan 🎉** atau
**Cabang Diperbarui**; bila nama kosong → **Nama cabang wajib diisi**.

## Modal Tutup Cabang?

*"Cabang **(nama cabang)** tidak lagi dapat menerima operasional baru. Tindakan ini
tidak dapat dibatalkan."* Tombol **Batal** / **Tutup Cabang** (merah). Berhasil
→ toast **Cabang Ditutup**.

> **Penting:** **Tutup Cabang** tidak bisa dipilih untuk cabang **Default**
> atau cabang yang sudah **Ditutup**. Menutup cabang bersifat permanen.

## Langkah — Menambah Cabang

1. Buka **Company Settings → Branches**.
2. Klik **Tambah Cabang**.
3. Isi **Nama Cabang** dan pilih **Zona Waktu** bila berbeda dari kantor pusat.
4. Klik **Simpan**. Cabang langsung bisa dipilih sebagai cabang kerja karyawan
   dan sebagai cakupan peran pengguna.

## Langkah — Menutup Cabang

1. Pada baris cabang, klik **⋯ → Tutup Cabang**.
2. Baca peringatan, lalu klik **Tutup Cabang**.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/settings/branches.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useTenantBranches.ts` |
| Modul | `modules/platform/tenant/**` |
