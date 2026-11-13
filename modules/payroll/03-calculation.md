<!-- 📁 modules/payroll/03-calculation.md -->
# 03 · Calculation

Inti perhitungan payroll. **Urutan langkah tidak boleh dibalik** karena tiap langkah bergantung pada hasil sebelumnya.

---

## 1. Urutan Perhitungan (per karyawan)

```
1. Gaji kotor   = Σ komponen earning
2. Dasar BPJS   = Σ komponen earning ber-flag bpjs_base
3. Iuran BPJS   = hitung dari dasar BPJS (lihat §3)
4. Penghasilan bruto pajak = Σ komponen taxable
5. PPh 21       = hitung (setelah BPJS, karena iuran karyawan mengurangi pajak)
6. Potongan hutang = cicilan pinjaman aktif (dengan batas cap, lihat 10-loan-deduction.md)
7. Gaji bersih  = gaji kotor − iuran BPJS (karyawan) − PPh 21 − potongan lain − cicilan hutang
```

> **Sumber komponen (P2):** karyawan yang punya versi kompensasi (`employee_compensations`, bukan draft) dihitung dari baris `employee_components` milik versi yang **berlaku pada hari terakhir periode run**, ditambah baris manual / one-time (`compensation_id` NULL). Baris milik versi lain (draft, sudah digantikan, atau belum berlaku) diabaikan. Karyawan tanpa versi kompensasi tetap memakai semua baris manual seperti sebelum P2. Pergantian versi di tengah periode **belum diprorata** — versi yang berlaku di akhir periode dipakai penuh. Komponen `rate` hanya mengisi variabel formula dan tidak dibayar.

> **Kenapa BPJS sebelum PPh 21?** Iuran BPJS yang ditanggung karyawan (JHT, JP) menjadi pengurang penghasilan dalam perhitungan PPh 21. Jika pajak dihitung lebih dulu, hasilnya salah.

> **Potongan hutang & cap:** cicilan pinjaman dipotong dari gaji bersih, dibatasi `max_deduction_percent` (configurable) agar gaji tak habis. Bila melewati cap, cicilan periode itu dikurangi (tenor memanjang). Detail: `10-loan-deduction.md`.

---

## 2. Semua Angka = Data Konfigurasi

Tarif, persentase, dan plafon **tidak di-hardcode**. Disimpan sebagai tabel konfigurasi ber-versi (berlaku sejak tanggal tertentu), agar saat regulasi berubah cukup memperbarui data. Contoh angka di bawah merujuk ketentuan 2026 dan bersifat ilustratif.

---

## 3. BPJS

Lima program, tiap program beda tarif & pihak penanggung. Yang **memotong gaji karyawan** hanya JHT, JP, dan Kesehatan.

| Program | Total | Dipotong karyawan | Dibayar perusahaan | Dasar / plafon |
|---|---|---|---|---|
| **BPJS Kesehatan** | 5% | 1% | 4% | plafon upah (mis. Rp12 jt) |
| **JHT** (Hari Tua) | 5,7% | 2% | 3,7% | tanpa plafon |
| **JP** (Pensiun) | 3% | 1% | 2% | plafon upah (mis. Rp10.547.400) |
| **JKK** (Kecelakaan) | 0,24–1,74% | 0% | sesuai risiko | — |
| **JKM** (Kematian) | 0,3% | 0% | 0,3% | — |

**Yang memotong take-home pay karyawan = 4%** (JHT 2% + JP 1% + Kesehatan 1%).

**Aturan penting:**
- **Plafon (cap):** iuran dihitung `min(dasar, plafon)`. Mis. gaji Rp20 jt, iuran JP tetap dari Rp10.547.400.
- **JKK bervariasi** menurut tingkat risiko pekerjaan: `bpjs_config` boleh punya satu baris JKK per `risk_class`. Kelas karyawan diambil dari kepesertaannya, lalu `payroll_config.default_jkk_risk_class`; tanpa kelas, tenant dengan satu tarif JKK (atau satu tarif tanpa kelas) tetap memakai tarif itu. Selain itu → `CONFIG_NOT_FOUND`.
- **Seed per tenant:** lima kelas risiko JKK PP 44/2015 — `very_low` 0,24%, `low` 0,54%, `medium` 0,89%, `high` 1,27%, `very_high` 1,74% — dan `default_jkk_risk_class = very_low`. Tenant lama yang dulu di-seed satu baris `low` 0,24% dinamai ulang menjadi `very_low` (migrasi `20261110000007`) lalu dilengkapi backfill `seed_jkk_risk_classes_for_tenant`; tenant yang punya tarif JKK sendiri dilewati.
- **Dasar BPJS** = komponen ber-flag `bpjs_base` (umumnya pokok + tunjangan tetap), atau `wage_base_override` kepesertaan bila diisi. Plafon tetap berlaku.
- Iuran karyawan (JHT+JP) menjadi **pengurang neto** pada rekonsiliasi tahunan PPh 21 (§4.2).
- **Perlakuan pajak per program = data master** (`bpjs_config`, P12), bukan konstanta:
  - `employer_contribution_taxable` — iuran **perusahaan** ditambahkan ke bruto PPh 21 (`taxable_gross`), tidak ke `gross`/`net`. Seed: Kesehatan, JKK, JKM.
  - `employee_contribution_deductible` — iuran **karyawan** mengurangi neto pada rekonsiliasi Desember. Seed: JHT, JP.

