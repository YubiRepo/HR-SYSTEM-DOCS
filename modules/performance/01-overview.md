# 01 · Overview

## 1. Tujuan

Modul Performance menjawab: **seberapa baik kinerja tiap karyawan terhadap sasaran, bagaimana menilainya secara adil, dan apa tindak lanjutnya** (pengembangan, bonus, promosi). Ia melengkapi siklus karyawan di sisi hilir — setelah rekrut, bekerja, dan digaji, kini dinilai.

---

## 2. Konsep Inti

| Konsep | Penjelasan |
|---|---|
| **Framework** | Kerangka penilaian: KPI / OKR / kompetensi (configurable) |
| **Goal** | Sasaran karyawan (target KPI / objective OKR) |
| **Review cycle** | Periode penilaian (mis. Q1 2026, tahunan) |
| **Self-assessment** | Penilaian oleh karyawan sendiri |
| **Manager review** | Penilaian oleh atasan |
| **360 feedback** | Masukan dari banyak sisi (atasan, rekan, bawahan) |
| **Calibration** | Normalisasi skor lintas tim (kurangi bias) |
| **Rating** | Skor akhir kinerja |

---

## 3. Aktor

| Aktor | Peran |
|---|---|
| **Karyawan** | Tetapkan goal, self-assessment, lihat hasil sendiri |
| **Manajer** | Review bawahan, tetapkan/ setujui goal, beri rating |
| **Peer/bawahan** | Beri 360 feedback (bila diaktifkan) |
| **HR / Admin** | Kelola siklus, framework, jalankan kalibrasi |

---

## 4. Relasi dengan Modul Lain

| Modul | Hubungan |
|---|---|
| **Core HR** | Karyawan, reporting line (siapa menilai siapa), posisi |
| **Payroll** | Rating → bonus kinerja (`BONUS_KINERJA`), opsional |
| **Recruitment** | Data performa dapat menginformasikan evaluasi hiring (opsional) |
| **Entitlement/RBAC** | Gerbang fitur & scope (self/team/branch) |
| **Notification** | Pengingat deadline review, minta feedback (saat modul ada) |

---

## 5. Alur Ringkas

```
tetapkan goal (awal periode)
   → jalankan siklus review (akhir periode)
        ├─ self-assessment
        ├─ manager review
        └─ 360 feedback (opsional)
   → kalibrasi (normalisasi lintas tim)
   → rating akhir
   → tindak lanjut: pengembangan / bonus (opsional) / promosi
```

---

## 6. Batasan & Asumsi

- Kerangka & form penilaian = data konfigurasi per tenant.
- Reviewer memakai reporting line dari Core HR.
- Kaitan bonus ke Payroll bersifat opsional (bisa dinonaktifkan).
- Scope per cabang/tim & self mengikuti Tenancy 2-level + RBAC.
