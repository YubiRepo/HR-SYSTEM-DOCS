<!-- 📁 modules/mobile/issues/plan.md -->
# Plan Pengerjaan Issues Backend dari Mobile

Ringkasan semua issue di [`issues/`](./README.md) dan urutan pengerjaannya secara bertahap. Status awal dicek ke kode `HR-SYSTEM-API` `a706d31` (26 Nov 2026).

> **Cara pakai:** kerjakan per fase, dari atas ke bawah. Setelah satu item selesai, centang di sini **dan** ubah Status + isi **Catatan BE** di file issue-nya. Fase 0 (keputusan) bisa berjalan paralel dengan Fase 1–3.

---

## Ringkasan

| ID | Judul singkat | Prio | Status di docs | Status di kode (`a706d31`) | Fase |
|---|---|---|---|---|---|
| [ATT-5](./attendance.md#att-5) | Jam `/me/today` masih UTC | P1 | Done | Diperbaiki (Fase 1) | 1 ✅ |
| [ATT-9](./attendance.md#att-9) | `timestamp` clock-in/out tidak dibatasi | P1 | Done | Sudah aman sejak `d10e16e` (handler membuang `timestamp` di luar dev) | 1 ✅ |
| [ATT-6](./attendance.md#att-6) | `/me/today` tanpa `shift` dari pola jadwal | P2 | Done | Diperbaiki (Fase 1) | 1 ✅ |
| [ATT-2](./attendance.md#att-2) | Karyawan tak bisa lihat hari libur | P2 | Done | Diperbaiki (Fase 2) | 2 ✅ |
| [ATT-3](./attendance.md#att-3) | Jadwal hanya kirim `shift_id` | P3 | Done | Diperbaiki (Fase 2) | 2 ✅ |
| [ATT-7](./attendance.md#att-7) | `/leave/me/requests` tanpa filter tanggal | P3 | Done | Diperbaiki (Fase 2) | 2 ✅ |
| [CORE-3](./core-hr.md#core-3) | Endpoint `/me/` kontrak, riwayat, work policy | P2 | Done | `/me/reporting-line` ditambahkan (Fase 2) | 2 ✅ |
| [ATT-1](./attendance.md#att-1) | `GET /attendance/me/rules` | P2 | Done | Ditambahkan (Fase 3) | 3 ✅ |
| [AUTH-1](./auth.md#auth-1) | `PATCH /auth/me` tanpa validasi HP & username | P2 | Done | Diperbaiki (Fase 3) | 3 ✅ |
| [AUTH-2](./auth.md#auth-2) | Confirm avatar key salah → `500` | P3 | Done | Diperbaiki (Fase 3) | 3 ✅ |
| [APR-1](./approval.md#apr-1) | Contoh respons inbox + seed | P3 | Done | Docs `api/approval.md` (seed tidak dibuat) | 3 ✅ |
| [APR-2](./approval.md#apr-2) | Lembur & koreksi masuk engine approval | P2 | Done | Sudah (`97b061c`); butuh policy + backfill, belum diuji ke server | 3 ✅ |
| [APR-3](./approval.md#apr-3) | Riwayat keputusan approver | P2 | Done | `GET /approval/decided` ditambahkan (26 Nov) | — ✅ |
| [APR-4](./approval.md#apr-4) | Nama approver di timeline tampil sebagai email | P3 | Done | Fallback nama approval pakai `display_name`; kasus Rizky = data `full_name` karyawan berisi email | — ✅ |
| [NOTIF-1](./notification.md#notif-1) | Event bisnis notifikasi (katalog lengkap) | P2 | Open | Hanya `system.test` | — |
| [NOTIF-2](./notification.md#notif-2) | Bahasa push mengikuti bahasa app | P3 | Open | — | — |
| [NOTIF-3](./notification.md#notif-3) | Kontrak `data` push untuk mobile | P2 | Open | Sebagian (api/notification.md §3) | — |
| [NOTIF-4](./notification.md#notif-4) | Lifecycle device & token FCM | P2 | Open | Register/hapus ada; revoke otomatis belum | — |
| [CORE-1](./core-hr.md#core-1) | Karyawan hanya bisa ubah kontak | P1 | Done | Diperbaiki (Fase 4) | 4 ✅ |
| [CORE-2](./core-hr.md#core-2) | Karyawan upload dokumen sendiri | P1 | Done | Diperbaiki (Fase 4) | 4 ✅ |
| [CORE-4](./core-hr.md#core-4) | Ubah rekening butuh approval HR | P2 | Perlu keputusan (sementara: terbuka tanpa approval) | — | 0 |
| [ATT-8](./attendance.md#att-8) | Clock-in saat cuti approved | P2 | Done | Diperbaiki (Fase 4) | 4 ✅ |
| [PLAT-1](./platform.md#plat-1) | Trial habis → semua tulis ditolak | P2 | Perlu keputusan | — | 0 → 4 |
| [PLAT-2](./platform.md#plat-2) | Perpanjang trial tanpa jadi `active` | P3 | Perlu keputusan | — | 0 → 4 |
| [PAY-1](./payroll.md#pay-1) | API pinjaman & kasbon | P2 | Perlu keputusan | — | 0 → 5 |
| [PAY-2](./payroll.md#pay-2) | Hitung payroll `500` untuk satu karyawan; TER B/C tidak di-seed | P2 | Open | — | — |
| [ATT-10](./attendance.md#att-10) | `/me/overtime` masih wajib `employee_id` | P2 | Done | Diperbaiki 28 Nov 2026 (DTO `/me` tanpa `employee_id`) | ✅ |
| [AUTH-3](./auth.md#auth-3) | Cek ketersediaan username / HP | P2 | Done | Done | — |
| [ATT-4](./attendance.md#att-4) | Jadwal tandai hari cuti | P3 | Done | Done (via Leave) | — |

**Total:** 27 issue · 19 Done · 4 Open (NOTIF-1 … NOTIF-4) · 4 masih perlu keputusan (CORE-4, PLAT-1, PLAT-2, PAY-1).

---

## Fase 0 — Keputusan Produk (paralel)

Tidak ada kode sebelum diputuskan. Hasil keputusan ditulis di **Catatan BE** masing-masing issue, lalu item pindah ke Fase 4/5.

- [x] **CORE-1** (26 Nov, sementara): semua data diri boleh diubah karyawan **kecuali data terkait mutasi** (cabang, org unit, posisi, job grade, pola kerja, status kepegawaian). Detail & usulan pengecualian tambahan di issue.
- [ ] **CORE-4**: belum diatur. Sementara `bank_accounts` ikut terbuka tanpa approval/notifikasi; dibahas lagi nanti.
- [x] **CORE-2** (26 Nov): boleh, langsung tersimpan tanpa verifikasi HR.
- [x] **ATT-8** (26 Nov): tolak dengan `ON_LEAVE`; karyawan membatalkan cuti dulu bila masuk kerja.
- [ ] **PLAT-1**: belum diputuskan (dicatat 26 Nov). Opsi: notifikasi H-7/H-1, absen saat grace, plan demo.
- [ ] **PLAT-2**: belum diputuskan (dicatat 26 Nov). Opsi: endpoint *extend trial*.
- [ ] **PAY-1**: pinjaman/kasbon masuk roadmap Payroll?

---

## Fase 1 — Bug P1 & Data Kehadiran Hari Ini ✅

> **Selesai 26 Nov 2026.** ATT-5 & ATT-6 diperbaiki di `GetMyToday` (belum di-commit saat ditulis). ATT-9 ternyata sudah ditangani sejak `d10e16e`: `timestamp` client hanya dipakai di environment development, jadi tidak ada perubahan kode.

Fokus: data absen yang salah atau bisa dimanipulasi. Semua ada di `attendancerecord`.

- [x] **ATT-5** — `GetMyToday` (`attendancerecord/query/attendance_record_queries.go:237,241`): konversi `ClockIn` / `ClockOut` ke zona waktu cabang (`resolveLocation`, sama dengan clock-in) sebelum `Format("15:04")`.
  - *Selesai bila:* absen 15:43 WIB → `/me/today` mengirim `"15:43"`.
- [x] **ATT-9** — `parseTimestampOrNow` (`attendancerecord/command/clock_in.go:153`): batasi selisih `timestamp` vs jam server (mis. maks +5 menit ke depan; ke belakang hanya untuk `source=offline` dengan batas N jam), tandai record offline agar bisa ditinjau HR. Angka batas dan perlakuan `source=mobile` perlu disepakati di awal fase.
  - *Selesai bila:* `timestamp` 1 jam ke belakang dari `source=mobile` ditolak / diabaikan; ada unit test untuk batas atas & bawah.
- [x] **ATT-6** — `GetMyToday` (baris ~221): ambil shift dari `dayResolver` yang sama dengan clock-in (jadwal tersimpan → pola *fixed* → libur), bukan hanya `scheduleRepo.FindByEmployeeAndDate`.
  - *Selesai bila:* karyawan dengan pola fixed mendapat `shift` di `/me/today` sama dengan `/me/schedule`.

**Dampak ke mobile:** tidak ada perubahan wajib (app sudah punya workaround dan tetap kompatibel). Setelah rilis, app boleh kembali memakai `/me/today` langsung.

---

## Fase 2 — Kalender & Jadwal Karyawan ✅

> **Selesai 26 Nov 2026** (belum di-commit saat ditulis). `/me/schedule` membawa `shift` + `is_holiday`/`holiday_name`; `/leave/me/requests` menerima `date_from`/`date_to`; `GET /core-hr/me/reporting-line` ditambahkan. API docs mobile & kontrak modul sudah diperbarui.

Fokus: kalender jadwal di app benar tanpa banyak panggilan tambahan.

- [x] **ATT-2** — tambah `is_holiday` + `holiday_name` per hari di `GET /attendance/me/schedule`, me-resolve libur dengan urutan yang sama seperti `day_kind` di `/me/today`. (Alternatif: izin baca `self` untuk `GET /attendance/holidays`; opsi pertama lebih disarankan karena menyelesaikan kasus 26 Nov: libur tenant tampil sebagai shift *Normal*.)
- [x] **ATT-3** — sertakan ringkasan shift di `/me/schedule` (`name`, `code`, `color`, `start_time`, `end_time`, `breaks`, `late_tolerance_min`), per hari atau sebagai daftar `shifts` di level respons.
  - ATT-2 dan ATT-3 mengubah endpoint yang sama, jadi sebaiknya satu PR.
- [x] **ATT-7** — filter `date_from` / `date_to` (overlap rentang cuti) di `GET /leave/me/requests`, memakai query yang sama dengan `List` admin (`leaverequest/handler.go:124`).
- [x] **CORE-3 (sisa)** — `GET /core-hr/me/reporting-line` (read-only, `selfOrReadPerm`), memakai resolver yang sama dengan `GET /employees/{id}/reporting-line`. Lalu update status CORE-3 → `Done` dan tulis endpoint yang sudah ada di Catatan BE.

**Dampak ke mobile:** kalender jadwal berhenti memanggil `/attendance/shifts` dan cek cuti hanya menarik rentang yang dibutuhkan.

---

## Fase 3 — Self-service & Perbaikan Kecil ✅

> **Selesai 26 Nov 2026** (belum di-commit saat ditulis). `GET /attendance/me/rules` ditambahkan; validasi format HP/username di `PATCH /auth/me` (+ endpoint admin); confirm avatar key salah → `422`; dokumen `api/approval.md`. APR-2 sudah ada di kode, tinggal uji ke server setelah backfill policy dijalankan.

- [x] **ATT-1** — `GET /attendance/me/rules` (scope `self`), resolusi `GetEffective` dengan cabang karyawan (seperti `/me/geofence` via `SelfEmployeeResolver`), respons `AttendanceRuleResponse`; `200 data: null` bila belum ada aturan. Spesifikasi lengkap di issue.
- [x] **AUTH-1** — validasi `PATCH /auth/me`: HP format E.164, username sesuai aturan yang dipakai saat registrasi / admin.
- [x] **AUTH-2** — `POST /auth/me/avatar/confirm` dengan key tidak valid → `400 INVALID_ARGUMENT`, bukan `500`.
- [x] **APR-1** — tambah contoh respons `GET /approval/inbox` di API docs (sekarang termasuk dokumen `overtime_request` / `attendance_correction`) + seed data contoh.
- [x] **APR-2 (verifikasi kode)** — sudah diimplementasikan di `97b061c`. Sisa: uji ke server setelah backfill `b20261126090000` dijalankan: lembur & koreksi muncul di `/approval/inbox`, mengikuti approval policy, punya timeline. Lalu update status → `Done` dan isi Catatan BE.

**Dampak ke mobile:** pengingat absen pulang & jendela lembur mengikuti setting HR (ATT-1); Pusat Persetujuan cukup membaca inbox, hapus penggabungan manual lembur/koreksi (APR-2).

---

## Fase 4 — Implementasi Hasil Keputusan

> **CORE-1, CORE-2, ATT-8 selesai 26 Nov 2026** (belum di-commit saat ditulis). Sisa Fase 4 menunggu keputusan CORE-4, PLAT-1, PLAT-2.

Diisi setelah Fase 0. Perkiraan bentuk kerja bila disetujui:

- [x] **CORE-1** — perluas `PATCH /core-hr/me/employee` ke semua field `PATCH /core-hr/employees/{id}` **kecuali** field mutasi (`branch_id`, `org_unit_id`, `position_id`) dan usulan pengecualian lain di issue (`manager_id`, `employee_number`, `custom_fields`, `appraisal_records`, `reward_warning_records`). Termasuk `bank_accounts` (sementara, lihat CORE-4).
- [ ] **CORE-4** — *(menunggu keputusan)* `bank_accounts` lewat approval HR atau notifikasi.
- [x] **CORE-2** — `POST /core-hr/me/documents/presign` + `POST /core-hr/me/documents` (body sama dengan route admin).
- [x] **ATT-8** — tolak clock-in dengan error `ON_LEAVE` di `ClockInUseCase.Execute` bila cuti full-day approved (half-day tetap boleh).
- [ ] **PLAT-1** — *(menunggu keputusan)* pengecualian absen saat grace dan/atau job notifikasi H-7 / H-1.
- [ ] **PLAT-2** — *(menunggu keputusan)* opsi *extend trial* (`trial_ends_at` baru, status tetap `trialing`).

---

## Fase 5 — Roadmap Baru (bila disetujui)

- [ ] **PAY-1** — `GET /payroll/me/loans`, `GET /payroll/me/loans/{id}`, opsional `POST /payroll/me/loans` (kasbon via engine approval). Butuh data model pinjaman/cicilan baru, jadi lebih tepat direncanakan di dokumen modul Payroll, bukan di sini.

---

## Catatan

- Saran urutan PR: ~~ATT-5 + ATT-6~~ → ~~ATT-9~~ → ~~ATT-2 + ATT-3~~ → ~~ATT-7~~ → ~~CORE-3~~ → ~~ATT-1~~ → ~~AUTH-1 + AUTH-2~~.
- Tiap PR backend: perbarui dokumen API modulnya (`modules/<modul>/…api-contract.md`) dan [`../api/`](../api/README.md) bila bentuk respons berubah.
- Status "di kode" pada tabel adalah hasil cek cepat; konfirmasi ulang ke server sebelum menandai `Done`.
