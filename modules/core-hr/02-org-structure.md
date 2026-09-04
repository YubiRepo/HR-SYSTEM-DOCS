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
- Satu position dapat memiliki atribut: level/grade, unit terkait, status aktif.
- Position memudahkan pelaporan headcount & perencanaan (posisi kosong vs terisi).

---

## 4. Reporting Line (Hierarki Pelaporan)

Hubungan atasan–bawahan bisa ditentukan dengan dua pendekatan (bisa dikombinasi):

| Pendekatan | Cara | Catatan |
|---|---|---|
| **Berbasis unit** | Atasan = pimpinan unit induk | Otomatis mengikuti struktur |
| **Eksplisit** | Field `manager_id` pada karyawan | Fleksibel (mis. lapor ke lintas unit) |

Reporting line dipakai modul lain — mis. Attendance (approval cuti) & Performance (review oleh atasan).

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
