# 06 · Data Model

Entitas milik modul Attendance. `employees` & `branches` dirujuk dari Core HR.

---

## 1. Diagram Relasi

```
  shifts ──< schedules >── employees (Core HR)
  attendance_records >── employees
      └──< attendance_corrections
  overtime_requests >── attendance_records
  holidays (per tenant/branch)
  attendance_rules (config per tenant)
```

---

## 2. Entitas

### 2.1 `shifts`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `shift_...` |
| `tenant_id` | string (FK) | |
| `name` | string | "Pagi", "Malam" |
| `type` | enum | `fixed` / `flexible` |
| `start_time` / `end_time` | time | |
| `break_minutes` | int | |
| `cross_midnight` | boolean | |
| `work_hours` | number | Jam efektif |

### 2.2 `schedules`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `employee_id` | string (FK) | |
| `branch_id` | string (FK) | |
| `date` | date | |
| `shift_id` | string (FK, nullable) | null = libur |
| `source` | enum | `pattern`, `rotation`, `manual` |

**Indeks:** `(employee_id, date)` unik.

### 2.3 `attendance_records`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `att_...` |
| `employee_id` | string (FK) | |
| `branch_id` | string (FK) | |
| `date` | date | |
| `clock_in` / `clock_out` | timestamp (nullable) | |
| `source` | enum | `mobile`, `web`, `machine`, `kiosk`, `manual` |
| `in_lat` / `in_lng` | number (nullable) | Lokasi clock-in |
| `photo_ref` | string (nullable) | Bukti |
| `status` | enum | `present`, `late`, `early_leave`, `overtime`, `absent`, `on_leave`, `holiday`, `day_off` |
| `late_minutes` | int | |
| `overtime_minutes` | int | |
| `geofence_ok` | boolean | |

### 2.4 `attendance_corrections`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `record_id` | string (FK) | |
| `field` | string | Yang diubah (clock_in/out) |
| `old_value` / `new_value` | string | |
| `reason` | string | |
| `requested_by` / `approved_by` | string | Aktor |
| `status` | enum | `pending`, `approved`, `rejected` |

### 2.5 `overtime_requests`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `record_id` | string (FK) | |
| `employee_id` | string (FK) | |
| `hours` | number | Diminta |
| `approved_hours` | number (nullable) | Disetujui |
| `multiplier` | number | 1.5 / 2 / dst |
| `is_holiday` | boolean | Lembur hari libur |
| `status` | enum | `pending`, `approved`, `rejected` |
| `approved_by` | string (nullable) | |

### 2.6 `holidays`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string (FK) | |
| `branch_id` | string (FK, nullable) | null = semua cabang |
| `date` | date | |
| `name` | string | "Idul Fitri" |
| `type` | enum | `national`, `collective_leave`, `company` |
| `is_observed` | boolean | Untuk `collective_leave`: apakah tenant ikut libur (opt-out untuk swasta) |
| `overtime_multiplier` | number (nullable) | Multiplier bila ada yang bekerja di hari ini |

### 2.7 `attendance_rules` (config per tenant)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string (FK) | |
| `branch_id` | string (FK, nullable) | Aturan bisa per cabang |
| `working_days` | json | Hari kerja, mis. `["mon","tue","wed","thu","fri","sat"]` |
| `default_shift_id` | string (FK, nullable) | Shift default bila tanpa jadwal eksplisit |
| `late_tolerance_min` | int | Toleransi telat |
| `ot_threshold_min` | int | Ambang mulai lembur |
| `ot_rounding_min` | int | Pembulatan lembur |
| `ot_requires_approval` | boolean | |
| `geofence_enabled` | boolean | |
| `geofence_radius_m` | int | |

---

## 3. Catatan Desain

- **Status harian dihitung** dari clock vs schedule vs rules; disimpan agar rekap cepat.
- **Cek Leave sebelum alpha** — status `on_leave` diisi dari data modul Leave.
- **Rekap** (`GET /attendance/summary`) diagregasi dari `attendance_records` + `overtime_requests` untuk periode.
- **Config versioned bila perlu** — perubahan aturan tidak mengubah perhitungan periode lampau.
- Semua koreksi & approval tercatat (audit).
