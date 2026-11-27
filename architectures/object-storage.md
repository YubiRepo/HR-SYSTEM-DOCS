# Object Storage (SeaweedFS / S3)

Arsitektur upload dokumen (avatar, bukti pembayaran) — pola **presign → upload → confirm → promote**, diadopsi dari referensi `sipon-be`.

## Infrastruktur

- **SeaweedFS** (gateway S3, `weed server -s3`, image dipin `chrislusf/seaweedfs:4.53`) di `docker-compose.dev.yml` — service `seaweedfs` (port host `9004` = S3, `9005` = master) + `seaweedfs-init` (profile `tooling`, `aws s3 mb`, idempoten). Dua bucket:
  - `public` — avatar user (anonymous read; URL publik langsung).
  - `private` — bukti pembayaran & dokumen karyawan/kontrak (akses hanya via presigned GET).
- **Akses** diatur di `deploy/seaweedfs/s3.json`: identity `admin` (kredensial = `STORAGE_ACCESS_KEY`/`STORAGE_SECRET_KEY`, actions `Admin/Read/Write/List/Tagging`) dan identity `anonymous` dengan `Read:public` (pengganti `mc anonymous set public`). File di repo hanya untuk dev; `s3.json` produksi dibuat terpisah dan tidak di-commit.
- Konfigurasi `STORAGE_*` (lihat `config.go`): `DRIVER` (`seaweedfs` default, `minio` deprecated), `ENDPOINT` (internal, `seaweedfs:8333`), `PUBLIC_ENDPOINT` (dijangkau browser, `localhost:9004`), kredensial, bucket, SSL, dan TTL lifecycle `pending/`.
- `shared/storage` adalah **engine** (interface `FileUploader` + `S3FileUploader` berbasis `aws-sdk-go-v2` + `MinioFileUploader` deprecated + noop). `storage.NewFileUploader(driver, ...)` memilih engine dari `STORAGE_DRIVER`. Addressing **path-style**, region dipatok `us-east-1`, checksum otomatis SDK dimatikan (`WhenRequired`) supaya presigned PUT dari browser tidak gagal tanda tangan. Tiap module **tidak** bergantung langsung pada engine di application layer — masing-masing punya **port sendiri** (`application/<modul>/ports.FileUploader`, subset metode yang dibutuhkan) dan **adapter** (`infrastructure/<modul>/external/StorageAdapter`) yang membungkus engine. Engine dibuat sekali di `cmd/api` dan `cmd/worker` (bila `STORAGE_ACCESS_KEY` terisi, else noop) lalu di-inject ke module.
- **MinIO (deprecated)**: service `minio` + `minio-init` tetap ada di profile `legacy` (port host `9006`/`9007`, volume `minio_data`) sebagai sumber migrasi data dan untuk rollback.

## Alur Upload (3 langkah)

```
1. POST <resource>/presign {content_type}
   ──▶ validasi format ──▶ key "pending/<modul>/<...>/<uuid><ext>"
   ──▶ presigned PUT URL (TTL 10–15m, bucket sesuai privacy)
2. Browser: PUT file langsung ke presigned URL (object storage)
3. POST <resource>/confirm {key}  (atau submit entity dengan key)
   ──▶ KeyFromURL + wajib prefix "pending/"
   ──▶ ConfirmUpload (HeadObject — buktikan file ada)
   ──▶ PromoteUpload (copy staging → final, hapus staging)
   ──▶ simpan key final di DB
```

- **Lifecycle**: `EnsurePendingUploadLifecycle(days)` meng-ekspire objek `pending/*` yang ditinggalkan (upload tak pernah di-confirm). Dukungan lifecycle di SeaweedFS hanya sebagian (lewat TTL filer); pemasangan di startup bersifat non-fatal (`Warn`). Kalau ditolak, cleanup `pending/` perlu job worker terpisah (follow-up).
- **Private read**: objek private tidak punya URL publik — API mengembalikan **presigned GET (TTL pendek, 30m)** yang dibuat on-demand (mis. `proof_url` pada PaymentResponse).

## Modul yang memakai

| Modul | Resource | Bucket | Prefix staging → final | Endpoint |
|---|---|---|---|---|
| Auth (avatar) | avatar user | `public` | `pending/avatars/` → `avatars/` | `POST /auth/me/avatar/presign`, `POST /auth/me/avatar/confirm`, `DELETE /auth/me/avatar` |
| Billing (bukti) | bukti pembayaran manual | `private` | `pending/payment-proofs/{tenant}/` → `payment-proofs/{tenant}/` | `POST /billing/invoices/{id}/payments/proof/presign`, `POST /billing/invoices/{id}/payments/manual` (memuat `proof_key`) |

## Konvensi nilai tersimpan

- Avatar disimpan dengan prefix **`s3:`** (objek storage) atau **`ext:`** (URL eksternal); resolusi ke URL publik dilakukan di layer response (GetMe/ListUsers). Menghapus avatar: `MarkDeleted` (hapus dari kedua bucket) hanya untuk objek `s3:`/legacy, bukan `ext:`.
- Payment `proof_key` menyimpan key final bucket private; `proof_url` dihitung ulang (presigned GET) tiap list/detail.

## Migrasi data MinIO → SeaweedFS

DB tidak perlu migrasi: yang tersimpan adalah **key** (bukan URL) dan nama bucket tetap sama. Objek disalin dengan **rclone** (service `storage-migrate`, image `rclone/rclone:1.75.0`, remote dikonfigurasi lewat env `MIGRATE_SRC_*` / `MIGRATE_DST_ENDPOINT` + `STORAGE_*`).

- **Dev**: `make dev-storage-migrate` — menyalakan `minio` (profile `legacy`) + `seaweedfs`, lalu `rclone sync` dan `rclone check` kedua bucket, tanpa `pending/**`. Idempoten; ulangi sampai `check` 0 differences.
- **Non-dev (runbook)**:
  1. Deploy SeaweedFS + `s3.json` produksi (kredensial baru), buat bucket `public`/`private`.
  2. Pre-sync `rclone sync` selagi MinIO masih melayani traffic.
  3. Cutover: hentikan upload / maintenance singkat → `rclone sync` final → `rclone check` sampai 0 differences.
  4. Ganti env API (dan worker): `STORAGE_DRIVER=seaweedfs`, `STORAGE_ENDPOINT`, `STORAGE_PUBLIC_ENDPOINT`, kredensial → deploy ulang.
  5. Smoke test: upload avatar (presign → PUT browser tanpa error CORS → confirm → promote), upload & download bukti bayar / dokumen karyawan, hapus dokumen.
  6. **Rollback**: `STORAGE_DRIVER=minio` + endpoint & kredensial lama. Sebelumnya salin balik objek yang di-upload setelah cutover (`rclone sync dst: src:`). MinIO tetap hidup selama masa observasi.
  7. Decommission MinIO diputuskan terpisah.

Riwayat keputusan: [`../plans/2026-11-08-migrasi-object-storage-seaweedfs.md`](../plans/2026-11-08-migrasi-object-storage-seaweedfs.md).
