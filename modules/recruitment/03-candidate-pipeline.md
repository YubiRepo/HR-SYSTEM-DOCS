# 03 · Candidate & Pipeline

## 1. Kandidat (Candidate)

Data pelamar, tersimpan independen dari lowongan (satu kandidat bisa melamar beberapa lowongan / dipakai ulang dari talent pool).

| Atribut | Contoh |
|---|---|
| `full_name` | Nama |
| `email` / `phone` | Kontak |
| `resume_ref` | CV (file) |
| `source` | Sumber: referral / job board / karir / walk-in |
| `notes` | Catatan umum |
| `tags` | Label (mis. "senior", "talent pool") |

---

## 2. Application (Lamaran)

Menghubungkan kandidat ke lowongan tertentu. Di sinilah pipeline berjalan.
```
Application = Candidate × Job Posting
  ├── current_stage : tahap sekarang
  ├── status        : active / hired / rejected / withdrawn
  └── evaluations   : rating per tahap
```
Satu kandidat melamar 2 lowongan = 2 application terpisah (pipeline masing-masing).

---

## 3. Pipeline — Configurable

Pipeline = urutan **tahap seleksi**. Tenant mengatur tahapannya sendiri (tidak hardcode).

**Contoh pipeline default:**
```
Applied → Screening → Interview HR → Interview User → Offer → Hired
                                                       ↘ Rejected (dari tahap mana pun)
```

Tenant bisa menyesuaikan:
- Tambah tahap (mis. "Tes Teknis", "Interview Direksi")
- Hapus tahap (UMKM mungkin cukup: Applied → Interview → Hired)
- Beda pipeline per jenis posisi (mis. teknis vs non-teknis)

**Definisi tahap:**
| Atribut | Contoh |
|---|---|
| `name` | "Interview User" |
| `order` | Urutan |
| `type` | screening / interview / test / offer / final |
| `requires_evaluation` | Wajib ada rating sebelum lanjut |

---

## 4. Menggerakkan Kandidat (Move Stage)

```
kandidat di "Screening" → HR putuskan lolos → pindah ke "Interview HR"
   → tiap perpindahan tercatat (siapa, kapan, alasan)
```
- **Maju** ke tahap berikutnya (lolos).
- **Tolak** (rejected) dari tahap mana pun, dengan alasan.
- **Mundur** (opsional) bila perlu evaluasi ulang.

Kandidat ditolak tetap tersimpan (talent pool / audit).

---

## 5. Evaluasi (Assessment)

Pada tahap tertentu, pewawancara memberi penilaian:
```
Interview User · kandidat Budi
  ├── pewawancara : emp_sari
  ├── rating      : 4/5
  ├── kriteria    : teknis 4, komunikasi 5, budaya 3
  └── catatan     : "kuat di backend, perlu asah komunikasi"
```
- **Form evaluasi configurable** — tenant tentukan kriteria & skala.
- Beberapa pewawancara bisa menilai satu kandidat (rata-rata / ringkasan).
- Keputusan lanjut/tolak bisa mensyaratkan evaluasi lengkap (`requires_evaluation`).

---

## 6. Kolaborasi & Scorecard

- Ringkasan evaluasi semua pewawancara → **scorecard** untuk keputusan hiring manager.
- Catatan & komentar antar tim rekrutmen (internal).
- Jadwal interview (opsional, terhubung Notification untuk pengingat).

---

## 7. Scope & Privasi

- Kandidat & application ter-scope cabang/lowongan (RBAC).
- Data pelamar bersifat sensitif (privasi/UU PDP) — akses dibatasi ke tim rekrutmen terkait; retensi & penghapusan diatur kebijakan.
