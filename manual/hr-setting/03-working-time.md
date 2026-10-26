# 03 · Working Time (Jam Kerja)

Mengelola **katalog shift** (jam masuk–pulang, istirahat, jendela absen) dan
**Custom Groups** (kelompok karyawan bebas lintas departemen). Shift dan grup di
sini menjadi bahan baku pola jadwal di **Attendance → Working Time Patterns**;
dari jadwal itulah sistem menghitung telat, pulang cepat, jam kerja efektif, dan
lembur karyawan.

**Akses:** `/tenants/hr-setting/working-time` · **Permission:** menu tampil bila
fitur **Attendance** aktif di langganan dan punya `attendance:read`; tombol
**Add New Shift** / **Add Group** butuh `attendance:write` atau
`attendance:config`

## Tampilan

Halaman punya dua tab: **Shift Catalog** dan **Custom Groups**.

<!-- ui-mock: working-time-shifts -->
```html
<div aria-label="Mockup Working Time" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Working Time</div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
        <div><div style="font-weight:800;font-size:15px">Working Time</div><div style="color:#71717a;font-size:11px;margin-top:3px">Manage the shift catalog and custom employee groups.</div></div>
        <div style="display:flex;gap:8px">
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:5px 10px;font-size:11px">⟳ Refresh</span>
          <span style="background:#2563eb;color:#fff;border-radius:8px;padding:5px 10px;font-weight:600;font-size:11px">+ Add New Shift</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;border-bottom:1px solid #e4e4e7;padding:10px 0;font-size:11px;font-weight:600">
        <span style="background:#2563eb;color:#fff;border-radius:8px;padding:5px 10px">🕘 Shift Catalog (4)</span>
        <span style="background:#f4f4f5;color:#71717a;border-radius:8px;padding:5px 10px">👥 Custom Groups (2)</span>
      </div>
      <div style="margin-top:12px;border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa;width:260px">Search shift name or code...</div>
      <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:1.4fr 0.9fr 1.6fr 0.9fr 1.3fr 0.7fr 30px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
          <div style="padding:9px 10px">Name &amp; Code</div><div style="padding:9px 10px">Type</div><div style="padding:9px 10px">Hours &amp; Break</div><div style="padding:9px 10px">Effective Duration</div><div style="padding:9px 10px">Description</div><div style="padding:9px 10px">Status</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:1.4fr 0.9fr 1.6fr 0.9fr 1.3fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:700">Shift Kantor Reguler</div><div style="color:#2563eb;font-size:10px;font-family:monospace">REG-0817</div></div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Fixed Hours</span></div>
          <div style="padding:9px 10px"><div style="font-family:monospace;font-size:11px;font-weight:600">08:00 — 17:00</div><div style="color:#71717a;font-size:10px">2 break(s) • 60 min unpaid</div></div>
          <div style="padding:9px 10px;font-weight:700">8 hrs</div>
          <div style="padding:9px 10px;color:#71717a;font-size:11px">Jakarta HQ — staf kantor</div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.4fr 0.9fr 1.6fr 0.9fr 1.3fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:700">Shift Pagi Gudang</div><div style="color:#2563eb;font-size:10px;font-family:monospace">OPS-AM</div></div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Fixed Hours</span></div>
          <div style="padding:9px 10px"><div style="font-family:monospace;font-size:11px;font-weight:600">06:00 — 14:00</div><div style="color:#71717a;font-size:10px">1 break(s) • 30 min unpaid</div></div>
          <div style="padding:9px 10px;font-weight:700">7.5 hrs</div>
          <div style="padding:9px 10px;color:#71717a;font-size:11px">Kantor Cabang Makassar</div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.4fr 0.9fr 1.6fr 0.9fr 1.3fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:700">Shift Malam Gudang</div><div style="color:#2563eb;font-size:10px;font-family:monospace">OPS-NT</div></div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Fixed Hours</span></div>
          <div style="padding:9px 10px"><div style="font-family:monospace;font-size:11px;font-weight:600">22:00 — 06:00</div><div style="color:#71717a;font-size:10px">1 break(s) • 60 min unpaid • Night Shift (+1 Day)</div></div>
          <div style="padding:9px 10px;font-weight:700">7 hrs</div>
          <div style="padding:9px 10px;color:#71717a;font-size:11px">Operasional malam</div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.4fr 0.9fr 1.6fr 0.9fr 1.3fr 0.7fr 30px;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:700">WFH Fleksibel</div><div style="color:#2563eb;font-size:10px;font-family:monospace">FLEX-WFH</div></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Flexible (WFH)</span></div>
          <div style="padding:9px 10px"><div style="font-family:monospace;font-size:11px;font-weight:600">07:00 — 19:00</div><div style="color:#71717a;font-size:10px">0 break(s) • 0 min unpaid</div></div>
          <div style="padding:9px 10px;font-weight:700">8 hrs</div>
          <div style="padding:9px 10px;color:#71717a;font-size:11px">-</div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Inactive</span></div><div style="color:#71717a">⋯</div>
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

<!-- ui-mock: working-time-groups -->
```html
<div aria-label="Mockup Working Time Custom Groups" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Working Time</div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
        <div><div style="font-weight:800;font-size:15px">Working Time</div><div style="color:#71717a;font-size:11px;margin-top:3px">Manage the shift catalog and custom employee groups.</div></div>
        <div style="display:flex;gap:8px">
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:5px 10px;font-size:11px">⟳ Refresh</span>
          <span style="background:#2563eb;color:#fff;border-radius:8px;padding:5px 10px;font-weight:600;font-size:11px">+ Add Group</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;border-bottom:1px solid #e4e4e7;padding:10px 0;font-size:11px;font-weight:600">
        <span style="background:#f4f4f5;color:#71717a;border-radius:8px;padding:5px 10px">🕘 Shift Catalog (4)</span>
        <span style="background:#2563eb;color:#fff;border-radius:8px;padding:5px 10px">👥 Custom Groups (2)</span>
      </div>
      <div style="margin-top:12px;border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa;width:260px">Search group name...</div>
      <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:2fr 1.2fr 1fr 0.8fr 30px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
          <div style="padding:9px 10px">Group Name</div><div style="padding:9px 10px">Branch</div><div style="padding:9px 10px">Members</div><div style="padding:9px 10px">Status</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 1.2fr 1fr 0.8fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:700">Tim Proyek Alpha</div><div style="color:#71717a;font-size:10px">Gabungan IT &amp; Finance untuk implementasi ERP</div></div>
          <div style="padding:9px 10px;font-size:11px">Jakarta HQ</div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">6 employees</span></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 1.2fr 1fr 0.8fr 30px;align-items:center">
          <div style="padding:9px 10px"><div style="font-weight:700">Tim Piket Gudang</div><div style="color:#71717a;font-size:10px">Rotasi jaga akhir pekan</div></div>
          <div style="padding:9px 10px;font-size:11px">Kantor Cabang Makassar</div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">1 employee</span></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Inactive</span></div><div style="color:#71717a">⋯</div>
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
| **Refresh** | Muat ulang daftar shift dan grup |
| **Add New Shift** | Buka modal shift baru (tampil di tab **Shift Catalog**; butuh `attendance:write` atau `attendance:config`) |
| **Add Group** | Buka modal grup baru (tampil di tab **Custom Groups**; izin sama) |
| **Shift Catalog (n)** | Tab daftar shift; angka = total shift |
| **Custom Groups (n)** | Tab daftar grup karyawan; angka = total grup |
| Kolom pencarian | *Search shift name or code...* / *Search group name...* — menyaring baris pada halaman tabel yang sedang tampil |
| **⋯** (aksi baris shift) | **Edit shift**, **Deactivate shift** / **Activate shift** |
| **⋯** (aksi baris grup) | **Edit group**, **Deactivate group** / **Activate group** |
| Paginasi | Default 10 baris per halaman, bisa diubah |

