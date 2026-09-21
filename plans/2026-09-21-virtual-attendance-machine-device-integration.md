<!-- 📁 plans/2026-09-21-virtual-attendance-machine-device-integration.md -->
# Rencana: Virtual Attendance Machine (Simulator Fingerspot) + Backend Device Integration

| | |
|---|---|
| **Status** | Rencana disetujui (plan mode) · Belum dieksekusi/dikoding |
| **Tanggal** | 2026-09-21 |
| **Pemicu** | Permintaan membuat modul "virtual machine absen" — simulator mesin absensi fisik yang interfacing-nya dibuat semirip mungkin dengan produk mesin absensi nyata di industri (Fingerspot), agar nanti bisa disetting koneksi ke sistem attendance yang sudah ada |
| **Modul terdampak** | Attendance (HR-SYSTEM-API), Core HR (HR-SYSTEM-API, untuk resolusi `employee_ref`), Backoffice (tidak diubah — lihat §7) |
| **Repo terkait** | HR-SYSTEM-API |
| **Dokumen rujukan** | [modules/attendance/08-device-integration.md](../modules/attendance/08-device-integration.md), [modules/attendance/10-identity-enrollment.md](../modules/attendance/10-identity-enrollment.md) |

---

## 1. Ringkasan Eksekutif

`08-device-integration.md` dan `10-identity-enrollment.md` **sudah lama mendokumentasikan** kebutuhan ini secara detail — event absensi standar, entity `attendance_devices`, pola adapter per merek mesin, model push/pull, mapping `employee_ref → employee_id` — tapi **implementasinya nol persen** di HR-SYSTEM-API. Tidak ada konsep device/mesin sama sekali di backend hari ini; absensi hanya bisa ditulis lewat self-service (`clock-in`/`clock-out`) atau input manual HR.

Di sisi Backoffice, UI-nya **sudah ada tapi murni mock** (`devices.vue`, `enrollment.vue`, `composables/useAttendance.ts` — state client-side, tidak ada panggilan API sungguhan), dan sengaja disembunyikan dari navigasi dengan komentar "backend not yet built".

Rencana ini membangun **dua sisi** sekaligus agar loop-nya bisa dibuktikan end-to-end:
1. Backend device-integration di HR-SYSTEM-API (registry alat + ingestion), model **push** saja (bukan pull), dengan adapter konkret untuk **Fingerspot** — merek yang sudah disebut di dokumen & mock UI, dan protokolnya (HTTP POST dengan header `request_code: realtime_glog`, `dev_id`, `trans_id`) adalah referensi publik yang paling tersedia (community implementation `github.com/andreracodex/fingerspot` — tidak ada spesifikasi resmi lengkap, jadi ini dianggap sebagai referensi terbaik yang ada, bukan spek resmi Fingerspot).
2. Tool simulator standalone (`cmd/devicesim`) yang berperan sebagai mesin Fingerspot palsu — mengirim event scan via protokol yang sama ke endpoint baru, untuk testing/dev tanpa perlu beli hardware.

**Ditunda/di-stub saja** (satu baris catatan di kode, tidak dibangun): trigger pull manual, mapping kartu NFC, Cara 2/3 mapping `employee_ref` (manual & bulk import — hanya Cara 1 "samakan dengan `employee_number`" yang diimplementasikan), adapter kiosk/face/NFC, penyambungan UI Backoffice ke data asli, hashing device token saat disimpan.

---

## 2. Keputusan Arsitektur

1. **Satu use case ingestion, dua pintu masuk.** `IngestEventsUseCase` (baru, source-agnostic, batch) jadi satu-satunya jalur tulis, dipakai baik oleh route generik `/attendance/ingest` maupun route khusus Fingerspot. Route Fingerspot hanya menambahkan satu langkah penerjemah (format wire vendor → DTO event standar milik modul ini) sebelum masuk ke use case yang sama. Tidak ada jalur tulis paralel.

2. **`IngestEventsUseCase` ditaruh di `application/attendancerecord/command/ingest_event.go`**, satu package dengan `clock_in.go`/`create_manual_record.go` — karena butuh helper tak-exported milik package itu (`dayResolver`, `resolveLocation`, `normalizeRecordTimezone`, `buildGeoPoint`, `parseTimestampOrNow`, `toAttendanceRecordResponse`, `isNotFound`). Ini keputusan packaging di dalam satu modul (device dan attendancerecord sama-sama aggregate di modul `attendance`), bukan pelanggaran batas hexagonal antar modul.

3. **`domain/device` adalah aggregate baru yang berdiri sendiri** (registry alat + entity anak `IngestEvent` untuk dedup/audit). `application/device` hanya mengurus registrasi/daftar alat/autentikasi token — logika ingestion tetap di `attendancerecord`.