**Kepesertaan per karyawan (`employee_bpjs_enrollments`, P11):**
- Hanya program yang `is_enrolled = true` dan berlaku pada **hari terakhir periode run** yang dihitung — tidak dipotong dari karyawan dan tidak dibebankan ke perusahaan bila tidak ikut.
- Karyawan **tanpa baris kepesertaan sama sekali** masih dikenakan semua program (perilaku sebelum P11); hasil calculate mencantumkan mereka di `warnings`.
- Baris awal dibuat otomatis saat tax profile disimpan pertama kali: satu baris per program dari `payroll_config.default_bpjs_programs` (kosong = semua), mulai tanggal masuk.
- Rincian per program (lembaga, nomor kepesertaan, kelas risiko, dasar, tarif, iuran karyawan & perusahaan) disimpan di `payslips.bpjs_details`; jumlahnya sama dengan `bpjs_employee` / `bpjs_employer`.

**Contoh (gaji dasar BPJS Rp8 jt, risiko rendah JKK 0,24%):**
```
Potong karyawan : JHT 160.000 + JP 80.000 + Kes 80.000 = 320.000
Beban perusahaan: JHT 296.000 + JP 160.000 + JKK 19.200 + JKM 24.000 + Kes 320.000 = 819.200
```

---

## 4. PPh 21 (Metode TER)

Sejak 2024, pemotongan bulanan memakai **TER (Tarif Efektif Rata-rata)** — jauh lebih sederhana. Ada dua skema dalam setahun.

### 4.1 Januari–November (TER)
```
PPh 21 bulan ini = Penghasilan bruto bulan ini × tarif TER
```
- **Penghasilan bruto** = Σ komponen taxable bulan itu.
- **Tarif TER** diambil dari tabel resmi, berdasar **kategori PTKP** (A/B/C) & rentang penghasilan.
- Tabel TER disimpan sebagai data konfigurasi. Default per tenant di-seed dari Lampiran PP 58/2023 (berlaku 2024-01-01; A=44, B=40, C=41 baris). Batas atas bracket **inklusif** ("di atas X s.d. Y"), sehingga bruto tepat Rp5.400.000 di kategori A kena 0%.

### 4.1a TER harian — pegawai tidak tetap dibayar harian / per jam (P14)
Berlaku untuk karyawan dengan `employment_tax_status = non_permanent` **dan** salary structure (versi kompensasi yang berlaku) bertipe `daily` / `hourly`. Pegawai tetap, dan pegawai tidak tetap yang digaji bulanan, tetap memakai TER bulanan §4.1.
```
rata-rata per hari = bruto pajak run ÷ hari hadir (present_days dalam cutoff)
rata-rata ≤ Rp450.000              → 0%
rata-rata ≤ Rp2.500.000            → 0,5% × bruto
rata-rata > Rp2.500.000            → tarif Pasal 17 atas 50% × bruto
```
- Tabel TER harian = `tax_ter_rates` kategori `D` (di-seed: 0–450.000 → 0%, 450.001–2.500.000 → 0,5%). Bracket dicocokkan dengan batas atas saja, sehingga rata-rata pecahan (450.000,5) masuk bracket berikutnya, tidak jatuh di celah.
- Rata-rata di atas bracket terakhir → Pasal 17 (tabel `pph21_tax_brackets`) atas `daily_above_cap_bruto_pct` (default 50) × bruto.
- Hari hadir dapat dikoreksi HR lewat input run (P5). Hari hadir 0 dengan penghasilan kena pajak > 0 → karyawan error (bukan run gagal).
- Pegawai tidak tetap **tidak pernah** direkonsiliasi (§4.2), walau run-nya ditandai rekonsiliasi.
- Snapshot payslip: `ter_method` (`monthly` / `daily` / `annual`) dan `taxable_days`; `ter_category` kosong untuk slip TER harian.

