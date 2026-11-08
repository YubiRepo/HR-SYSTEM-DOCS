<!-- 📁 plans/2026-11-08-migrasi-object-storage-seaweedfs.md -->
# Rencana: Migrasi Object Storage dari MinIO ke SeaweedFS

| | |
|---|---|
| **Status** | **Rencana — belum dikerjakan.** |
| **Tanggal** | 2026-11-08 |
| **Pemicu** | Object storage (avatar, bukti bayar, dokumen karyawan) dipindah dari MinIO ke **SeaweedFS** lewat S3 gateway-nya. MinIO jadi deprecated. |
| **Keputusan user** | (1) Cakupan **termasuk migrasi data** objek yang sudah ada. (2) Client Go yang baru memakai **aws-sdk-go-v2**, bukan `minio-go`. (3) Implementasi MinIO **tidak dihapus**: kodenya ditandai deprecated dan masih bisa dipakai lewat `STORAGE_DRIVER=minio` untuk rollback. Lihat §2. |
| **Modul terdampak** | `shared/storage` (engine), `shared/config`, `cmd/api`. Modul auth, platform/billing, core-hr, dan leave hanya terdampak di komentar karena kontrak `FileUploader` tidak berubah. |
| **Repo terkait** | HR-SYSTEM-API (utama), HR-SYSTEM-BACKOFFICE (komentar saja), HR-SYSTEM-DOCS |
| **Mengubah keputusan** | [architectures/object-storage.md](../architectures/object-storage.md) §Infrastruktur (MinIO → SeaweedFS) |

---

## 1. Ringkasan

### 1.1 Kondisi saat ini

| Area | Kondisi | Lokasi |
|---|---|---|
| Server storage | MinIO (`minio/minio:latest`) di compose dev. Port host `9004` untuk S3 dan `9005` untuk console. | `HR-SYSTEM-API/docker-compose.dev.yml` service `minio` |
| Init bucket | `minio/mc` membuat bucket `public` (`mc anonymous set public`) dan `private`. | service `minio-init`, target Makefile `minio-init` |
| Engine Go | `MinioFileUploader` (`minio-go/v7`). Ada dua client: satu internal untuk operasi nyata, satu publik khusus presign dan `PublicURL`. | `internal/shared/storage/minio_uploader.go` |
| Kontrak | Interface `FileUploader` + `NoopFileUploader`. Modul membungkusnya lewat port dan adapter masing-masing. | `internal/shared/storage/uploader.go` |
| Wiring | `cmd/api` memanggil `NewMinioFileUploader(...)` dan memasang lifecycle `pending/` (kalau gagal hanya `Warn`). `cmd/worker` memakai noop. | `cmd/api/main.go:78-102` |
| Config | `STORAGE_ENDPOINT` (default `minio:9000`), `STORAGE_PUBLIC_ENDPOINT` (`localhost:9004`), kredensial, bucket, SSL, `STORAGE_PENDING_UPLOAD_LIFECYCLE_DAYS`. | `internal/shared/config/config.go:122-253`, `.env.example:99-114` |
| Nilai tersimpan di DB | Yang disimpan adalah **key**, bukan URL: `s3:<key>`, `ext:<url>`, atau plain key. `KeyFromURL` juga menerima URL lama. | `internal/shared/storage/avatar.go` |

### 1.2 Target

- Storage yang aktif adalah **SeaweedFS** (`weed server -s3`). Bucket `public` bisa dibaca anonim, bucket `private` hanya lewat presigned URL.
- Engine baru `S3FileUploader` memakai aws-sdk-go-v2. Kontraknya sama persis dengan `FileUploader`.
- `MinioFileUploader` dan service `minio` tetap ada, ditandai **deprecated**, dan bisa dipakai lagi lewat config (rollback).
- Objek yang sudah ada di MinIO disalin ke SeaweedFS dengan `rclone`.
- **DB tidak perlu migrasi** karena yang tersimpan adalah key, dan nama bucket tetap sama.

