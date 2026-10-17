# 12 · Agent Lokal & Kontrak Ingestion

Dokumen ini menetapkan **kontrak netral vendor** antara *attendance agent* yang di-install di jaringan lokal klien dan endpoint ingestion di HR-SYSTEM-API. Melengkapi [08-device-integration.md](08-device-integration.md) (prinsip adapter, push vs pull) dan [10-identity-enrollment.md](10-identity-enrollment.md) (mapping `employee_ref`).

> Menggantikan model pada `plans/2026-09-21-virtual-attendance-machine-device-integration.md` (push langsung dari mesin + tulis record sinkron). Rencana implementasi & progres (apa yang sudah/belum dikerjakan): [plans/2026-10-16-attendance-agent-machine-integration.md](../../plans/2026-10-16-attendance-agent-machine-integration.md).

---

## 1. Alur

```
[Mesin FP] ◀─LAN─ [attendance-agent]                              [HR-SYSTEM-API]
                   adapter vendor → AttendanceEventInput
                   → antrean lokal (SQLite) + checkpoint
                   → kirim batch (retry/backoff) ── X-Agent-Key ──▶ POST /attendance/agent/events/batch
                                                                     → attendance_raw_events (dedup)
                                                                     → proses async → attendance_records (source=machine)
```

- **Agent** hanya tahu vendor + kontrak. Tidak tahu employee_id, shift, atau aturan HR.
- **API** hanya tahu kontrak. Tidak ada format vendor di server.
- **Raw event = sumber kebenaran.** `attendance_records` adalah proyeksi yang dihitung ulang dari raw event per (karyawan, tanggal), sehingga event yang telat datang (agent offline) tetap benar.
- Menambah vendor = menulis adapter baru di agent. Server tidak berubah.

## 2. Kontrak `AttendanceEventInput` (v1)

Kode: `HR-SYSTEM-API/pkg/attendanceingest` (dipakai bersama oleh agent dan API).

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `idempotency_key` | string(64, hex) | ✓ | SHA-256 deterministik, lihat §3 |
| `device_serial` | string | ✓ | Serial number mesin; harus terdaftar ke agent pengirim |
| `employee_ref` | string | ✓ | PIN/ID user di mesin → dipetakan ke karyawan (doc 10 §4a) |
| `occurred_at` | RFC3339 | ✓ | Waktu scan **dengan offset lokal mesin**; maks. 5 menit di masa depan |
| `direction` | enum | ✓ | `in` / `out` / `unknown` (default `unknown`; mesin sering tak andal) |
| `verification` | enum | ✓ | `fingerprint` / `face` / `card` / `pin` / `password` / `unknown` |
| `vendor_event_id` | string | – | Index log / trans_id mesin bila ada |
| `raw` | JSON | – | Record asli vendor untuk audit, maks. 4 KB |

**Batch request** (`POST /api/v1/attendance/agent/events/batch`, maks. 500 event):
```json
{
  "batch_id": "b-20261016-0001",
  "agent_version": "0.1.0",
  "events": [
    {
      "idempotency_key": "9f2c…(64 hex)",
      "device_serial": "FIO66208020150662",
      "employee_ref": "1023",
      "occurred_at": "2026-10-16T08:03:00+07:00",
      "direction": "unknown",
      "verification": "fingerprint",
      "vendor_event_id": "5521"
    }
  ]
}
```

**Response 200** — satu hasil per event, urutan sama dengan request:
```json
{
  "batch_id": "b-20261016-0001",
  "results": [
    { "idempotency_key": "9f2c…", "status": "accepted" }
  ]
}
```

| `status` | Arti untuk agent |
|---|---|
| `accepted` | Tersimpan. Tandai terkirim. |
| `duplicate` | Sudah pernah diterima. Tandai terkirim (sukses). |
| `rejected` | Permanen (dengan `code`). Pindah ke *dead letter*, jangan diulang. |

Header: `X-Agent-Key` (wajib), `X-Ingest-Contract: v1`.

## 3. Aturan Idempotency

```
idempotency_key = sha256( lower(vendor) | device_serial | employee_ref | occurred_at UTC (detik) | vendor_event_id )
```
- Scan yang sama yang ditarik dua kali (agent crash sebelum checkpoint, install ulang, pull ulang) **selalu** menghasilkan key yang sama.
- Server melakukan dedup per `(tenant_id, idempotency_key)` (`ON CONFLICT DO NOTHING`). Mengirim ulang batch yang sama **selalu aman** dan menghasilkan `duplicate`.
- `batch_id` hanya untuk korelasi log, bukan dedup.

