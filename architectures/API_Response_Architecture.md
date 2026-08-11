# API Response Architecture
## HR Management System — REST

| | |
|---|---|
| **Dokumen** | API Response Architecture |
| **Versi** | 1.0 |
| **Gaya** | REST (JSON over HTTPS) |
| **Fokus** | Struktur & standar response API (bukan per modul) |

---

## 1. Prinsip Response

- **Konsisten** — semua endpoint memakai envelope yang sama, apapun modulnya.
- **Predictable** — konsumen tahu persis di mana mencari data, error, pagination, dan metadata.
- **Self-describing** — setiap response membawa metadata (request_id, timestamp) untuk tracing.
- **Versioned & stateless** — response tidak bergantung pada session server.

---

## 2. Request Headers Esensial

Header inti yang dikirim klien pada setiap request. **Wajib**: ✅ wajib · ⭕ kondisional · ➖ opsional.

| Header | Wajib | Contoh | Keterangan |
|---|---|---|---|
| `Authorization` | ✅ | `Bearer eyJhbGci...` | Token akses (JWT / OAuth 2.0) |
| `Content-Type` | ⭕ | `application/json` | Wajib bila ada request body |
| `Accept` | ➖ | `application/json` | Format response yang diinginkan |
| `Accept-Language` | ➖ | `id-ID, en;q=0.8` | Preferensi bahasa (i18n) |
| `Idempotency-Key` | ⭕ | `idem_01H8X9...` | Cegah duplikasi pada POST kritikal |
| `X-Request-Id` | ➖ | `req_9f2a...` | ID unik request untuk tracing & korelasi log |

**Contoh request:**
```http
POST /api/v1/resources HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
Accept-Language: id-ID
Idempotency-Key: idem_01H8X9Q2
X-Request-Id: req_9f2a7c1b
```

> Aturan: selalu HTTPS; jangan kirim kredensial di query string; `X-Request-Id` selalu ada (dari klien atau digenerasi server) untuk debugging.

---

## 3. Anatomi Response (Envelope)

Setiap response dibungkus struktur yang seragam:

```
{
  success   → boolean status
  data      → payload utama (objek / array)
  pagination→ hanya untuk koleksi
  error     → hanya saat gagal
  meta      → metadata request (selalu ada)
}
```

---

## 4. Response Sukses — Objek Tunggal

```json
{
  "success": true,
  "data": {
    "id": "res_01H8X...",
    "type": "resource",
    "attributes": { }
  },
  "meta": {
    "request_id": "req_9f2a...",
    "timestamp": "2026-08-09T08:30:00Z"
  }
}
```

**HTTP:** `200 OK` (GET/PATCH/PUT) · `201 Created` (POST).

---

## 5. Response Sukses — Koleksi + Pagination

```json
{
  "success": true,
  "data": [
    { "id": "res_01H8X...", "type": "resource" }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 137,
    "total_pages": 7,
    "next": "/api/v1/resources?page=2&per_page=20",
    "prev": null
  },
  "meta": {
    "request_id": "req_9f2a...",
    "timestamp": "2026-08-09T08:30:00Z"
  }
}
```

- `data` **selalu array** untuk koleksi (bahkan jika kosong → `[]`).
- `pagination` hanya muncul pada response koleksi.

---

## 6. Response Error