> Pola rotasi (Rotation Patterns) dulu menjadi tab ketiga di halaman ini,
> sekarang pindah ke **Attendance → Working Time Patterns**.

### Kolom Tabel — Shift Catalog

| Kolom | Isi |
|---|---|
| **Name & Code** | Nama shift + kode shift (teks kecil biru) |
| **Type** | **Fixed Hours** (jam tetap) atau **Flexible (WFH)** (target jam) |
| **Hours & Break** | Jam mulai — selesai; di bawahnya jumlah istirahat, total menit istirahat tidak dibayar, dan **Night Shift (+1 Day)** bila shift melewati tengah malam |
| **Effective Duration** | Jam kerja efektif, mis. `8 hrs` |
| **Description** | Keterangan shift, atau `-` |
| **Status** | **Active** (hijau) atau **Inactive** (abu-abu) |

### Kolom Tabel — Custom Groups

| Kolom | Isi |
|---|---|
| **Group Name** | Nama grup + deskripsi (atau `-`) |
| **Branch** | Cabang pemilik grup |
| **Members** | Jumlah anggota, mis. **6 employees** |
| **Status** | **Active** atau **Inactive** |

## Modal Add New Shift Pattern / Edit Shift Pattern

Deskripsi modal: *"Register working hours and breaks for use in schedule
assignments."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Shift Name \*** | teks | Ya | Placeholder *e.g. Morning Operations Shift* | Shift Pagi Gudang |
| **Shift Code \*** | teks | Ya | Placeholder *OPS-AM*; kode singkat yang tampil di jadwal | OPS-AM |
| **Hours Type** | pilihan | Ya (default) | **Fixed Hours (Set Time)** = jam masuk/pulang pasti; **Flexible (Target Hours)** = karyawan cukup memenuhi target jam | Fixed Hours (Set Time) |
| **Effective Hours** | angka | Ya | Jam kerja efektif per hari; default 8. Diisi manual (tidak dihitung otomatis dari jam & istirahat); bila kosong/0 tersimpan sebagai 8 | 7.5 |
| **Start Time** | jam | Ya | Default 08:00 | 06:00 |
| **End Time** | jam | Ya | Default 17:00 | 14:00 |
| **Breaks** | daftar | Tidak | Lihat tabel di bawah. Shift baru langsung berisi satu istirahat 12:00–13:00. Ringkasan *(n) break(s) • (m) min unpaid* tampil di atas daftar | — |
| **Clock-in window** | centang + 2 jam | Tidak | Bila dicentang, isi jam *dari* dan *sampai* (default 06:00–10:00); bila tidak, tertulis *Any time* | 05:30 – 07:00 |
| **Clock-out window** | centang + 2 jam | Tidak | Default 15:00–23:00 saat dicentang | 13:30 – 16:00 |
| **Night shift crosses midnight (Cross-Midnight, e.g. 22:00 - 06:00)** | centang | Tidak | Centang untuk shift malam yang selesai keesokan hari | ✔ untuk 22:00–06:00 |
| **Description / Purpose** | teks | Tidak | Placeholder *e.g. Operations & warehouse division only...* | Khusus divisi gudang Makassar |

