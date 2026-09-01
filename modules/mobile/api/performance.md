<!-- 📁 modules/mobile/api/performance.md -->
# Mobile API · Performance

Endpoint Performance yang dipakai mobile — self-assessment & review tim. Setup framework/kalibrasi tetap di web.

> Referensi lengkap: [`../../performance/04-api-contract.md`](../../performance/04-api-contract.md).

---

## 1. Goal Saya — `GET /performance/me/goals`
**Role:** karyawan.

```json
{
  "success": true,
  "data": [
    { "id": "goal_...", "type": "kpi", "title": "Penjualan Bulanan", "target": 100000000, "actual": 85000000, "weight": 40, "status": "active" }
  ]
}
```

---

## 2. Update Progress Goal — `POST /performance/goals/{id}/progress`
**Role:** karyawan.

**Request**
```json
{ "actual": 90000000, "comment": "naik dari bulan lalu" }
```
**Response `200`** — progress tersimpan.

---

## 3. Review Saya (Self-assessment) — `GET /performance/me/reviews` · `POST /reviews/{id}/self`
**Role:** karyawan.

**Isi self-assessment:**
```json
{
  "goal_scores": [{ "goal_id": "goal_...", "achievement": 85, "comment": "..." }],
  "competency_scores": [{ "code": "communication", "score": 4 }],
  "overall_comment": "..."
}
```
**Response `200`** — tersimpan; lanjut ke tahap manajer.
**Error:** `409 CYCLE_NOT_OPEN`.

---

## 4. Manager Review — `POST /performance/reviews/{id}/manager`
**Role:** manajer.

**Request**
```json
{
  "goal_scores": [{ "goal_id": "goal_...", "score": 80, "comment": "..." }],
  "competency_scores": [{ "code": "communication", "score": 4 }],
  "proposed_rating": 4,
  "feedback": "..."
}
```
**Response `200`** — tersimpan.
**Error:** `409 NOT_REVIEWER`.

---

## 5. Kirim 360 Feedback — `POST /performance/feedback/{id}/submit`
**Role:** peer/bawahan (bila diminta).

**Request**
```json
{ "responses": { "kolaborasi": 4, "komunikasi": 5, "catatan": "..." } }
```
**Response `201`** — feedback tersimpan (bisa anonim sesuai konfigurasi siklus).

---

## Catatan Mobile
- **Kalibrasi & finalize rating** tetap di web (butuh layar lebar, sesi kalibrasi lintas tim).
- Mobile fokus: isi/lihat penilaian diri, review bawahan, kirim feedback saat diminta.
