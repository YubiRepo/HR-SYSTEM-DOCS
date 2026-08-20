# Core HR Module

Modul inti data karyawan & struktur organisasi untuk HR Management System. Menjadi **sumber data utama (single source of truth)** yang dirujuk seluruh modul HRMS lain (Payroll, Attendance, Performance, Recruitment).

| | |
|---|---|
| **Modul** | Core HR |
| **Versi** | 1.0 |
| **Sifat** | Stack-agnostic (konseptual) |
| **Multi-tenant** | Ya |
| **Dependensi** | Auth (identitas), RBAC (otorisasi) |

---

## Ruang Lingkup

- Data master karyawan (biodata, kepegawaian, kontrak)
- Struktur organisasi (unit, posisi, hierarki pelaporan)
- Employee lifecycle (onboarding, probation, mutasi, promosi, resign)
- Riwayat kepegawaian & audit perubahan data

**Di luar cakupan (modul lain):** penggajian (Payroll), kehadiran & cuti (Attendance & Leave), penilaian (Performance), rekrutmen (Recruitment).

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks & ikhtisar modul (dokumen ini) |
| [`01-overview.md`](./01-overview.md) | Tujuan, konsep inti, relasi antar modul |
| [`02-org-structure.md`](./02-org-structure.md) | Struktur organisasi: unit, posisi, hierarki |
| [`03-employee-lifecycle.md`](./03-employee-lifecycle.md) | Tahapan siklus karyawan & transisi status |
| [`04-api-contract.md`](./04-api-contract.md) | Endpoint REST karyawan & organisasi |
| [`05-data-model.md`](./05-data-model.md) | Skema entitas & relasi |

---

## Prinsip

1. **Single source of truth** — data karyawan hanya didefinisikan di sini; modul lain merujuk, bukan menyalin.
2. **Historis** — perubahan penting (posisi, status) disimpan sebagai riwayat, bukan menimpa.
3. **Tenant-scoped** — semua data terikat `tenant_id` (lihat [Tenancy Model](../../architecture/HRMS_Tenancy_Model.md)).
4. **Terpisah dari identitas** — akun login ada di modul Auth; Core HR menautkan karyawan ke `user_id`.

---

## Relasi dengan Modul Lain

| Modul | Hubungan |
|---|---|
| **Auth** | Karyawan tertaut ke akun (`user_id`) untuk login |
| **RBAC** | Posisi/unit dapat memengaruhi penetapan peran |
| **Payroll** | Mengambil data karyawan & komponen gaji dasar |
| **Attendance** | Merujuk karyawan & unit untuk jadwal/cuti |
| **Performance** | Merujuk karyawan, atasan, & struktur untuk review |
| **Recruitment** | Kandidat diterima → dikonversi menjadi karyawan di sini |
