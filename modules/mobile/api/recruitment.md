<!-- 📁 modules/mobile/api/recruitment.md -->
# Mobile API · Recruitment

Endpoint Recruitment yang dipakai mobile — terbatas untuk manajer/pewawancara: lihat kandidat, beri evaluasi, approve offer. Bikin lowongan & kelola pipeline tetap di web.

> Referensi lengkap: [`../../recruitment/05-api-contract.md`](../../recruitment/05-api-contract.md).

---

## 1. Lamaran untuk Direview — `GET /recruitment/applications`
**Role:** manajer/pewawancara. Filter ke yang relevan untuk aktor.

`GET /recruitment/applications?stage=interview_user&assigned=me`
```json
{
  "success": true,
  "data": [
    { "id": "app_...", "candidate": "Budi", "job": "Software Engineer", "stage": "Interview User", "scheduled_at": "2026-09-03T10:00:00+07:00" }
  ]
}
```

---

## 2. Detail Kandidat — `GET /recruitment/applications/{id}`
**Role:** manajer/pewawancara.

```json
{
  "success": true,
  "data": {
    "id": "app_...",
    "candidate": { "name": "Budi", "resume_ref": "file_..." },
    "job": "Software Engineer",
    "current_stage": "Interview User",
    "history": [ { "stage": "Screening", "decision": "advance" } ]
  }
}
```

---

## 3. Beri Evaluasi — `POST /recruitment/applications/{id}/evaluate`
**Role:** pewawancara.

**Request**
```json
{
  "stage_id": "stage_interview_user",
  "ratings": { "teknis": 4, "komunikasi": 5, "budaya": 3 },
  "overall": 4,
  "note": "kuat di backend"
}
```
**Response `201`** — evaluasi tersimpan (pewawancara = aktor).

---

## 4. Pindah Tahap — `POST /recruitment/applications/{id}/move`
**Role:** manajer/recruiter.

**Request**
```json
{ "to_stage_id": "stage_offer", "decision": "advance", "note": "lolos" }
```
`decision`: `advance` / `reject`. **Response `200`**.
**Error:** `422 EVALUATION_REQUIRED`.

---

## 5. Respons Offer — `POST /recruitment/offers/{id}/respond`
**Role:** manajer (mencatat keputusan) / approver.

**Request**
```json
{ "decision": "accepted", "note": "kandidat setuju" }
```
**Response `200`**.

---

## Catatan Mobile
- **Bikin lowongan, atur pipeline, konversi ke karyawan** tetap di web.
- Mobile fokus: review kandidat & evaluasi on-the-go, approve offer.
- CV dibuka via `resume_ref` (link/preview).
