# 03 · Balance & Accrual

Bagaimana saldo cuti dihitung, bertambah (akrual), dan diperlakukan di akhir periode (carry-over).

---

## 1. Saldo Cuti (Balance)

Tiap karyawan punya saldo **per jenis cuti**:
```
Cuti Tahunan · Budi · 2026
  jatah    : 12
  terpakai : 4
  sisa     : 8
```

| Field | Arti |
|---|---|
| **quota** | Jatah total periode |
| **used** | Sudah terpakai (cuti disetujui) |
| **pending** | Diajukan, belum disetujui (opsional: tahan saldo) |
| **balance** | Sisa = quota − used (− pending bila ditahan) |

Pengajuan disetujui → `used` bertambah, `balance` berkurang. Semua perubahan tercatat (ledger, auditable).

---

## 2. Akrual (Accrual) — Cara Saldo Bertambah

| Mode | Cara | Cocok untuk |
|---|---|---|
| **Upfront** | Seluruh jatah diberikan di awal periode (mis. 12 hari tiap 1 Januari) | Paling umum & sederhana |
| **Monthly** | Bertambah bertahap (mis. +1 hari/bulan) | Pro-rata, adil untuk karyawan baru |
| **None** | Tidak berjatah tetap (mis. cuti sakit sesuai surat dokter) | Cuti insidental |

Contoh monthly accrual:
```
Jan: +1 → saldo 1
Feb: +1 → saldo 2
...
Des: +1 → saldo 12
```

**Pro-rata karyawan baru:** karyawan masuk pertengahan tahun mendapat jatah proporsional (mis. masuk Juli → 6 hari untuk tahun itu), tergantung mode & kebijakan.

**Implementasi (Okt 2026):**
- **Monthly** = `quota_days ÷ 12` per bulan, dikreditkan di **awal bulan**, dihitung dari yang lebih akhir antara 1 Januari dan tanggal masuk (masuk 15 Maret → Maret sudah dapat). Dibulatkan **ke bawah ke kelipatan 0,5** (kuota 10 → bulan pertama 0,5, bukan 0,83). Wajib punya `quota_days`.
- **Upfront** dan **None** sama-sama memberi kuota penuh sejak saldo dibuka (None dipakai jenis cuti per kejadian).
- Akrual **dihitung saat dibaca**, bukan ditulis job bulanan — tak ada job yang bisa terlewat/dobel, dan tak ada baris ledger `accrual`.
- Pengajuan dicek terhadap jatah yang terkumpul **sampai tanggal mulai cuti** (boleh merencanakan cuti bulan depan). Cuti lain yang sudah diajukan untuk tanggal lebih akhir tetap ikut mengurangi — pengecekannya konservatif.
- Penyesuaian HR (adjust) dihitung penuh seketika, tidak di-pro-rata.
- Mode akrual, kuota, dan tanggal mulai akrual **di-snapshot ke baris saldo** saat dibuka; mengubah mode di jenis cuti hanya berlaku untuk saldo yang dibuka sesudahnya.
- Saat rollover, sisa dihitung dari akrual setahun penuh (per 31 Des), bukan per hari rollover dijalankan.

---

## 3. Kebijakan Tahun Pertama (Hak Setelah 12 Bulan)

Menurut UU, hak cuti tahunan muncul **setelah bekerja 12 bulan**. Sistem mendukung beberapa kebijakan; perusahaan memilih via konfigurasi jenis cuti.

| Kebijakan | Config | Perilaku |
|---|---|---|
| **Strict (DEFAULT)** | `accrual: upfront` + `min_tenure_months: 12` | Bulan 1–11 belum ada jatah; genap 12 bulan → dapat 12 hari sekaligus. Sesuai UU minimum |
| **Pro-rata** | `accrual: monthly` + `min_tenure_months: 0` | Dicicil +1 hari/bulan sejak masuk; bisa dipakai sebelum genap setahun |
| **Hybrid** | `accrual: monthly` + `min_tenure_months: 3` | Tunggu lewat probation, lalu akrual pro-rata |

