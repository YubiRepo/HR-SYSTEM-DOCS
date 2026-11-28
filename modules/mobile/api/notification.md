<!-- 📁 modules/mobile/api/notification.md -->
# Mobile API · Notification

Inbox notifikasi, jumlah belum dibaca, preferensi, dan registrasi token push (FCM). Prefix `/api/v1/notifications`. Semua endpoint cukup login (tanpa permission khusus) dan hanya mengakses notifikasi milik user di **tenant aktif token**, ditambah notifikasi **tingkat akun** (`tenant_id: null` — undangan, password, tagihan) yang tampil di tenant mana pun.

Daftar event, penerima, `ref_type`, dan layar tujuan: [issues NOTIF-1 & NOTIF-3](../issues/notification.md) · katalog: [03-event-catalog](../../notification/03-event-catalog.md).

> Referensi lengkap: [`../../notification/04-api-contract.md`](../../notification/04-api-contract.md).

---

## 1. Registrasi device — `POST /notifications/devices`

Panggil setelah login, pilih/ganti tenant, setiap `onTokenRefresh`, saat app dibuka bila terakhir register > 7 hari, dan saat user ganti bahasa app.

```json
{
  "token": "fcm-registration-token",
  "platform": "android",
  "device_id": "a1b2c3",
  "device_name": "Pixel 8",
  "app_version": "1.4.0",
  "locale": "id"
}
```

- `platform`: `android` | `ios` | `web`. `device_id`: UUID per install (bukan ID hardware).
- `locale` (opsional): `id` | `en` (tag seperti `id-ID` diterima). Bahasa notifikasi user (inbox, email, push) = `locale` device yang paling baru aktif; tanpa device = `en`. Nilai lain → `422 VALIDATION_ERROR`.
- Token sama → diperbarui; token milik user lain → dipindah ke user ini. `device_id` yang sama dengan token baru (FCM rotate) → token di baris lama diganti, `data.id` tetap.

```json
{ "success": true, "data": { "id": "9f1…", "platform": "android", "device_id": "a1b2c3", "device_name": "Pixel 8", "app_version": "1.4.0", "locale": "id", "last_seen_at": "2026-11-28T08:00:00Z" } }
```

Simpan `data.id` untuk logout.

**Daftar & hapus semua device** — `GET /notifications/devices` (device aktif user, terbaru dulu) dan `DELETE /notifications/devices` (`{ "removed": 3 }`, untuk "keluar dari semua perangkat"). Server juga menghapus semua device saat password diganti / akun dinonaktifkan, dan device yang tidak aktif > 60 hari.

## 2. Logout — `DELETE /notifications/devices/{id}`

Panggil **sebelum** `POST /auth/logout`, agar device berhenti menerima push untuk akun ini. 204; `404 NOTIFICATION_DEVICE_NOT_FOUND` bila sudah terhapus (abaikan).

## 3. Payload push

Push dikirim sebagai notifikasi FCM (`notification.title` / `notification.body`) plus `data` (semua nilai string):

| Key | Isi |
|---|---|
| `notification_id` | ID item inbox |
| `event_key` | mis. `system.test` |
| `category` | `approval` / `employment` / `payroll` / `attendance` / `system` |
| `tenant_id` | Tenant notifikasi — bila berbeda dengan tenant aktif app, ganti tenant dulu (`POST /auth/switch-tenant`) sebelum membuka. **Tidak ada** untuk notifikasi tingkat akun (undangan, password, tagihan): buka tanpa ganti tenant |
| `ref_type`, `ref_id` | Record yang dirujuk (opsional). `ref_id` selalu UUID |
| `link` | Path backoffice (opsional, `/go/*`); mobile memetakan sendiri dari `ref_type` |
| `document_type` | Hanya `approval.pending`: `leave_request` / `overtime_request` / `attendance_correction` / `payroll_run` |
| `date` | Hanya `schedule.changed` dan `attendance.auto_clocked_out`: `YYYY-MM-DD` |

Saat push dibuka: navigasi sesuai `ref_type`/`ref_id` (tabel di [NOTIF-3](../issues/notification.md#notif-3)), lalu panggil `PATCH /notifications/{notification_id}/read` (setelah ganti tenant bila perlu).

App harus memakai project Firebase yang sama dengan `FCM_PROJECT_ID` di server. Push dikirim dengan prioritas `high` dan `android.notification.channel_id = hr_app_default_channel`; iOS memakai `sound: default` dan `aps.badge` = jumlah belum dibaca. Teks push mengikuti bahasa user.

## 4. Inbox — `GET /notifications`

Paginasi standar: `?page=1&per_page=20`. Filter: `filter[unread]=true`, `filter[category]=approval`. Terbaru dulu.

```json
{
  "success": true,
  "data": [
    {
      "id": "…", "tenant_id": "a236f608-…", "event_key": "leave.approved", "category": "approval",
      "title": "Cuti disetujui", "body": "Cuti Tahunan Anda untuk 20 Des 2026 – 21 Des 2026 disetujui.",
      "link": "/go/leave", "ref_type": "leave_request", "ref_id": "5d2…", "data": {},
      "is_read": false, "read_at": null, "created_at": "2026-11-28T08:00:00Z"
    }
  ],
  "pagination": { "page": 1, "per_page": 20, "total_items": 1, "total_pages": 1, "next": null, "prev": null }
}
```

## 5. Badge — `GET /notifications/unread-count`

`{ "count": 3 }`. Panggil saat app kembali ke foreground dan saat push diterima.

## 6. Tandai dibaca

- `PATCH /notifications/{id}/read` → 204 (`404 NOTIFICATION_NOT_FOUND` bila bukan milik user).
- `POST /notifications/read-all` dengan body opsional `{ "category": "approval" }` → `{ "updated": 5 }`.

## 7. Preferensi — `GET` / `PUT /notifications/preferences`

Matriks kategori × channel eksternal (`email`, `push`). In-app selalu aktif. Lihat bentuk respons di [04-api-contract](../../notification/04-api-contract.md). Sel `locked: true` tidak bisa diubah (`422 NOTIFICATION_PREFERENCE_LOCKED`). Preferensi berlaku untuk semua tenant user.

```json
{ "items": [ { "category": "approval", "channel": "push", "enabled": false } ] }
```

## Realtime

Aplikasi mobile **tidak** memakai WebSocket `/notifications/stream` (itu untuk backoffice); notifikasi baru datang lewat push FCM.
