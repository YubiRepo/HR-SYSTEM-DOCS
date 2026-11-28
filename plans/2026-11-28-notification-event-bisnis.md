<!-- 📁 plans/2026-11-28-notification-event-bisnis.md -->
# Rencana: Event Bisnis Notification

| | |
|---|---|
| **Status** | **Kode & dokumen selesai** (Bagian A–D, 2026-11-28). Belum: jalankan migrasi `20261128000004_notification_device_locale`, typecheck/lint BO di container, dan uji E2E skenario #13–25 di [05-operations](../modules/notification/05-operations.md). |
| **Tanggal** | 2026-11-28 |
| **Pemicu** | Modul notification sudah jadi ([plan arsitektur](./2026-11-27-modul-notification.md)), tetapi katalog baru berisi `system.test`. Mobile membutuhkan event bisnis, kontrak `data` push, bahasa, dan lifecycle device ([issues NOTIF-1…4](../modules/mobile/issues/notification.md)). |
| **Cakupan** | Event prioritas rilis #1–15 dan tambahan #16–23 dari NOTIF-1, penyesuaian inti notification (NOTIF-2, 3, 4), integrasi di modul pengirim, link BO, dan dokumen. |
| **Sumber spesifikasi** | [modules/mobile/issues/notification.md](../modules/mobile/issues/notification.md): daftar event, channel per event, aturan email, kontrak `data`, perilaku device. |
| **Modul terdampak** | HR-API: `notification`, `approval`, `leave`, `attendance`, `payroll`, `core-hr`, `auth`, `platform`, wiring `cmd/api` & `cmd/worker`. HR-BO: link notifikasi, inbox, registrasi device web. Docs: modul notification & mobile. |

### Repo & tag

| Tag | Peran | Path repo |
|---|---|---|
| `[HR-API]` | Target | `/home/yubi/Data/projects/easy-hr/HR-SYSTEM-API` |
| `[HR-BO]` | Target | `/home/yubi/Data/projects/easy-hr/HR-SYSTEM-BACKOFFICE` |
| `[DOCS]` | Target | `/home/yubi/Data/projects/easy-hr/HR-SYSTEM-DOCS` |

Path file di fase ditulis relatif terhadap root repo tag-nya.

**Aturan kerja:**
- Commit hanya bila diminta.
- Migrasi ditulis, tetapi dijalankan oleh user.
- Jalankan `graphify update .` setelah mengubah kode.
- Teks UI dalam bahasa Inggris.
- Env baru masuk section fitur di bagian bawah `.env.example`.

---

## 1. Kondisi saat ini

### 1.1 Inti notification `[HR-API]`

| Bagian | Kondisi | Dampak ke plan ini |
|---|---|---|
| Katalog | Hanya `system.test`. `Channels` per event sudah menentukan email/push | Pemilahan email cukup lewat `Channels` di tiap entri |
| `Request` | `TenantID`, `EventKey`, `Recipients{UserIDs, Permission{Key, BranchID}}`, `Params`, `Ref`, `DedupeKey`, `ActorUserID` | Belum ada `Data` (field tambahan push/inbox) |
| Dispatch | Selalu render `catalog.DefaultLang` (`en`). `notifications.data` diisi `Params`. Tanpa `TenantID`, filter membership dilewati | Bahasa belum per penerima. Notifikasi tingkat akun bisa memakai `TenantID = nil` |
| Inbox | Sesi tenant: `tenant_id = <tenant>`. Sesi platform: `tenant_id IS NULL` | Notifikasi akun (`tenant_id` kosong) tidak terlihat di sesi tenant |
| Push | `data` berisi 7 key dasar. Android `priority: high`, APNs `sound`, webpush `Urgency` | Belum ada `channel_id`, `badge`, field tambahan |
| Device | Upsert per `token`, tanpa `locale`. Tidak ada list/hapus-semua dan tidak ada purge device | NOTIF-4 |
| `ref_id` | Kolom UUID | Event berbasis tanggal memakai `data.date` |

