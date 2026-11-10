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

`summary` disediakan modul pemilik lewat `RegisterSummarizer`; UI inbox cukup merender field dan memanggil path-nya (body `{ "note": "..." }`).

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
| `IsParticipant(ctx, tenant, docType, id, user)` | User adalah/pernah menjadi approver atau pemutus |
| `RegisterSummarizer(docType, s)` | Ringkasan dokumen untuk inbox |
