# HR Setting — Manual

Menu **HR Setting** berisi data master dan aturan yang dipakai modul lain:
struktur organisasi & posisi, jam kerja, kalender libur, aturan absensi, jenis
cuti, komponen gaji, pajak & BPJS, serta field tambahan data karyawan. Biasanya
diatur sekali di awal lalu disesuaikan bila kebijakan perusahaan berubah.

| | |
|---|---|
| **Menu** | HR Setting |
| **Aktor** | `tenant_admin` / HR admin, petugas payroll |
| **Akses** | `/tenants/hr-setting/**` |
| **Tampil bila** | Punya salah satu izin sub-halaman di bawah; tiap sub-halaman punya syarat sendiri |

## Daftar Halaman

| # | Halaman | Dokumen | Akses | Ringkasan |
|---|---|---|---|---|
| 1 | Organizations | [`01-organizations.md`](./01-organizations.md) | `/tenants/hr-setting/organizations` | Struktur unit organisasi perusahaan |
| 2 | Positions | [`02-positions.md`](./02-positions.md) | `/tenants/hr-setting/positions` | Daftar posisi/jabatan per unit |
| 3 | Working Time | [`03-working-time.md`](./03-working-time.md) | `/tenants/hr-setting/working-time` | Shift/jam kerja dan pengelompokan jadwal |
| 4 | Holiday & Leave Calendar | [`04-holiday-leave-calendar.md`](./04-holiday-leave-calendar.md) | `/tenants/hr-setting/holiday-leave-calendar` | Hari libur nasional, cuti bersama, dan libur perusahaan |
| 5 | Attendance Rules | [`05-attendance-rules.md`](./05-attendance-rules.md) | `/tenants/hr-setting/attendance-rules` | Toleransi telat, lembur, lokasi absen, dan aturan absensi lain |
| 6 | Leave Types | [`06-leave-types.md`](./06-leave-types.md) | `/tenants/hr-setting/leave-types` | Jenis cuti beserta kuota dan aturannya |
| 7 | Salary Component | [`07-salary-component.md`](./07-salary-component.md) | `/tenants/hr-setting/salary-component` | Komponen pendapatan & potongan gaji |
| 8 | Tax and BPJS | [`08-tax-bpjs.md`](./08-tax-bpjs.md) | `/tenants/hr-setting/tax-bpjs` | Pengaturan PPh 21 dan BPJS |
| 9 | Custom Fields | [`09-custom-fields.md`](./09-custom-fields.md) | `/tenants/hr-setting/custom-fields` | Field tambahan pada data karyawan |
| — | FAQ & Troubleshooting | [`99-faq.md`](./99-faq.md) | — | Pertanyaan umum |

## Syarat Tampil Sub-Halaman

| Halaman | Fitur paket | Permission (salah satu) |
|---|---|---|
| Organizations, Positions | — | `core_hr:write`, `org:write` |
| Working Time, Holiday & Leave Calendar, Attendance Rules | Attendance | `attendance:read` |
| Leave Types | Leave | `leave:config`, `settings:write` |
| Salary Component, Tax and BPJS | Payroll | `payroll:run`, `payroll:approve`, `payroll:config` |
| Custom Fields | — | `settings:write` |

> Sub-halaman yang fiturnya tidak termasuk paket langganan tidak muncul di
> sidebar. Cek paket di **Company Settings → Billing**.

## Urutan Setup yang Disarankan

1. **Organizations** lalu **Positions** — wajib ada sebelum menambah karyawan.
2. **Working Time** dan **Holiday & Leave Calendar** — dasar perhitungan absensi.
3. **Attendance Rules** — toleransi telat, lembur, dan lokasi absen.
4. **Leave Types** — jenis cuti yang bisa diajukan karyawan.
5. **Salary Component** dan **Tax and BPJS** — sebelum menjalankan payroll.
6. **Custom Fields** — bila perusahaan butuh data karyawan tambahan.

## Sumber

| Jenis | Path |
|---|---|
| Sidebar/gate | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Wrapper | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting.vue` |
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/**` |
| Modul | `modules/core-hr/**`, `modules/attendance/**`, `modules/leave/**`, `modules/payroll/**` |
