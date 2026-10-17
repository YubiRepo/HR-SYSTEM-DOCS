<!-- 📁 plans/2026-10-16-attendance-agent-machine-integration.md -->
# Rencana & Progres: Integrasi Mesin Absensi via Agent Lokal

| | |
|---|---|
| **Status** | **Sebagian dikerjakan** — PR1–PR5, import mapping massal, halaman Backoffice, dan **web UI agent** (SQLite + `.env`, menggantikan `agent.yaml`) selesai · Agent **hanya memakai vendor `fake`** (adapter Fingerspot dihapus 2026-10-17, vendor asli ditunda) · Semua belum di-commit, belum diuji ke DB asli · Sisa: adapter vendor asli, commit, uji ke infrastruktur asli |
| **Tanggal** | Dibuat 2026-10-16 · terakhir diperbarui 2026-10-17 |
| **Pemicu** | Kebutuhan integrasi absensi dari mesin eksternal (fingerprint/face) melalui **agent yang di-install lokal** di jaringan klien, dengan vendor pertama sebagai blueprint untuk vendor berikutnya |
| **Menggantikan** | [plans/2026-09-21-virtual-attendance-machine-device-integration.md](2026-09-21-virtual-attendance-machine-device-integration.md) (push langsung dari mesin + tulis record sinkron; tidak pernah dikoding) |
| **Spek teknis** | [modules/attendance/12-agent-ingestion.md](../modules/attendance/12-agent-ingestion.md) — kontrak, endpoint, aturan pemrosesan, operasional agent |
| **Dokumen rujukan** | [08-device-integration.md](../modules/attendance/08-device-integration.md), [10-identity-enrollment.md](../modules/attendance/10-identity-enrollment.md) |
| **Repo terkait** | HR-SYSTEM-API (kode), HR-SYSTEM-BACKOFFICE (3 halaman baru), HR-SYSTEM-DOCS (dokumen ini + doc 12) |

---

## 1. Ringkasan

Mesin absensi (Fingerspot/Solution) menyimpan data di LAN klien dan umumnya tidak bisa push ke cloud. Karena itu dibangun **agent lokal** (`cmd/attendance-agent`) yang menarik log dari mesin lewat **adapter per vendor**, menyimpannya di antrean lokal, lalu mengirim batch ke API. API hanya menyimpan **raw event**; pemrosesan menjadi `attendance_records` berjalan **async** di worker dan selalu **menghitung ulang** satu hari dari semua punch-nya.

```
[Mesin] ◀─LAN─ [attendance-agent]  ── HTTPS X-Agent-Key ──▶  [API] attendance_raw_events
                adapter → SQLite queue                          │ outbox (tx yang sama)
                + checkpoint + retry                            ▼
                                                     [worker] ProcessRawEvents → attendance_records (source=machine)
```

Keputusan dari user (2026-10-16):
- vendor pertama **Fingerspot / Solution**;
- agent ditulis dalam **Go di repo HR-SYSTEM-API**;
- auth memakai **API key per agent per tenant**;
- evaluasi **async setelah ingest**.

Keputusan dari user (2026-10-17): untuk sementara **full memakai vendor `fake`**. Adapter Fingerspot/EasyLink yang sempat dibuat dari format asumsi **dihapus**. Vendor asli dikerjakan nanti, saat respons SDK/mesin asli tersedia.

---

## 2. Status per Tahap

