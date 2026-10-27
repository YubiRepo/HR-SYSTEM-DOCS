# 06 · Detail Career Mutation (Persetujuan)

Halaman detail satu batch Career Mutation. Menampilkan setiap baris pengajuan
(satu per karyawan) beserta perubahan *nilai saat ini → nilai baru*, dan
memungkinkan persetujuan/penolakan per baris maupun sekaligus, revisi baris,
serta melihat **Career Path** (riwayat karier) karyawan.

**Akses:** `/tenants/employee/mutasi/:id` · **Permission:** menu sidebar
`core_hr:write` atau `org:write`; **Approve**/**Reject**/**Actions**
`mutation_request:approve`; **Edit Batch**/**Revise**
`mutation_request:submit`

## Tampilan

<!-- ui-mock: mutasi-detail -->
```html
<div aria-label="Mockup Detail Career Mutation" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:6px 10px 6px 22px;color:#bfdbfe">Employees Info</div>
    <div style="padding:6px 10px 6px 22px;color:#fff;font-weight:600">Career Mutation</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
      <div>
        <div style="color:#71717a;font-size:11px;font-weight:600">← Back to Career Mutations</div>
        <div style="font-size:17px;font-weight:700;margin-top:4px">Rotasi kuartalan tim Sales ke Kantor Cabang Makassar</div>
        <div style="color:#71717a;font-size:11px;margin-top:3px">Requested by Siti Rahmawati · 2026-10-20 09:12 · 3 employee(s)</div>
      </div>
      <div style="display:flex;gap:8px;font-size:12px">
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:5px 10px;background:#fff">↻ Refresh</span>
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:5px 10px;background:#fff">✎ Edit Batch</span>
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:5px 10px;background:#fff">⚙ Actions ▾</span>
      </div>
    </div>
    <div style="border:1px solid #e4e4e7;border-radius:10px;background:#fff;margin-top:14px;font-size:12px">
      <div style="display:flex;justify-content:space-between;gap:12px;padding:14px">
        <div>
          <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700">Dewi Lestari</span><span style="color:#71717a;font-size:11px;font-family:monospace">EMP-0002</span></div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:5px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:2px 8px;font-size:11px">Mutasi Cabang</span><span style="color:#71717a;font-size:11px">Effective 2026-11-01</span></div>
          <div style="margin-top:5px;font-size:11px;line-height:1.6">
            <div><span style="color:#71717a">Branch:</span> <span style="color:#71717a">Jakarta HQ</span> <span style="color:#2563eb">→</span> <b>Kantor Cabang Makassar</b></div>
            <div><span style="color:#71717a">Position:</span> <span style="color:#71717a">Sales Executive</span> <span style="color:#2563eb">→</span> <b>Sales Supervisor</b></div>
            <div><span style="color:#71717a">Schedule:</span> <span style="color:#71717a">Rotation · Shift 3 Regu</span> <span style="color:#2563eb">→</span> <b>Fixed · Reguler Senin–Jumat</b></div>
          </div>
          <div style="color:#71717a;font-size:11px;margin-top:4px">Kinerja melampaui target tahunan</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:2px 10px;font-size:11px">Pending Approval</span>
          <div style="display:flex;gap:6px;font-size:11px">
            <span style="border:1px solid #16a34a;color:#16a34a;border-radius:8px;padding:3px 8px">✓ Approve</span>
            <span style="border:1px solid #dc2626;color:#dc2626;border-radius:8px;padding:3px 8px">✕ Reject</span>
            <span style="border:1px solid #d4d4d8;border-radius:8px;padding:3px 8px">✎ Revise</span>
            <span style="color:#71717a;padding:3px 4px">🕘 Career Path</span>
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;gap:12px;padding:14px;border-top:1px solid #f4f4f5">
        <div>
          <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700">Budi Santoso</span><span style="color:#71717a;font-size:11px;font-family:monospace">EMP-0001</span></div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:5px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:2px 8px;font-size:11px">Mutasi Cabang</span><span style="color:#71717a;font-size:11px">Effective 2026-11-01</span></div>
          <div style="margin-top:5px;font-size:11px"><span style="color:#71717a">Branch:</span> <span style="color:#71717a">Jakarta HQ</span> <span style="color:#2563eb">→</span> <b>Kantor Cabang Makassar</b></div>
          <div style="color:#71717a;font-size:11px;margin-top:4px">-</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:2px 10px;font-size:11px">Scheduled</span>
          <span style="color:#71717a;font-size:11px">Applies on 2026-11-01</span>
          <span style="color:#71717a;font-size:11px">🕘 Career Path</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;gap:12px;padding:14px;border-top:1px solid #f4f4f5">
        <div>
          <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700">Siti Rahmawati</span><span style="color:#71717a;font-size:11px;font-family:monospace">EMP-0003</span></div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:5px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:2px 8px;font-size:11px">Resign</span><span style="color:#71717a;font-size:11px">Effective 2026-10-25</span></div>
          <div style="margin-top:5px;font-size:11px"><span style="color:#71717a">Status:</span> <b>Resigned</b></div>
          <div style="color:#b45309;font-size:11px">System access will be revoked</div>
          <div style="color:#71717a;font-size:11px;margin-top:4px">Pindah domisili</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 10px;font-size:11px">Approved</span>
          <span style="color:#71717a;font-size:11px">🕘 Career Path</span>
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
| **Back to Career Mutations** | Kembali ke daftar | — |
| Judul | **Batch reason / notes**; bila kosong *Batch #(8 karakter awal id)* | — |
| Subjudul | *Requested by (pengaju) · (waktu) · (n) employee(s)* | — |
| **Refresh** | Muat ulang batch, data karyawan, cabang, department, posisi, dan working pattern | — |
| **Edit Batch** | Buka form **Edit Career Mutation** (lihat [`05-mutasi.md`](./05-mutasi.md#_5-2-new-edit-career-mutation)) | `mutation_request:submit` |
| **Actions** | Setujui/tolak semua baris yang masih menunggu | `mutation_request:approve` |

### Menu Actions

| Item | Fungsi |
|---|---|
| **Approve All Pending** | Setujui seluruh baris berstatus **Pending Approval** |
| **Reject All Pending** | Tolak seluruh baris berstatus **Pending Approval** |

Kedua item nonaktif bila tidak ada baris yang menunggu. Masing-masing membuka
modal konfirmasi **Approve All Pending?** / **Reject All Pending?** dengan
deskripsi *"This will approve (n) pending request line(s) in this batch."*
(atau *reject*). Tombol: **Cancel** / **Yes, Approve All** (atau **Yes, Reject
All**).

## Baris Pengajuan

Setiap baris menampilkan:

- Nama karyawan + nomor karyawan.
- Badge **career path type** (mis. *Mutasi Cabang*) dan *Effective (tanggal)*.
- Daftar perubahan — hanya field yang diubah — dalam format
  *Field: nilai saat ini → nilai baru*: **Branch**, **Department**,
  **Position**, **Schedule** (mis. *Rotation · Shift 3 Regu*), **Status**.
  Untuk baris **Approved**, hanya nilai baru yang ditampilkan.
- *System access will be revoked* (kuning) bila baris mencabut akses login.
- Alasan baris (`-` bila kosong); untuk baris **Failed** ditampilkan penyebab
  kegagalan.
- *Review notes: …* bila ada catatan peninjau.
- Badge status di kanan; baris **Scheduled** menambahkan *Applies on
  (tanggal)*.

### Status Baris

| Badge | Arti |
|---|---|
| **Pending Approval** | Menunggu aksi approver |
| **Scheduled** | Sudah disetujui, tanggal efektif di masa depan — diterapkan otomatis pada tanggal itu |
| **Approved** | Sudah diterapkan ke career path karyawan |
| **Rejected** | Ditolak approver |
| **Failed** | Gagal saat diterapkan (penyebab ditampilkan di baris) |

## Aksi Per Baris

| Tombol | Muncul saat | Syarat |
|---|---|---|
| **Approve** | Status **Pending Approval** | `mutation_request:approve` |
| **Reject** | Status **Pending Approval** | `mutation_request:approve` |
| **Revise** | Status **Pending Approval**, **Rejected**, atau **Failed** | `mutation_request:submit` |
| **Career Path** | Selalu | — |

**Approve** dan **Reject** langsung diproses tanpa konfirmasi. Hasil
**Approve** bergantung pada tanggal efektif:

- tanggal efektif hari ini atau sebelumnya → toast **Request Approved** —
  *The change has been applied to the employee.*
- tanggal efektif di masa depan → toast **Request Scheduled** — *The change
  will be applied on (tanggal).*

### Modal Revise Request

Judul **Revise Request**, deskripsi *"Revising the request for (nama
karyawan)."* Berisi field baris yang sama dengan form pengajuan — **Career
path type**, **Effective date**, **Branch**, **Department**, **Position**,
**Schedule type**, **Pattern**, **Employee status**, **Revoke system login
access on the effective date** (untuk status Resigned/Terminated/Offboarded),
dan **Reason / notes** — terisi nilai baris, dengan petunjuk *Current: …* di
tiap field. Rincian field dan aturannya ada di
[`05-mutasi.md`](./05-mutasi.md#field-baris-batch-defaults-modal-edit-karyawan-modal-revise).
Karyawan **tidak** dapat diganti.

Tombol: **Cancel** / **Save Revision**. Setelah tersimpan muncul toast
**Revision Saved** — *The request is awaiting approval again.* dan baris
kembali berstatus **Pending Approval**.

### Panel Career Path

Klik **Career Path** membuka panel samping **Career Path — (nama karyawan)**
(*"Each entry is a snapshot of the employee's branch, department, position,
schedule and status over time."*). Isinya timeline, terbaru di atas; setiap
entri berisi:

- nama career path type + badge **Current** (entri berjalan) atau **Past**,
- periode *(tanggal mulai) — (tanggal selesai)* atau *— Present*,
- **Branch**, **Department**, **Position**, **Schedule** (badge **Fixed**/
  **Rotation** + nama pattern), **Status**,