4. **Adapter format wire Fingerspot adalah pure function** di `infrastructure/device/external/fingerspot_adapter.go` (mengikuti konvensi `external/` yang sudah ada, contoh: `auth/infrastructure/user/external/`). Tidak ada dependensi DB/network; mengembalikan DTO netral miliknya sendiri — handler HTTP yang memetakan hasilnya ke `attendancerecordcommand.IngestEventRequest`, supaya infra tidak pernah bergantung pada application.

5. **Route ingest melewati JWT sepenuhnya** — didaftarkan di `router gin.IRouter` mentah, persis presedennya `entitlementhttp.RegisterWebhookRoute` di `platform/module.go`. Autentikasi alat pakai header `X-Device-Token` yang dicek manual (`FindByToken`) di handler — karena hardware tidak bisa login interaktif. Endpoint manajemen registry (`POST/GET /attendance/devices`) tetap di grup ter-gate JWT seperti biasa, pakai konstanta permission `PermConfig`/`PermRead` yang sudah ada di `httpkit.go`.

---

## 3. Perubahan Backend (HR-SYSTEM-API)

### 3.1 Domain — `internal/modules/attendance/domain/device/`
- `constant/constant.go` — enum `Type` (`fingerprint`, `face`, `nfc_reader`, `mobile`, `kiosk`, `web`), `Integration` (`push`, `pull`), `Adapter` sebagai string terbuka (bukan enum keras — `"fingerspot"` untuk sekarang, biar merek baru tidak butuh migrasi), enum event `Type` (`in`/`out`), kode error (`ErrCodeDeviceNotFound`, `ErrCodeInvalidDeviceToken`, `ErrCodeEmployeeRefNotFound`, `ErrCodeNotImplemented` untuk stub).
- `entity/device.go` — `Device{ID, TenantID, BranchID, Type, Integration, Adapter, Token, LastSyncAt, CreatedAt, UpdatedAt}`, `NewDevice(...)` validasi enum, `RecordSync(now)`. Token dibuat via `kernel.NewID()`, disimpan/dibandingkan sebagai plaintext untuk MVP ini (disengaja, didokumentasikan sebagai simplifikasi — sama spiritnya dengan komentar DTO webhook pembayaran yang sudah ada).
- `entity/ingest_event.go` — `IngestEvent{ID, TenantID, DeviceID, EmployeeRef, EmployeeID *string, EventType, OccurredAt, RawRef *string, AttendanceRecordID *string, CreatedAt}` — catatan audit/dedup saja, tanpa state machine.
- `repository/repository.go` — `DeviceRepository{Save, FindByID, FindByToken, List, UpdateLastSyncAt}`, `IngestEventRepository{RecordIfNew}` (`INSERT ... ON CONFLICT (device_id, employee_ref, occurred_at) DO NOTHING` → anti-duplikasi sesuai doc §7).

### 3.2 Perluasan `attendance_records` untuk `verification`
- `domain/attendancerecord/constant/constant.go` — tambah `VerificationGPS/Face/Fingerprint/NFC/None`.
- `domain/attendancerecord/entity/attendance_record.go` — tambah field `Verification *string` saja (tanpa ubah signature method — `clock_in.go`/`clock_out.go` tidak perlu disentuh; di-set langsung seperti `CreateManualRecordUseCase` sudah melakukan untuk `Source`/`Notes`).
- Update `toAttendanceRecordResponse` dan daftar kolom `SELECT`/`INSERT`/`UPDATE` di `infrastructure/attendancerecord/persistence/*.go`.
- **Tidak** menambah kolom `device_id` ke `attendance_records` — keterkaitan itu cukup lewat `attendance_device_ingest_events.attendance_record_id`, supaya blast radius tabel inti tetap minimal.

### 3.3 Resolusi `employee_ref → employee_id` (doc 10 §4a, hanya Cara 1: default `employee_ref == employee_number`)
- `core-hr/domain/employee/repository/interfaces.go` — tambah `FindByEmployeeNumber(ctx, tenantID, employeeNumber)`.
- `core-hr/infrastructure/employee/persistence/postgres_employee_repo.go` — implementasi (bentuk sama seperti `FindByUserID` yang sudah ada; index `UNIQUE (tenant_id, employee_number)` sudah ada, tidak perlu migrasi baru).
- `core-hr/contract.go` — tambah `FindEmployeeByEmployeeNumber(ctx, tenantID, employeeNumber) (*EmployeeRef, error)` ke `Contract` (pakai ulang DTO `EmployeeRef` yang sudah ada), plus delegasi `*Module`.
- `attendance/application/attendancerecord/ports/ports.go` — tambah interface `EmployeeRefResolver`, didoc-comment sebagai Cara-1-saja (Cara 2 manual / Cara 3 bulk import ditunda secara eksplisit).
- `attendance/infrastructure/corehrgateway/gateway.go` — tambah method `ResolveByEmployeeRef` ke `Gateway` yang sudah ada, delegasi ke contract method baru.

