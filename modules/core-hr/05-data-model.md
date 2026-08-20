# 05 · Data Model

Model data konseptual (stack-agnostic). Entitas `users` & `tenants` dimiliki modul Auth; di sini direferensikan.

---

## 1. Diagram Relasi

```
  tenants (Auth)
     │ 1
     │ N
  employees ──────< assignments >────── org_units
     │  │ 1                                 │ 1 (self ref via parent_id)
     │  │                                   │
     │  │ N                            positions
     │  └──< employment_history >
     │  └──< status_history >
     │
     └── user_id ─▶ users (Auth)
     └── manager_id ─▶ employees (self ref)
```

---

## 2. Entitas

### 2.1 `employees`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `emp_...` |
| `tenant_id` | string (FK) | Isolasi multi-tenant (batas utama) |
| `branch_id` | string (FK) | Cabang tempat karyawan berada (2-level tenancy) |
| `user_id` | string (FK, nullable) | Tautan ke akun Auth |
| `full_name` | string | Nama lengkap |
| `national_id` | string | NIK; unik per tenant |
| `email` | string | Email kerja |
| `hire_date` | date | Tanggal bergabung |
| `employment_type` | enum | `permanent`, `contract`, `intern`, `outsource` |
| `status` | enum | `probation`, `active`, `on_leave`, `resigned`, `terminated`, `offboarded` |
| `manager_id` | string (FK, nullable) | Atasan (self-ref ke employees) |
| `current_org_unit_id` | string (FK) | Unit aktif (denormalisasi dari assignment) |
| `current_position_id` | string (FK) | Posisi aktif |
| `created_at` / `updated_at` | timestamp | |

**Constraint:** `UNIQUE(tenant_id, national_id)`.

### 2.2 `org_units`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `org_...` |
| `tenant_id` | string (FK) | |
| `parent_id` | string (FK, nullable) | Unit induk (null = puncak) |
| `name` | string | Nama unit |
| `type` | enum | `division`, `department`, `team` (fleksibel) |
| `head_employee_id` | string (FK, nullable) | Pimpinan unit |
| `is_active` | boolean | |

### 2.3 `positions`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `pos_...` |
| `tenant_id` | string (FK) | |
| `title` | string | Nama jabatan |
| `level` | string | Grade/level (mis. `staff`, `manager`) |
| `org_unit_id` | string (FK, nullable) | Unit terkait |
| `is_active` | boolean | |

### 2.4 `assignments`
Penempatan karyawan pada unit + posisi (aktif & historis).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `asg_...` |
| `employee_id` | string (FK) | |
| `org_unit_id` | string (FK) | |
| `position_id` | string (FK) | |
| `type` | enum | `initial`, `transfer`, `promotion`, `demotion` |
| `start_date` | date | Mulai berlaku |
| `end_date` | date (nullable) | Null = masih aktif |

> Assignment aktif = yang `end_date` null. Perubahan menutup yang lama & membuat baru.

### 2.5 `employment_history`
Riwayat kontrak/ikatan kerja.
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `employee_id` | string (FK) | |
| `employment_type` | enum | |
| `contract_start` / `contract_end` | date | |
| `note` | string | |

### 2.6 `status_history`
Jejak perubahan status lifecycle.
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `employee_id` | string (FK) | |
| `status` | enum | Status yang mulai berlaku |
| `effective_date` | date | |
| `reason` | string | |
| `changed_by` | string | Aktor |

### 2.7 `employee_documents`
Dokumen milik karyawan (kontrak, KTP, sertifikat).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `doc_...` |
| `employee_id` | string (FK) | |
| `type` | enum | `contract`, `id_card`, `certificate`, `tax`, `other` |
| `file_name` | string | Nama berkas |
| `file_ref` | string | Referensi storage (terenkripsi/akses terbatas) |
| `uploaded_by` | string | Aktor |
| `uploaded_at` | timestamp | |

---

## 3. Indeks yang Disarankan

| Tabel | Indeks | Alasan |
|---|---|---|
| `employees` | `(tenant_id, national_id)` unik | Keunikan & lookup |
| `employees` | `(tenant_id, status)` | Filter daftar karyawan |
| `employees` | `manager_id` | Query bawahan |
| `org_units` | `parent_id` | Traversal pohon |
| `assignments` | `(employee_id, end_date)` | Cari assignment aktif |
| `status_history` | `employee_id` | Riwayat status |

---

## 4. Catatan Desain

- **Denormalisasi terkontrol:** `current_org_unit_id` & `current_position_id` disimpan di `employees` untuk query cepat, tetapi kebenaran historis ada di `assignments`.
- **Self-reference:** `manager_id` & `org_units.parent_id` membentuk hierarki — hati-hati cegah siklus.
- **Tenancy 2 level:** `tenant_id` adalah batas isolasi utama; `branch_id` sub-pembeda cabang (sesuai [Tenancy Model](../../architecture/HRMS_Tenancy_Model.md) — final: A2 + B1 shared DB). Org unit & posisi juga membawa `branch_id`.
- **Kepatuhan:** `national_id` & data pribadi adalah data sensitif (UU PDP) — pertimbangkan enkripsi at-rest.
