# Rencana: Pattern Fixed dengan Shift per Hari (`weekly_shifts`)

## Tujuan
Mendukung kasus "Senin–Sabtu, Jumat istirahat lebih panjang, Sabtu setengah hari" dengan mengganti mode fixed `SchedulePattern` dari satu `shift_id` + `working_days` menjadi **map hari → shift** (`weekly_shifts`). Hari tanpa entri = libur. Kasus di atas = 3 shift (Reguler, Jumat, Setengah Hari) dalam satu pattern.

Keputusan yang disetujui: **(1) ganti total** — kolom/field lama dihapus setelah backfill; **(2) form backoffice = grid 7 hari + preset**. Mode rotation tidak berubah; fixed tetap live-resolved (tidak di-generate ke `schedules`).

## Tahap 1 — Backend (HR-SYSTEM-API)

### 1.1 Migration baru
File `migrations/20261030000001_schedule_pattern_weekly_shifts.{up,down}.sql`:
- **up**: `ALTER TABLE schedule_patterns ADD COLUMN weekly_shifts JSONB;` → backfill `WHERE mode='fixed' AND shift_id IS NOT NULL` dengan `SET weekly_shifts = (SELECT jsonb_object_agg(d, shift_id) FROM jsonb_array_elements_text(working_days) AS d)` → `DROP COLUMN shift_id, DROP COLUMN working_days;`
- **down**: re-add kedua kolom, rekonstruksi best-effort dari `weekly_shifts` (ambil satu value + `jsonb_agg(key)`), lalu `DROP COLUMN weekly_shifts`.

### 1.2 Domain
`internal/modules/attendance/domain/schedulepattern/entity/schedule_pattern.go`:
- Ganti `ShiftID *string` + `WorkingDays []string` dengan `WeeklyShifts map[string]string` (di struct L33-34 dan `Config` L47-54).
- `apply()` branch fixed (L127-146): wajib ≥1 entri, key valid via `constant.IsWeekday`, value non-empty; tetap clear field rotation.
- `IsWorkingDay(weekday)` → `_, ok := p.WeeklyShifts[weekday]`; tambah `ShiftOn(weekday) *string`; tambah `WorkingDays() []string` (derived, urut mon..sun, untuk respons/tampilan).
- `ShiftIDs()` (L100-114): kumpulkan semua value map + rotation legs (validasi shift via `validateShifts` otomatis ikut).

`domain/schedule/service/resolve_day.go:59-64`: ganti `fixedPattern.IsWorkingDay(...)` + `ShiftID` dengan `if shiftID := fixedPattern.ShiftOn(patternconstant.Weekdays[date.Weekday()]); shiftID != nil { return Day{ShiftID: shiftID, Source: DaySourceFixed} }`.

Doc comment yang menyandera asumsi satu shift: `constant/constant.go:7`, doc entity L13-17, komentar `ResolveDay`.

### 1.3 Persistence
`infrastructure/schedulepattern/persistence/postgres_schedule_pattern_repo.go`:
- `patternColumns`/`patternSelectColumns` (L28-34): `shift_id, working_days` → `weekly_shifts`.
- `patternArgs` (L78-99): marshal `p.WeeklyShifts` (map, json.Marshal langsung); hapus `nullStr(p.ShiftID)`.
- `scanPattern` (L205-239): unmarshal ke map; hapus scan shift_id.
- `Update` SET clause (L65-67) dan placeholder count di `Save`.
- `ExistsActiveUsingShift` (L172-187): tambah `OR EXISTS (SELECT 1 FROM jsonb_each_text(sp.weekly_shifts) kv WHERE kv.value = $2)` agar shift yang dipakai pattern fixed per-hari tidak bisa dinonaktifkan.

### 1.4 Application & HTTP
`application/schedulepattern/command/dto.go`:
- Create: `WeeklyShifts map[string]string \`json:"weekly_shifts,omitempty"\`` (ganti ShiftID/WorkingDays).
- Update: `WeeklyShifts *map[string]string` (nil = keep, non-nil = replace penuh).
- Response: hapus `ShiftID`/`ShiftRef` top-level; tambah `WeeklyShifts []PatternDayShiftResponse` berurutan mon..sun, tiap entri `{day, shift_id, shift_name, shift_code, shift_color}`; pertahankan `working_days` (derived dari map) untuk pembaca lama.

`application/schedulepattern/command/schedule_pattern_commands.go`: Create (L36) kirim `cfg.WeeklyShifts`; Update (L58-81) seed dari pattern lalu `if req.WeeklyShifts != nil { cfg.WeeklyShifts = *req.WeeklyShifts }`. `validateShifts` tidak berubah.