### 3.4 Use case ingestion — `application/attendancerecord/command/ingest_event.go`
`IngestEventsUseCase.Execute(ctx, tenantID, deviceID, deviceDefaultBranchID string, events []IngestEventRequest) (*IngestEventsResponse, error)`:
- Per event, independen — satu event gagal tidak membatalkan seluruh batch (partial success, senada dengan doc 10 §4a Cara 3 "dry-run + partial success"):
  1. Resolusi `employee_ref → employee_id` via `EmployeeRefResolver`; tidak ketemu → tandai event itu gagal, lanjut ke event berikutnya.
  2. `transactor.WithTx` membungkus langkah 3–5 (pola sama dengan `ReviewCorrectionUseCase`).
  3. `ingestRepo.RecordIfNew` — duplikat → tandai `"duplicate"`, lanjut (anti-dup, doc §7).
  4. Pakai ulang `dayResolver`/`buildGeoPoint`/parsing timestamp seperti `ClockInUseCase`; cabang berdasar `type == in/out` → `RecordClockIn`/`RecordClockOut` dengan `constant.SourceMachine`; set `record.Verification`.
  5. `normalizeRecordTimezone` + `ComputeStatus`, lalu `Save`/`Update`.
  6. Update `IngestEvent.AttendanceRecordID`.
- Setelah loop: `deviceRepo.UpdateLastSyncAt`.
- Return hasil per-event (`{employee_ref, status: ok|duplicate|error, record_id?, error?}`) — memenuhi syarat batch di doc §6.

### 3.5 Application — `internal/modules/attendance/application/device/`
- `command/register_device.go` — validasi input, generate ID+token, `Save`. Token plaintext dikembalikan **sekali saja** saat registrasi (tidak pernah lagi lewat `List`).
- `query/list_devices.go` — daftar alat, response tanpa `Token`.
- `query/authenticate_device.go` — `FindByToken`, dipakai kedua handler ingest sebelum panggil `IngestEventsUseCase`.

### 3.6 Infrastructure
- `infrastructure/device/persistence/{models.go,postgres_device_repo.go,postgres_ingest_event_repo.go}` — gaya sama seperti persistence `holiday`/`attendancerecord`.
- `infrastructure/device/external/fingerspot_adapter.go` — `TranslateRealtimeGlog(headers, body) ([]FingerspotEvent, error)`, pure function; menolak `request_code` selain `realtime_glog`; memetakan verify mode → enum verification. Doc comment package mencatat keterbatasan "tidak ada spek resmi lengkap".

### 3.7 Interfaces/HTTP — `internal/modules/attendance/interfaces/http/device/`
- `handler.go` — `RegisterDevice` (POST, `PermConfig`), `List` (GET, `PermRead`), `Pull` (POST `/:id/pull`, `PermConfig`) → stub `ErrCodeNotImplemented`, `MapCard` (POST `/cards`, `PermConfig`) → stub, `IngestGeneric` (POST, tanpa gate, `X-Device-Token`), `IngestFingerspot` (POST, tanpa gate, `X-Device-Token` + header Fingerspot → adapter → use case bersama).
- `router.go` — `RegisterRoutes(grp, h)` untuk endpoint manajemen alat yang ter-gate JWT; `RegisterIngestRoutes(router gin.IRouter, h)` untuk dua endpoint push tanpa gate (`/api/v1/attendance/ingest`, `/api/v1/attendance/devices/ingest/fingerspot`), preseden sama dengan `entitlementhttp.RegisterWebhookRoute`.

### 3.8 Migrasi
- Tabel `attendance_devices` (`id, tenant_id, branch_id, type, integration, adapter, token UNIQUE, last_sync_at, created_at, updated_at`), index `(tenant_id, branch_id)`.
- Tabel `attendance_device_ingest_events` (`id, tenant_id, device_id FK, employee_ref, employee_id, event_type, occurred_at, raw_ref, attendance_record_id, created_at`), `UNIQUE (device_id, employee_ref, occurred_at)`.
- `ALTER TABLE attendance_records ADD COLUMN verification VARCHAR(20) CHECK (...)`.

### 3.9 Wiring modul
- `attendance/module.go` — bangun repo/use case/handler baru tepat setelah `attendanceRecordQueries` (pakai ulang semua dependency yang sudah in-scope di situ); tambah `deviceHandler` ke `Module`; `RegisterRoutes` tambah `deviceHTTP.RegisterRoutes(grp, m.deviceHandler)` di dalam grup ter-gate dan `deviceHTTP.RegisterIngestRoutes(router, m.deviceHandler)` di sampingnya (tanpa ubah signature — `RegisterRoutes` sudah menerima `router gin.IRouter`).
- `cmd/api/main.go` — tidak perlu diubah; route ikut otomatis lewat `attendance.Module.RegisterRoutes`.

