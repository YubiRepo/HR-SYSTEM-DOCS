# 03 · Working Time (Jam Kerja)

Mengelola **katalog shift**: jam masuk–pulang, istirahat, jendela absen, dan
warna tiap shift. Shift di sini **hanya berisi jam** — hari kerja dan rotasi
tidak diatur di sini, melainkan di **HR Setting → Working Patterns**
([`04-working-patterns.md`](./04-working-patterns.md)). Pola kerja itulah yang
dipasang ke karyawan, dan dari jadwal yang dihasilkannya sistem menghitung
telat, pulang cepat, jam kerja efektif, dan lembur.

**Akses:** `/tenants/hr-setting/working-time` (menu **HR Setting → Working
Time**) · **Permission:** menu tampil bila fitur **Attendance** aktif di
langganan dan punya `attendance:read`; tombol **Add New Shift** butuh
`attendance:write` atau `attendance:config`

## Tampilan

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
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
        <div><div style="font-weight:800;font-size:15px">Working Time</div><div style="color:#71717a;font-size:11px;margin-top:3px">Manage the shift catalog — working hours, breaks and clock windows. Assign shifts to employees through Working Patterns.</div></div>
        <div style="display:flex;gap:8px;white-space:nowrap">
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:5px 10px;font-size:11px">⟳ Refresh</span>
          <span style="background:#2563eb;color:#fff;border-radius:8px;padding:5px 10px;font-weight:600;font-size:11px">+ Add New Shift</span>
        </div>
      </div>
      <div style="margin-top:14px;display:flex;justify-content:space-between;border:1px solid #e4e4e7;border-radius:10px;background:#fafafa;padding:8px">
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa;width:240px">🔍 Search shift name or code...</span>
        <div style="display:flex;gap:8px">
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;font-size:11px">All statuses ▾</span>
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;font-size:11px">Display ⚙</span>
        </div>
      </div>
      <div style="margin-top:8px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:1.4fr 0.8fr 1.7fr 0.9fr 1.3fr 0.7fr 30px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
          <div style="padding:9px 10px">Name &amp; Code</div><div style="padding:9px 10px">Type</div><div style="padding:9px 10px">Hours &amp; Break</div><div style="padding:9px 10px">Effective Duration</div><div style="padding:9px 10px">Description</div><div style="padding:9px 10px">Status</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:1.4fr 0.8fr 1.7fr 0.9fr 1.3fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#3b82f6;margin-top:4px"></span><div><div style="font-weight:700">Shift Kantor Reguler</div><div style="color:#2563eb;font-size:10px;font-family:monospace">REG-0817</div></div></div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Fixed Hours</span></div>
          <div style="padding:9px 10px"><div style="font-family:monospace;font-size:11px;font-weight:600">08:00 — 17:00</div><div style="color:#71717a;font-size:10px">1 break(s) • 60 min unpaid</div></div>
          <div style="padding:9px 10px;font-weight:700">8 hrs</div>
          <div style="padding:9px 10px;color:#71717a;font-size:11px">Jakarta HQ — staf kantor</div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋮</div>
        </div>
        <div style="display:grid;grid-template-columns:1.4fr 0.8fr 1.7fr 0.9fr 1.3fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#f59e0b;margin-top:4px"></span><div><div style="font-weight:700">Shift Pagi Gudang</div><div style="color:#2563eb;font-size:10px;font-family:monospace">OPS-AM</div></div></div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Fixed Hours</span></div>
          <div style="padding:9px 10px"><div style="font-family:monospace;font-size:11px;font-weight:600">06:00 — 14:00</div><div style="color:#71717a;font-size:10px">1 break(s) • 30 min unpaid</div></div>
          <div style="padding:9px 10px;font-weight:700">7.5 hrs</div>
          <div style="padding:9px 10px;color:#71717a;font-size:11px">Kantor Cabang Makassar</div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋮</div>
        </div>
        <div style="display:grid;grid-template-columns:1.4fr 0.8fr 1.7fr 0.9fr 1.3fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#8b5cf6;margin-top:4px"></span><div><div style="font-weight:700">Shift Malam Gudang</div><div style="color:#2563eb;font-size:10px;font-family:monospace">OPS-NT</div></div></div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Fixed Hours</span></div>
          <div style="padding:9px 10px"><div style="font-family:monospace;font-size:11px;font-weight:600">22:00 — 06:00</div><div style="color:#71717a;font-size:10px">1 break(s) • 60 min unpaid • Night Shift (+1 Day)</div></div>
          <div style="padding:9px 10px;font-weight:700">7 hrs</div>
          <div style="padding:9px 10px;color:#71717a;font-size:11px">Operasional malam</div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋮</div>
        </div>
        <div style="display:grid;grid-template-columns:1.4fr 0.8fr 1.7fr 0.9fr 1.3fr 0.7fr 30px;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#10b981;margin-top:4px"></span><div><div style="font-weight:700">WFH Fleksibel</div><div style="color:#2563eb;font-size:10px;font-family:monospace">FLEX-WFH</div></div></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Flexible</span></div>
          <div style="padding:9px 10px"><div style="font-family:monospace;font-size:11px;font-weight:600">07:00 — 19:00</div><div style="color:#71717a;font-size:10px">0 break(s) • 0 min unpaid</div></div>
          <div style="padding:9px 10px;font-weight:700">8 hrs</div>
          <div style="padding:9px 10px;color:#71717a;font-size:11px">-</div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Inactive</span></div><div style="color:#71717a">⋮</div>
        </div>
      </div>
      <div style="margin-top:8px;display:flex;justify-content:space-between;color:#71717a;font-size:11px"><span>Total 4 data.</span><span>Rows per page 10 · ‹ 1 ›</span></div>
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
| **Refresh** | Muat ulang daftar shift |
| **Add New Shift** | Buka modal shift baru (tampil bila punya `attendance:write` atau `attendance:config`) |
| Kolom pencarian | *Search shift name or code...* — menyaring baris pada halaman tabel yang sedang tampil |
| Filter status | **All statuses** / **Active** / **Inactive** — menyaring daftar di server dan kembali ke halaman 1 |
| **Display** | Pilih kolom tabel yang ditampilkan |
| **⋮** (aksi baris) | **Edit shift**, lalu **Deactivate shift** (shift aktif) atau **Activate shift** (shift nonaktif) |
| Footer tabel | *Total (n) data.*, **Rows per page** (default 10), dan navigasi halaman |

