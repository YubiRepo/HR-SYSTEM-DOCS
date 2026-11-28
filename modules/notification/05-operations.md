<!-- 📁 modules/notification/05-operations.md -->
# 05 · Operations

## Konfigurasi (`.env`, section *Notification*)

| Env | Default | Keterangan |
|---|---|---|
| `NOTIFICATION_EMAIL_ENABLED` | `true` | Channel email; juga butuh `SMTP_HOST` + `SMTP_USERNAME`. Tanpa SMTP → in-app saja |
| `BACKOFFICE_URL` (umum) | `http://localhost:3132` | Prefix link absolut di email (sama dengan link email auth) |
| `NOTIFICATION_PUSH_ENABLED` | `false` | Channel push FCM (app mobile + browser BO) |
| `FCM_PROJECT_ID` | | ID project Firebase |
| `FCM_CREDENTIALS_FILE` | | Path file service account JSON (harus ter-mount di container api & worker) |
| `NOTIFICATION_RETENTION_DAYS` | `180` | `0` = retensi mati |

Push aktif tetapi kredensial FCM tidak ada/rusak → api dan worker **gagal start** (sengaja, agar salah konfigurasi langsung terlihat).

### Push browser (backoffice)

BO mendaftarkan browser sebagai device `platform = "web"` lewat endpoint device yang sama dengan mobile. Konfigurasi di `.env` BO (section *Notification: browser push*), dibaca saat container start:

| Env BO | Keterangan |
|---|---|
| `NUXT_PUBLIC_FIREBASE_API_KEY` | Kosong = push browser mati |
| `NUXT_PUBLIC_FIREBASE_PROJECT_ID` | Harus sama dengan `FCM_PROJECT_ID` API |
| `NUXT_PUBLIC_FIREBASE_APP_ID`, `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Dari Firebase console → *Project settings* → *Your apps* → Web |
| `NUXT_PUBLIC_FIREBASE_VAPID_KEY` | Opsional. *Cloud Messaging* → *Web Push certificates*. Kosong = key default Firebase |

Alur: user menekan **Turn on** di *Notification settings*, browser meminta izin, lalu `getToken` (Firebase SDK, memakai service worker `public/sw.js`) dan `POST /notifications/devices`. Setelah itu setiap login mendaftarkan ulang token tanpa prompt, dan logout menghapus device (komputer bersama tidak menerima notifikasi user sebelumnya). `public/sw.js` menampilkan notifikasi sendiri (tanpa Firebase SDK di service worker) dan melewatkannya bila ada tab BO yang sedang fokus, karena tab itu sudah menampilkan toast realtime. Klik notifikasi membuka `/go/...?n=&t=`: bila notifikasi milik organisasi lain (tempat user masih anggota aktif), BO pindah organisasi lalu memuat ulang langsung ke tujuan, kemudian menandai notifikasi terbaca — baik saat ada tab terbuka maupun tidak. Push browser butuh HTTPS (kecuali `localhost`).

## Proses

| Proses | Peran |
|---|---|
| `cmd/api` | `Notify` (tulis outbox), endpoint inbox/preferensi/device, ticket & hub WebSocket (subscribe Redis `notif:user:*`) |
| `cmd/worker` | Handler dispatch/email/push/purge, publish Redis realtime, jadwal retensi |

Redis bersifat opsional di kedua proses: tanpa Redis, stream mengembalikan 503 dan BO kembali ke polling 60 detik.

## Realtime di balik proxy

WebSocket butuh header `Upgrade`/`Connection` dan HTTP/1.1. Staging: `deploy/staging/nginx/templates/10-api.conf.template` punya location `= /api/v1/notifications/stream` dengan `proxy_read_timeout 3600s`. Cloudflare Tunnel meneruskan WebSocket tanpa konfigurasi tambahan.

## Backoffice

- Bell di `AppNavbar` (semua portal): badge unread, popover 10 terbaru, *Mark all as read*, link ke inbox & pengaturan.
- `plugins/notifications.client.ts`: satu koneksi WebSocket per tab (ticket → `wss://…/stream`), reconnect dengan backoff 1–30 detik, berhenti 5 menit bila server menjawab realtime tidak tersedia; polling `unread-count` tiap 60 detik dan saat tab kembali terlihat; toast untuk notifikasi baru.
- Halaman `/notifications` (Inbox), di luar lane `/tenants`/`/ess`/`/platform` sehingga bisa diakses semua tier.
- Link notifikasi memakai path netral `/go/*` (`app/pages/go/[...target].client.vue`) yang diarahkan ke portal penerima (admin `/tenants/*`, karyawan `/ess/*`). Dibuka saat belum login → `/auth/login?redirect=/go/...` lalu kembali ke tujuan. Notifikasi akun (`tenant_id` null: undangan, password, tagihan) tampil di inbox organisasi mana pun dengan penanda "Your account".
- **Preferensi milik user pribadi**: tab *Notifications* di shell "My Profile" tiap portal — `/platform/settings/notifications`, `/tenants/account/notifications`, `/ess/account/notifications` (komponen `NotificationsPreferences` yang sama), juga lewat menu avatar *Notification Settings*, tombol gear di bell, dan tab *Settings* di inbox. `/notifications/settings` hanya redirect ke halaman itu.
- **Tes notifikasi** (`/platform/settings/notification-test`, menu *Platform Settings → Notifications*): alat operasional platform. Mengirim `system.test` ke diri sendiri dan menampilkan status channel server (email/push) serta push browser ini. Butuh permission `platform_support:read` atau `:write`.

