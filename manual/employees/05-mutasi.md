# 05 · Mutasi (Daftar & Pengajuan)

Menu **Mutasi** mengelola pengajuan perubahan siklus karyawan secara **massal**
(satu batch bisa berisi banyak karyawan). Setiap pengajuan **menunggu
persetujuan** sebelum diterapkan. Halaman ini berisi daftar batch dan form
pengajuan.

**Akses:** `/tenants/employee/mutasi` · **Pengajuan:** `mutation_request:submit`

## 5.1 Daftar Mutasi

### Tampilan

<!-- ui-mock: mutasi-list -->
```html
<div aria-label="Mockup Daftar Mutasi" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:6px 10px 6px 22px;color:#fff">Employees Info</div>
    <div style="padding:6px 10px 6px 22px;color:#bfdbfe">Mutasi</div>
    <div style="padding:8px 10px;color:#bfdbfe">HR Setting</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e4e4e7;padding-bottom:14px">
      <div>
        <div style="font-size:17px;font-weight:700">Mutasi</div>
        <div style="color:#71717a;font-size:11px;margin-top:3px;max-width:520px">Ajukan mutasi, promosi, perubahan status, hingga offboarding untuk satu atau beberapa karyawan sekaligus — setiap perubahan menunggu persetujuan sebelum diterapkan.</div>
      </div>
      <div style="display:flex;gap:8px">
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:7px 12px;background:#fff">Refresh</span>
        <span style="background:#2563eb;color:#fff;border-radius:8px;padding:7px 12px;font-weight:600">⇄ Ajukan Mutasi Massal</span>
      </div>
    </div>
    <div style="border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;margin-top:14px;background:#fff">
      <div style="display:grid;grid-template-columns:1.4fr 1.5fr 1fr 2fr;background:#f4f4f5;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#71717a;font-weight:700">
        <div style="padding:10px">Diajukan Oleh</div><div style="padding:10px">Alasan</div><div style="padding:10px">Jumlah Karyawan</div><div style="padding:10px">Status</div>
      </div>
      <div style="display:grid;grid-template-columns:1.4fr 1.5fr 1fr 2fr;border-top:1px solid #f4f4f5;align-items:center">
        <div style="padding:10px"><div style="font-weight:700">Siti Rahmawati</div><div style="color:#71717a;font-size:10px">2026-03-04 09:12</div></div>
        <div style="padding:10px;color:#71717a;font-size:11px">Rotasi kuartalan tim Sales</div>
        <div style="padding:10px;font-weight:600">3 karyawan</div>
        <div style="padding:10px;display:flex;gap:4px;flex-wrap:wrap"><span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:2px 8px;font-size:11px">Menunggu Persetujuan</span><span style="background:#fffbeb;color:#b45309;border-radius:6px;padding:2px 8px;font-size:11px">2 Menunggu</span><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 8px;font-size:11px">1 Disetujui</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1.4fr 1.5fr 1fr 2fr;border-top:1px solid #f4f4f5;align-items:center">
        <div style="padding:10px"><div style="font-weight:700">Budi Santoso</div><div style="color:#71717a;font-size:10px">2026-02-20 14:03</div></div>
        <div style="padding:10px;color:#71717a;font-size:11px">Promosi tahunan</div>
        <div style="padding:10px;font-weight:600">1 karyawan</div>
        <div style="padding:10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 8px;font-size:11px">Disetujui</span></div>
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

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Diajukan Oleh** | Nama pengaju + waktu pengajuan |
| **Alasan** | Catatan pengajuan batch |
| **Jumlah Karyawan** | Total karyawan dalam batch |
| **Status** | Badge status batch + rincian per-baris (Menunggu/Disetujui/Ditolak/Gagal) |

### Status Batch

| Status | Arti |
|---|---|
| **Menunggu Persetujuan** | Belum ada baris yang diproses |
| **Sebagian Diproses** | Sebagian baris disetujui/ditolak |
| **Disetujui** | Semua baris disetujui |
| **Ditolak** | Batch ditolak |
| **Gagal Diterapkan** | Sebagian/semua gagal saat penerapan |

## 5.2 Ajukan Mutasi Massal

**Akses:** `/tenants/employee/mutasi/create` · **Edit:** `?batchId=<id>`

### Tampilan

<!-- ui-mock: mutasi-create -->
```html
<div aria-label="Mockup Ajukan Mutasi Massal" style="font-family:Inter,system-ui,sans-serif;width:860px;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px;padding:18px 20px">
  <div style="border-bottom:1px solid #e4e4e7;padding-bottom:12px">
    <div style="color:#71717a;font-size:11px">← Kembali ke Daftar Mutasi</div>
    <div style="font-size:17px;font-weight:700;margin-top:4px">Ajukan Mutasi Massal</div>
    <div style="color:#71717a;font-size:11px;margin-top:3px">Tambahkan satu atau beberapa karyawan dengan jenis perubahan siklusnya masing-masing. Pengajuan akan menunggu persetujuan sebelum diterapkan.</div>
  </div>
  <div style="margin-top:14px">
    <div style="font-size:11px;font-weight:600">Alasan / Catatan Pengajuan Batch</div>
    <div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:7px 10px;color:#a1a1aa;margin-top:3px">Contoh: Rotasi kuartalan tim Sales...</div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
    <div style="font-size:12px;font-weight:600">Karyawan (2)</div>
    <span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">+ Tambah Karyawan</span>
  </div>
  <div style="border:1px solid #e4e4e7;border-radius:10px;background:#fff;margin-top:8px">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px">
      <div><div style="display:flex;align-items:center;gap:8px"><span style="font-weight:600">Budi Santoso</span><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:2px 8px;font-size:11px">Promosi</span></div><div style="color:#71717a;font-size:11px;margin-top:3px">EMP-0001 · Software Engineer — Engineering</div></div>
      <div style="display:flex;gap:6px"><span style="color:#71717a">✎</span><span style="color:#dc2626">🗑</span></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-top:1px solid #f4f4f5">
      <div><div style="display:flex;align-items:center;gap:8px"><span style="font-weight:600">Dewi Lestari</span><span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:2px 8px;font-size:11px">Active ➔ Resigned</span></div><div style="color:#71717a;font-size:11px;margin-top:3px">EMP-0002 · HR Officer — People Ops</div></div>
      <div style="display:flex;gap:6px"><span style="color:#71717a">✎</span><span style="color:#dc2626">🗑</span></div>
    </div>
  </div>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;border-top:1px solid #e4e4e7;padding-top:12px">
    <span style="border:1px solid #e4e4e7;border-radius:8px;padding:6px 14px;background:#fff">Batal</span>
    <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 14px;font-weight:600">✓ Kirim Pengajuan</span>
  </div>
