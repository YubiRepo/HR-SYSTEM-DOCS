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

## File

| File | Isi | Status |
|---|---|---|
| [`auth.md`](./auth.md) | Login, pilih/ganti tenant, refresh, profil akun, permission untuk menu | Tersedia |
| [`attendance.md`](./attendance.md) | Clock in/out, geofence, hari ini, jadwal, koreksi, lembur | Tersedia |
| [`leave.md`](./leave.md) | Saldo, ajuan, lampiran, riwayat, batal, approval | Tersedia |
| [`payroll.md`](./payroll.md) | Slip gaji (list, detail, PDF), approve run | Tersedia (pinjaman belum) |
| [`core-hr.md`](./core-hr.md) | Profil, update kontak, dokumen, wilayah, direktori | Tersedia |
| [`performance.md`](./performance.md) | Goal, review, 360 | **Belum tersedia di API** |
| [`recruitment.md`](./recruitment.md) | Kandidat, evaluasi, offer | **Belum tersedia di API** |

---

## Permission self-service (role `employee`)

| Permission | Dipakai untuk |
|---|---|
| `profile:read` / `profile:write` | Akun login sendiri (`/auth/me`) |
| `employees:self` | Data karyawan sendiri, update kontak, dokumen sendiri |
| `employees:directory` | Direktori rekan kerja |
| `attendance:self` | Absen, jadwal, koreksi, lembur sendiri |
| `leave:self` | Saldo & ajuan cuti sendiri |
| `payslip:self` | Slip gaji sendiri |

Approval memakai permission yang sudah ada (`attendance:approve`, `leave:approve`, `payroll:approve`).

---

## Belum tersedia (menyusul)

- **Fitur tim untuk manajer:** kehadiran tim hari ini, inbox approval, filter tim di kalender cuti, dan pembatasan approve hanya untuk bawahan langsung.
- **Notifikasi push** (registrasi device token / FCM).
- **Pinjaman & cicilan** (Payroll).
- Modul **Performance** dan **Recruitment**.
