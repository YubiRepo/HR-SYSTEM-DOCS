# 07 · Salary Component

Katalog **komponen gaji** perusahaan — semua jenis pendapatan (gaji pokok,
tunjangan) dan potongan (pinjaman, iuran) yang bisa muncul di slip gaji. Di sini
Anda menentukan sifat tiap komponen: nominal tetap per karyawan atau dihitung
dengan formula, kena pajak atau tidak, masuk dasar BPJS atau tidak.

**Akses:** `/tenants/hr-setting/salary-component` · **Permission:** menu tampil
bila fitur paket **Payroll** aktif dan punya salah satu dari `payroll:run`,
`payroll:approve`, `payroll:config`; tombol **Add Component** hanya untuk
`payroll:config`

## Tampilan

<!-- ui-mock: hr-salary-component -->
```html
<div aria-label="Mockup Salary Component" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Salary Component</div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #e4e4e7;padding-bottom:14px">
        <div><div style="font-weight:800;font-size:16px">Salary Component</div><div style="color:#71717a;font-size:11px;margin-top:3px">Define earnings allowances and deduction rules — fixed amounts are set per employee; formula components compute live at run time.</div></div>
        <div style="display:flex;gap:8px;white-space:nowrap">
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 12px;font-weight:600">↻ Refresh</span>
          <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">+ Add Component</span>
        </div>
      </div>
      <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;border:1px solid #e4e4e7;background:#fafafa;border-radius:10px;padding:8px 10px">
        <div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa;width:280px">Search component code or name...</div>
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:5px 10px">Display ⚙</span>
      </div>
      <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:1.3fr 0.8fr 1.6fr 2fr 36px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
          <div style="padding:9px 10px">Component</div><div style="padding:9px 10px">Type</div><div style="padding:9px 10px">Calculation</div><div style="padding:9px 10px">Flags</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 0.8fr 1.6fr 2fr 36px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-family:monospace;font-weight:700;font-size:11px">BASIC <span style="font-family:Inter,sans-serif;background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 6px;font-size:10px;font-weight:500">System</span></div><div style="color:#71717a;font-size:11px">Gaji Pokok</div></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">↗ Earning</span></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Fixed amount (per employee)</span></div>
          <div style="padding:9px 10px;display:flex;gap:4px;flex-wrap:wrap;font-size:10px"><span style="background:#e0f2fe;color:#0369a1;border-radius:6px;padding:1px 6px">Taxable</span><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 6px">BPJS base</span><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 6px">Recurring</span></div>
          <div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 0.8fr 1.6fr 2fr 36px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-family:monospace;font-weight:700;font-size:11px">TUNJ_TRANSPORT</div><div style="color:#71717a;font-size:11px">Tunjangan Transport</div></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">↗ Earning</span></div>
          <div style="padding:9px 10px;font-family:monospace;font-size:11px;color:#0369a1">ƒ(x) 25000 * present_days</div>
          <div style="padding:9px 10px;display:flex;gap:4px;flex-wrap:wrap;font-size:10px"><span style="background:#e0f2fe;color:#0369a1;border-radius:6px;padding:1px 6px">Taxable</span><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 6px">Non-BPJS</span><span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:1px 6px">Variable</span></div>
          <div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 0.8fr 1.6fr 2fr 36px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px"><div style="font-family:monospace;font-weight:700;font-size:11px">TUNJ_MAKAN</div><div style="color:#71717a;font-size:11px">Tunjangan Makan</div></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">↗ Earning</span></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Fixed amount (per employee)</span></div>
          <div style="padding:9px 10px;display:flex;gap:4px;flex-wrap:wrap;font-size:10px"><span style="background:#e0f2fe;color:#0369a1;border-radius:6px;padding:1px 6px">Taxable</span><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 6px">Non-BPJS</span><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 6px">Recurring</span></div>
          <div style="color:#71717a">⋯</div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 0.8fr 1.6fr 2fr 36px;align-items:center">
          <div style="padding:9px 10px"><div style="font-family:monospace;font-weight:700;font-size:11px">POT_PINJAMAN</div><div style="color:#71717a;font-size:11px">Potongan Pinjaman</div></div>
          <div style="padding:9px 10px"><span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:1px 8px;font-size:10px">↙ Deduction</span></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Fixed amount (per employee)</span></div>
          <div style="padding:9px 10px;display:flex;gap:4px;flex-wrap:wrap;font-size:10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 6px">Non-tax</span><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 6px">Non-BPJS</span><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 6px">Recurring</span><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 6px">One-time (until revoked)</span></div>
          <div style="color:#71717a">⋯</div>
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
| **Refresh** | Memuat ulang daftar komponen |
| **Add Component** | Membuka modal **Add Salary Component** (hanya `payroll:config`) |
| Kolom pencarian | *Search component code or name...* — pencarian dilakukan pada kode komponen |
| **Display** | Menampilkan/menyembunyikan kolom tabel |
| **⋯** (aksi baris) | **Edit Component** — nonaktif untuk komponen berlabel **System** |

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Component** | Kode komponen (huruf tebal) + badge **System** bila bawaan aplikasi, dan nama tampilan di bawahnya |
| **Type** | **Earning** (hijau, pendapatan) atau **Deduction** (kuning, potongan) |
| **Calculation** | **Fixed amount (per employee)** untuk nominal tetap, atau rumus dengan awalan `ƒ(x)` untuk komponen formula |
| **Flags** | **Taxable** / **Non-tax**, **BPJS base** / **Non-BPJS**, **Recurring** / **Variable**, dan **One-time (single period)** / **One-time (until revoked)** bila komponen sekali-pakai |

### Arti tiap sifat komponen di slip gaji

| Sifat | Pengaruh saat payroll run |
|---|---|
| **Earning** | Menambah penghasilan bruto karyawan |
| **Deduction** | Mengurangi gaji yang diterima (take home pay) |
| **Fixed amount** | Nominal diisi **per karyawan** (di data payroll karyawan pada menu **Salary**), lalu dipakai apa adanya tiap periode |
| **Formula** | Dihitung otomatis saat payroll run dari rumus — bisa memakai kode komponen lain (mis. `BASIC`) dan data absensi (mis. `present_days`, `overtime_hours`) |
| **Taxable** | Ikut dijumlahkan sebagai penghasilan yang dikenai PPh 21 |
| **BPJS base** | Ikut dijumlahkan sebagai upah dasar perhitungan iuran BPJS |
| **Fixed recurring** | Komponen tetap yang muncul setiap periode; bila tidak dicentang dianggap variabel |
| **One-time component** | Hanya berlaku untuk periode tertentu (**Single period only**) atau terus berlaku sampai dicabut pada penugasan karyawan (**Recurring until revoked**) |

## Modal Add Salary Component / Edit Salary Component

Deskripsi modal: *"Define an earnings or deduction rule for the payroll formula
engine."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Component Code** | teks | Ya | Placeholder *e.g. TUNJ_SKILL*. *"Unique code referenced by formulas — cannot be changed after creation."* Nonaktif saat edit | `TUNJ_MAKAN` |
| **Type** | pilihan | Ya | **Earning** / **Deduction**. Tidak bisa diubah setelah dibuat | Earning |
| **Display Name** | teks | Ya | Placeholder *e.g. Skill Allowance*. Nama yang tampil di slip gaji | Tunjangan Makan |
| **Calculation** | pilihan | Tidak | **Fixed amount (set per employee)** (default) atau **Formula (computed live)** | Fixed amount (set per employee) |
| **Formula Expression** | teks | Tidak | Hanya muncul bila **Formula (computed live)**. Placeholder *e.g. (BASIC / 173) \* overtime_hours \* 1.5*; contoh variabel: `BASIC, present_days, overtime_hours` | `25000 * present_days` |
| **Taxable** | centang | Tidak | *PPh 21 basis* — default tercentang | ✓ |
| **BPJS base** | centang | Tidak | *Included in BPJS wage* — default tidak tercentang | — |
| **Fixed recurring** | centang | Tidak | *Applies every period* — default tercentang | ✓ |
| **One-time component** | centang | Tidak | *"Only applies for a specific period or until explicitly revoked, per employee assignment"*. Bila dicentang muncul pilihan **Single period only** / **Recurring until revoked** | — |

Tombol: **Cancel** / **Save Component**.

Pesan:

- Berhasil tambah → **Component created** (*"(nama) added to the catalog."*)
- Berhasil ubah → **Component updated**
- Gagal → **Failed to create component** / **Failed to update component**, dengan
  keterangan mis. *"Please check the component fields — one of them is
  invalid."*, *"This formula creates a circular reference with another
  component."* (rumus saling merujuk), atau *"Payroll is not included in this
  tenant's current plan."*

## Langkah — Menambah Tunjangan Tetap

1. Buka **HR Setting → Salary Component**.
2. Klik **Add Component**.
3. Isi **Component Code** (mis. `TUNJ_MAKAN`), pilih **Type** = **Earning**,
   isi **Display Name** = Tunjangan Makan.
4. Biarkan **Calculation** = **Fixed amount (set per employee)**.
5. Atur centang **Taxable**, **BPJS base**, dan **Fixed recurring** sesuai
   kebijakan perusahaan.
6. Klik **Save Component**.
7. Isi nominal tunjangan (mis. Rp 750.000) untuk tiap karyawan di menu
   **Salary → Employee Payrolls**.

## Langkah — Menambah Komponen Formula

1. Klik **Add Component**, isi kode, tipe, dan nama.
2. Pilih **Calculation** = **Formula (computed live)**.
3. Tulis rumus di **Formula Expression**, mis. `25000 * present_days` untuk
   uang transport Rp 25.000 per hari hadir.
4. Klik **Save Component**. Nilai dihitung otomatis pada setiap payroll run.

## Langkah — Mengubah Komponen

1. Pada baris komponen, klik **⋯ → Edit Component**.
2. Ubah **Display Name**, **Calculation**/rumus, atau centang sifatnya.
3. Klik **Save Component**.

## Catatan & Aturan

- **Component Code** dan **Type** tidak bisa diubah setelah dibuat. Bila salah,
  buat komponen baru dengan kode yang benar.
- Komponen berlabel **System** (mis. potongan PPh 21 dan BPJS) adalah komponen
  bawaan yang dihitung sistem dan tidak dapat diedit.
- Tidak ada aksi hapus/nonaktifkan komponen di halaman ini.
- Perubahan sifat komponen berlaku untuk payroll run berikutnya; tarif pajak dan
  BPJS diatur di [Tax and BPJS](./08-tax-bpjs).
- Pengguna tanpa `payroll:config` tetap bisa melihat katalog, tetapi tidak bisa
  menambah komponen.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/salary-component.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/usePayComponents.ts` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/AppDataTable.vue` |
| Gate menu | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Modul | [Komponen Gaji](/modules/payroll/02-salary-components), [Formula Engine](/modules/payroll/08-formula-engine) |
