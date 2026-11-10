# 09 · Salary Grade Templates

"Paket gaji siap pakai" per level jabatan. Alih-alih meng-assign komponen satu per satu ke tiap karyawan, tenant mendefinisikan template per grade sekali, lalu menempelkannya ke karyawan.

---

## 1. Konsep

```
Grade "Manager" (template)
  ├── BASIC          : 15.000.000   (default)
  ├── TUNJ_JABATAN   : 5.000.000    (default)
  ├── TUNJ_TRANSPORT : 50.000/hari  (default)
  └── BONUS_KINERJA  : formula (BASIC * 0.2)
        │ di-assign ke
        ▼
   Budi (Manager) · Sari (Manager) → struktur sama, nilai bisa berbeda
```

Melanjutkan pola **katalog → template → instance** yang dipakai di org structure & komponen gaji. Grade template merakit komponen dari katalog menjadi paket per level.

---

## 2. Template = Acuan, Bukan Kunci

Template memberi **struktur + nilai default**; nilai per karyawan **boleh di-override**.

| Aspek | Perilaku |
|---|---|
| **Struktur komponen** | Diwarisi dari template (komponen apa saja yang dimiliki grade) |
| **Nilai default** | Diisi dari template saat assign |
| **Override per karyawan** | Boleh — mis. BASIC Budi 15 jt, Sari 17 jt |
| **Lock (opsional)** | Komponen tertentu dapat dikunci agar tak diubah per karyawan |

Contoh: dua Manager punya struktur sama (BASIC + tunjangan + bonus), tetapi BASIC berbeda karena masa kerja/nego. Struktur konsisten, angka fleksibel.

---

## 2a. Salary Type & Cycle di Grade

Grade tidak hanya menetapkan **nilai** gaji, tetapi juga **tipe & siklus bayar** — karena grade berbeda bisa dibayar dengan cara berbeda.

| Atribut grade | Fungsi |
|---|---|
| `salary_type` | Tipe perhitungan gaji — **configurable per tenant** |
| `pay_cycle` | Siklus bayar (mingguan/bulanan/dll) |

**Salary type configurable** — tenant mendefinisikan tipe yang dipakai, contoh umum:
```
monthly   : gaji tetap per bulan (staff/manajer kantoran)
daily      : dibayar per hari hadir (harian lepas) → basis = tarif × hari kerja
piece_rate : borongan per unit output → basis = tarif × unit
hourly     : per jam
```

**Contoh:**
```
Grade "Manager"      → salary_type: monthly,   pay_cycle: monthly
Grade "Buruh Harian" → salary_type: daily,     pay_cycle: weekly
Grade "Penjahit"     → salary_type: piece_rate, pay_cycle: monthly
```

**Dampak ke perhitungan:** salary_type menentukan **cara** komponen dasar dihitung:
- `monthly` → nilai tetap dari komponen.
- `daily` → tarif harian × `present_days` (dari Attendance).
- `piece_rate` → tarif per unit × output (input/integrasi produksi).

> `pay_cycle` di grade menentukan ritme bayar; ini juga menautkan ke jenis payroll run (lihat `04-payroll-run.md`). Karyawan mewarisi salary_type & cycle dari grade-nya, dapat di-override bila perlu.

---

## 3. Global Tenant + Override per Cabang

Sejalan model multi-cabang (hybrid):

| Level | Peran |
|---|---|
| **Grade (tenant)** | Definisi grade se-perusahaan: "Staff", "Manager", "VP" |
| **Nilai default (tenant)** | Angka default grade |
| **Override cabang** | Nilai default dapat disesuaikan per cabang (mis. UMR beda) |

Contoh:
```
Grade "Manager" (tenant)
  ├── default: BASIC 15.000.000
  ├── Cabang Jakarta  → BASIC default 15.000.000
  └── Cabang Surabaya → BASIC default 12.000.000  (override cabang)
```
Grade-nya sama; nilai default menyesuaikan cabang. Karyawan tetap bisa override lagi di atas default cabang.

---

## 4. Urutan Resolusi Nilai