## 4. Kode Error

**Per event** (`status: rejected`):

| Code | Sebab |
|---|---|
| `INVALID_IDEMPOTENCY_KEY` | Bukan 64 hex |
| `MISSING_DEVICE_SERIAL` / `MISSING_EMPLOYEE_REF` | Field wajib kosong |
| `INVALID_OCCURRED_AT` | Kosong atau > 5 menit di masa depan |
| `INVALID_DIRECTION` / `INVALID_VERIFICATION` | Di luar enum |
| `RAW_TOO_LARGE` | `raw` > 4 KB |
| `UNKNOWN_DEVICE` | Serial tidak terdaftar ke agent ini |

> `employee_ref` yang belum dikenal **tidak** ditolak saat ingest. Event disimpan dengan status `unmatched` dan diproses ulang setelah mapping ditambahkan.

**Level HTTP** (seluruh batch):

| Status | Perilaku agent |
|---|---|
| `401` | Key dicabut/salah → hentikan pengiriman, log keras |
| `413` | Batch terlalu besar → perkecil batch |
| `429` / `5xx` / jaringan | Retry dengan backoff eksponensial + jitter (5 s → 15 m), data tidak pernah dihapus |

## 5. Agent Lokal

Binary Go tunggal (`cmd/attendance-agent`, kode di `pkg/attendanceagent`), tanpa CGO. Bisa dijalankan di foreground, **detach ke background** (`run -d`), atau sebagai **Windows service** / **systemd** (via `kardianos/service`).

**Konfigurasi = UI browser + SQLite.** Semua setting operasional diatur dari **web UI agent** dan disimpan di `data/agent.db` (SQLite, bersama antrean dan checkpoint). Setting itu berlaku **langsung tanpa restart**:
- API base dan agent key;
- interval poll/kirim/heartbeat, timeout, batch, fetch limit, retensi;
- daftar mesin + opsi adapter.

`agent.yaml` **tidak dipakai lagi**. File **`.env`** (opsional, di folder exe atau lewat `-env`) hanya berisi bootstrap yang dibutuhkan sebelum database dibuka:

| Variabel | Default | Keterangan |
|---|---|---|
| `AGENT_LISTEN` | `0.0.0.0:8787` | Alamat/port web UI (bisa dari LAN, dilindungi password) |
| `AGENT_DATA_DIR` | `<folder exe>/data` | Database, pid file, token kontrol |
| `AGENT_LOG_FILE` | `<data>/logs/agent.log` | `""` = stdout saja |
| `AGENT_LOG_LEVEL` | `info` | `debug`/`info`/`warn`/`error` |
| `AGENT_API_BASE`, `ATTENDANCE_AGENT_KEY` | — | Opsional: menimpa nilai di UI (UI menampilkannya read-only) |

- Prioritas: flag (`-listen`, `-data`) > environment variable asli > `.env` > default.
- Contoh: `cmd/attendance-agent/.env.example`.
- Mengubah `.env` butuh restart.

**Keamanan web UI:**
- **Setup pertama** butuh **setup code** sekali pakai. Code dicetak di terminal/log dan ditampilkan oleh `status` (juga ada di `data/setup-code.txt` sampai password dibuat), lalu pengguna membuat password.
- Login (bcrypt) dengan cookie sesi `HttpOnly` + `SameSite=Strict`, idle 12 jam.
- Header `X-Agent-UI` wajib di setiap request yang mengubah data.
- Throttling login per IP.
- Agent key tidak pernah dikirim balik ke browser; yang tampil hanya `hra_xxxx…`.
- HTTP biasa di LAN = risiko yang diterima untuk saat ini.
- Lupa password: `attendance-agent reset-password`.

**Tab UI:**
- **Status**: state agent, mesin online/offline, antrean, kirim/heartbeat terakhir, mesin yang belum terdaftar di backoffice.
- **Connection**: API base + key, dengan tombol *Test connection*.
- **Machines**: tambah/edit/aktif-nonaktif/hapus. Form opsi digambar otomatis dari `OptionSpec` adapter; ada tombol *Test*.
- **Settings**: interval/limit; nilai `.env` efektif (read-only); ganti password.
- **Queue**: punch pending/dead/sent, *Retry all rejected*, *Send now*.
- **Logs**.

