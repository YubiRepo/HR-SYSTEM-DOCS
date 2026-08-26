# 01 · Overview

## 1. Tujuan

Modul Recruitment adalah **hulu** siklus karyawan: dari membuka lowongan, mengelola pelamar, menyeleksi melalui pipeline, hingga kandidat diterima dan **dikonversi menjadi karyawan** di Core HR.

```
lowongan → pelamar → seleksi (pipeline) → offer → hired → karyawan (Core HR)
```

---

## 2. Konsep Inti

| Konsep | Penjelasan |
|---|---|
| **Job posting** | Lowongan untuk satu posisi (di cabang tertentu) |
| **Candidate** | Pelamar + data (CV, kontak, sumber) |
| **Application** | Lamaran kandidat ke satu lowongan |
| **Pipeline** | Tahapan seleksi (configurable) |
| **Stage** | Satu tahap dalam pipeline (mis. Interview) |
| **Evaluation** | Rating/catatan kandidat pada suatu tahap |
| **Offer** | Penawaran kerja + status |
| **Conversion** | Kandidat hired → karyawan Core HR |

---

## 3. Aktor

| Aktor | Peran |
|---|---|
| **Recruiter / HR** | Buat lowongan, kelola kandidat, gerakkan pipeline |
| **User pewawancara** | Beri evaluasi kandidat pada tahapnya |
| **Hiring manager** | Putuskan lolos/tidak, setujui offer |
| **Kandidat** | Melamar (via HR input; portal mandiri menyusul) |

---

## 4. Relasi dengan Modul Lain

| Modul | Hubungan |
|---|---|
| **Core HR** | Lowongan merujuk posisi/katalog & cabang; kandidat hired → karyawan |
| **Entitlement/RBAC** | Gerbang fitur & scope (branch recruiter) |
| **Notification** | Notif jadwal interview, status offer (saat modul ada) |
| **Auth** | Saat konversi, akun karyawan dibuat (via Core HR Pola A) |

---

## 5. Alur Ringkas

```
HR buka lowongan (posisi X, cabang Y)
   → kandidat melamar (data + CV)
   → pipeline: screening → interview → offer → hired
        (tiap tahap: evaluasi, keputusan lanjut/tolak)
   → kandidat diterima → kirim offer → diterima
   → KONVERSI → karyawan baru di Core HR (Pola A)
```

---

## 6. Batasan & Asumsi

- Pipeline & form evaluasi = data konfigurasi per tenant.
- Lowongan terikat cabang (multi-cabang) & merujuk posisi Core HR.
- Portal kandidat mandiri belum dibangun; kandidat dikelola HR. Struktur data disiapkan untuk portal.
- Konversi ke karyawan memakai jalur resmi Core HR (tidak membuat karyawan "liar").
