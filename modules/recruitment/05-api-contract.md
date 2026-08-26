# 05 · API Contract

Prefix `/api/v1/recruitment`. Envelope standar HRMS. Dijaga Entitlement (fitur `recruitment`) + RBAC (scope branch/tenant).

---

## Ringkasan Endpoint

### Lowongan
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/recruitment/jobs` | Daftar lowongan | `recruitment:read` |
| POST | `/recruitment/jobs` | Buat lowongan | `recruitment:write` |
| PATCH | `/recruitment/jobs/{id}` | Ubah lowongan | `recruitment:write` |
| POST | `/recruitment/jobs/{id}/publish` | Publikasikan | `recruitment:write` |
| POST | `/recruitment/jobs/{id}/close` | Tutup lowongan | `recruitment:write` |

### Kandidat & Lamaran
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/recruitment/candidates` | Daftar kandidat | `recruitment:read` |
| POST | `/recruitment/candidates` | Tambah kandidat | `recruitment:write` |
| POST | `/recruitment/jobs/{id}/apply` | Buat lamaran (kandidat → lowongan) | `recruitment:write` |
| GET | `/recruitment/applications` | Daftar lamaran (filter tahap/lowongan) | `recruitment:read` |
| GET | `/recruitment/applications/{id}` | Detail lamaran + riwayat | `recruitment:read` |

### Pipeline & Evaluasi
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/recruitment/pipelines` | Daftar pipeline | `recruitment:read` |
| POST | `/recruitment/pipelines` | Buat/ubah pipeline & tahap | `recruitment:config` |
| POST | `/recruitment/applications/{id}/move` | Pindah tahap (maju/tolak) | `recruitment:write` |
| POST | `/recruitment/applications/{id}/evaluate` | Beri evaluasi | `recruitment:evaluate` |

### Offer & Konversi
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| POST | `/recruitment/applications/{id}/offer` | Buat offer | `recruitment:write` |
| POST | `/recruitment/offers/{id}/send` | Kirim offer | `recruitment:write` |
| POST | `/recruitment/offers/{id}/respond` | Catat respons (accept/reject/nego) | `recruitment:write` |
| POST | `/recruitment/applications/{id}/convert` | Konversi → karyawan Core HR | `recruitment:hire` |

---

## 1. POST /recruitment/jobs
```json
{
  "title": "Software Engineer",
  "position_id": "pos_...",
  "branch_id": "branch_jkt",
  "headcount": 2,
  "employment_type": "permanent",
  "pipeline_id": "pipe_tech",
  "salary_range": { "min": 8000000, "max": 12000000, "hidden": true }
}
```
**Response `201 Created`** → status `draft`.

---

## 2. POST /recruitment/applications/{id}/move
```json
{ "to_stage_id": "stage_interview_user", "decision": "advance", "note": "lolos screening" }
```
`decision`: `advance` / `reject`. **Response `200 OK`** — tahap diperbarui, riwayat tercatat.
**Error:** `422 EVALUATION_REQUIRED` (bila tahap wajib evaluasi belum lengkap).

---

## 3. POST /recruitment/applications/{id}/evaluate
```json
{
  "stage_id": "stage_interview_user",
  "ratings": { "teknis": 4, "komunikasi": 5, "budaya": 3 },
  "overall": 4,
  "note": "kuat di backend"
}
```
**Response `201 Created`** — evaluasi tersimpan (pewawancara = aktor).

---

## 4. POST /recruitment/applications/{id}/offer
```json
{
  "salary_offer": 10000000,
  "employment_type": "permanent",
  "start_date": "2026-03-01",
  "expiry_date": "2026-02-20"
}
```
**Response `201 Created`** → offer status `draft`.

---

## 5. POST /recruitment/applications/{id}/convert
Mengonversi kandidat hired menjadi karyawan Core HR (Pola A).
```json
{
  "create_account": true,
  "join_date": "2026-03-01",
  "org_unit_id": "org_...",
  "grade_id": "grade_..."
}
```
**Response `201 Created`**
```json
{
  "success": true,
  "data": { "employee_id": "emp_new01", "application_status": "hired", "account_invited": true }
}
```
**Error:** `409 OFFER_NOT_ACCEPTED`, `409 ALREADY_CONVERTED`.

---

## 6. Ringkasan Error

| Code | HTTP | Arti |
|---|---|---|
| `FEATURE_NOT_IN_PLAN` | 403 | Tenant tak berlangganan fitur recruitment |
| `EVALUATION_REQUIRED` | 422 | Tahap butuh evaluasi sebelum lanjut |
| `OFFER_NOT_ACCEPTED` | 409 | Konversi sebelum offer diterima |
| `ALREADY_CONVERTED` | 409 | Kandidat sudah jadi karyawan |
| `INVALID_STAGE_MOVE` | 409 | Perpindahan tahap tidak valid |
| `VALIDATION_ERROR` | 400/422 | Input tidak valid |