### 1.2 Titik pemicu di modul pengirim `[HR-API]`

| Modul | Pemicu | Lokasi | Transaksi | Catatan |
|---|---|---|---|---|
| approval | `Submit`, `Decide` (`advanced` / `final_approved` / `rejected`), `Cancel` | `approval/application/engine/engine.go` | Transaksi pemanggil | Engine pasif. Modul pemilik men-switch outcome sendiri. Approver step disimpan di `ApproverUserID` (nil = pemegang `ApprovePermission`) |
| leave | Review, Cancel (HR vs pengaju via `callerIsAdmin`) | `leave/application/leaverequest/command/{review,cancel}_leave_request.go` | `apputil.RunInTx` | Batal setelah disetujui tidak ada (non-goal v1) |
| attendance | Review lembur, Cancel lembur | `attendance/application/overtimerequest/command/review_overtime_request.go` | `inTx` | |
| attendance | SPL `Issue`, `Cancel`, `CancelLine` | `attendance/application/overtimeorder/command/commands.go` | `WithTx` | Penerima = karyawan di baris aktif |
| attendance | Review koreksi | `attendance/application/attendancerecord/command/review_correction.go` | `inTx` | Tidak ada fitur batal |
| attendance | Sweep auto clock-out | `attendance/application/attendancerecord/command/auto_clock_out.go` | Tidak | Sweep sedang dinonaktifkan (`attendance/module.go`, `interfaces/mq/handler.go`) |
| attendance | Assign / generate / hapus jadwal | `attendance/application/schedule/command/{assign,generate,delete}_schedule(s).go` | Tidak | Bulk per karyawan × hari |
| payroll | Final approve, reject run | `payroll/application/payrollrun/command/approve_run.go` | `inTx` | Slip terlihat sejak run `approved` (`payslip/query/self_service.go`) |
| core-hr | Job kontrak berakhir | `core-hr/application/employee/command/send_contract_expiry_reminders.go` | Tidak | Port `NotificationSender` masih `Noop`. Tanpa dedupe, sehingga akan terkirim tiap hari |
| core-hr | Mutasi diterapkan (langsung & terjadwal), ganti pola kerja | `review_mutation_request.go`, `apply_scheduled_mutation_requests.go`, `careerpath/applier.go` | `applier.InTx` | |
| auth | Undang / kirim ulang undangan, ganti password (3 jalur), nonaktif / suspend | `auth/application/user/command/{register,member_admin,change_password,reset_password,admin_reset_password,admin_set_status}.go` | Tidak ada transaksi di auth | Email undangan sudah dikirim auth |
| platform | Terbit invoice, review pembayaran manual, dunning suspend | `platform/application/{entitlement,billing}/command/*` | Sebagian | Reminder langganan berakhir belum ada |

Lookup karyawan → user: kolom `employees.user_id` (nullable) diekspos sebagai `corehr.Contract.FindEmployeeRef`. Belum ada versi batch, dan gateway corehr di leave, attendance, dan payroll baru punya arah user → karyawan.

---

## 2. Penyesuaian inti notification `[HR-API]`

### 2.1 `Request.Data`, field tambahan untuk app

```go
type Request struct {
    // ... field yang ada ...
    // Data: field tambahan yang disimpan di notifications.data dan disalin
    // ke data push (mis. document_type, date). Semua string. Params tetap
    // hanya untuk teks dan tidak dikirim ke app.
    Data map[string]string
}
```

- Key `Data` divalidasi terhadap daftar yang diizinkan per event di katalog (`Event.DataKeys`). Key yang tidak dikenal menghasilkan error saat `Notify`, supaya data sensitif tidak ikut tanpa sengaja.
- `notifications.data` berisi `Data`, bukan `Params` lagi. Data lama tidak perlu dimigrasi.

### 2.2 Notifikasi tingkat akun

