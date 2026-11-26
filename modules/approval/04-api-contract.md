# 04 · API Contract

## HTTP — `/api/v1/approval`

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| GET | `/document-types` | `approval:config` | Registry document type (`key`, `label`, `has_subject`, `subtype_label`) |
| GET | `/policies` | `approval:config` | `?filter[document_type]=` |
| POST | `/policies` | `approval:config` | Buat policy |
| GET | `/policies/{id}` | `approval:config` | |
| PUT | `/policies/{id}` | `approval:config` | Ganti nama/subtype/aktif + seluruh step |
| DELETE | `/policies/{id}` | `approval:config` | Dokumen berjalan tidak terpengaruh |
| GET | `/inbox` | login | Step `pending` yang menunggu pemanggil, lintas document type (lihat di bawah) |
| GET | `/requests/{type}/{documentId}` | approver dokumen (`CanView`) | Tampilan approver: detail dari modul pemilik + semua approval dokumen + `can_decide` (lihat di bawah). 403 untuk non-approver |

**Contoh `POST /policies`**
```json
{
  "document_type": "leave_request",
  "subtype_ref": null,
  "name": "Cuti — atasan lalu HR",
  "steps": [
    { "approver_type": "direct_manager", "manager_level": 1, "manager_of": "subject", "on_unresolved": "any_approver" },
    { "approver_type": "user", "approver_user_id": "usr_...", "role_id_hint": "role_...", "on_unresolved": "skip" }
  ]
}
```

Error: `422 INVALID_APPROVAL_POLICY` (kombinasi field step tidak valid, document type tidak dikenal, `manager_of=subject` untuk dokumen tanpa subject), `409 APPROVAL_POLICY_EXISTS` (sudah ada policy untuk document type + subtype yang sama).

Permission `approval:config` diberikan ke `tenant_admin` (migrasi `20261110000004`).

## Inbox

Berisi (1) step `pending` yang di-assign ke pemanggil, dan (2) step `any_approver` dari document type yang `ApprovePermission`-nya dimiliki pemanggil (leave: `leave:approve`) — kecuali dokumen yang ia ajukan atau miliknya sendiri.

```json
{
  "request_id": "...", "document_type": "leave_request", "document_type_label": "Leave request",
  "document_id": "...", "subject_name": "Budi", "submitted_by_name": "Budi",
  "step_order": 1, "submitted_at": "...", "assigned": true,
  "summary": {
    "title": "Annual Leave", "subtitle": "2026-11-20 – 2026-11-21 · 2 day(s)",
    "fields": [ { "label": "Leave type", "value": "Annual Leave" }, { "label": "Reason", "value": "..." } ],
    "link_url": "https://...", "link_label": "Open attachment",
    "approve_path": "/api/v1/leave/requests/{id}/approve",
    "reject_path": "/api/v1/leave/requests/{id}/reject",
    "timeline_path": "/api/v1/leave/requests/{id}/approval"
  }
}
```

`summary` disediakan modul pemilik lewat `RegisterDocument`; UI inbox cukup merender field dan memanggil path-nya (body `{ "note": "..." }`).

Document type terdaftar: `leave_request`, `payroll_run`, `overtime_request`, `attendance_correction` (dua terakhir dirutekan hanya bila tenant punya policy untuknya). Contoh item untuk keempatnya: [`mobile/api/approval.md`](../mobile/api/approval.md).

## Tampilan approver — `GET /requests/{type}/{documentId}`

Akses **berdasarkan penugasan, bukan permission modul** (tidak perlu `leave:read`, `payroll:read`, dsb.). Diizinkan bila pemanggil:

| Siapa | Lihat | Approve/reject |
|---|---|---|
| Approver step `pending` | ✅ | ✅ (`can_decide`) |
| Approver step `waiting` (belum giliran) | ✅ read-only | ❌ |
| Approver/pemutus approval mana pun dari dokumen ini, termasuk approval lama sebelum ditolak & diajukan ulang | ✅ read-only, selamanya | ❌ |
| Step aktif `any_approver` | ✅ bila punya `ApprovePermission` document type, dalam branch scope, dan bukan pemilik/pengaju | ✅ syarat sama |

Pemilik dokumen dan HR reader tetap memakai endpoint modul pemilik.

```json
{
  "document_type": "leave_request", "document_type_label": "Leave request", "document_id": "...",
  "subject_employee_id": "...", "subject_name": "Budi", "submitted_by_name": "Budi",
  "detail": {
    "summary": { "title": "Annual leave", "subtitle": "...", "fields": [ { "label": "Dates", "value": "..." } ], "approve_path": "...", "reject_path": "...", "timeline_path": "..." },
    "sections": [ { "title": "Balance as of 2026-12-01", "fields": [ { "label": "Available", "value": "8 day(s)" } ] } ],
    "attachments": [ { "label": "Supporting document", "url": "https://...presigned" } ],
    "detail_path": ""
  },
  "can_decide": true,
  "approvals": [ { "request_id": "...", "status": "pending", "steps": [], "actions": [] } ]
}
```

- `approvals`: semua instance approval dokumen, terbaru dulu (format sama dengan timeline di bawah).
- `attachments[].url`: URL presigned berumur pendek yang dibuat modul pemilik saat detail disusun — hanya keluar setelah `CanView`, jadi tidak perlu endpoint lampiran terpisah.
- `detail_path` (opsional): route aplikasi untuk tampilan lebih kaya (payroll run → `/tenants/salary/runs/{id}`). Endpoint modul di baliknya wajib memakai `CanView` untuk jalur approver.

## Timeline dokumen

Disajikan oleh modul pemilik dengan aturan aksesnya sendiri. Leave: `GET /leave/requests/{id}/approval` (`leave:read`, `leave:approve`, pemilik cuti, atau approver request tsb.). `data` = null bila belum dirutekan.

```json
{
  "request_id": "...", "status": "pending", "current_step": 1,
  "steps": [
    { "step_order": 1, "approver_user_id": "usr_...", "approver_name": "Sari", "source": "direct_manager:subject:L1", "status": "pending" },
    { "step_order": 2, "approver_name": "", "source": "any_approver", "status": "waiting" }
  ],
  "actions": [ { "action": "submit", "actor_name": "Budi", "created_at": "..." } ]
}
```

## Contract antar modul (`approval.Contract`)

| Method | Keterangan |
|---|---|
| `Submit(ctx, SubmitInput)` | → `{RequestID, Outcome}`; di dalam transaksi pemanggil |
| `Decide(ctx, DecideInput)` | → `Outcome` (`advanced` / `final_approved` / `rejected`); `AnyApproverAllowed` = pemanggil sudah lolos permission approve |
| `Cancel(ctx, CancelInput)` | No-op bila tidak ada request aktif |
| `CurrentApprovers(ctx, tenant, docType, ids)` | Approver step aktif per dokumen (null = any approver) |
| `Timeline(ctx, tenant, docType, id)` | Request terakhir + nama approver + log |
| `EnsureDefaultPolicy(ctx, tenant, docType)` | Idempoten |
| `CanView(ctx, tenant, docType, id, user, access)` | Pemanggil boleh membaca dokumen sebagai approver (aturan tabel di atas). `access` dibangun dengan `approval.AccessFor(principal)`. Modul pemilik **wajib** memakai ini untuk jalur approver di endpoint bacanya, bukan logika sendiri |
| `RegisterDocument(docType, p)` | `p` = `DocumentProvider` (`Summarize` untuk inbox + `Detail` untuk tampilan approver; opsional `DocumentBranches` untuk dokumen tanpa subject). Consumer baru wajib mengimplementasikan keduanya |
