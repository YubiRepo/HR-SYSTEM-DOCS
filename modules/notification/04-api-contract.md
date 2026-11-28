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
| GET | `/devices` | Device aktif milik pemanggil (terbaru dulu) |
| POST | `/devices` | Daftar/refresh token push + `locale` (lihat [mobile](../mobile/api/notification.md)) |
| DELETE | `/devices` | Hapus semua device pemanggil. `{ "removed": 3 }` |
| DELETE | `/devices/{id}` | 204. `404 NOTIFICATION_DEVICE_NOT_FOUND` |
| POST | `/stream/ticket` | `{ "ticket": "…", "expires_in": 30 }` — ticket sekali pakai |
| GET | `/stream?ticket=` | WebSocket, **tanpa** header Authorization (otorisasi lewat ticket) |
| POST | `/test` | Kirim `system.test` ke diri sendiri. 202. Hanya staf platform: permission `platform_support:read` atau `platform_support:write`, selain itu `403 PERMISSION_DENIED` |

**Item inbox**
```json
{
  "id": "…", "tenant_id": "a236f608-…", "event_key": "approval.pending", "category": "approval",
  "title": "Persetujuan baru", "body": "Sari mengajukan pengajuan cuti untuk Anda setujui.", "link": "/go/approvals",
  "ref_type": "approval_request", "ref_id": "6c1e…", "data": { "document_type": "leave_request" },
  "is_read": false, "read_at": null, "created_at": "2026-11-28T08:00:00Z"
}
```
`tenant_id: null` = notifikasi tingkat akun (undangan, password, tagihan), tampil di inbox tenant mana pun. `data` hanya berisi data tambahan event (lihat [katalog](03-event-catalog.md)).

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
| `notification.created` | `{ type, user_id, tenant_id, notification: <item inbox> }`. Notifikasi tingkat akun (`tenant_id` null) dikirim ke semua koneksi user |

Client tidak mengirim pesan. Server ping tiap 30 detik; maksimal 10 koneksi per user (yang tertua ditutup). Tidak ada event `unread_count`: client memanggil `unread-count` saat menerima `notification.created`.

### Error

| Code | HTTP |
|---|---|
| `NOTIFICATION_NOT_FOUND` | 404 |
| `NOTIFICATION_DEVICE_NOT_FOUND` | 404 |
| `NOTIFICATION_PREFERENCE_LOCKED` | 422 |
| `NOTIFICATION_UNKNOWN_EVENT` | 422 |
| `NOTIFICATION_NO_RECIPIENTS` | 422 |
| `VALIDATION_ERROR` | 422 — `Notify`: key `data` tidak dideklarasikan event, parameter wajib kurang, `ref.id` bukan UUID; `POST /devices`: `locale` bukan `id`/`en` |
| `NOTIFICATION_INVALID_TICKET` | 401 |
| `NOTIFICATION_REALTIME_UNAVAILABLE` | 503 (server tanpa Redis) |

## Kontrak antar modul — `internal/shared/notify`

Modul pengirim bergantung pada paket bersama `shared/notify`, **bukan** modul notification (modul notification mengimpor auth, sehingga auth tidak bisa mengimpornya). Setiap modul menerima `*notify.Deferred` lewat `SetNotifier` (auth: `SetNotifications(notifier, devices)`) di `cmd/api` & `cmd/worker`; sebelum di-set, `Notify` = no-op.

```go
type Notifier interface {
    Notify(ctx context.Context, req Request) error
}

type Request struct {
    TenantID    *string            // tenant kejadian; nil = konteks platform
    EventKey    string             // wajib ada di katalog
    Recipients  Recipients         // UserIDs dan/atau Permission{Key, BranchID}
    Params      map[string]string  // placeholder teks (*_date, *_month diformat per bahasa)
    Data        map[string]string  // data tambahan; hanya key DataKeys event
    Ref         *Ref               // {Type, ID}; ID UUID atau kosong
    DedupeKey   string             // kosong = dibuat otomatis per panggilan
    ActorUserID *string            // dikeluarkan dari penerima
}
```

`notification.Contract` (dipakai wiring) = `notify.Notifier` + `RevokeDevices(ctx, userID)` (auth: password diganti, akun dinonaktifkan).

- `Recipients.Permission` = semua anggota **aktif** tenant yang memegang permission itu dengan scope lebih luas dari `self` — tenant-wide, atau di branch tertentu bila `BranchID` diisi. Butuh `TenantID`.
- Event `ScopeAccount`: `TenantID` hanya dipakai me-resolve `Permission`; notifikasi disimpan tanpa tenant dan penerima tidak difilter membership.
- Resolusi penerima memakai `auth.Contract.FilterActiveMembers` dan `ListUserIDsWithPermission` (hanya untuk memilih penerima, bukan keputusan akses).
- `Notify` hanya menulis outbox lewat transaksi di `ctx`. Pemicu tanpa transaksi (perubahan jadwal, auto clock-out, tagihan terbit, peringatan trial, undangan) memanggilnya setelah simpan berhasil dan hanya mencatat log bila gagal.

## Routing key worker

Queue `hr_system.worker.notification`:

| Routing key | Payload | Handler |
|---|---|---|
| `notification.dispatch` | `DispatchMessage` (request + `requested_at`) | Dispatch |
| `notification.deliver.email` | `{ "delivery_id" }` | Kirim email |
| `notification.deliver.push` | `{ "delivery_id" }` | Kirim push |
| `notification.retention.purge` | `{}` (scheduler, harian) | Retensi |