## 2. Keputusan

| # | Keputusan | Alasan |
|---|---|---|
| D1 | Client Go baru memakai **aws-sdk-go-v2** (`aws`, `credentials`, `service/s3`). | Lepas dari library vendor tertentu. Ini SDK S3 standar dan kompatibel dengan SeaweedFS. |
| D2 | **Path-style addressing** (`UsePathStyle: true`), region dipatok `us-east-1`. | SeaweedFS memakai path-style. Format `PublicURL` (`scheme://host/bucket/key`) tetap sama. |
| D3 | Driver dipilih lewat env baru `STORAGE_DRIVER`: `seaweedfs` (default) atau `minio` (deprecated). | Rollback cukup dengan ganti env, tanpa deploy kode. |
| D4 | Kode dan service MinIO **dipertahankan** dan diberi penanda `Deprecated`. | Dibutuhkan untuk migrasi data dan rollback. Kapan dihapus diputuskan terpisah. |
| D5 | Port host S3 tetap `9004`. | `STORAGE_PUBLIC_ENDPOINT=localhost:9004` dan setup frontend tidak perlu diubah. |
| D6 | Akses baca anonim bucket `public` diatur lewat identity `anonymous` dengan `Read:public` di `s3.json`. | SeaweedFS tidak memakai `mc anonymous set`. Ini cara bawaannya. |
| D7 | Migrasi data memakai **rclone** (`sync` lalu `check`), tanpa `pending/**`. | Tool standar S3→S3, idempoten, dan bisa diverifikasi. Upload `pending/` memang sementara. |

## 3. Client Go (HR-SYSTEM-API)

### 3.1 Engine baru: `internal/shared/storage/s3_uploader.go`

- `S3FileUploader` + `NewS3FileUploader(endpoint, publicEndpoint, accessKey, secretKey, bucket, privateBucket string, useSSL, internalUseSSL bool)`. Signature-nya sama dengan `NewMinioFileUploader` dan mengembalikan `nil, nil` kalau endpoint atau kredensial kosong (main lalu fallback ke noop).
- Pola dua client tetap dipakai:
  - `client`: endpoint internal (`seaweedfs:8333`) untuk Head, Copy, Delete, dan Lifecycle.
  - `presigner`: `s3.NewPresignClient` di atas client ber-endpoint publik. Client ini tidak pernah membuka koneksi, jadi endpoint-nya boleh tidak terjangkau dari dalam container.
  - `s3.New(s3.Options{Region: "us-east-1", BaseEndpoint: aws.String(scheme + "://" + endpoint), UsePathStyle: true, Credentials: credentials.NewStaticCredentialsProvider(ak, sk, "")})`
- Pemetaan metode:

| `FileUploader` | aws-sdk-go-v2 |
|---|---|
| `RequestUpload` | `PresignPutObject` dengan `s3.WithPresignExpires(expiry)` |
| `ConfirmUpload` | `HeadObject` di bucket public, lalu bucket private |
| `PromoteUpload` | `CopyObject` (`CopySource` = `bucket/key` yang di-escape per segmen) lalu `DeleteObject` staging |
| `MarkDeleted` | `DeleteObject` di kedua bucket. Gagal hanya kalau keduanya gagal. |
| `DeleteObject` | `DeleteObject` di bucket sesuai privacy |
| `PresignedDownloadURL` | `PresignGetObject` |
| `EnsurePendingUploadLifecycle` | `PutBucketLifecycleConfiguration`: rule `expire-pending-uploads`, prefix `pending/`, `Expiration.Days` |
| `PublicURL` / `KeyFromURL` | Logika sama dengan versi MinIO. Host dan scheme diambil dari public endpoint. |

- `var _ FileUploader = (*S3FileUploader)(nil)`.

### 3.2 Engine lama: deprecated, tidak dihapus

