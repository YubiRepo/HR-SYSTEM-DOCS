# 04 · API Contract

Mengikuti envelope standar HRMS (`success` + `data`/`error` + `meta`), prefix `/api/v1`. Semua endpoint memerlukan token & izin RBAC yang sesuai. Operasi menulis kritikal mendukung `Idempotency-Key`.

---

## Ringkasan Endpoint

### Employees
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/employees` | Daftar karyawan (filter/sort/search) | `employees:read` |
| POST | `/employees` | Tambah karyawan | `employees:write` |
| GET | `/employees/{id}` | Detail karyawan | `employees:read` |
| PATCH | `/employees/{id}` | Ubah sebagian data | `employees:write` |
| DELETE | `/employees/{id}` | Soft-delete / arsip | `employees:delete` |
| POST | `/employees/{id}/transition` | Ubah status lifecycle | `employees:write` |
| POST | `/employees/{id}/assignments` | Mutasi/promosi (assignment baru) | `employees:write` |
| GET | `/employees/{id}/assignments` | Daftar assignment (aktif+historis) | `employees:read` |
| POST | `/employees/{id}/offboarding` | Mulai proses keluar | `employees:write` |
| GET | `/employees/{id}/history` | Riwayat kepegawaian | `employees:read` |
| GET | `/employees/{id}/subordinates` | Daftar bawahan langsung | `employees:read` |
| GET | `/employees/{id}/documents` | Daftar dokumen | `employees:read` |
| POST | `/employees/{id}/documents` | Unggah dokumen | `employees:write` |
| GET | `/documents/{doc_id}` | Detail/unduh dokumen | `employees:read` |
| DELETE | `/documents/{doc_id}` | Hapus dokumen | `employees:write` |

### Org Units
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/org-units` | Daftar unit | `org:read` |
| POST | `/org-units` | Buat unit | `org:write` |
| GET | `/org-units/{id}` | Detail unit + anak | `org:read` |
| PATCH | `/org-units/{id}` | Ubah unit | `org:write` |
| DELETE | `/org-units/{id}` | Hapus/nonaktifkan unit | `org:write` |
| GET | `/org-units/{id}/employees` | Karyawan dalam unit | `employees:read` |
| GET | `/org-chart` | Struktur organisasi utuh | `org:read` |

### Positions
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/positions` | Daftar posisi | `org:read` |
| POST | `/positions` | Buat posisi | `org:write` |
| GET | `/positions/{id}` | Detail posisi | `org:read` |
| PATCH | `/positions/{id}` | Ubah posisi | `org:write` |
| DELETE | `/positions/{id}` | Hapus/nonaktifkan posisi | `org:write` |

### Katalog (tenant-level, dipakai lintas cabang)
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/catalog/job-grades` | Daftar job grade | `org:read` |
| POST | `/catalog/job-grades` | Buat job grade | `catalog:write` |
| GET | `/catalog/position-templates` | Daftar position template | `org:read` |
| POST | `/catalog/position-templates` | Buat template | `catalog:write` |
| GET | `/catalog/division-types` | Daftar jenis divisi | `org:read` |
| POST | `/catalog/division-types` | Buat jenis divisi | `catalog:write` |
| POST | `/catalog/promote` | Promosikan item cabang → katalog | `catalog:write` |

> **Konteks cabang:** endpoint org & karyawan discope otomatis ke cabang aktif dari konteks aktor. Branch admin (cakupan `branch`) hanya melihat/mengubah cabangnya; tenant admin (cakupan `tenant`) dapat memilih cabang via `?branch_id=` atau melihat semua. Endpoint `catalog:*` hanya untuk cakupan `tenant`.

### Bulk & Export
| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| POST | `/employees/import` | Impor massal (async, dry-run + commit) | `employees:write` |
| GET | `/employees/import/template` | Unduh template impor | `employees:read` |
| POST | `/employees/invitations/send` | Kirim undangan aktivasi (batch) | `employees:write` |
| GET | `/employees/export` | Ekspor daftar karyawan | `employees:read` |

---

## 1. POST /employees