### 4.2 Rekonsiliasi tahunan (Pasal 17) — dipilih HR
Di masa pajak terakhir, hitung pajak setahun yang sebenarnya lalu kurangi yang sudah dipotong:
```
Neto di sini       = bruto di sini − biaya jabatan − iuran (JHT/JP karyawan)
Neto setahun       = neto di sini + neto A1 pemberi kerja sebelumnya (bila diserahkan)
PKP                = neto setahun − PTKP (setahun penuh)
PPh setahun        = tarif progresif Pasal 17 atas PKP
PPh masa terakhir  = PPh setahun − PPh 21 yang sudah dipotong di sini − PPh 21 di A1
```
**Data tahun pajak karyawan (P16):**
- **Bulan bekerja** = bulan pertama s.d. bulan terakhir di tahun itu (tabel `employee_tax_years`; tanpa koreksi HR diturunkan dari tanggal masuk / tanggal keluar Core HR). Biaya jabatan = min(5% × bruto di sini, Rp6 jt, `occupational_expense_monthly_cap` (Rp500 rb) × bulan bekerja).
- **A1 pemberi kerja sebelumnya** (`employee_previous_employment_taxes`): diperhitungkan hanya bila karyawan menyerahkannya; neto dan PPh 21-nya diambil apa adanya (biaya jabatan A1 tidak dihitung ulang).
- **Disetahunkan** hanya bila `annualize` (WNA mulai / berhenti menjadi subjek pajak DN di tengah tahun): neto × 12 / bulan bekerja, lalu PPh setahun × bulan bekerja / 12. Kasus lain (masuk / keluar di tengah tahun) **tidak** disetahunkan.
- **Kelebihan potong** (hasil negatif) dikembalikan di slip itu: `payslips.pph21_refund`; bila PPh dipotong dari karyawan (`gross`, `subject`) dibayarkan sebagai earning `PPH21_REFUND` (komponen sistem). Untuk `nett` / `dtp` hanya dicatat. YTD rekonsiliasi berikutnya mengurangi refund.
- `termination` ditolak per karyawan (payslip error) bila bulan terakhir tahun pajak karyawan ≠ bulan masa pajak run.
- Setelah slip `termination` (run lain, bukan draft), slip karyawan itu di masa pajak yang sama / sesudahnya pada tahun itu **diblok** (payslip error), termasuk masuk kembali — sampai §8a butir 11 dijawab.
**Kapan dijalankan (P17, 2026-11-13):** tidak dideteksi dari bulan. HR memilih di run `tax_reconciliation`:
- `none` (default) — semua karyawan TER, termasuk run Desember.
- `year_end` — hanya bila masa pajak run (bulan tanggal bayar) Desember.
- `termination` — karyawan yang keluar; Pasal 17 atas Januari s.d. masa pajak run (bulan keluar), tidak disetahunkan (P16).
- Hanya run `regular` / `final`; run THR / bonus selalu TER dan ikut dijumlahkan di rekonsiliasi.
- Hanya karyawan **tetap** (`employee_tax_profiles.employment_tax_status = permanent`); pegawai tidak tetap selalu TER (dicatat di `payslips.tax_note`).
- Per karyawan, HR bisa mengecualikan atau menambahkan rekonsiliasi di run (`payslips.tax_reconciliation_override`, bertahan saat hitung ulang).
- YTD = semua slip `ok` tahun pajak itu s.d. masa pajak run (semua type, termasuk THR / bonus di bulan yang sama) dari run yang sudah **approved / paid / closed**, selain slip run ini. Run draft / calculated tidak ikut (angkanya masih bisa berubah).
Tarif progresif Pasal 17 (lapisan PKP tahunan): 5% / 15% / 25% / 30% / 35%.

> TER hanya menyederhanakan **cara mencicil** bulanan; total pajak setahun tetap sama dengan perhitungan Pasal 17.

### 4.3 Status PTKP
Menentukan kategori TER & besaran PTKP. Contoh kode: `TK/0` (tidak kawin, 0 tanggungan), `K/0` (kawin), `K/2` (kawin, 2 tanggungan).
- Disimpan per karyawan di tax profile payroll (`employee_tax_profiles`).
- **Ditetapkan berdasar kondisi 1 Januari tahun berjalan** (mis. menikah Februari → tetap dianggap TK/0 untuk tahun itu).
- **Daftar status, nominal PTKP tahunan, dan kategori TER adalah data master** (`pph21_ptkp_rates`, HR Setting › Tax and BPJS › PTKP), bukan konstanta kode. Default seed: PMK 101/PMK.010/2016 (TK/0 = Rp54 jt, +Rp4,5 jt per tanggungan/kawin) dan mapping PP 58/2023 (A = TK/0, TK/1, K/0; B = TK/2, TK/3, K/1, K/2; C = K/3).
- Calculate memakai versi master yang berlaku pada **1 Januari tahun pajak** run, sejalan dengan aturan di atas: perubahan master di tengah tahun baru berlaku tahun berikutnya. Kategori TER diambil dari master saat calculate (kolom `employee_tax_profile.ter_category` hanya cache tampilan).
- Master tidak ada, atau status karyawan tidak ada di master → calculate gagal `CONFIG_NOT_FOUND` (tidak ada fallback ke angka lama).