- `minio_uploader.go` tetap ada. Tambahkan `// Deprecated: gunakan S3FileUploader (SeaweedFS). Dipertahankan untuk fallback/rollback.` di tipe `MinioFileUploader` dan di `NewMinioFileUploader`.
- `github.com/minio/minio-go/v7` tetap ada di `go.mod`.

### 3.3 Config dan wiring

- `StorageConfig` mendapat field `Driver string`, dari `getEnv("STORAGE_DRIVER", "seaweedfs")`. Default `STORAGE_ENDPOINT` berubah menjadi `seaweedfs:8333`.
- `cmd/api/main.go` memakai `switch cfg.Storage.Driver`:
  - `seaweedfs` → `storage.NewS3FileUploader(...)`
  - `minio` → `storage.NewMinioFileUploader(...)` + `lg.Warn("storage driver minio is deprecated")`
  - nilai lain → `lg.Error` lalu exit.
- `cmd/worker` tidak berubah (tetap noop).

### 3.4 Test

- `s3_uploader_test.go` (unit, tanpa jaringan): format `PublicURL` (http/https), `KeyFromURL` (plain key, URL bucket public/private, leading slash), dan presigned PUT/GET yang path-style ke host publik (`http://localhost:9004/public/pending/...`).

## 4. Infra dev (`HR-SYSTEM-API/docker-compose.dev.yml`)

### 4.1 Service `seaweedfs` (baru)

```yaml
seaweedfs:
  image: chrislusf/seaweedfs:<tag dipin>
  container_name: hr-system-api_seaweedfs
  command: server -dir=/data -s3 -s3.port=8333 -s3.config=/etc/seaweedfs/s3.json
  ports:
    - "${SEAWEEDFS_S3_EXPOSE_PORT:-9004}:8333"
    - "${SEAWEEDFS_MASTER_EXPOSE_PORT:-9005}:9333"
  volumes:
    - seaweedfs_data:/data
    - ./deploy/seaweedfs/s3.json:/etc/seaweedfs/s3.json:ro
  healthcheck:
    test: ["CMD", "wget", "-qO-", "http://localhost:9333/cluster/status"]
```

- Tag image **dipin** ke versi tertentu, tidak memakai `latest`.
- CORS: browser melakukan PUT langsung ke presigned URL. Gateway S3 SeaweedFS secara default mengizinkan origin `*`. Perlu diverifikasi, dan tambahkan `-s3.allowedOrigins=...` kalau perlu.

### 4.2 `deploy/seaweedfs/s3.json` (baru)

- Identity `admin` memakai kredensial dev (`STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY`) dengan actions `Admin`, `Read`, `Write`, `List`, `Tagging`.
- Identity `anonymous` dengan actions `["Read:public"]`. Ini pengganti `mc anonymous set public`.

### 4.3 Service `seaweedfs-init` (baru, profile `tooling`)

- Image `amazon/aws-cli` (tag dipin). Menjalankan `aws --endpoint-url http://seaweedfs:8333 s3 mb s3://public` dan `s3://private`. Idempoten: error "bucket sudah ada" diabaikan.

### 4.4 Service MinIO (deprecated)

- `minio` dan `minio-init` **tetap ada**, tetapi dipindah ke profile `legacy` sehingga tidak ikut naik saat `dev-up`. Diberi komentar `# DEPRECATED: diganti seaweedfs, dipertahankan untuk migrasi data & rollback`.
- Port host MinIO digeser supaya tidak bentrok dengan SeaweedFS (contoh: `MINIO_EXPOSE_PORT=9006`, `MINIO_CONSOLE_EXPOSE_PORT=9007`).
- Volume `minio_data` tetap ada (sumber data migrasi).

## 5. Migrasi data

### 5.1 Tooling

