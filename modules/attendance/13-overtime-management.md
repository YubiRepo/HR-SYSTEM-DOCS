# 13 · Overtime Management

Pengelolaan lembur end-to-end di modul Attendance: aturan lembur (Overtime Rule) yang terpusat, klasifikasi hari dari modul sumber, tiga sumber otorisasi (kuota auto-approve per day type, Overtime Request, dan Overtime Order/SPL), realisasi dari data kehadiran, transaksi final dengan breakdown per komponen OT, dan rekap per periode yang siap dikonsumsi Payroll.

Semua durasi dalam **menit**.

---

## 1. Alur

```
HR Setting → Overtime Rules        : rule + day types + tiers (OT1, OT2, …); maks 1 rule aktif per tenant
HR Setting → Working Time (shift)  : pengukuran OT: mulai setelah / pembulatan / toleransi
Karyawan / HR → Overtime Request   : window rencana (mulai–selesai) → approve (boleh dipersingkat) / reject / cancel
Atasan / HR → Overtime Order (SPL) : surat perintah lembur bernomor untuk banyak karyawan → draft → issued / cancelled
Attendance                         : clock in/out, mesin, koreksi → attendance_records
Overtime processing                : fakta attendance + approval (request / SPL / kuota) + rule → overtime transaction + breakdown
HR → Overtime Transactions         : review transaksi "needs review"
Attendance summary (per periode)   : total menit per komponen OT → dikonsumsi Payroll
```

Processing berjalan:
- otomatis **harian** (job `attendance.overtime.process_daily`, 02:00 UTC, memproses 3 hari terakhir s.d. kemarin);
- setelah request di-review atau di-cancel, dan setelah SPL diterbitkan atau dibatalkan (best-effort);
- manual lewat tombol **Process Overtime** (rentang tanggal, maks. 62 hari).

Processing **idempoten**: input yang sama tidak mengubah apa pun.

---

## 2. Overtime Rule

Master konfigurasi terpusat, berdiri sendiri, dan **tidak** menempel di Shift/Working Pattern.

| Bagian | Isi |
|---|---|
| Header | `code`, `name`, kebijakan `unauthorized_policy` & `excess_policy` |
| Day Type (milik rule) | `code` = salah satu kode klasifikasi (§3, konstanta — kode lain ditolak `INVALID_OVERTIME_RULE_ARGUMENT`), `name`, `sequence` = **prioritas**, `active`, `unauthorized_auto_minutes` & `excess_auto_minutes` = **kuota auto-approve** (§5.3; 0–1440, wajib diisi bila policy terkait `auto_approved`, harus 0 bila tidak) |
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
| `auto_approved` | Eligible otomatis s.d. kuota day type (`unauthorized_auto_minutes` / `excess_auto_minutes`); di atas kuota tidak eligible |

**Rule aktif** — Overtime rule berdiri sendiri (tidak dipilih lewat attendance rule). Maks **1 rule aktif per tenant**, dan itulah rule yang dipakai saat processing:
- create rule baru → langsung aktif, rule aktif lain otomatis dinonaktifkan;
- activate rule → rule aktif lain otomatis dinonaktifkan;
- deactivate rule aktif diperbolehkan → tidak ada rule aktif, overtime tidak diproses (*skipped*) sampai ada rule yang diaktifkan.

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

## 5. Otorisasi Lembur

Otorisasi menentukan **berapa menit yang disetujui** (approved). Otorisasi **bukan** sumber durasi aktual — durasi aktual selalu dari attendance (§4).

Ada tiga sumber, dengan urutan prioritas:

| Prioritas | Sumber | `approval_source` |
|---|---|---|
| 1 | Dokumen: **Overtime Request** approved (§5.1) **atau** baris **Overtime Order / SPL** yang issued (§5.2) — paling banyak satu per karyawan per tanggal (§5.4) | `request` / `order` |
| 2 | **Kuota auto-approve** day type (§5.3), hanya bila tidak ada dokumen dan `unauthorized_policy = auto_approved` | `quota` |
| — | Tidak ada keduanya → lembur *unauthorized* | (kosong) |

