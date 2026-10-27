# 08 · Tax and BPJS

Tabel tarif yang dipakai mesin payroll untuk menghitung **iuran BPJS** dan
**PPh 21** di setiap slip gaji: persentase iuran BPJS, tarif efektif rata-rata
(TER) PPh 21 bulanan, dan lapisan tarif progresif tahunan. Setiap tarif punya
tanggal berlaku, sehingga perubahan regulasi cukup ditambahkan sebagai baris
baru tanpa mengubah perhitungan periode lama.

**Akses:** `/tenants/hr-setting/tax-bpjs` · **Permission:** menu tampil bila
fitur paket **Payroll** aktif dan punya salah satu dari `payroll:run`,
`payroll:approve`, `payroll:config`; tombol **Add Rate** / **Add Bracket** hanya
untuk `payroll:config`

## Tampilan

<!-- ui-mock: hr-tax-bpjs -->
```html
<div aria-label="Mockup Tax and BPJS" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Tax and BPJS</div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #e4e4e7;padding-bottom:14px">
        <div><div style="font-weight:800;font-size:16px">Tax and BPJS</div><div style="color:#71717a;font-size:11px;margin-top:3px">BPJS contribution rates, PPh 21 TER rates, and annual progressive brackets — tenant-editable, effective-dated.</div></div>
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 12px;font-weight:600;white-space:nowrap">↻ Refresh</span>
      </div>
      <div style="display:flex;gap:8px;padding:10px 0;border-bottom:1px solid #e4e4e7;font-size:11px;font-weight:600">
        <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px">♡ BPJS Rates (5)</span>
        <span style="background:#f4f4f5;color:#71717a;border-radius:8px;padding:6px 12px">% TER Rates (0)</span>
        <span style="background:#f4f4f5;color:#71717a;border-radius:8px;padding:6px 12px">≡ PPh 21 Brackets (5)</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
        <div style="font-weight:700">BPJS Contribution Rates</div>
        <span style="background:#2563eb;color:#fff;border-radius:6px;padding:4px 10px;font-weight:600;font-size:11px">+ Add Rate</span>
      </div>
      <div style="margin-top:10px;display:flex;justify-content:flex-end;border:1px solid #e4e4e7;background:#fafafa;border-radius:10px;padding:8px 10px">
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:5px 10px">Display ⚙</span>
      </div>
      <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:2fr 0.8fr 0.8fr 1fr 1fr;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
          <div style="padding:9px 10px">Program</div><div style="padding:9px 10px">Employee %</div><div style="padding:9px 10px">Employer %</div><div style="padding:9px 10px">Wage Cap</div><div style="padding:9px 10px">Effective From</div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 0.8fr 0.8fr 1fr 1fr;border-bottom:1px solid #f4f4f5">
          <div style="padding:9px 10px">BPJS Kesehatan</div><div style="padding:9px 10px">1%</div><div style="padding:9px 10px">4%</div><div style="padding:9px 10px">Rp 12.000.000</div><div style="padding:9px 10px">2025-01-01</div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 0.8fr 0.8fr 1fr 1fr;border-bottom:1px solid #f4f4f5">
          <div style="padding:9px 10px">BPJS TK · JHT (Old-age Savings)</div><div style="padding:9px 10px">2%</div><div style="padding:9px 10px">3.7%</div><div style="padding:9px 10px">No cap</div><div style="padding:9px 10px">2025-01-01</div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 0.8fr 0.8fr 1fr 1fr;border-bottom:1px solid #f4f4f5">
          <div style="padding:9px 10px">BPJS TK · JP (Pension)</div><div style="padding:9px 10px">1%</div><div style="padding:9px 10px">2%</div><div style="padding:9px 10px">Rp 10.547.400</div><div style="padding:9px 10px">2025-03-01</div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 0.8fr 0.8fr 1fr 1fr;border-bottom:1px solid #f4f4f5">
          <div style="padding:9px 10px">BPJS TK · JKK (Work Accident)</div><div style="padding:9px 10px">0%</div><div style="padding:9px 10px">0.24%</div><div style="padding:9px 10px">No cap</div><div style="padding:9px 10px">2025-01-01</div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 0.8fr 0.8fr 1fr 1fr">
          <div style="padding:9px 10px">BPJS TK · JKM (Death Benefit)</div><div style="padding:9px 10px">0%</div><div style="padding:9px 10px">0.3%</div><div style="padding:9px 10px">No cap</div><div style="padding:9px 10px">2025-01-01</div>
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
| **Refresh** | Memuat ulang ketiga tabel tarif |
| **BPJS Rates (n)** | Tab tarif iuran BPJS; angka = jumlah baris |
| **TER Rates (n)** | Tab tarif TER PPh 21 bulanan |
| **PPh 21 Brackets (n)** | Tab lapisan tarif PPh 21 tahunan |
| **Add Rate** (tab BPJS / TER) | Membuka modal **Add BPJS Rate** / **Add TER Rate** (hanya `payroll:config`) |
| **Add Bracket** (tab brackets) | Membuka modal **Add PPh 21 Bracket** (hanya `payroll:config`) |
| **Display** | Menampilkan/menyembunyikan kolom tabel |

Tabel di halaman ini **tidak** punya kolom pencarian maupun aksi baris — tarif
hanya bisa ditambah, tidak diubah atau dihapus.

### Tab BPJS Rates — *BPJS Contribution Rates*

| Kolom | Isi |
|---|---|
| **Program** | **BPJS Kesehatan**, **BPJS TK · JHT (Old-age Savings)**, **BPJS TK · JP (Pension)**, **BPJS TK · JKK (Work Accident)**, **BPJS TK · JKM (Death Benefit)** |
| **Employee %** | Porsi iuran yang dipotong dari gaji karyawan |
| **Employer %** | Porsi iuran yang ditanggung perusahaan |
| **Wage Cap** | Batas atas upah yang dipakai menghitung iuran, atau *No cap* |
| **Effective From** | Tanggal mulai tarif berlaku |

Iuran dihitung dari upah dasar BPJS, yaitu jumlah komponen gaji yang bertanda
**BPJS base** di [Salary Component](./07-salary-component). Bagian karyawan muncul
sebagai potongan di slip gaji.

### Tab TER Rates — *PPh 21 TER Rates*

| Kolom | Isi |
|---|---|
| **Category** | **TER A**, **TER B**, atau **TER C** |
| **Income From** / **Income To** | Rentang penghasilan bruto bulanan; *No upper bound* bila tanpa batas atas |
| **Rate** | Tarif efektif (%) untuk rentang tersebut |
| **Effective From** | Tanggal mulai berlaku |

TER dipakai untuk menghitung PPh 21 bulan **Januari–November**. Kategori TER
karyawan ditentukan otomatis dari status PTKP-nya.

> **Penting:** Bila belum ada TER sama sekali, tab ini menampilkan peringatan
> *"No TER rates configured yet. Unlike BPJS rates and PPh 21 brackets, TER
> rates are not seeded automatically — a Jan-Nov payroll run's calculation will
> fail with CONFIG_NOT_FOUND until at least one rate is added per category
> (A/B/C)."* Artinya payroll run Januari–November akan gagal dihitung sampai
> setiap kategori A, B, dan C punya minimal satu tarif.

### Tab PPh 21 Brackets — *PPh 21 Progressive Brackets (Pasal 17, December Reconciliation)*

| Kolom | Isi |
|---|---|
| **Annual Income From** / **Annual Income To** | Rentang penghasilan kena pajak setahun; *No upper bound* untuk lapisan teratas |
| **Rate** | Tarif lapisan (%) |
| **Effective From** | Tanggal mulai berlaku |

Lapisan ini dipakai pada perhitungan **Desember** untuk menghitung PPh 21
setahun penuh, lalu menyelisihkannya dengan PPh 21 yang sudah dipotong
Januari–November.

## Modal Add BPJS Rate

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Program** | pilihan | Ya | Lima program BPJS di atas; default **BPJS Kesehatan** | BPJS TK · JP (Pension) |
| **Employee %** | angka (desimal) | Ya | Default 0 | 1 |
| **Employer %** | angka (desimal) | Ya | Default 0 | 2 |
| **Wage Cap (optional)** | nominal Rp | Tidak | Kosongkan bila tanpa batas | Rp 10.547.400 |
| **Effective From** | tanggal | Ya | Default hari ini | 2025-03-01 |

Tombol: **Cancel** / **Save**. Berhasil → **BPJS rate saved**; gagal →
**Failed to save BPJS rate**.

## Modal Add TER Rate

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Category** | pilihan | Ya | **TER A** / **TER B** / **TER C** | TER A |
| **Income From** | nominal Rp | Ya | Default 0 | Rp 5.400.000 |
| **Income To (leave empty for no upper bound)** | nominal Rp | Tidak | Kosong = tanpa batas atas | Rp 5.650.000 |
| **Rate %** | angka (desimal) | Ya | — | 0.25 |
| **Effective From** | tanggal | Ya | Default hari ini | 2024-01-01 |

Tombol: **Cancel** / **Save**. Berhasil → **TER rate saved**; gagal →
**Failed to save TER rate**.

## Modal Add PPh 21 Bracket

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Annual Income From** | nominal Rp | Ya | Default 0 | Rp 60.000.000 |
| **Annual Income To (leave empty for no upper bound)** | nominal Rp | Tidak | Kosong = lapisan teratas | Rp 250.000.000 |
| **Rate %** | angka (desimal) | Ya | — | 15 |
| **Effective From** | tanggal | Ya | Default hari ini | 2025-01-01 |

Tombol: **Cancel** / **Save**. Berhasil → **PPh 21 bracket saved**; gagal →
**Failed to save PPh 21 bracket**.

Bila isian tidak valid, keterangan galat berbunyi *"Please check the fields —
one of them is invalid."*

## Langkah — Mengisi Tarif TER Pertama Kali

1. Buka **HR Setting → Tax and BPJS**, klik tab **TER Rates**.
2. Klik **Add Rate**.
3. Pilih **Category** (mis. **TER A**), isi **Income From**, **Income To**
   (kosongkan untuk rentang teratas), dan **Rate %** sesuai tabel TER resmi.
4. Isi **Effective From**, klik **Save**.
5. Ulangi sampai seluruh rentang untuk kategori **TER A**, **TER B**, dan
   **TER C** terisi.

## Langkah — Memperbarui Tarif BPJS Karena Regulasi Baru

1. Buka tab **BPJS Rates**, klik **Add Rate**.
2. Pilih **Program**, isi **Employee %**, **Employer %**, dan **Wage Cap
   (optional)** yang baru.
3. Isi **Effective From** dengan tanggal mulai regulasi baru, lalu **Save**.
4. Tarif lama tetap tersimpan dan dipakai untuk periode sebelum tanggal
   tersebut; periode sejak tanggal tersebut memakai tarif baru.

## Catatan & Aturan

- Status PTKP, kategori TER (A/B/C), dan daftar program BPJS ditetapkan
  regulasi — tidak bisa ditambah lewat Common Codes. Yang diatur perusahaan
  hanyalah tarif dan tanggal berlakunya.
- Tarif bersifat *effective-dated*: koreksi dilakukan dengan menambah baris baru
  bertanggal berlaku yang sesuai; tidak ada tombol edit atau hapus.
- Tarif BPJS dan lapisan PPh 21 sudah terisi otomatis; tarif TER harus diisi
  sendiri.
- Modal BPJS tidak memiliki isian kelas risiko untuk JKK; persentase JKK diisi
  langsung di **Employer %**.
- Fitur **TER Simulator** dan **Deduction Cap** (batas total potongan) sudah ada
  di kode tetapi saat ini disembunyikan.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/tax-bpjs.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/usePayrollConfig.ts` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/AppDataTable.vue` |
| Gate menu | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Modul | [Perhitungan Payroll](/modules/payroll/03-calculation), [Payroll Run](/modules/payroll/04-payroll-run) |
