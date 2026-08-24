# 06 · Data Model

Entitas milik modul Leave. `employees` dirujuk dari Core HR.

---

## 1. Diagram Relasi

```
  leave_types ──< leave_balances >── employees (Core HR)
  leave_types ──> approval_flows ──< approval_steps
  leave_requests >── employees
      └──< leave_request_approvals
  leave_ledger (riwayat perubahan saldo)
```

---

## 2. Entitas

### 2.1 `leave_types`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `ltype_...` |
| `tenant_id` | string (FK) | |
| `code` | string | `annual`, `sick`, `maternity`, ... |
| `name` | string | Nama tampil |
| `paid` | boolean | Berbayar / tidak |
| `quota_days` | int (nullable) | Jatah; null = tanpa jatah tetap |
| `accrual` | enum | `upfront` / `monthly` / `none` |
| `period_basis` | enum | `anniversary` / `calendar` / `hybrid` (default hybrid) |
| `carry_over` | enum | `none` / `full` / `limited` |
| `carry_over_max` | int (nullable) | Batas carry-over |
| `carry_over_expiry` | string (nullable) | Kedaluwarsa (mis. `03-31`) |
| `requires_document` | boolean | Wajib lampiran |
| `gender` | enum | `all` / `female` / `male` |
| `min_tenure_months` | int | Syarat masa kerja |
| `approval_flow_id` | string (FK) | Alur approval |
| `is_preset` | boolean | Preset bawaan / custom |
| `is_active` | boolean | |

### 2.2 `leave_balances`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `employee_id` | string (FK) | |
| `type_id` | string (FK) | |
| `period` | string | mis. `2026` |
| `quota` | int | Jatah |
| `used` | int | Terpakai |
| `pending` | int | Diajukan belum disetujui |
| `carried_in` | int | Dari carry-over periode lalu |

**Indeks:** `(employee_id, type_id, period)` unik. `balance` = quota + carried_in − used (dihitung).

### 2.3 `leave_requests`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `lreq_...` |
| `employee_id` | string (FK) | |
| `type_id` | string (FK) | |
| `branch_id` | string (FK) | |
| `date_from` / `date_to` | date | |
| `days` | number | Jumlah hari (memperhitungkan hari kerja/libur) |
| `reason` | string | |
| `document_ref` | string (nullable) | Lampiran |
| `status` | enum | `draft`, `pending`, `approved`, `rejected`, `cancelled` |
| `current_step` | int | Step approval berjalan |

### 2.4 `approval_flows` & `approval_steps`
`approval_flows`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string (FK) | |
| `name` | string | mis. "1 Level Atasan" |

`approval_steps`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `flow_id` | string (FK) | |
| `step_order` | int | Urutan |
| `approver_type` | enum | `manager` (reporting line) / `role` / `position` |
| `approver_ref` | string (nullable) | Role/jabatan bila bukan manager |

### 2.5 `leave_request_approvals`
Jejak tiap keputusan approval (audit).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `request_id` | string (FK) | |
| `step_order` | int | |
| `approver_id` | string | Aktor |
| `decision` | enum | `approved` / `rejected` |
| `note` | string | |
| `decided_at` | timestamp | |

### 2.6 `leave_ledger`
Riwayat perubahan saldo (auditable).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `employee_id` | string (FK) | |
| `type_id` | string (FK) | |
| `change` | int | +/− hari |
| `reason` | enum | `accrual`, `used`, `carry_over`, `expired`, `adjustment`, `encashment` |
| `ref_id` | string (nullable) | Rujuk request/proses |
| `created_at` | timestamp | |

---

## 3. Catatan Desain

- **Ledger sebagai sumber kebenaran saldo** — `leave_balances` bisa dihitung ulang dari ledger (auditable, tak ada saldo "hilang misterius").
- **Perhitungan `days`** memperhitungkan hari kerja & libur (dari Attendance) — cuti 3 hari kalender yang mengandung Minggu bisa dihitung berbeda sesuai kebijakan.
- **Approval flow reusable** — banyak jenis cuti bisa memakai flow yang sama.
- **Config versioned bila perlu** — perubahan quota/aturan tak mengubah periode berjalan secara surut.
- Semua keputusan approval & perubahan saldo tercatat (audit).
