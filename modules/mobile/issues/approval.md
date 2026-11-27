<!-- 📁 modules/mobile/issues/approval.md -->
# Issues Backend — Approval

Kekurangan endpoint modul **Approval** di [API docs](../api/README.md) yang ditemukan saat integrasi aplikasi mobile. Tiap issue mengacu ke endpoint yang terdokumentasi dan dicek langsung ke server (akun karyawan `budi@gmail.com`, admin `nurdiansyah@gmail.com`, 11 Nov 2026). Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [APR-1](#apr-1) | Butuh contoh data & bentuk respons inbox approval | P3 | `Done` |
| [APR-2](#apr-2) | Lembur & koreksi absen belum masuk engine approval | P2 | `Done` |
| [APR-3](#apr-3) | Approver tidak punya riwayat keputusannya sendiri | P2 | `Done` |
| [APR-4](#apr-4) | Nama approver di timeline tampil sebagai email | P3 | `Done` |

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

### APR-3
**Approver tidak punya riwayat keputusannya sendiri** · P2 · `Done`

- **Endpoint:** `GET /approval/inbox` hanya berisi step `pending`. Setelah approver menyetujui / menolak, dokumen hilang dari inbox dan tidak ada endpoint untuk melihatnya lagi.
- **Temuan (26 Nov 2026):** di app, atasan menolak lembur Rizky (catatan "hihu"). Setelah itu atasan tidak bisa melihat lagi apa yang sudah ia putuskan. Karyawan masih bisa melihat statusnya (`GET /attendance/me/overtime`, `review_note`) dan timeline per dokumen (`timeline_path`).
- **Dampak:** atasan tidak bisa mengecek ulang / mempertanggungjawabkan keputusannya, dan tidak bisa membuka timeline dokumen yang sudah diputuskan.
- **Sementara di app (26 Nov 2026):** riwayat lokal di HP **sudah dihapus** — riwayat harus dari API. Tab **Riwayat** di Pusat Persetujuan sudah siap memanggil `GET /approval/decided?page=&per_page=20` (envelope standar: `data` list + `pagination.total_pages`, tombol "Muat lagi" per halaman), tiap baris membuka timeline lewat `timeline_path`. Selama endpoint belum ada (404 `RESOURCE_NOT_FOUND`) tab menampilkan "Riwayat segera hadir". Begitu endpoint ini rilis dengan bentuk di bawah, app langsung jalan tanpa update.
- **Usulan:** `GET /approval/decided?page=&per_page=&document_type=` — step yang diputuskan pemanggil (`approved` / `rejected`), dengan bentuk item sama seperti inbox (`request_id`, `document_type`, `document_id`, `subject_name`, `summary`, `timeline_path`) plus `decision`, `note`, `decided_at`, urut terbaru. Data sudah ada di `approval_actions` (`actor_user_id`, `action`, `note`, `created_at`).
- **Catatan BE:** diimplementasikan 26 Nov 2026 sesuai usulan: `GET /approval/decided?page=&per_page=&document_type=` (cukup login, hanya keputusan pemanggil). Item = bentuk inbox (`summary` dari provider yang sama, `timeline_path`) + `decision`, `note`, `decided_at`, urut `decided_at` terbaru. Envelope standar dengan `pagination` (`per_page` default 20, maks 100). Sumber data: `approval_request_steps.decided_by`. Dicek ke DB lokal (read-only): penolakan lembur 26 Nov 08:25 ikut muncul. **Batasan:** hanya keputusan lewat engine approval. Lembur/koreksi di tenant tanpa approval policy diputuskan satu tahap di modul attendance dan tidak tercatat di sini (jalankan backfill policy `b20261126090000`). Lihat [api/approval.md](../api/approval.md) §3.

### APR-4
**Nama approver di timeline tampil sebagai email** · P3 · `Done`

- **Endpoint:** timeline dokumen (`timeline_path`, mis. `GET /attendance/overtime/{id}/approval`, `GET /leave/requests/{id}/approval`) — field `actions[].actor_name`.
- **Temuan (27 Nov 2026, server lokal):** penolakan lembur & cuti Rizky oleh admin PT Nurdiansyah tampil `"actor_name": "nurdiansyah@gmail.com"`. Karyawan yang membuka "Riwayat persetujuan" melihat email atasan, bukan namanya.
- **Penyebab (dibaca dari kode, belum diubah):** akun `nurdiansyah@gmail.com` tidak punya data karyawan di tenant itu (`GET /core-hr/me/employee` → nama kosong), jadi `ResolveAccountName` jatuh ke fallback. Padahal akun itu punya `display_name: "Nurdiansyah Bin"` (`GET /auth/me`), tetapi `/auth/me` sendiri juga mengembalikan `name: "nurdiansyah@gmail.com"`. Kemungkinan resolver nama di timeline (`approval/application/engine/views.go` → `name(...)`) dan `GetMe` tidak memakai `display_name` sebelum email, atau `display_name` belum terbaca dari repo.
- **Dampak:** kecil (tampilan), tetapi terlihat oleh karyawan di setiap keputusan admin tanpa data karyawan.
- **Usulan:** urutan nama: `full_name` karyawan di tenant → `display_name` → `username` → email, sama di `/auth/me` dan `actor_name` timeline / inbox.
- **Catatan BE:** 27 Nov 2026. Dua penyebab:
  1. **Data:** di tenant PT Nurdiansyah akun itu **punya** data karyawan (`EMP-5C269931`) yang `full_name`-nya diisi `nurdiansyah@gmail.com` (dibuat lewat create employee biasa, 10 Nov). Karena nama karyawan menang di semua resolver, `/auth/me`, inbox, dan timeline menampilkan email itu. Perbaiki namanya lewat backoffice (Employees → edit Full name); tidak perlu perubahan kode untuk kasus ini.
  2. **Kode (diperbaiki):** untuk akun **tanpa** data karyawan, nama di inbox/timeline approval (`corehrgateway.UserDisplayName`) melewati `display_name` dan langsung ke username/email. Sekarang urutannya sama dengan `/auth/me`: `full_name` karyawan → `display_name` → `username` → email. `/auth/me` sendiri sudah memakai urutan ini.

