# 02 · Salary Components

## 1. Masalah yang Dipecahkan

Tiap perusahaan punya struktur gaji berbeda — ada yang pakai tunjangan transport & makan, ada yang pakai tunjangan jabatan & pulsa, ada yang pakai komisi. Karena itu komponen gaji **tidak di-hardcode**; perusahaan merakitnya sendiri sebagai data (sejalan filosofi configurable di seluruh sistem).

---

## 2. Pay Component

Setiap baris di slip gaji adalah satu **komponen**. Tiap komponen punya sifat yang menentukan perilakunya saat perhitungan:

| Atribut | Pilihan | Fungsi |
|---|---|---|
| **type** | `earning` / `deduction` | Menambah atau memotong gaji |
| **value** | `fixed` / `formula` | Nilai tetap (Rp) atau rumus (mis. 5% × pokok) |
| **taxable** | ya / tidak | Ikut dihitung dalam PPh 21 atau tidak |
| **bpjs_base** | ya / tidak | Masuk dasar perhitungan iuran BPJS atau tidak |
| **fixed_recurring** | ya / tidak | Sama tiap periode, atau variabel per periode |

---

## 3. Kenapa Empat Flag Ini Penting

Komponen gaji adalah **titik pusat** yang menghubungkan ke pajak & BPJS. Contoh "Tunjangan Transport Rp500.000":

```
Tunjangan Transport (Rp500.000)
  ├── type: earning     → menambah gaji kotor
  ├── taxable: ya        → ikut basis PPh 21
  ├── bpjs_base: tidak   → TIDAK masuk dasar iuran BPJS (variabel)
  └── fixed_recurring: tidak
```

Saat perhitungan, sistem cukup memindai semua komponen & membaca flag-nya — tanpa hardcode. Ini yang membuat payroll benar untuk struktur gaji apa pun.

> **Aturan umum (dapat dikonfigurasi):** dasar BPJS lazimnya = gaji pokok + tunjangan **tetap**; tunjangan variabel, bonus, THR, dan lembur biasanya **tidak** masuk dasar BPJS. Sebagian besar penghasilan bersifat `taxable`, tetapi ada benefit tertentu yang tidak. Penetapan akhir mengikuti kebijakan & regulasi.

---

## 4. Contoh Struktur Gaji

```
KOMPONEN              TYPE       NILAI        TAXABLE  BPJS_BASE
────────────────────────────────────────────────────────────────
Gaji Pokok            earning    8.000.000    ya       ya
Tunjangan Jabatan     earning    2.000.000    ya       ya
Tunjangan Transport   earning      500.000    ya       tidak
Tunjangan Makan       earning      600.000    ya       tidak
────────────────────────────────────────────────────────────────
                      GAJI KOTOR = 11.100.000
                      Dasar BPJS = 10.000.000  (hanya flag bpjs_base = ya)

Potongan Pinjaman     deduction    500.000     —        —
BPJS (karyawan)       deduction   (dihitung)   —        —
PPh 21                deduction   (dihitung)   —        —
```

---

## 5. Dua Level: Katalog & Assignment

Sejalan pola katalog→instance di Core HR:

| Level | Milik | Isi |
|---|---|---|
| **Katalog komponen** | Tenant | Definisi komponen yang tersedia + sifat (taxable, bpjs_base) |
| **Assignment** | Karyawan | Komponen mana yang dimiliki karyawan + nilainya |

Contoh: komponen "Tunjangan Transport" didefinisikan sekali di tenant; Budi di-assign Rp500.000, Sari Rp700.000 — komponen sama, nilai beda.

---

## 6. Formula

Komponen `formula` memungkinkan nilai dihitung dari komponen lain, mis.:
- `tunjangan = 5% × gaji_pokok`
- `uang_lembur = tarif_lembur × jam_lembur` (jam dari Attendance)

Formula dievaluasi saat perhitungan run. Untuk formula dinamis penuh (kondisi if/else, tiered, fungsi min/max, rujukan antar-komponen & dependency), lihat dokumen khusus [`08-formula-engine.md`](./08-formula-engine.md).

---

## 7. Komponen Bawaan yang Umum

Sebagai titik awal, sistem dapat menyediakan komponen umum (dapat diedit tenant):

**Earning:** gaji pokok, tunjangan jabatan, tunjangan transport, tunjangan makan, uang lembur, bonus, THR.
**Deduction:** iuran BPJS (karyawan), PPh 21, potongan pinjaman, potongan absen.

> BPJS & PPh 21 adalah deduction khusus yang **dihitung sistem** (bukan nilai tetap) — lihat `03-calculation.md`.
