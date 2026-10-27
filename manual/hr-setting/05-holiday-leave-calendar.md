# 05 · Holiday & Leave Calendar (Kalender Libur & Cuti Bersama)

Mengelola kalender hari libur perusahaan: libur nasional, cuti bersama, dan
libur perusahaan — termasuk memilih apakah suatu tanggal benar-benar diliburkan
atau tetap hari kerja. Kalender ini dipakai absensi (karyawan tidak dihitung
alpha pada hari libur) dan perhitungan lembur hari libur.

**Akses:** `/tenants/hr-setting/holiday-leave-calendar` · **Permission:** menu
tampil bila fitur **Attendance** aktif di langganan dan punya `attendance:read`;
**Add Holiday / Leave** butuh `attendance:write` atau `attendance:config`;
**Import from National Calendar** butuh `attendance:config`

## Tampilan

Halaman punya dua mode tampilan: **Table** (default) dan **Monthly Calendar**.
Mock berikut memperlihatkan mode **Monthly Calendar**.

<!-- ui-mock: holiday-leave-calendar -->
```html
<div aria-label="Mockup Holiday & Leave Calendar" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Holiday &amp; Leave Calendar</div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
        <div><div style="font-weight:800;font-size:15px">Holiday &amp; Leave Calendar</div><div style="color:#71717a;font-size:11px;margin-top:3px">National holidays and collective-leave opt-out for the company calendar.</div></div>
        <div style="display:flex;gap:8px">
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:5px 10px;font-size:11px">⟳ Refresh</span>
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:5px 10px;font-size:11px">⤓ Import from National Calendar</span>
          <span style="background:#2563eb;color:#fff;border-radius:8px;padding:5px 10px;font-weight:600;font-size:11px">+ Add Holiday / Leave</span>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:10px">
        <div style="display:flex;gap:4px;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:3px;font-size:11px">
          <span style="padding:3px 8px;color:#71717a">▦ Table</span>
          <span style="padding:3px 8px;background:#fff;border-radius:6px;color:#2563eb;font-weight:700">📅 Monthly Calendar</span>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #e4e4e7;border-radius:10px;background:#fff;padding:10px 12px">
        <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700">Holiday Calendar — December 2026</span><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Holidays &amp; Collective Leave</span></div>
        <div style="display:flex;gap:6px;font-size:11px"><span style="border:1px solid #d4d4d8;border-radius:6px;padding:3px 8px">‹</span><span style="padding:3px 8px">Today</span><span style="border:1px solid #d4d4d8;border-radius:6px;padding:3px 8px">›</span></div>
      </div>
      <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:repeat(7,1fr);background:#fafafa;border-bottom:1px solid #e4e4e7;text-align:center;font-size:11px;font-weight:700;color:#71717a;padding:7px 0">
          <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span style="color:#d97706">SAT</span><span style="color:#f43f5e">SUN</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr)">
          <div style="min-height:64px;background:#fafafa;opacity:.3;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">1</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">2</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">3</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">4</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">5</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">6</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">7</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">8</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">9</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">10</span></div><div style="margin-top:4px;padding:3px 4px;border-radius:6px;border:1px solid #e4e4e7;background:#f4f4f5"><div style="font-size:9px;font-weight:700;line-height:1.2">HUT PT Maju Bersama Sejahtera</div><div style="font-size:8px;color:#71717a">Company Holiday · Working day</div></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">11</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">12</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">13</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">14</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">15</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">16</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">17</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">18</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">19</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">20</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">21</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">22</span></div><div style="margin-top:4px;padding:3px 4px;border-radius:6px;border:1px solid #e4e4e7;background:#f4f4f5"><div style="font-size:9px;font-weight:700;line-height:1.2">Hari Ibu</div><div style="font-size:8px;color:#71717a">Observance · Working day</div></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">23</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff1f2;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">24</span><span style="font-size:8px;font-weight:700;color:#e11d48">HOLIDAY</span></div><div style="margin-top:4px;padding:3px 4px;border-radius:6px;border:1px solid #fecdd3;background:#ffe4e6;color:#e11d48"><div style="font-size:9px;font-weight:700;line-height:1.2">Cuti Bersama Natal</div><div style="font-size:8px;color:#71717a">Collective Leave (2x)</div></div><div style="margin-top:4px;padding:3px 4px;border-radius:6px;border:1px solid #e4e4e7;background:#f4f4f5"><div style="font-size:9px;font-weight:700;line-height:1.2">Malam Natal</div><div style="font-size:8px;color:#71717a">Observance · Working day</div></div></div>
          <div style="min-height:64px;padding:5px;background:#fff1f2;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">25</span><span style="font-size:8px;font-weight:700;color:#e11d48">HOLIDAY</span></div><div style="margin-top:4px;padding:3px 4px;border-radius:6px;border:1px solid #fecdd3;background:#ffe4e6;color:#e11d48"><div style="font-size:9px;font-weight:700;line-height:1.2">Hari Raya Natal</div><div style="font-size:8px;color:#71717a">National Holiday (3x)</div></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">26</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">27</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">28</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">29</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">30</span></div></div>
          <div style="min-height:64px;padding:5px;background:#fff;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:11px">31</span></div></div>
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
| **Refresh** | Muat ulang daftar hari libur |
| **Import from National Calendar** | Buka modal impor libur nasional (butuh `attendance:config`) |
| **Add Holiday / Leave** | Buka modal tambah hari libur (butuh `attendance:write` atau `attendance:config`) |
| **Table** / **Monthly Calendar** | Ganti mode tampilan |
| Filter tanggal (mode Table) | Dua isian tanggal *From* dan *To*; default bulan berjalan. Tombol **✕** (*Clear date filter*) mengosongkan filter |
| Kolom pencarian (mode Table) | *Search holidays or collective leave...* — menyaring baris pada halaman tabel yang sedang tampil |
| **Mark as Working Day** / **Mark as Holiday** | Tombol di kolom **Company Status**; langsung membalik status libur tanpa konfirmasi |
| **⋯** (aksi baris) | **Edit holiday**, **Delete holiday** |
| Navigasi bulan (mode Calendar) | **‹** bulan sebelumnya, **Today** kembali ke bulan berjalan, **›** bulan berikutnya |

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Date** | Tanggal libur (format `YYYY-MM-DD`) |
| **Holiday / Observance** | Nama libur + kategori |
| **Company Status** | **Observed as Holiday** (hijau) atau **Working Day (Opt-out)** (kuning), plus tombol pembaliknya |
| **OT Multiplier** | Pengali lembur bila bekerja di tanggal itu, mis. `2x Rate` |

### Mode Monthly Calendar

- Grid 7 kolom mulai **MON** sampai **SUN**; judul *Holiday Calendar — (bulan)
  (tahun)* dengan badge **Holidays & Collective Leave**.
- Satu tanggal bisa berisi **beberapa entri** (mis. cuti bersama sekaligus hari
  peringatan). Semua entri ditampilkan.
- Sel diwarnai merah muda dan diberi label **HOLIDAY** bila minimal satu entri
  berstatus diliburkan. Entri libur tampil merah dengan pengali lembur, mis.
  *Collective Leave (2x)*; entri yang tetap hari kerja tampil abu-abu dengan
  keterangan *· Working day*.
- Tanggal hari ini ditandai lingkaran biru.

## Modal Add Holiday / Collective Leave / Edit Holiday / Collective Leave

Deskripsi modal: *"Register a holiday into the work calendar. Untick 'Observed'
to keep it a working day."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Holiday / Event Name \*** | teks | Ya | Placeholder *e.g. Company Anniversary / Collective Leave* | HUT PT Maju Bersama Sejahtera |
| **Holiday Date \*** | tanggal | Ya | Default hari ini | 2026-12-10 |
| **Holiday Category \*** | pilihan | Ya | Placeholder *Select category*; pilihan dari Common Codes kategori **Holiday Category** (Company Settings) | Company Holiday |
| **Overtime Multiplier** | pilihan | Ya (default) | **2.0x (Regular Holiday Rate)** atau **3.0x (Religious Holiday)** | 2.0x (Regular Holiday Rate) |
| **Observed as Holiday** | centang | — | Default dicentang. Hapus centang bila tanggal ini dicatat tetapi perusahaan tetap bekerja | ✔ |

Tombol: **Cancel** / **Save Holiday** (tambah) atau **Save Changes** (ubah).
Validasi: toast **Validation Failed** — *Holiday name and category are
required.* Berhasil → **Holiday Added** (*"(nama) was saved to the
calendar."*) atau **Holiday Updated**; gagal → **Failed to Add Holiday** /
**Failed to Update Holiday**.

> Hari libur berlaku untuk **semua cabang** — formulir belum menyediakan pilihan
> cabang.

## Modal Import from National Calendar

Deskripsi: *"Fetch national holidays and observances, then choose each row's
category and whether it is a day off. Nothing is saved until you click Save."*
Data yang diambil belum punya kategori dan belum diputuskan libur atau tidak;
Anda memetakannya dulu sebelum menyimpan.

**Periode & filter**

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Year \*** | angka | Ya | 2000–2100; default tahun berjalan | 2027 |
| **Month** | pilihan | Tidak | **Whole year** (default) atau January–December | Whole year |
| **Source** | pilihan | Tidak | Muncul setelah data diambil: **All sources**, **National holidays & collective leave**, **Observances** | All sources |

Tombol **Fetch** mengambil data (berubah menjadi **Refresh** setelahnya).
Mengubah **Year**/**Month** mengosongkan pratinjau agar daftar lama tidak
tersimpan ke periode yang salah. Sebelum mengambil tertulis *"Choose a period and
click Fetch."*; bila kosong *"No holidays found for this period."*

**Toolbar aksi massal** (berlaku untuk baris yang dicentang): *(n) selected*,
pilihan kategori *Category for selected* + **Apply Category**, **Mark as Day
Off**, **Mark as Working Day**.

**Kolom pratinjau**

| Kolom | Isi |
|---|---|
| Centang | Pilih baris; centang di header = pilih semua baris yang tampil. **National Holiday** tercentang otomatis, **Observance** tidak |
| **Date** | Tanggal |
| **Name** | Nama libur — **bisa diedit** sebelum disimpan; deskripsi sumber di bawahnya |
| **Source** | Badge **National Holiday** atau **Observance**, jenis dari sumber, dan *· not a public holiday* bila bukan libur resmi |
| **Category** | Pilih kategori; badge kuning **Uncategorized** bila belum dipilih |
| **Day Off?** | **Not decided** (kuning) / **Day off** / **Working day** |

Baris yang tanggal dan namanya sudah ada di kalender tampil pudar dengan badge
**Already exists** dan tidak bisa dipilih.

Tombol: **Cancel** / **Save (n) Holiday(s)**. Tombol simpan hanya aktif bila
ada baris terpilih dan semuanya sudah punya kategori dan keputusan libur; bila
belum, tampil *"(n) selected row(s) still need a category and a day-off
decision."* Berhasil → toast **Holidays Imported** (*"(n) saved, (m) skipped
(already exist)."*). Gagal → **Failed to Fetch Holidays** atau **Failed to
Import Holidays**.

## Modal Delete Holiday?

*"(nama)" will be removed from the calendar.* Tombol **Cancel** / **Delete**
(merah). Berhasil → **Holiday Deleted**; gagal → **Failed to Delete Holiday**.

Tombol **Mark as Working Day** / **Mark as Holiday** menampilkan toast **Marked
as Working Day** / **Marked as Holiday** (gagal → **Failed to Update Holiday
Status**).

## Langkah — Mengimpor Libur Nasional Setahun

1. Buka **HR Setting → Holiday & Leave Calendar**.
2. Klik **Import from National Calendar**.
3. Isi **Year**, biarkan **Month** = **Whole year**, lalu klik **Fetch**.
4. Periksa daftar. Centang tambahan hari peringatan yang ingin dicatat, hapus
   centang yang tidak diperlukan; ubah **Name** bila perlu.
5. Pilih kategori di *Category for selected* lalu klik **Apply Category**
   (atau pilih per baris di kolom **Category**).
6. Klik **Mark as Day Off** untuk tanggal yang diliburkan; untuk yang tetap
   masuk kerja, centang barisnya saja lalu klik **Mark as Working Day** (atau
   atur per baris di **Day Off?**).
7. Klik **Save (n) Holiday(s)**. Tanggal yang sudah ada otomatis dilewati.

## Langkah — Menambah Libur Perusahaan

1. Klik **Add Holiday / Leave**.
2. Isi **Holiday / Event Name**, **Holiday Date**, dan **Holiday Category**.
3. Pilih **Overtime Multiplier** dan pastikan **Observed as Holiday** dicentang.
4. Klik **Save Holiday**.

## Langkah — Membatalkan Cuti Bersama (Tetap Masuk Kerja)

1. Di mode **Table**, cari baris cuti bersama.
2. Klik **Mark as Working Day** di kolom **Company Status**. Status berubah
   menjadi **Working Day (Opt-out)** dan karyawan wajib masuk pada tanggal itu.

## Catatan & Aturan

- Tanggal berstatus **Observed as Holiday** tidak dihitung alpha bila karyawan
  tidak masuk; bila karyawan bekerja, lemburnya memakai **OT Multiplier**.
  Tanggal **Working Day (Opt-out)** diperlakukan sebagai hari kerja biasa.
- Satu tanggal boleh memiliki beberapa entri; sebuah entri dianggap duplikat
  hanya bila tanggal **dan** namanya sama.
- Hasil impor tidak menyertakan pengali lembur, sehingga kolom **OT Multiplier**
  tampil `0x Rate`. Buka **Edit holiday** dan simpan untuk menetapkan pengalinya.
- Mode **Monthly Calendar** menampilkan satu bulan penuh, terlepas dari filter
  tanggal di mode **Table**.
- Menu **⋯** dan tombol **Mark as …** tampil untuk semua pengguna yang bisa
  membuka halaman; tanpa izin ubah, perubahan akan ditolak server.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/holiday-leave-calendar.vue` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/attendance/HolidayImportModal.vue` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/CommonCodeSelect.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useHolidays.ts` (`useHolidays`, `useHolidayImport`) |
| Navigasi | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Modul | [Shift & Jadwal — Hari Libur & Kalender](/modules/attendance/02-shift-schedule) |
| Modul | [Lembur & Keterlambatan](/modules/attendance/04-overtime-lateness) |
