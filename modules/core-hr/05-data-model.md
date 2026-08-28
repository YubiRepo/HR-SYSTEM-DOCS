# 05 · Data Model

Model data konseptual (stack-agnostic). Entitas `users` & `tenants` dimiliki modul Auth; di sini direferensikan.

---

## 1. Diagram Relasi

```
  tenants (Auth)
     │ 1
     │ N
  employees ──────< assignments >────── org_units
     │  │ 1                                 │ 1 (self ref via parent_id)
     │  │                                   │
     │  │ N                            positions
     │  └──< employment_history >
     │  └──< status_history >
     │
     └── user_id ─▶ users (Auth)
     └── manager_id ─▶ employees (self ref)
```

---

## 2. Entitas

### 2.1 `employees`

**Field standar (baku sistem)** — selalu ada di semua tenant:
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `emp_...` |
| `tenant_id` | string (FK) | Isolasi multi-tenant (batas utama) |
| `branch_id` | string (FK) | Cabang tempat karyawan berada (2-level tenancy) |
| `user_id` | string (FK, nullable) | Tautan ke akun Auth |
| `employee_number` | string | Nomor induk karyawan; unik per tenant (jembatan ke absensi, dll) |
| `full_name` | string | Nama lengkap |
| `national_id` | string | NIK; unik per tenant |
| `npwp` | string (nullable) | NPWP (pajak) |
| `email` | string | Email kerja |
| `phone` | string (nullable) | Telepon |
| `birth_date` | date (nullable) | Tanggal lahir |
| `gender` | enum (nullable) | `male` / `female` |
| `marital_status` | enum (nullable) | Untuk PTKP (lajang/kawin/…) |
| `address` | json (nullable) | Alamat terstruktur (lihat §2.9 wilayah) |
| `bank_account` | json (nullable) | Rekening (bank, no rek, nama) — untuk transfer gaji |
| `emergency_contact` | json (nullable) | Kontak darurat |
| `hire_date` | date | Tanggal bergabung |
| `employment_type` | enum | `permanent`, `contract`, `intern`, `outsource` |
| `status` | enum | `probation`, `active`, `on_leave`, `resigned`, `terminated`, `offboarded` |
| `manager_id` | string (FK, nullable) | Atasan (self-ref ke employees) |
| `current_org_unit_id` | string (FK) | Unit aktif (denormalisasi dari assignment) |
| `current_position_id` | string (FK) | Posisi aktif |
| `created_at` / `updated_at` | timestamp | |

**Constraint:** `UNIQUE(tenant_id, national_id)`, `UNIQUE(tenant_id, employee_number)`.

> Data sensitif (NIK, NPWP, rekening, alamat) tergolong pribadi (UU PDP) — akses dibatasi peran berizin; sebagian hanya terlihat HR/payroll.

### 2.1a Custom Fields (per Tenant)

Selain field standar, **tiap tenant dapat mendefinisikan field sendiri** untuk kebutuhan info karyawan yang khas (mis. "Nomor Anggota Koperasi", "Ukuran Seragam", "Golongan Darah"). Struktur:

**`employee_field_definitions`** (definisi field custom milik tenant)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string (FK) | |
| `key` | string | mis. `koperasi_no` |
| `label` | string | "Nomor Anggota Koperasi" |
| `type` | enum | `text`/`number`/`date`/`select`/`boolean` |
| `options` | json (nullable) | Untuk `select` |
| `required` | boolean | Wajib diisi |
| `section` | string (nullable) | Pengelompokan tampilan |

**`employee_field_values`** (nilai per karyawan)
| Field | Tipe | Keterangan |
|---|---|---|
| `employee_id` | string (FK) | |
| `field_id` | string (FK) | |
| `value` | json | Nilai sesuai tipe |

> Field standar = konsisten lintas tenant (dipakai modul lain seperti Payroll/Attendance). Custom field = fleksibel per tenant, tidak memengaruhi logika inti — murni informasi tambahan.

### 2.2 `org_units` (instance per cabang)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `org_...` |
| `tenant_id` | string (FK) | |
| `branch_id` | string (FK) | Cabang pemilik unit (instance) |
| `parent_id` | string (FK, nullable) | Unit induk (null = puncak) |
| `division_type_id` | string (FK, nullable) | Rujukan ke katalog jenis divisi (null bila di luar katalog) |
| `name` | string | Nama unit |
| `type` | enum | `division`, `department`, `team` (fleksibel) |
| `head_employee_id` | string (FK, nullable) | Pimpinan unit |
| `is_active` | boolean | |

### 2.3 `positions` (instance per cabang)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `pos_...` |
| `tenant_id` | string (FK) | |
| `branch_id` | string (FK) | Cabang pemilik posisi (instance) |
| `template_id` | string (FK, nullable) | Rujukan ke katalog position template (null bila di luar katalog) |
| `grade_id` | string (FK, nullable) | Rujukan ke katalog job grade |
| `title` | string | Nama jabatan |
| `org_unit_id` | string (FK, nullable) | Unit terkait |
| `headcount` | int | Kapasitas posisi di cabang ini |
| `is_active` | boolean | |

### 2.4 Katalog (tenant-level, dipakai lintas cabang)

