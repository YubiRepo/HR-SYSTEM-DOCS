<!-- 📁 plans/2026-09-19-timezone-multi-branch-audit-remediation.md -->
# Audit & Rencana Remediasi: Timezone Multi-Cabang (Multi-Branch)

| | |
|---|---|
| **Status** | Audit selesai · Remediasi belum dieksekusi |
| **Tanggal audit** | 2026-09-19 |
| **Pemicu** | Bug live ditemukan saat testing manual clock-in/out (lihat §2) |
| **Modul terdampak** | Attendance, Shift/Schedule, Leave, Holiday, Payroll (belum dibangun), Platform/Tenant, Scheduler/Worker, Backoffice (frontend) |
| **Repo terkait** | HR-SYSTEM-API, HR-SYSTEM-BACKOFFICE |

---

## 1. Ringkasan Eksekutif

**FAKTA**: [modules/platform/tenant/04-data-model.md](../modules/platform/tenant/04-data-model.md) dan [02-lifecycle.md](../modules/platform/tenant/02-lifecycle.md) sudah secara eksplisit mendokumentasikan `timezone` sebagai field tenant/branch (WIB/WITA/WIT), termasuk contoh kebutuhan kalender libur berbeda per cabang (mis. Nyepi untuk cabang Bali, lihat [modules/attendance/02-shift-schedule.md](../modules/attendance/02-shift-schedule.md)). **Implementasinya nol persen** — tidak ada kolom timezone di schema, tidak ada domain logic yang pernah resolve timezone per-tenant/branch, cron tidak sadar timezone, dan frontend tidak pernah menampilkan/menghitung berdasarkan timezone cabang.

Ini bukan sekadar "multi-tenant butuh field timezone." Begitu perusahaan buka cabang di luar WIB (Makassar/WITA, Jayapura/WIT), **setiap perhitungan attendance, shift, leave, dan cron job untuk cabang itu akan diam-diam salah hitung terhadap jam dinding yang keliru — tanpa error, tanpa warning, cuma menghasilkan late-minutes, overtime, dan input payroll yang salah.**

Selain gap arsitektur di atas, ditemukan juga 2 bug yang **sudah live di produksi hari ini** (bukan risiko hipotetis multi-cabang): korupsi data pada setiap pembacaan `leave_requests`/`holidays`, dan kegagalan clock-out untuk shift yang melewati tengah malam (overnight shift). Detail di §6.

---

## 2. Latar Belakang

Audit ini dipicu oleh bug yang ditemukan saat testing fitur manual clock-in/out di Backoffice: input jam manual dikirim sebagai timestamp RFC3339 dengan akhiran `Z` (UTC), lalu backend membaca `.Hour()` langsung dari timestamp itu tanpa konversi ke timezone platform — mengoreksi jam clock-out 18:00 WIB menjadi status `early_leave` (360 menit) alih-alih `overtime` yang benar. Penelusuran akar masalah ini memicu audit menyeluruh (3 agent eksplorasi paralel: backend, database schema, frontend + dokumen bisnis) yang mengungkap gap arsitektur yang jauh lebih besar dari sekadar satu bug.

---

## 3. Arsitektur Waktu Saat Ini

```
Frontend (Backoffice)
  → new Date()/toISOString() — paksa ke UTC "Z", offset lokal hilang
  → HTTP Request — timestamp RFC3339 (offset bebas), atau string mentah "YYYY-MM-DD"/"HH:MM"
  → API Handler — bind JSON, tidak ada validasi/normalisasi offset
  → Application/Command layer — time.Parse(RFC3339, ...) dipakai APA ADANYA, tanpa .In(loc)
       ⚠ ComputeStatus/minutesOfDay di attendance membaca .Hour()/.Minute() langsung dari
         Location apa pun yang terbawa di timestamp hasil parse
  → Domain entity — asumsi (hanya lewat doc comment, tidak di-enforce) input sudah "tenant-local"
  → Repository — kolom TIMESTAMPTZ menyimpan UTC dengan benar; kolom DATE bertipe benar,
       tapi 2 dari 5 repo yang relevan tidak melakukan cast `::text` saat SELECT → data korup
  → Database (Postgres) — tidak ada konfigurasi timezone level koneksi/session
  → Scheduler/Worker — cron selalu dievaluasi terhadap time.Now().UTC(); timeutil.Init()
       di worker main.go tidak berpengaruh ke timing cron sama sekali
  → External Integration — belum ada (modul Payroll belum dibangun; belum ada integrasi
       mesin biometrik yang ditemukan)
  → Response — timestamp diformat UTC "Z" (benar, konsisten)
  → Frontend — ditampilkan via toLocaleString('id-ID', ...), benar untuk display
```

