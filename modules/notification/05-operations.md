<!-- 📁 modules/notification/05-operations.md -->
# 05 · Operations

## Konfigurasi (`.env`, section *Notification*)

| Env | Default | Keterangan |
|---|---|---|
| `NOTIFICATION_EMAIL_ENABLED` | `true` | Channel email; juga butuh `SMTP_HOST` + `SMTP_USERNAME`. Tanpa SMTP → in-app saja |
| `NOTIFICATION_BO_BASE_URL` | `http://localhost:3000` | Prefix link absolut di email |
| `NOTIFICATION_TEST_ENDPOINT_ENABLED` | `false` | `POST /notifications/test` — hanya dev/staging |
| `NOTIFICATION_PUSH_ENABLED` | `false` | Channel push FCM |
| `FCM_PROJECT_ID` | | ID project Firebase |
| `FCM_CREDENTIALS_FILE` | | Path file service account JSON (harus ter-mount di container api & worker) |
| `NOTIFICATION_RETENTION_DAYS` | `180` | `0` = retensi mati |

Push aktif tetapi kredensial FCM tidak ada/rusak → api dan worker **gagal start** (sengaja, agar salah konfigurasi langsung terlihat).

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
- Halaman `/notifications` (Inbox) dan `/notifications/settings` (preferensi), di luar lane `/tenants`/`/ess`/`/platform` sehingga bisa diakses semua tier. `/platform/settings/notifications` memakai komponen preferensi yang sama.

## Skenario uji E2E

Prasyarat: migrasi `20261127000009` dijalankan, `RABBITMQ_ENABLED=true`, `NOTIFICATION_TEST_ENDPOINT_ENABLED=true`, Redis aktif; untuk email isi `SMTP_*`, untuk push isi kredensial FCM dan daftarkan device.

| # | Skenario | Hasil yang diharapkan |
|---|---|---|
| 1 | Buka BO, lalu panggil `POST /api/v1/notifications/test` dengan token sesi yang sama (curl/HTTP client) | Baris `event_outbox` → baris `notifications`; badge bertambah tanpa reload; toast muncul |
| 2 | Email aktif | Email masuk; delivery `sent`; tombol membuka `/notifications` |
| 3 | Push aktif, device terdaftar | Push masuk; data berisi `notification_id`, `tenant_id` |
| 4 | Matikan email kategori *System* di Settings, ulangi #1 | Hanya in-app; tidak ada delivery email |
| 5 | User multi-tenant: kirim di tenant A, buka tenant B | Notifikasi tidak terlihat di inbox/stream tenant B |
| 6 | Matikan worker, kirim tes, nyalakan worker | Notifikasi tetap terkirim (outbox menahan) |
| 7 | SMTP salah sementara | Delivery `pending` + `last_error`, terkirim setelah SMTP benar (retry) |
| 8 | Token FCM sudah di-uninstall | Device `active = false`, delivery `failed` |
| 9 | Matikan Redis | `stream/ticket` 503; badge tetap ter-update lewat polling |
| 10 | Jalankan `notification.retention.purge` dengan data lama | Notifikasi lama terhapus sesuai cutoff |