- Field baru di katalog: `Event.Scope = ScopeTenant | ScopeAccount`. Event akun (`auth.*`, `billing.*`, `system.subscription_ending`) selalu disimpan dengan `tenant_id = NULL`.
  - `TenantID` dari pengirim tetap dipakai untuk me-resolve penerima `Permission`, tetapi tidak disimpan dan tidak dikirim sebagai `data.tenant_id` (app tidak perlu ganti tenant untuk membukanya).
  - Filter membership dilewati, supaya undangan ke tenant lain tetap sampai.
- Inbox, unread count, dan read-all di sesi tenant: `tenant_id = $tenant OR tenant_id IS NULL`. Sesi platform tidak berubah.
- Hub realtime meneruskan notifikasi `tenant_id` kosong ke koneksi tenant mana pun milik user itu.

### 2.3 Bahasa (NOTIF-2)

- Migrasi: `notification_devices.locale VARCHAR(5) NULL`. `POST /devices` menerima `locale` (`id` / `en`).
- Bahasa penerima = `locale` device aktif yang paling baru `last_seen_at`. User tanpa device memakai `en`.
- Dispatch merender teks per penerima (bukan sekali untuk semua). Teks yang tersimpan di inbox dipakai juga oleh email dan push.
- **Penyederhanaan dari spesifikasi:** push memakai bahasa user, bukan bahasa per device. Selama device user berbahasa sama, hasilnya identik. Perbedaan ini dicatat di NOTIF-2.
- BO mengirim `locale` saat mendaftarkan device `web`, diambil dari bahasa browser dan dibatasi ke `id` / `en`.

### 2.4 Payload push (NOTIF-3)

- `data` push = 7 key dasar + isi `Request.Data`.
- Android: `notification.channel_id = "hr_app_default_channel"`.
- APNs: `aps.badge` = unread count user di tenant notifikasi (dihitung saat kirim).

### 2.5 Lifecycle device (NOTIF-4)

| Perubahan | Rincian |
|---|---|
| Rotasi token | Bila `device_id` diisi dan sudah ada baris `(user_id, device_id)`, token di baris itu diganti dan tidak membuat baris baru. Indeks baru `(user_id, device_id)` |
| `GET /notifications/devices` | Daftar device aktif milik user |
| `DELETE /notifications/devices` | Hapus semua device milik user |
| Cabut device | `Contract.RevokeDevices(ctx, userID)` dipanggil auth saat password diganti dan saat akun dinonaktifkan / suspend semua |
| Purge | Job retensi harian juga menghapus device yang tidak aktif > 60 hari atau `active = false` |

### 2.6 Lookup karyawan → user `[HR-API]` core-hr

`corehr.Contract.UserIDsByEmployeeIDs(ctx, tenantID, employeeIDs) (map[string]string, error)` berupa satu query batch. Gateway corehr di leave, attendance, dan payroll menambah method port yang memakainya. Karyawan tanpa `user_id` dilewati, tanpa fallback email.

### 2.7 Pola pemanggilan di modul pengirim

- **Paket bersama `internal/shared/notify`** (tanpa dependensi) berisi `Request`, `Recipients`, `Ref`, interface `Notifier`, dan `Deferred`. Semua modul pengirim hanya bergantung ke paket ini, tidak ke modul notification. Alasannya: modul notification mengimpor `auth`, jadi auth tidak bisa mengimpor notification (siklus). Paket ini menggantikan rencana awal "port kecil per modul + adaptor".
- **`notify.Deferred`.** Semua modul dibangun sebelum modul notification. Karena itu `cmd/api` dan `cmd/worker` membuat satu `notify.NewDeferred()` di awal, lalu memanggil `notifier.Set(notificationModule)` setelah modul notification jadi. Modul pengirim menerima `notifier` di Fase 5–11 saat pemanggilannya ditambahkan. Sebelum di-`Set` (dan di test/tool), `Notify` = no-op.
- `Notify` dipanggil di dalam transaksi bisnis bila ada. Pemicu tanpa transaksi memanggilnya setelah simpan berhasil.
- Pencabutan device untuk auth memakai `notification.Contract.RevokeDevices`, dipasang lewat setter di wiring (Fase 10).

