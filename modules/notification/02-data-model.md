<!-- 📁 modules/notification/02-data-model.md -->
# 02 · Data Model

Migrasi: `HR-SYSTEM-API/migrations/20261128000003_notification_tables`, `20261128000004_notification_device_locale` (kolom `locale` + indeks rotasi token).

## `notifications` — inbox, 1 baris per penerima

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID NULL | Konteks. `NULL` = notifikasi tingkat akun (undangan, password, tagihan) atau konteks platform — tampil di inbox tenant mana pun milik user |
| `user_id` | UUID FK `users` (cascade) | Penerima |
| `event_key` | VARCHAR(100) | Key katalog |
| `category` | VARCHAR(30) | Dari katalog |
| `title`, `body` | VARCHAR(255), TEXT | Sudah dirender dalam bahasa penerima saat dikirim |
| `link` | TEXT NULL | Path backoffice (relatif) |
| `ref_type`, `ref_id` | VARCHAR, UUID NULL | Record bisnis yang dirujuk. `ref_id` selalu UUID; event berbasis tanggal memakai `data.date` |
| `data` | JSONB | `Request.Data` (key yang dideklarasikan event, mis. `document_type`, `date`); ikut di push. Parameter teks tidak disimpan |
| `dedupe_key` | VARCHAR(200) | Idempotensi per penerima |
| `read_at` | TIMESTAMPTZ NULL | |
| `created_at` | TIMESTAMPTZ | |

Index: `UNIQUE (user_id, dedupe_key)`, `(user_id, tenant_id, created_at DESC)`, `(user_id, tenant_id) WHERE read_at IS NULL`.

Query inbox sesi tenant: `user_id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)`; sesi platform: `tenant_id IS NULL`.

## `notification_deliveries` — pengiriman channel eksternal

| Kolom | Keterangan |
|---|---|
| `notification_id` | FK `notifications` (cascade) |
| `channel` | `email` / `push` |
| `status` | `pending` / `sent` / `failed` / `skipped` |
| `attempts`, `last_error`, `provider_message_id`, `sent_at` | Jejak percobaan |

`UNIQUE (notification_id, channel)`. Delivery yang retry-nya habis (masuk DLX) tetap `pending` dengan `last_error` terisi.

## `notification_devices` — token push

| Kolom | Keterangan |
|---|---|
| `user_id` | FK `users` (cascade) |
| `token` | Token FCM, `UNIQUE` — token yang didaftarkan user lain dipindah ke user baru |
| `platform` | `android` / `ios` / `web` |
| `device_id`, `device_name`, `app_version` | Informasi dari app. `(user_id, device_id)` yang sama dengan token baru = rotasi: token di baris lama diganti, bukan baris baru |
| `locale` | `id` / `en` (NULL = tidak dikirim). Bahasa notifikasi user = `locale` device aktif dengan `last_seen_at` terbaru |
| `active` | `false` setelah FCM menyatakan token mati |
| `last_seen_at` | Diperbarui setiap registrasi ulang |

Index: `(user_id) WHERE active`, `(user_id, device_id) WHERE device_id IS NOT NULL`.

Device dihapus saat logout (`DELETE /devices/{id}`), "keluar dari semua perangkat" (`DELETE /devices`), password diganti, dan akun dinonaktifkan platform.

## `notification_preferences` — override preferensi

PK `(user_id, category, channel)`, kolom `enabled`. Tidak ada baris = default katalog (aktif). Channel hanya `email`/`push`.

## Retensi

Job harian `notification.retention.purge` (19:30 UTC / 02:30 WIB): hapus notifikasi yang dibaca lebih dari `NOTIFICATION_RETENTION_DAYS` hari lalu (default 180) dan yang belum dibaca lebih dari 2× nilai itu, per batch 5.000 baris. Delivery ikut terhapus (cascade). Job yang sama menghapus device yang nonaktif atau tidak terlihat lebih dari 60 hari (berlaku walau retensi notifikasi dimatikan).
