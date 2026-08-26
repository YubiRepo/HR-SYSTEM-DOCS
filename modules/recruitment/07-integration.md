# 07 · Integration

Recruitment adalah hulu siklus karyawan. Integrasi utamanya ke Core HR (posisi & konversi), didukung Entitlement/RBAC dan (nanti) Notification.

---

## 1. Dengan Core HR

| Arah | Data | Guna |
|---|---|---|
| Core HR → Recruitment | Posisi, katalog, cabang, headcount | Lowongan merujuk posisi & kapasitas |
| Recruitment → Core HR | Kandidat hired | Konversi jadi karyawan (Pola A) |

**Konversi (titik integrasi utama):**
```
offer accepted → POST convert
   → Core HR buat karyawan (data kandidat + offer)
   → create_account (Auth) + undangan (Pola A)
   → application.status = hired, simpan converted_employee_id
```

> Konversi memakai jalur resmi Core HR — tidak membuat karyawan langsung. Ini menjaga konsistensi (semua karyawan lahir lewat Core HR).

---

## 2. Dengan Auth (via Core HR)

Saat konversi dengan `create_account: true`, Core HR memicu Auth membuat akun + undangan aktivasi. Recruitment tidak menyentuh kredensial. Bila kandidat sudah punya akun (mis. karyawan internal melamar), pakai `link_user_id`.

---

## 3. Multi-Cabang (RBAC)

```
request → Entitlement: tenant punya fitur "recruitment"?
        → RBAC: izin (recruitment:read/write/evaluate/hire)?
        → scope: branch recruiter → cabangnya; tenant admin → lintas cabang
```
Lowongan & kandidat ter-scope cabang. Konversi ke karyawan menghormati cabang lowongan.

---

## 4. Dengan Payroll (tidak langsung)

Recruitment tidak menyentuh Payroll langsung, tetapi **gaji offer** menjadi titik awal komponen gaji karyawan baru:
```
offer.salary_offer → (saat konversi) → dasar komponen gaji di Payroll
```
Grade yang dipilih saat konversi menautkan ke salary grade template (Payroll).

---

## 5. Dengan Notification (titik picu)

- Jadwal interview → undangan ke pewawancara & kandidat.
- Perubahan status lamaran → notifikasi.
- Offer dikirim / akan kedaluwarsa → pengingat.
- Permintaan evaluasi ke pewawancara.

> Sampai modul Notification ada, titik-titik ini disiapkan sebagai event. Terkait juga portal kandidat (menyusul) untuk notifikasi ke pelamar.

---

## 6. Kesiapan Portal Kandidat (menyusul)

Struktur sudah disiapkan agar portal kandidat mudah ditambah:
- `candidates.user_id` — kandidat bisa punya akun (lihat status lamaran).
- `applications.status` & `stage_history` — sumber tampilan status untuk pelamar.
- Endpoint publik `apply` — untuk halaman karir.

Saat portal dibangun, kandidat dapat melamar mandiri & memantau status tanpa mengubah model inti.

---

## 7. Ringkasan Aliran

```
Core HR (posisi, cabang)
      │
      ▼
 RECRUITMENT (lowongan → kandidat → pipeline → offer)
      │ hired
      ▼
 Core HR (karyawan baru) → Auth (akun) → Attendance/Payroll (operasional)
```
