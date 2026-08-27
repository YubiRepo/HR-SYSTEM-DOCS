# 04 · API Contract

Prefix `/api/v1/performance`. Envelope standar HRMS. Dijaga Entitlement (fitur `performance`) + RBAC (scope self/team/branch/tenant).

---

## Ringkasan Endpoint

### Framework & Goal
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/performance/frameworks` | Kerangka & kamus kompetensi | `performance:read` |
| POST | `/performance/frameworks` | Konfigurasi kerangka | `performance:config` |
| GET | `/performance/me/goals` | Goal sendiri | `performance:self` |
| POST | `/performance/goals` | Buat goal | `performance:self` / `performance:write` |
| PATCH | `/performance/goals/{id}` | Ubah/approve goal | `performance:write` |
| POST | `/performance/goals/{id}/progress` | Update progress/actual | `performance:self` |

### Review Cycle
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/performance/cycles` | Daftar siklus | `performance:read` |
| POST | `/performance/cycles` | Buat siklus | `performance:config` |
| POST | `/performance/cycles/{id}/open` | Buka siklus | `performance:config` |
| POST | `/performance/cycles/{id}/close` | Tutup siklus | `performance:config` |

### Penilaian
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/performance/me/reviews` | Review terkait diri (self/hasil) | `performance:self` |
| POST | `/performance/reviews/{id}/self` | Isi self-assessment | `performance:self` |
| POST | `/performance/reviews/{id}/manager` | Isi manager review | `performance:review` |
| GET | `/performance/reviews` | Daftar review (manajer/HR) | `performance:read` |

### 360 Feedback & Kalibrasi
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| POST | `/performance/reviews/{id}/feedback/request` | Minta 360 feedback | `performance:review` |
| POST | `/performance/feedback/{id}/submit` | Kirim 360 feedback | `performance:feedback` |
| POST | `/performance/cycles/{id}/calibrate` | Sesi kalibrasi (sesuaikan skor) | `performance:calibrate` |
| POST | `/performance/reviews/{id}/finalize` | Tetapkan rating akhir | `performance:review` |

---

## 1. POST /performance/goals
```json
{
  "type": "kpi",
  "title": "Penjualan Bulanan",
  "target": 100000000,
  "unit": "IDR",
  "weight": 40,
  "period": "2026-Q1"
}
```
**Response `201 Created`** → goal status `draft` (perlu approve manajer bila diatur).

---

## 2. POST /performance/reviews/{id}/self
```json
{
  "goal_scores": [{ "goal_id": "goal_...", "achievement": 85, "comment": "..." }],
  "competency_scores": [{ "code": "communication", "score": 4 }],
  "overall_comment": "..."
}
```
**Response `200 OK`** — self-assessment tersimpan.

---

## 3. POST /performance/reviews/{id}/manager
```json
{
  "goal_scores": [{ "goal_id": "goal_...", "score": 80, "comment": "..." }],
  "competency_scores": [{ "code": "communication", "score": 4 }],
  "proposed_rating": 4,
  "feedback": "..."
}
```
**Response `200 OK`** — manager review tersimpan; lanjut ke kalibrasi/final.

---

## 4. POST /performance/cycles/{id}/calibrate
```json
{
  "adjustments": [
    { "review_id": "rev_...", "from_rating": 5, "to_rating": 4, "reason": "normalisasi lintas tim" }
  ]
}
```
**Response `200 OK`** — penyesuaian tercatat (audit).

---

## 5. POST /performance/reviews/{id}/finalize
```json
{ "final_rating": 4, "note": "hasil kalibrasi" }
```
**Response `200 OK`** — rating dikunci. Bila kaitan bonus aktif → kirim ke Payroll (lihat `06-integration.md`).

---

## 6. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `FEATURE_NOT_IN_PLAN` | 403 | Tenant tak berlangganan fitur performance |
| `CYCLE_NOT_OPEN` | 409 | Siklus belum dibuka / sudah ditutup |
| `NOT_REVIEWER` | 409 | Bukan reviewer untuk karyawan ini |
| `SELF_REVIEW_PENDING` | 409 | Self-assessment belum diisi (bila diwajibkan) |
| `ALREADY_FINALIZED` | 409 | Rating sudah dikunci |
| `VALIDATION_ERROR` | 400/422 | Input tidak valid |