Dokumen **menggantikan** kuota, bukan menambah: hari dengan SPL 3 jam dan kuota 2 jam → approved 3 jam; request approved 1 jam dan kuota 2 jam → approved 1 jam.

### 5.1 Overtime Request

Pengajuan per karyawan per tanggal (bottom-up), dari ESS atau HR atas nama karyawan.

| Field | Keterangan |
|---|---|
| `date` | Tanggal kerja lembur |
| `planned_start_at` / `planned_end_at` | Window rencana; boleh melewati tengah malam |
| `requested_minutes` | Diturunkan dari window |
| `approved_end_at` / `approved_minutes` | Approval boleh **mempersingkat** window, tidak boleh memperpanjang |
| `reason`, `task_description`, `review_note` | |

Status: `pending` → `approved` / `rejected`; `cancelled` bisa dari pending, atau dari approved sebelum waktu mulai.

Aturan:
- Maksimal satu request *pending/approved* per karyawan per tanggal, dan tidak boleh di tanggal yang sudah dipegang SPL (§5.4).
- Reviewer tidak boleh menyetujui request miliknya sendiri.
- Bila `ot_requires_approval = false`, request langsung approved untuk seluruh window.

### 5.2 Overtime Order — SPL (Surat Perintah Lembur)

Perintah lembur top-down dari atasan/HR, satu dokumen untuk **satu tanggal kerja dan banyak karyawan**. Aggregate terpisah dari request: baris SPL yang issued **langsung** menjadi otorisasi transaksi, tanpa membuat Overtime Request.

| Bagian | Isi |
|---|---|
| Header | `work_date`, `branch_id?`, `title?`, `task_description` (wajib), `reason?`, `issuer_employee_id?` (pemberi perintah / penanda tangan), `order_number` (terisi saat issued) |
| Baris (per karyawan) | `employee_id` (unik per SPL), `planned_start_at` / `planned_end_at` (boleh melewati tengah malam, maks 24 jam), `planned_minutes` (diturunkan), `task_description?`, status `active` / `cancelled` |

Status SPL:
- `draft` — bebas diedit atau dihapus; **tidak** mengunci hari karyawan mana pun.
- `issued` — mendapat nomor `SPL/{YYYY}/{MM}/{NNNN}` (urut per tenant per bulan `work_date`, tabel `document_sequences`), setiap baris aktif mengunci hari karyawannya (§5.4). Gagal seluruhnya bila ada karyawan yang harinya sudah dipegang dokumen lain (`OVERTIME_ORDER_CONFLICT`, menyebut karyawannya).
- `cancelled` — membatalkan seluruh SPL, hanya **sebelum jam mulai** baris aktif paling awal. Pembatalan per baris juga bisa (sebelum jam mulai baris itu); bila baris aktif terakhir dibatalkan, SPL ikut `cancelled`.

Approved minutes baris = `planned_minutes` (window SPL tidak dipersingkat). Karyawan bebas merealisasi atau tidak: tanpa kehadiran lembur → `NOT_REALIZED`.

**Dokumen PDF**: `GET …/overtime-orders/{id}/pdf` untuk SPL issued/cancelled (draft belum punya nomor). Isi: kop tenant/cabang, judul & nomor, tanggal lembur, uraian tugas, tabel karyawan (No, NIK, Nama, Jam, Durasi, Uraian Tugas, Paraf), blok tanda tangan Pemberi Perintah & Mengetahui HRD. SPL `cancelled` diberi watermark **DIBATALKAN**. Jam ditampilkan dalam zona waktu cabang (fallback tenant).

### 5.3 Policy `auto_approved` & Kuota per Day Type

