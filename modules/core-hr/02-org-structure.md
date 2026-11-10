# 02 · Org Structure

## 0. Satu Struktur Organisasi per Tenant

Org structure (org unit & position) **milik tenant secara langsung, bukan milik cabang**. Cabang adalah konsep terpisah dan independen — tempat operasional/penempatan karyawan — tidak menentukan struktur organisasinya.

| Lapisan | Milik | Isi | Dikelola |
|---|---|---|---|
| **Org Structure** | Tenant | Org unit & position nyata — satu pohon organisasi untuk seluruh tenant | Tenant admin |

```
Tenant (PT Acme)
   └── Divisi Finance (satu-satunya, dipakai seluruh cabang)
         ├── Departemen Akuntansi
         └── Departemen Pajak

Karyawan Budi → cabang: Jakarta · unit: Departemen Akuntansi (unit yang sama dilihat/dipakai dari cabang manapun)
Karyawan Sari → cabang: Surabaya · unit: Departemen Akuntansi
```

**Aturan:**
- Hanya **satu** org chart per tenant — tidak ada duplikasi struktur per cabang.
- Employee tetap punya `branch_id` sendiri (penempatan operasional), independen dari `org_unit_id`/`position_id`-nya.

---

## 1. Komponen Struktur

Struktur organisasi disusun dari tiga elemen yang saling terkait:

| Elemen | Peran |
|---|---|
| **Org Unit** | Wadah organisasi (divisi/departemen/tim) — bisa bersarang |
| **Position** | Jabatan yang bisa diisi karyawan (mis. "Staff Finance") |
| **Assignment** | Penempatan: karyawan X pada unit Y dengan posisi Z |

---

## 2. Org Unit (Bersarang)

Org unit dapat membentuk pohon dengan kedalaman fleksibel via `parent_id`:

```
Divisi Keuangan
   ├── Departemen Akuntansi
   │      ├── Tim AP (Account Payable)
   │      └── Tim AR (Account Receivable)
   └── Departemen Pajak
```

- Setiap unit punya `parent_id` (null = unit puncak).
- Kedalaman tidak dibatasi kaku — mengikuti kebutuhan organisasi.
- Unit berada dalam lingkup satu tenant — bukan per cabang (lihat §0).

---

## 3. Position (Jabatan)

- Position adalah *slot* jabatan, terpisah dari orangnya.
- Contoh: "Manager Akuntansi", "Staff Pajak".
- Satu position dapat memiliki atribut: grade (job grade), unit terkait, status aktif.
- Position memudahkan pelaporan headcount & perencanaan (posisi kosong vs terisi).

### 3.0 Kapasitas (Headcount) — Ditegakkan

- `headcount` = jumlah karyawan maksimal yang boleh memegang position, **minimal 1** (`POST` tanpa headcount = 1).
- **Terisi (filled)** = karyawan dengan `current_position_id` = position tsb. dan status **bukan** `offboarded`/`terminated` (karyawan `resigned` masih dihitung sampai offboarding).
- Menempatkan karyawan **baru masuk** ke position yang sudah penuh (filled ≥ headcount) ditolak `409 POSITION_FULL`. Berlaku di semua jalur: create karyawan, bulk import (per baris), assignment, mutation request (approve maupun apply terjadwal — request ditandai `failed` dengan alasannya).
- Karyawan yang tetap di position yang sama (mis. hanya ganti cabang/status) tidak dicek. Perubahan yang berakhir di status `terminated`/`offboarded` membebaskan kursi, tidak memakai.
- Headcount tidak bisa diturunkan di bawah jumlah pemegang saat ini (`422 INVALID_HEADCOUNT`).
- Pengecekan dilakukan dengan row lock pada position (`SELECT … FOR UPDATE`) di dalam transaksi assignment, sehingga dua penempatan bersamaan tidak bisa sama-sama mengambil kursi terakhir.
- Position yang sudah kelebihan isi sebelum aturan ini berlaku tidak diubah: pemegangnya tetap, hanya penempatan baru yang ditolak sampai headcount dinaikkan.

### 3.1 Job Grade (Tingkatan Jabatan)

