# 04 · API Contract

Endpoint manajemen peran, permission, dan penetapan ke user. Mengikuti envelope standar HRMS (`success` + `data`/`error` + `meta`), prefix `/api/v1/rbac`. Operasi administratif memerlukan izin `roles:*` / `roles:manage`. Semua perubahan dicatat di audit.

---

## Ringkasan Endpoint

### Roles
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/rbac/roles` | Daftar peran dalam tenant | `roles:read` |
| POST | `/rbac/roles` | Buat peran kustom | `roles:write` |
| GET | `/rbac/roles/{id}` | Detail peran + permission-nya | `roles:read` |
| PATCH | `/rbac/roles/{id}` | Ubah peran (nama/permission) | `roles:write` |
| DELETE | `/rbac/roles/{id}` | Hapus peran kustom (non-sistem) | `roles:write` |
| POST | `/rbac/roles/{id}/permissions` | Tambah permission ke peran | `roles:write` |
| DELETE | `/rbac/roles/{id}/permissions/{key}` | Cabut permission dari peran | `roles:write` |
| GET | `/rbac/roles/{id}/users` | User yang memegang peran ini | `roles:read` |

### Permissions
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/rbac/permissions` | Katalog permission tersedia | `roles:read` |

### User ↔ Roles
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/rbac/users/{user_id}/roles` | Peran yang dimiliki user | `roles:read` |
| POST | `/rbac/users/{user_id}/roles` | Tetapkan satu/banyak peran | `roles:assign` |
| DELETE | `/rbac/users/{user_id}/roles/{role_id}` | Cabut satu peran | `roles:assign` |
| PUT | `/rbac/users/{user_id}/roles` | Ganti seluruh set peran | `roles:assign` |
| GET | `/rbac/users/{user_id}/permissions` | Izin efektif (union) user | `roles:read` |

### Bulk
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| POST | `/rbac/assignments/bulk` | Assign/revoke peran massal | `roles:assign` |

---

## 1. POST /rbac/roles

**Request**
```json
{
  "name": "recruiter",
  "description": "Akses modul rekrutmen",
  "permissions": ["recruitment:read", "recruitment:write", "candidate:manage"]
}
```
**Response `201 Created`**
```json
{
  "success": true,
  "data": {
    "id": "role_01H8...",
    "name": "recruiter",
    "is_system": false,
    "permissions": ["recruitment:read", "recruitment:write", "candidate:manage"]
  }
}
```
**Error:** `409 ROLE_ALREADY_EXISTS`, `400 INVALID_PERMISSION`.

---

## 2. `PATCH /rbac/roles/{id}`

Mengganti atribut peran. Untuk mengganti seluruh daftar permission sekaligus, kirim `permissions`.

**Request**
```json
{ "description": "Akses rekrutmen (revisi)", "permissions": ["recruitment:read", "recruitment:write"] }
```
**Response `200 OK`** — peran diperbarui.
**Error:** `403 SYSTEM_ROLE_IMMUTABLE` bila peran sistem (`is_system = true`).

---

## 3. `DELETE /rbac/roles/{id}`

**Response `204 No Content`.**
**Error:**
- `403 SYSTEM_ROLE_IMMUTABLE` — peran sistem tak bisa dihapus.
- `409 ROLE_IN_USE` — masih dipegang user; cabut dulu atau pakai `?force=true` untuk melepas dari semua user.

> Sebelum hapus, gunakan `GET /rbac/roles/{id}/users` untuk melihat dampak.

---

## 4. Attach/Detach Permission per Peran

Alternatif granular selain PATCH (menambah/mencabut satu permission tanpa mengirim ulang seluruh daftar).

**Tambah — `POST /rbac/roles/{id}/permissions`**
```json
{ "permissions": ["performance:review"] }
```
**Cabut — `DELETE /rbac/roles/{id}/permissions/{key}`**
`DELETE /rbac/roles/role_01H8.../permissions/performance:review` → `204`.

**Error:** `400 INVALID_PERMISSION`, `403 SYSTEM_ROLE_IMMUTABLE`.

---

## 5. `GET /rbac/roles/{id}/users`

User yang memegang peran ini (untuk analisis dampak sebelum ubah/hapus). Mendukung pagination.

**Response `200 OK`**
```json
{
  "success": true,
  "data": [
    { "user_id": "usr_01H8...", "assigned_at": "2026-09-01T..." },
    { "user_id": "usr_02H8...", "assigned_at": "2026-10-15T..." }
  ],
  "pagination": { "page": 1, "per_page": 20, "total_items": 2, "total_pages": 1 }
}
```

---

## 6. GET /rbac/permissions

Katalog permission yang tersedia (global). Mendukung `?search=` dan `filter[resource]=`.

**Response `200 OK`**
```json
{
  "success": true,
  "data": [
    { "key": "employees:read", "resource": "employees", "action": "read", "description": "Melihat data karyawan" },
    { "key": "payroll:run", "resource": "payroll", "action": "run", "description": "Menjalankan payroll" }
  ]
}
```

> Katalog permission dikelola di level sistem (di-seed), bukan dibuat bebas per tenant, agar konsisten lintas modul.

---

## 7. `GET /rbac/users/{user_id}/roles`

**Response `200 OK`**
```json
{
  "success": true,
  "data": [
    { "role_id": "role_01H8...", "name": "hr_admin", "assigned_at": "2026-09-01T..." },
    { "role_id": "role_02H8...", "name": "recruiter", "assigned_at": "2026-11-01T..." }
  ]
}
```

---

## 8. `POST /rbac/users/{user_id}/roles`

Menetapkan satu atau banyak peran (multi-role — bersifat menambah).

**Request**
```json
{ "role_ids": ["role_01H8...", "role_02H8..."] }
```
**Response `200 OK`** — daftar peran terbaru user. Perubahan berlaku pada penerbitan token berikutnya (atau setelah refresh). Dicatat di audit.
**Error:** `404 ROLE_NOT_FOUND`, `409 ROLE_ALREADY_ASSIGNED` (opsional; atau idempoten diabaikan).

---

## 9. `PUT /rbac/users/{user_id}/roles`

Mengganti **seluruh** set peran user (menimpa). Berguna untuk sinkronisasi.

**Request**
```json
{ "role_ids": ["role_01H8..."] }
```
**Response `200 OK`** — set peran user kini persis seperti yang dikirim (peran lain dicabut).

---

## 10. `DELETE /rbac/users/{user_id}/roles/{role_id}`

Mencabut satu peran dari user.
**Response `204 No Content`.**
**Error:** `404 ASSIGNMENT_NOT_FOUND`.

> Untuk efek instan (tanpa menunggu token berikutnya), padukan dengan revocation token di modul Auth.

---

## 11. `GET /rbac/users/{user_id}/permissions`

Izin efektif = union permission dari seluruh peran user.

**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "roles": ["hr_admin", "recruiter"],
    "effective_permissions": ["employees:*", "leave:*", "recruitment:read", "recruitment:write"]
  }
}
```

