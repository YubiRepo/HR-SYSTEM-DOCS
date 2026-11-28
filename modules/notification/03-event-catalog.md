<!-- 📁 modules/notification/03-event-catalog.md -->
# 03 · Event Catalog

Katalog ada di kode (`internal/modules/notification/application/catalog/events.go`), bukan di database: setiap event baru adalah perubahan kode yang ter-review. `catalog.Validate()` dijalankan saat modul dibangun dan di unit test — entri tidak lengkap menggagalkan startup.

## Struktur entri

| Field | Arti |
|---|---|
| `Key` | `{area}.{kejadian}`, mis. `approval.pending` |
| `Category` | Salah satu kategori (preferensi & filter) |
| `Scope` | `ScopeTenant` (default): disimpan di tenant kejadian; hanya anggota aktif tenant itu yang menerima. `ScopeAccount`: tentang akun/perusahaan user (undangan, password, tagihan) — disimpan tanpa `tenant_id`, tampil di inbox tenant mana pun, tidak difilter membership |
| `Channels` | Channel default; wajib memuat `in_app`. Email/push hanya terkirim bila channel aktif di deployment dan tidak dimatikan user |
| `Mandatory` | `true` = mengabaikan preferensi user; sel preferensi yang hanya berisi event wajib tampil terkunci |
| `Params` | Placeholder yang wajib dikirim pengirim (`Request.Params` atau `Request.Data`); `Notify` menolak bila kurang |
| `DataKeys` | Key `Request.Data` yang diterima event ini; disimpan di `notifications.data` dan ikut di `data` push. Key lain ditolak `Notify` |
| `Text` | Judul & isi per bahasa (`en` wajib, `id`). Placeholder `{nama}` diisi dari params; `{ref_id}` otomatis dari `Ref` |
| `Link` | Path BO, umumnya `/go/*` (diarahkan BO ke portal penerima). Kosong = tidak bisa diklik |

## Aturan channel email

In-app selalu dikirim; push untuk semua event bisnis kecuali yang ditandai. **Email hanya untuk notifikasi yang perlu jadi arsip di kotak masuk user**: keputusan final atas pengajuan (cuti, lembur, payroll run), dokumen/informasi resmi (slip gaji, SPL, kontrak, mutasi), akun/keamanan/tagihan, dan eskalasi. Tanpa email: tugas yang ditindaklanjuti di app (`approval.pending`), info operasional harian (jadwal, absen pulang otomatis, koreksi absen), dan event yang emailnya sudah dikirim modul lain (undangan).

## Parameter teks

Pengirim mengirim nilai netral bahasa; `Render` memformatnya per bahasa penerima:

| Pola key | Nilai | `en` | `id` |
|---|---|---|---|
| `*_date` | `YYYY-MM-DD` | `20 Dec 2026` | `20 Des 2026` |
| `*_month` | `YYYY-MM` | `August 2026` | `Agustus 2026` |
| `document_type` (data) | `leave_request`, … | `{document_type_label}` = "a leave request" | "pengajuan cuti" |

Bahasa penerima = `locale` device yang paling baru aktif (`POST /devices`); tanpa device = `en`. Teks disimpan saat dikirim.

## Event terdaftar

🔔 in-app · 📱 push · ✉ email. Scope **A** = akun.

