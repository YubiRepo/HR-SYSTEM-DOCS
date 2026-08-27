# 05 · Data Model

Entitas milik modul Performance. `employees` dirujuk dari Core HR.

---

## 1. Diagram Relasi

```
  frameworks (config) ── competency_dictionary
  review_cycles ──< reviews >── employees (Core HR)
  goals >── employees
  reviews ──< review_scores
  reviews ──< feedback_360
  reviews ──1 rating (final)
  calibration_log
```

---

## 2. Entitas

### 2.1 `frameworks` (config, tenant)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string (FK) | |
| `types` | json | Aktif: `["kpi","competency"]` dll |
| `rating_scale` | json | mis. 1–5 + label |
| `score_formula` | string | Rumus skor total (bobot) |

### 2.2 `competency_dictionary`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string (FK) | |
| `code` / `name` | string | `communication`, dll |
| `applies_to` | json (nullable) | Level/jabatan tertentu |

### 2.3 `goals`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `goal_...` |
| `employee_id` | string (FK) | |
| `type` | enum | `kpi` / `okr` / `competency` |
| `title` | string | |
| `target` | number (nullable) | Untuk KPI |
| `key_results` | json (nullable) | Untuk OKR |
| `weight` | number | Bobot |
| `unit` | string (nullable) | |
| `actual` | number (nullable) | Pencapaian |
| `period` | string | mis. `2026-Q1` |
| `parent_goal_id` | string (FK, nullable) | Cascade OKR |
| `status` | enum | `draft`/`active`/`achieved`/`missed` |

### 2.4 `review_cycles`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `cycle_...` |
| `tenant_id` | string (FK) | |
| `name` | string | "Q1 2026" |
| `framework_id` | string (FK) | |
| `stages` | json | mis. `["self","manager","calibration"]` |
| `window_from` / `window_to` | date | Masa pengisian |
| `status` | enum | `draft`/`open`/`in_review`/`calibration`/`closed` |

### 2.5 `reviews`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `rev_...` |
| `cycle_id` | string (FK) | |
| `employee_id` | string (FK) | Yang dinilai |
| `reviewer_id` | string (FK, nullable) | Manajer penilai |
| `branch_id` | string (FK) | |
| `self_done` / `manager_done` | boolean | Progress tahap |
| `final_rating` | number (nullable) | Setelah final |
| `status` | enum | `pending`/`self`/`manager`/`calibrated`/`finalized` |

### 2.6 `review_scores`
Skor detail per goal/kompetensi (dari self & manager).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `review_id` | string (FK) | |
| `source` | enum | `self` / `manager` |
| `item_type` | enum | `goal` / `competency` |
| `item_ref` | string | goal_id / competency code |
| `score` | number | |
| `comment` | text | |

### 2.7 `feedback_360`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `review_id` | string (FK) | |
| `respondent_id` | string (FK, nullable) | null bila anonim |
| `relation` | enum | `peer`/`subordinate`/`manager` |
| `responses` | json | Skala + naratif |
| `is_anonymous` | boolean | |

### 2.8 `calibration_log`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `cycle_id` | string (FK) | |
| `review_id` | string (FK) | |
| `from_rating` / `to_rating` | number | |
| `reason` | text | |
| `actor_id` | string | |
| `created_at` | timestamp | |

---

## 3. Catatan Desain

- **Framework versioned** — perubahan kerangka tak mengubah siklus lampau.
- **Self & manager terpisah** di `review_scores` (`source`) — bisa dibandingkan.
- **360 bisa anonim** — `respondent_id` null; tetap simpan `relation` untuk konteks.
- **Kalibrasi tercatat** — `calibration_log` menjaga transparansi (skor sebelum→sesudah).
- **Rating final dikunci** setelah `finalized` (auditable); kaitan bonus lihat `06-integration.md`.
- Semua data penilaian sensitif — akses ketat sesuai scope RBAC.