Teks penjelasan **Clock Windows**: *"Self clock-in/out outside these times is
rejected — employees fix it through a correction request."* Artinya absen
mandiri di luar jendela ditolak, dan karyawan harus mengajukan koreksi absensi.

### Isian tiap istirahat (Breaks)

Klik **Add break** untuk menambah baris; ikon tempat sampah (*Remove break*)
menghapusnya. Bila semua dihapus tertulis *"No breaks — the whole shift counts
as working time."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| Jenis istirahat | pilihan | Ya | Placeholder *Select break type*; pilihan diambil dari Common Codes kategori **Break Type** (Company Settings) | Meal |
| **Start** / **End** | jam | Ya (istirahat tetap) | Jam mulai & selesai; tidak boleh sama. Pada istirahat fleksibel labelnya menjadi **Allowed from** / **Allowed until** | 12:00 – 13:00 |
| **Paid (counts as working time)** | centang | Tidak | Bila dicentang, istirahat dihitung jam kerja (tidak masuk menit *unpaid*) | — |
| **Flexible (take any time)** | centang | Tidak | Istirahat boleh diambil kapan saja | ✔ |
| **Duration (min)** | angka | Ya bila tanpa rentang | Hanya untuk istirahat fleksibel. Tidak boleh melebihi lebar rentang; `0` = seluruh rentang | 15 |
| **Limit to a time range** | centang | Tidak | Hanya untuk istirahat fleksibel. Dicentang: *"Taken any time between (mulai) and (selesai); 0 = the whole (n)-min window."* Tidak dicentang: *"Taken any time during the shift."* (durasi default 60 menit) | — |

Di kanan tiap baris tampil durasi istirahat dalam menit.

Tombol: **Cancel** / **Save Shift** (tambah) atau **Save Changes** (ubah).

### Pesan validasi & toast

Semua validasi muncul sebagai toast **Validation Failed**:

| Kondisi | Pesan |
|---|---|
| Nama/kode kosong | *Shift name and code are required.* |
| Istirahat tanpa jenis, atau jam mulai/selesai kosong/sama | *Each break needs a type and a start/end time that differ.* |
| Istirahat fleksibel tanpa rentang dan tanpa durasi | *Break "(jenis)" needs a duration when it has no time range.* |
| Durasi melebihi rentang | *Break "(jenis)" duration can't exceed its allowed window.* |
| Jendela absen dengan jam dari = sampai | *A clock window needs different from/to times.* |

