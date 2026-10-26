# 08 · Import Karyawan dari Excel

Mendaftarkan banyak karyawan sekaligus dari satu file Excel — cocok untuk
migrasi data saat perusahaan baru mulai memakai aplikasi, atau saat ada
penerimaan karyawan dalam jumlah besar. Prosesnya dua tahap: file **diperiksa
dulu** tanpa menyimpan apa pun, lalu baris yang valid **diimpor** setelah
dikonfirmasi.

> **Penting — status: rencana.** Halaman ini **belum tersedia** di aplikasi
> backoffice. Mesin validasi & impor di API sudah ada, tetapi penyimpanan file
> unggahan dan halaman UI-nya belum dibangun. Dokumen ini adalah spesifikasi UI
> & alur yang disepakati. Saat fitur dirilis, perbarui dokumen ini mengikuti
> label dan perilaku aktual (lihat [RULES §4](../RULES.md)) lalu hapus catatan ini.

**Akses (usulan):** `/tenants/employee/import`, dibuka dari tombol **Import
Excel** di halaman **Employees Info** · **Permission:** `employees:write`
· **Paket:** fitur impor massal mengikuti paket langganan tenant

## Gambaran Alur

```text
Employees Info ──[Import Excel]──▶ 1. Upload ──▶ 2. Review ──▶ 3. Result
                                      │             │              │
                         Download template   Lihat baris error   Unduh laporan error,
                         lalu unggah file    → perbaiki & unggah  kirim undangan,
                                               ulang, atau lanjut   kembali ke daftar
```

| Langkah | Nama di layar | Apa yang terjadi | Data tersimpan? |
|---|---|---|---|
| 1 | **Upload File** | Unduh template, isi di Excel, unggah kembali, pilih opsi impor | Belum |
| 2 | **Review** | Sistem memeriksa setiap baris dan menampilkan baris valid & baris bermasalah | Belum |
| 3 | **Result** | Baris valid diimpor; baris gagal dilewati dan bisa diunduh untuk diperbaiki | Ya (baris valid saja) |

## Template Excel

Klik **Download Template** di langkah 1 untuk mendapatkan file
`employees-import-template.xlsx`. File berisi tiga sheet:

| Sheet | Isi |
|---|---|
| **Employees** | Baris judul kolom (kolom wajib bertanda `*`) + satu baris contoh yang boleh dihapus |
| **Reference** | Daftar nilai yang boleh dipakai: nama Org Unit, Position (beserta unitnya), Branch, Gender, Marital Status — diambil dari data perusahaan Anda saat template diunduh |
| **Guide** | Petunjuk singkat pengisian dan format tanggal |

### Kolom sheet Employees

| Kolom | Wajib | Format / Aturan | Contoh |
|---|---|---|---|
| `Employee No` | Tidak | Kosongkan agar dibuat otomatis; bila diisi harus unik | EMP-0101 |
| `Full Name *` | Ya | Teks | Budi Santoso |
| `NIK *` | Ya | 16 digit angka, unik di perusahaan | 3175012345678901 |
| `Work Email *` | Ya | Format email, unik | budi@perusahaan.co.id |
| `Hire Date *` | Ya | `YYYY-MM-DD` | 2026-11-02 |
| `Org Unit *` | Ya | Nama unit persis seperti di sheet **Reference** | Engineering |
| `Position *` | Ya | Nama posisi yang berada di **Org Unit** tersebut | Software Engineer |
| `Work Branch` | Tidak | Nama cabang; kosong = cabang default | Jakarta HQ |
| `Phone / WhatsApp` | Tidak | Teks | 0812-3456-7890 |
| `NPWP` | Tidak | Teks | 12.345.678.9-012.000 |
| `Gender` | Tidak | `Male` / `Female` | Male |
| `Marital Status` | Tidak | `Single` / `Married` / `Divorced` / `Widowed` | Single |
| `Date of Birth` | Tidak | `YYYY-MM-DD` | 1995-04-17 |

> **Tip:** Buat dulu seluruh **Org Unit** dan **Position** di menu HR Setting
> sebelum mengimpor karyawan. Baris yang menyebut unit/posisi yang belum ada
> akan ditandai error.

> **Catatan:** Data lain (alamat, keluarga, rekening bank, kontrak, custom
> fields, dll.) tidak termasuk template ini dan dilengkapi lewat halaman detail
> karyawan setelah impor.

## Langkah 1 · Upload File