### 2.8 Link backoffice

Penerima yang sama bisa membuka BO dari portal berbeda: admin di `/tenants/*`, karyawan di `/ess/*`. Karena itu link katalog memakai **path netral** yang di-redirect BO sesuai persona, dengan pola yang sama seperti `/notifications/settings`:

| Path netral | Tujuan |
|---|---|
| `/go/approvals` | `/ess/approvals` (tier karyawan) atau `/tenants/approvals` |
| `/go/leave`, `/go/attendance`, `/go/payslip`, `/go/employee` | `/ess/leave`, `/ess/attendance`, `/ess/payslip`, `/ess/employee` |
| `/go/contracts` | `/tenants/employee/contracts` |
| `/go/payroll-run/{id}` | `/tenants/payroll/runs/{id}` |
| `/go/billing` | `/tenants/settings/billing` |
| `/go/invitations` | Muat ulang daftar organisasi, kembali ke beranda persona, toast "buka pemilih organisasi" (undangan diterima dari TeamsMenu) |
| lainnya | `/notifications` |

Diimplementasikan di `app/pages/go/[...target].client.vue` (client-only). Klik push browser selalu lewat `/go/...?n=<notification_id>&t=<tenant_id>` (`public/sw.js`): bila `t` organisasi lain tempat user masih anggota aktif, BO pindah organisasi lalu memuat ulang langsung ke URL itu (tanpa `t`; `switchTenant(tenantId, path)`), kemudian menandai `n` terbaca di sesi yang benar dan membuka tujuan. Organisasi yang tidak bisa dibuka lagi → peringatan, dibuka di organisasi aktif. Link selain `/go/*` (inbox) menjadi `/go/inbox`. Link yang dibuka saat belum login (dari email/push) diteruskan lewat `/auth/login?redirect=` dan dibuka setelah login; hanya `/go/*` dan `/notifications` yang diterima (`app/utils/loginRedirect.ts`).

---

## 3. Katalog event