| Event key | Kategori | Scope | Channel | Wajib | Pengirim (kode) | Params | Data | Link |
|---|---|---|---|---|---|---|---|---|
| `system.test` | system | | 🔔 📱 ✉ | | `POST /notifications/test` (staf platform) | `recipient_name`, `sent_at` | | `/notifications` |
| `approval.pending` | approval | | 🔔 📱 | | approval engine: `Submit`, `Decide` → advanced | `requester_name` | `document_type` | `/go/approvals` |
| `leave.approved` | approval | | 🔔 📱 ✉ | | leave: review final | `leave_type`, `start_date`, `end_date` | | `/go/leave` |
| `leave.rejected` | approval | | 🔔 📱 ✉ | | leave: review ditolak | sama | | `/go/leave` |
| `leave.cancelled_by_hr` | approval | | 🔔 📱 ✉ | | leave: HR membatalkan pengajuan pending | sama | | `/go/leave` |
| `overtime.approved` | approval | | 🔔 📱 ✉ | | attendance: review lembur final | `work_date` | | `/go/attendance` |
| `overtime.rejected` | approval | | 🔔 📱 ✉ | | attendance: review lembur ditolak | `work_date` | | `/go/attendance` |
| `correction.approved` | approval | | 🔔 📱 | | attendance: review koreksi final | `work_date` | | `/go/attendance` |
| `correction.rejected` | approval | | 🔔 📱 | | attendance: review koreksi ditolak | `work_date` | | `/go/attendance` |
| `overtime_order.issued` | attendance | | 🔔 📱 ✉ | | attendance: SPL `issued` (per baris) | `work_date`, `start_time`, `end_time` | | `/go/attendance` |
| `overtime_order.cancelled` | attendance | | 🔔 📱 ✉ | | attendance: SPL issued / barisnya dibatalkan | `work_date` | | `/go/attendance` |
| `attendance.auto_clocked_out` | attendance | | 🔔 📱 | | attendance: sweep auto clock-out (sweep sedang nonaktif) | `work_date`, `clock_out_time` | `date` | `/go/attendance` |
| `schedule.changed` | attendance | | 🔔 📱 | | attendance: assign / generate pola / hapus jadwal, hari ini s/d +14 | `from_date`, `to_date` | `date` | `/go/attendance` |
| `payroll.payslip_published` | payroll | | 🔔 📱 ✉ | ✅ | payroll: run disetujui final (per slip) | `period_month` | | `/go/payslip` |
| `payroll.run_approved` | payroll | | 🔔 📱 ✉ | | payroll: run disetujui final → maker | `period_month`, `branch_name` | | `/go/payroll-run/{ref_id}` |
| `payroll.run_rejected` | payroll | | 🔔 📱 ✉ | | payroll: run ditolak → maker | `period_month`, `branch_name` | | `/go/payroll-run/{ref_id}` |
| `employment.contract_expiring` | employment | | 🔔 📱 ✉ | | core-hr: job harian, ambang H-30 & H-7 | `end_date`, `days_left` | | `/go/employee` |
| `employment.contract_expiring_team` | employment | | 🔔 ✉ | | core-hr: sama, ke `employees:read` cabang | `employee_name`, `end_date`, `days_left` | | `/go/contracts` |
| `employment.assignment_changed` | employment | | 🔔 📱 ✉ | | core-hr: mutasi career path diterapkan (cabang/unit/jabatan) | `effective_date`, `branch_name`, `position_name` | | `/go/employee` |
| `auth.tenant_invitation` | system | A | 🔔 📱 | | auth: undang / kirim ulang undangan (akun sudah ada) | `tenant_name` | | `/go/invitations` |
| `auth.password_changed` | system | A | 🔔 ✉ | ✅ | auth: ganti / reset / reset admin | `changed_at` | | — |
| `system.subscription_ending` | system | A | 🔔 📱 ✉ | ✅ | platform: trial berakhir ≤ 3 hari (job renewal) | `tenant_name`, `end_date`, `days_left` | | `/go/billing` |
| `billing.invoice_issued` | system | A | 🔔 ✉ | ✅ | platform: tagihan terbit | `tenant_name`, `start_date`, `end_date`, `due_date` | | `/go/billing` |
| `billing.payment_approved` | system | A | 🔔 📱 ✉ | ✅ | platform: pembayaran manual disetujui | `tenant_name`, `due_date` | | `/go/billing` |
| `billing.payment_rejected` | system | A | 🔔 📱 ✉ | ✅ | platform: pembayaran manual ditolak | `tenant_name`, `due_date` | | `/go/billing` |
| `billing.tenant_suspended` | system | A | 🔔 📱 ✉ | ✅ | platform: dunning menangguhkan tenant | `tenant_name` | | `/go/billing` |

Penerima, `ref_type`/`ref_id`, dan perilaku di app mobile: [issues NOTIF-1 & NOTIF-3](../mobile/issues/notification.md). Event billing dikirim ke pemegang `billing:read`; `employment.contract_expiring_team` ke pemegang `employees:read` di cabang karyawan.

**Belum ada (opsional):** `approval.reminder`, `approval.cancelled`, `employment.document_expiring`, `employment.mutation_failed`, `attendance.missed_clock_in`, `system.announcement`; `schedule.changed` saat pola kerja diganti lewat mutasi.

## Menambah event baru

1. Tambah entri di `events.go` (key, kategori, scope, channel, params, data keys, teks `en` + `id`, link `/go/*`). Bila link-nya area baru, tambah juga di BO `app/pages/go/[...target].client.vue`.
2. Di modul pengirim pakai `notify.Notifier` (`internal/shared/notify`) — modul menerima `notify.Deferred` lewat `SetNotifier` di `cmd/api` & `cmd/worker`. Jangan impor paket notification.
3. Panggil `Notify` **di dalam** transaksi bisnis, dengan `DedupeKey` stabil (mis. `leave.approved:<leave_id>`) dan `ActorUserID` bila ada pelaku. Penerima adalah **user**: petakan karyawan lewat `corehr.Contract.UserIDsByEmployeeIDs`; karyawan tanpa akun dilewati.
4. Isi push/email tidak boleh memuat data sensitif (nominal gaji, alasan medis, catatan approver) — cukup judul dan ajakan membuka aplikasi.
5. Tambah unit test pemanggilan di modul pengirim (`notify.Notifier` palsu).
