# 05 · API Contract

Prefix `/api/v1/attendance`. Envelope standar HRMS. Dijaga Entitlement (fitur `attendance`) + RBAC (scope cabang/self).

---

## Ringkasan Endpoint

### Clock & Records
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| POST | `/attendance/clock-in` | Clock in | `attendance:self` |
| POST | `/attendance/clock-out` | Clock out | `attendance:self` |
| GET | `/attendance/me` | Kehadiran sendiri (catatan absen) | `attendance:self` |
| GET | `/attendance/me/schedule` | **Jadwal sendiri** (shift ke depan) | `attendance:self` |
| GET | `/attendance/me/today` | Jadwal & status hari ini | `attendance:self` |
| GET | `/attendance/records` | Daftar catatan (filter) | `attendance:read` |
| POST | `/attendance/records` | Input manual (HR) | `attendance:write` |
| POST | `/attendance/records/evaluate` | Evaluasi periode: `{date_from, date_to, branch_id?}` (maks 31 hari, s/d kemarin). Hari tanpa record diisi record `source=system` (absent/on_leave/holiday/day_off); record system lama dihitung ulang; record ber-clock-in/manual/terkoreksi tidak disentuh. Response: ringkasan jumlah per status + yang di-skip | `attendance:write` |
| POST | `/attendance/records/{id}/correction` | Ajukan/terapkan koreksi (self hanya untuk catatan miliknya sendiri) | `attendance:self` / `attendance:write` |
| GET | `/attendance/me/corrections` | Status pengajuan koreksi milik sendiri | `attendance:self` |
| POST | `/attendance/corrections/{id}/approve` | Setujui koreksi | `attendance:approve` |

