# 02 · Shift & Schedule

## 1. Shift

**Shift** = pola jam kerja yang dapat dipakai ulang. Didefinisikan sekali (katalog tenant), lalu ditugaskan ke karyawan.

| Atribut | Contoh |
|---|---|
| `name` | "Pagi", "Malam", "WFH" |
| `start_time` / `end_time` | 08:00 / 17:00 |
| `break_minutes` | 60 (istirahat, tak dihitung kerja) |
| `cross_midnight` | true untuk shift malam (22:00–06:00) |
| `work_hours` | Jam kerja efektif (mis. 8) |

Contoh shift umum:
```
Pagi   : 08:00–17:00 (istirahat 60') → 8 jam
Siang  : 13:00–22:00
Malam  : 22:00–06:00 (cross_midnight)
WFH    : fleksibel, target jam
```

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

---

## 7. Shift & WFH / Remote

Untuk kerja fleksibel/WFH, shift bisa berupa **target jam** (bukan jam pasti). Kehadiran dinilai dari total jam terpenuhi, bukan ketepatan clock-in. Ini dikonfigurasi di level shift (`type: fixed` vs `type: flexible`).