<!-- ui-mock: employees-import-upload -->
```html
<div aria-label="Mockup Import Karyawan - Upload" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:8px 10px;color:#bfdbfe">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="border-bottom:1px solid #e4e4e7;padding-bottom:12px">
      <div style="color:#71717a;font-size:11px">← Back to Employee List</div>
      <div style="font-size:19px;font-weight:700;margin-top:4px">Import Employees</div>
      <div style="color:#71717a;font-size:12px;margin-top:3px">Add many employees at once from an Excel file. Nothing is saved until you confirm the import.</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px;font-size:12px">
      <span style="display:flex;align-items:center;gap:6px;font-weight:600;color:#2563eb"><span style="width:22px;height:22px;border-radius:999px;background:#2563eb;color:#fff;display:grid;place-items:center;font-size:11px">1</span>Upload File</span>
      <span style="color:#d4d4d8">———</span>
      <span style="display:flex;align-items:center;gap:6px;color:#71717a"><span style="width:22px;height:22px;border-radius:999px;border:1px solid #d4d4d8;display:grid;place-items:center;font-size:11px">2</span>Review</span>
      <span style="color:#d4d4d8">———</span>
      <span style="display:flex;align-items:center;gap:6px;color:#71717a"><span style="width:22px;height:22px;border-radius:999px;border:1px solid #d4d4d8;display:grid;place-items:center;font-size:11px">3</span>Result</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px 14px;margin-top:14px">
      <div><div style="font-weight:600">📄 Start from our template</div><div style="color:#52525b;font-size:11px;margin-top:2px">Includes the column headers, a sample row, and a Reference sheet with your org units, positions, and branches.</div></div>
      <span style="border:1px solid #2563eb;color:#2563eb;background:#fff;border-radius:8px;padding:6px 12px;font-weight:600;white-space:nowrap">⬇ Download Template</span>
    </div>
    <div style="border:2px dashed #d4d4d8;background:#fff;border-radius:12px;padding:26px;text-align:center;margin-top:12px">
      <div style="font-size:22px">⬆</div>
      <div style="font-weight:600;margin-top:4px">Click or drag an Excel file here</div>
      <div style="color:#71717a;font-size:11px;margin-top:3px">.xlsx or .csv · max 1,000 rows · max 5 MB</div>
      <div style="display:inline-flex;gap:8px;align-items:center;border:1px solid #e4e4e7;background:#fafafa;border-radius:8px;padding:6px 10px;margin-top:12px;font-size:12px">📗 karyawan-baru-november.xlsx <span style="color:#71717a">· 48 KB</span> <span style="color:#71717a">✕</span></div>
    </div>
    <div style="font-weight:700;font-size:12px;margin-top:16px">Import Options</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">
      <div style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:10px 12px">
        <div style="font-size:11px;font-weight:600">Import mode</div>
        <div style="margin-top:6px;font-size:12px">◉ Add new employees only</div>
        <div style="margin-top:4px;font-size:12px;color:#52525b">○ Add new &amp; update existing (matched by NIK)</div>
      </div>
      <div style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:10px 12px">
        <div style="font-size:12px"><span style="display:inline-block;width:28px;height:16px;border-radius:999px;background:#2563eb;vertical-align:middle"></span> &nbsp;<b>Create login accounts</b></div>
        <div style="color:#71717a;font-size:11px;margin:2px 0 8px 36px">Uses each row's work email.</div>
        <div style="font-size:12px"><span style="display:inline-block;width:28px;height:16px;border-radius:999px;background:#e4e4e7;vertical-align:middle"></span> &nbsp;<b>Send invitations now</b></div>
        <div style="color:#71717a;font-size:11px;margin:2px 0 0 36px">Leave off to send them later.</div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
      <span style="padding:6px 12px">Cancel</span>
      <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">Check File →</span>
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

| Elemen | Fungsi |
|---|---|
| Penunjuk langkah | **Upload File → Review → Result**; langkah aktif berwarna biru |
| **Download Template** | Unduh template Excel (lihat bagian Template) |
| Area unggah | Klik/seret file `.xlsx` atau `.csv`; nama & ukuran file tampil setelah dipilih, ikon ✕ untuk mengganti |
| **Import mode** | **Add new employees only** (default) — baris dengan NIK yang sudah terdaftar ditandai error. **Add new & update existing** — NIK yang sudah ada diperbarui datanya |
| **Create login accounts** | Default **nyala**: tiap karyawan dibuatkan akun login dengan email kerjanya |
| **Send invitations now** | Default **mati**: undangan login ditahan dan dikirim nanti dari langkah 3 |
| **Cancel** | Kembali ke Employees Info |
| **Check File** | Aktif setelah file dipilih; memeriksa file dan lanjut ke langkah 2 |

## Langkah 2 · Review

<!-- ui-mock: employees-import-review -->
```html
<div aria-label="Mockup Import Karyawan - Review" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:8px 10px;color:#bfdbfe">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="border-bottom:1px solid #e4e4e7;padding-bottom:12px">
      <div style="color:#71717a;font-size:11px">← Back to Employee List</div>
      <div style="font-size:19px;font-weight:700;margin-top:4px">Import Employees</div>
      <div style="color:#71717a;font-size:12px;margin-top:3px">karyawan-baru-november.xlsx · Add new employees only · Create login accounts</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px;font-size:12px">
      <span style="display:flex;align-items:center;gap:6px;color:#15803d"><span style="width:22px;height:22px;border-radius:999px;background:#dcfce7;display:grid;place-items:center;font-size:11px">✓</span>Upload File</span>
      <span style="color:#d4d4d8">———</span>
      <span style="display:flex;align-items:center;gap:6px;font-weight:600;color:#2563eb"><span style="width:22px;height:22px;border-radius:999px;background:#2563eb;color:#fff;display:grid;place-items:center;font-size:11px">2</span>Review</span>
      <span style="color:#d4d4d8">———</span>
      <span style="display:flex;align-items:center;gap:6px;color:#71717a"><span style="width:22px;height:22px;border-radius:999px;border:1px solid #d4d4d8;display:grid;place-items:center;font-size:11px">3</span>Result</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px">
      <div style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:12px"><div style="color:#71717a;font-size:11px">Total rows</div><div style="font-size:22px;font-weight:700;margin-top:2px">52</div></div>
      <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:12px"><div style="color:#15803d;font-size:11px">✓ Ready to import</div><div style="font-size:22px;font-weight:700;margin-top:2px;color:#15803d">49</div></div>
      <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px"><div style="color:#b91c1c;font-size:11px">⚠ Rows with problems</div><div style="font-size:22px;font-weight:700;margin-top:2px;color:#b91c1c">3</div></div>
    </div>
    <div style="display:flex;gap:4px;border-bottom:1px solid #e4e4e7;margin-top:14px;font-size:12px">
      <span style="padding:8px 14px;border-bottom:2px solid #2563eb;color:#2563eb;font-weight:600">Problems (3)</span>
      <span style="padding:8px 14px;color:#71717a">Ready (49)</span>
    </div>
    <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
      <div style="display:grid;grid-template-columns:60px 1.2fr 1fr 2fr;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
        <div style="padding:9px 10px">Row</div><div style="padding:9px 10px">Employee</div><div style="padding:9px 10px">Column</div><div style="padding:9px 10px">Problem</div>
      </div>
      <div style="display:grid;grid-template-columns:60px 1.2fr 1fr 2fr;border-bottom:1px solid #f4f4f5"><div style="padding:9px 10px;font-family:monospace">7</div><div style="padding:9px 10px">Rudi Hartono</div><div style="padding:9px 10px">NIK</div><div style="padding:9px 10px;color:#b91c1c">NIK must be 16 digits</div></div>
      <div style="display:grid;grid-template-columns:60px 1.2fr 1fr 2fr;border-bottom:1px solid #f4f4f5"><div style="padding:9px 10px;font-family:monospace">18</div><div style="padding:9px 10px">Maya Sari</div><div style="padding:9px 10px">Position</div><div style="padding:9px 10px;color:#b91c1c">"Sales Lead" is not a position in "Marketing"</div></div>
      <div style="display:grid;grid-template-columns:60px 1.2fr 1fr 2fr"><div style="padding:9px 10px;font-family:monospace">33</div><div style="padding:9px 10px">Agus Pratama</div><div style="padding:9px 10px">Work Email</div><div style="padding:9px 10px;color:#b91c1c">Email is already used by another employee</div></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">
      <span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">⬇ Download Problem Rows</span>
      <span style="display:flex;gap:8px"><span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">↺ Upload Another File</span><span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">Import 49 Employees</span></span>
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

