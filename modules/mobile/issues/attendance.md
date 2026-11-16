<!-- 📁 modules/mobile/issues/attendance.md -->
# Issues Backend — Attendance

Kekurangan endpoint modul **Attendance** di [API docs](../api/README.md) yang ditemukan saat integrasi aplikasi mobile. Tiap issue mengacu ke endpoint yang terdokumentasi dan dicek langsung ke server (akun karyawan `budi@gmail.com`, admin `nurdiansyah@gmail.com`, 11 Nov 2026). Status dicek ulang ke kode backend `1adf0b7` pada 16 Nov 2026. Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [ATT-1](#att-1) | Request endpoint baru: aturan absensi milik karyawan | P2 | Open |
| [ATT-2](#att-2) | Karyawan tidak bisa melihat hari libur | P2 | Open |
| [ATT-3](#att-3) | Jadwal hanya mengirim `shift_id` | P3 | `Open` |
| [ATT-4](#att-4) | Jadwal belum menandai hari cuti | P3 | `Done` (via Leave, 15 Nov) |
| [ATT-5](#att-5) | Jam di `/me/today` masih UTC | P1 | Open |
| [ATT-6](#att-6) | `/me/today` tidak mengirim `shift` untuk hari dari pola jadwal | P2 | Open |
| [ATT-7](#att-7) | `/leave/me/requests` belum bisa difilter tanggal | P3 | `Open` |
| [ATT-8](#att-8) | Clock-in tetap diterima saat cuti approved | P2 | Perlu keputusan |

---

### ATT-1
**Request endpoint baru: aturan absensi milik karyawan** · P2 · `Open`

- **Konteks:** `GET /attendance/rules` dan `POST /attendance/rules` adalah endpoint **setting admin**, dipakai backoffice (*HR Setting → Attendance Rules*, `useAttendanceRules.ts`). Aturan bisa diatur di level **Default Tenant** atau per **cabang**; cabang tanpa aturan sendiri mengikuti Default Tenant. Karyawan tidak punya akses (`PERMISSION_DENIED`), dan memang bukan untuk karyawan — endpoint ini **tidak diubah**.
- **Sudah ada di backend & API docs (*Get My Geofence*, dicek 16 Nov 2026):** `GET /attendance/me/geofence` (scope `self`) — hanya geofence: `{geofence_enabled, branch_id, branch_name, office: {lat, lng}, radius_m, accuracy_threshold_m}`.
- **Kebutuhan:** app karyawan perlu aturan yang **berlaku untuk dirinya** (sesuai cabangnya, sudah di-resolve backend) untuk: membatasi absen dalam radius kantor, cek akurasi GPS, pengingat absen pulang, dan boleh absen lebih awal saat lembur di hari off/libur. `/me/geofence` belum mencakup aturan lembur & absen pulang.
- **Request:** endpoint baru, read-only, scope `self`. Path `/attendance/me/rules` **belum ada** di backend maupun backoffice (dicek 11 Nov 2026), jadi tidak bentrok dengan `/attendance/rules` milik admin. Nama path hanya usulan — silakan disesuaikan dengan konvensi `/me/` yang sudah ada (`/me/geofence`, `/me/schedule`, `/me/today`).

```http
GET /api/v1/attendance/me/rules
Authorization: Bearer {{access_token}}
```

Tanpa parameter — cabang diambil dari karyawan yang login (seperti `/me/geofence` via `SelfEmployeeResolver`), lalu resolusi aturan **sama persis** dengan `GET /attendance/rules?branch_id=` (`GetEffective`: aturan cabang → bila tidak ada, Default Tenant).

**Respons:** pakai DTO yang sudah ada, `AttendanceRuleResponse` (sama dengan `GET /attendance/rules`), tanpa membuat bentuk baru. Contoh (data asli tenant demo, 11 Nov 2026):

```json
{
  "success": true,
  "data": {
    "id": "017a6d31-f3fb-4dba-b5d9-26d0c1e6dcf5",
    "tenant_id": "a3bc8800-7dde-440c-b169-09fd570f07a8",
    "ot_requires_approval": true,
    "ot_clock_in_lead_min": 60,
    "geofence_enabled": true,
    "geofence_radius_m": 100,
    "office_lat": -6.200378,
    "office_lng": 106.815681,
    "geofence_accuracy_threshold_m": 50,
    "auto_clockout_enabled": false,
    "forgot_clockout_cap_hours": 23,
    "clockout_reminder_min": 30,
    "created_at": "2026-11-11T04:50:54.176267Z",
    "updated_at": "2026-11-11T04:50:54.176267Z"
  },
  "meta": { "request_id": "…", "timestamp": "…" }
}
```

- `branch_id` / `branch_name` ikut terisi bila aturan berasal dari cabang; kosong bila dari Default Tenant (perilaku `GetEffective` saat ini).
- **Belum ada aturan sama sekali** (Default Tenant pun belum dibuat): `GetEffective` saat ini membalas not found. Usulan untuk endpoint karyawan: balas `200` dengan `data: null`, karena bagi karyawan ini bukan error — app menganggap tidak ada pembatasan (sama dengan `/me/geofence` yang membalas `geofence_enabled: false`).

#### Untuk apa (per field)

Tujuannya: app karyawan **mengikuti setting yang diatur HR di backoffice** (per cabang / Default Tenant), bukan angka yang di-hardcode di app. Kolom "Di backend" dicek ke kode `1adf0b7` (16 Nov 2026).

| Field | Di backend | Dipakai app untuk (UI / perilaku) |
|---|---|---|
| `geofence_enabled`, `office_lat`, `office_lng`, `geofence_radius_m` | Validasi clock-in/out | **Tampilan lokasi absen:** titik kantor di peta + lingkaran radius, jarak karyawan ke kantor, label "Absen dalam radius 100 m dari Banyumas" atau "Absen bisa dari mana saja". Cek awal di luar radius sebelum kirim |
| `geofence_accuracy_threshold_m` | Validasi clock-in/out | Peringatan "GPS kurang akurat, tunggu sebentar" sebelum kirim, bukan setelah ditolak |
| `clockout_reminder_min` | **Tidak dipakai di mana pun** (hanya disimpan) | **Notifikasi pengingat absen pulang** N menit setelah shift selesai, sesuai setting HR. Setting ini hanya bisa dijalankan oleh app karyawan, tetapi app tidak bisa membacanya, jadi **saat ini setting HR tersebut tidak berpengaruh apa-apa**. App sementara memakai angka tetap 5 menit |
| `auto_clockout_enabled`, `forgot_clockout_cap_hours` | Job absen pulang otomatis (`auto_clock_out.go`) | Info di kartu "Sedang bekerja" / Live Activity: "Absen pulang otomatis 23 jam setelah masuk", supaya karyawan tidak kaget jamnya terisi sistem |
| `ot_clock_in_lead_min` | Jendela clock-in lembur di hari off/libur (`overtime_day.go:43`) | Tombol **Absen Masuk Lembur** aktif tepat saat jendela terbuka (mis. 60 menit sebelum lembur mulai) + hitung mundur. Sekarang karyawan bisa menekan terlalu awal lalu ditolak `OUTSIDE_OVERTIME_WINDOW` |
| `ot_requires_approval` | Logika masih dikomentari (`submit_overtime_request.go:84`) | Keterangan di form lembur: "perlu persetujuan atasan" vs langsung disetujui. Belum mendesak selama backend belum memakainya |
| `branch_id`, `branch_name` | — | Menampilkan asal aturan: "Aturan cabang Banyumas" / "Aturan perusahaan" |

#### Beda dengan `GET /attendance/me/geofence` (sudah ada)

`/me/geofence` memakai resolusi aturan yang **sama** (`GetEffective`), tetapi hanya mengembalikan bagian geofence. `/me/rules` = aturan **utuh**.

| Kelompok | `/me/geofence` | `/me/rules` |
|---|:-:|:-:|
| Geofence (koordinat, radius, akurasi) | ✅ | ✅ |
| Absen pulang (pengingat, otomatis, batas lupa) | ❌ | ✅ |
| Lembur (persetujuan, boleh masuk lebih awal) | ❌ | ✅ |

Bila `/me/rules` tersedia, app cukup memanggil endpoint itu; `/me/geofence` boleh tetap ada (tidak mengganggu).

#### Alternatif yang dipertimbangkan

| Opsi | Kenapa tidak dipilih |
|---|---|
| Buka `GET /attendance/rules` untuk scope `self` | Endpoint menerima `branch_id` bebas, jadi karyawan bisa membaca aturan & koordinat kantor cabang lain. Perlu logika khusus "self = paksa cabang sendiri" di endpoint admin yang dipakai backoffice |
| Tambah field absen pulang + lembur ke `/me/geofence` | **Boleh** bila backend tidak ingin endpoint baru, hasilnya sama bagi app. Kekurangannya: nama endpoint tidak lagi sesuai isi, dan bentuk respons (`office: {lat,lng}`, `radius_m`) berbeda dari DTO aturan |

- **Prioritas P2:** absen tetap berjalan tanpa endpoint ini (server memvalidasi semuanya); yang kurang adalah UX (pengingat tidak mengikuti setting HR, karyawan baru tahu aturan setelah ditolak).
- **Catatan:** validasi tetap di backend saat `POST /attendance/clock-in` / `clock-out`; endpoint ini hanya agar app bisa memberi tahu lebih awal (mis. "Anda di luar radius kantor") sebelum mengirim.
- **Dicek ulang 16 Nov 2026 (`1adf0b7`):** belum ada. Router `attendancerule` hanya `GET/POST /rules` (admin) dan `GET /me/geofence`.
- **Sementara di app:** geofence & akurasi GPS dari `/me/geofence`; pengingat absen pulang memakai offset tetap di app, belum dari `clockout_reminder_min`.
- **Catatan BE:** —

### ATT-2
**Karyawan tidak bisa melihat hari libur** · P2 · `Open`

- **Endpoint:** `GET /attendance/holidays` (List Holidays) → `PERMISSION_DENIED` untuk karyawan. `GET /attendance/me/schedule` juga tidak menandai hari libur.
- **Temuan:** libur baru terlihat setelah lewat, dari `status: ["holiday", ...]` di `GET /attendance/me`.
- **Dampak:** kalender jadwal tidak bisa menampilkan libur nasional / cuti bersama ke depan.
- **Usulan (pilih salah satu):** izin baca `self` untuk `GET /attendance/holidays`, **atau** tambah `is_holiday` + `holiday_name` per hari di `GET /attendance/me/schedule`.
- **Catatan BE:** —

### ATT-3
**Jadwal hanya mengirim `shift_id`** · P3 · `Open`

- **Endpoint:** `GET /attendance/me/schedule` (Get My Schedule)
- **Temuan:** tiap hari hanya `{date, shift_id, duty_call, source}`; app harus memanggil `GET /attendance/shifts` lalu menggabungkan sendiri (paginasi, maks 100 per halaman).
- **Usulan:** sertakan ringkasan shift per hari (`name`, `code`, `color`, `start_time`, `end_time`, `breaks`, `late_tolerance_min`) atau daftar `shifts` yang dipakai di periode itu.
- **Catatan BE:** —

### ATT-4
**Jadwal belum menandai hari cuti** · P3 · `Done`

- **Endpoint:** `GET /attendance/me/schedule` (Get My Schedule)
- **Dampak:** hari yang sudah disetujui cuti masih tampil sebagai hari kerja di kalender jadwal.
- **Usulan:** tambah info cuti per hari (mis. `leave: { "leave_type": "Cuti Tahunan", "half_day": false }`) untuk cuti berstatus approved.
- **Keputusan (docs `abd2296`, 15 Nov 2026):** cuti **bukan** status/jenis hari. `on_leave` dihapus dari `day_kind` dan `status[]`; hari kerja tertutup cuti tercatat `["workday"]`. Client mengambil cuti dari `GET /leave/me/requests?status=approved`.
- **Di app (16 Nov 2026):** tab Hari Ini menampilkan "Cuti" dari ajuan cuti approved (full day); Ringkasan menandai record `["workday"]` tanpa clock-in sebagai Cuti. Filter tanggal: lihat [ATT-7](#att-7).
- **Catatan BE:** —

### ATT-5
**Jam di `/me/today` masih UTC** · P1 · `Open`

- **Endpoint:** `GET /attendance/me/today` (Get My Attendance Today)
- **Temuan (11 Nov 2026, akun `sari.presensi@gmail.com`, cabang Banyumas / WIB):** absen masuk pukul 15:43 WIB.
  - `GET /attendance/me` → `"clock_in": "2026-11-11T08:43:12Z"` ✅ (RFC3339, benar)
  - `GET /attendance/me/today` → `"clock_in": "08:43"` ❌ (seharusnya `"15:43"`)
  - Sama di akun budi: `"01:30"` untuk absen 08:30 WIB.
- **Penyebab:** `GetMyToday` di `attendancerecord/query/attendance_record_queries.go` memformat `record.ClockIn.Format("15:04")` langsung dari nilai UTC, tanpa `In(loc)` zona waktu cabang (padahal clock-in/out sudah memakai `resolveLocation`).
- **Dampak:** client mana pun yang menampilkan `clock_in` / `clock_out` dari endpoint ini salah 7 jam (WIB). Status `late` / `early_leave` tetap benar karena dihitung dari waktu sebenarnya.
- **Usulan:** konversi ke zona waktu cabang sebelum format, atau kirim RFC3339 seperti `/attendance/me`.
- **Dicek ulang 16 Nov 2026 (`1adf0b7`):** belum berubah, `record.ClockIn.Format("15:04")` di baris 237.
- **Sementara di app:** jam diambil dari `GET /attendance/me` (RFC3339). Setelah diperbaiki, app tetap kompatibel.
- **Catatan BE:** —

### ATT-6
**`/me/today` tidak mengirim `shift` untuk hari dari pola jadwal** · P2 · `Open` (penyebab sudah dipastikan)

- **Endpoint:** `GET /attendance/me/today`
- **Temuan (11 Nov 2026, akun budi & `tester.presensi`):** `day_kind: "workday"`, tetapi field `shift` tidak ada. Padahal `GET /attendance/me/schedule` untuk tanggal yang sama berisi `shift_id` (shift *Normal*, `source: "fixed"`).
- **Penyebab (dicek di kode, `9b2a9f2` 12 Nov 2026):** `GetMyToday` (`attendancerecord/query/attendance_record_queries.go:221`) hanya membaca jadwal tersimpan lewat `scheduleRepo.FindByEmployeeAndDate`. Clock-in / clock-out (`attendancerecord/command/resolve.go`, `dayResolver.resolve`) dan `/me/schedule` me-resolve: jadwal tersimpan → pola kerja *fixed* → libur. Karyawan dengan pola fixed tidak punya baris jadwal per hari, jadi `shift` selalu kosong di `/me/today`, padahal clock-in tetap memakai shift dari pola.
- **Terulang (12 Nov 2026, akun `tester.presensi`):** `/me/today` → `day_kind: "workday"` tanpa `shift`; `/me/schedule` tanggal yang sama → `shift_id` *Normal*, `source: "fixed"`.
- **Dampak:** client tidak tahu nama & jam shift hari ini dari endpoint ini (mis. untuk peringatan pulang cepat).
- **Usulan:** `GetMyToday` mengambil shift dari `dayResolver` yang sama dengan clock-in (`day_kind` di endpoint ini sudah dari resolver itu lewat `OvertimeDay`).
- **Sementara di app:** shift diambil dari `GET /attendance/me/schedule`; tombol absen memakai `day_kind`.
- **Catatan BE:** —

### ATT-7
**`/leave/me/requests` belum bisa difilter tanggal** · P3 · `Open`

- **Endpoint:** `GET /leave/me/requests` (dipakai Attendance untuk tahu hari ini cuti atau tidak, sesuai [api/attendance.md](../api/attendance.md) §3)
- **Temuan:** hanya filter `status`; docs sendiri menulis *"endpoint itu belum punya filter tanggal"*.
- **Dampak:** untuk cek cuti hari ini, app menarik semua cuti approved milik karyawan (sementara maks 100 baris), dan makin besar seiring waktu.
- **Usulan:** filter `date_from` / `date_to` (overlap dengan rentang cuti), sama seperti `GET /leave/requests` admin.
- **Catatan BE:** —

### ATT-8
**Clock-in tetap diterima saat cuti approved** · P2 · `Perlu keputusan`

- **Endpoint:** `POST /attendance/clock-in`
- **Temuan (kode `1adf0b7`, 16 Nov 2026):** `ClockInUseCase.Execute` (`attendancerecord/command/clock_in.go`) me-resolve `day.OnLeave` tetapi hanya meneruskannya ke `ComputeStatus`; tidak ada penolakan. Karyawan yang sedang cuti full-day tetap bisa absen masuk.
- **Pertanyaan:** disengaja (mis. batal cuti mendadak lalu masuk kerja) atau seharusnya ditolak dengan error khusus (mis. `ON_LEAVE`)? Bila disengaja, bagaimana nasib saldo cuti hari itu?
- **Di app:** tombol Absen Masuk disembunyikan saat cuti full-day approved (status "Sedang cuti"); validasi akhir tetap di backend.
- **Catatan BE:** —
