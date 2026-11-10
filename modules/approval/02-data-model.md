# 02 · Data Model

Migrasi: `20261110000003_create_approval_tables`. Kolom `document_id`, `subject_employee_id`, dan `*_user_id` tidak ber-FK lintas modul.

## `approval_policies`

| Field | Tipe | Keterangan |
|---|---|---|
| `id`, `tenant_id` | UUID | |
| `document_type` | string | Key registry, mis. `leave_request` |
| `subtype_ref` | UUID null | Mis. `leave_type_id`; null = policy default |
| `name` | string | |
| `is_active` | bool | Policy nonaktif diabaikan saat submit |

Unik: `(tenant_id, document_type, subtype_ref)` (null diperlakukan sebagai satu nilai).

## `approval_policy_steps`

| Field | Tipe | Keterangan |
|---|---|---|
| `policy_id`, `step_order` | | Unik; 1..N, dinomori ulang saat simpan |
| `approver_type` | enum | `direct_manager` / `user` |
| `manager_level`, `manager_of` | int, enum | Untuk `direct_manager` |
| `approver_user_id`, `role_id_hint` | UUID | Untuk `user`; role hanya filter UI |
| `on_unresolved`, `fallback_user_id` | enum, UUID | `any_approver` / `fallback_user` / `skip` |

Simpan policy = ganti seluruh step (delete + insert).

## `approval_requests`

| Field | Tipe | Keterangan |
|---|---|---|
| `document_type`, `document_id` | | Referensi polimorfik |
| `policy_id` | UUID null | Policy yang dipakai; null bila policy dihapus |
| `subject_employee_id` | UUID null | Pemilik dokumen |
| `submitted_by_user_id`, `submitted_by_employee_id` | | Pengaju |
| `status` | enum | `pending` / `approved` / `rejected` / `cancelled` |
| `current_step` | int | Step yang sedang berjalan |
| `submitted_at`, `completed_at` | timestamp | |

Unik parsial: satu request `pending` per dokumen. Request yang selesai tetap sebagai riwayat; dokumen yang diajukan ulang mendapat request baru.

## `approval_request_steps`

| Field | Keterangan |
|---|---|
| `approver_user_id` | Hasil resolve saat submit; **null = any_approver** |
| `source` | `direct_manager:subject:L1`, `direct_manager:submitter:L2`, `user`, `fallback`, `any_approver`, `skip` |
| `status` | `waiting` / `pending` / `approved` / `rejected` / `skipped` |
| `decided_by`, `decided_at`, `note` | Keputusan |

Indeks `(approver_user_id, status)` untuk inbox.

## `approval_actions`

Log immutable: `submit`, `approve`, `reject`, `cancel`, `skip` (+ `step_id`, `actor_user_id`, `note`, `created_at`).
