<!-- 📁 modules/mobile/api/approval.md -->
# Mobile API · Approval

Satu inbox persetujuan lintas modul (cuti, lembur, koreksi absen, payroll run) untuk layar **Pusat Persetujuan**. Prefix `/api/v1/approval`. Aksi approve/reject tetap ke endpoint modul pemilik, yang path-nya dikirim di setiap item.

> Referensi lengkap: [`../../approval/04-api-contract.md`](../../approval/04-api-contract.md).

---

## 1. Inbox Saya — `GET /approval/inbox`
**Permission:** cukup login. Berisi:
1. step `pending` yang di-assign ke pemanggil (`assigned: true`), dan
2. step `any_approver` dari jenis dokumen yang permission approve-nya dimiliki pemanggil (`assigned: false`): `leave:approve`, `attendance:approve`, `payroll:approve`. Dibatasi branch scope pemanggil, dan tidak termasuk dokumen milik atau ajuan pemanggil sendiri.

Tanpa paginasi; `data: []` bila tidak ada yang menunggu.

```json
{
  "success": true,
  "data": [
    {
      "request_id": "0b9…", "document_type": "leave_request", "document_type_label": "Leave request",
      "document_id": "7c1…", "subject_employee_id": "e12…", "subject_name": "Budi Santoso",
      "submitted_by_name": "Budi Santoso", "step_order": 1, "submitted_at": "2026-11-24T02:10:00Z", "assigned": true,
      "summary": {
        "title": "Cuti Tahunan",
        "subtitle": "2026-12-01 – 2026-12-02 · 2 day(s)",
        "fields": [
          { "label": "Leave type", "value": "Cuti Tahunan" },
          { "label": "Dates", "value": "2026-12-01 – 2026-12-02" },
          { "label": "Days", "value": "2" },
          { "label": "Reason", "value": "Acara keluarga" }
        ],
        "approve_path": "/api/v1/leave/requests/7c1…/approve",
        "reject_path": "/api/v1/leave/requests/7c1…/reject",
        "timeline_path": "/api/v1/leave/requests/7c1…/approval"
      }
    },
    {
      "request_id": "3aa…", "document_type": "overtime_request", "document_type_label": "Overtime request",
      "document_id": "91d…", "subject_name": "Sari Wulandari", "submitted_by_name": "Sari Wulandari",
      "step_order": 1, "submitted_at": "2026-11-25T09:00:00Z", "assigned": true,
      "summary": {
        "title": "Overtime 2026-11-25",
        "subtitle": "17:00–20:00 (3h)",
        "fields": [
          { "label": "Date", "value": "2026-11-25" },
          { "label": "Planned", "value": "17:00–20:00 (3h)" },
          { "label": "Reason", "value": "Closing bulanan" },
          { "label": "Task", "value": "Rekonsiliasi stok" }
        ],
        "approve_path": "/api/v1/attendance/overtime/91d…/approve",
        "reject_path": "/api/v1/attendance/overtime/91d…/reject",
        "timeline_path": "/api/v1/attendance/overtime/91d…/approval"
      }
    },
    {
      "request_id": "5f0…", "document_type": "attendance_correction", "document_type_label": "Attendance correction",
      "document_id": "c44…", "subject_name": "Rizky", "submitted_by_name": "Rizky",
      "step_order": 1, "submitted_at": "2026-11-26T01:30:00Z", "assigned": false,
      "summary": {
        "title": "Clock out correction 2026-11-25",
        "subtitle": "— → 17:05",
        "fields": [
          { "label": "Date", "value": "2026-11-25" },
          { "label": "Field", "value": "Clock out" },
          { "label": "Change", "value": "— → 17:05" },
          { "label": "Reason", "value": "Lupa absen pulang" }
        ],
        "approve_path": "/api/v1/attendance/corrections/c44…/approve",
        "reject_path": "/api/v1/attendance/corrections/c44…/reject",
        "timeline_path": "/api/v1/attendance/corrections/c44…/approval"
      }
    },
    {
      "request_id": "8e2…", "document_type": "payroll_run", "document_type_label": "Payroll run",
      "document_id": "a07…", "submitted_by_name": "HR Admin", "step_order": 1,
      "submitted_at": "2026-11-26T03:00:00Z", "assigned": true,
      "summary": {
        "title": "Payroll run 2026-11",
        "subtitle": "Regular · 42 employee(s) · net Rp312.500.000",
        "fields": [
          { "label": "Type", "value": "Regular" },
          { "label": "Tax period", "value": "2026-11" },
          { "label": "Pay date", "value": "2026-11-28" },
          { "label": "Branch", "value": "All branches" },
          { "label": "Employees", "value": "42" },
          { "label": "Gross", "value": "Rp350.000.000" },
          { "label": "Net pay", "value": "Rp312.500.000" }
        ],
        "link_url": "/tenants/salary/runs/a07…", "link_label": "Open payroll run",
        "approve_path": "/api/v1/payroll/runs/a07…/approve",
        "reject_path": "/api/v1/payroll/runs/a07…/reject",
        "timeline_path": "/api/v1/payroll/runs/a07…/approval"
      }
    }
  ]
}
```

