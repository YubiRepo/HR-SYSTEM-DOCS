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

## 7. Data Model (ringkas)

### `salary_grade_templates`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `sgt_...` |
| `tenant_id` | string (FK) | |
| `job_grade_id` | string (FK) | Rujuk `job_grades` (Core HR) |
| `name` | string | mis. "Manager" |

### `grade_template_components`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `template_id` | string (FK) | |
| `component_id` | string (FK) | Rujuk `pay_components` |
| `default_amount` | int (nullable) | Default (untuk komponen fixed) |
| `is_locked` | boolean | Tak boleh di-override per karyawan |

### `grade_component_branch_overrides`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `template_id` | string (FK) | |
| `component_id` | string (FK) | |
| `branch_id` | string (FK) | |
| `default_amount` | int | Default khusus cabang |

> Override per karyawan tetap disimpan di `employee_components` (lihat `06-data-model.md`). Resolusi nilai mengikuti §4.

---

## 8. Manfaat

- **Onboarding cepat** — assign grade, gaji langsung terstruktur.
- **Konsisten** — semua karyawan satu grade punya struktur sama.
- **Fleksibel** — nilai bisa beda per karyawan & per cabang.
- **Mudah dikelola** — ubah default grade sekali, berlaku ke yang mewarisi (kecuali yang sudah di-override).