### 4.4 Hal lain (konfigurabel)
- **Tanpa identitas pajak valid (P18)**: identitas pajak (NPWP / NIK, nomor, status `valid` / `unverified`) dari data karyawan Core HR. Karyawan tanpa identitas pajak **atau** belum diverifikasi HR → bila tenant mengaktifkan `no_tax_identity_surcharge_enabled` (HR Setting › Tax and BPJS › Tax Parameters), PPh 21 × (100 + `no_tax_identity_surcharge_pct`)% (default 20%): untuk TER bulanan / harian pada pajak bulan itu, untuk rekonsiliasi pada PPh setahun sebelum dikurangi yang sudah dipotong. Bila tidak aktif → tarif normal + peringatan di `payslips.tax_note`. Karyawan `exempt` tidak terkena. Snapshot: `tax_identity_type`, `tax_identity_number`, `tax_identity_status`, `pph21_surcharge_pct`.
- **Biaya jabatan**: 5% dari bruto, maks (mis.) Rp500.000/bulan atau Rp6 jt/tahun — pengurang di skema tahunan. Persentase dan batas tahunannya data master (`pph21_tax_parameters`, versi per 1 Januari tahun pajak), default seed 5% / Rp6 jt.
- **Perlakuan pajak** (`employee_tax_profile.tax_treatment`, P11):
  - `subject` — PPh 21 dihitung dan dipotong dari gaji.
  - `dtp` (ditanggung pemerintah) — PPh 21 **tetap dihitung** dan disimpan di `payslips.pph21_dtp` untuk pelaporan; `pph21` (yang dipotong) = 0, net tidak berkurang. Di rekonsiliasi Desember, PPh Jan–Nov yang sudah "dibayar" = Σ `pph21` + Σ `pph21_dtp`.
  - `exempt` — bukan subjek PPh 21, tidak dihitung.
- **Snapshot pajak di slip** (P11): `tax_treatment`, `ptkp_status`, `ter_category` & `ter_rate` (Jan–Nov), `has_npwp`, `npwp` disalin ke `payslips` saat calculate, agar slip lama tetap bisa ditelusuri walau tax profile berubah.
- **Metode PPh 21** (`employee_tax_profile.pph21_method`, P12):
  - `gross` (default) — dipotong dari gaji (`payslips.pph21`).
  - `nett` — ditanggung perusahaan (`payslips.pph21_employer_borne`), net tidak berkurang. Dasar pajak sama dengan `gross`.
  - `nett` + DTP — perusahaan tidak menanggung apa pun; nilai DTP dibayarkan ke karyawan sebagai earning `PPH21_DTP` (tidak kena pajak, bukan dasar BPJS), sehingga net naik sebesar DTP.
  - `gross_up` **belum didukung**: ditolak saat simpan; profil lama dihitung sebagai `gross`.
  - PPh 21 terutang = `pph21 + pph21_employer_borne + pph21_dtp`; ketiganya dihitung sebagai "sudah dibayar" Jan–Nov pada rekonsiliasi Desember.

---

## 5. Contoh Gabungan (ilustratif, TER Jan–Nov)

Karyawan TK/0, komponen: pokok 8 jt + tunjangan jabatan 2 jt + transport 500 rb (transport tidak masuk BPJS).
```
Gaji kotor           = 10.500.000
Dasar BPJS           = 10.000.000   (pokok + jabatan)
BPJS potong karyawan = 400.000      (JHT 200rb + JP 100rb + Kes 100rb) *ilustratif
Bruto pajak          = 10.500.000
PPh 21 (TER)         = 10.500.000 × tarif TER kategori A  (lookup tabel)
Gaji bersih          = 10.500.000 − BPJS − PPh21 − potongan lain
```
(Angka BPJS/tarif hanya ilustrasi; nilai riil mengikuti dasar & tabel resmi.)

---

## 6. Ketepatan & Pembulatan

- Uang disimpan sebagai integer minor unit (konsisten API Response Architecture).
- Aturan pembulatan (per komponen / total) ditetapkan konsisten & terdokumentasi agar hasil reproducible.
- Setiap angka pada slip harus dapat ditelusuri asal-usulnya (audit). Sejak P5: tiap baris slip menyimpan pay component, sumber nilai (`fixed` / `formula` / `system`) dan versi formula; variabel absensi/cuti yang dipakai tersimpan di `payroll_run_inputs` (snapshot + input manual), serta versi kompensasi dan schedule tercatat di payslip.