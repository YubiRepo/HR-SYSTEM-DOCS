<!-- 📁 plans/2026-11-27-modul-notification.md -->
# Rencana: Modul Notification (in-app, email, push)

| | |
|---|---|
| **Status** | **Kode selesai, menunggu uji E2E.** Fase 1–16 selesai (API, BO, dokumen modul [notification](../modules/notification/README.md) & [mobile](../modules/mobile/api/notification.md)). Fase 17: migrasi `20261127000009_notification_tables` belum dijalankan; skenario uji ada di [05-operations](../modules/notification/05-operations.md). |
| **Tanggal** | 2026-11-27 |
| **Pemicu** | Belum ada notifikasi untuk user. Approval berjenjang, kontrak yang mau habis, dan slip gaji tidak memberi tahu siapa pun. Email hanya dipakai auth (verifikasi/reset/undangan), dan sender kontrak core-hr masih `Noop`. |
| **Cakupan** | **Arsitektur saja**: dari modul pengirim mem-publish ke outbox sampai notifikasi terkirim (in-app, email, push, realtime), plus inbox & preferensi. **Daftar event dan integrasi ke modul pengirim (approval, core-hr, payroll, attendance) menyusul** di plan terpisah. Verifikasi end-to-end memakai event uji `system.test`. |
| **Referensi** | Modul notifikasi `k-forum-api` (lihat [§1.2](#_1-2-referensi-k-forum-api)). |
| **Modul terdampak** | HR-API: modul baru `notification`; messaging & scheduler (infrastruktur). HR-BO: header (bell), halaman inbox, halaman preferensi. Docs: modul baru [notification](../modules/notification/). |
| **Mengubah keputusan** | Mewujudkan lapisan "Notifikasi & Event" di [HRMS_Module_Architecture.md](../architectures/HRMS_Module_Architecture.md) sebagai modul tersendiri. |

### Repo & tag

| Tag | Peran | Path repo |
|---|---|---|
| `[HR-API]` | Target | `/home/yubi/Data/projects/easy-hr/HR-SYSTEM-API` |
| `[HR-BO]` | Target | `/home/yubi/Data/projects/easy-hr/HR-SYSTEM-BACKOFFICE` |
| `[DOCS]` | Target | `/home/yubi/Data/projects/easy-hr/HR-SYSTEM-DOCS` |
| `[KF-API]` | Referensi | `/home/yubi/Data/projects/k-forum-ws/k-forum-api` |

Path file dalam fase ditulis relatif terhadap root repo tag tersebut.

Aturan kerja: commit hanya jika diminta; migrasi ditulis tetapi dijalankan oleh user; `graphify update .` setelah mengubah kode; teks UI dalam bahasa Inggris; env baru di section fitur di bagian bawah `.env.example`; halaman list BO tanpa stat card.

---

## 1. Kondisi saat ini

### 1.1 HR System `[HR-API]` / `[HR-BO]`

| Bagian | Kondisi |
|---|---|
| **Messaging** | `internal/modules/messaging`: tabel `event_outbox` (relay → RabbitMQ), `message_job` + retry policy (error `Fatal` / `Retryable`), `Registry` routing key → handler. `OutboxRepository.Save` sudah ikut transaksi pemanggil (`database.ExecerFromContext`). Saat ini outbox hanya dipakai scheduler. |
| **Scheduler** | `internal/modules/scheduler`: job berulang (cron) → outbox → worker. Bisa dipakai untuk pengingat dan pembersihan data. |
| **Proses** | `cmd/api` (HTTP) dan `cmd/worker` (consumer). Redis sudah ada (session/principal cache). |
| **Email** | `auth/infrastructure/user/external/smtp_notification_sender.go` (verifikasi, reset, undangan). Pengirim lain belum ada. |
| **Core-HR** | `ports.NotificationSender.SendContractExpiringNotice` hanya punya implementasi `Noop`. |
| **Approval** | Engine (`approval/application/engine`) menangani `Submit` / `Decide` (`advanced`, `final_approved`, `rejected`) / `Cancel` untuk cuti, lembur, koreksi absensi, dan payroll run. `Directory` sudah bisa menemukan `UserID` atasan di tiap level. Tidak ada notifikasi ke approver maupun pengaju. |
| **BO** | Tidak ada bell atau inbox. `app/pages/platform/settings/notifications.vue` masih isian contoh template Nuxt UI (dummy). |

### 1.2 Referensi k-forum-api

| Bagian | File `[KF-API]` | Catatan |
|---|---|---|
| Schema | `internal/migrations/0007_create_notification_tables.up.sql` | `notifications` (blueprint + audience) dan `delivery_attempts` (satu baris = user × channel, termasuk `read_at` in-app), `device_registrations`, `notification_preferences` (JSONB per modul + DND), `notification_send_logs` (kirim manual dari BO) |
| Dispatcher | `internal/app/service/notification/dispatcher.go` | `Dispatch(template, target)`; target `unicast` / `multicast` / `broadcast` (fanout batch lewat outbox); resolve channel per user lewat preference gate |
| Template | `NotificationTemplate{Type, Text, Payload{Module, EventType, EntityID, DeepLink}, Channels, EventKey}` | `EventKey` = `{module}.{event}[.{entity}]` untuk gate preferensi |
| i18n | `service/notification/notifi18n` + `locales/{en,id,ko}.json` | Teks dirender per bahasa penerima |
| Pemicu | `internal/interfaces/mq/handler/*_handler.go` | Tiap modul mempublikasikan event domain; handler MQ memetakan event → `Dispatch` |
| Channel | `infrastructure/external/{fcm,smtp,twilio,fonnte}` | Push FCM, email, SMS/WA |
| Realtime | `internal/interfaces/ws/{hub,hub_consumer,handler}.go` | WebSocket hub di proses API; worker mengirim lewat queue `inapp delivery`, hub meneruskan ke user online |
| Retry | `usecase/notification/channel_retrier.go`, `retry_push_delivery.go` | Retry push yang gagal, nonaktifkan token FCM yang invalid (`push_deactivate.go`) |
| Preferensi | `domain/notification/service/module_preference_gate.go` | Gate per modul/event + Do Not Disturb (timezone device) |
| API | `router.go` | `GET /notifications`, `GET /unread-count`, `PATCH /:id/read`, `PATCH /read-all`, `POST /fcm/register`, `GET /ws/notifications`, admin `POST /notifications/send|broadcast` |

**Yang diambil:** satu pintu pengiriman (dispatcher), template berbasis `event_key` + katalog teks, payload dengan `module`/`entity_id`/`link` untuk navigasi, pemisahan *notifikasi* vs *pengiriman per channel*, in-app selalu dicatat ke DB lebih dulu (realtime hanya best-effort), registrasi device FCM + nonaktifkan token invalid, gate preferensi per event.

**Yang disederhanakan / tidak diambil:**
- **Blueprint + audience broadcast.** k-forum perlu broadcast ke seluruh user aplikasi. Di HR, penerima selalu jelas (approver, pengaju, admin tenant) dan jumlahnya kecil per tenant. Satu baris `notifications` **per penerima** sudah cukup dan membuat query inbox, unread count, dan isolasi tenant jauh lebih sederhana.
- **Dispatcher dipanggil dari handler MQ per event bisnis.** HR belum punya event domain. Sebagai gantinya, modul pengirim memanggil `notification.Contract.Notify(...)` yang menulis ke outbox **di dalam transaksi pemanggil**. Pengiriman sebenarnya terjadi di worker.
- **Retrier sendiri.** HR sudah punya `message_job` + retry policy di modul messaging; tiap channel (email/push) dijadikan job terpisah sehingga retry memakai mekanisme yang ada.
- **Do Not Disturb, kirim manual/broadcast dari BO, SMS/WA.** Tidak masuk cakupan awal (§6).

---

## 2. Arsitektur target

### 2.1 Alur

```
 Modul pengirim (approval, core-hr, payroll, ...)
   dalam transaksi bisnis:
     notification.Notify(ctx, Request{TenantID, EventKey, Recipients, Params, Ref, DedupeKey})
        └── event_outbox  (routing: notification.dispatch)          ← atomik dengan data bisnis
                       │
                outbox relay → RabbitMQ
                       │
 cmd/worker  ── handler notification.dispatch
                 1. resolve penerima (user IDs / permission di tenant/branch)
                 2. buang user tanpa membership aktif di tenant
                 3. render teks dari katalog (event_key + params, bahasa user)
                 4. INSERT notifications (in-app) — idempotent via dedupe_key
                 5. per channel yang diizinkan preferensi:
                      email → outbox notification.deliver.email
                      push  → outbox notification.deliver.push
                 6. publish realtime (Redis pub/sub)  ← best-effort
                       │
            ┌──────────┴───────────┐
   handler deliver.email     handler deliver.push
   (SMTP, retry via          (FCM HTTP v1, retry, token
    message_job)              invalid → device nonaktif)

 cmd/api ── GET /notifications, unread-count, read, preferences, devices
         └─ GET /notifications/stream (WebSocket) ← subscribe Redis per user
```

Tahapan dari publish sampai terkirim:

| # | Tahap | Proses | Penyimpanan / status | Kalau gagal |
|---|---|---|---|---|
| 1 | **Publish** | Modul pengirim memanggil `Notify(ctx, req)` di dalam transaksi bisnisnya | `event_outbox` (`pending`), routing `notification.dispatch` | Validasi gagal (event key tidak dikenal, penerima kosong) → error ke pemanggil, transaksi bisnis yang memutuskan rollback |
| 2 | **Relay** | Outbox relay (sudah ada) mengklaim baris dengan lease → publish ke RabbitMQ | `event_outbox` → `published` | Publish gagal → lease dilepas, dicoba lagi di tick berikutnya |
| 3 | **Dispatch** | Worker `notification.dispatch`: resolve penerima → buang yang tidak punya membership aktif & aktor → render teks → simpan inbox → tentukan channel | `notifications` (1 baris per penerima, `ON CONFLICT (user_id, dedupe_key) DO NOTHING`), `notification_deliveries` (`pending`) | Error DB/gateway → `Retryable` (retry policy `message_job`); payload rusak → `Fatal` |
| 4 | **Fan-out channel** | Masih di transaksi tahap 3: satu outbox per channel eksternal | `event_outbox`: `notification.deliver.email`, `notification.deliver.push` | Ikut rollback tahap 3, jadi tidak ada notifikasi tanpa job pengiriman |
| 5 | **Realtime** | Setelah commit tahap 3: publish ke Redis `notif:user:<id>` → hub WebSocket di `cmd/api` → browser | Tidak disimpan | Diabaikan (best-effort); BO tetap sinkron lewat `unread-count` |
| 6 | **Kirim email** | Worker `deliver.email`: cek status delivery (idempotensi) → SMTP | `notification_deliveries` → `sent` / `failed`, `attempts++` | Error sementara → `Retryable`; alamat invalid → `Fatal` + `failed` |
| 7 | **Kirim push** | Worker `deliver.push`: ambil device aktif user → FCM | `notification_deliveries` → `sent` / `failed`; device invalid → `active = false` | Error sementara → `Retryable`; semua token invalid → `failed` |
| 8 | **Baca** | User membuka inbox / klik notifikasi | `notifications.read_at` | — |

### 2.2 Struktur modul `[HR-API]`

Mengikuti pola modul lain (`approval`, `messaging`):

```
internal/modules/notification/
├── contract.go                 # Contract: Notify(...) + tipe Request/Recipient yang diekspor
├── module.go                   # wiring, RegisterRoutes, RegisterMessageHandlers, EnsureScheduledJobs
├── domain/
│   ├── notification/           # entity Notification, Delivery; constant (channel, status, category)
│   ├── device/                 # entity DeviceRegistration
│   ├── preference/             # entity Preference + aturan event wajib
│   └── repository/interfaces.go
├── application/
│   ├── catalog/                # katalog event: key → kategori, channel default, wajib?, teks (en/id), link
│   ├── command/                # notify (tulis outbox), dispatch, deliver_email, deliver_push,
│   │                           # mark_read, mark_all_read, update_preferences, register_device, purge
│   ├── query/                  # list, unread_count, get_preferences
│   └── ports/                  # RecipientResolver, MembershipChecker, EmailSender, PushSender,
│                               # RealtimePublisher, OutboxWriter, UserLocale
├── infrastructure/
│   ├── persistence/            # repo Postgres
│   ├── email/                  # SMTP + template HTML/teks
│   ├── push/                   # FCM HTTP v1 (+ Noop bila tidak dikonfigurasi)
│   ├── realtime/               # Redis pub/sub publisher & subscriber
│   └── authgateway/            # resolve user by permission, cek membership, bahasa user
└── interfaces/
    ├── http/                   # handler + router inbox, preferences, devices, stream
    └── mq/                     # routing key + register handler worker
```

Batas modul: pengirim hanya bergantung pada `notification.Contract` lewat port kecil di modul masing-masing (pola yang sama dengan `scheduler/application/ports/outbox.go`), tidak mengimpor paket internal notification.

### 2.3 Kontrak untuk modul lain

```go
type Request struct {
    TenantID   *string           // nil = sesi platform (staf platform)
    EventKey   string            // mis. "approval.pending", wajib ada di katalog
    Recipients Recipients
    Params     map[string]string // isi placeholder teks: requester_name, document_label, ...
    Ref        *Ref              // {Type: "leave_request", ID: "..."} untuk link & grouping
    DedupeKey  string            // mis. "approval.pending:<request_id>:<level>"
    ActorUserID *string          // tidak menerima notifikasi atas aksinya sendiri
}

type Recipients struct {
    UserIDs    []string
    Permission *PermissionAudience // {Key: "employees:write", BranchID: *string} → semua user tenant/branch
}

type Contract interface {
    Notify(ctx context.Context, req Request) error // validasi + tulis outbox (ikut tx ctx)
}
```

`Notify` tidak mengirim apa pun secara langsung. Jika transaksi bisnis di-rollback, notifikasi ikut batal.

### 2.4 Katalog event

Katalog di kode (`application/catalog`), bukan di DB — setiap event baru = perubahan kode yang ter-review. Satu entri:

```go
Event{
    Key:      "approval.pending",
    Category: CategoryApproval,
    Channels: []Channel{InApp, Email, Push},  // default
    Mandatory: false,                          // true = tidak bisa dimatikan user
    Text: map[Lang]Text{
        "en": {Title: "Approval needed", Body: "{requester_name} submitted {document_label} for your approval."},
        "id": {Title: "Butuh persetujuan", Body: "{requester_name} mengajukan {document_label} untuk Anda setujui."},
    },
    Link: "/approvals/{ref_id}",               // path BO; mobile memakai module + ref
}
```

Di plan ini katalog hanya berisi satu event:

| Event key | Penerima | Pemicu | Channel default |
|---|---|---|---|
| `system.test` | User yang memanggil | `POST /notifications/test` (hanya aktif bila `NOTIFICATION_TEST_ENDPOINT_ENABLED=true`, untuk dev/staging) | in-app, email, push |

Event ini dipakai untuk menguji seluruh jalur (outbox → worker → inbox → email/push → realtime) tanpa menyentuh modul bisnis.

**Daftar event bisnis menyusul** di plan terpisah, misalnya approval (pengajuan menunggu, disetujui, ditolak), kontrak hampir habis, slip gaji terbit, dan auto clock-out. Setiap event cukup menambah entri katalog dan satu panggilan `Notify` di modul pengirim, tanpa mengubah arsitektur.

Email auth (verifikasi, reset password, undangan) **tetap di modul auth** pada rencana ini karena bersifat transaksional dan tidak perlu inbox. Bisa dipindah ke channel email modul notification di kemudian hari.

### 2.5 Model data

Migrasi `[HR-API]` `migrations/<ts>_notification_tables.{up,down}.sql`:

```sql
-- Satu baris = satu notifikasi untuk satu penerima (inbox in-app).
CREATE TABLE IF NOT EXISTS notifications (
    id           UUID PRIMARY KEY,
    tenant_id    UUID,                       -- NULL = konteks platform
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_key    VARCHAR(100) NOT NULL,
    category     VARCHAR(30)  NOT NULL,
    title        VARCHAR(255) NOT NULL,
    body         TEXT         NOT NULL,
    link         TEXT,
    ref_type     VARCHAR(50),
    ref_id       UUID,
    data         JSONB        NOT NULL DEFAULT '{}',
    dedupe_key   VARCHAR(200) NOT NULL,
    read_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_dedupe        ON notifications (user_id, dedupe_key);
CREATE INDEX        IF NOT EXISTS idx_notif_inbox         ON notifications (user_id, tenant_id, created_at DESC);
CREATE INDEX        IF NOT EXISTS idx_notif_inbox_unread  ON notifications (user_id, tenant_id) WHERE read_at IS NULL;

-- Satu baris = satu pengiriman channel eksternal (email/push) untuk satu notifikasi.
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id                  UUID PRIMARY KEY,
    notification_id     UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    channel             VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'push')),
    status              VARCHAR(10) NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
    attempts            INT NOT NULL DEFAULT 0,
    provider_message_id TEXT,
    last_error          TEXT,
    sent_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (notification_id, channel)
);

-- Token push per device (mobile).
CREATE TABLE IF NOT EXISTS notification_devices (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token         TEXT NOT NULL UNIQUE,
    platform      VARCHAR(10) NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
    device_id     VARCHAR(255),
    device_name   VARCHAR(255),
    app_version   VARCHAR(50),
    active        BOOLEAN NOT NULL DEFAULT true,
    last_seen_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_devices_user_active ON notification_devices (user_id) WHERE active;

-- Override preferensi. Tidak ada baris = pakai default katalog.
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category    VARCHAR(30) NOT NULL,
    channel     VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'push')),
    enabled     BOOLEAN NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, category, channel)
);
```

Catatan desain:
- **Preferensi per kategori × channel**, bukan per event (kategori: `approval`, `employment`, `payroll`, `attendance`, `system`). Lebih mudah dipahami user daripada JSONB per modul ala k-forum. In-app tidak bisa dimatikan; event `Mandatory` mengabaikan preferensi.
- **Preferensi global per user, bukan per tenant.** User multi-tenant cukup mengatur sekali.
- **Inbox per tenant**: list & unread count difilter `tenant_id` dari token aktif, sehingga notifikasi tenant A tidak terlihat saat user sedang di tenant B.

### 2.6 Kontrak API (`/api/v1`, wajib login)

| Method & path | Keterangan |
|---|---|
| `GET /notifications?filter[unread]=true&filter[category]=&page=&per_page=` | Inbox tenant aktif, urut terbaru. Memakai pagination halaman standar API (bukan cursor) agar konsisten dengan endpoint list lain |
| `GET /notifications/unread-count` | `{ "count": 3 }` |
| `PATCH /notifications/:id/read` | Tandai satu dibaca (hanya milik sendiri) |
| `POST /notifications/read-all` | Tandai semua dibaca di tenant aktif (opsional body `{ "category": "..." }`) |
| `GET /notifications/preferences` | `{ channels: ["email","push"], items: [{ category, channel, enabled, available, locked }] }`. Hanya channel yang aktif di deployment yang muncul. `locked` = semua event di sel itu wajib |
| `PUT /notifications/preferences` | Body `{ items: [{ category, channel, enabled }] }`, atomik; sel `locked` ditolak `NOTIFICATION_PREFERENCE_LOCKED`. Respons = matriks baru |
| `POST /notifications/devices` | Daftar/refresh token FCM `{ token, platform, device_id, device_name, app_version }` (upsert by token) |
| `DELETE /notifications/devices/:id` | Hapus device (juga dipanggil saat logout di mobile) |
| `POST /notifications/stream/ticket` | Ticket sekali pakai untuk membuka WebSocket (§2.7) |
| `GET /notifications/stream?ticket=` | WebSocket realtime (di luar auth middleware, otorisasi lewat ticket). Event: `connected`, `notification.created` (berisi notifikasi baru). Tidak ada event `unread_count`: BO memanggil `unread-count` saat menerima `notification.created` |
| `POST /notifications/test` | Kirim `system.test` ke diri sendiri. Hanya aktif bila `NOTIFICATION_TEST_ENDPOINT_ENABLED=true` |

Tidak ada permission RBAC khusus: semua endpoint hanya mengakses data milik user sendiri.

### 2.7 Realtime

- Worker mem-publish `{user_id, tenant_id, notification}` ke channel Redis `notif:user:<user_id>` setelah baris tersimpan.
- `cmd/api` menyimpan koneksi WebSocket per user (pola hub k-forum), subscribe Redis, dan hanya meneruskan notifikasi yang `tenant_id`-nya sama dengan tenant sesi koneksi.
- Auth WebSocket: browser tidak bisa mengirim header `Authorization` di WebSocket, jadi BO meminta **ticket sekali pakai** (`POST /notifications/stream/ticket`, TTL 30 detik, disimpan di Redis) lalu membuka `wss://.../notifications/stream?ticket=...`. Access token tidak masuk URL/log.
- Realtime bersifat best-effort. BO tetap memanggil `unread-count` saat fokus kembali ke tab dan polling 60 detik sebagai fallback.
- Redis dipilih ketimbang exchange RabbitMQ baru karena sudah tersedia, tidak mengubah topologi broker, dan cocok untuk pesan yang boleh hilang.

### 2.8 Konfigurasi

Section baru di bagian bawah `.env.example` / `.env.staging.example` `[HR-API]`:

```dotenv
# --- Notification -----------------------------------------------------------
NOTIFICATION_EMAIL_ENABLED=true          # pakai SMTP_* yang sudah ada
NOTIFICATION_PUSH_ENABLED=false
FCM_PROJECT_ID=
FCM_CREDENTIALS_FILE=                    # path service account JSON
NOTIFICATION_RETENTION_DAYS=180          # notifikasi yang sudah dibaca dihapus setelah N hari
NOTIFICATION_BO_BASE_URL=                # untuk link absolut di email
NOTIFICATION_TEST_ENDPOINT_ENABLED=false # true hanya di dev/staging
```

---

## 3. Hal yang perlu diperhatikan

1. **Atomik dengan transaksi bisnis.** `Notify` hanya menulis outbox lewat `ExecerFromContext`. Pemanggil wajib memanggilnya di dalam `Transactor.WithTx` yang sama dengan perubahan bisnisnya; kalau dipanggil di luar transaksi, tetap aman tetapi tidak atomik.
2. **Idempotensi.** Outbox/RabbitMQ bersifat *at-least-once*. `UNIQUE (user_id, dedupe_key)` + `ON CONFLICT DO NOTHING` mencegah notifikasi ganda; job email/push memeriksa status `notification_deliveries` sebelum mengirim.
3. **Isolasi tenant.** Penerima yang tidak lagi punya membership aktif di tenant dibuang saat dispatch. Query inbox selalu memfilter `tenant_id` dari token, bukan dari parameter.
4. **Jangan memberi tahu pelaku aksi.** `ActorUserID` dikeluarkan dari daftar penerima (mis. admin yang menyetujui pengajuannya sendiri).
5. **Data sensitif.** Isi push dan email tidak boleh memuat nominal gaji atau alasan medis. Untuk slip gaji cukup "Your payslip for November 2026 is available".
6. **Bahasa.** Katalog `en` + `id`. Sumber bahasa penerima belum ada di HR (`users` tidak punya `locale`); sampai ada, pakai default tenant atau `en`. Lihat keputusan §5.
7. **Integrasi Jewelry.** Modul ini tidak bergantung pada asal autentikasi; penerima tetap `user_id` HR. Pada branch `jewerly-integration`, resolve "user dengan permission X" harus membaca permission dari proyeksi Jewelry (Fase 13 [plan Jewelry](./2026-11-16-integrasi-jewelry-identity-rbac.md)), jadi port `RecipientResolver` diimplementasikan ulang di sana.
8. **Volume.** Tidak ada broadcast ke seluruh tenant di cakupan awal. Kalau nanti dibutuhkan (pengumuman perusahaan), tambahkan fanout bertahap (batch) seperti `dispatchBroadcast` k-forum.

---

## 4. Fase pengerjaan

### Bagian A — Fondasi backend

#### Fase 1 — Kerangka modul & migrasi `[HR-API]`
- Buat `internal/modules/notification` dengan struktur §2.2, `module.go` kosong yang di-wire di `cmd/api` dan `cmd/worker`.
- Migrasi tabel §2.5 (up & down).
- Section env §2.8 + `NotificationConfig` di `internal/shared/config/config.go`.

#### Fase 2 — Domain & repository `[HR-API]`
- Entity `Notification`, `Delivery`, `DeviceRegistration`, `Preference`; konstanta channel/status/kategori.
- Repository Postgres (ikut transaksi via `ExecerFromContext`): insert idempotent, list cursor, unread count, mark read, mark all read, upsert device, preferensi.
- Unit test repository untuk filter tenant & idempotensi.

#### Fase 3 — Katalog & `Notify` `[HR-API]`
- `application/catalog` dengan event §2.4, renderer placeholder, validasi (key tidak dikenal = error saat test/startup).
- `contract.go` + command `notify`: validasi request, tulis outbox `notification.dispatch`.
- Adapter outbox (pola `outboxWriterAdapter` di `cmd/worker/main.go`).

#### Fase 4 — Dispatch & in-app `[HR-API]`
- Handler worker `notification.dispatch`: resolve penerima (`authgateway`: user by permission di tenant/branch, cek membership), buang aktor, render, insert `notifications`, buat `notification_deliveries` + outbox `deliver.email` / `deliver.push` sesuai katalog & preferensi.
- Daftarkan routing key & queue `hr_system.worker.notification` di `interfaces/mq` + `RegisterMessageHandlers`.
- Unit test dispatch: penerima ganda, membership nonaktif, aktor, dedupe, preferensi mati, event wajib.

#### Fase 5 — API inbox `[HR-API]`
- Handler + route §2.6 (kecuali stream & devices). Swagger annotation.
- Platform session (tanpa tenant) melihat notifikasi `tenant_id IS NULL`.

#### Fase 6 — Channel email `[HR-API]`
- `infrastructure/email`: SMTP memakai konfigurasi `SMTP_*` yang ada, template HTML + teks satu layout (judul, isi, tombol ke `NOTIFICATION_BO_BASE_URL + link`).
- Handler `notification.deliver.email`: error jaringan/SMTP 4xx → `Retryable`; alamat invalid → `Fatal` + status `failed`.

#### Fase 7 — Event uji `[HR-API]`
- Entri katalog `system.test` + endpoint `POST /notifications/test` di balik flag env.
- Contoh panggilan `Notify` dari modul lain didokumentasikan di `contract.go` sebagai acuan plan integrasi berikutnya.

> Integrasi modul pengirim (approval, core-hr, payroll, attendance) **tidak termasuk** plan ini — menyusul di plan daftar event.

### Bagian B — Preferensi, push, realtime, retensi

#### Fase 8 — Preferensi `[HR-API]`
- Query & command preferensi (§2.6), gabungkan default katalog + override, tolak perubahan pada sel wajib.

#### Fase 9 — Push FCM `[HR-API]`
- `infrastructure/push`: FCM HTTP v1 (service account), `Noop` bila `NOTIFICATION_PUSH_ENABLED=false`.
- Endpoint device (§2.6). Handler `notification.deliver.push`: kirim ke semua device aktif user; token `UNREGISTERED`/`INVALID_ARGUMENT` → device nonaktif (pola `push_deactivate.go` k-forum).
- Payload data: `notification_id`, `event_key`, `ref_type`, `ref_id`, `tenant_id` untuk deep link mobile.

#### Fase 10 — Realtime `[HR-API]`
- Publisher Redis di worker; hub WebSocket + subscriber di `cmd/api`; endpoint ticket + stream (§2.7). Batas koneksi per user dan ping/pong.

#### Fase 11 — Retensi `[HR-API]`
- Job scheduler harian: hapus notifikasi yang sudah dibaca dan lebih tua dari `NOTIFICATION_RETENTION_DAYS`, serta notifikasi belum dibaca yang lebih tua dari 2× nilai itu.

### Bagian C — Backoffice

#### Fase 12 — Bell & inbox `[HR-BO]`
- Bell di header `app/layouts/default.vue` dengan badge unread, dropdown 10 terbaru, "Mark all as read", tautan ke halaman inbox.
- Halaman `/notifications` (list + filter kategori/unread, tanpa stat card). Klik item → mark read → navigasi ke `link`.
- Store/composable `useNotifications` (unread count, refresh saat tab fokus, polling 60 detik).
- Di layout ESS, bell yang sama di header mobile web.

#### Fase 13 — Halaman preferensi `[HR-BO]`
- Ganti isi dummy `app/pages/platform/settings/notifications.vue` dengan matriks kategori × channel dari API; sel wajib terkunci dengan keterangan.

#### Fase 14 — Realtime di BO `[HR-BO]`
- Composable WebSocket (ticket → connect → reconnect dengan backoff), update badge & toast saat `notification.created`; tetap ada fallback polling.

### Bagian D — Dokumentasi & uji

#### Fase 15 — Dokumen modul `[DOCS]`
- Folder baru `modules/notification/` (README, overview, data model, event catalog, API contract) mengikuti format `modules/approval/`.
- Perbarui [HRMS_Module_Architecture.md](../architectures/HRMS_Module_Architecture.md) dan `modules/index.md`.

#### Fase 16 — Kontrak mobile `[DOCS]`
- `modules/mobile/api/`: endpoint inbox, device registration, format payload push & deep link.

#### Fase 17 — Uji E2E
Semua skenario memakai `POST /notifications/test` (`system.test`):
- Jalur lengkap: panggil endpoint → baris `event_outbox` → worker → baris `notifications` → badge BO bertambah tanpa reload (realtime) → email masuk → push masuk di device uji.
- Rollback: `Notify` di dalam transaksi yang di-rollback tidak menghasilkan notifikasi (unit/integration test).
- User multi-tenant: notifikasi hanya muncul di tenant yang benar.
- Preferensi email dimatikan → hanya in-app. Event wajib tetap terkirim.
- Worker mati saat publish → notifikasi terkirim setelah worker hidup kembali (outbox menahan).
- Token FCM invalid → device menjadi nonaktif.
- Redelivery pesan outbox tidak menggandakan notifikasi.
- SMTP mati → job retry lalu terkirim setelah SMTP hidup.

---

## 5. Keputusan yang perlu dikonfirmasi

| # | Pertanyaan | Usulan |
|---|---|---|
| 1 | Model data | **Satu baris per penerima** (bukan blueprint + delivery ala k-forum) |
| 2 | Cara modul memicu notifikasi | **`notification.Contract.Notify` di dalam transaksi** (outbox), bukan event domain + handler per event |
| 3 | Granularitas preferensi | **Kategori × channel**, global per user; in-app selalu aktif |
| 4 | Bahasa notifikasi | Katalog `en` + `id`; default per tenant sampai user punya pengaturan bahasa |
| 5 | Realtime | **WebSocket + Redis pub/sub** dengan ticket; polling sebagai fallback |
| 6 | Email auth (verifikasi/reset/undangan) | **Tetap di auth** untuk sekarang |
| 7 | Urutan pengerjaan | Tahap 1 = Fase 1–7 + 12 (jalur outbox → in-app + email, bell BO). Tahap 2 = preferensi, push, realtime, retensi |

## 6. Di luar cakupan

- **Daftar event bisnis & integrasi modul pengirim** (approval, core-hr, payroll, attendance) — plan terpisah setelah arsitektur ini siap.
- Kirim manual / broadcast dari BO (fitur "notification tester" k-forum).
- SMS / WhatsApp.
- Do Not Disturb dan digest harian/mingguan.
- Pengaturan event per tenant (tenant mematikan event tertentu).
- Push web (browser) — kolom `platform = 'web'` sudah disiapkan.
