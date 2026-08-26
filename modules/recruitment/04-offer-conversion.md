# 04 · Offer & Conversion

Tahap akhir rekrutmen: memberi penawaran kerja, dan setelah diterima, mengonversi kandidat menjadi **karyawan di Core HR**.

---

## 1. Offer (Penawaran Kerja)

Setelah kandidat lolos seleksi, dibuatkan offer:

| Atribut | Contoh |
|---|---|
| `candidate_id` / `application_id` | Kandidat |
| `position_id` / `branch_id` | Posisi & cabang |
| `salary_offer` | Gaji ditawarkan |
| `employment_type` | tetap / kontrak / magang |
| `start_date` | Tanggal mulai kerja |
| `expiry_date` | Batas kandidat merespons |
| `status` | draft / sent / accepted / rejected / expired / negotiating |

---

## 2. Lifecycle Offer

```
DRAFT → SENT → ACCEPTED → (konversi)
             ↘ NEGOTIATING → SENT (revisi)
             ↘ REJECTED
             ↘ EXPIRED (lewat batas)
```

- **Approval offer:** pembuatan/pengiriman offer bisa butuh persetujuan (mis. hiring manager / HR head), configurable.
- **Negosiasi:** kandidat nego → revisi offer → kirim ulang.
- **Diterima:** memicu langkah konversi.

---

## 3. Konversi Kandidat → Karyawan (Core HR)

Inti integrasi. Setelah offer `accepted`, kandidat dikonversi menjadi karyawan **melalui jalur resmi Core HR** (Pola A) — bukan membuat karyawan "liar".

```
offer accepted
   → buat karyawan di Core HR:
        ├── data dari kandidat (nama, kontak) + offer (posisi, cabang, gaji, start_date)
        ├── create_account: true → akun login dibuat (Auth) + undangan aktivasi
        └── link ke record kandidat (jejak: karyawan ini dari kandidat X)
   → status application: hired
   → lowongan: headcount terisi (bila penuh → close)
```

**Yang terbawa saat konversi:**
| Dari | Ke Core HR |
|---|---|
| Nama, email, phone, CV | Data karyawan + dokumen |
| Posisi & cabang (offer) | Penempatan karyawan |
| Gaji offer | Titik awal komponen gaji (Payroll) |
| Start date | Tanggal mulai / join date |

> Konversi memakai Core HR Pola A: membuat karyawan otomatis membuat akun + undangan (bisa di-skip). Bila kandidat kebetulan sudah punya akun, pakai `link_user_id`. Detail: `../core-hr/03-employee-lifecycle.md`.

---

## 4. Setelah Konversi (Onboarding)

Konversi menyerahkan estafet ke Core HR & modul lain:
- **Core HR** — record karyawan resmi, onboarding checklist.
- **Attendance** — enrollment biometrik/kartu bila cabang memakainya.
- **Payroll** — komponen gaji berdasar offer/grade.

Recruitment selesai di titik "hired + terkonversi"; sisanya milik modul masing-masing.

---

## 5. Jejak & Audit

- Record kandidat & seluruh riwayat seleksi **tetap tersimpan** setelah jadi karyawan (asal-usul terlacak).
- Tautan dua arah: karyawan ↔ kandidat asal.
- Berguna untuk analitik rekrutmen (sumber terbaik, waktu rekrut, dll).

---

## 6. Metrik Rekrutmen (opsional)

Data pipeline memungkinkan metrik: time-to-hire, conversion rate per tahap, sumber kandidat terbaik, cost-per-hire. Disiapkan untuk pelaporan (modul Analytics / Admin Console).
