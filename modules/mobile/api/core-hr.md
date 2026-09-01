<!-- 📁 modules/mobile/api/core-hr.md -->
# Mobile API · Core HR

Endpoint Core HR yang dipakai mobile — profil diri, dokumen, dan direktori ringan. Pengelolaan karyawan/katalog/master tetap di web.

> Referensi lengkap: [`../../core-hr/04-api-contract.md`](../../core-hr/04-api-contract.md).

---

## 1. Profil Saya — `GET /employees/me`
**Role:** karyawan.

```json
{
  "success": true,
  "data": {
    "id": "emp_budi",
    "full_name": "Budi Santoso",
    "employee_number": "1023",
    "position": "Software Engineer",
    "org_unit": "Divisi IT",
    "branch": "Jakarta",
    "hire_date": "2024-03-01",
    "email": "budi@example.com",
    "phone": "0812xxxx",
    "custom_fields": { "ukuran_seragam": "L" }
  }
}
```

---

## 2. Perbarui Data Kontak — `PATCH /employees/me`
**Role:** karyawan. Terbatas ke field yang boleh diubah sendiri (kontak, alamat, kontak darurat).

**Request**
```json
{
  "phone": "0813xxxx",
  "address": {
    "province_code": "31", "city_code": "31.71",
    "district_code": "31.71.01", "village_code": "31.71.01.1001",
    "street": "Jl. Merdeka No. 10"
  },
  "emergency_contact": { "name": "Sari", "phone": "0812yyyy", "relation": "istri" }
}
```
**Response `200`** — sebagian perubahan mungkin butuh persetujuan HR (configurable).
> Field sensitif (NIK, NPWP, gaji) **tidak** dapat diubah sendiri.

---

## 3. Dokumen Saya — `GET /employees/me/documents`
**Role:** karyawan.

```json
{
  "success": true,
  "data": [
    { "id": "doc_...", "type": "contract", "file_name": "Kontrak_2024.pdf" }
  ]
}
```

---

## 4. Wilayah (untuk form alamat) — `GET /regions/*`
**Role:** semua (auth). Dropdown berjenjang.

```
GET /regions/provinces
GET /regions/cities?province=31
GET /regions/districts?city=31.71
GET /regions/villages?district=31.71.01
```
```json
{ "success": true, "data": [ { "code": "31.71", "name": "Jakarta Pusat" } ] }
```

---

## 5. Direktori Karyawan (ringan) — `GET /employees?scope=directory`
**Role:** karyawan (bila diizinkan). Cari rekan (nama, posisi, kontak kerja).

`GET /employees?scope=directory&search=sari`
```json
{
  "success": true,
  "data": [
    { "id": "emp_sari", "name": "Sari", "position": "HR Officer", "email": "sari@example.com" }
  ]
}
```
> Direktori hanya menampilkan info non-sensitif; ketersediaan diatur kebijakan tenant.

---

## Catatan Mobile
- **Register karyawan, kelola org/katalog, master data** tetap di web.
- Mobile fokus: lihat/ubah profil sendiri, dokumen, cari rekan.
- Alamat memakai referensi wilayah (`regions`) — sama dengan web.