**Gap tunggal yang paling berdampak**: `timeutil.Loc()` — satu-satunya mekanisme yang bisa menghasilkan jam dinding lokal platform — tidak pernah dipanggil di business logic manapun. Semua yang butuh "tanggal kalender lokal" atau "jam lokal" malah mendapat nilai relatif-UTC atau server-local yang tidak terkontrol.

---

## 4. Timezone Authority per Modul

| Modul | Yang SEHARUSNYA jadi acuan (per dokumen) | Yang SEBENARNYA jadi acuan (per kode) | Gap |
|---|---|---|---|
| Attendance (clock in/out, telat/lembur) | Timezone cabang karyawan | Offset apa pun yang dikirim client (atau `time.Now()` server-local bila tidak ada) | **CRITICAL** |
| Shift/Schedule | Timezone cabang (shift = katalog tenant, working-days/kalender per-cabang per dokumen) | Global `APP_TIMEZONE`, tidak pernah benar-benar dikonsultasi | **CRITICAL** |
| Leave | Timezone cabang/tenant untuk validasi tanggal | Timezone-agnostic (tanggal berupa string) — benar secara prinsip, tapi pembacaan korup (lihat Temuan #3) | HIGH (bug data, bukan logika tz) |
| Holiday | Kalender per-cabang (contoh eksplisit Bali/Nyepi di dokumen) | Global — tidak bisa dibedakan per cabang; pembacaan korup (Temuan #3) | **CRITICAL** |
| Payroll | Belum dibangun | N/A — baru `NoopPayrollPeriodLockProvider` placeholder | Tertunda, tapi otomatis mewarisi semua bug upstream begitu dibangun |
| Employee (tanggal lahir/masuk kerja) | Calendar date, tanpa timezone | `TIMESTAMPTZ` di DB (tipe tidak sesuai) tapi parsing timezone-agnostic — risiko praktis rendah | MEDIUM (kerapihan tipe) |
| Approval (leave/correction) | Instant (UTC) | `time.Now().UTC()` — benar | Tidak ada |
| Scheduler/Worker | Jam dinding platform/cabang (dokumen mengasumsikan "01:00" berarti waktu lokal) | UTC, tanpa syarat | **CRITICAL** |
| Notification/Messaging | Instant (UTC) | `time.Now().UTC()` — benar | Tidak ada |
| Audit Log | Instant (UTC), lokal hanya untuk tampilan | Benar — satu-satunya pemanggil `timeutil.FormatISO8601` | Tidak ada |

---

## 5. Inventaris Field Waktu (representatif)

> Kolom `created_at`/`updated_at` di ~30 tabel seragam `TIMESTAMPTZ` dan sudah benar — tidak didaftar ulang di sini.

| Field | Modul | Semantik | Tipe Saat Ini | TZ Saat Ini | TZ Seharusnya | Risiko |
|---|---|---|---|---|---|---|
| `attendance_records.clock_in/clock_out` | Attendance | Instant | `TIMESTAMPTZ` | Apa pun yang dikirim client, dibaca mentah | Local cabang (direproyeksi) | **CRITICAL** |
| `attendance_records.date` | Attendance | Calendar Date | `DATE` (repo sudah `::text`) | Diturunkan dari `now` yang mungkin UTC | Local cabang | **CRITICAL** |
| `shifts.start_time/end_time` | Shift | Local Time | `VARCHAR(5)` "HH:MM" | Diasumsikan platform-local, tidak di-enforce | Local cabang, eksplisit | HIGH |
| `leave_requests.date_from/date_to` | Leave | Calendar Date | `DATE` (repo **belum** cast `::text`) | N/A (seharusnya tz-agnostic) | N/A | **CRITICAL** (bug korupsi data live) |
| `holidays.date` | Holiday | Calendar Date | `DATE` (repo **belum** cast `::text`) | N/A | N/A, per-cabang | **CRITICAL** (bug live + belum ada dukungan per-cabang) |
| `branches.timezone` | Org | N/A | **Tidak ada** | N/A | String IANA | **CRITICAL** (gap arsitektur) |
| `tenants.timezone` | Org | N/A | **Tidak ada** | N/A | String IANA (tier fallback) | **CRITICAL** |
| `employees.birth_date`, `hire_date` | Employee | Calendar Date | `TIMESTAMPTZ` (seharusnya `DATE`) | UTC | N/A | MEDIUM |
| `assignments.start_date/end_date`, `employment_history/status_history.effective_date` | Employee | Calendar Date | `TIMESTAMPTZ` (seharusnya `DATE`) | UTC | N/A | MEDIUM |
| `contracts.start_date/end_date` | Employee | Calendar Date | `DATE` (benar) | N/A | N/A | LOW |
| `scheduled_jobs.next_run_at` | Scheduler | Instant | `TIMESTAMPTZ` | Dihitung dari cron yang dievaluasi UTC | Seharusnya cerminkan jam lokal yang dimaksud | HIGH |
| `attendance_corrections.old_value/new_value` | Attendance | Instant (sebagai teks bebas) | `VARCHAR(255)` | RFC3339 mentah, tidak dinormalisasi | Local cabang, direproyeksi | HIGH |
| `overtime_requests.date` | Attendance | Calendar Date | `DATE` (benar) | N/A | N/A | LOW |

---

## 6. Temuan & Severity

### CRITICAL

**T1 — Tidak ada timezone authority di level branch maupun tenant**
- Lokasi: `internal/modules/platform/domain/tenant/entity/{branch.go,tenant.go}`; `migrations/20260827000001_create_tenant_tables.up.sql`
- Perilaku saat ini: kedua struct/tabel tidak punya field timezone. Satu env var global `APP_TIMEZONE` berlaku sama untuk semua tenant/cabang.
- Kenapa salah: dokumen ([04-data-model.md](../modules/platform/tenant/04-data-model.md)) sudah eksplisit mendefinisikan `timezone` sebagai field branch/tenant, dengan contoh kasus cabang Bali butuh kalender liburnya sendiri.
- Perilaku yang diharapkan: `branches.timezone` (IANA string), fallback ke `tenants.timezone`, fallback ke default platform.
- Dampak: cabang mana pun di luar WIB akan salah hitung attendance/schedule/leave/cron — diam-diam.

**T2 — Timestamp clock-in/out dari client dengan offset UTC dibaca sebagai jam dinding lokal**
- Lokasi: `internal/modules/attendance/application/attendancerecord/command/clock_in.go:122-131` (`parseTimestampOrNow`), pola sama di `clock_out.go`, `create_manual_record.go`; dikonsumsi `attendance_record.go:237-239` (`minutesOfDay`)
- Dampak: **dikonfirmasi live** — clock-out jam 18:00 WIB terhitung `early_leave` 360 menit alih-alih `overtime` yang benar. Langsung mengoreksi `LateMinutes`/`OvertimeMinutes` yang jadi input payroll.

**T3 — Pembacaan `leave_requests` dan `holidays` mengembalikan string tanggal korup (bug data live, bukan soal timezone semata)**
- Lokasi: `internal/modules/leave/infrastructure/leaverequest/persistence/postgres_leave_request_repo.go:25-26`; `internal/modules/attendance/infrastructure/holiday/persistence/postgres_holiday_repo.go:23`
- Perilaku saat ini: pgx mengembalikan kolom `DATE` sebagai `time.Time`; di-scan ke destinasi `*string` tanpa cast `date::text` pada SELECT menghasilkan `"2026-09-14T00:00:00Z"`, bukan `"2026-09-14"`.
- Catatan: bug identik sudah ditemukan & diperbaiki untuk `attendance_records`/`schedules`/`schedule_patterns` (pola repo sama, cast `::text` sudah diterapkan) — dua repo ini terlewat.
- Dampak: **setiap pembacaan leave request dan holiday hari ini mengembalikan field tanggal yang korup.**

**T4 — Semua jadwal cron dievaluasi terhadap UTC, bukan waktu lokal platform**
- Lokasi: `internal/modules/scheduler/application/dispatcher.go:63-64,85`; `cron.go:13-19`
- Perilaku saat ini: `robfig/cron`'s `NextRun` selalu dipanggil dengan `time.Now().UTC()`, sehingga semua ekspresi cron diam-diam diinterpretasikan sebagai waktu UTC.
- Dampak konkret: `"0 1 1 * *"` (dimaksud "01:00 WIB tanggal 1") sebenarnya jalan jam 08:00 WIB. Job contract-expiry-check jalan jam 11:00 (bukan 04:00), renewal-check jam 09:00 (bukan 02:00), dunning-check jam 10:00 (bukan 03:00).

### HIGH

**T5 — Clock-out gagal untuk shift overnight begitu jam dinding melewati tengah malam**
- Lokasi: `internal/modules/attendance/application/attendancerecord/command/clock_out.go:42-51`
- Perilaku: menghitung ulang "hari ini" dari waktu clock-out, lalu query `attendance_records` berdasarkan tanggal itu tanpa fallback `isNotFound` (berbeda dengan `clock_in.go`/`create_manual_record.go` yang sudah mengecek).
- Dampak: shift 22:00→06:00 — record terbuka pada tanggal D (saat clock-in), clock-out jam 06:00 tanggal D+1 query `WHERE date = D+1` dan tidak ketemu. Repo sudah punya `FindOpenByEmployee` (tanpa filter tanggal) yang seharusnya dipakai di sini.

**T6 — Submit/approve koreksi attendance juga tidak menormalisasi offset**
- Lokasi: `submit_correction.go:57-67`, `review_correction.go:140-150`
- Dampak: kelas bug yang sama dengan T2, tapi untuk koreksi yang sudah disetujui HR — data late/overtime historis yang salah tanpa disadari.

**T7 — Modal input manual di frontend membangun timestamp tanpa offset sama sekali**
- Lokasi: `HR-SYSTEM-BACKOFFICE/app/pages/tenants/attendance/index.vue:154-155`
- Dampak: melanggar kontrak API yang didokumentasikan ([05-api-contract.md:52](../modules/attendance/05-api-contract.md) — contoh `"2026-01-15T08:03:00+07:00"`), lebih parah dari bug serupa yang sudah diperbaiki di `records.vue`/`ess/attendance.vue`.

**T8 — `parseTimestampOrNow` fallback ke `time.Now()` mentah, bukan `timeutil.Now()`**
- Lokasi: `clock_in.go:124`
- Dampak: tidak konsisten dengan disiplin `.UTC()` di seluruh codebase; bergantung pada timezone OS/container server yang tidak terkontrol.

### MEDIUM

- **T9** — `employees.birth_date/hire_date`, `assignments.start_date/end_date`, `employment_history/status_history.effective_date` bertipe `TIMESTAMPTZ`, seharusnya `DATE` (tidak konsisten dengan `contracts`, `holidays`, `leave_requests`, `attendance_records`, `schedules`, `overtime_requests` yang sudah benar).
- **T10** — Default "hari ini" di frontend via `new Date().toISOString().split('T')[0]` di ~12 form (hireDate, contract start, schedule-pattern anchor, holiday/schedule date, lifecycle effectiveDate, rentang ESS/records, tanggal overtime, filter leave) — meleset satu hari untuk user WIB antara 00:00–06:59 lokal bila tidak diedit.
- **T11** — Tidak ada konfigurasi timezone level koneksi Postgres (tidak ada param `timezone=` di DSN, tidak ada `SET TIME ZONE`).
- **T12** — Fix `toLocalRFC3339` (dari sesi testing sebelumnya) memakai offset lokal *browser*, bukan timezone cabang tujuan — benar hanya jika yang menginput berada fisik di cabang yang sama; salah bila admin HR di Jakarta mengoreksi data karyawan cabang Jayapura.

### LOW

- **T13** — `useTenants.ts`'s `toBranchView()` menampilkan label timezone hardcoded `'Asia/Jakarta'` di tenant inspector platform-admin — kosmetik saja, belum terhubung ke data asli. `app/types/tenant.ts` sudah menyiapkan tipe `'Asia/Jakarta' | 'Asia/Makassar' | 'Asia/Jayapura' | string`, menandakan intent tapi belum ada wiring.
- **T14** — `.toISOString()` di `useRecruitment.ts` masih inert (modul mock client-only, tidak ada pemanggilan API nyata) — jadi bug live hanya jika API rekrutmen sungguhan dipasang nanti.

---

## 7. Root Cause

1. `timeutil.Loc()`/`timeutil.Now()` — satu-satunya mekanisme yang bisa menghasilkan jam dinding lokal platform — diinisialisasi lalu nyaris tidak pernah dipakai di business logic.
2. Tidak ada field timezone di data model tenant/branch, walau dokumen bisnis sudah eksplisit membutuhkannya — terlihat seperti migrasi yang ter-scope-out atau terlewat, bukan oversight di application code.
3. Timestamp dari client dipercaya dan di-parse apa adanya; `.Hour()`/`.Minute()`-nya langsung dibaca untuk business math tanpa pernah dinormalisasi ke satu authority yang jelas.
4. Bug stringifikasi pgx `DATE`→`string` ditemukan & diperbaiki ad-hoc per laporan bug (3 dari 5 repo terdampak), bukan lewat helper repository bersama — menandakan tidak ada guard sistematis untuk kelas bug ini.
5. `robfig/cron`'s `NextRun` mengevaluasi terhadap `time.Time` apa pun yang diberikan; tidak ada yang meng-thread timezone platform lewat jalur pemanggilan scheduler, dan fitur `CRON_TZ=` bawaan library tidak pernah dipakai.

---

## 8. Target Arsitektur (ringkas)

- **Authority chain**: `branch.timezone` → `tenant.timezone` → default platform (`APP_TIMEZONE`), di-resolve sekali per request/job lewat resolver bersama.
- **Instant fields**: tetap `TIMESTAMPTZ`, selalu simpan UTC — tapi setiap parsing instant dari client di-`.In(resolvedLoc)` sebelum dipakai untuk perhitungan jam dinding.
- **Calendar Date fields**: tetap `DATE`; setiap SELECT di repository cast ke `::text` (atau scan ke wrapper type khusus supaya bug ini secara struktural tidak mungkin terjadi lagi, bukan cuma "diingat" per repo).
- **Local Time fields** (shift start/end): tetap `"HH:MM"` mentah, tapi hanya pernah digabung dengan tanggal lewat timezone cabang yang sudah di-resolve — tidak pernah diasumsikan sama dengan jam dinding server atau UTC.

---

## 9. Skenario Risiko Konkret

1. **Batas tanggal UTC/lokal**: clock-in 00:20 WIB tanggal 18 Sep → dikirim sebagai `2026-09-17T17:20:00Z` → tanpa `.In(loc)`, `Date` ter-format sebagai 17 Sep, meleset satu hari.
2. **Tengah malam**: job harian (schedule generation, contract expiry) jalan di jam UTC yang salah (T4) — bisa memproses "hari ini" sebelum tengah malam lokal cabang benar-benar lewat.
3. **Shift overnight**: T5 — clock-out gagal total begitu jam dinding melewati tengah malam, untuk semua pekerja shift malam, di cabang mana pun.
4. **Tanggal cuti**: karyawan submit `leave_date_from: "2026-09-18"` — tersimpan benar sebagai `DATE`, tapi setiap pembacaan berikutnya mengembalikan `"2026-09-18T00:00:00Z"` (T3), bisa gagal binding ke `<input type="date">` atau gagal pada pengecekan string-equality.
5. **Tenant/cabang beda zona**: cabang hipotetis di Jayapura (WIT, UTC+9) akan menghitung "tengah malam" 2 jam lebih awal dari Jakarta — dan hari ini tidak ada satu pun jalur kode yang bisa merepresentasikan perbedaan itu (T1).
6. **Scheduler**: contract-expiry-check yang dimaksud jalan 04:00 WIB malah jalan 11:00 WIB — kontrak yang "hari ini" kadaluarsa bisa sudah tampak expired ke user HR jauh sebelum job-nya benar-benar jalan.
7. **Date picker frontend**: admin HR buka form "Tambah Karyawan" jam 00:15 WIB — default `hireDate` diam-diam terisi tanggal *kemarin* (T10); kalau disubmit tanpa diedit, tanggal masuk kerja karyawan meleset satu hari.
8. **Timezone database**: tidak ada param `timezone=` di level DSN — saat ini tertutupi oleh sifat offset-safe `TIMESTAMPTZ`, tapi belum pernah dikunci/diuji eksplisit (T11).

---

## 10. Rencana Remediasi (9 Fase)

> Setiap fase dirancang additive & backward-compatible — kolom baru nullable, resolver yang fallback ke perilaku hari ini selama data timezone asli belum ada — supaya tiap fase bisa rilis independen dengan aman.
>
> **Di luar cakupan rencana ini**: eksekusi aktual backfill data di Fase 9 (hanya tooling dry-run/deteksi yang dibangun; backfill sungguhan butuh persetujuan bisnis per kategori data, lihat §10.9).

### Fase 1 — Timezone Foundation (code-only, belum ada schema)

Tambahkan kapabilitas `TimezoneResolver` dengan rantai fallback branch → tenant → default platform.

- **File terdampak**: `internal/shared/timeutil/timeutil.go` (extend, jangan diganti), resolver port + adapter baru.
- **Modul terdampak**: shared/platform.
- **Perlu migrasi?**: Tidak.
- **Dampak backward compatibility**: Penuh — resolver mengembalikan `timeutil.Loc()` (default global hari ini) sampai Fase 2 mengisi data asli. Tidak ada perubahan perilaku saat merge.
- **Risiko**: Rendah.
- **Test**: Unit test rantai fallback (branch diset → pakai; branch kosong, tenant diset → pakai tenant; keduanya kosong → default platform).
- **Rollback**: Trivial — hapus file baru, belum ada yang bergantung padanya.

### Fase 2 — Database / Schema

- Tambahkan `timezone TEXT` nullable (nama IANA) ke `branches` dan `tenants`.
- Perbaiki cast `::text` yang hilang di `postgres_leave_request_repo.go` dan `postgres_holiday_repo.go` (pola fix yang sama seperti `attendance_records`/`schedules`).
- **File terdampak**: migrasi baru `NNNN_add_branch_tenant_timezone.up/down.sql`; kedua file repo di atas (perubahan kode saja, tidak butuh migrasi tambahan).
- **Modul terdampak**: platform (tenant/branch), leave, attendance (holiday).
- **Perlu migrasi?**: Ya, untuk kolom `timezone` (additive + nullable = aman).
- **Dampak backward compatibility**: Aman — row lama dapat `NULL`, resolver (Fase 1) treat sebagai "lanjut ke tenant/default platform", sama seperti perilaku sekarang.
- **Risiko**: Rendah untuk kolom baru; Medium untuk fix cast `::text` (mengubah format string yang dikembalikan repo — perlu grep akhir untuk memastikan tidak ada consumer yang bergantung ke format korup saat ini).
- **Test**: Test level repo — seed row `leave_requests`/`holidays`, baca kembali, pastikan string persis `"YYYY-MM-DD"`. Test migrate up/down.
- **Rollback**: `down.sql` drop kolom; revert fix cast tinggal satu baris diff.

### Fase 3 — Domain / Service Layer

- Hubungkan resolver Fase 1 ke `dayResolver`, `ComputeStatus`/`minutesOfDay`, dan semua command yang parse timestamp dari client: `clock_in.go`, `clock_out.go`, `auto_clock_out.go`, `create_manual_record.go`, `review_correction.go`, `submit_correction.go`. Setiap `time.Time` hasil parse harus lewat `.In(resolvedLoc)` sebelum `.Hour()`/`.Minute()`/`.Format("2006-01-02")` dipanggil.
- Perbaiki T5: `ClockOutUseCase` pakai `FindOpenByEmployee`, bukan re-derive tanggal.
- **File terdampak**: `internal/modules/attendance/application/attendancerecord/command/*.go`, `attendance_record.go` (perketat doc comment / pertimbangkan `ComputeStatus` menerima `*time.Location` eksplisit).
- **Modul terdampak**: attendance saja.
- **Perlu migrasi?**: Tidak.
- **Dampak backward compatibility**: Record baru dihitung benar; record lama TIDAK otomatis dikoreksi (lihat Fase 9).
- **Risiko**: Medium-High — menyentuh business logic inti yang jadi input late/overtime/payroll.
- **Test**: Matriks penuh dari Fase 8 (timezone × jam batas × shift overnight), plus regresi test suite attendance yang sudah ada.
- **Rollback**: Revert file command; karena resolver fallback ke `Loc()` global saat branch timezone kosong, risiko rollback rendah selama kolom Fase 2 belum diisi di produksi sebelum fase ini diverifikasi.

### Fase 4 — API Contract

- Server-side, selalu reproyeksi timestamp masuk ke lokasi branch/tenant yang sudah di-resolve, apa pun offset yang dikirim client (defense in depth).
- **File terdampak**: `modules/attendance/05-api-contract.md` (konfirmasi kesesuaian), validasi di HTTP handler attendance.
- **Perlu migrasi?**: Tidak.
- **Dampak backward compatibility**: Tidak ada perubahan bentuk request/response — hanya semantik interpretasi.
- **Risiko**: Rendah-Medium.
- **Test**: Contract test dengan input `Z`, `+07:00`, `+08:00`, tanpa offset.
- **Rollback**: Revert kode reproyeksi.

### Fase 5 — Frontend (HR-SYSTEM-BACKOFFICE)

- Ganti default "hari ini" via `.toISOString().split('T')[0]` (±12 file) dengan helper tanggal lokal yang tidak round-trip lewat UTC.
- Perbaiki T7 di `tenants/attendance/index.vue` (pakai `toLocalRFC3339` seperti `records.vue`/`ess/attendance.vue`).
- Setelah Fase 2 tersedia: ganti konstruksi timestamp di halaman attendance supaya pakai timezone **cabang terpilih**, bukan offset browser; hubungkan `useTenants.ts`'s `toBranchView()` ke field asli, tambahkan selector timezone di form create/edit branch.
- **File terdampak**: `app/utils/index.ts`, ±12 file yang ditandai, `app/pages/tenants/attendance/index.vue`, `app/composables/useTenants.ts`, `app/components/tenants/TenantBranchModal.vue`.
- **Perlu migrasi?**: Tidak.
- **Risiko**: Rendah untuk fix default tanggal; Medium untuk perubahan UI clock berbasis timezone cabang.
- **Test**: QA manual mengulang skenario ala Andi/Budi/Citra lintas cabang non-WIB simulasi.
- **Rollback**: Kembali ke perilaku offset-browser (fix hari ini), yang tetap benar untuk kasus satu timezone.

### Fase 6 — Scheduler / Worker

- Gunakan fitur bawaan `robfig/cron`: prefix `CRON_TZ=Asia/Jakarta 0 1 1 * *` pada semua registrasi cron (`scheduleMonthlyGenerateCron`, `contractExpiryCheckCron`, `renewalCheckCron`, `dunningCheckCron`).
- Perbaiki `monthly_generate_schedules.go` yang derive `dateFrom` dari `time.Now().UTC()` mentah.
- **File terdampak**: `internal/modules/scheduler/application/{dispatcher.go,cron.go}`, `internal/modules/attendance/application/schedule/command/monthly_generate_schedules.go`, registrasi cron di `attendance/module.go`, `core-hr/module.go`, `platform/module.go`.
- **Perlu migrasi?**: Tidak.
- **Dampak backward compatibility**: **Breaking secara efek, bukan secara kode** — mengubah KAPAN job benar-benar jalan (by design). Wajib dikomunikasikan ke ops/support sebelum deploy.
- **Risiko**: Medium (sensitif waktu; bisa mengubah kapan notifikasi ke customer terkirim).
- **Test**: Unit test `NextRun` dengan prefix `CRON_TZ=`; verifikasi jam jalan sebenarnya di staging sebelum produksi.
- **Rollback**: Revert string ekspresi cron / perubahan dispatcher.

### Fase 7 — Integration

- Belum ada integrasi eksternal sensitif-waktu yang ditemukan (belum ada sinkronisasi mesin biometrik; modul Payroll masih placeholder `NoopPayrollPeriodLockProvider`). Fase ini jadi **gate**, bukan pekerjaan aktif: begitu integrasi mesin absensi atau modul Payroll sungguhan dibangun, penanganan timestamp-nya wajib diaudit ulang terhadap authority chain yang sama.

### Fase 8 — Testing

Matriks eksplisit:
- **Timezone**: `Asia/Jakarta`, `Asia/Makassar`, `Asia/Jayapura`, `UTC`.
- **Jam batas**: `00:00`, `00:30`, `23:30`, `23:59`.
- **Transisi tanggal**: tanggal UTC ≠ tanggal lokal.
- **Shift overnight**: `22:00 → 06:00`, termasuk fix T5.
- **Varian offset API**: `Z`, `+07:00`, `+08:00`, tanpa offset, date-only, time-only.
- **File terdampak**: test baru di `internal/modules/attendance/...`, `internal/modules/scheduler/...`, `internal/modules/leave/...`.
- **Risiko**: Rendah (test-only, tapi jadi syarat sign-off Fase 3/6).

### Fase 9 — Migration / Backfill (data)

Hanya membangun **tooling deteksi**, bukan fix otomatis:

- Klasifikasi `attendance_records` (dan `attendance_corrections`) ke:
  - **(a) Sudah benar** — dari jalur `time.Now()` server tanpa override client. Tidak perlu aksi.
  - **(b) Ambigu** — offset asli yang dipakai tidak bisa direkonstruksi. Jangan dikoreksi otomatis; flag untuk review manual HR/payroll.
  - **(c) Terdeteksi salah** — script dry-run menjalankan ulang `ComputeStatus` di bawah kedua interpretasi (tersimpan vs. hasil reproyeksi timezone cabang) dan menandai baris yang divergen.
- Deliverable: laporan dry-run read-only (jumlah baris terdampak, sample before/after) untuk direview manusia — **tidak ada write-back di fase ini**. Backfill sungguhan hanya jalan setelah persetujuan bisnis, dengan snapshot pre-backfill untuk rollback.
- **Risiko**: Tinggi jika backfill sungguhan salah eksekusi (memutasi data yang relevan ke payroll) — wajib manual, direview, dan reversibel.

---

## 11. Verifikasi End-to-End (setelah fase-fase di atas rilis)

1. `go test ./...` untuk `internal/modules/attendance`, `internal/modules/leave`, `internal/modules/scheduler` — matriks test timezone/boundary/overnight lulus.
2. Ulangi skenario ESS ala Andi/Budi/Citra dengan cabang seed non-WIB (mis. `Asia/Jayapura`), pastikan status/late/OT dihitung benar terhadap jam dinding lokal cabang itu, bukan browser.
3. Pastikan `leave_requests`/`holidays` mengembalikan string `"YYYY-MM-DD"` polos (fix Fase 2).
4. Pastikan jam jalan cron di staging sesuai jam dinding Jakarta yang dimaksud (Fase 6), bukan jam ter-geser UTC seperti sekarang.
5. Jalankan script dry-run Fase 9 terhadap salinan data produksi/staging realistis dan review sample before/after sebelum backfill sungguhan dijadwalkan.

---

## 12. Pertanyaan Terbuka / Keputusan Bisnis

1. Apakah timezone authority **hanya di level cabang** (sesuai dokumen saat ini), atau bisnis juga butuh **override di level karyawan** (mis. karyawan remote/WFH yang secara fisik berada di luar zona cabangnya)?
2. Apa yang terjadi kalau sebuah cabang belum punya `timezone` diset pasca-migrasi — fallback diam-diam ke default platform, atau blokir/peringatkan sampai admin mengisinya secara eksplisit?
3. Untuk Fase 9: apakah retroaktif mengoreksi data attendance historis diinginkan, kalau itu bisa mengubah periode payroll yang sudah dibayarkan? Atau fix hanya berlaku maju (forward-only), dengan data lama diberi anotasi "dihitung sebelum fix timezone"?
4. Untuk Fase 6: apakah jam jalan cron perlu direalign ke jam dinding Jakarta yang dimaksud sejak awal (mengubah kapan notifikasi/checks benar-benar terjadi di produksi), atau "jam yang dimaksud" perlu didefinisikan ulang mengingat ops mungkin sudah beradaptasi dengan jadwal ter-geser UTC saat ini?
5. Apakah integrasi mesin biometrik/absensi hardware benar-benar direncanakan dalam waktu dekat? Kalau ya, perlu audit timezone terpisah begitu speknya ada.

---

*Dokumen ini adalah hasil audit read-only (tidak ada perubahan kode saat audit dilakukan). Rencana implementasi detail per-fase (termasuk file kerja yang sedang berjalan) dilacak terpisah di working plan file sesi terkait.*