Catatan render:
- Isi `summary` (title, label field) dalam bahasa Inggris dan sudah diformat server (jam dalam zona waktu karyawan). App cukup menampilkan atau menerjemahkan label yang dikenal.
- `subject_*` tidak ada untuk dokumen tanpa subject karyawan (payroll run).
- `link_url` payroll adalah route backoffice, bukan file. Abaikan di mobile.
- Approve/reject: `POST` ke `approve_path` / `reject_path`. Body umum `{ "note": "…" }`; lembur menerima tambahan `approved_end_at` (lihat [attendance.md](./attendance.md) §8). Item hilang dari inbox setelah diputuskan atau saat berpindah ke step berikutnya milik orang lain.

## 2. Detail untuk Approver — `GET /approval/requests/{document_type}/{document_id}`
**Permission:** berdasarkan penugasan (approver step aktif/menunggu/sebelumnya, atau pemegang permission approve untuk step `any_approver`). `403` untuk selain itu.

Mengembalikan `detail` (`summary`, `sections[]`, `attachments[]` berupa URL presigned berumur pendek), `can_decide`, dan `approvals[]` (timeline). Contoh lengkap di [kontrak modul Approval](../../approval/04-api-contract.md#tampilan-approver--get-requeststypedocumentid).

## 3. Riwayat Keputusan Saya — `GET /approval/decided?page=1&per_page=20&document_type=`
**Permission:** cukup login, hanya keputusan pemanggil sendiri. Step yang ia setujui atau tolak, **terbaru dulu**, dengan paginasi standar (`pagination.total_pages`). `per_page` default 20, maks 100. `document_type` opsional.

```json
{
  "success": true,
  "data": [
    {
      "request_id": "3aa…", "document_type": "overtime_request", "document_type_label": "Overtime request",
      "document_id": "91d…", "subject_name": "Rizky", "submitted_by_name": "Rizky",
      "step_order": 1, "submitted_at": "2026-11-25T09:00:00Z", "assigned": true,
      "summary": { "title": "Overtime 2026-11-25", "subtitle": "17:00–20:00 (3h)", "fields": [ … ],
                   "approve_path": "…", "reject_path": "…", "timeline_path": "/api/v1/attendance/overtime/91d…/approval" },
      "decision": "rejected",
      "note": "hihu",
      "decided_at": "2026-11-26T08:25:00Z"
    }
  ],
  "pagination": { "page": 1, "per_page": 20, "total_items": 4, "total_pages": 1 }
}
```
- Bentuk item sama dengan inbox (§1), ditambah `decision` (`approved` / `rejected`), `note` (catatan saat memutuskan, bisa tidak ada), dan `decided_at`.
- Buka detail lewat `summary.timeline_path`. `approve_path` / `reject_path` tetap ada di `summary`, tetapi jangan ditampilkan sebagai aksi karena dokumennya sudah diputuskan.
- Hanya keputusan yang lewat **engine approval**. Lembur/koreksi yang diputuskan satu tahap tanpa policy (lihat bagian bawah) tidak tercatat di sini.

## 4. Timeline — `timeline_path` dari item inbox
`data: null` bila dokumen tidak pernah dirutekan lewat engine approval.

---

## Kapan lembur & koreksi masuk inbox
Lembur (`overtime_request`) dan koreksi absen (`attendance_correction`) dirutekan lewat engine approval **hanya bila tenant punya approval policy** untuk jenis dokumen itu. Policy default (atasan langsung) dibuat saat provisioning tenant baru dan lewat backfill `b20261126090000_seed_hr_setting_defaults_for_tenant` untuk tenant lama. Tanpa policy, dokumen diputuskan satu tahap oleh pemegang `attendance:approve` lewat `GET /attendance/overtime?status=pending` / `GET /attendance/corrections?status=pending`, dan tidak muncul di inbox. Ajuan yang dibuat sebelum policy ada juga tetap di jalur lama itu.