| PR | Tahap | Status | Catatan |
|---|---|---|---|
| PR1 | Kontrak `AttendanceEventInput` netral vendor | ✅ Selesai | `pkg/attendanceingest` + test |
| PR2 | Ingestion API (batch, idempotent) + registry agent/mesin | ✅ Selesai | Migration `20261017000001` |
| PR3 | Mapping ID karyawan eksternal → internal | ✅ Selesai | Migration `20261017000002`, Core HR `FindEmployeeByEmployeeNumber` |
| PR4 | Processor raw event → `attendance_records` (async) | ✅ Selesai | Migration `20261017000003`, outbox + MQ consumer + sweep |
| PR5 | Agent lokal: config, antrean SQLite, poller, sender, service | ✅ Selesai | `cmd/attendance-agent`, `pkg/attendanceagent`, `make agent-build` |
| PR6 | Adapter vendor asli (**Fingerspot**, lalu **Solution**) | ⏸️ Ditunda | Sempat dibuat untuk Fingerspot dari format asumsi, lalu **dihapus** (2026-10-17). Sementara hanya `fake` (§6) |
| — | Import mapping massal (Cara 3) | ✅ Selesai (2026-10-17) | `POST /attendance/employee-mappings/import`, dry-run + commit, partial success |
| — | Backoffice: halaman agent, mesin, mapping (+ import CSV), raw punches | ✅ Selesai (2026-10-17) | 3 halaman baru; mock `devices.vue`/`enrollment.vue` dibiarkan tersembunyi |
| — | **Web UI agent**: setting di SQLite, `.env` untuk bootstrap, hot-apply, detach | ✅ Selesai (2026-10-17) | `agent.yaml` dihapus; lihat "Web UI agent" di §3 |
| — | **Mesin "Database" generik (`sqldb`)**: MySQL/MariaDB, PostgreSQL, SQL Server, SQLite, MS Access | ✅ Selesai (2026-10-17) | Lihat "Mesin Database" di §3; Access/server DB asli belum diuji di lapangan |
| — | Mesin file teks (CSV/TXT) | ⏸️ Ditunda | Keputusan user 2026-10-17: fokus DB dulu |

**Kondisi kode:** semua perubahan masih **uncommitted** di working tree HR-SYSTEM-API (branch `main`). `go build ./...`, `go vet ./...`, dan `go test ./...` seluruh repo lulus.

---

## 3. Yang Sudah Dikerjakan

### PR1 — Kontrak (`pkg/attendanceingest`)
- `AttendanceEventInput` berisi: `idempotency_key`, `device_serial`, `employee_ref`, `occurred_at` (dengan offset), `direction` (`in`/`out`/`unknown`), `verification`, `vendor_event_id`, `raw`.
- Tipe request/response: `BatchRequest`/`BatchResponse` (hasil per event `accepted`/`duplicate`/`rejected`), `HeartbeatRequest`, `AgentConfigResponse`.
- `BuildKey`: SHA-256 deterministik (UTC, presisi detik), sehingga punch yang di-fetch ulang menghasilkan key yang sama.
- `Validate` + kode penolakan; kontrak versi `v1` (header `X-Ingest-Contract`).
- Paket ini tidak bergantung pada `internal/`, jadi agent bisa memakainya sendiri dan kelak bisa dipindah ke repo terpisah.

### PR2 — Ingestion API (`internal/modules/attendance/.../device`)
- Tabel `attendance_agents`, `attendance_devices`, `attendance_raw_events`. Dedup per `(tenant_id, idempotency_key)`.
- Key agent berformat `hra_<prefix>_<secret>`. Hanya `sha256(secret)` yang disimpan, perbandingannya constant-time. Key ditampilkan **sekali** (saat register/rotate).
- Endpoint agent (tanpa JWT, header `X-Agent-Key`, body maks. 4 MB): `POST /attendance/agent/events/batch`, `POST .../heartbeat`, `GET .../config`.
- Endpoint admin (JWT):
  - `/attendance/agents`: list, register, `revoke`, `rotate-key`;
  - `/attendance/devices`: list, register, `PATCH`;
  - `GET /attendance/raw-events`.
- Hasil dihitung per event. Mesin milik agent lain, mesin nonaktif, atau milik tenant lain → `UNKNOWN_DEVICE`.

### PR3 — Mapping karyawan
- Tabel `attendance_employee_mappings`. `device_id` NULL berarti berlaku untuk semua mesin.
- Urutan resolusi: mapping per mesin → mapping semua mesin → `employee_ref == employee_number` (Cara 1). Mapping eksplisit selalu menang. Mapping ke karyawan yang sudah dihapus **tidak** jatuh ke Cara 1.
- Branch yang dipakai adalah **branch karyawan**, bukan branch mesin.
- Endpoint `/attendance/employee-mappings`: list, `resolve` (cek), create, delete.

### PR4 — Processor (`ProcessRawEventsUseCase`)
- Kolom baru: `attendance_records.verification`, `attendance_raw_events.work_date`, dan status `superseded`.
- **Pemicu:** ingest/reprocess menulis pesan `attendance.raw_event.ready` ke outbox dalam transaksi yang sama. Ada juga sweep `attendance.raw_event.process_sweep` tiap 5 menit.
- **Hari kerja:** tanggal lokal branch. Punch pagi yang masih dalam shift lintas tengah malam masuk ke hari sebelumnya.
- **Pemilihan pemilik record:**
  - Ditimpa: record baru, `system` (absent hasil Evaluator), atau `machine`.
  - Tidak ditimpa (punch → `superseded`): `mobile`/`web`/`kiosk`/`manual`, atau record `machine` yang **sudah dikoreksi HR**.
  - Periode payroll terkunci → `skipped_locked`.
