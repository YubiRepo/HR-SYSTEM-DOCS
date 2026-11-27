<!-- 📁 modules/mobile/api/notification.md -->
# Mobile API · Notification

Inbox notifikasi, jumlah belum dibaca, preferensi, dan registrasi token push (FCM). Prefix `/api/v1/notifications`. Semua endpoint cukup login (tanpa permission khusus) dan hanya mengakses notifikasi milik user di **tenant aktif token**.

> Referensi lengkap: [`../../notification/04-api-contract.md`](../../notification/04-api-contract.md).

---

## 1. Registrasi device — `POST /notifications/devices`

Panggil setiap app start (setelah login / pilih tenant) dan setiap kali SDK FCM memberi token baru (`onTokenRefresh`). Idempoten per token: token yang sama hanya diperbarui; token yang sebelumnya milik user lain dipindah ke user ini.

```json
{
  "token": "fcm-registration-token",
  "platform": "android",
  "device_id": "a1b2c3",
  "device_name": "Pixel 8",
  "app_version": "1.4.0"
}
```

`platform`: `android` | `ios` | `web`. Respons:

```json
{ "success": true, "data": { "id": "9f1…", "platform": "android", "device_id": "a1b2c3", "device_name": "Pixel 8", "app_version": "1.4.0", "last_seen_at": "2026-11-27T08:00:00Z" } }
```

Simpan `data.id` untuk logout.

## 2. Logout — `DELETE /notifications/devices/{id}`

Panggil **sebelum** `POST /auth/logout`, agar device berhenti menerima push untuk akun ini. 204; `404 NOTIFICATION_DEVICE_NOT_FOUND` bila sudah terhapus (abaikan).

## 3. Payload push

Push dikirim sebagai notifikasi FCM (`notification.title` / `notification.body`) plus `data` (semua nilai string):

| Key | Isi |
|---|---|
| `notification_id` | ID item inbox |
| `event_key` | mis. `system.test` |
| `category` | `approval` / `employment` / `payroll` / `attendance` / `system` |
| `tenant_id` | Tenant notifikasi — bila berbeda dengan tenant aktif app, ganti tenant dulu (`POST /auth/switch-tenant`) sebelum membuka |
| `ref_type`, `ref_id` | Record yang dirujuk (opsional), untuk deep link ke layar terkait |
| `link` | Path backoffice (opsional); mobile memetakan sendiri dari `ref_type` |

Saat push dibuka: navigasi sesuai `ref_type`/`ref_id`, lalu panggil `PATCH /notifications/{notification_id}/read`.

App harus memakai project Firebase yang sama dengan `FCM_PROJECT_ID` di server. Push dikirim dengan prioritas `high`; iOS memakai `sound: default`.

## 4. Inbox — `GET /notifications`

Paginasi standar: `?page=1&per_page=20`. Filter: `filter[unread]=true`, `filter[category]=approval`. Terbaru dulu.

```json
{
  "success": true,
  "data": [
    {
      "id": "…", "event_key": "system.test", "category": "system",
      "title": "Test notification", "body": "Hi Ana, this is a test notification …",
      "link": "/notifications", "ref_type": null, "ref_id": null, "data": {},
      "is_read": false, "read_at": null, "created_at": "2026-11-27T08:00:00Z"
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