## Skenario uji E2E

Prasyarat: migrasi `20261128000003` dan `20261128000004` dijalankan, `RABBITMQ_ENABLED=true`, Redis aktif, login sebagai staf platform dengan `platform_support`; untuk email isi `SMTP_*`, untuk push isi kredensial FCM dan daftarkan device.

| # | Skenario | Hasil yang diharapkan |
|---|---|---|
| 1 | Di BO buka *Platform Settings → Notifications*, klik **Send test notification** | Baris `event_outbox` → baris `notifications`; badge bertambah tanpa reload; toast muncul |
| 2 | Email aktif | Email masuk; delivery `sent`; tombol membuka `/notifications` |
| 3 | Push aktif, device terdaftar | Push masuk; data berisi `notification_id`, `tenant_id` |
| 4 | Matikan email kategori *System* di Settings, ulangi #1 | Hanya in-app; tidak ada delivery email |
| 5 | User multi-tenant: kirim di tenant A, buka tenant B | Notifikasi tidak terlihat di inbox/stream tenant B |
| 6 | Matikan worker, kirim tes, nyalakan worker | Notifikasi tetap terkirim (outbox menahan) |
| 7 | SMTP salah sementara | Delivery `pending` + `last_error`, terkirim setelah SMTP benar (retry) |
| 8 | Token FCM sudah di-uninstall | Device `active = false`, delivery `failed` |
| 9 | Matikan Redis | `stream/ticket` 503; badge tetap ter-update lewat polling |
| 10 | Jalankan `notification.retention.purge` dengan data lama | Notifikasi lama terhapus sesuai cutoff |
| 11 | Push browser: *Turn on* di Settings, tutup/blur tab BO, ulangi #1 | Notifikasi sistem muncul; klik → tab BO fokus, buka `link`, notifikasi terbaca. Saat tab fokus: hanya toast |
| 12 | Push browser: logout, lalu kirim tes untuk user itu | Device `web` terhapus; tidak ada push di browser tersebut |

### Event bisnis

Prasyarat tambahan: tenant dengan kebijakan approval 2 step untuk cuti, satu karyawan punya akun login (app mobile / browser terdaftar), SMTP Mailtrap.

| # | Skenario | Hasil yang diharapkan |
|---|---|---|
| 13 | Karyawan mengajukan cuti (kebijakan 2 step) | Approver step 1 dapat in-app + push `approval.pending` (`data.document_type = leave_request`), **tanpa email**. Setelah step 1 setuju, approver step 2 dapat notifikasi |
| 14 | Cuti disetujui final / ditolak | Pengaju dapat in-app + push + email `leave.approved` / `leave.rejected`; approver tidak menerima notifikasinya sendiri |
| 15 | Koreksi absen disetujui | In-app + push `correction.approved`, tanpa email |
| 16 | Payroll run disetujui final | Semua pemilik slip dapat `payroll.payslip_published` (tanpa nominal); email tetap terkirim walau preferensi email *Payroll* dimatikan (wajib). Maker dapat `payroll.run_approved` |
| 17 | HR assign jadwal 30 hari untuk 10 karyawan | Satu `schedule.changed` per karyawan (rentang hari ini s/d +14), `data.date` = tanggal pertama |
| 18 | Undang akun yang sudah ada ke tenant lain | `auth.tenant_invitation` tampil di inbox tenant aktif mana pun dengan penanda "Your account"; email undangan dari auth tetap satu |
| 19 | Ganti password | Email + in-app `auth.password_changed`; semua device user terhapus. Bila outbox gagal ditulis, ganti password ikut gagal |
| 20 | Device `locale = id` | Teks inbox, email, dan push dalam bahasa Indonesia ("20 Des 2026") |
| 21 | Token FCM dirotasi dengan `device_id` sama | Tetap satu baris device, token baru, `id` sama |
| 22 | Job `core_hr.contract.expiry_check` jalan 3 hari berturut-turut dalam rentang H-30 | Satu notifikasi karyawan + satu ke HR (`employees:read`); di H-7 terkirim sekali lagi |
| 23 | Klik push browser untuk notifikasi tenant B saat BO aktif di tenant A | BO pindah ke tenant B, membuka tujuan, notifikasi terbaca |
| 24 | Buka link email notifikasi saat belum login | Login → kembali ke tujuan link (`/go/...`) |
| 25 | Dunning menangguhkan tenant | Pemegang `billing:read` dapat `billing.tenant_suspended` (in-app + push + email) |