**Request**
```json
{
  "full_name": "Budi Santoso",
  "national_id": "3175xxxxxxxxxxxx",
  "email": "budi@example.com",
  "hire_date": "2026-09-01",
  "employment_type": "permanent",
  "org_unit_id": "org_01H8...",
  "position_id": "pos_01H8...",
  "manager_id": "emp_01H8...",
  "create_account": true,
  "link_user_id": null
}
```

**Perilaku akun (Pola A):**
- `create_account: true` (default) → buat akun user di Auth, tautkan, kirim undangan aktivasi.
- `create_account: false` → hanya buat record karyawan tanpa akun (mis. pekerja harian).
- `link_user_id: "usr_..."` → tautkan ke akun yang sudah ada (mis. konversi kandidat), tidak membuat akun baru.

**Response `201 Created`**
```json
{
  "success": true,
  "data": {
    "id": "emp_01H8...",
    "full_name": "Budi Santoso",
    "status": "probation",
    "hire_date": "2026-09-01",
    "org_unit_id": "org_01H8...",
    "position_id": "pos_01H8...",
    "manager_id": "emp_01H8...",
    "user_id": "usr_01H8...",
    "account": { "created": true, "status": "pending", "invite_sent": true },
    "created_at": "2026-08-09T08:30:00Z"
  }
}
```
**Error:** `409 EMPLOYEE_ALREADY_EXISTS`, `422 INVALID_ORG_UNIT`, `409 EMAIL_ALREADY_HAS_ACCOUNT`.

---

## 2. GET /employees (list)

Parameter standar HRMS: `page`, `per_page`, `sort`, `search`, `filter[status]`, `filter[org_unit_id]`, `filter[employment_type]`.

**Contoh:** `GET /employees?filter[status]=active&filter[org_unit_id]=org_01H8...&sort=full_name`

Respons memakai envelope koleksi + `pagination`.

---

## 3. PATCH /employees/`{id}`

**Request** — hanya field yang diubah.
```json
{ "email": "budi.s@example.com", "manager_id": "emp_09H8..." }
```
**Response `200 OK`** — data terbaru. Perubahan pada field ber-riwayat (unit/posisi) dilakukan lewat `/assignments`, bukan di sini.

---

## 4. DELETE /employees/`{id}`

Soft-delete: menandai karyawan sebagai diarsipkan (tidak menghapus fisik, demi kepatuhan & riwayat).

**Response `204 No Content`.**
**Error:** `409 EMPLOYEE_ACTIVE` bila masih berstatus aktif (harus offboarding dulu).

---

## 5. POST /employees/{id}/transition

Mengubah status lifecycle (lihat `03-employee-lifecycle.md`).

**Request**
```json
{ "to_status": "active", "effective_date": "2026-12-01", "reason": "Lulus masa percobaan" }
```
**Response `200 OK`** — status diperbarui & dicatat di riwayat.
**Error:** `422 INVALID_TRANSITION`.

---

## 6. POST /employees/{id}/assignments

Mutasi/promosi — membuat assignment baru & menutup yang lama.

**Request**
```json
{
  "org_unit_id": "org_02H8...",
  "position_id": "pos_02H8...",
  "effective_date": "2027-01-01",
  "type": "promotion"
}
```
**Response `201 Created`** — assignment baru aktif; assignment lama ditutup (end_date = sehari sebelum efektif).

---

## 7. POST /employees/{id}/offboarding

Memulai proses keluar (resign/terminate → offboarded).

**Request**
```json
{
  "type": "resigned",
  "last_working_date": "2027-02-28",
  "reason": "Pindah perusahaan",
  "revoke_access": true
}
```
**Response `202 Accepted`** — proses berjalan: tutup assignment, nonaktifkan akun (bila `revoke_access`), set tanggal keluar. Dapat memicu job async & webhook `employee.offboarded`.

---

## 8. GET /employees/{id}/history

