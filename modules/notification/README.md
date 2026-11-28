<!-- 📁 modules/notification/README.md -->
# Notification Module

Mengirim notifikasi ke user: **inbox in-app**, **email**, **push (FCM) ke app mobile dan browser backoffice**, dan **realtime** ke tab backoffice yang sedang terbuka. Modul lain cukup memanggil satu pintu (`notification.Contract.Notify`) di dalam transaksi bisnisnya; pengiriman berjalan asinkron di worker.

| | |
|---|---|
| **Modul** | Notification |
| **Versi** | 1.0 (arsitektur; daftar event bisnis menyusul) |
| **Dependensi** | Auth (penerima: anggota aktif & pemegang permission, kontak email), Messaging (outbox + RabbitMQ), Scheduler (retensi), Redis (realtime, opsional) |
| **Consumer** | Belum ada modul bisnis. Event uji `system.test` untuk verifikasi jalur |
| **Rencana** | [plans/2026-11-27-modul-notification.md](../../plans/2026-11-27-modul-notification.md) |
| **Kode** | `HR-SYSTEM-API/internal/modules/notification`, BO: `app/composables/useNotifications.ts`, `app/plugins/notifications.client.ts`, `app/pages/notifications*` |

## Dokumen

| File | Isi |
|---|---|
| [01-overview.md](01-overview.md) | Konsep, alur publish → kirim, jaminan (atomik, idempoten, best-effort) |
| [02-data-model.md](02-data-model.md) | Tabel `notifications`, `notification_deliveries`, `notification_devices`, `notification_preferences` |
| [03-event-catalog.md](03-event-catalog.md) | Katalog event, kategori, cara menambah event baru |
| [04-api-contract.md](04-api-contract.md) | HTTP `/api/v1/notifications`, kontrak `Notify` antar modul, routing key worker |
| [05-operations.md](05-operations.md) | Konfigurasi env, channel, realtime & proxy, retensi, skenario uji |

Kontrak untuk aplikasi mobile: [mobile/api/notification.md](../mobile/api/notification.md).