Struktur seragam untuk semua kegagalan:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid.",
    "details": [
      { "field": "email", "issue": "Format email tidak valid." }
    ]
  },
  "meta": {
    "request_id": "req_9f2a...",
    "timestamp": "2026-08-09T08:30:00Z"
  }
}
```

- `code` — machine-readable (konsumen switch berdasar ini, bukan `message`).
- `message` — human-readable, ramah pengguna.
- `details` — daftar error per-field (opsional), berguna untuk form.

---

## 7. Response Async (Job)

Untuk operasi berat (payroll run, import massal) yang tidak selesai seketika:

```json
{
  "success": true,
  "data": {
    "job_id": "job_01H8...",
    "status": "processing",
    "status_url": "/api/v1/jobs/job_01H8..."
  }
}
```

**HTTP:** `202 Accepted`. Konsumen polling `status_url` atau menunggu webhook.

**Response status job:**
```json
{
  "success": true,
  "data": {
    "job_id": "job_01H8...",
    "status": "completed",
    "progress": 100,
    "result_url": "/api/v1/payrolls/2026-08"
  }
}
```
`status` ∈ `queued` · `processing` · `completed` · `failed`.

---

## 8. Peta Status Code

| Kode | Kondisi | `success` |
|---|---|---|
| `200 OK` | GET/PATCH/PUT berhasil | true |
| `201 Created` | Resource dibuat | true |
| `202 Accepted` | Diproses async | true |
| `204 No Content` | Berhasil tanpa body (DELETE) | — |
| `400 Bad Request` | Payload/format salah | false |
| `401 Unauthorized` | Token invalid/absen | false |
| `403 Forbidden` | Tidak berhak | false |
| `404 Not Found` | Resource tidak ada | false |
| `409 Conflict` | Bentrok state | false |
| `422 Unprocessable Entity` | Aturan bisnis dilanggar | false |
| `429 Too Many Requests` | Rate limit | false |
| `500 Internal Server Error` | Error server | false |

---

## 9. Katalog Error Code

Standar `code` di dalam objek `error` agar konsumen menangani secara programatik:

| Code | HTTP | Arti |
|---|---|---|
| `VALIDATION_ERROR` | 400/422 | Input tidak lolos validasi |
| `AUTHENTICATION_REQUIRED` | 401 | Token absen/expired |
| `PERMISSION_DENIED` | 403 | Role tidak mencukupi |
| `RESOURCE_NOT_FOUND` | 404 | Resource tidak ditemukan |
| `CONFLICT` | 409 | Bentrok state / duplikat |
| `BUSINESS_RULE_VIOLATION` | 422 | Melanggar aturan bisnis |
| `RATE_LIMIT_EXCEEDED` | 429 | Terlalu banyak request |
| `INTERNAL_ERROR` | 500 | Kesalahan server |

---

## 10. Metadata & Tracing

`meta` **selalu hadir** di setiap response (sukses maupun error):

| Field | Keterangan |
|---|---|
| `request_id` | ID unik request, untuk korelasi log & debugging |
| `timestamp` | Waktu response (ISO 8601, UTC) |
| `version` | (opsional) versi API yang melayani |

Response juga menyertakan header tracing:
```
X-Request-Id: req_9f2a...
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
```

---

## 11. Aturan Konsistensi (Wajib)

1. **Envelope selalu sama** — `success` + (`data` | `error`) + `meta`.
2. **`data` objek** untuk single, **array** untuk koleksi (jangan campur).
3. **Koleksi kosong = `[]`**, bukan `null`.
4. **Error selalu punya `code`** yang stabil & terdokumentasi.
5. **Timestamp selalu ISO 8601 UTC.**
6. **Field null** disertakan eksplisit (`"prev": null`), tidak dihilangkan.
7. **ID bertipe string** (prefixed, mis. `emp_`, `job_`) — tahan perubahan tipe.
8. **Pagination memakai pola sama** di seluruh endpoint koleksi.

---

## 12. Field Naming & Format

| Aturan | Contoh |
|---|---|
| **snake_case** untuk semua key | `full_name`, `created_at` |
| **Timestamp** ISO 8601 UTC | `2026-08-09T08:30:00Z` |
| **Tanggal** `YYYY-MM-DD` | `2026-09-01` |
| **Uang** integer minor unit + currency | `{ "amount": 10000000, "currency": "IDR" }` |
| **Boolean** eksplisit | `true` / `false` |
| **Enum** lowercase string | `"status": "active"` |

---

*Arsitektur response ini menjadi kontrak dasar: semua endpoint di seluruh modul HR wajib mengikuti struktur, status code, dan aturan konsistensi di atas.*
