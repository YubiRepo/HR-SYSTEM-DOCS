# 02 · Frameworks & Goals

Kerangka penilaian bersifat **configurable** — tenant memilih pendekatan yang cocok (KPI, OKR, kompetensi, atau kombinasi). Sasaran (goal) mengikuti kerangka yang dipilih.

---

## 1. Tiga Kerangka

| Kerangka | Fokus | Cocok untuk |
|---|---|---|
| **KPI** | Target terukur (angka) | Sales, operasional, produksi |
| **OKR** | Objective + Key Results | Tim yang butuh selarasan tujuan (tech, startup) |
| **Kompetensi** | Skill & perilaku | Menilai kemampuan (leadership, komunikasi) |

Tenant boleh memakai satu atau kombinasi (mis. KPI untuk hasil + kompetensi untuk perilaku).

---

## 2. KPI (Key Performance Indicator)

Target terukur dengan pencapaian.
```
KPI "Penjualan Bulanan"
  ├── target   : 100.000.000
  ├── actual   : 85.000.000
  ├── achieve  : 85%
  └── weight   : 40% (bobot terhadap skor total)
```
- **Bobot** — tiap KPI punya bobot; total skor = Σ (achievement × weight).
- **Satuan** — rupiah, unit, persen, dll.
- **Sumber actual** — input manual atau (idealnya) tarik dari sistem terkait.

---

## 3. OKR (Objectives & Key Results)

Tujuan kualitatif + hasil kunci terukur.
```
Objective: "Tingkatkan kepuasan pelanggan"
  ├── KR1: NPS naik dari 30 → 50        (progress 70%)
  ├── KR2: response time < 2 jam         (progress 90%)
  └── KR3: churn turun ke < 5%           (progress 60%)
Objective score = rata-rata progress KR
```
- OKR menekankan **selarasan** (objective tim → objective perusahaan).
- Progress KR biasa 0–100% atau 0.0–1.0.
- OKR sering **tidak** langsung dikaitkan bonus (agar target ambisius) — configurable.

---

## 4. Kompetensi

Menilai skill/perilaku pada skala.
```
Kompetensi (skala 1–5)
  ├── Komunikasi     : 4
  ├── Leadership     : 3
  ├── Problem Solving: 5
  └── Teamwork       : 4
```
- **Kamus kompetensi** configurable per tenant (bisa beda per level/jabatan).
- Sering dipakai bersama KPI (hasil + cara mencapainya).

---

## 5. Penetapan Goal

```
awal periode:
  karyawan/manajer tetapkan goal
     → selaras dengan goal tim/perusahaan (cascade, untuk OKR)
     → disetujui manajer
     → dikunci sebagai baseline periode
```

| Atribut goal | Contoh |
|---|---|
| `type` | kpi / okr / competency |
| `title` | "Penjualan Bulanan" |
| `target` / `key_results` | Nilai target / daftar KR |
| `weight` | Bobot |
| `period` | Periode berlaku |
| `status` | draft / active / achieved / missed |

**Cascade (OKR):** objective perusahaan → diturunkan ke divisi → tim → individu, agar selaras.

---

## 6. Configurable per Tenant

- Pilih kerangka (KPI/OKR/kompetensi/kombinasi).
- Definisikan kamus kompetensi & skala rating.
- Atur bobot & rumus skor.
- Beda template per jabatan/level bila perlu.

> Fleksibilitas ini membuat modul cocok untuk beragam gaya perusahaan — dari sales-driven (KPI) hingga tech (OKR).