Kedua policy (`unauthorized_policy`, `excess_policy`) boleh `auto_approved`. Masing-masing punya kuota sendiri per day type, **wajib** untuk setiap day type aktif bila policy-nya `auto_approved`, dan **tidak boleh** diisi bila policy lain (`INVALID_OVERTIME_RULE_ARGUMENT`).

| Kuota | Berlaku bila | Arti |
|---|---|---|
| `unauthorized_auto_minutes` (U) | `unauthorized_policy = auto_approved` | Hari **tanpa dokumen**: lembur s.d. U dihitung approved (`approval_source = quota`) |
| `excess_auto_minutes` (E) | `excess_policy = auto_approved` | Kelebihan dari approved (dokumen **atau** U) tetap eligible s.d. E |

Di atas kuota → tidak eligible (hangus), tanpa review.

Contoh `WORKING_DAY`, U = 120, E = 60, kedua policy `auto_approved`:

| Kasus | Aktual | Eligible |
|---|---|---|
| Tanpa dokumen | 0 | tidak ada transaksi (karyawan tidak merealisasi) |
| Tanpa dokumen | 90 | 90 (`PARTIALLY_REALIZED`) |
| Tanpa dokumen | 240 | 120 + 60 = 180 (`EXCEEDS_APPROVAL`, 60 hangus) |
| Request / SPL 180 | 270 | 180 + 60 = 240 (30 hangus) |

Bila hanya `unauthorized_policy = auto_approved`, kelebihan dari U mengikuti `excess_policy` (`not_eligible` → hangus, `needs_review` → HR memilih U…aktual). Request yang di-reject/cancel membuat kuota U berlaku lagi untuk hari itu.

### 5.4 Kunci satu dokumen per hari (approval claim)

Tabel `overtime_approval_claims`, unik per `(tenant_id, employee_id, work_date)`, mencatat dokumen mana yang memegang hari karyawan (`source` = `request` / `order`, `source_id` = id request / id baris SPL). Unique index menjamin tidak ada dua dokumen, termasuk saat race.

| Dokumen | Mengambil claim | Melepas claim (status negatif) |
|---|---|---|
| Overtime Request | submit (pending/approved) | rejected, cancelled |
| Baris SPL | SPL issued | SPL cancelled, baris cancelled (draft tidak pernah memegang claim) |

Dokumen kedua untuk hari yang sama ditolak (`OVERTIME_DAY_ALREADY_CLAIMED` untuk request, `OVERTIME_ORDER_CONFLICT` untuk SPL) sampai dokumen pertama dalam status negatif. Karena pembatalan hanya bisa sebelum jam mulai, setelah lembur terjadi sumber approval transaksi stabil.

---

## 6. Realisasi & Transaksi

| Kondisi | `realization_status` | Eligible default |
|---|---|---|
| Tanpa dokumen dan tanpa kuota, ada lembur | `UNAUTHORIZED` | 0 (needs_review: HR memilih 0…aktual) |
| Approved, tidak ada lembur | `NOT_REALIZED` | 0 |
| Aktual < approved | `PARTIALLY_REALIZED` | aktual |
| Aktual = approved | `AUTHORIZED` | aktual |
| Aktual > approved | `EXCEEDS_APPROVAL` | approved (needs_review: HR memilih approved…aktual) |

Kondisi yang tidak menghasilkan transaksi (dilaporkan sebagai *skipped*):
- request masih pending;
- tidak ada dokumen, tidak ada lembur (termasuk hari dengan kuota yang tidak direalisasi);
- karyawan belum clock out;
- hari cuti approved;
- tidak ada overtime rule aktif di tenant;
- day type tidak cocok.