- **Dihitung ulang dari semua punch hari itu** (`entity.PairPunches` + `ApplyMachinePunches`). Punch yang telat datang otomatis memperbaiki record. Clock window dan `NO_SCHEDULE` tidak menolak punch mesin.
- `POST /attendance/raw-events/reprocess`. Membuat mapping baru otomatis memproses ulang punch `unmatched` dengan ref tersebut.
- `cmd/api` dan `cmd/worker` sudah memanggil `SetOutboxWriter`.

### PR5 — Agent lokal
- `pkg/attendanceagent/`:
  - `config`: struct setting + validasi (sejak web UI: tanpa YAML, lihat di bawah);
  - `store`: SQLite pure-Go. Event + checkpoint disimpan dalam satu transaksi;
  - `client`: klasifikasi 401/413/retryable/permanent;
  - `agent`: poller, sender, heartbeat, maintenance;
  - `machine`: kontrak adapter + registry; adapter `fake` untuk dev/test (mode `grid` dan `logs`, lihat doc 12 §5).
- `cmd/attendance-agent`: `run`, `install`, `start`, `stop`, `restart`, `uninstall`, `status`, `test-device`, `version`. Berjalan sebagai Windows service / systemd. (`agent.example.yaml` kemudian diganti `.env.example`.)
- `make agent-build AGENT_VERSION=x.y.z` menghasilkan `bin/` (Windows + Linux amd64).
- Dependensi baru: `github.com/kardianos/service v1.2.2` (`go.yaml.in/yaml/v3` kemudian dilepas lagi bersama `agent.yaml`). `modernc.org/sqlite` naik dari v1.18.1 ke v1.34.1 (sebelumnya sudah dependensi tidak langsung).

### PR6 — Adapter Fingerspot (dibuat lalu dihapus, 2026-10-17)
Adapter `fingerspot_easylink` + simulator `cmd/easylink-sim` sempat dibangun dari format EasyLink SDK yang umum dikenal (belum diverifikasi), lalu **dihapus atas permintaan user**: untuk sementara agent hanya memakai `fake`. Catatan desain untuk saat vendor asli dikerjakan:
- Agent bicara HTTP ke SDK lokal (perkiraan `http://localhost:7005`, POST form `sn`), bukan langsung ke mesin.
- Ada dua cara membaca:
  - `paging` membaca seluruh log lalu menyaring dengan cursor `"ScanDate|PIN"`. Read-only dan aman bagi aplikasi lain, tapi berat untuk log besar.
  - `new` hanya mengambil record baru, tapi mengonsumsi log di SDK. Di mode ini filter cursor jangan dipakai; duplikat tertangkap lewat `idempotency_key`.
- Pemetaan yang diasumsikan:
  - `IOMode` 1/2 → `in`/`out`;
  - `VerifyMode` 1/2/3/4 → fingerprint/password/card/face;
  - `ScanDate` adalah jam lokal mesin tanpa offset;
  - field angka bisa berupa number maupun string.
- Pola uji yang terbukti berguna: fixture JSON di `testdata/` + simulator HTTP + E2E dengan mock API.

### Import mapping massal (2026-10-17)
- `ImportEmployeeMappingsUseCase` (`application/device/command/import_mappings.go`) + endpoint `POST /attendance/employee-mappings/import` (`attendance:config`).
- Body `{dry_run, device_id?, rows:[{employee_ref, employee_number? | employee_id?}]}`, maks. 2000 baris. Backoffice yang mem-parse CSV.
- Hasil per baris `create`/`skip`/`error` beserta kodenya (lihat doc 12 §6).
- Commit menyimpan baris valid (partial success), lalu me-reprocess punch `unmatched` untuk semua ref yang baru dibuat dalam satu reset (filter `EmployeeRefs`).
- Menjalankan ulang aman (idempotent). Ref yang sudah dipetakan ke orang lain tidak ditimpa.
- **Tidak** ada pencocokan berdasarkan nama di server (rawan salah orang). Kalau dibutuhkan, itu menjadi saran di UI.
- Test: semua kode baris, dry-run tidak menulis, commit + requeue, re-run, konflik, batas baris, device tidak ada.

