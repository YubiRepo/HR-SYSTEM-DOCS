# 05 · Career Mutation (Daftar & Pengajuan)

Menu **Career Mutation** (dulu *Mutasi*) dipakai untuk mengajukan perubahan
jalur karier satu atau banyak karyawan sekaligus — **cabang**, **department**,
**posisi**, **jadwal kerja** (schedule type + working pattern), dan/atau
**status karyawan**. Satu pengajuan disebut **batch** dan berisi satu baris per
karyawan. Setiap baris **menunggu persetujuan**; perubahan baru diterapkan ke
jalur karier (career path) karyawan setelah disetujui. Baris yang disetujui
dengan tanggal efektif di masa depan diterapkan otomatis pada tanggal tersebut.

**Akses:** `/tenants/employee/mutasi` · **Permission:** menu sidebar tampil
bila punya `core_hr:write` atau `org:write`; tombol **New Mutation** dan form
pengajuan butuh `mutation_request:submit`

> **Tip:** Batch mutasi juga bisa dibuat dari menu **Attendance → Rotation
> Simulations** (aksi **Convert to Mutation** → **Create Mutation Batch**).
> Batch hasil konversi menempatkan setiap karyawan simulasi pada working
> pattern simulasinya, lalu langsung membuka halaman detail batch untuk
> ditinjau dan disetujui di Career Mutation.

## 5.1 Daftar Career Mutation

### Tampilan

