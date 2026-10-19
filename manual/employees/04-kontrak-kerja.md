# 04 · Kontrak Kerja

Tab **Contracts** pada halaman detail karyawan. Mencatat riwayat kontrak kerja,
memperpanjang, mengakhiri kontrak dini, dan mengelola dokumen kontrak.

**Akses:** tab di `/tenants/employee/:id` · **Permission:** `contracts:write`
(lihat umumnya cukup `employees:read`)

## Tampilan

<!-- ui-mock: employees-contracts -->
```html
<div aria-label="Mockup Kontrak Kerja" style="font-family:Inter,system-ui,sans-serif;width:760px;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px;padding:18px 20px">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div style="font-weight:700;font-size:12px;color:#3f3f46">Kontrak Kerja</div>
    <span style="border:1px solid #2563eb;color:#2563eb;border-radius:8px;padding:5px 12px;font-weight:600">+ Kontrak Baru</span>
  </div>
  <div style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:12px;margin-top:10px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700">PKWT (Waktu Tertentu)</span><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 8px;font-size:11px">Aktif</span></div>
        <div style="color:#71717a;font-size:11px;margin-top:4px">2024-02-01 — 2025-01-31</div>
        <div style="color:#71717a;font-size:11px;font-style:italic;margin-top:3px">"SK No. 042/HR/2024"</div>
      </div>
      <span style="color:#71717a">⋮</span>
    </div>
  </div>
  <div style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:12px;margin-top:8px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700">PKWTT (Waktu Tidak Tertentu)</span><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:2px 8px;font-size:11px">Digantikan</span></div>
        <div style="color:#71717a;font-size:11px;margin-top:4px">2023-01-01 — Tidak terbatas</div>
        <div style="color:#71717a;font-size:11px;margin-top:3px">Perpanjangan dari PKWT (2022-01-01)</div>
      </div>
      <span style="color:#71717a">⋮</span>
    </div>
  </div>
</div>
```
<!-- /ui-mock -->

> **Prompt gambar:** "Ubah HTML di dalam blok `ui-mock` menjadi screenshot UI
> aplikasi HR backoffice yang realistis dan utuh: render semua elemen persis
> seperti tertulis, pertahankan layout, warna, dan teks. Gunakan data nyata
> bergaya perusahaan Indonesia. Latar terang, sudut membulat, bayangan halus.
> Keluarkan sebagai satu gambar."

## Elemen

| Elemen | Fungsi |
|---|---|
| **Kontrak Baru** | Buka modal kontrak baru |
| Kartu kontrak | Tipe, status, periode, dan catatan kontrak |
| **⋮** (aksi baris) | Kelola Dokumen, Perpanjang, Akhiri Kontrak |

## Status Kontrak

| Status | Warna | Arti |
|---|---|---|
| **Aktif** | Hijau | Kontrak sedang berlaku |
| **Kadaluarsa** | Merah | Melewati tanggal berakhir |
| **Diakhiri** | Netral | Diakhiri dini |
| **Digantikan** | Netral | Sudah digantikan kontrak perpanjangan |

## Tipe Kontrak

PKWT (Waktu Tertentu), PKWTT (Waktu Tidak Tertentu), Permanent, Contract,
Intern, Outsource.

## Modal Kontrak Baru / Perpanjang

| Field | Wajib | Catatan |
|---|---|---|
| **Tipe Kontrak** | Ya | Salah satu tipe di atas |
| **Tanggal Mulai** | Ya | Default: hari ini |
| **Tanggal Berakhir** | Tidak | Kosongkan bila tidak terbatas (PKWTT/Permanent) |
| **Catatan** | Tidak | Nomor SK, catatan perpanjangan, dll. |

Tombol: **Batal** / **Simpan**. Kontrak baru dicatat sebagai riwayat terpisah
(tidak menimpa kontrak lama). Perpanjangan otomatis menaut ke kontrak
sebelumnya.

## Modal Akhiri Kontrak

Menampilkan peringatan **"Penutupan dini"** — kontrak ditandai diakhiri dan
tidak bisa diaktifkan kembali. Isi **Alasan / Catatan** lalu klik **Akhiri
Kontrak**.

## Modal Dokumen Kontrak

Daftar dokumen (nama file, jenis, tanggal unggah) + unggah baru.
**Jenis Dokumen**: File Kontrak, Addendum, Lainnya. Format file: JPG, PNG,
WEBP, PDF. Setelah file siap, klik **Simpan Dokumen**.

## Langkah — Menambah Kontrak

1. Buka detail karyawan → tab **Contracts**.
2. Klik **Kontrak Baru**.
3. Pilih **Tipe Kontrak**, isi **Tanggal Mulai** (dan **Tanggal Berakhir**
   bila ada), tambahkan **Catatan**.
4. Klik **Simpan**.

## Langkah — Perpanjang / Akhiri

1. Pada kartu kontrak yang berstatus **Aktif**, klik **⋮**.
2. Pilih **Perpanjang** (isi tipe & periode baru) atau **Akhiri Kontrak**
   (isi alasan).
3. Konfirmasi.

> **Penting:** **Perpanjang** dan **Akhiri Kontrak** hanya aktif untuk kontrak
> berstatus **Aktif**.

## Sumber

| Jenis | Path |
|---|---|
| Panel | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrContractsPanel.vue` |
| Halaman induk | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/[id].vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useContracts.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