- Service `storage-migrate` (image `rclone/rclone`, profile `tooling`). Remote dikonfigurasi lewat env, tanpa file config:
  - `RCLONE_CONFIG_SRC_TYPE=s3`, `RCLONE_CONFIG_SRC_PROVIDER=Minio`, `RCLONE_CONFIG_SRC_ENDPOINT=${MIGRATE_SRC_ENDPOINT:-http://minio:9000}`, kredensial `MIGRATE_SRC_ACCESS_KEY` / `MIGRATE_SRC_SECRET_KEY`
  - `RCLONE_CONFIG_DST_TYPE=s3`, `RCLONE_CONFIG_DST_PROVIDER=SeaweedFS`, `RCLONE_CONFIG_DST_ENDPOINT=${MIGRATE_DST_ENDPOINT:-http://seaweedfs:8333}`, kredensial `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY`
- Perintah:
  ```sh
  rclone sync  src:public  dst:public  --exclude "pending/**"
  rclone sync  src:private dst:private --exclude "pending/**"
  rclone check src:public  dst:public  --exclude "pending/**"
  rclone check src:private dst:private --exclude "pending/**"
  ```
- Makefile `storage-migrate`: menyalakan `minio` (profile legacy) dan `seaweedfs`, lalu `run --rm storage-migrate`.

### 5.2 Runbook environment non-dev

1. Deploy SeaweedFS beserta `s3.json` produksi (kredensial baru, **bukan** nilai dev) dan buat bucket `public` / `private`.
2. **Pre-sync**: jalankan `rclone sync` saat MinIO masih melayani traffic.
3. **Cutover**: masuk maintenance singkat atau hentikan upload, lalu jalankan `rclone sync` final dan `rclone check` sampai 0 differences.
4. Ganti env API: `STORAGE_DRIVER=seaweedfs`, `STORAGE_ENDPOINT`, `STORAGE_PUBLIC_ENDPOINT`, dan kredensial. Lalu deploy ulang API.
5. Smoke test (§8 langkah 5).
6. **Rollback**: kembalikan `STORAGE_DRIVER=minio` dan endpoint lama. MinIO tetap hidup selama masa observasi. Objek yang di-upload ke SeaweedFS setelah cutover perlu disalin balik (`rclone sync dst: src:`) sebelum rollback.
7. Kapan MinIO di-decommission diputuskan terpisah.

## 6. Konfigurasi, Makefile, komentar, dan docs

| File | Perubahan |
|---|---|
| `HR-SYSTEM-API/.env.example` | Tambah `STORAGE_DRIVER=seaweedfs`, `SEAWEEDFS_S3_EXPOSE_PORT=9004`, `SEAWEEDFS_MASTER_EXPOSE_PORT=9005`, `STORAGE_ENDPOINT=seaweedfs:8333`, kredensial dev, `MIGRATE_SRC_*`. Blok `MINIO_*` dipertahankan dan diberi label deprecated (port digeser). |
| `internal/shared/config/config.go` | Field `Driver`, default endpoint baru, komentar "S3-compatible (SeaweedFS; MinIO deprecated)". |
| `Makefile` | `dev-up` memakai `seaweedfs seaweedfs-init`. Tambah target `seaweedfs-init` dan `storage-migrate`. `minio-init` tetap ada (deprecated, `--profile legacy`). Update `.PHONY` dan help. |
| Komentar Go | Ganti "MinIO" menjadi "object storage"/"S3" di `shared/storage/uploader.go`, port dan adapter `internal/modules/{auth,platform,core-hr}/.../ports/storage.go` dan `.../external/storage_adapter.go`, `core-hr/.../delete_document.go`, `delete_contract_document.go`, `platform/interfaces/http/billing/handler.go`. Fake URL di `leave/.../attachment_test.go` opsional. |
| `HR-SYSTEM-API/docs/architecture/infra-reference.md` | Sebut SeaweedFS. |
| HR-SYSTEM-BACKOFFICE | Hanya komentar di `components/billing/PayInvoiceManualModal.vue`, `composables/useEmployees.ts`, `pages/tenants/employee/[id].vue`: "MinIO" diganti "object storage". Tidak ada perubahan logika. |
| HR-SYSTEM-DOCS | `architectures/object-storage.md` (infrastruktur SeaweedFS, `s3.json`, init, driver, runbook migrasi). Cek juga penyebutan MinIO di `modules/platform/billing/04-api-contract.md`, `modules/auth/04-data-model.md`, `modules/core-hr/04-api-contract.md`, dan `modules/core-hr/05-data-model.md`. |

