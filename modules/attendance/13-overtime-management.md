# 13 · Overtime Management

Pengelolaan lembur end-to-end di modul Attendance: aturan lembur (Overtime Rule) yang terpusat, klasifikasi hari dari modul sumber, pengajuan sebagai otorisasi, realisasi dari data kehadiran, transaksi final dengan breakdown per komponen OT, dan rekap per periode yang siap dikonsumsi Payroll.

Semua durasi dalam **menit**.

---

## 1. Alur

```
HR Setting → Overtime Rules        : rule + day types + tiers (OT1, OT2, …)
HR Setting → Attendance Rules      : pilih Overtime Rule per cabang (fallback: default tenant)
                                     + pengukuran OT: mulai setelah / pembulatan / toleransi
Karyawan / HR → Overtime Request   : window rencana (mulai–selesai) → approve (boleh dipersingkat) / reject / cancel
Attendance                         : clock in/out, mesin, koreksi → attendance_records
Overtime processing                : fakta attendance + request approved + rule → overtime transaction + breakdown
HR → Overtime Transactions         : review transaksi "needs review"
Attendance summary (per periode)   : total menit per komponen OT → dikonsumsi Payroll
```

Processing berjalan:
- otomatis **harian** (job `attendance.overtime.process_daily`, 02:00 UTC, memproses 3 hari terakhir s.d. kemarin);
- setelah request di-review atau di-cancel (best-effort);
- manual lewat tombol **Process Overtime** (rentang tanggal, maks. 62 hari).

Processing **idempoten**: input yang sama tidak mengubah apa pun.

---

## 2. Overtime Rule

Master konfigurasi terpusat, berdiri sendiri, dan **tidak** menempel di Shift/Working Pattern.

| Bagian | Isi |
|---|---|
| Header | `code`, `name`, kebijakan `unauthorized_policy` & `excess_policy` |
| Day Type (milik rule) | `code` = salah satu kode klasifikasi (§3, konstanta — kode lain ditolak `INVALID_OVERTIME_RULE_ARGUMENT`), `name`, `sequence` = **prioritas**, `active` |
| Detail / Tier (milik day type) | `component_code` (OT1, OT2, … bebas), rentang `(minute_from, minute_to]` dari lembur eligible hari itu (kosong = tak terbatas; UI mengisinya dalam jam × 60), `multiplier` |

Aturan validasi tier untuk setiap day type:
- dimulai dari 0, dan setiap tier mulai di `minute_to` tier sebelumnya;
- tidak boleh ada celah atau tumpang tindih;
- hanya tier terakhir yang boleh terbuka.

Tier terakhir yang tertutup berarti lembur di atasnya tidak dihitung.

Contoh pembagian, `WORKING_DAY`: OT1 0–60 ×1.5, OT2 60+ ×2 dengan 180 menit eligible menghasilkan **OT1 = 60, OT2 = 120**.

**Kebijakan eligibility** (konstanta sistem, dipilih per rule):

| Nilai | Arti |
|---|---|
| `not_eligible` | Menit dicatat, tidak pernah eligible |
| `needs_review` | Transaksi menunggu HR menentukan menit eligible |

Rule yang masih dipakai attendance rule tidak bisa dinonaktifkan.

---

## 3. Klasifikasi Hari

Overtime tidak menentukan sendiri jenis harinya. Modul sumber memberikan klasifikasi lewat kontrak *classification provider*. Kode klasifikasi adalah konstanta aplikasi, bukan tabel.

| Sumber | Kode | Kapan |
|---|---|---|
| Schedule | `WORKING_DAY` | Jadwal karyawan punya shift di tanggal itu (fixed pattern, atau baris jadwal rotasi/manual) |
| Schedule | `REST_DAY` | Jadwal libur di tanggal itu |
| Holiday Calendar | `PUBLIC_HOLIDAY` | Ada holiday yang *observed* untuk cabang/tenant |