---

## 4. Simulator — `cmd/devicesim/`

CLI Go standalone, tanpa dependensi DB, HTTP client `net/http` biasa (tidak ada wrapper outbound-HTTP lain di repo ini yang bisa dipakai ulang).

- `main.go` — flag: `--api-base`, `--tenant-admin-token` (sekali pakai, untuk `register`), `--device-token` (token yang sudah diterbitkan, untuk `push`), `--branch-id`, `--device-type` (default `fingerprint`), `--adapter` (default `fingerspot`), `--employee-refs` (dipisah koma), `--interval` (`0` = sekali kirim), `--dev-id` (serial palsu). Subcommand: `register`, `push`.
- `client.go` — `RegisterDevice(ctx)` (POST `/attendance/devices` dengan bearer token admin), `PushRealtimeGlog(ctx, event)` (POST `/attendance/devices/ingest/fingerspot` dengan header `X-Device-Token`, `request_code: realtime_glog`, `dev_id`, `trans_id`, body JSON `{employee_ref, timestamp, verify_mode}`).
- `simulate.go` — loop bergantian event `in`/`out` per employee ref per tick, menambah `trans_id`, mencatat hasil tiap push ke stdout.

---

## 5. File kritikal untuk direferensikan saat implementasi
- `internal/modules/attendance/application/attendancerecord/command/clock_in.go` — pola yang diperluas `IngestEventsUseCase` (resolusi hari, geofence, hitung status).
- `internal/modules/attendance/domain/attendancerecord/entity/attendance_record.go` — tempat field `Verification` ditambahkan.
- `internal/modules/attendance/module.go` — pola wiring composition-root yang harus diikuti persis.
- `internal/modules/core-hr/contract.go` — tempat `FindEmployeeByEmployeeNumber` ditambahkan, mengikuti bentuk `FindEmployeeByUserID` yang sudah ada.
- `internal/modules/platform/module.go` (`RegisterWebhookRoute`) — preseden route tanpa gate yang diautentikasi token, didaftarkan di router mentah.
- `HR-SYSTEM-DOCS/modules/attendance/08-device-integration.md`, `10-identity-enrollment.md` — spek yang diimplementasikan.

---

## 6. Rencana verifikasi
1. Jalankan migrasi; pastikan ketiga migrasi baru berhasil diterapkan.
2. Nyalakan API, login sebagai tenant admin, ambil JWT.
3. `go run ./cmd/devicesim register ...` → tampilkan id/token alat; pastikan `GET /api/v1/attendance/devices` menampilkannya.
4. Pastikan `employee_number` karyawan seed cocok dengan salah satu `--employee-refs`.
5. `go run ./cmd/devicesim push --device-token ... --employee-refs <ref> --interval 0` → satu event `in`.
6. Cek via `GET /api/v1/attendance/records` bahwa record muncul dengan `source: machine`, `verification: fingerprint`, `clock_in` benar.
7. Kirim event identik lagi → pastikan hasilnya `"duplicate"` dan tidak ada record/efek samping kedua.
8. Kirim event `out` → pastikan `clock_out` dan status/telat/lembur terhitung normal.
9. Kirim `employee_ref` yang tidak dikenal → pastikan hasil event itu `EMPLOYEE_REF_NOT_FOUND` tanpa menggagalkan seluruh batch.
10. Kirim dengan `X-Device-Token` salah/kosong → pastikan `401`, dan pastikan route memang tidak butuh header `Authorization` sama sekali.
11. Catat eksplisit ke pengguna: `devices.vue`/`enrollment.vue` di Backoffice tetap mock setelah perubahan ini — menyambungkannya ke endpoint asli adalah follow-up alami, bukan bagian dari pass ini.

---

## 7. Yang ditunda / sengaja di-stub (bukan bagian dari pass ini)
- `POST /attendance/devices/{id}/pull` — stub `ErrCodeNotImplemented`.
- `POST /attendance/cards` (mapping NFC) / tabel `device_cards` — ditunda seluruhnya.
- Doc 10 §4a Cara 2 (mapping manual) / Cara 3 (import massal) — ditunda; hanya Cara 1 yang diimplementasikan.
- Adapter kiosk, face, NFC reader — di luar cakupan; enum `type`/`adapter` menyisakan tempat untuk itu nanti, tapi tidak ada jalur kode yang mengimplementasikannya.
- Hashing device token saat disimpan — plaintext untuk MVP, dicatat sebagai hardening follow-up.
- Penyambungan `devices.vue`/`enrollment.vue` di Backoffice ke API asli.
