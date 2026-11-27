<!-- 📁 modules/notification/03-event-catalog.md -->
# 03 · Event Catalog

Katalog ada di kode (`internal/modules/notification/application/catalog/catalog.go`), bukan di database: setiap event baru adalah perubahan kode yang ter-review. `catalog.Validate()` dijalankan saat modul dibangun dan di unit test — entri tidak lengkap menggagalkan startup.

## Struktur entri

| Field | Arti |
|---|---|
| `Key` | `{modul}.{kejadian}`, mis. `approval.pending` |
| `Category` | Salah satu kategori (preferensi & filter) |
| `Channels` | Channel default; wajib memuat `in_app`. Email/push hanya terkirim bila channel aktif di deployment dan tidak dimatikan user |
| `Mandatory` | `true` = mengabaikan preferensi user; sel preferensi yang hanya berisi event wajib tampil terkunci |
| `Text` | Judul & isi per bahasa (`en` wajib, `id` opsional). Placeholder `{nama_param}` diisi dari `Params`; `{ref_id}` otomatis dari `Ref` |
| `Link` | Path BO, mis. `/approvals/{ref_id}`. Kosong = tidak bisa diklik |

## Event terdaftar

| Event key | Kategori | Channel | Penerima | Pemicu |
|---|---|---|---|---|
| `system.test` | system | in-app, email, push | Pemanggil | `POST /api/v1/notifications/test` (hanya bila `NOTIFICATION_TEST_ENDPOINT_ENABLED=true`) |

Event bisnis (approval, kontrak hampir habis, slip gaji, auto clock-out) menyusul di plan daftar event.

## Menambah event baru

1. Tambah entri di `catalog.go` (key, kategori, channel, teks `en` + `id`, link).
2. Di modul pengirim, buat port kecil miliknya sendiri (mis. `ports.Notifier`) dan adapter ke `notification.Contract` — jangan impor paket internal notification.
3. Panggil `Notify` **di dalam** transaksi bisnis, dengan `DedupeKey` yang stabil untuk kejadian itu (mis. `approval.pending:<request_id>:<level>`) dan `ActorUserID` bila ada pelaku.
4. Isi push/email tidak boleh memuat data sensitif (nominal gaji, alasan medis) — cukup judul dan ajakan membuka aplikasi.
5. Tambah unit test pemanggilan di modul pengirim.