</div>
```
<!-- /ui-mock -->

> **Prompt gambar:** "Ubah HTML di dalam blok `ui-mock` menjadi screenshot UI
> aplikasi HR backoffice yang realistis dan utuh: render semua elemen persis
> seperti tertulis, pertahankan layout, warna, dan teks. Gunakan data nyata
> bergaya perusahaan Indonesia. Latar terang, sudut membulat, bayangan halus.
> Keluarkan sebagai satu gambar."

### Jenis Perubahan Siklus (6 pilihan)

| Pilihan | Badge | Efek |
|---|---|---|
| **Lulus Masa Percobaan** | Probation ➔ Active | Ubah status Probation → Active |
| **Promosi Jabatan** | Promosi | Assignment baru (tanpa menimpa riwayat) |
| **Mutasi Unit / Posisi** | Mutasi | Assignment baru (pindah unit/posisi) |
| **Pengunduran Diri (Resign)** | Active ➔ Resigned | Status → Resigned (mulai offboarding) |
| **Pemberhentian / PHK** | Terminated | Status → Terminated |
| **Selesaikan Offboarding** | Offboarded | Cabut akses login & arsipkan data |

### Modal Tambah/Edit Karyawan

| Field | Wajib | Catatan |
|---|---|---|
| **Pilih Karyawan** | Ya | Pencarian server (nama/nomor karyawan); satu karyawan hanya boleh sekali per batch |
| **Jenis Perubahan Siklus** | Ya | Salah satu dari 6 pilihan di atas |
| **Tanggal Efektif** | Ya | — |
| **Unit Tujuan** | Ya* | Hanya untuk Promosi/Mutasi |
| **Posisi Tujuan** | Ya* | Hanya untuk Promosi/Mutasi; dibatasi unit terpilih |
| **Alasan / Catatan Penugasan** | Tidak | — |
| **Cabut hak akses akun login sistem (Auth)** | — | Hanya untuk **Selesaikan Offboarding** (default: dicentang) |

Tombol: **Batal** / **Simpan Baris**.

> **Penting:** Baris dengan status **Disetujui** bersifat kekal — tombol
> edit/hapus disembunyikan dan wajib dipertahankan saat menyimpan perubahan.

### Ajukan vs Edit

- **Create** (`/create`): tombol **Kirim Pengajuan**. Setelah berhasil, diarahkan
  ke halaman detail batch.
- **Edit** (`/create?batchId=<id>`): judul **Edit Pengajuan Mutasi**, tombol
  **Simpan Perubahan**. Perubahan mencakup tambah baris baru, revisi baris
  non-approved, hapus baris, dan ubah alasan batch.

## Langkah — Mengajukan Mutasi

1. Buka menu **Employees → Mutasi**.
2. Klik **Ajukan Mutasi Massal**.
3. Isi **Alasan / Catatan Pengajuan Batch**.
4. Klik **Tambah Karyawan**, pilih karyawan dan **Jenis Perubahan Siklus**,
   lengkapi field terkait, klik **Simpan Baris**.
5. Ulangi untuk karyawan lain.
6. Klik **Kirim Pengajuan** → diarahkan ke detail batch
   ([`06-detail-mutasi.md`](./06-detail-mutasi.md)).

## Pesan Validasi

| Kondisi | Pesan |
|---|---|
| Belum ada baris saat kirim | **"Tambahkan minimal satu karyawan"** |
| Karyawan belum dipilih | **"Pilih karyawan terlebih dahulu"** |
| Promosi/Mutasi tanpa unit/posisi | **"Pilih unit & posisi tujuan terlebih dahulu"** |
| Karyawan duplikat dalam satu batch | **"Karyawan ini sudah ditambahkan dalam pengajuan ini"** |

## Sumber

| Jenis | Path |
|---|---|
| Daftar | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/mutasi/index.vue` |
| Pengajuan | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/mutasi/create.vue` |
| Editor batch | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/MutationBatchLineEditor.vue` |
| Field baris | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/MutationLineFieldsForm.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useMutationRequests.ts`, `useEmployees.ts`, `useOrgUnits.ts`, `usePositions.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