**`job_grades`**
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `grade_...` |
| `tenant_id` | string (FK) | |
| `name` | string | mis. `Staff`, `Manager`, `VP` |
| `rank` | int | Urutan level |

**`position_templates`**
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `ptpl_...` |
| `tenant_id` | string (FK) | |
| `title` | string | mis. `Software Engineer` |
| `default_grade_id` | string (FK, nullable) | Grade default |

**`division_types`**
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `dtype_...` |
| `tenant_id` | string (FK) | |
| `name` | string | mis. `Finance`, `IT`, `Operasional` |

> Katalog milik tenant (tanpa `branch_id`). Instance (`org_units`, `positions`) merujuk ke katalog via `division_type_id` / `template_id` / `grade_id`. Item cabang di luar katalog boleh dibuat (rujukan null) dan dapat dipromosikan menjadi entri katalog.

### 2.5 `assignments`
Penempatan karyawan pada unit + posisi (aktif & historis).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `asg_...` |
| `employee_id` | string (FK) | |
| `org_unit_id` | string (FK) | |
| `position_id` | string (FK) | |
| `type` | enum | `initial`, `transfer`, `promotion`, `demotion` |
| `start_date` | date | Mulai berlaku |
| `end_date` | date (nullable) | Null = masih aktif |

> Assignment aktif = yang `end_date` null. Perubahan menutup yang lama & membuat baru.

### 2.6 `employment_history`
Riwayat kontrak/ikatan kerja.
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `employee_id` | string (FK) | |
| `employment_type` | enum | |
| `contract_start` / `contract_end` | date | |
| `note` | string | |

### 2.7 `status_history`
Jejak perubahan status lifecycle.
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `employee_id` | string (FK) | |
| `status` | enum | Status yang mulai berlaku |
| `effective_date` | date | |
| `reason` | string | |
| `changed_by` | string | Aktor |

### 2.8 `employee_documents`
Dokumen milik karyawan (kontrak, KTP, sertifikat).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `doc_...` |
| `employee_id` | string (FK) | |
| `type` | enum | `contract`, `id_card`, `certificate`, `tax`, `other` |
| `file_name` | string | Nama berkas |
| `file_ref` | string | Referensi storage (terenkripsi/akses terbatas) |
| `uploaded_by` | string | Aktor |
| `uploaded_at` | timestamp | |

### 2.9 `regions` (Referensi Wilayah Indonesia)

Data wilayah administratif Indonesia untuk alamat berjenjang (provinsi → kota/kabupaten → kecamatan → kelurahan/desa). **Data bawaan (seed)** dari sumber resmi, dan **dapat disinkron** dari API eksternal untuk pembaruan.

| Field | Tipe | Keterangan |
|---|---|---|
| `code` | string (PK) | Kode wilayah resmi (mis. `31.71.01.1001`) |
| `parent_code` | string (FK, nullable) | Wilayah induk (null untuk provinsi) |
| `level` | enum | `province`/`city`/`district`/`village` |
| `name` | string | Nama wilayah |
| `postal_code` | string (nullable) | Kode pos (pada level village) |

**Alamat karyawan** (`employees.address`) menyimpan referensi berjenjang:
```json
{
  "province_code": "31", "city_code": "31.71",
  "district_code": "31.71.01", "village_code": "31.71.01.1001",
  "street": "Jl. Merdeka No. 10", "rt_rw": "004/002", "postal_code": "10110"
}
```

- **Bawaan (seed):** sistem menyertakan snapshot data wilayah resmi (Kemendagri) saat provisioning.
- **Sync:** dapat diperbarui berkala dari API wilayah eksternal (pemekaran daerah, perubahan kode).
- Referensi bersifat **global** (dipakai semua tenant), bukan per tenant.

> Alamat berjenjang ini juga dipakai cabang (`branches.address`) dan modul lain yang butuh lokasi Indonesia.

---

## 3. Indeks yang Disarankan

| Tabel | Indeks | Alasan |
|---|---|---|
| `employees` | `(tenant_id, national_id)` unik | Keunikan & lookup |
| `employees` | `(tenant_id, status)` | Filter daftar karyawan |
| `employees` | `manager_id` | Query bawahan |
| `org_units` | `parent_id` | Traversal pohon |
| `assignments` | `(employee_id, end_date)` | Cari assignment aktif |
| `status_history` | `employee_id` | Riwayat status |

---

## 4. Catatan Desain

- **Denormalisasi terkontrol:** `current_org_unit_id` & `current_position_id` disimpan di `employees` untuk query cepat, tetapi kebenaran historis ada di `assignments`.
- **Self-reference:** `manager_id` & `org_units.parent_id` membentuk hierarki — hati-hati cegah siklus.
- **Tenancy 2 level:** `tenant_id` adalah batas isolasi utama; `branch_id` sub-pembeda cabang (sesuai [Tenancy Model](../../architecture/HRMS_Tenancy_Model.md) — final: A2 + B1 shared DB). Org unit & posisi juga membawa `branch_id`.
- **Kepatuhan:** `national_id` & data pribadi adalah data sensitif (UU PDP) — pertimbangkan enkripsi at-rest.
