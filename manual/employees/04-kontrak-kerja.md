# 04 · Kontrak Kerja

Tab **Contracts** pada halaman detail karyawan. Mencatat riwayat kontrak kerja,
memperpanjang, mengakhiri kontrak dini, dan mengelola dokumen kontrak. Kontrak
pertama juga bisa dibuat langsung dari form **Add Employee**
([`02-tambah-karyawan.md`](./02-tambah-karyawan.md)).

**Akses:** tab di `/tenants/employee/:id` · **Permission:** `employees:read`
(lihat), `contracts:write` (tambah/perpanjang/akhiri/kelola dokumen)

## Tampilan

<!-- ui-mock: employees-contracts -->
```html
<div aria-label="Mockup Kontrak Kerja" style="font-family:Inter,system-ui,sans-serif;width:760px;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px;padding:18px 20px">
  <div style="display:flex;gap:4px;border-bottom:1px solid #e4e4e7;margin-bottom:12px;font-size:12px">
    <span style="padding:8px 14px;color:#71717a">Profile</span>
    <span style="padding:8px 14px;border-bottom:2px solid #2563eb;color:#2563eb;font-weight:600">Contracts</span>
    <span style="padding:8px 14px;color:#71717a">Work Policy</span>
    <span style="padding:8px 14px;color:#71717a">Others</span>
    <span style="padding:8px 14px;color:#71717a">Account Settings</span>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div style="font-weight:700;font-size:12px;color:#3f3f46">Employment Contracts</div>
    <span style="border:1px solid #2563eb;color:#2563eb;border-radius:8px;padding:5px 12px;font-weight:600">+ New Contract</span>
  </div>
  <div style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:12px;margin-top:10px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700">PKWT</span><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 8px;font-size:11px">Active</span></div>
        <div style="color:#71717a;font-size:11px;margin-top:4px;font-family:monospace">2025-02-01 — 2026-01-31</div>
        <div style="color:#a1a1aa;font-size:12px;font-style:italic;margin-top:3px">"SK No. 042/HR/2025"</div>
        <div style="color:#71717a;font-size:11px;margin-top:3px">Renewal of PKWT (2024-02-01)</div>
      </div>
      <span style="color:#71717a">⋮</span>
    </div>
  </div>
  <div style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:12px;margin-top:8px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700">PKWT</span><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:2px 8px;font-size:11px">Superseded</span></div>
        <div style="color:#71717a;font-size:11px;margin-top:4px;font-family:monospace">2024-02-01 — 2025-01-31</div>
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
| **New Contract** | Buka modal kontrak baru (`contracts:write`) |
| Kartu kontrak | Tipe, badge status, periode (*Indefinite* bila tanpa tanggal berakhir), remark, dan keterangan *Renewal of …* bila hasil perpanjangan |
| **⋮** (aksi kartu) | **Manage Documents**, **Renew**, **Terminate Contract** |
| Kosong | *No contracts recorded for this employee yet.* |

## Status Kontrak

| Status | Warna | Arti |
|---|---|---|
| **Active** | Hijau | Kontrak sedang berlaku |
| **Expired** | Merah | Melewati tanggal berakhir |
| **Terminated** | Netral | Diakhiri dini |
| **Superseded** | Netral | Sudah digantikan kontrak perpanjangan |

## Tipe Kontrak

Tipe kontrak diambil dari master **common code** kategori `contract_type`
(mis. PKWT, PKWTT). Daftarnya mengikuti pengaturan tenant, bukan daftar tetap.
Tipe kontrak aktif juga menjadi **Employment Type** di ringkasan profil.

## Modal New Contract / Renew Contract

Deskripsi modal: *"A new contract is recorded as a separate history entry — it
does not overwrite the previous contract."*

| Field | Wajib | Catatan |
|---|---|---|
| **Contract Type** | Ya | Pilih dari common code `contract_type`; saat **Renew** terisi tipe kontrak lama |
| **Start Date** | Ya | Default: hari ini |
| **End Date** | Tidak | Nonaktif bila **No end date** dinyalakan |
| **No end date** | — | Switch untuk kontrak tanpa batas waktu |
| **Remark** | Tidak | Nomor SK, catatan, dll. |

Tombol: **Cancel** / **Save**. Bila tipe kosong muncul toast *"Select a
contract type"*. Perpanjangan otomatis menaut ke kontrak sebelumnya, yang lalu
berstatus **Superseded**.

## Modal Terminate Contract

Menampilkan peringatan **Early termination** — *The contract will be marked as
terminated and cannot be reactivated.* Isi **Reason / Remark** lalu klik
**Terminate Contract**.

## Modal Contract Documents

Daftar dokumen kontrak (nama file, jenis, tanggal unggah) atau *No documents
attached yet.*, lalu unggah baru (`contracts:write`):

1. Pilih **Document Type**: Contract File, Addendum, atau Other.
2. Klik/seret file (JPG, PNG, WEBP, PDF) ke area unggah.
3. Setelah file siap, klik **Save Document**.

## Langkah — Menambah Kontrak

1. Buka detail karyawan → tab **Contracts**.
2. Klik **New Contract**.
3. Pilih **Contract Type**, isi **Start Date** (dan **End Date** atau nyalakan
   **No end date**), tambahkan **Remark** bila perlu.
4. Klik **Save**.

## Langkah — Perpanjang / Akhiri

1. Pada kartu kontrak berstatus **Active**, klik **⋮**.
2. Pilih **Renew** (isi periode baru → **Save**) atau **Terminate Contract**
   (isi alasan → **Terminate Contract**).

> **Penting:** **Renew** dan **Terminate Contract** hanya aktif untuk kontrak
> berstatus **Active**.

## Sumber

| Jenis | Path |
|---|---|
| Panel | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrContractsPanel.vue` |
| Halaman induk | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/[id].vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useContracts.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
