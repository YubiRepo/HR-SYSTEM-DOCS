<!-- 📁 modules/notification/02-data-model.md -->
# 02 · Data Model

Migrasi: `HR-SYSTEM-API/migrations/20261127000009_notification_tables`.

## `notifications` — inbox, 1 baris per penerima

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID NULL | Konteks; `NULL` = platform |
| `user_id` | UUID FK `users` (cascade) | Penerima |
| `event_key` | VARCHAR(100) | Key katalog |
| `category` | VARCHAR(30) | Dari katalog |
| `title`, `body` | VARCHAR(255), TEXT | Sudah dirender |
| `link` | TEXT NULL | Path backoffice (relatif) |
| `ref_type`, `ref_id` | VARCHAR NULL | Record bisnis yang dirujuk |
| `data` | JSONB | Params dari pengirim |
| `dedupe_key` | VARCHAR(200) | Idempotensi per penerima |
| `read_at` | TIMESTAMPTZ NULL | |
| `created_at` | TIMESTAMPTZ | |

Index: `UNIQUE (user_id, dedupe_key)`, `(user_id, tenant_id, created_at DESC)`, `(user_id, tenant_id) WHERE read_at IS NULL`.

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
| `device_id`, `device_name`, `app_version` | Informasi dari app |
| `active` | `false` setelah FCM menyatakan token mati |
| `last_seen_at` | Diperbarui setiap registrasi ulang |

## `notification_preferences` — override preferensi

PK `(user_id, category, channel)`, kolom `enabled`. Tidak ada baris = default katalog (aktif). Channel hanya `email`/`push`.

## Retensi

Job harian `notification.retention.purge` (19:30 UTC / 02:30 WIB): hapus notifikasi yang dibaca lebih dari `NOTIFICATION_RETENTION_DAYS` hari lalu (default 180) dan yang belum dibaca lebih dari 2× nilai itu, per batch 5.000 baris. Delivery ikut terhapus (cascade).