- **Master data Core HR** per tenant (`job_grades`): `code` (unik per tenant, disimpan huruf besar), `name`, `rank`, `is_active`.
- **`rank` mengurutkan grade** — makin besar makin senior (mis. Staff 10 → Supervisor 20 → Manager 30 → General Manager 40 → Director 50). Rank boleh sama; logika membandingkan rank (mis. step approval "atasan pertama dengan grade ≥ X"), bukan code/nama.
- **Position punya grade** (`positions.job_grade_id`, opsional). Hanya grade aktif yang bisa dipasang ke position; position yang grade-nya kemudian dinonaktifkan tetap menyimpan grade tersebut.
- **Karyawan tidak punya grade sendiri** — grade karyawan = grade jabatan yang sedang dia pegang. Tidak ada syarat grade saat menempatkan karyawan ke jabatan.
- Grade tidak bisa dinonaktifkan selama masih dipakai position aktif (`409 JOB_GRADE_IN_USE`).
- Tenant yang sudah ada saat migrasi `20261110000001_job_grades` mendapat 5 grade default; tenant baru mulai dari daftar kosong.

---

## 4. Reporting Line (Hierarki Pelaporan)

Hubungan atasan–bawahan bisa ditentukan dengan dua pendekatan (bisa dikombinasi):

| Pendekatan | Cara | Catatan |
|---|---|---|
| **Eksplisit** (utama) | Field `manager_id` pada karyawan | Fleksibel (mis. lapor ke lintas unit) |
| **Berbasis unit** (fallback) | Atasan = kepala unit (`org_units.head_employee_id`) | Otomatis mengikuti struktur |

Reporting line dipakai modul lain — mis. approval cuti/lembur/dokumen & Performance (review oleh atasan).

### 4.1 Validasi `manager_id`

Berlaku di create, update, dan bulk import karyawan:

| Aturan | Error |
|---|---|
| Atasan harus karyawan **satu tenant**, belum diarsip, dan masih bekerja (`probation`/`active`/`on_leave`) | `422 MANAGER_INVALID` |
| Tidak boleh dirinya sendiri | `422 MANAGER_SELF` |
| Tidak boleh membentuk siklus (A → B → C → A) — dicek dengan menaiki rantai atasan dari calon atasan | `422 MANAGER_CYCLE` |

- `manager_id: ""` pada `PATCH` = hapus atasan.
- Bulk import: atasan harus sudah ada sebelum baris yang merujuknya diproses.
- Saat atasan diterminasi/nonaktif, bawahannya **tidak** di-clear otomatis; resolver di §4.2 akan melewati atasan yang tidak aktif.
- Kepala unit (`head_employee_id`) juga harus karyawan aktif satu tenant (`422 INVALID_ORG_UNIT_HEAD`).

### 4.2 Effective Manager (Resolver)

Atasan efektif di-resolve per level (`ResolveManagerChain` di contract Core HR, `GET /employees/{id}/reporting-line`):

1. `manager_id` bila terisi dan atasannya aktif.
2. Bila kosong/tidak aktif → **kepala unit** dari unit karyawan saat ini. Bila kepala unit adalah orang itu sendiri (atau kosong/tidak aktif) → naik ke kepala **unit induk**, terus sampai ketemu atau habis.
3. Level berikutnya diulang dari atasan yang ditemukan.

- Rantai berhenti lebih awal bila satu level tidak bisa di-resolve.
- Atasan tanpa akun login tetap dikembalikan (`has_account: false`); modul pemakai (mis. engine approval) yang memutuskan tindakannya.
- Ada batas iterasi dan pengecekan orang yang sudah muncul, sebagai pengaman terhadap data lama yang mungkin melingkar.

---

## 5. Assignment (Penempatan)

Assignment mengikat karyawan ke unit + posisi pada periode tertentu:

| Field | Contoh |
|---|---|
| Karyawan | Budi |
| Unit | Tim AP |
| Posisi | Staff Finance |
| Mulai | 2026-09-01 |
| Selesai | null (masih aktif) |

- Satu karyawan umumnya punya satu assignment aktif.
- Perubahan (mutasi/promosi) membuat assignment baru & menutup yang lama → membentuk **riwayat** (lihat lifecycle).

---

## 6. Struktur Organisasi vs Cabang

Tenancy (isolasi data antar tenant, lihat [Tenancy Model](../../architecture/HRMS_Tenancy_Model.md)) dan struktur organisasi adalah dua hal terpisah:

```
Tenant (PT Acme)                    ← batas tenancy & batas struktur organisasi
 └── Divisi Keuangan                ← struktur organisasi (satu untuk seluruh tenant)
       └── Departemen ...

Cabang Jakarta, Cabang Surabaya     ← konsep terpisah: penempatan operasional karyawan,
                                       tidak membentuk cabang dari org chart
```

Karyawan punya `branch_id` (cabang tempat dia bekerja) yang sepenuhnya independen dari `org_unit_id`/`position_id`-nya (tempatnya di org chart tenant). Dua karyawan di cabang berbeda bisa berada di unit organisasi yang sama.
