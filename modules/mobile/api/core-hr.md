<!-- 📁 modules/mobile/api/core-hr.md -->
# Mobile API · Core HR

Endpoint Core HR untuk mobile: profil diri, update kontak, dokumen, wilayah, direktori, serta riwayat/work policy/kontrak diri. Prefix `/api/v1/core-hr`. Pengelolaan karyawan, katalog, dan master data tetap di web.

> Referensi lengkap: [`../../core-hr/04-api-contract.md`](../../core-hr/04-api-contract.md).

---

## 1. Profil Saya — `GET /core-hr/me/employee`
**Permission:** `employees:self` atau `employees:read`. Mengembalikan record karyawan lengkap milik user login, antara lain:
- identitas: `id`, `employee_number`, `full_name`, `email`, `phone`, `address`, `emergency_contact`
- penempatan: `position_name`, `org_unit_name`, `branch_name`, `status`
- lainnya: `custom_fields`, `avatar_url`

`id` di sini adalah **employee id** karyawan.

## 2. Perbarui Kontak — `PATCH /core-hr/me/employee`
**Permission:** `employees:self`. Hanya tiga field berikut yang diterima. Field lain, misalnya `national_id`, `npwp`, atau `bank_accounts`, ditolak dengan `400 VALIDATION`.
```json
{
  "phone": "0813xxxx",
  "address": { "line1": "Jl. Merdeka No. 10", "line2": "RT 01/RW 02", "region_code": "31.71.01.1001", "postal_code": "10110" },
  "emergency_contact": { "name": "Sari", "relationship": "<kode family_relationship>", "phone": "0812yyyy" }
}
```
- `address.region_code` adalah kode wilayah terdalam yang dipilih (kelurahan/desa) dari §4. Objek `address` diganti utuh.
- `emergency_contact.relationship` memakai common code `family_relationship`.
- Response `200` berisi profil terbaru. Perubahan langsung berlaku; approval HR untuk perubahan kontak belum ada.

## 3. Dokumen Saya — `GET /core-hr/me/documents` · `GET /core-hr/me/documents/{doc_id}`
**Permission:** `employees:self` atau `employees:read`.
```json
{ "success": true, "data": [ { "id": "…", "type": "contract", "type_name": "Contract", "file_name": "Kontrak_2024.pdf", "file_url": "https://…", "uploaded_at": "…" } ] }
```
`type` adalah common code `document_type`; tampilkan `type_name` sebagai label. `file_url` adalah link unduh sementara. Dokumen milik orang lain mengembalikan `404`. Upload dokumen tetap dilakukan HR lewat web.

## 4. Wilayah — `GET /core-hr/regions/*`
**Permission:** cukup login. Untuk dropdown berjenjang.
```
GET /core-hr/regions/provinces
GET /core-hr/regions/cities?province=31
GET /core-hr/regions/districts?city=31.71
GET /core-hr/regions/villages?district=31.71.01
```
```json
{ "success": true, "data": [ { "code": "31.71", "name": "Jakarta Pusat" } ] }
```

## 5. Direktori — `GET /core-hr/directory?search=sari&page=1&per_page=20`
**Permission:** `employees:directory`. Role `employee` memilikinya secara default; tenant bisa mencabutnya per role.
```json
{
  "success": true,
  "data": [
    { "id": "…", "full_name": "Sari", "employee_number": "1044", "email": "sari@example.com", "position_name": "HR Officer", "org_unit_name": "HR", "branch_name": "Jakarta", "avatar_url": "…" }
  ],
  "pagination": { "page": 1, "per_page": 20, "total_items": 1, "total_pages": 1 }
}
```
Hanya karyawan aktif yang ditampilkan, dengan `per_page` maksimal 50. Data pribadi (NIK, alamat, kontak pribadi) tidak pernah muncul di sini.

## 6. Riwayat, Work Policy & Kontrak Saya
**Permission:** `employees:self` atau `employees:read`. Read-only, selalu untuk karyawan milik user login (tanpa `{id}`).

- `GET /core-hr/me/history` — bentuk sama dengan `GET /employees/{id}/history` (`assignments`; riwayat status ada di `employee_status` tiap entri). Tiap assignment juga membawa `branch_name`, `org_unit_name`, `position_name` (opsional; kosong bila lookup gagal), karena karyawan tidak punya izin memanggil endpoint lookup branch/org unit/posisi.
- `GET /core-hr/me/work-policies` — bentuk sama dengan `GET /employees/{id}/work-policies`, plus `pattern_name` (opsional) untuk nama schedule pattern dari modul attendance.
- `GET /core-hr/me/contracts?status=&type=&page=1&per_page=20` — bentuk dan filter sama dengan `GET /employees/{id}/contracts` (paginated, `type_name` sebagai label).

---

## Catatan Mobile
- Registrasi karyawan, kelola org/katalog, dan master data tetap di web.
- Foto profil akun memakai `POST /auth/me/avatar/presign` → `/confirm`.
