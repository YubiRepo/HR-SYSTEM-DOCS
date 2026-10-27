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
| 3 | Working Time | [`03-working-time.md`](./03-working-time.md) | `/tenants/hr-setting/working-time` | Katalog shift: jam kerja, istirahat, dan jendela absen |
| 4 | Working Patterns | [`04-working-patterns.md`](./04-working-patterns.md) | `/tenants/hr-setting/working-patterns` | Pola kerja tetap/rotasi beserta hari kerja, yang dipasang ke karyawan |
| 5 | Holiday & Leave Calendar | [`05-holiday-leave-calendar.md`](./05-holiday-leave-calendar.md) | `/tenants/hr-setting/holiday-leave-calendar` | Hari libur nasional, cuti bersama, dan libur perusahaan |
| 6 | Attendance Rules | [`06-attendance-rules.md`](./06-attendance-rules.md) | `/tenants/hr-setting/attendance-rules` | Toleransi telat, lembur, lokasi absen, dan aturan absensi lain |
| 7 | Leave Types | [`07-leave-types.md`](./07-leave-types.md) | `/tenants/hr-setting/leave-types` | Jenis cuti beserta kuota dan aturannya |
| 8 | Salary Component | [`08-salary-component.md`](./08-salary-component.md) | `/tenants/hr-setting/salary-component` | Komponen pendapatan & potongan gaji |
| 9 | Tax and BPJS | [`09-tax-bpjs.md`](./09-tax-bpjs.md) | `/tenants/hr-setting/tax-bpjs` | Pengaturan PPh 21 dan BPJS |
| 10 | Custom Fields | [`10-custom-fields.md`](./10-custom-fields.md) | `/tenants/hr-setting/custom-fields` | Field tambahan pada data karyawan |
| — | FAQ & Troubleshooting | [`99-faq.md`](./99-faq.md) | — | Pertanyaan umum |

## Syarat Tampil Sub-Halaman

| Halaman | Fitur paket | Permission (salah satu) |
|---|---|---|
| Organizations, Positions | — | `core_hr:write`, `org:write` |
| Working Time, Working Patterns, Holiday & Leave Calendar, Attendance Rules | Attendance | `attendance:read` |
| Leave Types | Leave | `leave:config`, `settings:write` |
| Salary Component, Tax and BPJS | Payroll | `payroll:run`, `payroll:approve`, `payroll:config` |
| Custom Fields | — | `settings:write` |

> Sub-halaman yang fiturnya tidak termasuk paket langganan tidak muncul di
> sidebar. Cek paket di **Company Settings → Billing**.

## Urutan Setup yang Disarankan

1. **Organizations** lalu **Positions** — wajib ada sebelum menambah karyawan.
2. **Working Time** (jam kerja shift), lalu **Working Patterns** (hari kerja &
   rotasi yang dipasang ke karyawan), dan **Holiday & Leave Calendar** — dasar perhitungan
   absensi.
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
