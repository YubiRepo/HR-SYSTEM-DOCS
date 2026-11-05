<!-- 📁 modules/mobile/api/leave.md -->
# Mobile API · Leave

Endpoint Leave (cuti) untuk aplikasi mobile. Prefix `/api/v1/leave`, envelope standar, Bearer token. Dijaga entitlement `leave` dan RBAC.

> Referensi lengkap: [`../../leave/05-api-contract.md`](../../leave/05-api-contract.md).

---

## 1. Jenis Cuti — `GET /leave/types`
**Permission:** `leave:self`. Isi dropdown jenis cuti. Field `requires_document` menandai jenis cuti yang wajib lampiran.

## 2. Saldo Saya — `GET /leave/me/balance` · `GET /leave/me/balance/preview`
**Permission:** `leave:self`.
```json
{
  "success": true,
  "data": [
    { "type_code": "annual", "period": "2026", "accrual": "yearly", "quota": 12, "accrued": 12, "used": 4, "pending": 3, "carried_in": 0, "balance": 5 },
    { "type_code": "sick", "quota": null, "used": 2, "pending": 0, "balance": null }
  ]
}
```
`quota: null` berarti jenis cuti tanpa kuota.

## 3. Upload Lampiran — `POST /leave/me/attachments/presign`
**Permission:** `leave:self`. Alurnya tiga langkah:
1. Minta URL upload:
   ```json
   { "content_type": "application/pdf" }
   ```
   Response:
   ```json
   { "success": true, "data": { "presign_url": "https://…", "key": "pending/leave-attachments/<tenant>/<employee>/<uuid>.pdf", "expires_in": 900 } }
   ```
2. `PUT` file langsung ke `presign_url` dengan header `Content-Type` yang sama.
3. Kirim `key` sebagai `document_ref` di §4.

Format yang didukung: jpg, png, webp, pdf. Saat ajuan dikirim, server mengecek bahwa upload benar ada dan milik karyawan tersebut, lalu memindahkannya ke lokasi permanen.

## 4. Ajukan Cuti — `POST /leave/requests`
**Permission:** `leave:self`. Untuk caller self-service, `employee_id` selalu diisi server dari login.
```json
{
  "type_code": "annual",
  "date_from": "2026-09-10",
  "date_to": "2026-09-12",
  "half_day": false,
  "reason": "keperluan keluarga",
  "document_ref": null
}
```
Response `201`:
```json
{ "success": true, "data": { "id": "…", "days": 3, "status": "pending", "current_step": { "step": 1, "approver_role": "manager" } } }
```
**Error:** `422 INSUFFICIENT_BALANCE`, `422 NOT_ELIGIBLE`, `422 DOCUMENT_REQUIRED`, `409 DATE_CONFLICT`. `422 VALIDATION` muncul bila `document_ref` adalah upload milik orang lain atau file belum di-upload.

## 5. Riwayat Saya — `GET /leave/me/requests?status=pending`
**Permission:** `leave:self`. Bila ajuan punya lampiran hasil upload, response menyertakan `document_url`: link unduh sementara yang berlaku 15 menit.

## 6. Batalkan — `POST /leave/requests/{id}/cancel`
**Permission:** `leave:self` (hanya ajuan sendiri). Status menjadi `cancelled` dan saldo dikembalikan.

## 7. Approve / Reject — `POST /leave/requests/{id}/approve` · `/reject`
**Permission:** `leave:approve`. Body `{ "note": "…" }`.
- Approval berjalan multi-step sesuai approval flow jenis cuti.
- Step bertipe `manager` mengharuskan approver adalah atasan langsung (`manager_id`) pemohon.
- Bila masih ada step berikutnya, status tetap `pending` dengan `current_step` baru. Setelah step terakhir, status menjadi `approved`.

## 8. Kalender Cuti — `GET /leave/calendar?month=2026-09`
**Permission:** `leave:read`. Saat ini mengembalikan seluruh cuti tenant pada bulan itu; parameter `team` belum didukung.

> **Menyusul:** inbox "menunggu persetujuan saya" dan filter kalender per tim.
