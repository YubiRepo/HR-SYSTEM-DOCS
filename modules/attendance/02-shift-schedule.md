# 02 · Shift & Schedule

## 1. Shift

**Shift** = pola jam kerja yang dapat dipakai ulang. Didefinisikan sekali (katalog tenant), lalu ditugaskan ke karyawan.

| Atribut | Contoh |
|---|---|
| `name` | "Pagi", "Malam", "WFH" |
| `start_time` / `end_time` | 08:00 / 17:00 |
| `breaks` | Daftar istirahat (bisa >1) — lihat §1.1 |
| `clock_in_window` | Jendela absen sah — lihat §1.2 |
| `cross_midnight` | true untuk shift malam (22:00–06:00) |
| `work_hours` | Jam kerja efektif (mis. 8) |

Contoh shift umum:
```
Pagi   : 08:00–17:00 (istirahat 60') → 8 jam
Siang  : 13:00–22:00
Malam  : 22:00–06:00 (cross_midnight)
WFH    : fleksibel, target jam
```

### 1.1 Istirahat Spesifik (Bisa Berkali-kali)

Alih-alih satu angka `break_minutes`, tiap shift punya **daftar istirahat** dengan jam spesifik — mendukung lebih dari satu.

```
Shift Pagi:
  ├── Istirahat makan : 12:00–13:00 (60')
  ├── Coffee break    : 15:00–15:15 (15')  (opsional)
  └── total break     : 75' (tak dihitung jam kerja)
```

| Field break | Keterangan |
|---|---|
| `name` | "Istirahat makan", "Coffee break" |
| `start` / `end` | Jam spesifik (mis. 12:00–13:00) |
| `paid` | Dihitung jam kerja atau tidak (default tidak) |
| `flexible` | Jam pasti, atau durasi bebas dalam rentang |