### Backoffice (2026-10-17) — HR-SYSTEM-BACKOFFICE
- **Composable** `app/composables/useMachineIntegration.ts`:
  - `useAttendanceAgents`, `useAttendanceDevices`, `useEmployeeMappings`, `useRawEvents`;
  - `parseMappingCsv`: CSV koma atau titik koma, nilai berkutip, BOM. Header `employee_ref`/`pin`/`user_id` + `employee_number`/`employee_id`;
  - DTO bertipe, tanpa `any`.
- **Halaman** (teks UI bahasa Inggris, tombol Refresh, aksi ubah hanya untuk `attendance:config`):
  - `pages/tenants/attendance/machines.vue` — **Machines & Agents**:
    - register agent → modal **key tampil sekali** + tombol copy;
    - rotate key / revoke (dengan konfirmasi);
    - register/edit mesin (nama, serial, vendor, agent, branch);
    - aktif/nonaktif; status koneksi + error dari heartbeat; waktu punch terakhir.
  - `pages/tenants/attendance/employee-mappings.vue` — **Machine ID Mapping**:
    - daftar mapping (nama karyawan di-resolve dan di-cache), tambah (pilih karyawan via pencarian server), hapus;
    - alat **Check a machine ID** (endpoint `resolve`);
    - **Import CSV**: upload/paste → parse di browser → **Preview** (dry-run per baris) → **Import** → hasil + jumlah punch yang di-reprocess; ada tombol unduh template.
  - `pages/tenants/attendance/machine-punches.vue` — **Machine Punches**:
    - raw event dengan filter status (default `unmatched`), mesin, dan ID mesin; pagination server;
    - penjelasan per status;
    - aksi baris "Map this machine ID" (membuka halaman mapping dengan form terisi) dan "Reprocess";
    - tombol **Reprocess Filtered**.
- **Sidebar** (`app/layouts/default.vue`, grup Attendance, `attendance:read`): Machines & Agents, Machine ID Mapping, Machine Punches.
- Mock lama (`devices.vue` dengan tab method config/geofence, dan `enrollment.vue`) **tidak diubah** dan tetap tersembunyi, karena fitur method config/enrollment belum punya backend.
- **Verifikasi:**
  - `eslint` bersih untuk semua file baru;
  - `nuxt typecheck`: 0 error di file baru (115 error lama di file lain sudah ada sebelumnya);
  - parser CSV diuji dengan 6 kasus via Node.
  - **Belum** dicoba di browser terhadap API yang berjalan.

### Web UI agent (2026-10-17) — menggantikan `agent.yaml`
Keputusan user: UI dibuka dari LAN + password · HTML/JS di-embed · hot-apply · detach sendiri · `agent.yaml` diganti `.env`.

- **Bootstrap `.env`** (`config/env.go`):
  - variabel `AGENT_LISTEN` (default `0.0.0.0:8787`), `AGENT_DATA_DIR`, `AGENT_LOG_FILE`, `AGENT_LOG_LEVEL`;
  - override opsional `AGENT_API_BASE` dan `ATTENDANCE_AGENT_KEY`;
  - prioritas flag > env asli > `.env` > default;
  - parser `.env` ditulis sendiri (komentar, kutip, `export`);
  - YAML loader dan `agent.example.yaml` dihapus, diganti `.env.example`.
- **SQLite** (`store/{schema,settings,ui}.go`):
  - migrasi via `PRAGMA user_version`; DB lama ter-upgrade dengan antrean/checkpoint utuh;
  - tabel `settings`, `devices` (+ `enabled`), dan `ui_sessions` (hanya hash token);
  - `ListQueue`, `RetryDead`, `RetryPendingNow`.
- **Supervisor** (`agent/supervisor.go`):
  - `Apply` memuat ulang setting dan mengganti `Agent` yang berjalan **tanpa restart proses**;
  - setting invalid → agent lama tetap jalan dan error dikembalikan per field;
  - setting belum lengkap → state `not_configured`;
  - setelah apply, antrean pending langsung jatuh tempo.
  - `Agent.Snapshot()`: status mesin, batch/heartbeat terakhir, hasil cek mesin terdaftar di backoffice.