> Tab **Custom Groups** yang dulu ada di halaman ini sudah dihapus dan saat ini
> tidak tersedia di halaman mana pun. Pengaturan hari kerja dan rotasi juga
> tidak lagi di sini — semuanya ada di **HR Setting → Working Patterns**.

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Name & Code** | Titik warna shift, nama shift, dan kode shift (teks kecil biru) |
| **Type** | **Fixed Hours** (jam tetap) atau **Flexible** (target jam) |
| **Hours & Break** | Jam mulai — selesai; di bawahnya jumlah istirahat, total menit istirahat tidak dibayar, dan **Night Shift (+1 Day)** bila shift melewati tengah malam |
| **Effective Duration** | Jam kerja efektif, mis. `8 hrs` |
| **Description** | Keterangan shift, atau `-` |
| **Status** | **Active** (hijau) atau **Inactive** (abu-abu) |

## Modal Add New Shift / Edit Shift

Deskripsi modal: *"Working hours, breaks and clock windows. Working days and
rotations are set on Working Patterns."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Shift Name \*** | teks | Ya | Placeholder *e.g. Morning Operations Shift* | Shift Pagi Gudang |
| **Shift Code \*** | teks | Ya | Placeholder *OPS-AM*; kode singkat yang tampil di jadwal dan preview pola rotasi. **Tidak bisa diubah** saat edit | OPS-AM |
| **Color** | pemilih warna | Tidak | Default biru `#3b82f6`; dipakai sebagai titik warna di tabel, di Working Patterns, dan kalender jadwal | Oranye |
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