**Cara kerja:**
- **Poller** (satu per mesin): adapter `Fetch` dari checkpoint → event + checkpoint baru disimpan **dalam satu transaksi SQLite** → tidak ada punch hilang/ganda saat crash (punch yang di-fetch ulang punya `idempotency_key` sama). Halaman diambil terus sampai habis. Mesin gagal → backoff per mesin, mesin lain tetap jalan.
- **Sender:** ambil antrean yang jatuh tempo → kirim batch → terapkan tabel §4:
  - `accepted`/`duplicate` → terkirim; `rejected` → *dead*;
  - 5xx/429/jaringan → retry dengan backoff 5 dtk → 15 mnt + jitter (menghormati `Retry-After`);
  - 413 → ukuran batch dibagi dua;
  - 401 → jeda 5 mnt + log error. Punch **tidak pernah dihapus**.
- **Heartbeat** tiap 5 mnt: versi agent + status online/error per mesin.
- Saat start (dan setiap setting diterapkan), agent mencocokkan mesinnya dengan yang terdaftar di backoffice. Ketidakcocokan tampil di tab Status.
- Setiap setting yang berhasil diterapkan langsung membuat antrean pending jatuh tempo, jadi setelah key/URL diperbaiki punch langsung terkirim tanpa menunggu backoff.
- Event `sent` > 30 hari dihapus dari antrean lokal.

**Instalasi:**
1. Salin binary (+ opsional `.env` dari `.env.example`) ke sebuah folder di PC kantor.
2. `attendance-agent run -d` → mencetak URL web UI + setup code.
3. Buka UI dari browser (PC itu atau PC lain di LAN):
   - masukkan setup code dan buat password;
   - isi **Connection** (API base + key dari backoffice) lalu *Test connection*;
   - tambahkan mesin di **Machines**.
4. Untuk start otomatis saat boot, pakai service: `install` lalu `start` (Windows: PowerShell sebagai Administrator).

**Perintah:**

| Perintah | Fungsi |
|---|---|
| `run [-d]` | Jalankan agent + web UI (foreground, atau `-d` di background; output ke `data/agent.out`) |
| `shutdown` | Hentikan agent yang dijalankan dengan `run -d` (graceful lewat endpoint kontrol lokal, fallback kill) |
| `status` | Status service/proses, URL UI, setup code bila perlu, statistik antrean |
| `install` / `uninstall` / `start` / `stop` / `restart` | Service OS |
| `reset-password` | Hapus password UI; setup code baru langsung diterbitkan |
| `test-device [-serial SN]` | Ping mesin dari database + dry-run fetch |
| `version` | Versi + vendor yang tersedia |

- Flag umum: `-env PATH`, `-data DIR`, `-listen ADDR`.
- Satu data dir hanya bisa dipakai satu agent; instance kedua ditolak.
- Build: `make agent-build AGENT_VERSION=x.y.z` → `bin/`.

**Menambah vendor (blueprint):** buat paket `pkg/attendanceagent/machine/<vendor>` yang mengimplementasikan `machine.Adapter` (`Ping`, `Fetch(cursor, limit)`), memanggil `machine.RegisterVendor(machine.VendorInfo{Name, Label, NeedsEndpoint, Options: []OptionSpec{...}}, factory)` di `init()` (form mesin di UI dibangun otomatis dari `Options`), dan membangun event via `machine.NewEvent` (yang menghitung `idempotency_key`). Lalu tambahkan satu blank import di `cmd/attendance-agent/main.go`. Server tidak berubah. Contoh acuan: adapter `fake`.

**Vendor yang tersedia:**

| Vendor (`vendor:`) | Keterangan |
|---|---|
| `fake` | Mesin simulasi untuk dev/test (mode `grid` & `logs`) |

Adapter vendor asli (Fingerspot via EasyLink SDK, lalu Solution) **ditunda** sampai respons SDK/mesin asli tersedia. Sementara agent hanya memakai `fake`.

### Adapter uji `fake`

Mesin simulasi untuk dev/test tanpa hardware (`pkg/attendanceagent/machine/fake`). Diatur dari tab **Machines** di UI (vendor "Simulated machine"), lalu dicek dengan tombol *Test* atau `test-device`. Dua mode:

