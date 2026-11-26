<!-- 📁 modules/mobile/issues/approval.md -->
# Issues Backend — Approval

Kekurangan endpoint modul **Approval** di [API docs](../api/README.md) yang ditemukan saat integrasi aplikasi mobile. Tiap issue mengacu ke endpoint yang terdokumentasi dan dicek langsung ke server (akun karyawan `budi@gmail.com`, admin `nurdiansyah@gmail.com`, 11 Nov 2026). Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [APR-1](#apr-1) | Butuh contoh data & bentuk respons inbox approval | P3 | `Done` |
| [APR-2](#apr-2) | Lembur & koreksi absen belum masuk engine approval | P2 | `Done` |

---

### APR-1
**Butuh contoh data & bentuk respons inbox approval** · P3 · `Done`

- **Endpoint:** `GET /approval/inbox` (List My Approval Inbox) → `data: []` untuk admin; dokumen belum mencantumkan contoh respons.
- **Kebutuhan:** app ingin memakai inbox ini menggantikan `GET /leave/requests?status=pending`. Mohon contoh respons item inbox (jenis dokumen, id, pengaju, step, aksi) dan seed data contoh.
- **Dicek ke kode (16 Nov 2026, `1adf0b7`):** bentuk respons sudah jelas dari `approval/application/engine/views.go` (`InboxItem` + `DocumentSummary`): `request_id`, `document_type`, `document_type_label`, `subject_name`, `submitted_by_name`, `step_order`, `assigned`, `summary{title, subtitle, fields[], link_url, approve_path, reject_path, timeline_path}`. App sudah memakainya di **Pusat Persetujuan**.
- **Sisa permintaan:** contoh respons di API docs + seed data (belum dicek ulang ke server).
- **Catatan kecil:** `summary.fields[].label` dikirim dalam bahasa Inggris (`Leave type`, `Net pay`, …); app menerjemahkan label yang dikenal. `link_url` payroll berisi route backoffice (`/tenants/salary/runs/…`), bukan URL file — app tidak menampilkannya.
- **Catatan BE:** 26 Nov 2026 (Fase 3): dokumen baru [api/approval.md](../api/approval.md) berisi contoh item inbox untuk keempat document type (`leave_request`, `overtime_request`, `attendance_correction`, `payroll_run`) sesuai summarizer di kode, plus detail approver & timeline. Seed data contoh **tidak** dibuat: item inbox lahir dari dokumen nyata yang diajukan (cuti/lembur/koreksi) di tenant ber-policy, jadi cukup ajukan satu dokumen dengan akun karyawan untuk mengisi inbox atasan.

### APR-2
**Lembur & koreksi absen belum masuk engine approval** · P2 · `Done`

- **Konteks:** docs Approval (`modules/approval/README.md`) menyebut consumer berikutnya setelah Leave: lembur, koreksi absensi, mutasi, payroll run. Di kode (`1adf0b7`, 16 Nov 2026) yang terdaftar ke engine (`RegisterSummarizer`) baru `leave_request` dan `payroll_run`.
- **Temuan:** pengajuan lembur (`POST /attendance/overtime/{id}/approve|reject`) dan koreksi absen (`POST /attendance/corrections/{id}/approve|reject`) masih disetujui langsung di modul Attendance.
- **Dampak:** dua dokumen ini tidak muncul di `GET /approval/inbox`, hanya satu tahap (tidak bisa atasan → HR), tidak punya timeline persetujuan seperti cuti, dan tidak mengikuti approval policy.
- **Usulan:** daftarkan `overtime_request` dan `attendance_correction` ke engine approval (summarizer + approve/reject path), seperti Leave.
- **Sementara di app:** **Pusat Persetujuan** menggabungkan `/approval/inbox` dengan `GET /attendance/overtime?status=pending` dan `GET /attendance/corrections?status=pending` dalam satu daftar. Setelah issue ini selesai, app cukup membaca inbox; tampilan kartu sudah generik.
- **Dicek ulang 26 Nov 2026 (`a51daf4`):** engine masih hanya `leave_request` dan `payroll_run`.
- **Catatan BE:** sudah di kode sejak `97b061c` (26 Nov 2026): `overtime_request` dan `attendance_correction` terdaftar ke engine (`attendance/module.go` `RegisterDocument`), dengan summary, detail approver, timeline (`/attendance/overtime/{id}/approval`, `/attendance/corrections/{id}/approval`), dan approve/reject multi-step. **Syarat:** tenant harus punya approval policy untuk jenis dokumen itu; tanpa policy tetap satu tahap via `attendance:approve` dan tidak muncul di inbox. Policy default dibuat saat provisioning dan lewat backfill `b20261126090000_seed_hr_setting_defaults_for_tenant` (perlu dijalankan untuk tenant lama). Ajuan yang dibuat sebelum policy ada tetap di jalur lama, jadi app sebaiknya tetap menggabungkan daftar `?status=pending` sampai ajuan lama habis. Belum diuji langsung ke server.