Berhasil → **Shift Added** (*"(nama) was saved to the shift catalog."*) atau
**Shift Updated**. Gagal → **Failed to Add Shift** / **Failed to Update Shift**
beserta alasan dari server.

## Modal Add Custom Group / Edit Custom Group

Custom Group adalah kumpulan karyawan yang disusun bebas (mis. tim proyek lintas
departemen). Pola jadwal di **Working Time Patterns** dapat menargetkan grup ini
sehingga semua anggotanya mendapat jadwal yang sama. Deskripsi modal:
*"A freely-composed set of employees a scopeType='custom' pattern can target."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Branch \*** | pilihan | Ya | Terisi cabang pertama secara default. **Tidak bisa diubah** saat edit | Jakarta HQ |
| **Group Name \*** | teks | Ya | Placeholder *e.g. Project Alpha Team* | Tim Proyek Alpha |
| **Description** | teks | Tidak | Placeholder *e.g. Cross-department task force for Project Alpha* | Gabungan IT & Finance untuk implementasi ERP |
| **Members** | multi-pilih + cari | Tidak | Placeholder *Search employees...*; ketik nama/NIK, hasil tampil sebagai *Nama (No. Karyawan)* | Rina Wulandari (EMP-0042) |

Tombol: **Cancel** / **Save Group** (tambah) atau **Save Changes** (ubah).
Validasi (toast **Validation Failed**): *Group name is required.*, *Select a
branch first.* Berhasil → **Group Added** (*"(nama) was saved."*) atau **Group
Updated**; gagal → **Failed to Add Group** / **Failed to Update Group**.

## Modal Konfirmasi Nonaktif

| Aksi | Judul | Pesan | Tombol |
|---|---|---|---|
| **Deactivate shift** | **Deactivate Shift?** | *"(nama)" will no longer be assignable to new schedules. Schedules already using it are untouched.* | **Cancel** / **Deactivate** (merah) |
| **Deactivate group** | **Deactivate Group?** | *"(nama)" will stop matching any custom-scope pattern that targets it. Existing schedule rows are untouched.* | **Cancel** / **Deactivate** (merah) |

Toast: **Shift Deactivated** / **Group Deactivated**. **Activate shift** /
**Activate group** langsung berjalan tanpa konfirmasi → **Shift Activated** /
**Group Activated**.

## Langkah — Menambah Shift

1. Buka **HR Setting → Working Time**, pastikan tab **Shift Catalog** aktif.
2. Klik **Add New Shift**.
3. Isi **Shift Name**, **Shift Code**, pilih **Hours Type**, dan isi
   **Effective Hours**.
4. Atur **Start Time** dan **End Time**. Untuk shift malam, centang **Night
   shift crosses midnight**.
5. Sesuaikan istirahat: ubah jenis dan jamnya, atau klik **Add break** untuk
   menambah (mis. istirahat sholat). Centang **Paid** bila istirahat dibayar.
6. Bila perlu, aktifkan **Clock-in window** / **Clock-out window** untuk
   membatasi jam absen mandiri.
7. Klik **Save Shift**. Shift siap dipakai saat menyusun pola di **Attendance →
   Working Time Patterns**.

## Langkah — Membuat Custom Group

1. Buka tab **Custom Groups**, lalu klik **Add Group**.
2. Pilih **Branch** dan isi **Group Name**.
3. Pada **Members**, ketik nama karyawan lalu pilih; ulangi untuk anggota lain.
4. Klik **Save Group**. Grup kini bisa dipilih sebagai target pola jadwal.

## Catatan & Aturan

- Menonaktifkan shift **tidak** mengubah jadwal yang sudah memakainya; shift
  hanya tidak bisa dipilih untuk jadwal baru. Shift tidak bisa dihapus.
- Istirahat yang **tidak dibayar** mengurangi jam kerja yang dihitung; istirahat
  **Paid** tetap dihitung sebagai jam kerja.
- Cabang grup bersifat permanen; untuk memindahkan grup ke cabang lain buat grup
  baru.
- Pencarian hanya menyaring baris di halaman tabel yang sedang tampil; pindah
  halaman bila data yang dicari tidak muncul.
- Menu aksi **⋯** tampil untuk semua pengguna yang bisa membuka halaman; bila
  tidak punya izin ubah, perubahan akan ditolak server.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/working-time/index.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useShifts.ts` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useScheduleGroups.ts` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useEmployees.ts` (`useEmployeeSearch`), `useTenantBranches.ts` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/CommonCodeSelect.vue` |
| Navigasi | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Modul | [Shift & Jadwal](/modules/attendance/02-shift-schedule) |