## Modal Deactivate Shift?

*"\"(nama)\" will no longer be selectable in working patterns. This is refused
while an active working pattern still uses it."* Tombol **Cancel** /
**Deactivate** (merah).

| Hasil | Toast |
|---|---|
| Berhasil | **Shift Deactivated** |
| Shift masih dipakai pola kerja aktif | **Shift Is Still In Use** — *"An active working pattern still uses this shift (as its fixed shift or a rotation leg). Change or deactivate those patterns in Working Patterns first."* |
| Gagal karena alasan lain | **Failed to Deactivate Shift** beserta alasannya |

**Activate shift** langsung dijalankan tanpa konfirmasi → toast **Shift
Activated** (gagal → **Failed to Activate Shift**).

## Langkah — Menambah Shift

1. Buka **HR Setting → Working Time**.
2. Klik **Add New Shift**.
3. Isi **Shift Name** dan **Shift Code**, lalu pilih **Color** bila perlu.
4. Pilih **Hours Type** dan isi **Effective Hours**.
5. Atur **Start Time** dan **End Time**. Untuk shift malam, centang **Night
   shift crosses midnight**.
6. Sesuaikan istirahat: ubah jenis dan jamnya, atau klik **Add break** untuk
   menambah (mis. istirahat sholat). Centang **Paid** bila istirahat dibayar.
7. Bila perlu, aktifkan **Clock-in window** / **Clock-out window** untuk
   membatasi jam absen mandiri.
8. Klik **Save Shift**.
9. Pasang shift ke karyawan lewat pola kerja di **HR Setting → Working
   Patterns** (lihat [`04-working-patterns.md`](./04-working-patterns.md)).

## Langkah — Menonaktifkan Shift

1. Pastikan tidak ada pola kerja aktif yang masih memakai shift ini (sebagai
   shift pola tetap maupun sebagai salah satu *leg* rotasi). Bila ada, ubah
   atau nonaktifkan dulu pola itu di **Working Patterns**.
2. Pada baris shift, klik **⋮ → Deactivate shift**.
3. Baca peringatan, lalu klik **Deactivate**.

## Catatan & Aturan

- Shift hanya mengatur **jam** (masuk, pulang, istirahat, jendela absen). Hari
  kerja, hari libur mingguan, dan siklus rotasi diatur pada pola kerja di
  **Working Patterns**; karyawan dipasangkan ke pola, bukan langsung ke shift.
- Shift nonaktif tidak bisa dipilih untuk pola baru. Pola lama yang memakainya
  tetap menampilkan shift itu dengan akhiran *(inactive)*. Shift tidak bisa
  dihapus.
- Istirahat yang **tidak dibayar** mengurangi jam kerja yang dihitung; istirahat
  **Paid** tetap dihitung sebagai jam kerja.
- **Shift Code** permanen setelah shift dibuat; untuk mengganti kode buat shift
  baru.
- Pencarian hanya menyaring baris di halaman tabel yang sedang tampil (dan
  hanya mencocokkan kolom nama); pindah halaman bila data yang dicari tidak
  muncul. Filter status berlaku untuk seluruh data.
- Menu aksi **⋮** tampil untuk semua pengguna yang bisa membuka halaman; bila
  tidak punya izin ubah, perubahan akan ditolak server.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/working-time/index.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useShifts.ts` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/CommonCodeSelect.vue` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/AppDataTable.vue` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/AppPermissionGate.vue` |
| Tipe | `HR-SYSTEM-BACKOFFICE/app/types/attendance.ts` |
| Navigasi | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Modul | [Shift & Jadwal](/modules/attendance/02-shift-schedule) |