Sumber kebenarannya [NOTIF-1](../modules/mobile/issues/notification.md#notif-1). Ringkasan untuk implementasi (🔔 in-app · 📱 push · ✉ email):

| # | Event key | Scope | Channel | Wajib | Pengirim | `DedupeKey` | `Data` |
|---|---|---|---|---|---|---|---|
| 1 | `approval.pending` | tenant | 🔔 📱 | | approval engine | `approval.pending:<request_id>:<step>` | `document_type` |
| 2–3 | `leave.approved` / `leave.rejected` | tenant | 🔔 📱 ✉ | | leave | `<event>:<leave_id>` | |
| 4–5 | `overtime.approved` / `overtime.rejected` | tenant | 🔔 📱 ✉ | | attendance | `<event>:<overtime_id>` | |
| 6–7 | `correction.approved` / `correction.rejected` | tenant | 🔔 📱 | | attendance | `<event>:<correction_id>` | |
| 8 | `payroll.payslip_published` | tenant | 🔔 📱 ✉ | ✅ | payroll | `payroll.payslip_published:<payslip_id>` | |
| 9 | `overtime_order.issued` | tenant | 🔔 📱 ✉ | | attendance | `overtime_order.issued:<order_id>` | |
| 10 | `attendance.auto_clocked_out` | tenant | 🔔 📱 | | attendance | `attendance.auto_clocked_out:<record_id>` | `date` |
| 11 | `employment.contract_expiring` | tenant | 🔔 📱 ✉ | | core-hr | `employment.contract_expiring:<contract_id>:<end_date>:<30\|7>` | |
| 11b | `employment.contract_expiring_team` | tenant | 🔔 ✉ | | core-hr | sama + `:team` | |
| 12 | `employment.assignment_changed` | tenant | 🔔 📱 ✉ | | core-hr | `employment.assignment_changed:<mutation_request_id>` | |
| 13 | `schedule.changed` | tenant | 🔔 📱 | | attendance, core-hr | `schedule.changed:<employee_id>:<aksi_id>` | `date` |
| 14 | `auth.tenant_invitation` | akun | 🔔 📱 | | auth | `auth.tenant_invitation:<tenant_id>:<invited_at>` | |
| 15 | `system.subscription_ending` | akun | 🔔 📱 ✉ | ✅ | platform | `system.subscription_ending:<subscription_id>:<period_end>` | |
| 16–17 | `payroll.run_approved` / `payroll.run_rejected` | tenant | 🔔 📱 ✉ | | payroll | `<event>:<run_id>:<decided_at>` | |
| 18 | `overtime_order.cancelled` | tenant | 🔔 📱 ✉ | | attendance | `overtime_order.cancelled:<order_id>:<employee_id>` | |
| 19 | `leave.cancelled_by_hr` | tenant | 🔔 📱 ✉ | | leave | `leave.cancelled_by_hr:<leave_id>` | |
| 20 | `auth.password_changed` | akun | 🔔 ✉ | ✅ | auth | `auth.password_changed:<user_id>:<changed_at>` | |
| 21 | `billing.invoice_issued` | akun | 🔔 ✉ | ✅ | platform | `billing.invoice_issued:<invoice_id>` | |
| 22 | `billing.payment_approved` / `billing.payment_rejected` | akun | 🔔 📱 ✉ | ✅ | platform | `<event>:<payment_id>` | |
| 23 | `billing.tenant_suspended` | akun | 🔔 📱 ✉ | ✅ | platform | `billing.tenant_suspended:<subscription_id>:<suspended_at>` | |

**Penyesuaian terhadap NOTIF-1:**
- Event #11 dipecah menjadi dua key, karena teks untuk karyawan ("Kontrak Anda…") berbeda dengan teks untuk HR ("Kontrak Sari…"), dan katalog hanya punya satu teks per event. HR tidak menerima push untuk event ini.
- Event #22 dipecah menjadi `billing.payment_approved` dan `billing.payment_rejected` dengan alasan yang sama.

**Parameter teks.** Pengirim mengirim nilai netral bahasa: key berakhiran `_date` (`YYYY-MM-DD`) dan `_month` (`YYYY-MM`) diformat per bahasa penerima ("20 Des 2026", "Agustus 2026"), dan `document_type` otomatis menjadi `{document_type_label}`. Parameter yang dideklarasikan event wajib ada, dan key `Data` di luar `DataKeys` ditolak oleh `Notify`.

Kategori tetap lima (`approval`, `employment`, `payroll`, `attendance`, `system`). Event billing masuk `system`. Semuanya wajib, jadi sel preferensi email `system` akan tampil terkunci hanya bila semua event email di kategori itu wajib. `system.test` tetap tidak wajib, sehingga sel itu tetap bisa diatur.

---

## 4. Hal yang perlu diperhatikan

1. **Data sensitif.** Judul, isi, dan email tidak memuat nominal gaji, alasan cuti sakit, atau catatan approver. Notifikasi hanya mengajak user membuka app.
2. **Aktor dikecualikan.** `ActorUserID` selalu diisi untuk pemicu oleh user. Cuti atau lembur yang disetujui otomatis saat submit tidak menghasilkan notifikasi ke pengaju.
3. **Tanpa transaksi = tidak atomik.** Berlaku untuk auth, perubahan jadwal, sweep auto clock-out, dunning, review pembayaran, dan mutasi yang ditolak/dijadwalkan. `Notify` dipanggil setelah simpan berhasil. Bila `Notify` gagal, errornya dicatat di log saja dan aksi bisnis tidak digagalkan.
4. **Volume jadwal.** Satu aksi assign/generate bisa menyentuh ratusan karyawan × hari. Kirim satu `Notify` per karyawan per aksi, hanya bila ada tanggal yang berubah dalam rentang hari ini s/d +14 hari (zona waktu tenant). Generate pola untuk tanggal lebih jauh tidak memicu notifikasi.
5. **Slip gaji.** Penerima dihitung dari slip pada run itu lewat lookup batch. Run yang disetujui ulang setelah ditolak tidak mengirim ulang, karena dedupe per slip.
6. **Kontrak berakhir.** Job harian mengirim bila sisa hari ≤ 30 dan > 7 (ambang 30), atau ≤ 7 (ambang 7). Dedupe per ambang mencegah pengiriman harian. Kontrak yang diperpanjang (`end_date` berubah) mendapat dedupe baru.
7. **Integrasi Jewelry.** Pada branch `jewerly-integration`, penerima `Permission` dibaca dari proyeksi Jewelry (port `Directory` notification), jadi tidak ada perubahan di plan ini.

---

## 5. Fase pengerjaan

### Bagian A — Inti notification `[HR-API]`

#### Fase 1 — `Request.Data`, scope akun, payload push
- `Request.Data` + `Event.DataKeys` + validasi (§2.1). `notifications.data` diisi `Data`.
- `Event.Scope` (§2.2): dispatch, query inbox / unread / read-all, dan filter hub realtime.
- FCM: `channel_id`, `badge`, data tambahan (§2.4).
- Test: validasi key `Data`, inbox tenant menampilkan notifikasi akun, event akun tidak difilter membership.

#### Fase 2 — Bahasa & lifecycle device
- Migrasi `notification_devices.locale` + indeks `(user_id, device_id)`.
- `POST /devices` menerima `locale`. Rotasi token per `device_id`. `GET /devices`, `DELETE /devices`.
- Dispatch merender per bahasa penerima (§2.3).
- `Contract.RevokeDevices`, dan job retensi ikut membersihkan device (§2.5).
- Test: rotasi token, render `id`/`en`, purge device.

#### Fase 3 — Katalog
- Entri §3 (teks `en` + `id`, link netral §2.8, `DataKeys`, `Scope`, `Mandatory`).
- `catalog_test`: semua event lengkap, placeholder teks terisi oleh param yang didokumentasikan.

#### Fase 4 — Lookup & port pengirim
- `corehr.Contract.UserIDsByEmployeeIDs` (§2.6).
- Paket `internal/shared/notify` + `notify.Deferred` di `cmd/api` & `cmd/worker` (§2.7).

### Bagian B — Integrasi modul `[HR-API]`

#### Fase 5 — Approval engine
- `approval.pending` setelah `Submit` dan setelah `Decide` → `advanced`. Penerima `ApproverUserID` step aktif, atau bila nil `Permission{ApprovePermission tipe, cabang subjek}`. Param `requester_name`, `document_label`. `Data.document_type`.
- Test: step dengan approver tetap, step permission, aktor dikecualikan, `final_approved` langsung tanpa pending.

#### Fase 6 — Leave
- `leave.approved` / `leave.rejected` di switch review. `leave.cancelled_by_hr` di cancel bila `callerIsAdmin`.
- Param tanggal cuti (format pendek sesuai bahasa) dan nama jenis cuti.

#### Fase 7 — Attendance
- Lembur `approved` / `rejected`. Koreksi `approved` / `rejected`.
- SPL `issued` (semua baris aktif), `cancelled` (`Cancel` = semua baris, `CancelLine` = karyawan itu).
- `schedule.changed` di assign / generate / hapus (§4 butir 4).
- `attendance.auto_clocked_out` di sweep: kode disiapkan, aktif bersama sweep.

#### Fase 8 — Payroll
- Final approve: `payroll.payslip_published` (semua pemilik slip, lookup batch) + `payroll.run_approved` ke maker.
- Reject: `payroll.run_rejected` ke maker.

#### Fase 9 — Core HR
- Ganti `NoopNotificationSender` kontrak dengan notifier (dua event, ambang 30/7). Hapus port email lama bila tidak dipakai lagi.
- `employment.assignment_changed` saat mutasi diterapkan (langsung & job terjadwal).
- `schedule.changed` saat pola kerja diganti lewat applier.

#### Fase 10 — Auth
- `auth.tenant_invitation` saat undang / kirim ulang (hanya untuk akun yang sudah ada).
- `auth.password_changed` di ganti sendiri, reset token, dan reset admin, lalu `RevokeDevices`.
- `RevokeDevices` saat user dinonaktifkan platform / `SuspendAll`.

#### Fase 11 — Platform billing
- Job harian baru `entitlement.subscription.ending_check`: trial/langganan dengan `period_end` ≤ 3 hari, sekali per periode. Penerima `billing:read`.
- `billing.invoice_issued` di `IssueInvoiceUseCase`. `billing.payment_reviewed` di review pembayaran manual. `billing.tenant_suspended` di dunning.

### Catatan pelaksanaan Bagian B (2026-11-28)

- **Wiring.** Setiap modul pengirim punya `notify.Deferred` sendiri dan method `SetNotifier`. `cmd/api` dan `cmd/worker` memanggilnya setelah modul notification dibangun. Auth memakai `SetNotifications(notifier, notificationModule)` (notifier + pencabut device).
- **approval.pending** dikirim dari engine approval (satu tempat untuk cuti, lembur, koreksi, payroll). Step tanpa approver → pemegang permission approve di cabang subjek; dokumen tanpa subjek (payroll run) → pemegang tingkat tenant.
- **Attendance**: helper `application/notifyport` (lookup karyawan → user, jam lokal cabang, agregasi perubahan jadwal). `schedule.changed` dari generate pola hanya untuk hari yang shift-nya benar-benar berubah. Pemicu jadwal dan SPL tidak punya data aktor, jadi tanpa `ActorUserID`.
- **Core-hr**: port email kontrak `Noop` diganti `infrastructure/employee/notification.Sender`. `employment.assignment_changed` hanya untuk mutasi career path yang mengubah cabang/unit/jabatan (bukan status saja, offboarding, pola kerja, atau kompensasi). **`schedule.changed` saat pola kerja diganti lewat mutasi tidak dikerjakan** — menyusul bila dibutuhkan.
- **Auth**: ganti password (sendiri, reset token, reset admin) dan nonaktif akun oleh platform kini berjalan dalam **satu transaksi** (`database.Transactor` baru di auth) bersama notifikasinya dan pencabutan semua device; bila outbox gagal ditulis, perubahan ikut batal. Audit tetap di luar transaksi (log saja). `auth.password_changed` selalu dikirim ke pemilik akun (tanpa pengecualian aktor, karena pemberitahuan keamanan). `auth.tenant_invitation` tetap setelah simpan, kegagalannya hanya di-log.
- **Billing — atomik**: review pembayaran manual (update pembayaran + invoice + notifikasi) dan suspend oleh dunning (suspend tenant + notifikasi, per invoice) berjalan dalam satu transaksi. Tagihan terbit dan peringatan trial tetap best-effort (log). Perubahan jadwal dan absen pulang otomatis juga tetap best-effort.
- **Billing**: invoice tidak punya nomor, jadi teks memakai periode dan jatuh tempo (`start_date`, `end_date`, `due_date`). Penerima semua event billing = pemegang `billing:read` (entity pembayaran tidak menyimpan pengunggah). `system.subscription_ending` hanya untuk **trial** yang berakhir ≤ 3 hari, dijalankan di job `entitlement.subscription.renewal_check` setelah proses trial berakhir; langganan berbayar diperpanjang otomatis dengan tagihan.

### Bagian C — Backoffice `[HR-BO]`

#### Fase 12 — Link & inbox ✅
- Halaman redirect `/go/*` (§2.8) sesuai persona, plus `?redirect=` setelah login untuk link notifikasi.
- Inbox & bell: notifikasi akun (`tenant_id` null) diberi penanda "Your account"; klik tidak mengganti tenant.

#### Fase 13 — Device web ✅
- `useWebPush` mengirim `locale` (bahasa browser: `id` bila salah satu bahasa browser Indonesia, selain itu `en`) dan memakai `device_id` per browser yang sudah ada (rotasi token tidak menambah baris).

### Bagian D — Dokumen & uji

#### Fase 14 — Dokumen `[DOCS]` ✅
- `modules/notification/03-event-catalog.md`: daftar event lengkap.
- `02-data-model.md`: kolom `locale`, arti `data`, scope akun.
- `04-api-contract.md`: endpoint device baru, field `locale`.
- `modules/mobile/api/notification.md`: data tambahan, `locale`, endpoint device.
- `modules/mobile/issues/notification.md`: status NOTIF-1…4 → `Done` dan isi Catatan BE, termasuk penyederhanaan bahasa push per user (§2.3).

#### Fase 15 — Uji (unit test ✅; E2E menunggu migrasi — skenario disalin ke [05-operations](../modules/notification/05-operations.md) #13–25)
- Unit test per modul pengirim: event, penerima, aktor, dedupe.
- E2E (pakai `.env` dev, SMTP Mailtrap, satu device Android + browser):

| # | Skenario | Hasil |
|---|---|---|
| 1 | Karyawan mengajukan cuti dengan 2 step | Approver step 1 dapat push + in-app, tanpa email. Setelah step 1 setuju, approver step 2 dapat notifikasi |
| 2 | Cuti disetujui final / ditolak | Pengaju dapat in-app + push + email |
| 3 | Koreksi absen disetujui | In-app + push, tanpa email |
| 4 | Payroll run disetujui | Semua pemilik slip dapat notifikasi wajib (email tetap terkirim walau preferensi email payroll dimatikan). Maker dapat `run_approved` |
| 5 | HR assign jadwal 30 hari untuk 10 karyawan | Satu notifikasi per karyawan |
| 6 | Undangan ke tenant lain | Tampil di inbox tenant aktif mana pun. Tidak ada email kedua (email undangan dari auth tetap ada) |
| 7 | Ganti password | Email + in-app. Semua device user terhapus |
| 8 | Device `locale = id` | Teks inbox, email, dan push dalam bahasa Indonesia |
| 9 | Token FCM dirotasi dengan `device_id` sama | Satu baris device, token baru |
| 10 | Job kontrak berjalan 3 hari berturut-turut di rentang ambang 30 | Hanya satu notifikasi |

---

## 6. Keputusan yang perlu dikonfirmasi

| # | Pertanyaan | Usulan |
|---|---|---|
| 1 | Channel email per event | Sesuai kolom channel di NOTIF-1 (aturan "arsip di email") |
| 2 | Karyawan tanpa akun login | Dilewati, tanpa fallback ke `employees.email` |
| 3 | Notifikasi akun (undangan, password, tagihan) | `tenant_id` kosong, tampil di inbox tenant mana pun |
| 4 | Bahasa push | Per user (device terbaru), bukan per device |
| 5 | Kontrak berakhir untuk HR | Event terpisah `employment.contract_expiring_team`, in-app + email tanpa push |
| 6 | Ambang kontrak | H-30 dan H-7 |
| 7 | Link BO | Path netral `/go/*` yang di-redirect sesuai persona |
| 8 | `Notify` gagal di pemicu tanpa transaksi | Dicatat di log, aksi bisnis tetap berhasil |
| 9 | Urutan | Bagian A → B (approval, leave, attendance, payroll lebih dulu karena dipakai mobile) → C → D. Auth & billing setelahnya |

## 7. Di luar cakupan

- Event opsional NOTIF-1: `approval.reminder`, `approval.cancelled`, `employment.document_expiring`, `employment.mutation_failed`, `attendance.missed_clock_in`, `system.announcement`.
- HR membatalkan cuti yang sudah disetujui, dan batal koreksi absen (fiturnya belum ada).
- Menyalakan sweep auto clock-out (keputusan modul attendance). Kode notifikasinya sudah disiapkan.
- Memindahkan email auth (verifikasi, reset, undangan) ke modul notification.
- Digest email harian / mingguan, SMS / WhatsApp, Do Not Disturb.