### Shift & Schedule
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/attendance/shifts` | Katalog shift | `attendance:read` / `attendance:self` |
| POST | `/attendance/shifts` | Buat shift | `attendance:config` |
| GET | `/attendance/schedule-patterns` | Daftar pola kerja | `attendance:read` / `attendance:self` |
| POST | `/attendance/schedule-patterns` | Buat pola kerja | `attendance:config` |
| PATCH | `/attendance/schedule-patterns/{id}` | Ubah pola kerja | `attendance:config` |
| DELETE | `/attendance/schedule-patterns/{id}` | Nonaktifkan pola | `attendance:config` |
| POST | `/attendance/schedule-patterns/{id}/activate` | Aktifkan kembali pola | `attendance:config` |
| POST | `/attendance/schedule-patterns/{id}/generate` | Materialisasi pola rotation ke `schedules` | `attendance:write` |
| GET | `/attendance/schedules` | Jadwal (filter tanggal/karyawan) | `attendance:read` |
| POST | `/attendance/schedules` | Tugaskan shift (single/pola/rotasi) | `attendance:write` |
| POST | `/attendance/schedules/generate` | Generate baris dari pola (rentang tertentu) | `attendance:write` |
| GET | `/attendance/holidays` | Kalender libur | `attendance:read` |
| POST | `/attendance/holidays` | Kelola libur | `attendance:config` |
| GET | `/attendance/holidays/external` | Preview kalender libur eksternal (tidak disimpan) | `attendance:config` |
| POST | `/attendance/holidays/bulk` | Simpan hasil mapping preview (all-or-nothing) | `attendance:config` |

### Overtime & Rekap
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| POST | `/attendance/overtime` | Ajukan lembur (self hanya untuk dirinya sendiri) | `attendance:self` / `attendance:write` |
| GET | `/attendance/me/overtime` | Status pengajuan lembur milik sendiri | `attendance:self` |
| POST | `/attendance/overtime/{id}/approve` | Setujui lembur (boleh mempersingkat window) | `attendance:approve` |
| POST | `/attendance/overtime/{id}/reject` | Tolak lembur | `attendance:approve` |
| POST | `/attendance/overtime/{id}/cancel` | Batalkan (pending, atau approved sebelum mulai) | `attendance:self` / `attendance:write` |
| — | `/attendance/overtime-rules…`, `/attendance/overtime/transactions…` | Overtime rule & transaksi — lihat [13 §9](./13-overtime-management.md#9-api) | |
| GET | `/attendance/summary` | Rekap periode (untuk Payroll) | `attendance:read` |

---

## 0. Kontrak Timezone (berlaku di semua endpoint di bawah)

Setiap field instant yang diterima dari client (`timestamp` pada clock-in/clock-out, `clock_in`/`clock_out` pada input manual & koreksi) **wajib RFC3339 dengan offset eksplisit** — `Z` atau `±HH:MM`; string tanpa offset (mis. `"2026-01-15T07:55:00"`) ditolak `422 INVALID_RECORD_ARGUMENT`/`INVALID_CORRECTION_ARGUMENT`.

Offset yang dikirim client **tidak menentukan** tanggal kalender atau jam dinding yang dipakai untuk hitung telat/pulang cepat/lembur. Server selalu me-reproyeksi instant tersebut ke timezone cabang karyawan yang bersangkutan (fallback: timezone tenant, lalu default platform — lihat [platform/tenant/04-data-model.md](../platform/tenant/04-data-model.md)), apa pun offset yang dikirim. Jadi `"2026-01-14T18:30:00Z"`, `"2026-01-15T01:30:00+07:00"`, dan `"2026-01-15T02:30:00+08:00"` — tiga representasi instant fisik yang sama — menghasilkan tanggal/status yang identik untuk cabang ber-timezone Asia/Jakarta (UTC+7), bukan tiga hasil berbeda tergantung offset yang kebetulan dikirim client itu. Ini defense-in-depth di server: berlaku sama untuk kiriman dari mobile app, kiosk, maupun integrasi pihak ketiga di masa depan, tanpa bergantung pada offset lokal perangkat pengirim.

---

## 1. POST /attendance/clock-in
```json
{ "timestamp": "2026-01-15T08:03:00+07:00", "lat": -6.200, "lng": 106.816, "source": "mobile", "photo_ref": "storage://..." }
```
**Response `201 Created`**
```json
{
  "success": true,
  "data": { "id": "att_01H8...", "clock_in": "08:03", "status": ["workday", "incomplete", "on_time"], "geofence": "ok" }
}
```
**Error:** `422 OUTSIDE_GEOFENCE`, `422 OUTSIDE_CLOCK_WINDOW`, `409 ALREADY_CLOCKED_IN`.

---

## 2. POST /attendance/schedules
Menugaskan shift massal — mendukung pemilihan target fleksibel (manual & by grup).
```json
{
  "target": {
    "mode": "group",
    "group_type": "department",
    "group_ref": "org_produksi",
    "include_employee_ids": [],
    "exclude_employee_ids": ["emp_cuti_panjang"]
  },
  "pattern": "weekly",
  "days": ["mon","tue","wed","thu","fri"],
  "shift_id": "shift_pagi",
  "date_from": "2026-01-01",
  "date_to": "2026-01-31"
}
```

**Pemilihan target (`target.mode`):**
| Mode | Cara |
|---|---|
| `manual` | Centang eksplisit via `include_employee_ids` |
| `group` | By grup (`department`/`position`/`branch`) via `group_type` + `group_ref` |

Keduanya bisa dikombinasi: pilih grup, lalu **kecualikan** sebagian via `exclude_employee_ids` (mis. yang sedang cuti panjang), atau **tambah** individu via `include_employee_ids`.

**Response `201 Created`** — jadwal dibuat untuk target × rentang tanggal. Baris `source: manual` yang sudah ada tidak ditimpa.

> **Scope:** `GET/POST /attendance/schedules` untuk HR/manajer (izin `read`/`write`, lihat/atur jadwal orang lain, difilter cabang). Karyawan memakai `/attendance/me/schedule` (izin `self`, hanya jadwal sendiri).

---

## 2b. GET /attendance/me/schedule

Karyawan melihat **jadwal shift-nya sendiri** ke depan. Read-only.

`GET /attendance/me/schedule?date_from=2026-01-15&date_to=2026-01-21`
```json
{
  "success": true,
  "data": [
    { "date": "2026-01-15", "shift": { "name": "Reguler", "start": "08:00", "end": "17:00" }, "status": "scheduled" },
    { "date": "2026-01-16", "shift": { "name": "Reguler", "start": "08:00", "end": "17:00" }, "status": "scheduled" },
    { "date": "2026-01-17", "shift": null, "status": "day_off" },
    { "date": "2026-01-18", "shift": null, "status": "holiday", "holiday_name": "Contoh Libur" }
  ]
}
```
Menampilkan shift per tanggal, hari libur, dan day-off — agar karyawan tahu kapan & jam berapa harus masuk.

---

## 2c. GET /attendance/me/today

Ringkasan hari ini untuk layar utama karyawan (mobile): jadwal hari ini + apakah sudah clock-in.
```json
{
  "success": true,
  "data": {
    "date": "2026-01-15",
    "shift": { "name": "Reguler", "start": "08:00", "end": "17:00" },
    "clock_in": "08:03",
    "clock_out": null,
    "status": ["workday", "incomplete", "on_time"]
  }
}
```

---

## 2d. `/attendance/schedule-patterns` (CRUD + activate + generate)

Pola kerja tenant-wide. Karyawan menempel ke pola lewat career path (`pattern_id`). Mode `fixed` memakai `weekly_shifts` (map hari → shift) dan di-resolve live; mode `rotation` memakai `rotation_sequence` + `anchor_date` dan baru menulis baris `schedules` setelah Generate.

`GET /attendance/schedule-patterns?search=&mode=fixed&active=true&page=1&per_page=20`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "name": "Senin–Sabtu (Jumat pendek)",
      "mode": "fixed",
      "color": "#0ea5e9",
      "description": "Sabtu setengah hari",
      "active": true,
      "weekly_shifts": [
        { "day": "mon", "shift_id": "uuid", "shift_name": "Reguler", "shift_code": "REG", "shift_color": "#22c55e" },
        { "day": "fri", "shift_id": "uuid", "shift_name": "Jumat Pendek", "shift_code": "JMT", "shift_color": "#f59e0b" },
        { "day": "sat", "shift_id": "uuid", "shift_name": "Setengah Hari", "shift_code": "STG", "shift_color": "#a855f7" }
      ],
      "working_days": ["mon", "tue", "wed", "thu", "fri", "sat"],
      "employee_count": 12,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "pagination": { "page": 1, "per_page": 20, "total_items": 1, "total_pages": 1, "next": null, "prev": null }
  }
}
```
- `weekly_shifts` (fixed) berurutan `mon`..`sun`, hanya hari yang punya shift; hari yang tidak ada = libur. `working_days` adalah turunan untuk pembaca lama.
- `shift_name`/`shift_code`/`shift_color` opsional (bisa absen bila shift tidak ditemukan).
- List filter: `search`, `mode` (`fixed`/`rotation`), `active` (`true`/`false`).