Catatan perilaku:
- Karyawan **rotasi** tanpa jadwal ter-generate tidak mendapat klasifikasi schedule. Processing akan menolak tanggal itu ("no schedule"), bukan menebak.
- **Pencocokan** dilakukan langsung antara kode klasifikasi dan `code` day type. Bila satu tanggal punya beberapa klasifikasi (mis. `REST_DAY` + `PUBLIC_HOLIDAY`), day type dengan `sequence` **terkecil** yang dipakai.
- Klasifikasi tanpa pasangan day type menghasilkan error eksplisit `OVERTIME_DAY_TYPE_NOT_MATCHED`.

---

## 4. Pengukuran OT (Attendance Rule)

| Field | Arti |
|---|---|
| `ot_threshold_min` | **OT mulai setelah**: menit sebelum `jam pulang + threshold` tidak dihitung. Contoh: pulang 17:00, threshold 30, clock out 17:45 → 15 menit. |
| `ot_rounding_min` | **Satuan pembulatan** (0 = tanpa pembulatan) |
| `ot_tolerance_min` | **Toleransi**: sisa ≥ `rounding − tolerance` disubsidi menjadi satu unit penuh (0 = selalu dibulatkan ke bawah) |

Contoh dengan unit 30 dan toleransi 5: 24 → 0, 25 → 30, 54 → 30, 55 → 60.

Validasi: `0 ≤ tolerance < rounding`.

**Lembur aktual:**
- **Hari kerja**: `overtime_minutes` dari attendance record, yaitu waktu setelah jam pulang yang sudah melewati threshold, pembulatan, dan toleransi.
- **Hari libur / rest day**: seluruh durasi clock in–out, dengan pembulatan dan toleransi tanpa threshold.

---

## 5. Overtime Request (otorisasi)

Request adalah otorisasi untuk bekerja lembur, **bukan** sumber durasi aktual.

| Field | Keterangan |
|---|---|
| `date` | Tanggal kerja lembur |
| `planned_start_at` / `planned_end_at` | Window rencana; boleh melewati tengah malam |
| `requested_minutes` | Diturunkan dari window |
| `approved_end_at` / `approved_minutes` | Approval boleh **mempersingkat** window, tidak boleh memperpanjang |
| `reason`, `task_description`, `review_note` | |

Status: `pending` → `approved` / `rejected`; `cancelled` bisa dari pending, atau dari approved sebelum waktu mulai.

Aturan:
- Maksimal satu request *pending/approved* per karyawan per tanggal.
- Reviewer tidak boleh menyetujui request miliknya sendiri.
- Bila `ot_requires_approval = false`, request langsung approved untuk seluruh window.

---

## 6. Realisasi & Transaksi

| Kondisi | `realization_status` | Eligible default |
|---|---|---|
| Tanpa request approved, ada lembur | `UNAUTHORIZED` | 0 (needs_review: HR memilih 0…aktual) |
| Approved, tidak ada lembur | `NOT_REALIZED` | 0 |
| Aktual < approved | `PARTIALLY_REALIZED` | aktual |
| Aktual = approved | `AUTHORIZED` | aktual |
| Aktual > approved | `EXCEEDS_APPROVAL` | approved (needs_review: HR memilih approved…aktual) |

Kondisi yang tidak menghasilkan transaksi (dilaporkan sebagai *skipped*):
- request masih pending;
- karyawan belum clock out;
- hari cuti approved;
- tidak ada overtime rule pada attendance rule;
- day type tidak cocok.

**Transaksi** menyimpan hasil final per karyawan per tanggal beserta snapshot:
- assignment (career path), pattern, schedule, shift;
- attendance rule, overtime rule;
- klasifikasi sumber, day type, tier;
- fakta attendance dan request.

Status: `pending_review`, `validated`, `void`.

**Breakdown** menyimpan menit per komponen OT (snapshot tier dan multiplier), **tanpa** rate atau nominal. Menghitung nominal adalah tugas Payroll.