- **Opsi adapter deklaratif:** `machine.RegisterVendor` + `OptionSpec`. Form mesin di UI digambar otomatis per vendor (`fake` mendaftarkan `employee_refs`, `interval`, `start`, `logs`, `fail`).
- **Web UI** (`pkg/attendanceagent/webui`): `net/http` + `embed`, JS vanilla, teks bahasa Inggris, mode gelap/terang otomatis.
  - Tab: Status, Connection (+ Test connection), Machines (+ Test), Settings (+ nilai `.env` read-only, ganti password), Queue (retry), Logs (ring buffer).
  - Keamanan:
    - setup code sekali pakai (terminal/log, `status`, `data/setup-code.txt`);
    - bcrypt; cookie `HttpOnly` + `SameSite=Strict`, idle 12 jam;
    - header CSRF `X-Agent-UI`; throttling login per IP;
    - key tidak pernah dikirim balik ke browser;
    - CSP ketat; endpoint shutdown hanya dari loopback + token.
- **CLI:** `run [-d]`, `shutdown`, `status`, `reset-password` (tanpa restart), `test-device` (membaca dari DB), plus `install/start/stop/restart/uninstall`. Satu agent per data dir. Detach per OS (`proc_unix.go` Setsid, `proc_windows.go` DETACHED_PROCESS).
- **Verifikasi:**
  - test (config/env, store + upgrade DB lama, supervisor dengan `-race`, webui httptest: auth/setup/throttle/CSRF/settings/devices/shutdown) lulus;
  - E2E binary + mock API: `run -d` → setup code → konfigurasi lewat API UI → key salah (punch tertahan, 401 tampil) → perbaiki key tanpa restart (punch langsung terkirim) → mesin kedua + edit invalid ditolak → `status`, `shutdown` → restart tetap terkonfigurasi;
  - screenshot UI via Chrome headless;
  - cross-compile Windows OK.

### Mesin "Database" generik — `sqldb` (2026-10-17)
Agent membaca tabel/output yang ditulis software mesin ke database, tanpa adapter per vendor. Keputusan user: MySQL/MariaDB, PostgreSQL, SQL Server, SQLite, MS Access (ODBC) · pilih tabel + mapping kolom + opsi custom SQL · cursor ID atau waktu · file teks ditunda.

- **`pkg/attendanceagent/machine/sqldb`:**
  - opsi + validasi (identifier di-quote dan divalidasi; custom query hanya satu SELECT read-only);
  - dialek per DBMS (placeholder `?`/`$n`/`@pn`, quoting, `LIMIT` vs `TOP`);
  - DSN per driver; SQLite & Access dibuka read-only;
  - konversi nilai: datetime atau teks dengan format/deteksi, kolom tanggal+jam terpisah, `local` vs `absolute`, mapping arah dan metode;
  - filter mesin.
- **Cursor:**
  - `id` (`> terakhir`);
  - `time` (`> terakhir`), dengan rewind untuk grup detik yang sama di batas halaman, baca penuh bila satu halaman berisi detik yang sama, dan re-check window untuk baris telat + memori "sudah dikirim";
  - `Fetch` terus membaca halaman sampai event-nya genap satu limit, supaya baris yang dilewati tidak dikira "sudah habis".
- **Driver baru:** `go-sql-driver/mysql` v1.10.1, `microsoft/go-mssqldb` v1.11.2 (sebelumnya v1.0.0 tidak langsung), `alexbrainman/odbc` (hanya Windows, tanpa CGO). `pgx` dan `modernc.org/sqlite` sudah ada. Build rilis sekitar 15–18 MB (sebelumnya sekitar 11 MB).
- **Kontrak `machine` diperluas:**
  - `OptionSpec` + `Group`/`Choices`/`ShowIf`/`Default`/`Secret`;
  - tipe `select`/`password`/`number`/`table`/`column`;
  - interface `Browser` (+ `RegisterBrowser`/`NewBrowser` yang hanya butuh opsi koneksi);
  - `Closer`: agent menutup adapter saat stop/reload.
- **Web UI:**
  - form mesin dirender per grup, field muncul/hilang sesuai `ShowIf`;
  - password tidak pernah dikirim ke browser; kosong = tidak berubah, termasuk saat Test/Browse lewat `original_serial`;
  - tombol **Load tables / Load columns / Preview rows** (`POST /api/devices/browse`).