`POST /attendance/schedule-patterns`
```json
{
  "name": "Senin–Sabtu (Jumat pendek)",
  "mode": "fixed",
  "weekly_shifts": {
    "mon": "shift-uuid-reguler",
    "tue": "shift-uuid-reguler",
    "wed": "shift-uuid-reguler",
    "thu": "shift-uuid-reguler",
    "fri": "shift-uuid-jumat",
    "sat": "shift-uuid-setengah-hari"
  },
  "color": "#0ea5e9",
  "description": "Sabtu setengah hari"
}
```
Mode rotation:
```json
{
  "name": "Regu A",
  "mode": "rotation",
  "rotation_sequence": [
    { "shift_id": "shift-uuid-pagi", "days": 3 },
    { "shift_id": "shift-uuid-malam", "days": 3 },
    { "is_off": true, "days": 1 }
  ],
  "anchor_date": "2026-01-01",
  "phase_offset": 0
}
```
- Fixed: `weekly_shifts` wajib ≥1 entri; key harus `mon`..`sun`; value tidak boleh kosong; semua shift harus aktif. Field rotation diabaikan/dibersihkan.
- Rotation: `rotation_sequence` wajib; `cycle_length` boleh 0 (diturunkan); `anchor_date` wajib.

`PATCH /attendance/schedule-patterns/{id}` — field yang dikirim menggantikan nilai lama; `mode` tidak bisa diubah. `weekly_shifts` non-null **mengganti seluruh map** (map kosong ditolak karena fixed wajib ≥1 entri). Response = objek pola (sama seperti item list).

`DELETE /attendance/schedule-patterns/{id}` → `204`. Ditolak bila masih ada karyawan memakai pola. `POST /{id}/activate` → objek pola.

`POST /attendance/schedule-patterns/{id}/generate`
```json
{ "date_from": "2026-02-01", "date_to": "2026-02-28" }
```
```json
{ "success": true, "data": { "employees": 12, "generated": 336, "skipped_manual": 0 } }
```
Hanya untuk rotation (maks 366 hari). Baris `source: manual` tidak ditimpa; fixed tidak perlu generate.

---

## 3. GET /attendance/summary
Rekap periode per karyawan — endpoint utama yang dikonsumsi Payroll.

`GET /attendance/summary?period=2026-01&employee_id=emp_01H8...`

**Filter (termasuk Working Time Filter):**
| Param | Fungsi |
|---|---|
| `period` / `date_from` / `date_to` | Rentang waktu |
| `employee_id` / `branch_id` / `department_id` | Cakupan subjek |
| `shift_id` | Filter shift tertentu |
| `work_time[status]` | Filter nilai status (03 §4). Boleh beberapa (diulang atau dipisah koma) — record harus memuat **semua** nilai, mis. `work_time[status]=late,overtime` |
| `work_time[min_hours]` / `work_time[max_hours]` | Filter jam kerja (mis. < 4 jam / > 10 jam) |
| `work_time[has_overtime]` | Hanya yang ada lembur |
| `work_time[has_late]` | Hanya yang telat |

> **Working Time Filter** (`work_time[...]`) memudahkan HR menyaring berdasar perilaku waktu kerja — mis. "siapa yang lembur bulan ini", "siapa yang jam kerjanya kurang", "siapa yang sering telat" — untuk laporan & tindak lanjut.
```json
{
  "success": true,
  "data": {
    "employee_id": "emp_01H8...",
    "period": "2026-01",
    "work_days": 22,
    "present_days": 20,
    "late_count": 3,
    "late_minutes": 40,
    "overtime_hours": 6,
    "absent_days": 1,
    "leave_days": 1
  }
}
```