**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "assignments": [
      { "org_unit": "Tim AP", "position": "Staff Finance", "from": "2026-09-01", "to": "2026-12-31" },
      { "org_unit": "Tim AR", "position": "Senior Staff", "from": "2027-01-01", "to": null }
    ],
    "status_changes": [
      { "status": "probation", "from": "2026-09-01" },
      { "status": "active", "from": "2026-12-01" }
    ]
  }
}
```

---

## 9. GET /employees/{id}/subordinates

Daftar bawahan langsung (berdasarkan `manager_id`). Tambahkan `?recursive=true` untuk seluruh sub-pohon.

**Response `200 OK`**
```json
{
  "success": true,
  "data": [
    { "id": "emp_0AH8...", "full_name": "Andi", "position": "Staff" },
    { "id": "emp_0BH8...", "full_name": "Sari", "position": "Staff" }
  ]
}
```

---

## 10. Dokumen Karyawan

**Daftar — `GET /employees/{id}/documents`**
```json
{
  "success": true,
  "data": [
    { "id": "doc_01H8...", "type": "contract", "file_name": "kontrak-2026.pdf", "uploaded_at": "2026-09-01T..." }
  ]
}
```

**Unggah — `POST /employees/{id}/documents`** (multipart atau referensi storage)
```json
{ "type": "contract", "file_name": "kontrak-2026.pdf", "file_ref": "storage://..." }
```
**Response `201 Created`.** Tipe: `contract`, `id_card`, `certificate`, `tax`, `other`.

**Hapus — `DELETE /documents/{doc_id}`** → `204 No Content`.

> Dokumen berisi data pribadi/sensitif — akses dibatasi RBAC & disimpan terenkripsi (UU PDP).

---

## 11. Org Units

**Buat — `POST /org-units`**
```json
{ "name": "Departemen Akuntansi", "parent_id": "org_00H8...", "type": "department", "head_employee_id": "emp_01H8..." }
```

**Detail — `GET /org-units/{id}`** → unit + anak langsung.
```json
{
  "success": true,
  "data": {
    "id": "org_01H8...",
    "name": "Departemen Akuntansi",
    "parent_id": "org_00H8...",
    "children": [
      { "id": "org_0AH8...", "name": "Tim AP" },
      { "id": "org_0BH8...", "name": "Tim AR" }
    ]
  }
}
```

**Ubah — `PATCH /org-units/{id}`** → ubah nama/parent/head.
**Hapus — `DELETE /org-units/{id}`** → `204`; **Error:** `409 ORG_UNIT_NOT_EMPTY` bila masih ada anak/karyawan.

**Karyawan di unit — `GET /org-units/{id}/employees`** → daftar (mendukung `?recursive=true`).

---

## 12. GET /org-chart

Struktur organisasi utuh (pohon) untuk visualisasi.

**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "id": "org_00H8...",
    "name": "Divisi Keuangan",
    "children": [
      {
        "id": "org_01H8...", "name": "Departemen Akuntansi",
        "children": [
          { "id": "org_0AH8...", "name": "Tim AP", "children": [] }
        ]
      }
    ]
  }
}
```
Parameter opsional: `?root=org_01H8...` (subtree), `?depth=2` (batasi kedalaman).

---

## 13. Positions

**Buat — `POST /positions`**
```json
{ "title": "Manager Akuntansi", "level": "manager", "org_unit_id": "org_01H8..." }
```
**Ubah — `PATCH /positions/{id}`**, **Hapus — `DELETE /positions/{id}`** (`204`; `409 POSITION_IN_USE` bila masih dipakai assignment aktif).

---

## 14. Bulk Import (Async)

Untuk migrasi/onboarding tenant baru yang sudah punya banyak data karyawan. Dirancang agar aman untuk ratusan–ribuan baris.

### 14.1 Template & Mapping
- **`GET /employees/import/template?format=xlsx`** → unduh template standar berisi kolom yang diharapkan.
- HR bisa memakai template itu, **atau** memakai file sendiri lalu memetakan kolom (`column_mapping`).

### 14.2 Alur Import (2 fase: validasi → commit)
```
1) Upload file → POST /employees/import  (dry_run: true)
        └─ validasi tiap baris, TIDAK menyimpan
        └─ balikan laporan: baris valid vs baris error (+alasan)
2) HR perbaiki baris error di file (bila ada)
3) Jalankan → POST /employees/import  (dry_run: false)
        └─ commit baris valid (async job)
        └─ baris gagal DILEWATI, dilaporkan (tidak rollback semua)
```