<!-- ui-mock: mutasi-list -->
```html
<div aria-label="Mockup Daftar Career Mutation" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:6px 10px 6px 22px;color:#bfdbfe">Employees Info</div>
    <div style="padding:6px 10px 6px 22px;color:#fff;font-weight:600">Career Mutation</div>
    <div style="padding:8px 10px;color:#bfdbfe">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e4e4e7;padding-bottom:14px">
      <div>
        <div style="font-size:17px;font-weight:700">Career Mutation</div>
        <div style="color:#71717a;font-size:11px;margin-top:3px;max-width:520px">Change the branch, department, position, schedule or status of one or more employees at once — every change waits for approval before it is applied to the employee's career path.</div>
      </div>
      <div style="display:flex;gap:8px">
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:7px 12px;background:#fff">↻ Refresh</span>
        <span style="background:#2563eb;color:#fff;border-radius:8px;padding:7px 12px;font-weight:600">⇄ New Mutation</span>
      </div>
    </div>
    <div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:7px 10px;color:#a1a1aa;margin-top:14px;width:260px">🔍 Search requester...</div>
    <div style="border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;margin-top:10px;background:#fff">
      <div style="display:grid;grid-template-columns:1.3fr 1.6fr 0.9fr 2.2fr;background:#f4f4f5;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#71717a;font-weight:700">
        <div style="padding:10px">Requested By</div><div style="padding:10px">Reason</div><div style="padding:10px">Employees</div><div style="padding:10px">Status</div>
      </div>
      <div style="display:grid;grid-template-columns:1.3fr 1.6fr 0.9fr 2.2fr;border-top:1px solid #f4f4f5;align-items:center">
        <div style="padding:10px"><div style="font-weight:700">Siti Rahmawati</div><div style="color:#71717a;font-size:10px;font-family:monospace">2026-10-20 09:12</div></div>
        <div style="padding:10px;color:#71717a;font-size:11px">Rotasi kuartalan tim Sales ke Kantor Cabang Makassar</div>
        <div style="padding:10px;font-weight:600;font-size:11px">3 employee(s)</div>
        <div style="padding:10px;display:flex;gap:4px;flex-wrap:wrap"><span style="background:#2563eb;color:#fff;border-radius:6px;padding:2px 8px;font-size:11px">Partially Processed</span><span style="background:#fffbeb;color:#b45309;border-radius:6px;padding:2px 8px;font-size:11px">1 Pending</span><span style="background:#eff6ff;color:#1d4ed8;border-radius:6px;padding:2px 8px;font-size:11px">1 Scheduled</span><span style="background:#f0fdf4;color:#15803d;border-radius:6px;padding:2px 8px;font-size:11px">1 Approved</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1.3fr 1.6fr 0.9fr 2.2fr;border-top:1px solid #f4f4f5;align-items:center">
        <div style="padding:10px"><div style="font-weight:700">Siti Rahmawati</div><div style="color:#71717a;font-size:10px;font-family:monospace">2026-10-15 14:03</div></div>
        <div style="padding:10px;color:#71717a;font-size:11px">Rotation placement: Shift Malam Gudang</div>
        <div style="padding:10px;font-weight:600;font-size:11px">2 employee(s)</div>
        <div style="padding:10px;display:flex;gap:4px;flex-wrap:wrap"><span style="background:#f59e0b;color:#fff;border-radius:6px;padding:2px 8px;font-size:11px">Pending Approval</span><span style="background:#fffbeb;color:#b45309;border-radius:6px;padding:2px 8px;font-size:11px">2 Pending</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1.3fr 1.6fr 0.9fr 2.2fr;border-top:1px solid #f4f4f5;align-items:center">
        <div style="padding:10px"><div style="font-weight:700">Budi Santoso</div><div style="color:#71717a;font-size:10px;font-family:monospace">2026-09-30 10:45</div></div>
        <div style="padding:10px;color:#71717a;font-size:11px">Promosi tahunan</div>
        <div style="padding:10px;font-weight:600;font-size:11px">1 employee(s)</div>
        <div style="padding:10px;display:flex;gap:4px;flex-wrap:wrap"><span style="background:#16a34a;color:#fff;border-radius:6px;padding:2px 8px;font-size:11px">Approved</span><span style="background:#f0fdf4;color:#15803d;border-radius:6px;padding:2px 8px;font-size:11px">1 Approved</span></div>
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

### Elemen Halaman

| Elemen | Fungsi | Syarat |
|---|---|---|
| **Refresh** | Memuat ulang daftar batch | — |
| **New Mutation** | Membuka form **New Career Mutation** | `mutation_request:submit` |
| Kotak *Search requester...* | Mencari batch berdasarkan nama pengaju | — |
| Klik ganda baris | Membuka detail batch ([`06-detail-mutasi.md`](./06-detail-mutasi.md)) | — |

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Requested By** | Nama pengaju + waktu pengajuan |
| **Reason** | Alasan/catatan batch (`-` bila kosong) |
| **Employees** | Jumlah karyawan dalam batch, mis. *3 employee(s)* |
| **Status** | Badge status batch + rincian jumlah baris per status (hanya yang tidak nol), mis. *1 Pending · 1 Scheduled · 1 Approved* |

### Status Batch

| Badge | Arti |
|---|---|
| **Pending Approval** | Belum ada baris yang diproses |
| **Partially Processed** | Sebagian baris sudah diproses, sebagian masih menunggu |
| **Approved** | Semua baris disetujui |
| **Rejected** | Batch ditolak |
| **Failed** | Ada baris yang gagal diterapkan |

Rincian per baris memakai badge **Pending**, **Scheduled**, **Approved**,
**Rejected**, **Failed** (arti tiap status ada di
[`06-detail-mutasi.md`](./06-detail-mutasi.md#status-baris)).

## 5.2 New / Edit Career Mutation

**Akses:** `/tenants/employee/mutasi/create` · **Edit:**
`/tenants/employee/mutasi/create?batchId=(id batch)` · **Permission:**
`mutation_request:submit`

Form terdiri dari dua bagian: **Batch defaults** (nilai bawaan untuk semua
karyawan) dan tabel **Employees** (satu baris per karyawan, tiap baris bisa
diubah sendiri).

### Tampilan

<!-- ui-mock: mutasi-create -->
```html
<div aria-label="Mockup New Career Mutation" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:6px 10px 6px 22px;color:#bfdbfe">Employees Info</div>
    <div style="padding:6px 10px 6px 22px;color:#fff;font-weight:600">Career Mutation</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="border-bottom:1px solid #e4e4e7;padding-bottom:12px">
      <div style="color:#71717a;font-size:11px;font-weight:600">← Back to Career Mutations</div>
      <div style="font-size:17px;font-weight:700;margin-top:4px">New Career Mutation</div>
      <div style="color:#71717a;font-size:11px;margin-top:3px">Change the branch, department, position, schedule or status of one or more employees. Requests wait for approval; approved changes with a future effective date are applied automatically on that date.</div>
    </div>
    <div style="border:1px solid #e4e4e7;border-radius:12px;background:#fff;padding:14px;margin-top:14px">
      <div style="font-weight:600">Batch defaults</div>
      <div style="color:#71717a;font-size:11px">Changing a value here applies it to every employee below. Each employee can still be overridden individually; a field whose employees no longer agree shows "Varies per employee".</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
        <div><div style="font-size:11px;font-weight:600">Career path type <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;margin-top:3px">Mutasi Cabang</div></div>
        <div><div style="font-size:11px;font-weight:600">Effective date <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;margin-top:3px">2026-11-01</div></div>
      </div>
      <div style="border:1px solid #e4e4e7;background:#fafafa;border-radius:8px;padding:10px;margin-top:10px">
        <div style="color:#71717a;font-size:11px">Leave a field empty to keep it unchanged. Change at least one.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">
          <div><div style="font-size:11px;font-weight:600">Branch</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">🏢 Kantor Cabang Makassar</div></div>
          <div><div style="font-size:11px;font-weight:600">Department</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px;color:#a1a1aa">Unchanged</div></div>
          <div><div style="font-size:11px;font-weight:600">Position</div><div style="border:1px dashed #f59e0b;background:#fffbeb;border-radius:8px;padding:4px 8px;margin-top:3px;display:flex;justify-content:space-between;align-items:center"><span><span style="color:#b45309;font-style:italic;font-size:11px">Varies per employee</span><br><span style="color:#71717a;font-size:10px">Header: Unchanged</span></span><span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:2px 8px;font-size:11px">Apply to all</span></div></div>
          <div><div style="font-size:11px;font-weight:600">Schedule type</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">Fixed</div></div>
          <div><div style="font-size:11px;font-weight:600">Pattern</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">Reguler Senin–Jumat</div></div>
          <div><div style="font-size:11px;font-weight:600">Employee status</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px;color:#a1a1aa">Unchanged</div></div>
        </div>
      </div>
      <div style="margin-top:10px"><div style="font-size:11px;font-weight:600">Batch reason / notes</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;margin-top:3px">Rotasi kuartalan tim Sales ke Kantor Cabang Makassar</div></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
      <div style="font-size:12px;font-weight:600">Employees (2)</div>
      <span style="border:1px solid #d4d4d8;border-radius:8px;padding:4px 10px;background:#fff;font-size:11px">👤+ Add employees</span>
    </div>
    <div style="border:1px solid #e4e4e7;border-radius:10px;background:#fff;margin-top:8px;font-size:11px;overflow:hidden">
      <div style="display:grid;grid-template-columns:1.2fr 1fr 1.1fr 0.9fr 1.1fr 1.2fr 0.7fr 0.5fr;background:#f4f4f5;color:#71717a">
        <div style="padding:8px">Employee</div><div style="padding:8px">Type / Effective</div><div style="padding:8px">Branch</div><div style="padding:8px">Department</div><div style="padding:8px">Position</div><div style="padding:8px">Schedule</div><div style="padding:8px">Status</div><div></div>
      </div>
      <div style="display:grid;grid-template-columns:1.2fr 1fr 1.1fr 0.9fr 1.1fr 1.2fr 0.7fr 0.5fr;border-top:1px solid #f4f4f5">
        <div style="padding:8px"><div style="font-weight:600">Dewi Lestari</div><div style="color:#71717a;font-family:monospace">EMP-0002</div></div>
        <div style="padding:8px"><div style="font-weight:500">Mutasi Cabang</div><div style="color:#71717a;font-family:monospace">2026-11-01</div></div>
        <div style="padding:8px"><div style="color:#71717a;text-decoration:line-through">Jakarta HQ</div><div style="font-weight:600">→ Kantor Cabang Makassar</div></div>
        <div style="padding:8px;color:#a1a1aa">Sales</div>
        <div style="padding:8px"><div style="color:#71717a;text-decoration:line-through">Sales Executive</div><div style="font-weight:600">→ Sales Supervisor</div><span style="background:#fef3c7;color:#b45309;border-radius:4px;padding:0 4px;font-size:9px;font-weight:600">CUSTOM</span></div>
        <div style="padding:8px"><div style="color:#71717a;text-decoration:line-through">Rotation · Shift 3 Regu</div><div style="font-weight:600">→ Fixed · Reguler Senin–Jumat</div></div>
        <div style="padding:8px;color:#a1a1aa">Active</div>
        <div style="padding:8px;color:#71717a">✎ <span style="color:#dc2626">🗑</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1.2fr 1fr 1.1fr 0.9fr 1.1fr 1.2fr 0.7fr 0.5fr;border-top:1px solid #f4f4f5">
        <div style="padding:8px"><div style="font-weight:600">Budi Santoso</div><div style="color:#71717a;font-family:monospace">EMP-0001</div></div>
        <div style="padding:8px"><div style="font-weight:500">Mutasi Cabang</div><div style="color:#71717a;font-family:monospace">2026-11-01</div></div>
        <div style="padding:8px"><div style="color:#71717a;text-decoration:line-through">Jakarta HQ</div><div style="font-weight:600">→ Kantor Cabang Makassar</div></div>
        <div style="padding:8px;color:#a1a1aa">Sales</div>
        <div style="padding:8px;color:#a1a1aa">Sales Executive</div>
        <div style="padding:8px"><div style="color:#71717a;text-decoration:line-through">Fixed · Reguler Senin–Sabtu</div><div style="font-weight:600">→ Fixed · Reguler Senin–Jumat</div></div>
        <div style="padding:8px;color:#a1a1aa">Active</div>
        <div style="padding:8px;color:#71717a">✎ <span style="color:#dc2626">🗑</span></div>
      </div>
    </div>
    <div style="color:#71717a;font-size:10px;margin-top:4px">Struck-through values are the employee's current placement; "Custom" marks a value that differs from the batch defaults. Approved and scheduled lines are locked.</div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;border-top:1px solid #e4e4e7;padding-top:12px">
      <span style="padding:6px 14px">Cancel</span>
      <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 14px;font-weight:600">✓ Submit Request</span>
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