- **Jam kerja efektif** = durasi shift − total break tak berbayar.
- Break berjam spesifik memudahkan validasi (mis. clock-out saat jam istirahat bukan "pulang").
- Break `flexible` — karyawan ambil kapan saja asal total ≤ jatah (mis. 60' bebas).

### 1.2 Jam Absensi Efektif (Clock-in Window)

Tiap shift bisa punya **jendela waktu** kapan clock-in/out dianggap sah — mencegah absen di jam tak wajar.

```
Shift Pagi (08:00–17:00):
  clock_in_window  : 06:00–10:00  (absen masuk hanya sah di rentang ini)
  clock_out_window : 15:00–23:00
```

- Clock-in **sebelum** window (mis. 04:00) → ditolak/ditandai (mungkin salah/curang).
- Clock-in **sesudah** window → dianggap sangat telat / butuh koreksi.
- Untuk shift `cross_midnight`, window menyesuaikan lintas hari.
- Configurable per shift; bila kosong, pakai default longgar tenant.

---

## 2. Schedule (Penugasan)

**Schedule** = shift mana untuk karyawan mana pada tanggal mana.

```
Budi · 2026-01-15 · Shift Pagi
Sari · 2026-01-15 · Shift Malam
```

**Cara menugaskan:**
- **Pola berulang** — mis. Senin–Jumat Shift Pagi (paling umum).
- **Rotasi** — pola bergilir (mis. 3 hari pagi, 3 hari malam) untuk pabrik/rumah sakit.
- **Manual** — atur per hari untuk kasus khusus.

### 2.0 Pattern per Grup (Dept/Posisi/Custom)

Pola shift (pattern) **tidak** ditempel flat ke semua karyawan cabang, melainkan ke **grup** — karena dalam satu cabang, tiap bagian bisa berbeda pola. Grup bersifat fleksibel:

| Grup | Contoh |
|---|---|
| **Departemen / org unit** | Produksi, Gudang, Admin (dari Core HR) |
| **Posisi** | Operator mesin, Satpam |
| **Custom** | Kumpulan karyawan tertentu (mis. "Tim Proyek A") |
| **Individual** | Satu karyawan (override khusus) |

**Contoh nyata (pabrik, satu cabang):**
```
Dept Produksi → rotasi 3 shift (Pagi/Siang/Malam) — mesin 24 jam
Dept Gudang   → 2 shift (Pagi/Siang)
Dept Admin    → reguler (08:00–17:00, Sen–Jum)
Dept Security → rotasi 3 shift (jam beda dari produksi)
```

Satu pattern = { grup, shift/rotasi, working days, rentang }. Satu cabang bisa punya banyak pattern (satu per grup).

> Resolusi bila tumpang tindih: pattern **lebih spesifik menang** (individual > posisi > departemen). Mayoritas karyawan cukup ikut pattern departemennya.

### 2.1 Siapa & Kapan Men-generate

HR **tidak** membuat baris jadwal manual tiap minggu. Baris di-generate dari **pola** yang diset sekali, lalu dijaga otomatis.

```
SEKALI (HR):
  set pola → "Budi, Sen–Jum, Reguler, mulai 1 Jan"
       └─ sistem generate baris awal (buffer ke depan)

OTOMATIS (background job, bulanan):
  tiap awal bulan → generate ~2 bulan ke depan
       └─ buffer selalu terjaga; HR tak menyentuh apa pun

LAZY (fallback):
  akses tanggal yang belum ter-generate → generate on-the-fly dari pola
       └─ jaring pengaman; jadwal tak pernah kosong

SESEKALI (HR/manajer):
  override manual bila ada pengecualian (tukeran, cuti, lembur khusus)
```

**Mekanisme (hybrid):**
- **Job bulanan** menjaga ~2 bulan ke depan terisi — cepat di-query ("siapa masuk besok?") & align dengan siklus payroll bulanan.
- **Lazy fallback** meng-generate saat ada akses ke tanggal di luar buffer (mis. HR melihat 3 bulan ke depan), agar tak pernah ada tanggal kosong.
- **Override manual** (`source: manual`) tidak ditimpa oleh job — pengecualian aman.

> Baris `source: pattern`/`rotation` boleh di-regenerate job; `source: manual` dikunci dari regenerasi agar tukeran/koreksi tidak hilang.

### 2.1a Generate saat Pattern Beda per Grup

Karena tiap grup (dept/posisi) bisa punya pattern berbeda, job **tidak** generate seragam. Untuk tiap karyawan, job menentukan pattern yang berlaku lalu generate sesuai itu:

```
job generate (bulanan), untuk tiap karyawan aktif:
  ├─ tentukan pattern berlaku (individual > posisi > departemen)
  ├─ generate baris sesuai pattern grup itu
  └─ lewati tanggal yang sudah source: manual (jangan ditimpa)
```

Contoh dalam satu pabrik:
```
Budi (Produksi) → pattern rotasi 3 shift → Pagi,Pagi,Pagi,Malam,Malam,Malam,Libur…
Sari (Admin)    → pattern reguler        → Reguler Sen–Jum, Sab–Min libur
Joko (Security) → pattern rotasi security→ (pola & jam berbeda dari Produksi)
```
Satu job, hasil berbeda per karyawan — karena pattern grupnya berbeda.

### 2.1b Rotasi (Rotating Shift)

Rotasi = pola bergilir yang diulang terus. Didefinisikan sebagai urutan + panjang siklus:
```
Pola "3-3-1" (siklus 7 hari):
  hari 1–3 : Pagi
  hari 4–6 : Malam
  hari 7   : Libur
  → ulang dari awal, dengan anchor_date sebagai titik mulai
```

- **Anchor date** — tanggal acuan mulai siklus, agar rotasi konsisten walau di-generate bertahap tiap bulan.
- **Per karyawan bisa beda fase** — mis. Regu A mulai Pagi, Regu B mulai Malam (offset), agar shift selalu terisi.
- **Override manual per hari tetap bisa** — tuker shift/izin → ubah baris tanggal itu (`source: manual`), job tidak menimpanya.

> Karena rotasi dihitung dari anchor + siklus, job bulanan bisa melanjutkan rotasi dengan benar tanpa "reset" tiap bulan.

### 2.2 Kenapa Disimpan per Baris

Meski berasal dari pola, jadwal tetap disimpan sebagai **baris per hari** (bukan hanya polanya) karena:
- **Menampung pengecualian** — libur nasional, tukeran shift, cuti → cukup ubah baris tanggal itu.
- **Patokan absensi cepat** — clock-in tinggal lookup baris hari itu (tak menghitung pola tiap kali).
- **Bisa dilihat karyawan** — endpoint `/me/schedule` membaca baris ini.

---

## 3. Hari Kerja (Working Days) — Configurable

Hari kerja **tidak di-hardcode** "Senin–Jumat". Tiap tenant/cabang menentukan hari apa saja yang kerja, dan tiap hari bisa memakai shift berbeda. Ini menampung beragam pola perusahaan Indonesia.

| Pola | Working days | Contoh penerapan |
|---|---|---|
| **5 hari** | Sen–Jum | Kantor umum |
| **6 hari penuh** | Sen–Sab | Sabtu = hari kerja biasa (shift reguler) |
| **6 hari, Sabtu ½** | Sen–Jum reguler, **Sab shift setengah hari** | Umum di Indonesia |
| **7 hari (rotasi)** | Sen–Min | Pabrik/retail — pakai rotasi agar tiap orang tetap libur gilir |

### Contoh: Sabtu setengah hari
Solusinya memakai **shift berbeda untuk Sabtu**, bukan aturan khusus:
```
Shift "Reguler"       : 08:00–17:00  → Senin–Jumat
Shift "Setengah Hari" : 08:00–12:00  → Sabtu
Minggu                : libur
```
Ini menunjukkan kenapa shift dipisah dari schedule: satu karyawan bisa punya jam berbeda tergantung harinya, cukup diatur di pola penugasan.

> Untuk kantor yang sama sekali tak ingin mengurus shift, sistem memakai **jam kerja default tenant** (mis. 08:00–17:00, Sen–Jum) tanpa perlu membuat shift eksplisit. Konsep shift tetap ada di belakang layar, tetapi tidak terasa rumit.

---

## 4. Hari Libur & Kalender

Tiga jenis "hari tidak bekerja":

| Jenis | Contoh | Sifat |
|---|---|---|
| **Libur mingguan** | Minggu (atau Sabtu–Minggu) | Dari pola working days (hari tanpa jadwal) |
| **Libur nasional** | 17 Agustus, Idul Fitri, Natal | Wajib — hampir semua perusahaan libur |
| **Cuti bersama** | Hari tambahan sekitar Lebaran/Natal | **Opsional untuk swasta** (lihat 4.1) |

Saat hari libur, karyawan **tidak dihitung alpha** meski tak absen (status `holiday`). Bila ada yang **bekerja di hari libur**, dihitung lembur dengan multiplier khusus (lebih tinggi) — ditandai agar Payroll menerapkan tarif yang benar.

### 4.1 Cuti Bersama — Opsional per Tenant

Cuti bersama diwajibkan untuk instansi pemerintah/BUMN, tetapi **perusahaan swasta boleh memilih tetap masuk**. Karena itu tiap entri cuti bersama punya **toggle berlaku/tidak per tenant (atau cabang)**:

```
Kalender 2026:
  17 Agustus       → national   → [semua libur, tak bisa dimatikan]
  Idul Fitri H1–2  → national   → [semua libur]
  Cuti bersama X   → collective → PT A: libur ✓  |  PT B: tetap masuk ✗
```

- **Libur nasional murni** tak bisa dimatikan (wajib).
- **Cuti bersama** bisa di-opt-out — swasta yang tetap produktif memperlakukan tanggal itu sebagai hari kerja biasa.
- **Skeleton crew:** bila cuti bersama diaktifkan sebagai libur tetapi sebagian karyawan tetap dijadwalkan (mis. customer service), mereka yang bekerja hari itu dihitung lembur/hari pengganti.

Kalender dapat di-preset mengikuti hari libur nasional Indonesia + cuti bersama tahunan (tanggal berubah tiap tahun), dan **berbeda per cabang** bila perlu (mis. Nyepi untuk cabang Bali).

---

## 5. Fleksibilitas per Cabang

Sejalan multi-cabang: shift, working days, & kalender libur dapat berbeda per cabang. Contoh dalam satu tenant:
```
Cabang Kantor (Jakarta) → Sen–Jum, Shift Reguler
Cabang Pabrik (Bekasi)  → 7 hari, rotasi Pagi/Siang/Malam
Cabang Toko (Surabaya)  → Sen–Sab, Shift Buka/Tutup
```
Shift didefinisikan di tenant (katalog); working days, penugasan, & kalender disesuaikan per cabang. Branch admin mengatur cabangnya; tenant admin lintas cabang.

---

## 6. Peran Jadwal dalam Perhitungan

Jadwal adalah **baseline** untuk menilai kehadiran:
```
jadwal (harusnya)  : 08:00–17:00
aktual (clock)      : 08:20–18:30
→ telat 20 menit, lembur 1,5 jam
```
Tanpa jadwal, sistem memakai **jam kerja default tenant**. Detail perhitungan di `04-overtime-lateness.md`.

### 6.1 Regular Shift sebagai Aturan Dasar

Bila karyawan **tidak** punya penugasan shift khusus pada suatu hari, sistem memakai **regular shift** (default) sebagai aturan dasar:
```
resolusi shift hari-X:
  1. ada schedule khusus (pattern/rotasi/manual)?  → pakai itu
  2. tidak ada?  → pakai regular shift default (dari attendance_rules)
  3. hari itu bukan working day?  → libur
```
Jadi regular shift = "fallback" ketika tak ada aturan lebih spesifik. Mayoritas karyawan kantoran cukup mengandalkan ini.

### 6.2 Duty Call (Shift Dadakan)

**Duty call** = karyawan dipanggil masuk **di luar jadwal** (mis. dipanggil saat hari libur/off karena ada kebutuhan mendadak).

```
Budi jadwal Minggu = libur
   → dipanggil masuk (duty call) → HR buat penugasan dadakan
   → kehadiran hari itu dicatat sebagai duty call
   → dihitung lembur/uang khusus (di luar jadwal normal)
```

| Aspek | Perilaku |
|---|---|
| Pemicu | HR/manajer buat penugasan dadakan (`source: manual`, `duty_call: true`) |
| Perhitungan | Kerja di luar jadwal → lembur/hari khusus (multiplier sesuai aturan) |
| Persetujuan | Bisa butuh approval (seperti lembur) |
| Payroll | Masuk sebagai jam lembur / komponen khusus |

> Duty call berbeda dari lembur biasa: lembur = perpanjangan shift terjadwal; duty call = masuk di hari/jam yang semula tak terjadwal. Keduanya menambah kompensasi, ditandai berbeda agar Payroll menerapkan aturan yang tepat.

---

## 7. Shift & WFH / Remote

Untuk kerja fleksibel/WFH, shift bisa berupa **target jam** (bukan jam pasti). Kehadiran dinilai dari total jam terpenuhi, bukan ketepatan clock-in. Ini dikonfigurasi di level shift (`type: fixed` vs `type: flexible`).