- **grid** (default): satu punch per `employee_refs` setiap `interval`, mulai `start`. Praktis untuk aliran cepat, tapi hanya di kelipatan `interval`, semua ref pada jam yang sama, dan clock-out bergeser seiring tick baru (punch terakhir = pulang).
- **`logs`**: mereplay log eksplisit — satu punch per baris `employee_ref,occurred_at[,direction[,verification]]` (RFC3339 dengan offset; default `unknown`/`fingerprint`; baris kosong/berawalan `#` diabaikan). Menentukan tanggal & jam persis dan hasilnya tetap. Saat `logs` diisi, `employee_refs`/`interval`/`start` diabaikan.

Contoh isi field **Logs** di form mesin:
```
1023,2026-10-15T09:00:00+07:00,in,fingerprint
1023,2026-10-15T17:05:00+07:00,out,fingerprint
5001,2026-10-15T08:15:00+07:00
```

`occurred_at` tidak boleh lebih dari 5 menit di masa depan (aturan kontrak §2); punch dengan `employee_ref` yang sudah dipetakan (§6) akan ter-resolve ke karyawan tersebut.

## 6. Endpoint

**Dipanggil agent** (tanpa JWT, auth `X-Agent-Key`, body maks. 4 MB):

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/v1/attendance/agent/events/batch` | Kirim batch event (§2) |
| POST | `/api/v1/attendance/agent/heartbeat` | `{agent_version, devices:[{device_serial, online, error?, last_fetch_at?}]}` → 204 |
| GET | `/api/v1/attendance/agent/config` | Mesin aktif milik agent: `{agent_id, agent_name, devices:[{device_serial, vendor, name}]}` |

Semua response memakai envelope standar `{success, data, meta}`.

**Admin** (JWT):

| Method | Endpoint | Permission | Keterangan |
|---|---|---|---|
| GET | `/attendance/agents` | `attendance:read` | Daftar agent (+ `last_seen_at`, `last_version`) |
| POST | `/attendance/agents` | `attendance:config` | `{name}` → agent + **`key` plaintext (sekali saja)** |
| POST | `/attendance/agents/{id}/revoke` | `attendance:config` | Key langsung tidak berlaku |
| POST | `/attendance/agents/{id}/rotate-key` | `attendance:config` | Key baru (sekali saja), key lama mati |
| GET | `/attendance/devices?agent_id=&branch_id=` | `attendance:read` | Daftar mesin + status koneksi |
| POST | `/attendance/devices` | `attendance:config` | `{agent_id, branch_id, vendor, serial, name}` |
| PATCH | `/attendance/devices/{id}` | `attendance:config` | Ubah field / `active: false` |
| GET | `/attendance/raw-events?status=&device_id=&employee_ref=` | `attendance:read` | Audit raw event, mis. `status=unmatched` |

| GET | `/attendance/employee-mappings?device_id=&employee_id=&employee_ref=` | `attendance:read` | Daftar mapping |
| GET | `/attendance/employee-mappings/resolve?device_id=&employee_ref=` | `attendance:read` | Cek ref ini sekarang ter-resolve ke siapa (`source`: `device_mapping` / `tenant_mapping` / `employee_number`); 404 bila tidak ada |
| POST | `/attendance/employee-mappings` | `attendance:config` | `{device_id?, employee_ref, employee_id}` — tanpa `device_id` = berlaku untuk semua mesin |
| DELETE | `/attendance/employee-mappings/{id}` | `attendance:config` | Hapus mapping |
| POST | `/attendance/employee-mappings/import` | `attendance:config` | Import massal (Cara 3), lihat di bawah |

Key agent berformat `hra_<prefix>_<secret>`; server hanya menyimpan `sha256(secret)`.

### Resolusi `employee_ref` → karyawan

Urutan (doc 10 §4a), berhenti di yang pertama cocok:
1. Mapping untuk mesin ini (Cara 2, per mesin).
2. Mapping tanpa `device_id` (Cara 2, semua mesin).
3. `employee_ref == employee_number` (Cara 1, tanpa konfigurasi).

### Import mapping massal (Cara 3)

`POST /attendance/employee-mappings/import`:
```json
{
  "dry_run": true,
  "device_id": null,
  "rows": [
    { "employee_ref": "11", "employee_number": "E-002" },
    { "employee_ref": "12", "employee_id": "<uuid>" }
  ]
}
```
- Maks. 2000 baris. Backoffice mem-parse CSV/ekspor mesin lalu mengirim `rows` (JSON).
- Karyawan diidentifikasi lewat `employee_number` **atau** `employee_id`; kalau keduanya diisi, harus menunjuk orang yang sama. Pencocokan **berdasarkan nama tidak dilakukan server** (rawan salah orang); bila perlu, itu menjadi saran di UI sebelum dikirim.
- **Dua fase:** `dry_run: true` → validasi saja, tanpa menulis. `dry_run: false` → baris valid disimpan (partial success). Setelah itu punch `unmatched` untuk ref yang baru dibuat langsung diproses ulang (`requeued`).
- Hasil per baris (`row` 1-based):
  - `create`;
  - `skip` (`ALREADY_MAPPED`, atau `REF_MATCHES_EMPLOYEE_NUMBER` karena sudah ter-resolve tanpa mapping);
  - `error` (`MISSING_EMPLOYEE_REF`, `MISSING_EMPLOYEE`, `EMPLOYEE_NOT_FOUND`, `EMPLOYEE_ID_AND_NUMBER_DISAGREE`, `DUPLICATE_REF_IN_FILE`, `REF_MAPPED_TO_OTHER_EMPLOYEE`).
- Menjalankan ulang file yang sama aman: baris yang sudah dibuat menjadi `skip`. Ref yang sudah dipetakan ke orang lain **tidak ditimpa**; hapus mapping lamanya dulu.

Mapping eksplisit selalu menang, termasuk atas `employee_number` yang kebetulan sama. Mapping ke karyawan yang sudah dihapus **tidak** jatuh ke langkah 3; hasilnya tidak cocok (`unmatched`). Branch yang dipakai untuk jadwal/aturan adalah **branch karyawan**, bukan branch mesin (sama dengan clock-in mobile).

## 7. Pemrosesan Raw Event → `attendance_records`

**Pemicu:**
- Ingest (dan reprocess) menulis pesan `attendance.raw_event.ready` `{tenant_id, raw_event_ids}` ke outbox **dalam transaksi yang sama** dengan insert. Worker memprosesnya.
- Sweep `attendance.raw_event.process_sweep` tiap 5 menit memproses raw event yang masih `pending` (pesan hilang, worker sempat mati).

**Langkah per raw event:**
1. Resolusi `employee_ref` → karyawan (§6). Tidak cocok → `unmatched`.
2. Tentukan **hari kerja** (`work_date`) di timezone branch karyawan. Punch pagi (sebelum 12:00) yang masih di dalam shift lintas tengah malam hari sebelumnya ikut **hari sebelumnya**. Batasnya `clock_out_window.to` shift, atau akhir shift + 4 jam bila window tidak diatur.
3. Per (karyawan, hari):
   - periode payroll terkunci → `skipped_locked`;
   - record hari itu milik sumber lain (`mobile`/`web`/`kiosk`/`manual`, atau record `machine` yang sudah **dikoreksi HR**) → record tidak disentuh, punch `superseded`;
   - selain itu (belum ada record, record `system` hasil Evaluator, atau record `machine`) → **hitung ulang dari semua punch hari itu** dan simpan sebagai `source: machine`, `verification` dari punch masuk.

**Pemasangan punch** (punch diurutkan; scan ulang < 1 menit diabaikan):
- Masuk = punch pertama yang bukan `out`.
- Pulang = punch terakhir sesudahnya yang bukan `in`, asalkan bertanda `out` **atau** minimal 30 menit setelah masuk. Kalau tidak ada → `incomplete`.
- Auto clock-out sistem tetap dipertahankan sampai ada punch pulang yang asli.

Karena selalu dihitung ulang dari semua punch, punch yang telat datang (agent offline berhari-hari) otomatis memperbaiki record, dan memproses ulang aman (idempotent). Berbeda dengan clock-in mobile, clock window dan `NO_SCHEDULE` **tidak** menolak punch mesin: punch tetap dicatat dan statusnya dihitung apa adanya.

**Status raw event:** `pending` → `processed` / `unmatched` / `superseded` / `skipped_locked` / `error`.

**Reprocess:** `POST /attendance/raw-events/reprocess` (`attendance:config`) `{statuses:[unmatched|error|superseded|skipped_locked], device_id?, employee_ref?}` → `{requeued}`. Membuat mapping baru otomatis me-reprocess punch `unmatched` dengan ref tersebut (response mapping berisi `requeued`).

## 8. Versi Kontrak

`v1`. Penambahan field opsional tetap `v1`; perubahan yang memecah kompatibilitas menaikkan versi dan server mendukung versi lama selama masa transisi.