### Elemen Halaman

| Elemen | Fungsi |
|---|---|
| **Back to Career Mutations** / **Back to Mutation Detail** | Kembali ke daftar (mode baru) atau ke detail batch (mode edit) |
| Judul **New Career Mutation** / **Edit Career Mutation** | Mode baru / mode edit (`?batchId=`) |
| Kartu **Batch defaults** | Nilai bawaan yang disalin ke semua karyawan yang bisa diedit |
| **Batch reason / notes** | Alasan batch, tampil di kolom **Reason** daftar dan sebagai judul halaman detail |
| **Add employees** | Membuka pemilih karyawan **Add Employees to Mutation** |
| Ikon pensil | Membuka modal **Edit (nama karyawan)** untuk mengubah nilai satu karyawan saja |
| Ikon tempat sampah | Menghapus karyawan dari batch (tanpa konfirmasi) |
| Ikon gembok | Baris berstatus **Approved**/**Scheduled** terkunci — tidak bisa diubah/dihapus |
| Ikon peringatan merah | Baris belum valid; arahkan kursor untuk melihat pesannya |
| **Cancel** | Batal, kembali tanpa menyimpan |
| **Submit Request** / **Save Changes** | Kirim pengajuan (mode baru) / simpan perubahan (mode edit) |

### Jenis Perubahan (Career path type)

Tidak ada lagi enam jenis perubahan siklus yang tetap. **Career path type**
adalah daftar yang ditentukan perusahaan sendiri lewat **Company Settings →
Common Codes** kategori `career_path_type` (lihat
[`03-common-codes.md`](../company-settings/03-common-codes.md)) — mis.
*Promosi*, *Mutasi Cabang*, *Rotasi Jadwal*, *Resign*. Jenis ini hanya
**label** riwayat karier; yang benar-benar berubah ditentukan oleh field target
yang diisi. Setiap baris boleh mengubah satu atau beberapa field target
sekaligus.

### Field Baris (Batch defaults, modal Edit karyawan, modal Revise)

Field yang sama dipakai di kartu **Batch defaults**, modal per karyawan, dan
modal **Revise Request** di halaman detail.

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Career path type** | pilihan (common code) | Ya | Placeholder *Select type...* | Mutasi Cabang |
| **Effective date** | tanggal | Ya | Default hari ini. Bila di masa depan, baris yang disetujui menjadi **Scheduled** dan diterapkan otomatis pada tanggal itu | 2026-11-01 |
| **Branch** | pilihan cabang | Tidak* | Kosong = *Unchanged*. Hanya cabang aktif yang muncul | Kantor Cabang Makassar |
| **Department** | pilihan unit organisasi | Tidak* | Kosong = *Unchanged*. Mengganti department menghapus posisi yang tidak cocok | Sales |
| **Position** | pilihan posisi | Tidak* | Kosong = *Unchanged*. Daftar dibatasi posisi milik department hasil akhir (yang dipilih, atau department saat ini) | Sales Supervisor |
| **Schedule type** | pilihan **Fixed** / **Rotation** | Berpasangan | Kosong = *Unchanged*. Wajib diisi bersama **Pattern**; mengganti/mengosongkan tipe menghapus pattern yang tidak cocok | Fixed |
| **Pattern** | pilihan working pattern | Berpasangan* | Nonaktif (*Choose a schedule type first*) sampai **Schedule type** dipilih; daftar dibatasi pattern dengan mode yang sama. Keterangan tiap pattern: *Fixed · (shift) · (hari kerja)* atau *Rotation · (n)-day cycle*. Pattern nonaktif ditandai *(inactive)* | Reguler Senin–Jumat |
| **Employee status** | pilihan | Tidak* | Kosong = *Unchanged*. Pilihan: `Probation`, `Active`, `On leave`, `Resigned`, `Terminated`, `Offboarded` | Resigned |
| **Revoke system login access on the effective date** | centang | Tidak | Hanya muncul bila status baru `Resigned`, `Terminated`, atau `Offboarded`. Default tidak dicentang | ✓ |
| **Reason / notes** | teks | Tidak | Catatan per karyawan (tidak ada di **Batch defaults**). Placeholder *e.g. Exceeded annual performance targets...* | Kinerja melampaui target tahunan |

\* Setidaknya **satu** dari Branch, Department, Position, Schedule
(Schedule type + Pattern), atau Employee status wajib diisi. Di modal per
karyawan dan modal revisi, tiap field menampilkan petunjuk *Current: (nilai
saat ini)*.

Working pattern dikelola di **HR Setting → Working Patterns** — lihat
[`04-working-patterns.md`](../hr-setting/04-working-patterns.md). Shift tidak
dipilih terpisah; shift ikut dari working pattern yang dipilih.

### Cara kerja Batch defaults

- Mengubah field di **Batch defaults** langsung menyalin nilainya ke **semua**
  karyawan yang belum terkunci.
- Karyawan yang ditambahkan kemudian ikut memakai nilai **Batch defaults** saat
  itu (kecuali **Reason / notes**).
- Bila nilai satu karyawan diubah lewat ikon pensil, sel di tabel diberi tanda
  **Custom**, dan field di **Batch defaults** berubah menjadi kotak
  **Varies per employee** (*Header: (nilai bawaan)*) dengan tombol
  **Apply to all** untuk menyamakan kembali semua karyawan ke nilai bawaan.
- Tabel menampilkan nilai saat ini dicoret dan nilai baru dengan panah (→).
  Kolom: **Employee**, **Type / Effective**, **Branch**, **Department**,
  **Position**, **Schedule** (mis. *Rotation · Shift 3 Regu*), **Status**.

### Pemilih Karyawan — "Add Employees to Mutation"

<!-- ui-mock: mutasi-employee-picker -->
```html
<div aria-label="Mockup Add Employees to Mutation" style="font-family:Inter,system-ui,sans-serif;width:960px;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px;padding:18px 20px">
  <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:16px">
    <div style="font-size:15px;font-weight:700">Add Employees to Mutation</div>
    <div style="color:#71717a;font-size:11px;margin-top:2px">Filter and tick the employees to include. Employees already in the form are skipped.</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:12px;font-size:11px;color:#a1a1aa">
      <div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px">🔍 Search name or number...</div>
      <div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px;color:#18181b">Jakarta HQ</div>
      <div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px">All departments</div>
      <div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px">All positions</div>
      <div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px">All schedule types</div>
      <div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px">All patterns</div>
      <div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px">All statuses</div>
    </div>
    <div style="display:flex;gap:10px;align-items:center;margin-top:10px;font-size:11px;color:#71717a"><span><b style="color:#18181b">2</b> selected</span><span>⨯ Reset filters</span></div>
    <div style="border:1px solid #e4e4e7;border-radius:10px;margin-top:8px;font-size:11px;overflow:hidden">
      <div style="display:grid;grid-template-columns:30px 1.5fr 1fr 1fr 1.1fr 1.4fr 0.8fr;background:#f4f4f5;color:#71717a">
        <div style="padding:8px">☐</div><div style="padding:8px">Employee</div><div style="padding:8px">Branch</div><div style="padding:8px">Department</div><div style="padding:8px">Position</div><div style="padding:8px">Schedule</div><div style="padding:8px">Status</div>
      </div>
      <div style="display:grid;grid-template-columns:30px 1.5fr 1fr 1fr 1.1fr 1.4fr 0.8fr;border-top:1px solid #f4f4f5">
        <div style="padding:8px">☑</div><div style="padding:8px"><b>Budi Santoso</b><div style="color:#71717a;font-family:monospace">EMP-0001</div></div><div style="padding:8px">Jakarta HQ</div><div style="padding:8px">Sales</div><div style="padding:8px">Sales Executive</div><div style="padding:8px"><span style="background:#f4f4f5;border-radius:6px;padding:1px 6px">Fixed</span> Reguler Senin–Sabtu</div><div style="padding:8px"><span style="background:#f4f4f5;border-radius:6px;padding:1px 6px">Active</span></div>
      </div>
      <div style="display:grid;grid-template-columns:30px 1.5fr 1fr 1fr 1.1fr 1.4fr 0.8fr;border-top:1px solid #f4f4f5">
        <div style="padding:8px">☑</div><div style="padding:8px"><b>Dewi Lestari</b><div style="color:#71717a;font-family:monospace">EMP-0002</div></div><div style="padding:8px">Jakarta HQ</div><div style="padding:8px">Sales</div><div style="padding:8px">Sales Executive</div><div style="padding:8px"><span style="background:#f3e8ff;color:#7e22ce;border-radius:6px;padding:1px 6px">Rotation</span> Shift 3 Regu</div><div style="padding:8px"><span style="background:#f4f4f5;border-radius:6px;padding:1px 6px">Active</span></div>
      </div>
      <div style="display:grid;grid-template-columns:30px 1.5fr 1fr 1fr 1.1fr 1.4fr 0.8fr;border-top:1px solid #f4f4f5;color:#a1a1aa">
        <div style="padding:8px">☑</div><div style="padding:8px"><b>Siti Rahmawati</b> <span style="background:#f4f4f5;border-radius:6px;padding:1px 6px">Already added</span><div style="font-family:monospace">EMP-0003</div></div><div style="padding:8px">Jakarta HQ</div><div style="padding:8px">People Ops</div><div style="padding:8px">HR Officer</div><div style="padding:8px">Fixed Reguler Senin–Jumat</div><div style="padding:8px">Active</div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
      <span style="padding:6px 14px">Cancel</span>
      <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 14px;font-weight:600">👤+ Add to form (2)</span>
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

| Elemen | Fungsi |
|---|---|
| *Search name or number...* | Cari nama atau nomor karyawan |
| Filter *All branches*, *All departments*, *All positions* | Saring per cabang/department/posisi (daftar posisi mengikuti department terpilih) |
| Filter *All schedule types* | **Fixed**, **Rotation**, atau **No schedule** (karyawan tanpa jadwal) |
| Filter *All patterns* | Saring per working pattern; nonaktif bila memilih **No schedule** |
| Filter *All statuses* | Saring per status karyawan |
| **(n) selected** · **Reset filters** | Jumlah terpilih · kosongkan semua filter & pencarian |
| Kolom tabel | Centang, **Employee**, **Branch**, **Department**, **Position**, **Schedule** (badge Fixed/Rotation + nama pattern), **Status** |
| Badge **Already added** | Karyawan sudah ada di form — tidak bisa dipilih lagi |
| **Add to form (n)** | Menambahkan karyawan terpilih ke tabel; muncul toast *"(n) employee(s) added"* |

Pilihan tetap tersimpan saat berpindah halaman tabel atau mengganti filter.
Centang di header tabel memilih semua karyawan di halaman itu.

### Baru vs Edit

- **Baru** (`/create`): tombol **Submit Request**. Setelah berhasil muncul
  toast **Career Mutation Submitted** — *Awaiting approval before it is
  applied.* lalu diarahkan ke halaman detail batch.
- **Edit** (`/create?batchId=(id batch)`, dari tombol **Edit Batch** di
  halaman detail): judul **Edit Career Mutation**, tombol **Save Changes**.
  Sistem menambah karyawan baru, merevisi baris yang berubah, menghapus baris
  yang dibuang, dan memperbarui alasan/Batch defaults. Baris **Approved** dan
  **Scheduled** tidak disentuh. Setelah berhasil muncul toast **Changes
  Saved** — *Changed lines are awaiting approval again.* lalu kembali ke detail
  batch.

> **Penting:** Baris yang direvisi (termasuk yang sebelumnya **Rejected** atau
> **Failed**) kembali berstatus **Pending** dan perlu disetujui ulang.

## Langkah — Mengajukan Career Mutation

1. Buka menu **Employees → Career Mutation**.
2. Klik **New Mutation**.
3. Di **Batch defaults**, pilih **Career path type** dan isi **Effective date**.
4. Isi field yang ingin diubah untuk semua karyawan (mis. **Branch** =
   *Kantor Cabang Makassar*). Untuk mengganti jadwal, pilih **Schedule type**
   lalu **Pattern**.
5. Isi **Batch reason / notes**.
6. Klik **Add employees**, saring dan centang karyawan, lalu klik
   **Add to form (n)**.
7. Bila satu karyawan butuh nilai berbeda, klik ikon pensil pada barisnya,
   ubah field (mis. **Position**), lalu klik **Save**.
8. Pastikan tidak ada ikon peringatan merah, lalu klik **Submit Request** →
   diarahkan ke detail batch ([`06-detail-mutasi.md`](./06-detail-mutasi.md)).

## Langkah — Mengubah Batch yang Sudah Diajukan

1. Buka detail batch, klik **Edit Batch**.
2. Tambah/hapus karyawan atau ubah nilainya (baris terkunci tidak bisa diubah).
3. Klik **Save Changes**.

## Pesan Validasi & Toast

Saat **Submit Request**/**Save Changes**, kesalahan pertama ditampilkan sebagai
toast **Cannot save yet** dengan deskripsi *"(nama karyawan): (pesan)"*. Di
modal per karyawan, pesan yang sama muncul sebagai judul toast.

