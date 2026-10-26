# 01 · Overview

Halaman pembuka Company Settings. Menampilkan ringkasan perusahaan (nama,
status, zona waktu, jumlah cabang, paket langganan) dan pintu masuk untuk
mengubah info perusahaan.

**Akses:** `/tenants/settings` (tab **Overview**) · **Permission:**
melihat — semua admin perusahaan; **Edit Info Perusahaan** — `settings:write`

## Tampilan

<!-- ui-mock: company-overview -->
```html
<div aria-label="Mockup Company Settings Overview" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
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
      <span style="padding:6px 10px;border-radius:6px;background:#f4f4f5;color:#2563eb;font-weight:600">Overview</span>
      <span style="padding:6px 10px">Branches</span><span style="padding:6px 10px">Common Codes</span><span style="padding:6px 10px">Billing</span><span style="padding:6px 10px">Users</span><span style="padding:6px 10px">Roles &amp; Permissions</span>
    </div>
    <div style="padding:18px 20px">
      <section style="border:1px solid #e4e4e7;background:#fff;border-radius:18px;padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f4f4f5;padding-bottom:14px">
          <div style="display:flex;gap:12px;align-items:center">
            <div style="width:44px;height:44px;border-radius:12px;background:#dbeafe;color:#2563eb;display:grid;place-items:center;font-size:20px">🏢</div>
            <div>
              <div style="font-weight:800;font-size:15px">PT Maju Bersama Sejahtera <span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:11px;font-weight:600">active</span> <span style="border:1px solid #d4d4d8;color:#52525b;border-radius:6px;padding:1px 8px;font-size:11px;font-weight:500">🕒 Zona Waktu: Asia/Jakarta</span></div>
              <div style="color:#71717a;font-size:11px;font-family:monospace;margin-top:2px">maju-bersama</div>
            </div>
          </div>
          <span style="border:1px solid #d4d4d8;border-radius:8px;padding:5px 10px;font-size:12px">✎ Edit Info Perusahaan</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px">
          <div style="border:1px solid #e4e4e7;background:#fafafa;border-radius:14px;padding:12px"><div style="color:#71717a;font-size:11px">Jumlah Cabang</div><div style="font-weight:800;font-family:monospace;font-size:15px;margin-top:3px">3</div><div style="color:#71717a;font-size:10px">termasuk cabang default</div></div>
          <div style="border:1px solid #e4e4e7;background:#fafafa;border-radius:14px;padding:12px"><div style="color:#71717a;font-size:11px">Paket Langganan</div><div style="font-weight:800;font-family:monospace;font-size:15px;margin-top:3px">Business</div></div>
          <div style="border:1px solid #e4e4e7;background:#fafafa;border-radius:14px;padding:12px"><div style="color:#71717a;font-size:11px">Status Langganan</div><div style="margin-top:5px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:11px;font-weight:600">Active</span></div></div>
        </div>
      </section>
      <section style="border:1px solid #e4e4e7;background:#fff;border-radius:18px;padding:18px;margin-top:14px">
        <div style="font-weight:800">Kelola Perusahaan</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px;font-size:12px;text-align:center">
          <span style="border:1px solid #d4d4d8;border-radius:8px;padding:7px">📍 Cabang</span><span style="border:1px solid #d4d4d8;border-radius:8px;padding:7px">🧾 Billing</span><span style="border:1px solid #d4d4d8;border-radius:8px;padding:7px">👥 Pengguna</span><span style="border:1px solid #d4d4d8;border-radius:8px;padding:7px">🛡 Peran &amp; Akses</span>
        </div>
      </section>
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
| Bar tab | **Overview**, **Branches**, **Common Codes**, **Billing**, **Users**, **Roles & Permissions** — berlaku di semua halaman Company Settings |
| Nama perusahaan + badge status | Nama dan status tenant (mis. `active`) |
| Badge **Zona Waktu** | Zona waktu default perusahaan; kuning *Zona Waktu: Belum ditentukan* bila belum diatur |
| Kode perusahaan | Teks kecil di bawah nama (slug), dipakai sebagai pengenal unik perusahaan |
| **Edit Info Perusahaan** | Buka modal ubah profil perusahaan |
| **Jumlah Cabang** | Jumlah cabang, termasuk cabang default |
| **Paket Langganan** / **Status Langganan** | Nama paket dan status langganan (`Active`, `Trialing`, `Past Due`, `Canceled`) |
| **Kelola Perusahaan** | Pintasan ke **Cabang**, **Billing**, **Pengguna**, **Peran & Akses** |

## Modal Edit Info Perusahaan

*"Profil lengkap perusahaan, legalitas, dan alamat."*

| Bagian | Field | Wajib | Contoh / Catatan |
|---|---|---|---|
| **Identitas Perusahaan** | **Company Name** | Ya | PT Maju Bersama Sejahtera |
| | **Director Name** | Tidak | Andi Wijaya |
| | **Tel No** | Tidak | 021xxxxxxx |
| | **Email** | Tidak | hr@majubersama.co.id |
| | **Homepage** | Tidak | https://majubersama.co.id |
| **Legalitas & Bisnis** | **Business Type** | Tidak | Perdagangan / Jasa |
| | **Business Register No (SIUP)** | Tidak | — |
| | **NPWP Company** | Tidak | 00.000.000.0-000.000 |
| **Alamat** | **Address (Nation)** | Tidak | Default: Indonesia |
| | **Address (Province)** | Tidak | Pilih dari daftar provinsi |
| | **Address (City)** | Tidak | Aktif setelah provinsi dipilih; mengganti provinsi mengosongkan kota |
| | **Address (Detail)** | Tidak | Jl. Merdeka No. 10, RT/RW, patokan, kode pos |
| — | **Zona Waktu Default Perusahaan** | Tidak | *Belum ditentukan (ikuti default platform)*, **WIB — Asia/Jakarta**, **WITA — Asia/Makassar**, **WIT — Asia/Jayapura** |

Tombol: **Batal** / **Simpan Perubahan**. Berhasil → toast **Info Perusahaan
Diperbarui**; gagal → **Gagal Memperbarui Info Perusahaan**.

> **Penting:** Zona waktu default dipakai oleh setiap cabang yang belum punya
> zona waktu sendiri, dan menentukan jam yang dipakai untuk menghitung
> keterlambatan & lembur. Zona waktu per cabang diatur di tab **Branches**.

## Langkah — Melengkapi Profil Perusahaan

1. Buka **Company Settings** (tab **Overview** terbuka otomatis).
2. Klik **Edit Info Perusahaan**.
3. Isi identitas, legalitas, dan alamat perusahaan.
4. Pilih **Zona Waktu Default Perusahaan** sesuai lokasi kantor pusat.
5. Klik **Simpan Perubahan**.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/settings/index.vue` |
| Wrapper & tab | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/settings.vue` |
| Modal | `HR-SYSTEM-BACKOFFICE/app/components/tenants/CompanyInfoEditModal.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useMyTenant.ts`, `useMyBilling.ts`, `useTenantBranches.ts`, `useRegions.ts` |
| Modul | `modules/platform/tenant/**` |
