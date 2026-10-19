# 06 · Detail Mutasi (Persetujuan)

Halaman detail satu batch mutasi. Menampilkan seluruh baris pengajuan dan
memungkinkan persetujuan/penolakan per baris maupun massal, revisi baris, serta
melihat riwayat karier karyawan.

**Akses:** `/tenants/employee/mutasi/:id` · **Setujui/Tolak:** `mutation_request:approve`
· **Revisi/Edit:** `mutation_request:submit`

## Tampilan

<!-- ui-mock: mutasi-detail -->
```html
<div aria-label="Mockup Detail Mutasi" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:6px 10px 6px 22px;color:#fff">Employees Info</div>
    <div style="padding:6px 10px 6px 22px;color:#bfdbfe">Mutasi</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
      <div>
        <div style="color:#71717a;font-size:11px">← Kembali ke Daftar Mutasi</div>
        <div style="font-size:17px;font-weight:700;margin-top:4px">Rotasi kuartalan tim Sales</div>
        <div style="color:#71717a;font-size:11px;margin-top:3px">Diajukan oleh Siti Rahmawati · 2026-03-04 09:12 · 3 karyawan</div>
      </div>
      <div style="display:flex;gap:8px">
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">Refresh</span>
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">✎ Edit Batch</span>
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">⚙ Actions ▾</span>
      </div>
    </div>
    <div style="border:1px solid #e4e4e7;border-radius:10px;background:#fff;margin-top:14px">
      <div style="display:flex;justify-content:space-between;gap:12px;padding:14px">
        <div>
          <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700">Budi Santoso</span><span style="color:#71717a;font-size:11px">EMP-0001</span></div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:5px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:2px 8px;font-size:11px">Promotion</span><span style="color:#71717a;font-size:11px">Senior Software Engineer — Engineering</span></div>
          <div style="color:#71717a;font-size:11px;margin-top:5px">Kinerja melampaui target tahunan</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:2px 10px;font-size:11px">Menunggu Persetujuan</span>
          <div style="display:flex;gap:6px">
            <span style="border:1px solid #16a34a;color:#16a34a;border-radius:8px;padding:4px 10px">✓ Setujui</span>
            <span style="border:1px solid #dc2626;color:#dc2626;border-radius:8px;padding:4px 10px">✕ Tolak</span>
            <span style="border:1px solid #d4d4d8;border-radius:8px;padding:4px 10px">✎ Revisi</span>
            <span style="color:#71717a">🕘 Riwayat Karier</span>
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;gap:12px;padding:14px;border-top:1px solid #f4f4f5">
        <div>
          <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700">Dewi Lestari</span><span style="color:#71717a;font-size:11px">EMP-0002</span></div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:5px"><span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:2px 8px;font-size:11px">Resignation</span><span style="color:#71717a;font-size:11px">Resigned</span></div>
          <div style="color:#71717a;font-size:11px;margin-top:5px">Pindah domisili</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 10px;font-size:11px">Disetujui</span>
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

## Elemen Header

| Elemen | Fungsi | Syarat |
|---|---|---|
| **Kembali ke Daftar Mutasi** | Kembali ke daftar | — |
| **Refresh** | Muat ulang batch, karyawan, unit, posisi | — |
| **Edit Batch** | Buka form pengajuan dalam mode edit | `mutation_request:submit` |
| **Actions** | Setujui/Tolak semua yang menunggu | `mutation_request:approve` |

### Menu Actions

| Item | Fungsi |
|---|---|
| **Setujui Semua yang Menunggu** | Setujui seluruh baris berstatus Menunggu |
| **Tolak Semua yang Menunggu** | Tolak seluruh baris berstatus Menunggu |

Keduanya membuka **modal konfirmasi** (menyebut jumlah baris yang akan
diproses). Aksi massal hanya aktif bila masih ada baris menunggu.

## Baris Pengajuan

Setiap baris menampilkan:

- Nama karyawan + nomor karyawan.
- Badge jenis perubahan + detail target (posisi/unit tujuan atau tanggal).
- Alasan/catatan (atau **failureReason** bila baris gagal).
- Badge status.

### Label Jenis Perubahan

| Backend kind | Label tampil |
|---|---|
| `transition` → `resigned` | **Resignation** |
| `transition` → `terminated` | **Termination** |
| `transition` lainnya | **Probation review** |
| `assignment` → promotion | **Promotion** |
| `assignment` → demotion | **Demotion** |
| `assignment` → transfer | **Transfer** |
| `offboarding` | **Offboarding** |

### Status Baris

| Status | Arti |
|---|---|
| **Menunggu Persetujuan** | Menunggu aksi approver |
| **Disetujui** | Sudah diterapkan |
| **Ditolak** | Ditolak approver |
| **Gagal Diterapkan** | Gagal saat penerapan (penyebab ditampilkan) |

## Aksi Per Baris

| Tombol | Muncul saat | Syarat |
|---|---|---|
| **Setujui** | Status Menunggu | `mutation_request:approve` |
| **Tolak** | Status Menunggu | `mutation_request:approve` |
| **Revisi** | Status Menunggu/Ditolak/Gagal | `mutation_request:submit` |
| **Riwayat Karier** | Selalu | — |

### Modal Revisi

Membuka form field baris yang sama dengan pengajuan (jenis perubahan, tanggal
efektif, unit/posisi tujuan, alasan, serta opsi cabut akses untuk offboarding),
terisi nilai saat ini. Karyawan **tidak** dapat diubah. Tombol **Simpan
Revisi**.

### Drawer Riwayat Karier

Menampilkan tiga bagian untuk karyawan baris tersebut:

1. **Penugasan (Unit & Posisi)** — timeline dengan badge `Penugasan Aktif` /
   `Selesai` dan periode.
2. **Status Lifecycle** — daftar status + alasan + tanggal efektif.
3. **Peristiwa Kepegawaian Lain** — event tambahan (bila ada).

## Langkah — Menyetujui Baris

1. Buka batch dari daftar Mutasi.
2. Pada baris berstatus Menunggu, klik **Setujui** (atau **Tolak**).
3. Baris langsung diproses; status ikut berubah tanpa keluar dari halaman.

## Langkah — Menyetujui Semua

1. Klik **Actions → Setujui Semua yang Menunggu**.
2. Periksa jumlah baris pada modal konfirmasi.
3. Klik **Ya, Setujui Semua** (atau **Ya, Tolak Semua**).

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/mutasi/[id].vue` |
| Field revisi | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/MutationLineFieldsForm.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useMutationRequests.ts`, `useEmployees.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