---

## 7. Perubahan & Periode Terkunci

- **Input berubah** (koreksi clock, request, rule, jadwal) lalu diproses ulang: transaksi lama di-*void* dan diganti yang baru. Snapshot lama tetap tersimpan.
- **Periode payroll sudah terkunci** (run *closed*):
  - transaksi lama **tidak** diubah;
  - selisih per komponen dibukukan sebagai transaksi **adjustment** di periode berjalan (boleh negatif), dengan `adjusts_transaction_id`;
  - lembur yang belum pernah tercatat dibukukan langsung di periode berjalan;
  - transaksi yang butuh review di periode terkunci tidak diproses otomatis.
- Review transaksi ditolak bila periodenya terkunci.

---

## 8. Rekap untuk Payroll

`GET /attendance/summary?period=YYYY-MM` dan `attendance.Contract.GetSummary` menambahkan blok `overtime` per karyawan:

```json
"overtime": {
  "total_eligible_minutes": 300,
  "components": [
    { "component_code": "OT1", "component_name": "Overtime 1", "minutes": 120 },
    { "component_code": "OT2", "component_name": "Overtime 2", "minutes": 180 }
  ],
  "pending_review_count": 0
}
```

Rincian blok ini:
- Isinya hanya transaksi `validated` dengan `payroll_period` = periode tersebut, termasuk adjustment.
- Kode komponen dinamis, mengikuti konfigurasi rule.
- `pending_review_count > 0` berarti periode belum final.

`overtime_hours` yang lama tetap ada dan tidak berubah (jumlah menit approved request / 60). Cara Payroll mengonsumsi variabel per komponen dibahas terpisah.

---

## 9. API

| Method | Path | Izin |
|---|---|---|
| GET/POST | `/attendance/overtime-rules` | read·config / config |
| GET/PUT/DELETE | `/attendance/overtime-rules/{id}` | read·config / config |
| POST | `/attendance/overtime-rules/{id}/activate` | config |
| POST | `/attendance/overtime-rules/{id}/simulate` | config |
| GET | `/attendance/overtime-rules/classifications` | read·config |
| POST | `/attendance/overtime` | self / write |
| POST | `/attendance/overtime/{id}/approve` · `/reject` | approve |
| POST | `/attendance/overtime/{id}/cancel` | self / write |
| GET | `/attendance/overtime/transactions` (`period`, `status`, `realization_status`, `employee_id`) | read |
| GET | `/attendance/overtime/transactions/{id}` | read |
| GET | `/attendance/overtime/transactions/summary?period=` | read |
| POST | `/attendance/overtime/transactions/process` `{date_from, date_to, employee_ids?}` | write |
| POST | `/attendance/overtime/transactions/{id}/review` `{eligible_minutes, note}` | approve |
| GET | `/attendance/me/overtime/transactions` | self |

Seluruh route di atas berada di balik entitlement `attendance.overtime`.

---

## 10. Data Model

| Tabel | Isi |
|---|---|
| `overtime_rules` | Header rule + kebijakan |
| `overtime_rule_day_types` | Day type milik rule (`code`, `sequence` unik per rule) |
| `overtime_rule_details` | Tier per day type |
| `attendance_rules` | + `overtime_rule_id`, `ot_tolerance_min` |
| `overtime_requests` | + window rencana/approved, menit, `reason`, `review_note`, `cancelled_at`; status + `cancelled` |
| `overtime_transactions` | Hasil final + snapshot (`source_classifications`, `rule_snapshot`, `facts_snapshot`, `input_hash`) |
| `overtime_breakdowns` | Menit per komponen (snapshot tier) |

Kolom yang dihapus atau dihentikan:
- `holidays.overtime_multiplier` dihapus; multiplier kini milik day type rule.
- `overtime_requests.requested_hours/approved_hours/multiplier/is_holiday` tidak lagi ditulis dan akan dihapus oleh migration pembersihan.