Saat menghitung gaji seorang karyawan, nilai komponen ditentukan berlapis (yang lebih spesifik menang):

```
1. Override karyawan     (paling spesifik)   ← menang
2. Override cabang
3. Default template grade
4. Default komponen katalog (paling umum)
```

Engine mengambil nilai efektif dari lapisan paling spesifik yang tersedia.

### 4.1 Dua Arah Override (Eksplisit)

Override terjadi di **dua titik** berbeda:

**a. Override komponen DI DALAM grade** — mengubah default sebuah komponen khusus untuk grade/cabang tertentu, tanpa mengubah komponen katalog aslinya.
```
Komponen katalog "Tunjangan Transport" default 500.000
   → di grade "Manager": override jadi 1.000.000  (grade_template_components.default_amount)
   → di grade "Manager" cabang Surabaya: override jadi 750.000 (branch override)
```

**b. Override grade DI ASSIGNMENT ke karyawan** — saat grade ditempel ke karyawan, nilai warisan bisa ditimpa per individu.
```
Budi (grade Manager) → warisi Transport 1.000.000
   → di-assign Budi: override jadi 1.200.000 (employee_components)
```

Jadi: **komponen bisa di-override di level grade** (a), lalu **grade yang sudah ditempel bisa di-override lagi di level karyawan** (b). Keduanya mengikuti urutan resolusi di atas — karyawan (b) menang atas grade (a) menang atas katalog.

> Komponen yang ditandai `is_locked` di grade tidak boleh di-override saat assignment (mencegah perubahan struktur kritikal per individu).

---

## 5. Assign Grade ke Karyawan

```
Karyawan Budi → grade "Manager"
   ├─ warisi struktur komponen grade Manager
   ├─ isi nilai default (dari cabang Budi bila ada override cabang)
   └─ HR boleh override nilai tertentu untuk Budi
```

Mengganti grade karyawan (mis. promosi Staff → Manager) memperbarui struktur & default; override lama dapat dipertahankan atau di-reset (pilihan HR).

---

## 6. Relasi dengan Grade di Core HR

- **Job grade di Core HR** (katalog `job_grades`: Staff/Manager/VP) = level jabatan struktural.
- **Salary grade template di Payroll** = paket komponen gaji yang **terhubung** ke job grade itu.

Satu job grade (Core HR) memiliki satu salary template (Payroll). Pemisahan ini menjaga Core HR tetap soal struktur, Payroll soal uang.

---

## 7. Data Model — diimplementasikan sebagai *salary structure* (P1)

Konsep "grade template" dibangun dengan nama **salary structure** (plan `2026-11-06-payroll-erd-adaptation.md` §P1). Detail kolom ada di [06-data-model.md](./06-data-model.md) §2.12.

| Tabel | Isi |
|---|---|
| `salary_structures` | Paket per jabatan/level: `code` (unik per tenant), `name`, `salary_type`, `pay_cycle` (default karyawan baru), `job_grade_id` (opsional, job grade Core HR), `is_active` |
| `salary_structure_components` | Komponen di structure: `default_amount` (hanya komponen `fixed`), `is_locked` (tidak boleh di-override per karyawan), `sequence` |
| `salary_structure_branch_overrides` | Nilai default per cabang untuk komponen `fixed` |

Aturan:
- Komponen harus aktif, satu tenant, tidak dobel; structure wajib punya minimal satu komponen earning.
- Urutan resolusi nilai default: override cabang → default structure → diisi per karyawan. Komponen formula dihitung saat payroll.
- `PUT .../components` mempertahankan override cabang untuk komponen yang tetap ada.
- Hubungan ke karyawan (assign structure, override per karyawan, simulator) dikerjakan di P2 lewat `employee_compensations`.

## 8. Manfaat

- **Onboarding cepat** — assign grade, gaji langsung terstruktur.
- **Konsisten** — semua karyawan satu grade punya struktur sama.
- **Fleksibel** — nilai bisa beda per karyawan & per cabang.
- **Mudah dikelola** — ubah default grade sekali, berlaku ke yang mewarisi (kecuali yang sudah di-override).
