<!-- 📁 modules/mobile/api/README.md -->
# Mobile API — Indeks

Subset endpoint HRMS yang dipakai aplikasi mobile. Mobile adalah **klien** dari modul yang sudah ada. Tidak ada route group `/mobile` terpisah: app memakai route modul yang sama dengan web ESS, terutama sub-path `/me/...` (self-service).

| | |
|---|---|
| **Base URL** | `/api/v1` |
| **Auth** | `Authorization: Bearer <access_token>`. Tenant diambil dari token, tidak ada header tenant. |
| **Envelope** | `{ success, data, pagination?, meta: { request_id, timestamp } }`. Error: `{ success: false, error: { code, message, details? } }` |
| **Gate** | Entitlement paket tenant (per modul) + permission RBAC (`resource:action`) |

---

## ⚠️ Perubahan Endpoint (Breaking) — November 2026

Semua endpoint ESS/mobile sekarang berada di **`/me/...`** dan hanya butuh key **`*:self`**. Endpoint di kolom kiri kini khusus HR/admin dan mengembalikan **`403 PERMISSION_DENIED`** untuk role `employee`. Mobile wajib pindah ke kolom kanan, dirilis bersamaan dengan API.

| Endpoint lama (sekarang khusus HR) | Endpoint mobile baru | Permission | Catatan |
|---|---|---|---|
| `GET /leave/types` | `GET /leave/me/types` | `leave:self` | Isi sama |
| `POST /leave/requests` | `POST /leave/me/requests` | `leave:self` | Tanpa `employee_id` |
| `POST /leave/requests/{id}/cancel` | `POST /leave/me/requests/{id}/cancel` | `leave:self` | Hanya ajuan sendiri |
| `POST /attendance/overtime` | `POST /attendance/me/overtime` | `attendance:self` | Tanpa `employee_id` |
| `POST /attendance/overtime/{id}/cancel` | `POST /attendance/me/overtime/{id}/cancel` | `attendance:self` | Hanya ajuan sendiri |
| `POST /attendance/records/{id}/correction` | `POST /attendance/me/records/{id}/correction` | `attendance:self` | Hanya record sendiri |
| `GET /attendance/shifts` · `/{id}` | `GET /attendance/me/shifts` · `/{id}` | `attendance:self` | Isi sama |
| `GET /core-hr/employee-fields` | `GET /core-hr/me/employee-fields` | `employees:self` | Isi sama |
| `GET /core-hr/directory` (`employees:directory`) | `GET /core-hr/me/directory` | `directory:self` | Key di-rename; isi sama |

Tidak berubah: clock-in/out, approval (`/approval/*`, approve/reject), dan semua `GET .../me/...` yang sudah ada. Key `profile:read`, `profile:write`, dan `team:read` dihapus: `/auth/me` (termasuk avatar) cukup dengan login, jadi kalau menu mobile mengecek key itu, ganti dengan "selalu tampil". Route `/core-hr/me/*` kini hanya menerima `employees:self` (sebelumnya juga `employees:read`).

---

## File

| File | Isi | Status |
|---|---|---|
| [`auth.md`](./auth.md) | Login, pilih/ganti tenant, refresh, profil akun, permission untuk menu | Tersedia |
| [`attendance.md`](./attendance.md) | Clock in/out, geofence, hari ini, jadwal, koreksi, lembur | Tersedia |
| [`leave.md`](./leave.md) | Saldo, ajuan, lampiran, riwayat, batal, approval | Tersedia |
| [`payroll.md`](./payroll.md) | Slip gaji (list, detail, PDF), approve run | Tersedia (pinjaman belum) |
| [`approval.md`](./approval.md) | Inbox persetujuan lintas modul (cuti, lembur, koreksi, payroll run), detail approver | Tersedia |
| [`core-hr.md`](./core-hr.md) | Profil, update kontak, CV saya & export PDF, dokumen, wilayah, direktori | Tersedia |
| [`performance.md`](./performance.md) | Goal, review, 360 | **Belum tersedia di API** |
| [`recruitment.md`](./recruitment.md) | Kandidat, evaluasi, offer | **Belum tersedia di API** |

---

## Permission self-service (role `employee`)

| Permission | Dipakai untuk |
|---|---|
| *(tanpa key, cukup login)* | Akun login sendiri (`/auth/me`, avatar, ganti password) |
| `employees:self` | Data karyawan sendiri, update kontak, dokumen sendiri |
| `directory:self` | Direktori rekan kerja |
| `attendance:self` | Absen, jadwal, koreksi, lembur sendiri |
| `leave:self` | Saldo & ajuan cuti sendiri |
| `payslip:self` | Slip gaji sendiri |

**Aturan:** setiap endpoint yang dipanggil mobile untuk data/aksi milik sendiri berada di `/me/...` dan hanya di-gate key di atas. Mobile tidak memanggil endpoint admin (`:read`/`:write`/`:config`) untuk kebutuhan self-service.

Approval memakai permission yang sudah ada (`attendance:approve`, `leave:approve`, `payroll:approve`).

---

## Belum tersedia (menyusul)

- **Fitur tim untuk manajer:** kehadiran tim hari ini, filter tim di kalender cuti, dan pembatasan approve hanya untuk bawahan langsung.
- **Notifikasi push** (registrasi device token / FCM).
- **Pinjaman & cicilan** (Payroll).
- Modul **Performance** dan **Recruitment**.
