# 08 · Rencana Implementasi `period_basis` (Anniversary/Hybrid)

> **Status:** Rencana disetujui (2026-09-17), belum diimplementasikan. Dokumen ini adalah rujukan teknis untuk saat implementasi dikerjakan — bukan implementasi itu sendiri.

---

## 1. Latar Belakang & Masalah

`LeaveType.period_basis` (`calendar` / `anniversary` / `hybrid`, lihat [`06-data-model.md`](./06-data-model.md)) sudah tersimpan penuh di API & database sejak modul ini dibuat, tapi **tidak pernah benar-benar dipakai** oleh logic manapun. Semua "period" saldo cuti hari ini murni `strconv.Itoa(time.Now().UTC().Year())` — tahun kalender berjalan — dihitung independen di tiga tempat berbeda di kode (submit request, review/cancel request, rollover balance), tanpa memedulikan nilai `period_basis` sama sekali.

Sementara itu, [`03-balance-accrual.md`](./03-balance-accrual.md) §4 sudah mendeskripsikan niat **anniversary** (kuota dihitung dari tanggal masuk kerja tiap karyawan) dan **hybrid** (tahun pertama anniversary, lalu switch ke kalender dengan transisi pro-rata) — tapi tanpa formula atau format period-key yang eksak. Dokumen ini menutup gap tersebut sebelum implementasi dimulai.

**Field terkait lain yang juga inert hari ini** dan ikut diaktifkan oleh rencana ini:
- Backoffice (`app/pages/tenants/leave/types.vue`) tidak punya field untuk `period_basis` sama sekali, dan `useLeaveTypes.ts` diam-diam membuang field ini saat baca/tulis — berbeda dari dua simplifikasi lain (`carryOver`, `carryOverExpiryMonths`) yang memang didokumentasikan sengaja disederhanakan. Ini murni celah, bukan keputusan desain.

---

## 2. Keputusan Produk (Sudah Difiksasi)

| # | Keputusan | Alasan |
|---|---|---|
| 1 | Implementasi **hybrid penuh** dengan pro-rata, bukan cuma calendar+anniversary | Nilai bisnis hybrid (adil di tahun pertama, praktis untuk HR setelahnya) tidak didapat kalau cuma anniversary/calendar saja |
| 2 | Rollover anniversary/hybrid berjalan via **scheduled job harian otomatis** per-employee (dicek tanggal anniversary masing-masing), bukan tombol batch admin | Setiap karyawan anniversary-basis punya tanggal reset berbeda — tidak bisa lagi "satu tombol untuk semua" seperti rollover calendar |
| 3 | Job otomatis ini bisa **diaktifkan/dipause per tenant** lewat toggle di backoffice | Beberapa tenant mungkin belum siap / ingin kontrol kapan fitur ini mulai berlaku untuk mereka |
| 4 | **8 preset leave type & tenant existing yang masih `period_basis='hybrid'` di-backfill ke `calendar`** | Saat ini semua 8 preset di-seed `hybrid` (inert, belum pernah berefek). Begitu logic diaktifkan, itu akan mengubah perilaku semua tenant existing secara diam-diam kalau tidak dikoreksi dulu. Karena hybrid toh belum pernah benar-benar jalan, tidak ada tenant yang bisa "bergantung" pada perilaku hybrid — jadi aman diubah jadi default `calendar`, dan anniversary/hybrid jadi murni pilihan sadar (opt-in) untuk jenis cuti baru/custom |
| 5 | Toggle "Automatic Anniversary Rollover" digabung ke halaman **Leave Types** (`types.vue`) yang sudah ada, bukan halaman settings baru | Cukup satu boolean, tidak sepadan bikin halaman & entry menu baru |

---

## 3. Desain: Perhitungan Period

### 3.1 Helper baru: `leaveperiod.Resolve`

Satu fungsi murni menggantikan tiga tempat perhitungan period yang sekarang independen & terduplikasi:

```go
package leaveperiod

type Period struct {
    Key         string    // → leave_balances.period / leave_requests.period
    StartDate   time.Time
    EndDate     time.Time
    QuotaFactor float64   // 1.0 normal; <1.0 hanya untuk stub pro-rata hybrid
}

func Resolve(basis string, hireDate, asOf time.Time) Period
```

**Algoritma per basis:**