### 14.3 Request
```json
{
  "file_ref": "storage://uploads/employees.xlsx",
  "mode": "upsert",
  "dry_run": true,
  "column_mapping": { "Nama Lengkap": "full_name", "NIK": "national_id", "Divisi": "org_unit" },
  "auto_create_org_units": false,
  "create_accounts": true,
  "send_invites": false
}
```

| Field | Default | Fungsi |
|---|---|---|
| `mode` | `upsert` | `insert` (baru saja) / `upsert` (baru + update) |
| `dry_run` | `true` | Validasi tanpa simpan (fase 1) |
| `column_mapping` | — | Petakan kolom file → field (bila bukan template standar) |
| `auto_create_org_units` | `false` | **Strict** (default): unit harus sudah ada. `true` → buat unit yang belum ada otomatis |
| `create_accounts` | `true` | Buat akun (status `pending`) untuk tiap karyawan (Pola A) |
| `send_invites` | `false` | **Undangan tidak langsung dikirim**; HR memicunya belakangan |

> **Urutan entitas:** disarankan impor struktur (org unit/posisi) lebih dulu, lalu karyawan. Bila `auto_create_org_units: true`, unit yang belum ada dibuat saat impor (hati-hati typo → unit ganda).

> **Akun massal:** `create_accounts: true` membuat akun berstatus `pending`, tetapi `send_invites: false` menahan undangan. Ini mencegah ratusan email terkirim sebelum data final & sosialisasi. Undangan dikirim kemudian (lihat 14.5).

### 14.4 Response

**Fase validasi (`dry_run: true`) — `200 OK`**
```json
{
  "success": true,
  "data": {
    "total_rows": 500,
    "valid": 480,
    "invalid": 20,
    "errors": [
      { "row": 47, "field": "national_id", "issue": "duplikat" },
      { "row": 89, "field": "hire_date", "issue": "format tanggal salah" }
    ]
  }
}
```

**Fase commit (`dry_run: false`) — `202 Accepted`**
```json
{
  "success": true,
  "data": { "job_id": "job_01H8...", "status": "processing", "status_url": "/api/v1/jobs/job_01H8..." }
}
```

**Hasil job (partial success)** — via `status_url`:
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "processed": 500, "succeeded": 480, "failed": 20,
    "accounts_created": 480, "invites_sent": 0,
    "error_report_url": "/api/v1/jobs/job_01H8.../errors.csv"
  }
}
```
Baris yang sukses **di-commit**; yang gagal dikumpulkan di `error_report_url` untuk diperbaiki & diimpor ulang (hanya baris itu). Selesai → webhook `employees.import.completed`.

### 14.5 Kirim Undangan Setelah Import
**`POST /employees/invitations/send`** — memicu undangan aktivasi untuk akun `pending`, sekaligus atau per batch.
```json
{ "scope": "all_pending", "batch_size": 100 }
```
`scope`: `all_pending` | daftar `employee_ids`. Pengiriman aktual dilakukan modul Auth/Notification.

---

## 15. Export

**`GET /employees/export`** — mendukung `format=csv|xlsx`, filter sama seperti list, dan `template_compatible=true` agar hasil ekspor bisa **diedit massal lalu diimpor ulang** (round-trip).

- Data kecil → unduh langsung.
- Data besar → `202 Accepted` + `job_id`, unduh via `result_url` saat selesai.

**Kegunaan:** backup, laporan, dan edit massal (export → ubah di Excel → import kembali dengan `mode: upsert`).

---

## 16. Ringkasan Error Modul

| Code | HTTP | Arti |
|---|---|---|
| `EMPLOYEE_ALREADY_EXISTS` | 409 | national_id duplikat dalam tenant |
| `EMAIL_ALREADY_HAS_ACCOUNT` | 409 | Email sudah dipakai akun lain saat buat akun |
| `EMPLOYEE_ACTIVE` | 409 | Hapus/arsip ditolak; masih aktif |
| `INVALID_TRANSITION` | 422 | Transisi status tidak diizinkan |
| `INVALID_ORG_UNIT` | 422 | Unit tidak valid/aktif |
| `ORG_UNIT_NOT_EMPTY` | 409 | Unit masih punya anak/karyawan |
| `POSITION_IN_USE` | 409 | Posisi masih dipakai assignment aktif |
| `VALIDATION_ERROR` | 400/422 | Input tidak lolos validasi |
