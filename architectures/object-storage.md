# Object Storage (MinIO / S3)

Arsitektur upload dokumen (avatar, bukti pembayaran) — pola **presign → upload → confirm → promote**, diadopsi dari referensi `sipon-be`.

## Infrastruktur

- **MinIO** (S3-compatible) di `docker-compose.dev.yml` (service `minio` + `minio-init`), dua bucket:
  - `public` — avatar user (anonymous read; URL publik langsung).
  - `private` — bukti pembayaran (akses hanya via presigned GET).
- Konfigurasi `STORAGE_*` (lihat `config.go`): `ENDPOINT` (internal, `minio:9000`), `PUBLIC_ENDPOINT` (dijangkau browser, `localhost:9004`), kredensial, bucket, SSL, dan TTL lifecycle `pending/`.
- `shared/storage` adalah **engine** MinIO (interface `FileUploader` + impl + noop). Tiap module **tidak** bergantung langsung padanya di application layer — masing-masing punya **port sendiri** (`application/<modul>/ports.FileUploader`, subset metode yang dibutuhkan) dan **adapter** (`infrastructure/<modul>/external/StorageAdapter`) yang membungkus engine. Engine dibuat sekali di `cmd/api` (MinIO bila `STORAGE_ACCESS_KEY` terisi, else noop) lalu di-inject ke `auth.NewModule` & `platform.NewModule`; module membungkusnya di konstruktor.

## Alur Upload (3 langkah)

```
1. POST <resource>/presign {content_type}
   ──▶ validasi format ──▶ key "pending/<modul>/<...>/<uuid><ext>"
   ──▶ presigned PUT URL (TTL 10–15m, bucket sesuai privacy)
2. Browser: PUT file langsung ke presigned URL (MinIO)
3. POST <resource>/confirm {key}  (atau submit entity dengan key)
   ──▶ KeyFromURL + wajib prefix "pending/"
   ──▶ ConfirmUpload (StatObject — buktikan file ada)
   ──▶ PromoteUpload (copy staging → final, hapus staging)
   ──▶ simpan key final di DB
```

- **Lifecycle**: `EnsurePendingUploadLifecycle(days)` meng-ekspire objek `pending/*` yang ditinggalkan (upload tak pernah di-confirm).
- **Private read**: objek private tidak punya URL publik — API mengembalikan **presigned GET (TTL pendek, 30m)** yang dibuat on-demand (mis. `proof_url` pada PaymentResponse).

## Modul yang memakai

| Modul | Resource | Bucket | Prefix staging → final | Endpoint |
|---|---|---|---|---|
| Auth (avatar) | avatar user | `public` | `pending/avatars/` → `avatars/` | `POST /auth/me/avatar/presign`, `POST /auth/me/avatar/confirm`, `DELETE /auth/me/avatar` |
| Billing (bukti) | bukti pembayaran manual | `private` | `pending/payment-proofs/{tenant}/` → `payment-proofs/{tenant}/` | `POST /billing/invoices/{id}/payments/proof/presign`, `POST /billing/invoices/{id}/payments/manual` (memuat `proof_key`) |

## Konvensi nilai tersimpan

- Avatar disimpan dengan prefix **`s3:`** (objek MinIO) atau **`ext:`** (URL eksternal); resolusi ke URL publik dilakukan di layer response (GetMe/ListUsers). Menghapus avatar: `MarkDeleted` (hapus dari kedua bucket) hanya untuk objek `s3:`/legacy, bukan `ext:`.
- Payment `proof_key` menyimpan key final bucket private; `proof_url` dihitung ulang (presigned GET) tiap list/detail.