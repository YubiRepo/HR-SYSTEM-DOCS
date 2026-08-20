# 02 · Org Structure

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
- Unit berada dalam lingkup satu tenant (dan cabang bila tenancy berlapis).

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

## 6. Struktur & Tenancy Berlapis

Jika tenancy memakai hirarki (mis. Tenant → Cabang), struktur organisasi berada **di dalam** cabang tersebut. Artinya:

```
Tenant (PT Acme)
 └── Cabang Jakarta            ← batas tenancy
       └── Divisi Keuangan     ← struktur organisasi mulai di sini
             └── Departemen ...
```

Batas tenancy menentukan isolasi data; struktur organisasi mengatur org chart di dalamnya. Keputusan kedalaman tenancy ada di [Tenancy Model](../../architecture/HRMS_Tenancy_Model.md).