---

## 12. POST /rbac/assignments/bulk

Assign/revoke peran untuk banyak user sekaligus (mis. onboarding massal, reorganisasi).

**Request**
```json
{
  "operation": "assign",
  "role_id": "role_01H8...",
  "user_ids": ["usr_01H8...", "usr_02H8...", "usr_03H8..."]
}
```
- `operation`: `assign` | `revoke`.
- **Response `200 OK`** untuk batch kecil (ringkasan sukses/gagal per user), atau `202 Accepted` + `job_id` untuk batch besar.

```json
{
  "success": true,
  "data": { "processed": 3, "succeeded": 3, "failed": 0, "results": [] }
}
```

---

## 13. Ringkasan Error Modul

| Code | HTTP | Arti |
|---|---|---|
| `ROLE_ALREADY_EXISTS` | 409 | Nama peran sudah ada dalam tenant |
| `ROLE_NOT_FOUND` | 404 | Peran tidak ditemukan |
| `SYSTEM_ROLE_IMMUTABLE` | 403 | Peran sistem tak bisa diubah/dihapus |
| `ROLE_IN_USE` | 409 | Peran masih dipegang user (hapus ditolak) |
| `INVALID_PERMISSION` | 400 | Permission key tidak dikenal |
| `ROLE_ALREADY_ASSIGNED` | 409 | User sudah punya peran ini |
| `ASSIGNMENT_NOT_FOUND` | 404 | Penetapan peran tidak ditemukan |
| `PERMISSION_DENIED` | 403 | Aktor tak berhak mengelola RBAC |
| `VALIDATION_ERROR` | 400/422 | Input tidak lolos validasi |

---

## 14. Catatan Propagasi

Perubahan peran/permission **tidak langsung** memengaruhi token yang sudah beredar. Efektif setelah token diterbitkan ulang atau di-refresh. Untuk efek instan, terapkan revocation token via modul Auth (lihat `06-integration.md`).
