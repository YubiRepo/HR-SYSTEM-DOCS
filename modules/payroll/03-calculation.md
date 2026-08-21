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
6. Gaji bersih  = gaji kotor − iuran BPJS (karyawan) − PPh 21 − potongan lain
```

> **Kenapa BPJS sebelum PPh 21?** Iuran BPJS yang ditanggung karyawan (JHT, JP) menjadi pengurang penghasilan dalam perhitungan PPh 21. Jika pajak dihitung lebih dulu, hasilnya salah.

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
- **JKK bervariasi** menurut tingkat risiko pekerjaan (data per tenant/jabatan).
- **Dasar BPJS** = komponen ber-flag `bpjs_base` (umumnya pokok + tunjangan tetap).
- Iuran karyawan (JHT+JP) menjadi **pengurang** PPh 21.

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
- Tabel TER disimpan sebagai data konfigurasi.

### 4.2 Desember (Pasal 17, rekonsiliasi tahunan)
Di masa pajak terakhir, hitung pajak setahun yang sebenarnya lalu kurangi yang sudah dipotong Jan–Nov:
```
Bruto setahun − biaya jabatan − iuran (JHT/JP karyawan) − PTKP = PKP
PPh setahun   = tarif progresif Pasal 17 atas PKP
PPh Desember  = PPh setahun − total PPh 21 (Jan–Nov)
```
Tarif progresif Pasal 17 (lapisan PKP tahunan): 5% / 15% / 25% / 30% / 35%.

> TER hanya menyederhanakan **cara mencicil** bulanan; total pajak setahun tetap sama dengan perhitungan Pasal 17.

### 4.3 Status PTKP
Menentukan kategori TER & besaran PTKP. Contoh kode: `TK/0` (tidak kawin, 0 tanggungan), `K/0` (kawin), `K/2` (kawin, 2 tanggungan).
- Disimpan per karyawan (di Core HR / payroll profile).
- **Ditetapkan berdasar kondisi 1 Januari tahun berjalan** (mis. menikah Februari → tetap dianggap TK/0 untuk tahun itu).

### 4.4 Hal lain (konfigurabel)
- **Tanpa NPWP**: dapat dikenakan tarif lebih tinggi (aturan berlaku).
- **Biaya jabatan**: 5% dari bruto, maks (mis.) Rp500.000/bulan atau Rp6 jt/tahun — pengurang di skema tahunan.
- **PPh 21 DTP** (ditanggung pemerintah): untuk kriteria tertentu, pajak tidak memotong gaji — perlu ditandai agar pelaporan benar.
- **Metode**: nett / gross / gross-up (siapa menanggung pajak) — dapat dipilih per tenant/komponen.

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
- Setiap angka pada slip harus dapat ditelusuri asal-usulnya (audit).