- **`calendar`** (identik dengan perilaku sekarang): `Key = tahun(asOf)`, mulai 1 Jan, akhir 31 Des, `QuotaFactor = 1.0`.
- **`anniversary`**: siklus 12 bulan berulang dari `hireDate`. `n` = jumlah tahun penuh sejak hire sampai `asOf`. Mulai = `hireDate + n tahun`, akhir = mulai + 1 tahun − 1 hari. Key: `"annv:" + tanggal_mulai` (mis. `"annv:2027-03-01"`). Berulang selamanya — dokumen tidak menyatakan eksplisit tapi ini satu-satunya bacaan masuk akal dari "dihitung dari tanggal masuk karyawan" tanpa catatan lanjutan.
- **`hybrid`** — 3 fase:
  1. Tahun pertama = identik anniversary siklus ke-0.
  2. **Stub transisi**: dari `hireDate + 1 tahun` sampai 31 Desember tahun itu. Key: `"stub:" + tahun`. `QuotaFactor = jumlah_hari_inklusif(mulai, akhir) / 365.0`.
  3. Setelah stub: identik `calendar` selamanya.

**Formula pro-rata (asumsi kerja, sudah divalidasi cocok dengan contoh dokumen):** `kuota_stub = round(QuotaFactor × QuotaDays)`. Divalidasi terhadap contoh di §4 dokumen 03: hire 1 Mar 2026 → stub Mar–Des 2027 = 306 hari inklusif → `306/365 × 12 ≈ 10.06 → 10 hari`, cocok dengan penyebutan "~10 bln" di dokumen. Pembagi tetap 365 (tidak dibedakan leap year) demi kesederhanaan — bisa direvisi kalau presisi lebih tinggi dibutuhkan.

**Poin terbuka yang perlu dikonfirmasi ulang saat implementasi (bukan blocker, tapi dicatat sebagai asumsi):**
- Pembulatan `round` (bukan floor/ceil) untuk kuota stub.
- Kebijakan `CarryOver`/`CarryOverMax` berlaku sama persis di transisi stub→calendar seperti rollover biasa (diasumsikan ya).
- Interaksi `accrual: monthly` dengan stub period belum ada preseden nyata (tidak ada preset yang pakai `monthly` hari ini) — diasumsikan kuota stub yang sudah di-pro-rata langsung diberikan upfront terlepas dari mode accrual.

### 3.2 Migrasi 3 titik perhitungan period yang ada

| Lokasi saat ini | Perubahan |
|---|---|
| `submit_leave_request.go:88` (`period := strconv.Itoa(time.Now().UTC().Year())`) | Ganti dengan `leaveperiod.Resolve(leaveType.PeriodBasis, profile.HireDate, now)`. Kalau `QuotaFactor != 1.0`, kuota awal balance = `round(QuotaDays × QuotaFactor)` |
| `review_leave_request.go`'s helper `period()` (re-derive dari `r.CreatedAt.Year()`), dipakai juga oleh `cancel_leave_request.go` | **Dihapus.** Alih-alih re-derive, `Period` disimpan di entity `LeaveRequest` saat submit, dibaca kembali di review/cancel. Ini sekaligus membetulkan inkonsistensi laten: selama ini review/cancel pakai `CreatedAt.Year()` sedangkan submit pakai `time.Now().Year()` — bisa berbeda kalau lintas pergantian tahun kalender |
| `rollover_balance.go` (`strconv.Atoi(req.Period)` lalu `+1`) | Tetap murni untuk `calendar`, ditambah guard menolak (`ErrCodeValidation`) kalau `leaveType.PeriodBasis != calendar` — endpoint manual batch ini eksklusif untuk tipe calendar, perilaku existing 100% tidak berubah |

---

## 4. Perubahan Data Model