> **Default = Strict** karena sesuai UU (aman secara hukum). Perusahaan yang ingin lebih ramah karyawan tinggal beralih ke pro-rata — kelonggaran adalah pilihan tenant, bukan bawaan.

Karyawan baru yang butuh izin sebelum berhak cuti tahunan dapat memakai **unpaid leave** atau cuti khusus/sakit sesuai kondisi.

---

## 4. Basis Periode Cuti (Kapan Reset & Dapat Jatah)

Kapan saldo di-reset & jatah baru dibuka:

| Basis | Cara | Catatan |
|---|---|---|
| **Anniversary** | Dihitung dari tanggal masuk karyawan | Adil untuk tahun pertama (hak muncul tepat 12 bulan) |
| **Kalender** | Semua karyawan reset barengan 1 Januari | Praktis untuk HR (tak mengurus 100 tanggal berbeda) |

**Rekomendasi (hybrid) — anniversary tahun pertama, lalu kalender:**
```
Budi masuk 1 Mar 2026
  ├─ 1 Mar 2027 → genap 12 bln → dapat 12 hari (anniversary)
  ├─ 2027 berjalan pakai jatah itu
  └─ 1 Jan 2028 → switch ke basis kalender
        transisi Mar–Des 2027 dihitung pro-rata (~10 bln) agar selaras
```
- **Tahun pertama anniversary** — sesuai UU, hak muncul tepat setelah 12 bulan.
- **Tahun berikutnya kalender** — reset barengan, HR tak repot.
- **Transisi pro-rata** — menyelaraskan dari anniversary ke kalender tanpa merugikan karyawan.

Basis periode configurable per tenant; hybrid di atas adalah default yang disarankan.

---

## 5. Carry-over (Sisa Akhir Periode)

Di akhir tahun, sisa cuti diperlakukan sesuai kebijakan:

| Kebijakan | Perilaku |
|---|---|
| **Hangus** | Sisa hilang di akhir periode |
| **Carry-over penuh** | Semua sisa dibawa ke tahun depan |
| **Carry-over terbatas** | Dibawa dengan batas (mis. maks 6 hari) |
| **Carry-over + kedaluwarsa** | Dibawa tapi wajib dipakai sebelum tanggal tertentu (mis. Maret) |

```
Sisa 2026 = 8 hari, kebijakan: carry-over maks 6, kedaluwarsa Maret 2027
  → 6 hari dibawa (2 hangus), wajib dipakai sebelum 31 Mar 2027
```

Configurable per jenis cuti per tenant. Cuti tahunan lazimnya dibatasi 1–2 tahun.

---

## 6. Kompensasi Cuti (Leave Encashment)

- **Saat PHK:** cuti tahunan belum terpakai wajib diganti uang (aturan UU) → dikirim ke Payroll (final pay).
- **Opsional:** sebagian perusahaan membolehkan "jual" sisa cuti jadi uang (kebijakan tenant).

---

## 7. Reset Periode

Pada pergantian periode (biasanya tahunan):
```
akhir periode:
  ├─ hitung carry-over (sesuai kebijakan)
  ├─ hangus sisa yang tak dibawa
  └─ buka jatah periode baru (upfront) / mulai akrual baru (monthly)
```
Dijalankan otomatis oleh sistem (background job) + dapat dipicu manual HR.

**Implementasi saat ini** (`POST /leave/balances/rollover`, dipicu manual):
- Idempoten — setiap saldo yang sudah ditutup diberi `rolled_over_at`; menjalankan ulang tidak membawa sisa dua kali.
- Hanya `carried_in` periode baru yang ditambah; `quota` periode baru tidak ditimpa (adjustment HR yang sudah ada tetap).
- Reservasi `pending` yang belum diputus tetap dihitung terpakai saat menghitung sisa.
- Kedaluwarsa carry-over (`carry_over_expiry`) baru disimpan, belum ditegakkan.

---

## 8. Saldo per Jenis, Bukan Global

Tiap jenis cuti punya saldo terpisah — cuti tahunan habis tidak memengaruhi cuti sakit. Pengecualian: jenis tertentu bisa berbagi pool bila dikonfigurasi (jarang).
