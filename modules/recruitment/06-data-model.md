# 06 · Data Model

Entitas milik modul Recruitment. `positions`, `branches`, `employees` dirujuk dari Core HR.

---

## 1. Diagram Relasi

```
  job_postings >── positions/branches (Core HR)
  job_postings ──> pipelines ──< pipeline_stages
  candidates ──< applications >── job_postings
      applications ──< evaluations
      applications ──< stage_history
      applications ──1 offers
  applications ──(convert)──▶ employees (Core HR)
```

---

## 2. Entitas

### 2.1 `job_postings`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `job_...` |
| `tenant_id` / `branch_id` | string (FK) | Scope cabang |
| `position_id` | string (FK, nullable) | Rujuk posisi Core HR |
| `title` | string | |
| `headcount` | int | Jumlah dicari |
| `employment_type` | enum | `permanent`/`contract`/`intern`/`daily` |
| `description` / `requirements` | text | |
| `salary_min` / `salary_max` | int (nullable) | |
| `salary_hidden` | boolean | Sembunyikan rentang |
| `pipeline_id` | string (FK) | Pipeline dipakai |
| `status` | enum | `draft`/`open`/`on_hold`/`closed` |

### 2.2 `pipelines` & `pipeline_stages`
`pipelines`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `pipe_...` |
| `tenant_id` | string (FK) | |
| `name` | string | mis. "Teknis" |

`pipeline_stages`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `stage_...` |
| `pipeline_id` | string (FK) | |
| `name` | string | "Interview User" |
| `stage_order` | int | Urutan |
| `type` | enum | `screening`/`interview`/`test`/`offer`/`final` |
| `requires_evaluation` | boolean | Wajib rating sebelum lanjut |

### 2.3 `candidates`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `cand_...` |
| `tenant_id` | string (FK) | |
| `full_name` | string | |
| `email` / `phone` | string | |
| `resume_ref` | string (nullable) | CV |
| `source` | enum | `referral`/`job_board`/`career_page`/`walk_in`/`other` |
| `tags` | json | mis. `["talent_pool"]` |
| `user_id` | string (FK, nullable) | Bila kelak punya akun (portal) |

### 2.4 `applications`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `app_...` |
| `candidate_id` | string (FK) | |
| `job_posting_id` | string (FK) | |
| `current_stage_id` | string (FK) | Tahap sekarang |
| `status` | enum | `active`/`hired`/`rejected`/`withdrawn` |
| `converted_employee_id` | string (FK, nullable) | Bila sudah jadi karyawan |

**Indeks:** `(candidate_id, job_posting_id)` unik.

### 2.5 `stage_history`
Jejak perpindahan tahap (audit).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `application_id` | string (FK) | |
| `from_stage_id` / `to_stage_id` | string | |
| `decision` | enum | `advance`/`reject`/`revert` |
| `actor_id` | string | |
| `note` | string | |
| `created_at` | timestamp | |

### 2.6 `evaluations`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `application_id` | string (FK) | |
| `stage_id` | string (FK) | |
| `evaluator_id` | string | Pewawancara |
| `ratings` | json | Kriteria → nilai |
| `overall` | number | Nilai keseluruhan |
| `note` | text | |

### 2.7 `offers`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `offer_...` |
| `application_id` | string (FK) | |
| `salary_offer` | int | |
| `employment_type` | enum | |
| `start_date` | date | |
| `expiry_date` | date | |
| `status` | enum | `draft`/`sent`/`accepted`/`rejected`/`expired`/`negotiating` |

---

## 3. Catatan Desain

- **Candidate ≠ Application** — kandidat bisa punya banyak lamaran; data pelamar dipakai ulang (talent pool).
- **Pipeline reusable** — banyak lowongan memakai pipeline sama; beda posisi bisa beda pipeline.
- **Konversi meninggalkan jejak** — `converted_employee_id` menautkan ke karyawan Core HR; riwayat seleksi tetap tersimpan.
- **user_id disiapkan** — untuk portal kandidat nanti (kandidat login lihat status), tanpa mengubah struktur.
- **Privasi** — data kandidat sensitif; akses ter-scope, retensi diatur kebijakan (UU PDP).
