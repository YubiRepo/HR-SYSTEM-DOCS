# 01 · Overview

## 1. Tujuan

Core HR adalah pusat data kepegawaian HRMS. Ia menyimpan **siapa** karyawan di sebuah organisasi, **di mana** posisinya dalam struktur, dan **bagaimana** status kepegawaiannya berubah sepanjang waktu. Modul lain tidak menyimpan ulang data ini — mereka merujuk ke Core HR.

---

## 2. Konsep Inti

| Konsep | Penjelasan |
|---|---|
| **Employee** | Representasi karyawan (data pribadi & kepegawaian) |
| **Org Unit** | Unit organisasi (divisi, departemen, tim) |
| **Position** | Jabatan/posisi yang diduduki karyawan |
| **Reporting Line** | Hubungan atasan–bawahan |
| **Employment** | Ikatan kerja: tipe, kontrak, tanggal mulai/berakhir |
| **Lifecycle Status** | Tahap siklus karyawan (probation, active, resigned, dst) |
| **Assignment** | Penempatan karyawan pada unit + posisi tertentu |

---

## 3. Employee vs User (Auth)

Penting membedakan dua hal:

| | Employee (Core HR) | User (Auth) |
|---|---|---|
| **Apa** | Data kepegawaian orang | Akun untuk login |
| **Contoh isi** | NIK, jabatan, kontrak, unit | email/username, password, MFA |
| **Relasi** | Menautkan ke `user_id` | Bisa ada tanpa employee (mis. admin) |

Satu karyawan biasanya memiliki satu akun user, tetapi tidak semua user adalah karyawan (mis. super admin tenant). Penautan dilakukan lewat `user_id` pada entitas employee.

---

## 4. Struktur Organisasi vs Hirarki Tenancy

Jangan dicampur dengan hirarki tenancy:

| | Struktur Organisasi (Core HR) | Hirarki Tenancy (arsitektur) |
|---|---|---|
| **Tujuan** | Org chart: siapa di unit apa, lapor ke siapa | Batas isolasi data & billing |
| **Contoh** | Divisi → Departemen → Tim | Tenant → Cabang → (grup) |
| **Diatur di** | Modul ini | [Tenancy Model](../../architecture/HRMS_Tenancy_Model.md) |

Struktur organisasi berada **di dalam** sebuah tenant (dan bila tenancy berlapis, di dalam cabang/company). Detail di `02-org-structure.md`.

---

## 5. Batasan & Asumsi

- Data karyawan selalu terikat pada satu `tenant_id`.
- Perubahan penting (posisi, unit, status) dicatat sebagai riwayat.
- Core HR tidak menghitung gaji/kehadiran — hanya menyediakan data dasar bagi modul terkait.
- Konversi kandidat → karyawan berasal dari modul Recruitment, tetapi record karyawan final hidup di sini.