**Transaksi** menyimpan hasil final per karyawan per tanggal beserta snapshot:
- assignment (career path), pattern, schedule, shift;
- attendance rule, overtime rule;
- klasifikasi sumber, day type, tier;
- fakta attendance dan otorisasi (`approval_source`, request / SPL & baris, approved window & menit).

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
  "total_weighted_minutes": 510,
  "components": [
    { "component_code": "OT1", "component_name": "Overtime 1", "minutes": 120, "weighted_minutes": 180 },
    { "component_code": "OT2", "component_name": "Overtime 2", "minutes": 180, "weighted_minutes": 330 }
  ],
  "pending_review_count": 0
}
```

Rincian blok ini:
- Isinya hanya transaksi `validated` dengan `effective_date` di dalam rentang `date_from..date_to`, termasuk adjustment. `effective_date` = tanggal kerja untuk transaksi biasa; tanggal booking untuk transaksi/adjustment yang dibukukan ke periode terbuka karena periode asalnya sudah terkunci. (`payroll_period` tetap disimpan untuk listing, tapi tidak lagi dipakai rekap.)
- `weighted_minutes` = Σ durasi × multiplier tier.
- Kode komponen dinamis, mengikuti konfigurasi rule.
- `pending_review_count > 0` berarti rentang belum final — payroll menolak calculate run selama masih ada (lihat payroll `07` §1.3).

`overtime_hours` sekarang = `total_eligible_minutes / 60` dari transaksi ini (bukan lagi menit approved request), dan `overtime_weighted_hours` = `total_weighted_minutes / 60`. Payroll mengonsumsi variabel per komponen sebagai `ot_min_<KODE>` / `ot_wmin_<KODE>` (payroll `08` §2).

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
| GET/POST | `/attendance/overtime-orders` (`status`, `branch_id`, `employee_id`, `date_from`, `date_to`) | read / write |
| GET/PUT/DELETE | `/attendance/overtime-orders/{id}` (PUT/DELETE hanya draft) | read / write |
| POST | `/attendance/overtime-orders/{id}/issue` | approve |
| POST | `/attendance/overtime-orders/{id}/cancel` `{note?}` | approve |
| POST | `/attendance/overtime-orders/{id}/lines/{lineId}/cancel` `{note?}` | approve |
| GET | `/attendance/overtime-orders/{id}/pdf` | read |
| GET | `/attendance/me/overtime-orders`, `/attendance/me/overtime-orders/{id}/pdf` | self (hanya SPL yang memuat dirinya, bukan draft) |

Seluruh route di atas berada di balik entitlement `attendance.overtime`.

---

## 10. Data Model

| Tabel | Isi |
|---|---|
| `overtime_rules` | Header rule + kebijakan |
| `overtime_rule_day_types` | Day type milik rule (`code`, `sequence` unik per rule), `unauthorized_auto_minutes`, `excess_auto_minutes` |
| `overtime_rule_details` | Tier per day type |
| `overtime_rules` (index) | unique partial `(tenant_id) WHERE active` — maks 1 rule aktif per tenant |
| `overtime_requests` | + window rencana/approved, menit, `reason`, `review_note`, `cancelled_at`; status + `cancelled` |
| `overtime_approval_claims` | Kunci satu dokumen (request / baris SPL) per karyawan per tanggal (§5.4) |
| `overtime_orders` / `overtime_order_lines` | SPL: header + baris per karyawan |
| `document_sequences` | Nomor urut dokumen per tenant, jenis (`SPL`), dan periode (`YYYY-MM`) |
| `overtime_transactions` | Hasil final + snapshot (`source_classifications`, `rule_snapshot`, `facts_snapshot`, `input_hash`), `approval_source`, `overtime_order_id`, `overtime_order_line_id` |
| `overtime_breakdowns` | Menit per komponen (snapshot tier) |

Kolom yang dihapus atau dihentikan:
- `holidays.overtime_multiplier` dihapus; multiplier kini milik day type rule.
- `overtime_requests.requested_hours/approved_hours/multiplier/is_holiday` tidak lagi ditulis dan akan dihapus oleh migration pembersihan.
