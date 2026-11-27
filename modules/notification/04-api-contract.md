<!-- 📁 modules/notification/04-api-contract.md -->
# 04 · API Contract

## HTTP — `/api/v1/notifications`

Semua endpoint (kecuali `stream`) wajib login, tanpa permission khusus: hanya membaca/mengubah notifikasi milik pemanggil di konteks sesi (tenant aktif, atau platform). Endpoint tulis ditolak untuk sesi impersonasi read-only.

| Method | Path | Keterangan |
|---|---|---|
| GET | `/` (root) | Inbox, terbaru dulu. `?filter[unread]=true&filter[category]=&page=&per_page=` (default 20, `-1` = semua) |
| GET | `/unread-count` | `{ "count": 3 }` |
| PATCH | `/{id}/read` | 204. `404 NOTIFICATION_NOT_FOUND` bila bukan milik pemanggil |
| POST | `/read-all` | Body opsional `{ "category": "approval" }`. Respons `{ "updated": 5 }` |
| GET | `/preferences` | Matriks preferensi (lihat di bawah) |
| PUT | `/preferences` | Body `{ "items": [{ "category", "channel", "enabled" }] }`, atomik. Respons = matriks baru |
| POST | `/devices` | Daftar/refresh token push (lihat [mobile](../mobile/api/notification.md)) |
| DELETE | `/devices/{id}` | 204. `404 NOTIFICATION_DEVICE_NOT_FOUND` |
| POST | `/stream/ticket` | `{ "ticket": "…", "expires_in": 30 }` — ticket sekali pakai |
| GET | `/stream?ticket=` | WebSocket, **tanpa** header Authorization (otorisasi lewat ticket) |
| POST | `/test` | Kirim `system.test` ke diri sendiri. 202. `404 NOTIFICATION_TEST_DISABLED` bila flag mati |

**Item inbox**
```json
{
  "id": "…", "event_key": "system.test", "category": "system",
  "title": "Test notification", "body": "Hi Ana, …", "link": "/notifications",
  "ref_type": null, "ref_id": null, "data": { "recipient_name": "Ana" },
  "is_read": false, "read_at": null, "created_at": "2026-11-27T08:00:00Z"
}
```

**Matriks preferensi**
```json
{
  "channels": ["email", "push"],
  "items": [
    { "category": "approval", "channel": "email", "enabled": true, "available": false, "locked": false }
  ]
}
```
`channels` = channel eksternal yang aktif di deployment (kosong = hanya in-app). `available` = ada event di kategori itu yang memakai channel tsb. `locked` = semua event di sel itu wajib; mengubahnya → `422 NOTIFICATION_PREFERENCE_LOCKED`.

**Stream WebSocket** — pesan server → client (JSON):

| `type` | Isi |
|---|---|
| `connected` | Dikirim sekali setelah handshake |
| `notification.created` | `{ type, user_id, tenant_id, notification: <item inbox> }` |

Client tidak mengirim pesan. Server ping tiap 30 detik; maksimal 10 koneksi per user (yang tertua ditutup). Tidak ada event `unread_count`: client memanggil `unread-count` saat menerima `notification.created`.

### Error

| Code | HTTP |
|---|---|
| `NOTIFICATION_NOT_FOUND` | 404 |
| `NOTIFICATION_DEVICE_NOT_FOUND` | 404 |
| `NOTIFICATION_TEST_DISABLED` | 404 |
| `NOTIFICATION_PREFERENCE_LOCKED` | 422 |
| `NOTIFICATION_UNKNOWN_EVENT` | 422 |
| `NOTIFICATION_NO_RECIPIENTS` | 422 |
| `NOTIFICATION_INVALID_TICKET` | 401 |
| `NOTIFICATION_REALTIME_UNAVAILABLE` | 503 (server tanpa Redis) |

## Kontrak antar modul — `notification.Contract`

```go
type Contract interface {
    Notify(ctx context.Context, req Request) error
}

type Request struct {
    TenantID    *string            // nil = konteks platform
    EventKey    string             // wajib ada di katalog
    Recipients  Recipients         // UserIDs dan/atau Permission{Key, BranchID}
    Params      map[string]string  // placeholder teks
    Ref         *Ref               // {Type, ID}
    DedupeKey   string             // kosong = dibuat otomatis per panggilan
    ActorUserID *string            // dikeluarkan dari penerima
}
```

- `Recipients.Permission` = semua anggota **aktif** tenant yang memegang permission itu dengan scope lebih luas dari `self` — tenant-wide, atau di branch tertentu bila `BranchID` diisi. Butuh `TenantID`.
- Resolusi penerima memakai `auth.Contract.FilterActiveMembers` dan `ListUserIDsWithPermission` (hanya untuk memilih penerima, bukan keputusan akses).

## Routing key worker

Queue `hr_system.worker.notification`:

| Routing key | Payload | Handler |
|---|---|---|
| `notification.dispatch` | `DispatchMessage` (request + `requested_at`) | Dispatch |
| `notification.deliver.email` | `{ "delivery_id" }` | Kirim email |
| `notification.deliver.push` | `{ "delivery_id" }` | Kirim push |
| `notification.retention.purge` | `{}` (scheduler, harian) | Retensi |