Pada langkah ini **belum ada data yang disimpan**.

| Elemen | Fungsi |
|---|---|
| Subjudul | Nama file dan opsi yang dipilih di langkah 1 |
| Kartu ringkasan | **Total rows**, **Ready to import** (hijau), **Rows with problems** (merah) |
| Tab **Problems** | Tabel baris bermasalah: **Row** (nomor baris di Excel), **Employee**, **Column**, **Problem** (penjelasan dalam bahasa sederhana) |
| Tab **Ready** | Pratinjau baris yang siap diimpor (nama, NIK, email, unit, posisi) |
| **Download Problem Rows** | Unduh file Excel berisi baris bermasalah saja, dengan kolom tambahan *Problem* — tinggal diperbaiki lalu diunggah ulang |
| **Upload Another File** | Kembali ke langkah 1 dengan opsi yang sama untuk mengganti file |
| **Import N Employees** | Mengimpor **hanya** baris yang siap; nonaktif bila tidak ada baris siap. Membuka konfirmasi sebelum lanjut |

### Konfirmasi

Modal **Import 49 employees?** — *"3 rows with problems will be skipped. You
can fix and import them later."* Tombol **Cancel** / **Yes, Import**.

### Masalah yang diperiksa

| Masalah | Contoh pesan |
|---|---|
| Kolom wajib kosong | *Full Name is required* |
| NIK bukan 16 digit | *NIK must be 16 digits* |
| NIK sudah terdaftar (mode *Add new employees only*) | *An employee with this NIK already exists* |
| NIK/email ganda di dalam file yang sama | *Duplicate NIK in row 12* |
| Format email salah | *Invalid email address* |
| Email sudah dipakai karyawan/akun lain | *Email is already used by another employee* |
| Format tanggal salah | *Hire Date must be YYYY-MM-DD* |
| Org Unit tidak ditemukan | *Org unit "Enginering" not found* |
| Posisi tidak berada di unit tersebut | *"Sales Lead" is not a position in "Marketing"* |
| Branch tidak ditemukan | *Branch "Surabaya" not found* |
| Nilai pilihan tidak dikenal | *Gender must be Male or Female* |