## 7. Fase dan urutan kerja

Setiap fase bisa di-merge sendiri.

1. **Fase 1, engine dan config**: tambah `S3FileUploader` + test, tambah `STORAGE_DRIVER`, switch di `cmd/api`, beri label deprecated di MinIO. Default driver **sementara** tetap `minio`, sehingga tidak ada perubahan perilaku.
2. **Fase 2, infra dev**: service `seaweedfs`, `seaweedfs-init`, `s3.json`, MinIO dipindah ke profile `legacy`, Makefile, `.env.example`. Default driver diubah menjadi `seaweedfs`.
3. **Fase 3, migrasi data**: service `storage-migrate`, target Makefile, runbook.
4. **Fase 4, komentar dan docs**: komentar API dan Backoffice, `object-storage.md`, `infra-reference.md`.

## 8. Verifikasi

1. `go build ./... && go vet ./... && make test` hijau, termasuk `s3_uploader_test.go`.
2. `grep -rni minio` di API hanya menemukan kode, service, atau target yang sudah berlabel deprecated.
3. `make dev-up` membuat `seaweedfs` healthy, lalu `make seaweedfs-init` membuat bucket. `curl http://localhost:9004/public/<obj>` tanpa kredensial harus 200, sedangkan `curl http://localhost:9004/private/<obj>` harus 403.
4. Isi data di `minio` (profile legacy), lalu jalankan `make storage-migrate`. `rclone check` harus 0 differences, dan avatar serta dokumen lama tampil di Backoffice.
5. E2E lewat Backoffice:
   - Upload avatar: presign → PUT dari browser (tanpa error CORS) → confirm → promote. Objek `pending/` harus terhapus.
   - Upload bukti bayar dan dokumen karyawan (bucket private), lalu download lewat presigned GET.
   - Hapus dokumen: objeknya hilang dari bucket.
6. Startup API: lifecycle `pending/` terpasang. Kalau SeaweedFS menolak, cukup `Warn` dan catat di docs (§9).
7. Rollback: dengan `STORAGE_DRIVER=minio` dan `docker compose --profile legacy up -d minio`, API tetap jalan memakai driver lama.

## 9. Risiko dan catatan SeaweedFS

| Risiko | Mitigasi |
|---|---|
| Dukungan bucket lifecycle di SeaweedFS hanya sebagian (diimplementasikan lewat TTL filer). | Pemasangan lifecycle sudah non-fatal. Verifikasi di versi yang dipin. Kalau tidak didukung, siapkan cleanup `pending/` lewat job worker (follow-up terpisah). |
| CORS untuk PUT dari browser. | Verifikasi di §8 langkah 5. Set `-s3.allowedOrigins` kalau perlu. |
| Presign PUT tanpa `Content-Type` yang ditandatangani menghasilkan perilaku yang beda antar SDK. | Pertahankan perilaku sekarang (Content-Type tidak ditandatangani). Uji upload dari browser. |
| `CopyObject` dengan key yang mengandung karakter khusus. | Escape `CopySource` per segmen dan tambahkan unit test untuk key dengan spasi atau unicode. |
| Objek yang ditulis setelah cutover hilang saat rollback. | Runbook §5.2 langkah 6: sync balik sebelum rollback. |
| Kredensial dev ikut terbawa ke produksi. | `s3.json` produksi dibuat terpisah dan tidak di-commit. Repo hanya berisi contoh dev. |
