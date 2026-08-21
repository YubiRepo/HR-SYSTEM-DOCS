# 08 · Formula Engine

Mesin yang mengevaluasi komponen gaji bertipe `formula`. Memungkinkan tenant mendefinisikan aturan gaji dinamis (kondisi, fungsi, rujukan antar-komponen) tanpa mengubah kode — sejalan filosofi configurable di seluruh sistem.

> Komponen `fixed` & `daily` tidak memakai engine ini. Formula engine hanya untuk komponen yang nilainya **dihitung**.

---

## 1. Konsep

Formula adalah **ekspresi** yang dievaluasi saat payroll run, menghasilkan satu angka. Contoh (dari lembur):
```
(BASIC / 173) * overtime_hours * multiplier
```
Angka hasil lalu diperlakukan seperti komponen biasa: mengikuti flag `taxable` & `bpjs_base` untuk menentukan alirannya ke PPh 21 & BPJS (lihat `03-calculation.md`).

---

## 2. Variabel (input yang boleh dirujuk)

Engine menyediakan "kamus" variabel. Formula hanya boleh merujuk variabel terdaftar (whitelist).

| Kelompok | Contoh | Sumber |
|---|---|---|
| **Komponen lain** | `BASIC`, `TUNJ_JABATAN` | Nilai komponen dalam run yang sama |
| **Data karyawan** | `grade`, `masa_kerja`, `ptkp_status`, `branch_id` | Core HR |
| **Data periode** | `work_days`, `present_days` | Attendance (atau input manual) |
| **Variabel input** | `overtime_hours`, `late_days`, `unpaid_days` | Attendance |
| **Konstanta sistem** | `MONTHLY_HOURS` (173), `UMR` | Konfigurasi tenant/sistem |

> Rujukan komponen memakai **code** komponen (mis. `BASIC`). Variabel yang tak dikenal → formula ditolak saat disimpan (validasi), bukan saat run.

---

## 3. Operator & Fungsi

**Operator:** `+  −  *  /`, kurung `( )`, perbandingan `== != > >= < <=`, logika `and / or / not`.

**Fungsi bawaan (whitelist):**
| Fungsi | Guna |
|---|---|
| `min(a, b, …)` / `max(a, b, …)` | Batas bawah/atas — mis. plafon BPJS |
| `round(x)` / `floor(x)` / `ceil(x)` | Pembulatan |
| `if(cond, a, b)` | Percabangan |
| `clamp(x, lo, hi)` | Batasi rentang |

> Daftar fungsi bersifat tetap & terbatas (bukan bahasa pemrograman penuh). Penambahan fungsi dilakukan di level sistem.

---

## 4. Kondisi (Rule Dinamis)

Formula mendukung percabangan penuh — nested & tiered.

**if/else sederhana:**
```
if(grade == "manager", 2000000, 0)
```

**Tiered (berjenjang) — masa kerja:**
```
if(masa_kerja >= 10, BASIC * 0.10,
if(masa_kerja >= 5,  BASIC * 0.05,
0))
```

**Kombinasi kondisi:**
```
if(grade == "manager" and branch_id == "branch_jkt", 3000000, 1000000)
```

**Contoh lembur dengan multiplier berjenjang** (jam pertama 1.5×, sisanya 2×):
```
(BASIC / MONTHLY_HOURS) * (
  min(overtime_hours, 1) * 1.5 +
  max(overtime_hours - 1, 0) * 2
)
```

---

## 5. Dependency & Urutan Evaluasi

Karena formula boleh merujuk komponen lain, engine menentukan **urutan hitung** otomatis:

```
Tunjangan Transport = 0.05 * BASIC     → butuh BASIC dulu
BASIC (fixed)        = 10.000.000      → dihitung lebih awal
```

**Mekanisme:**
1. Bangun **dependency graph** antar-komponen (siapa merujuk siapa).
2. Urutkan (topological sort) — komponen tanpa dependensi dihitung dulu.
3. Evaluasi mengikuti urutan itu.

**Circular reference** (A butuh B, B butuh A) → **ditolak saat validasi**, tidak boleh sampai run. Engine memberi pesan jelas komponen mana yang saling mengunci.

---

## 6. Kapan Formula Dievaluasi

```
payroll run: calculate
  ├─ kumpulkan variabel (komponen fixed/daily, data Attendance, data karyawan)
  ├─ bangun urutan (dependency graph)
  ├─ evaluasi tiap formula sesuai urutan → angka
  ├─ terapkan flag taxable / bpjs_base pada hasil
  └─ hasil masuk payslip_lines (snapshot)
```

Hasil formula **di-snapshot** ke slip (lihat `06-data-model.md`), jadi slip yang sudah `closed` tak berubah walau definisi formula diperbarui kemudian.

---

## 7. Validasi Formula (saat disimpan)

Sebelum formula boleh dipakai, engine memvalidasi:
- Semua variabel & komponen yang dirujuk **terdaftar**.
- Semua fungsi **ada di whitelist**.
- Tidak ada **circular reference**.
- Sintaks benar (kurung seimbang, operator valid).
- Tipe hasil = angka.

Formula yang gagal validasi ditolak dengan pesan spesifik — mencegah error saat run (yang menyangkut uang).

---

## 8. Keamanan Evaluasi

> **Catatan:** detail keamanan akan diperdalam terpisah. Prinsip dasar yang dipegang:

- **Bukan eval kode** — formula diparse ke expression tree terbatas, bukan dieksekusi sebagai bahasa pemrograman.
- **Whitelist** variabel & fungsi — tak bisa mengakses data/aksi di luar konteks perhitungan.
- **Batas evaluasi** — kedalaman nested & waktu dibatasi untuk mencegah formula "berat"/loop.
- **Sandbox per tenant** — formula satu tenant tak menyentuh data tenant lain.

Rincian (parser, batas resource, audit perubahan formula) menjadi bahasan lanjutan.

---

## 9. Contoh Katalog (sesuai UI)

| Code | Rule | Formula |
|---|---|---|
| `BASIC` | Fixed | 10.000.000 |
| `TUNJ_JABATAN` | Fixed | 2.000.000 |
| `TUNJ_TRANSPORT` | Daily | 25.000 × present_days |
| `OVERTIME` | Formula | `(BASIC / MONTHLY_HOURS) * overtime_hours * multiplier` |
| `BONUS_KINERJA` | Formula | `if(grade == "manager", BASIC * 0.2, BASIC * 0.1)` |

> `MONTHLY_HOURS` = 173 (konstanta, dapat dikonfigurasi). `multiplier` & `overtime_hours` berasal dari Attendance/aturan lembur.
