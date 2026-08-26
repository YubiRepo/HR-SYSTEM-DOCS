# 02 · Job Posting

## 1. Lowongan (Job Posting)

Lowongan membuka satu posisi untuk direkrut. Terikat **cabang** dan merujuk **posisi/katalog** dari Core HR.

| Atribut | Contoh |
|---|---|
| `title` | "Software Engineer" |
| `position_id` / `template_id` | Rujuk posisi/katalog Core HR |
| `branch_id` | Cabang yang merekrut |
| `headcount` | Jumlah yang dicari (mis. 3 orang) |
| `employment_type` | tetap / kontrak / magang / harian |
| `description` / `requirements` | Deskripsi & syarat |
| `salary_range` | Rentang gaji (opsional, bisa disembunyikan) |
| `status` | draft / open / on_hold / closed |
| `pipeline_id` | Pipeline seleksi yang dipakai |

---

## 2. Kaitan dengan Posisi Core HR

Lowongan **merujuk** posisi dari Core HR (bukan bikin sendiri):
```
Core HR: posisi "Software Engineer" (cabang Jakarta, headcount 20, terisi 18)
   → Recruitment: buka lowongan untuk 2 slot kosong
```
Ini menjaga konsistensi — rekrutmen selaras dengan struktur & kapasitas org yang sudah ada. Bisa juga merekrut untuk posisi baru (dibuat dulu di Core HR).

---

## 3. Multi-Cabang

Sejalan Tenancy 2-level:
- Lowongan **ter-scope cabang** (`branch_id`).
- **Branch recruiter** (scope `branch`) hanya mengelola lowongan cabangnya.
- **Tenant admin/HR pusat** lintas cabang.

---

## 4. Publikasi (Publish)

Lowongan `open` dapat dipublikasikan ke beberapa kanal:

| Kanal | Cara |
|---|---|
| **Halaman karir** | Halaman publik tenant (bila ada) |
| **Job board eksternal** | Ekspor/integrasi (JobStreet, LinkedIn, dll) — menyusul |
| **Internal** | Lowongan internal (karyawan existing melamar) |
| **Link berbagi** | URL unik untuk disebar |

> Publikasi ke job board eksternal & halaman karir publik terkait portal kandidat — disiapkan, dibangun bertahap. Untuk sekarang, lamaran diinput HR / via link.

---

## 5. Lifecycle Lowongan

```
DRAFT → OPEN → (ON_HOLD) → CLOSED
```
| Status | Arti |
|---|---|
| `draft` | Disiapkan, belum tayang |
| `open` | Aktif menerima pelamar |
| `on_hold` | Ditahan sementara (mis. tunggu budget) |
| `closed` | Selesai (terisi / dibatalkan) |

Menutup lowongan tidak menghapus kandidat — data pelamar tetap tersimpan (bisa dipakai untuk lowongan lain / talent pool).

---

## 6. Talent Pool (opsional)

Kandidat bagus yang belum diterima dapat disimpan di **talent pool** untuk lowongan mendatang, alih-alih hilang. Ditandai agar mudah ditemukan saat ada posisi serupa.