1. **`leave_requests`** — tambah kolom `period VARCHAR(64) NOT NULL` (backfill baris lama dari `EXTRACT(YEAR FROM created_at)`, cocok dengan perilaku review/cancel selama ini).
2. **`leave_balances`** — tambah `period_start_date DATE`, `period_end_date DATE` (nullable, hanya diisi untuk basis anniversary/hybrid) + index pada `period_end_date`, dipakai query "due for rollover" agar tidak full-scan.
3. **`leave_settings`** (tabel baru) — `id, tenant_id UNIQUE, auto_rollover_enabled BOOLEAN DEFAULT false, created_at, updated_at`. Mirip pola `attendance_rules` yang sudah ada.
4. **Migrasi data satu-kali**: `UPDATE leave_types SET period_basis='calendar' WHERE is_preset=true AND period_basis='hybrid'` (lihat keputusan #4 di §2). Nilai default konstruktor `NewLeaveType` & seed 8 preset juga diubah dari `hybrid` → `calendar`.

---

## 5. Query Efisien & Scheduled Job

- **Repo method baru** `LeaveBalanceRepository.ListDueForAutoRollover(ctx, asOf)`: satu query lintas-tenant — `JOIN leave_types` (`period_basis IN ('anniversary','hybrid')`) `LEFT JOIN leave_settings` (`COALESCE(auto_rollover_enabled,false)=true`) `WHERE period_end_date <= asOf`, memakai index baru di §4.2. Menghindari scan semua employee/tenant tiap hari — hanya menyentuh baris balance yang memang sudah punya jendela periode tersimpan.
- **Use case baru** `AutoRolloverBalanceUseCase.Execute(ctx)`: ambil daftar due, loop per-item dengan skip-and-continue + log error (pola sama seperti job pengingat kontrak habis di modul core-hr), hitung jendela periode berikutnya via `leaveperiod.Resolve`, lalu proses lewat helper carry-over bersama (§6).
- **Wiring scheduled job** (pertama kali untuk modul leave — modul ini belum punya cron/MQ apapun hari ini): cron baru (mis. `"0 1 * * *"`, harian), didaftarkan sebagai *global singleton* (bukan per-tenant) mengikuti pola satu-satunya yang sudah terbukti dipakai di codebase ini (contract-expiry-check di core-hr, dsb) — job selalu menyala, yang di-skip per-tenant adalah item di dalam loop lewat `leave_settings.auto_rollover_enabled`, bukan job-nya sendiri di level scheduler.

---

## 6. `RolloverBalanceUseCase` — Reuse, Bukan Duplikasi

- Tambah guard di awal `Execute`: tolak kalau `leaveType.PeriodBasis != calendar`.
- Extract logic carry-over/expired/ledger yang sekarang inline di loop `rollover_balance.go` menjadi helper bersama (mis. `applyCarryOverAndOpenNextPeriod`), dipanggil baik oleh `RolloverBalanceUseCase` (manual, calendar) maupun `AutoRolloverBalanceUseCase` (otomatis, anniversary/hybrid) — tidak ada duplikasi rumus carry-over/expiry/ledger antara jalur manual dan otomatis.

---

## 7. Perubahan Backoffice

1. **Perbaiki silent-drop `period_basis`**: tambahkan field ini di tipe `LeaveType` (frontend), dan berhenti dibuang di mapper `useLeaveTypes.ts` (baik saat baca `toLeaveType()` maupun saat kirim payload create/update).
2. **Dropdown "Period Basis"** di form create/edit leave type (`types.vue`): pilihan Calendar Year / Work Anniversary / Hybrid. **Default form baru = `calendar`** (konsisten dengan keputusan #4 — anniversary/hybrid harus dipilih sadar, bukan default diam-diam).
3. **Toggle "Automatic Anniversary Rollover"**: card kecil ditaruh di atas tabel leave types di halaman yang sama (`types.vue`), mengikuti pola card toggle otomatisasi yang sudah ada di halaman attendance overtime. Terhubung ke endpoint `GET/POST /leave/settings` (baru).

---

## 8. Verifikasi Saat Implementasi

1. Unit test `leaveperiod.Resolve` — table-driven: batas anniversary tahun 1/2/3, transisi stub↔calendar, leap year, dan reproduksi persis contoh dokumen §3.1 (hire 1 Mar 2026).
2. Unit test helper carry-over bersama — harus identik hasilnya dipanggil dari jalur manual maupun otomatis.
3. Unit test `RolloverBalanceUseCase` — pastikan perilaku calendar existing tidak berubah sama sekali + test guard penolakan tipe non-calendar.
4. Unit test `AutoRolloverBalanceUseCase` — skenario due/not-due campuran, error containment per-item.
5. Test migrasi up/down di scratch DB — cek backfill `leave_requests.period` dan backfill preset `hybrid→calendar`.
6. End-to-end manual: buat leave type custom `hybrid`, karyawan dengan hire date mundur >1 tahun, jalankan use case langsung (bypass cron), pastikan balance baru muncul dengan kuota pro-rata & carry-in yang benar.
7. Smoke test backoffice: dropdown period_basis & toggle auto-rollover round-trip lewat API.
8. Pastikan wiring worker (`EnsureScheduledJobs` & binding MQ) benar-benar terpasang — job yang lupa didaftarkan tidak akan pernah jalan tanpa error yang terlihat.

---

## 9. File Kritikal (Referensi Implementasi)

- `internal/modules/leave/domain/leaveperiod/resolver.go` *(baru)*
- `internal/modules/leave/application/leaverequest/command/submit_leave_request.go`
- `internal/modules/leave/application/leaverequest/command/review_leave_request.go`
- `internal/modules/leave/application/leaverequest/command/cancel_leave_request.go`
- `internal/modules/leave/application/leavebalance/command/rollover_balance.go`
- `internal/modules/leave/application/leavebalance/command/auto_rollover_balance.go` *(baru)*
- `internal/modules/leave/domain/leavebalance/repository/leave_balance_repository.go`
- `internal/modules/leave/module.go`
- `internal/modules/leave/seed_defaults.go`
- `internal/modules/leave/domain/leavetype/entity/leave_type.go`
- `cmd/worker/main.go`
- `HR-SYSTEM-BACKOFFICE/app/composables/useLeaveTypes.ts`, `useLeaveSettings.ts` *(baru)*
- `HR-SYSTEM-BACKOFFICE/app/pages/tenants/leave/types.vue`