- **Build:** `make agent-build` sekarang juga menghasilkan `attendance-agent-windows-386.exe` untuk ODBC Access 32-bit.
- **Verifikasi:**
  - test SQLite asli: cursor id/time, batas detik sama, re-check window, query JOIN, tanggal/jam terpisah, format teks, validasi opsi, SQL per dialek, DSN, browse;
  - test web UI: secret tidak bocor/tersimpan, browse, test dengan `original_serial`;
  - E2E binary + DB tiruan skema ZKTeco + mock API: browse, test, tambah mesin, punch baru terbaca tanpa duplikat;
  - screenshot form;
  - cross-compile windows amd64/386.
  - **Belum:** koneksi Access/ODBC di Windows asli dan server MySQL/PostgreSQL/SQL Server sungguhan.

---

## 4. Yang Belum Dikerjakan

1. **Adapter vendor asli** (ditunda, 2026-10-17):
   - Fingerspot (EasyLink SDK) lalu Solution (kemungkinan protokol ZK TCP/UDP 4370);
   - dibangun dari respons SDK/mesin asli (§6), sebagai paket baru `pkg/attendanceagent/machine/<vendor>` mengikuti `fake`;
   - lalu tambahkan vendornya ke `MACHINE_VENDORS` di Backoffice.
2. **Commit & PR** untuk PR1–PR5, import mapping, dan Backoffice (3 repo), idealnya dipisah per tahap.
3. **Uji web UI agent di Windows asli** (`run -d`, `install`/`start` service, akses dari PC lain di LAN; pastikan firewall Windows mengizinkan port `AGENT_LISTEN`).
4. **Uji Backoffice di browser** terhadap API + worker yang berjalan (alur: register agent → key → register mesin → agent `fake` → punch muncul → mapping/import → reprocess).
5. **Verifikasi ke infrastruktur asli** (§5).
6. **Opsional/hardening:**
   - web UI agent: HTTPS/TLS untuk akses LAN, rotasi log;
   - Backoffice: hapus atau ganti mock `devices.vue`/`enrollment.vue` setelah fitur method config/enrollment diputuskan;
   - rotasi file log agent;
   - auto-update agent;
   - konfigurasi per tenant untuk ambang pemasangan punch (§7);
   - pembersihan raw event lama di server;
   - deteksi anomali (doc 08 §7).

---

## 5. Status Verifikasi

| Aspek | Status |
|---|---|
| Unit & use-case test (fake repo) | ✅ Lulus — `go test ./...` seluruh repo |
| Mutation check logika lintas tengah malam | ✅ Test gagal saat logika dimatikan |
| Agent E2E vs **mock API** (Python) | ✅ Poll → kirim; API mati → antre; API hidup → terkirim sekali; key salah → 401 terlog |
| Cross-compile `.exe` Windows | ✅ Berhasil |
| **Migration ke Postgres asli** (`make migrate-up`) | ❌ Belum — Postgres/Docker tidak bisa diakses dari sesi pengerjaan |
| **SQL repo baru vs Postgres asli** | ❌ Belum (terutama `ANY($n::text[]::uuid[])`, `IS NOT DISTINCT FROM $n::uuid`, `ON CONFLICT`, cast `work_date::text`) |
| E2E API + worker + RabbitMQ sungguhan | ❌ Belum |
| `install`/`start` service di **Windows asli** | ❌ Belum |
| `cmd/migrate` setelah upgrade `modernc.org/sqlite` | ❌ Belum dijalankan |
| Backoffice: `eslint` + `nuxt typecheck` file baru, parser CSV (Node) | ✅ Bersih / lulus |
| Backoffice dicoba di **browser** terhadap API yang berjalan | ❌ Belum |
| Web UI agent: test + E2E binary vs mock API + screenshot Chrome headless | ✅ Lulus |
| Web UI agent di **Windows asli** / dari PC lain di LAN | ❌ Belum |
| Mesin `sqldb`: test SQLite + E2E (DB tiruan skema ZKTeco) + screenshot | ✅ Lulus |
| Mesin `sqldb` vs **MS Access (ODBC) di Windows** dan server **MySQL/PostgreSQL/SQL Server** sungguhan | ❌ Belum |
| Adapter vendor asli vs mesin sungguhan | ⏸️ Belum ada adapter (ditunda) |