| Kondisi | Pesan |
|---|---|
| Belum ada karyawan | **"Add at least one employee"** |
| Career path type kosong | **"Select a career path type"** |
| Effective date kosong | **"Fill in the effective date"** |
| Schedule type diisi tanpa pattern | **"Select a pattern for the schedule type"** |
| Pattern diisi tanpa schedule type | **"Select a schedule type for the pattern"** |
| Mode pattern tidak sama dengan schedule type | **"The selected pattern is not a fixed pattern"** / **"...not a rotation pattern"** |
| Tidak ada field target yang diisi | **"Change at least one of branch, department, position, schedule or employee status"** |
| Posisi bukan milik department hasil akhir | **"The position does not belong to the resulting department"** |
| Gagal mengirim | **Failed to Submit Career Mutation** (+ pesan server) |
| Gagal menambah karyawan (mode edit) | **Failed to Add Employee** |
| Gagal menghapus baris (mode edit) | **Failed to Remove Request Line** |
| Gagal merevisi baris (mode edit) | **Failed to Revise Request** |
| Gagal memperbarui alasan/defaults | **Failed to Update Batch** |
| Pemilih karyawan gagal memuat | **Failed to Load Employees** |

## Sumber

| Jenis | Path |
|---|---|
| Daftar | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/mutasi/index.vue` |
| Pengajuan / edit | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/mutasi/create.vue` |
| Editor batch | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/MutationBatchLineEditor.vue` |
| Field baris | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/MutationLineFieldsForm.vue` |
| Pemilih karyawan | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/EmployeePickerModal.vue`, `ScheduleTypeBadge.vue` |
| Pilihan cabang / pattern | `HR-SYSTEM-BACKOFFICE/app/components/BranchSelect.vue`, `PatternSelect.vue` |
| Konversi simulasi | `HR-SYSTEM-BACKOFFICE/app/components/attendance/BulkConvertSimulationsModal.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useMutationRequests.ts`, `useCareerPathLookups.ts`, `useEmployees.ts`, `usePositions.ts` |
| Menu | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