- alasan (bila ada).

Bila belum ada riwayat: *No career path recorded yet.*

## Langkah — Menyetujui Satu Baris

1. Buka batch dari daftar **Career Mutation** (klik ganda baris).
2. Periksa perubahan *nilai saat ini → nilai baru* pada baris.
3. Klik **Approve** (atau **Reject**).
4. Status baris langsung berubah menjadi **Approved**/**Scheduled** (atau
   **Rejected**) tanpa keluar dari halaman.

## Langkah — Menyetujui Semua Baris

1. Klik **Actions → Approve All Pending**.
2. Periksa jumlah baris pada modal konfirmasi.
3. Klik **Yes, Approve All** (atau **Actions → Reject All Pending** →
   **Yes, Reject All**).

## Langkah — Merevisi Baris yang Ditolak/Gagal

1. Pada baris **Rejected**/**Failed**, klik **Revise**.
2. Perbaiki field yang diperlukan (mis. ganti **Position**).
3. Klik **Save Revision** — baris kembali menunggu persetujuan.

## Pesan

| Kondisi | Pesan |
|---|---|
| Batch tidak ditemukan | *Mutation batch not found.* |
| Batch tanpa baris | *This batch has no request lines.* |
| Baris ditolak | Toast **Request Rejected** |
| Approve/Reject semua berhasil | Toast **All Pending Requests Approved** / **All Pending Requests Rejected** |
| Gagal approve/reject baris | Toast **Failed to Approve Request** / **Failed to Reject Request** (+ pesan server) |
| Gagal approve/reject batch | Toast **Failed to Approve Batch** / **Failed to Reject Batch** |
| Gagal menyimpan revisi | Toast **Failed to Revise Request** |
| Revisi tidak valid | Toast berisi pesan validasi (lihat [`05-mutasi.md`](./05-mutasi.md#pesan-validasi-toast)) |
| Gagal memuat career path | Toast **Failed to Load Career Path** |

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/mutasi/[id].vue` |
| Field revisi | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/MutationLineFieldsForm.vue` |
| Timeline karier | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CareerPathTimeline.vue`, `ScheduleTypeBadge.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useMutationRequests.ts`, `useCareerPathLookups.ts`, `useEmployees.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