---

## 4. POST /attendance/overtime

```json
{
  "employee_id": "emp_123",
  "date": "2026-10-26",
  "planned_start_at": "2026-10-26T17:00:00+07:00",
  "planned_end_at": "2026-10-26T20:00:00+07:00",
  "reason": "Closing akhir bulan",
  "task_description": "Rekonsiliasi stok"
}
```
`requested_minutes` diturunkan dari window (180). Window boleh melewati tengah malam. Maksimal satu request pending/approved per karyawan per tanggal (`OVERTIME_REQUEST_EXISTS`).

### POST /attendance/overtime/{id}/approve
```json
{ "approved_end_at": "2026-10-26T19:00:00+07:00", "note": "Sampai 19:00 saja" }
```
`approved_end_at` opsional; tanpa field ini seluruh window disetujui. Nilai di luar window ditolak. Reviewer tidak boleh menyetujui request miliknya sendiri (`OVERTIME_SELF_APPROVAL`). Request adalah otorisasi — durasi aktual dihitung dari absensi (lihat [13](./13-overtime-management.md)).

---

## 4b. Import hari libur dari kalender eksternal

Sumber saat ini: [api-libur opica](https://app.opica.id/api-libur/) — gabungan `/api` (libur nasional & cuti bersama) dan `/api/hari-nasional` (hari peringatan). Hasil di-cache di server 6 jam per (tahun, bulan).

### GET /attendance/holidays/external?year=2026&month=12
`year` wajib (2000–2100), `month` opsional (1–12). **Tidak menyimpan apa pun.** Setiap baris belum punya kategori (`type: null` → *Uncategorized*) dan belum ditentukan libur/tidak (`is_observed: null`) — user memetakannya di UI.
```json
{
  "success": true,
  "data": [
    { "date": "2026-12-22", "name": "Hari Ibu", "source": "national_observance", "source_type": "sosial",
      "description": null, "is_public_holiday": false, "type": null, "is_observed": null, "already_exists": false },
    { "date": "2026-12-25", "name": "Hari Raya Natal", "source": "national_holiday", "source_type": "libur_nasional",
      "description": null, "is_public_holiday": null, "type": null, "is_observed": null,
      "already_exists": true, "existing_holiday_id": "…" }
  ]
}
```
`source`: `national_holiday` (libur resmi/cuti bersama) atau `national_observance` (peringatan; `is_public_holiday` hanya petunjuk dari sumber). `already_exists`: tenant sudah punya libur dengan tanggal + nama sama (case-insensitive).

### POST /attendance/holidays/bulk
```json
{ "items": [
  { "date": "2026-12-24", "name": "Cuti Bersama Hari Raya Natal", "type": "collective_leave", "is_observed": false },
  { "date": "2026-12-25", "name": "Hari Raya Natal", "type": "national", "is_observed": true, "overtime_multiplier": 2.0 }
] }
```
Maks 500 item. `type` (kode `holiday_category` aktif) dan `is_observed` **wajib** per item. Satu item invalid → `422 INVALID_HOLIDAY_ARGUMENT` (pesan diawali `row N:`) dan tidak ada yang disimpan. Item yang sudah ada (tanggal + nama) di-skip, bukan error.

**Response `201 Created`**
```json
{ "success": true, "data": { "created": [ { "id": "…", "date": "2026-12-24", "type": "collective_leave", "type_name": "Collective Leave (Cuti Bersama)", "is_observed": false, "…": "…" } ],
  "skipped": [ { "date": "2026-12-25", "name": "Hari Raya Natal", "reason": "already_exists" } ] } }
```

---

## 5. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `FEATURE_NOT_IN_PLAN` | 403 | Tenant tak berlangganan fitur attendance |
| `OUTSIDE_GEOFENCE` | 422 | Clock-in di luar area kerja |
| `OUTSIDE_CLOCK_WINDOW` | 422 | Clock-in/out di luar `clock_in_window`/`clock_out_window` shift |
| `ALREADY_CLOCKED_IN` | 409 | Sudah clock-in & belum clock-out |
| `NO_SCHEDULE` | 422 | Tidak ada jadwal & tanpa default |
| `CORRECTION_NOT_ALLOWED` | 409 | Periode sudah dikunci Payroll |
| `VALIDATION_ERROR` | 400/422 | Input tidak valid |
| `INVALID_HOLIDAY_ARGUMENT` | 422 | Data libur / parameter import tidak valid |
| `HOLIDAY_SOURCE_UNAVAILABLE` | 502 | Kalender libur eksternal gagal diakses |
