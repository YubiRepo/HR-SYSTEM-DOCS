<!-- 📁 modules/notification/01-overview.md -->
# 01 · Overview

## Konsep

| Istilah | Arti |
|---|---|
| **Notification** | Satu baris per **penerima** — sekaligus isi inbox in-app user itu. Terikat ke konteks: `tenant_id`, atau `NULL` untuk notifikasi tingkat akun / konteks platform. |
| **Delivery** | Satu pengiriman ke channel eksternal (`email` / `push`) untuk satu notification. Status `pending` → `sent` / `failed` / `skipped`. |
| **Event** | Jenis notifikasi di **katalog** (`approval.pending`, `leave.approved`, …). Katalog menentukan kategori, scope, channel default, apakah wajib, parameter & data, teks (en/id), dan link. |
| **Scope** | `tenant` (default): milik tenant kejadian, hanya untuk anggota aktif. `account`: tentang akun/perusahaan user (undangan, password, tagihan) — tampil di inbox tenant mana pun. |
| **Kategori** | Pengelompokan event untuk preferensi & filter inbox: `approval`, `employment`, `payroll`, `attendance`, `system`. |
| **Preferensi** | Pilihan user per kategori × channel eksternal. In-app tidak bisa dimatikan. Event `Mandatory` mengabaikan preferensi. Berlaku untuk semua tenant user. |

## Alur publish → kirim

```
 Modul pengirim (dalam transaksi bisnis)
   Notify(ctx, Request)  ──▶ event_outbox  (notification.dispatch)
                                   │ outbox relay → RabbitMQ
 cmd/worker  notification.dispatch
   1. resolve penerima: user_ids ∪ pemegang permission
   2. buang aktor & (scope tenant) yang tidak punya membership aktif di tenant
   3. render teks dari katalog per bahasa penerima (locale device terbaru)
   4. INSERT notifications (1/penerima)   ← ON CONFLICT (user_id, dedupe_key) DO NOTHING
   5. per channel eksternal yang aktif & diizinkan preferensi:
        INSERT notification_deliveries + event_outbox notification.deliver.<channel>
      (langkah 4–5 satu transaksi)
   6. setelah commit: publish Redis notif:user:<id>  ──▶ cmd/api hub WebSocket ──▶ BO
                                   │
          notification.deliver.email          notification.deliver.push
          SMTP (shared/mailer)                FCM HTTP v1 → semua device aktif user
```

| Tahap | Kalau gagal |
|---|---|
| Notify | Error ke pemanggil (event tak dikenal, tanpa penerima). Ikut rollback transaksi bisnis. |
| Relay | Baris outbox tetap `pending`, dicoba tick berikutnya. |
| Dispatch | Error DB → di-retry (retry policy messaging). Payload rusak / event tak dikenal → fatal (DLX). |
| Realtime | Diabaikan (log saja). BO tetap sinkron lewat polling `unread-count`. |
| Email | Error jaringan/4xx → retry. SMTP 5xx (alamat ditolak) → `failed`. User tanpa email → `skipped`. |
| Push | Token `UNREGISTERED`/invalid → device dinonaktifkan. Semua token mati → `failed`. Error lain → retry. Tanpa device → `skipped`. |

## Jaminan

- **Atomik dengan bisnis.** `Notify` hanya menulis outbox lewat transaksi pemanggil. Rollback bisnis = notifikasi batal. Pengecualian (tidak ada transaksi bisnis, notifikasi ditulis setelah simpan dan kegagalannya di-log): perubahan jadwal, auto clock-out, tagihan terbit, peringatan trial, undangan tenant.
- **Idempoten.** Pengiriman RabbitMQ *at-least-once*; `UNIQUE (user_id, dedupe_key)` mencegah notifikasi ganda, dan job email/push memeriksa status delivery sebelum mengirim. Push yang sudah diterima minimal satu device tidak dikirim ulang.
- **Isolasi tenant.** Inbox selalu difilter `tenant_id` dari token (plus notifikasi akun milik user); stream realtime hanya meneruskan notifikasi tenant sesi itu dan notifikasi akun.
- **Tidak memberi tahu pelaku.** `ActorUserID` dikeluarkan dari penerima.
- **Realtime best-effort.** Data selalu di DB dulu; stream hanya mempercepat badge.

## Batasan

- Karyawan tanpa akun login tidak menerima notifikasi (tanpa fallback ke email karyawan).
- Bahasa per user, bukan per device: push memakai bahasa user (device terbaru).
- Event opsional belum ada: lihat [katalog](03-event-catalog.md).
- Tanpa broadcast ke seluruh tenant, SMS/WA, Do Not Disturb, atau digest.
- Email auth (verifikasi, reset, undangan) tetap dikirim modul auth; hanya transport SMTP yang dipakai bersama (`internal/shared/mailer`).