## Langkah 3 · Result

<!-- ui-mock: employees-import-result -->
```html
<div aria-label="Mockup Import Karyawan - Result" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:8px 10px;color:#bfdbfe">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="border-bottom:1px solid #e4e4e7;padding-bottom:12px">
      <div style="color:#71717a;font-size:11px">← Back to Employee List</div>
      <div style="font-size:19px;font-weight:700;margin-top:4px">Import Employees</div>
      <div style="color:#71717a;font-size:12px;margin-top:3px">karyawan-baru-november.xlsx</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px;font-size:12px">
      <span style="display:flex;align-items:center;gap:6px;color:#15803d"><span style="width:22px;height:22px;border-radius:999px;background:#dcfce7;display:grid;place-items:center;font-size:11px">✓</span>Upload File</span>
      <span style="color:#d4d4d8">———</span>
      <span style="display:flex;align-items:center;gap:6px;color:#15803d"><span style="width:22px;height:22px;border-radius:999px;background:#dcfce7;display:grid;place-items:center;font-size:11px">✓</span>Review</span>
      <span style="color:#d4d4d8">———</span>
      <span style="display:flex;align-items:center;gap:6px;font-weight:600;color:#2563eb"><span style="width:22px;height:22px;border-radius:999px;background:#2563eb;color:#fff;display:grid;place-items:center;font-size:11px">3</span>Result</span>
    </div>
    <div style="border:1px solid #e4e4e7;background:#fff;border-radius:12px;padding:22px;margin-top:14px;text-align:center">
      <div style="width:44px;height:44px;border-radius:999px;background:#dcfce7;color:#15803d;display:grid;place-items:center;font-size:22px;margin:0 auto">✓</div>
      <div style="font-size:17px;font-weight:700;margin-top:10px">Import finished</div>
      <div style="color:#71717a;font-size:12px;margin-top:3px">49 employees were added. 3 rows were skipped.</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px;text-align:left">
        <div style="border:1px solid #e4e4e7;border-radius:10px;padding:10px"><div style="color:#71717a;font-size:11px">Processed</div><div style="font-size:18px;font-weight:700">52</div></div>
        <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:10px"><div style="color:#15803d;font-size:11px">Imported</div><div style="font-size:18px;font-weight:700;color:#15803d">49</div></div>
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:10px"><div style="color:#b91c1c;font-size:11px">Skipped</div><div style="font-size:18px;font-weight:700;color:#b91c1c">3</div></div>
        <div style="border:1px solid #e4e4e7;border-radius:10px;padding:10px"><div style="color:#71717a;font-size:11px">Login accounts</div><div style="font-size:18px;font-weight:700">49 <span style="font-size:11px;font-weight:500;color:#b45309">· invitations not sent</span></div></div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">
      <span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">⬇ Download Skipped Rows</span>
      <span style="display:flex;gap:8px"><span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">✉ Send Invitations</span><span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">Go to Employee List</span></span>
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

Selama impor berjalan, layar menampilkan *Importing… 23 of 49* dengan bilah
progres. Pengguna boleh meninggalkan halaman — impor tetap berjalan, dan hasilnya
muncul sebagai notifikasi saat selesai.

| Elemen | Fungsi |
|---|---|
| Ringkasan | **Processed**, **Imported**, **Skipped**, dan **Login accounts** (beserta status undangan) |
| **Download Skipped Rows** | Unduh baris yang dilewati beserta alasannya, untuk diperbaiki & diimpor ulang |
| **Send Invitations** | Kirim undangan login ke semua akun hasil impor ini (muncul bila **Send invitations now** dimatikan di langkah 1). Membuka konfirmasi berisi jumlah penerima |
| **Go to Employee List** | Kembali ke Employees Info; karyawan hasil impor langsung tampil |

## Langkah Lengkap

1. Pastikan **Org Unit**, **Position**, dan **Branch** sudah dibuat di menu
   HR Setting.
2. Buka **Employees → Employees Info**, klik **Import Excel**.
3. Klik **Download Template**, isi sheet **Employees** di Excel (lihat sheet
   **Reference** untuk nilai yang boleh dipakai), lalu simpan.
4. Unggah file ke area unggah, pilih **Import mode**, dan atur **Create login
   accounts** / **Send invitations now**.
5. Klik **Check File**.
6. Periksa tab **Problems**. Bila ada, perbaiki di Excel lalu **Upload Another
   File** — atau lanjutkan dan perbaiki belakangan.
7. Klik **Import N Employees** → **Yes, Import**.
8. Setelah selesai, unduh **Download Skipped Rows** bila ada baris yang
   dilewati, perbaiki, lalu ulangi dari langkah 2.
9. Saat data sudah final, klik **Send Invitations** agar karyawan menerima akses
   login.

## Catatan & Aturan

- Impor bersifat **sebagian berhasil**: baris valid tetap disimpan meski ada
  baris lain yang gagal. Tidak ada yang dibatalkan seluruhnya.
- Status awal karyawan hasil impor mengikuti aturan pendaftaran biasa (sama
  seperti **Add Employee**).
- Undangan login sengaja **ditahan** secara default agar karyawan tidak
  menerima email sebelum data final dan sosialisasi dilakukan.
- Mode **Add new & update existing** hanya memperbarui kolom yang **diisi** di
  file; sel kosong tidak menghapus data yang sudah ada.
- Satu file maksimal 1.000 baris. Untuk data lebih besar, pecah menjadi beberapa
  file.

## Keputusan Terbuka

Hal berikut perlu diputuskan sebelum implementasi dan diperbarui di dokumen ini:

1. **Penyimpanan file** — API belum punya penyimpanan file unggahan; impor
   belum bisa berjalan sampai ini tersedia.
2. **Format template** — template API saat ini berupa **CSV** dengan kolom
   teknis (`org_unit_id`, `position_id`, `branch_id`, `manager_id`). Manual ini
   mengusulkan **Excel (.xlsx)** dengan **nama** unit/posisi/cabang dan sheet
   **Reference**; perlu penerjemahan nama → ID di sisi API.
3. **Kolom tambahan** — apakah template ikut memuat kontrak pertama (Contract
   Type, tanggal), Religion, alamat, Work Policy, dan custom fields.
4. **Direct Manager** — kolom `manager_id` ada di API tetapi field ini sedang
   disembunyikan di UI; ikut di template atau tidak.
5. **Batas file** — angka 1.000 baris / 5 MB masih usulan.
6. **Export → edit → import ulang** — apakah tombol **Export** di Employees Info
   ikut disediakan agar data bisa diubah massal di Excel lalu diimpor ulang
   dengan mode *update*.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | *(belum ada — usulan `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/import.vue`)* |
| Pintu masuk | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/index.vue` *(tombol belum ada)* |
| Endpoint | `modules/core-hr/04-api-contract.md` §14 Bulk Import, §15 Export |
| API | `HR-SYSTEM-API/internal/modules/core-hr/interfaces/http/bulk/`, `application/bulk/command/import_employees.go` |