`application/schedulepattern/query/schedule_pattern_queries.go` `Responses` (L45-84): mapping per-hari memakai batch `shiftRepo.ListByIDs(p.ShiftIDs())` yang sudah ada (urutan hari dari `constant.Weekdays`). Handler HTTP tidak perlu berubah (binding otomatis).

### 1.5 Tes backend
- `entity/schedule_pattern_test.go`: per-mode fixed pakai map; kasus baru: key hari invalid, value kosong, map kosong; `ShiftIDs()`/`IsWorkingDay`/`ShiftOn`.
- `domain/schedule/service/resolve_day_test.go`: hari berbeda → shift berbeda (Jumat→shift B, Sabtu→shift C, Minggu→off).
- `application/schedulepattern/command/schedule_pattern_commands_test.go`: create fixed dengan weekly_shifts; shift inactive di salah satu hari ditolak.
- Perbarui fixture lama: `clock_in_test.go` `seedFixedSchedule` (L75-100), `schedule_queries_test.go` (L58-140), `dayclassification/providers_test.go` `fixedPattern()` (L70-74), `generate_schedules_test.go` (fixture pattern), `rotation_test.go`/`simulation` jika ada fixture fixed.
- Jalankan `go test ./...` di HR-SYSTEM-API.

## Tahap 2 — Backoffice (HR-SYSTEM-BACKOFFICE)
- `app/types/attendance.ts`: `SchedulePattern.weeklyShifts: Array<{day: Weekday; shiftId: string; shiftName?; shiftCode?; shiftColor?}>` (+ tipe payload).
- `app/composables/useSchedulePatterns.ts`: DTO baru; `modeBody()` fixed → `weekly_shifts` (map dari state form); parsing balikan array → `Record<Weekday, string | undefined>`; konstanta `WEEKDAYS` tetap.
- `app/pages/tenants/hr-setting/working-patterns/index.vue`:
  - Form fixed (L634-671): grid 7 baris Senin–Minggu, tiap baris `USelect` berisi "Off (hari libur)" + shift aktif (reuse `shiftOptionLabel`/`activeShifts`); tombol preset cepat "Sen–Jum" & "Sen–Sab" (mengisi hari terpilih dengan shift yang sama); state `weeklyShifts` menggantikan `shiftId`+`workingDays`.
  - Validasi `validateForm` (L374-387): ≥1 hari terisi shift (pesan: "Assign a shift to at least one day.").
  - `renderSummary` (L92-112): chip per hari menampilkan kode/nama shift atau "Off".
  - `openCreate` (L341) / `openEdit` (L359): reset & hydration map.
- `app/components/PatternSelect.vue` `describe()` (L29-33): ringkasan per hari (mis. "Fixed · Pagi: Sen–Kam · Jumat: JMT · Sabtu: STG"); kelompokkan hari dengan shift sama.
- `app/composables/useCareerPathLookups.ts` (L20-60): sesuaikan mapping `working_days` → `weekly_shifts`.

## Tahap 3 — Docs (HR-SYSTEM-DOCS)
- `modules/attendance/06-data-model.md` §2.2a: ganti baris `shift_id`/`working_days` dengan `weekly_shifts` (JSONB, contoh objek); sekalian hapus kolom stale yang tidak ada lagi di DB (`branch_id`, `scope_type`, `scope_ref`, `priority`) dan sesuaikan deskripsi (pattern tenant-wide, karyawan menempel via career path).
- `modules/attendance/05-api-contract.md`: tambah seksi endpoint `/attendance/schedule-patterns` (CRUD + `/{id}/activate` + `/{id}/generate`) dengan skema request/response `weekly_shifts` (saat ini sama sekali belum terdokumentasi).
- `modules/attendance/02-shift-schedule.md` §3: sebut field `weekly_shifts`; tandai contoh "Sabtu setengah hari" + tambah contoh "Jumat istirahat lebih panjang" sebagai resep resmi.
- `manual/hr-setting/04-working-patterns.md`: tabel field mode fixed baru (7 picker + preset), pesan validasi baru (L260-277), langkah membuat pola fixed (L320-331), dan resep "Senin–Sabtu, Jumat istirahat panjang, Sabtu setengah hari" di bagian Catatan.

## Verifikasi
1. `go test ./...` di HR-SYSTEM-API (semua hijau).
2. Backoffice: build/dev, cek manual halaman working-patterns (buat pattern kasus Sen–Sab: Reguler Sen–Kam, Jumat, Sabtu ½) dan PatternSelect di form karyawan.
3. Migrasi up/down di DB lokal bila tersedia.
4. `graphify update .` di HR-SYSTEM-API setelah kode berubah (aturan AGENTS.md).

## Out of scope (dicatat, tidak dikerjakan)
- Gap `GetMyToday` (karyawan fixed tanpa baris schedules tidak melihat shift di /me/today) — perilaku lama, terpisah.
- Perubahan rotation/simulation/generation — tidak tersentuh.