**Langkah verifikasi yang disarankan** (detail di doc 12):
1. `make migrate-up`, lalu jalankan `cmd/api` + `cmd/worker`.
2. Register agent (simpan key) dan register device `FAKE-001`.
3. Pastikan `employee_number` karyawan uji = `1023`.
4. Jalankan `attendance-agent run -d`, buka web UI, masukkan setup code, isi Connection (API + key), lalu tambahkan mesin `fake` (mode `logs`).
5. Cek `GET /attendance/raw-events` dan `GET /attendance/records` (`source=machine`, `verification=fingerprint`).
6. Matikan API sebentar, hidupkan lagi → punch tidak hilang dan tidak dobel.
7. Jalankan `POST /attendance/records/evaluate` → record machine tidak berubah.

---

## 6. Pertanyaan Terbuka (sebelum membuat adapter vendor asli)

1. Contoh respons asli EasyLink SDK: `scanlog/new` atau `scanlog/all/paging`, dan `dev/info` (data karyawan boleh disamarkan).
2. Versi SDK dan port (perkiraan 7005).
3. Boleh memakai `scanlog/new` (mengonsumsi log di SDK) atau harus read-only lewat paging?
4. Model mesin Solution yang dipakai klien → untuk menentukan protokol adapter kedua.

---

## 7. Keputusan Desain yang Perlu Dikonfirmasi

Angka-angka ini ditetapkan saat implementasi dan perlu dicocokkan dengan praktik di lapangan:

| Parameter | Nilai | Lokasi |
|---|---|---|
| Scan ulang diabaikan | < 1 menit dari punch sebelumnya | `entity.DuplicatePunchWindow` |
| Punch tanpa arah dianggap pulang | ≥ 30 menit setelah masuk | `entity.MinUnknownOutGap` |
| Ekor shift lintas tengah malam | akhir shift + 4 jam (atau `clock_out_window.to`), hanya untuk punch sebelum 12:00 | `crossMidnightTailGrace` di `process_raw_events.go` |
| Clock window / tidak ada jadwal | tidak menolak punch mesin | `ProcessRawEventsUseCase` |
| Batch maks. | 500 event, raw ≤ 4 KB, body ≤ 4 MB | `attendanceingest`, handler device |
| Toleransi jam mesin | `occurred_at` ≤ sekarang + 5 menit | `attendanceingest.MaxClockSkew` |
| Retry agent | 5 dtk → 15 mnt + jitter 20%; 401 jeda 5 mnt | `pkg/attendanceagent/agent` |

**Perbedaan dari rencana awal:**
- Paket adapter bernama `machine`, bukan `vendor`, karena `vendor/` adalah direktori khusus di Go.
- Kolom `verification` dan publish outbox dipindah dari PR2 ke PR4, tempat keduanya pertama kali dipakai.
- Token disimpan sebagai hash, bukan plaintext seperti di plan 2026-09-21.

---

## 8. Peta File (HR-SYSTEM-API)

- **Kontrak:** `pkg/attendanceingest/`
- **Domain:** `internal/modules/attendance/domain/device/` (agent, device, raw_event, employee_mapping), `domain/attendancerecord/entity/machine_punches.go`
- **Application:** `application/device/{command,query,ports}`, `application/attendancerecord/command/process_raw_events.go`
- **Infrastructure:** `infrastructure/device/{persistence,outbox}`, `infrastructure/corehrgateway/gateway.go`
- **HTTP/MQ:** `interfaces/http/device/`, `interfaces/mq/{handler,register,routing}.go`
- **Wiring:** `internal/modules/attendance/module.go`, `cmd/api/main.go`, `cmd/worker/main.go`, `internal/shared/httperror/status_map.go`
- **Core HR:** `core-hr/contract.go` (`FindEmployeeByEmployeeNumber`), repo employee + 7 test fake
- **Migrations:** `20261017000001_create_attendance_agent_ingestion_tables`, `20261017000002_create_attendance_employee_mappings_table`, `20261017000003_attendance_machine_punch_processing`
- **Agent:** `cmd/attendance-agent/{main.go,proc_unix.go,proc_windows.go,.env.example}`, `pkg/attendanceagent/{config,store,client,agent,machine,machine/fake,machine/sqldb,webui}`, target `agent-build` di `Makefile`

## 9. Peta File (HR-SYSTEM-BACKOFFICE)

- `app/composables/useMachineIntegration.ts`
- `app/pages/tenants/attendance/{machines,employee-mappings,machine-punches}.vue`
- `app/layouts/default.vue` (3 menu di grup Attendance)
