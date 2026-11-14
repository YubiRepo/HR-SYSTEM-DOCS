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
     │  └──< mutation_requests >
     │  └──< contracts >──< contract_documents >
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
| `tax_identity_type` | enum (nullable) | `npwp` / `nik` (payroll P18; menggantikan kolom `npwp`) |
| `tax_identity_number` | string (nullable) | Digit saja. NIK: 16 digit & sama dengan `national_id`; NPWP: 16 digit (15 = format lama) |
| `tax_identity_status` | enum | `valid` / `unverified` (default). Nomor / jenis berubah → `unverified` |
| `tax_identity_verified_at`, `tax_identity_verified_by`, `tax_identity_note` | | Verifikasi manual HR terakhir (tanpa API DJP), dicatat juga di audit log |
| `email` | string | Email kerja |
| `phone` | string (nullable) | Telepon |
| `birth_date` | date (nullable) | Tanggal lahir |
| `gender` | enum (nullable) | `male` / `female` |
| `marital_status` | enum (nullable) | Untuk PTKP (lajang/kawin/…) |
| `address` | json (nullable) | `{line1, line2, region_code, postal_code}` — `region_code` string bebas, tidak tervalidasi (lihat §2.7 wilayah) |
| `bank_account` | json (nullable) | Rekening (bank, no rek, nama) — untuk transfer gaji |
| `emergency_contact` | json (nullable) | Kontak darurat |
| `hire_date` | date | Tanggal bergabung |
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

### 2.2 `org_units` (milik tenant — satu pohon organisasi per tenant, lihat `02-org-structure.md` §0)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `org_...` |
| `tenant_id` | string (FK) | |
| `parent_id` | string (FK, nullable) | Unit induk (null = puncak) |
| `name` | string | Nama unit |
| `type` | enum | `division`, `department`, `team` (fleksibel) |
| `head_employee_id` | string (FK, nullable) | Pimpinan unit |
| `is_active` | boolean | |

### 2.3 `positions` (milik tenant, sama seperti `org_units`)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `pos_...` |
| `tenant_id` | string (FK) | |
| `title` | string | Nama jabatan |
| `org_unit_id` | string (FK, nullable) | Unit terkait |
| `headcount` | int | Kapasitas posisi ini (tenant-wide), ≥ 1 (`chk_positions_headcount_min`). Ditegakkan saat penempatan — lihat `02-org-structure.md` §3.0 |
| `job_grade_id` | string (FK, nullable) | Grade jabatan → `job_grades`. Karyawan mewarisi grade dari posisinya |
| `is_active` | boolean | |

### 2.3a `job_grades` (milik tenant)
Tingkatan jabatan, lihat `02-org-structure.md` §3.1.

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string (FK) | |
| `code` | string | Unik per tenant (`uq_job_grades_tenant_code`), huruf besar |
| `name` | string | |
| `rank` | int | ≥ 0; makin besar makin senior |
| `is_active` | boolean | Tidak bisa `false` selama dipakai position aktif |
| `created_at`, `updated_at` | timestamp | |

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

### 2.4 Riwayat status
Tidak ada tabel riwayat status terpisah. Setiap entri `assignments` menyimpan `employee_status`, dan setiap perubahan status (mutasi, `/transition`, `/offboarding`) menambah entri baru lewat career path applier, jadi `assignments` sekaligus menjadi riwayat status. Tanggal keluar karyawan dibaca dari entri non-aktif (`resigned`/`terminated`/`offboarded`) pertama di ujung riwayat. Pergantian atasan dicatat di audit log (`employee.manager_changed`). Tabel lama `status_history` dan `employment_history` dihapus (migration `20261114000002`).

### 2.5a `mutation_requests`
Satu baris = satu perubahan yang menunggu approval untuk satu karyawan, dikelompokkan dalam `mutation_request_batches`. Isi perubahan disimpan di `payload` (JSONB) dengan `kind`: `career_path` (penempatan → `assignments`), `work_policy` (jadwal → `work_policies`), atau `compensation` (versi baru di payroll `compensations`). Payload lama tanpa `kind` dibaca sebagai `career_path` (dan boleh membawa pasangan jadwal).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string | |
| `batch_id` | string (FK) | `mutation_request_batches` |
| `employee_id` | string (FK) | |
| `status` | enum | `pending`, `scheduled`, `approved`, `rejected`, `failed` — default `pending` |
| `payload` | jsonb | `kind`, `effective_date`, field sesuai kind (`career_path_type`, `branch_id`, `org_unit_id`, `position_id`, `employee_status`, `revoke_access` / `schedule_type`, `pattern_id` / `compensation{structure_id, schedule_id, reason, notes, overrides[]}`) |
| `reason` | string | Alasan pengajuan |
| `requested_by` | string | |
| `requested_at` | timestamp | |
| `reviewed_by` | string (nullable) | |
| `reviewed_at` | timestamp (nullable) | |
| `review_notes` | string (nullable) | |
| `failure_reason` | string (nullable) | Terisi hanya saat `status = failed` |
| `applied_at` | timestamp (nullable) | Saat perubahan benar-benar diterapkan |

### 2.5b `contracts`
Kontrak kerja karyawan sebagai entity mandiri — berdampingan dengan (bukan pengganti) `employees.contract_terms` yang tetap ada sebagai array JSONB kasar. `contracts` menambah: tipe legal (PKWT/PKWTT/dst), status yang jelas, dan rantai perpanjangan lewat `previous_contract_id` (kontrak baru menautkan ke kontrak lama, yang otomatis berstatus `superseded` — tidak pernah menimpa baris lama). Reminder kadaluarsa (job terjadwal harian) memakai `end_date` di sini, bukan di `contract_terms`.

> `employees` tidak lagi punya kolom `employment_type` sendiri — dulu ada, tapi tidak pernah tersinkron dengan riwayat `contracts` (statis, diisi sekali saat create, tidak pernah ikut berubah walau kontraknya diperpanjang/berganti jenis). Field `employment_type` pada respons `GET/POST/PATCH /employees*` sekarang **diturunkan saat baca** dari kontrak yang sedang `active` milik karyawan tsb (nilai `type` di atas) — kosong/absen (`null`) bila karyawan belum punya kontrak aktif.
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string | |
| `employee_id` | string (FK) | |
| `type` | enum | `pkwt`, `pkwtt`, `permanent`, `contract`, `intern`, `outsource` |
| `status` | enum | `active`, `expired`, `terminated`, `superseded` — default `active` |
| `start_date` | date | |
| `end_date` | date (nullable) | Null = tidak terbatas (pkwtt/permanent) |
| `previous_contract_id` | string (FK, nullable) | Kontrak yang digantikan (rantai perpanjangan) |
| `remark` | string (nullable) | |
| `created_by` | string | |
| `created_at` / `updated_at` | timestamp | |

### 2.5c `contract_documents`
Dokumen terlampir per kontrak (mis. PDF kontrak yang ditandatangani) — skema identik `employee_documents` di bawah, tapi FK ke `contracts(id)`, bukan `employees(id)`. Alur upload sama persis (presign → MinIO → konfirmasi).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `contract_id` | string (FK) | |
| `type` | enum | `contract_file`, `addendum`, `other` |
| `file_name` | string | |
| `file_ref` | string | Key objek MinIO (bucket privat) |
| `uploaded_by` | string | Aktor |
| `uploaded_at` | timestamp | |

### 2.6 `employee_documents`
Dokumen milik karyawan (kontrak, KTP, sertifikat) — file sebenarnya disimpan di MinIO (object storage), bucket privat; `file_ref` hanya menyimpan key objeknya, bukan isi filenya. Alur upload: klien minta presigned PUT URL (`POST /employees/{id}/documents/presign`), upload langsung ke MinIO, lalu kirim key-nya ke `POST /employees/{id}/documents` untuk dikonfirmasi & dipromosikan ke key final. Setiap pembacaan (list/get) me-resolve `file_ref` menjadi presigned download URL baru berumur pendek — tidak pernah ada URL publik permanen untuk dokumen.
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `doc_...` |
| `employee_id` | string (FK) | |
| `type` | enum | `contract`, `id_card`, `certificate`, `tax`, `other` |
| `file_name` | string | Nama berkas |
| `file_ref` | string | Key objek MinIO (bucket privat) |
| `uploaded_by` | string | Aktor |
| `uploaded_at` | timestamp | |

### 2.7 Wilayah Indonesia (region lookup)

Data wilayah administratif Indonesia untuk alamat berjenjang (provinsi → kota/kabupaten → kecamatan → kelurahan/desa) **tidak disimpan lokal** — `/regions/*` adalah pass-through tipis ke API publik [wilayah.id](https://wilayah.id/api/), dipanggil live setiap request (dengan cache in-process tanpa expiry, karena batas administratif nyaris tidak pernah berubah). Tidak ada tabel `regions` di database ini.

Response tiap region node: `{code, parent_code, level, name}` — kode memakai format dotted Kemendagri (mis. `"31"`, `"31.74"`, `"31.74.01"`, `"31.74.01.1001"`), sama persis dengan yang dipakai wilayah.id sehingga tidak perlu remapping. Tidak ada `postal_code` pada level manapun — wilayah.id tidak menyediakannya.

**Alamat karyawan** (`employees.address`, §2.1) **tidak** menyimpan referensi berjenjang ke region — `region_code` adalah string bebas, tidak divalidasi/FK ke manapun. Bentuk aktualnya:
```json
{
  "line1": "Jl. Merdeka No. 10", "line2": null,
  "region_code": "31.71.01.1001", "postal_code": "10110"
}
```

- Referensi bersifat **global** (dipakai semua tenant), bukan per tenant — tidak ada isolasi tenant untuk lookup wilayah.
- Tidak ada endpoint sync — tidak ada local store yang perlu disinkronkan.

---

## 3. Indeks yang Disarankan

| Tabel | Indeks | Alasan |
|---|---|---|
| `employees` | `(tenant_id, national_id)` unik | Keunikan & lookup |
| `employees` | `(tenant_id, status)` | Filter daftar karyawan |
| `employees` | `manager_id` | Query bawahan |
| `org_units` | `parent_id` | Traversal pohon |
| `job_grades` | `(tenant_id, rank)` | Daftar grade terurut |
| `positions` | `job_grade_id` | Cek grade dipakai |
| `assignments` | `(employee_id, end_date)` | Cari assignment aktif |
| `mutation_requests` | `(tenant_id, status)` | Daftar pengajuan tenant per status |
| `mutation_requests` | `employee_id` | Riwayat pengajuan per karyawan |
| `contracts` | `(tenant_id, status)` | Daftar kontrak tenant per status |
| `contracts` | `employee_id` | Riwayat kontrak per karyawan |
| `contracts` | `end_date` (partial, `status='active'`) | Query reminder kadaluarsa |
| `contract_documents` | `contract_id` | Daftar dokumen per kontrak |

---

## 4. Catatan Desain

- **Denormalisasi terkontrol:** `current_org_unit_id` & `current_position_id` disimpan di `employees` untuk query cepat, tetapi kebenaran historis ada di `assignments`.
- **Self-reference:** `manager_id` & `org_units.parent_id` membentuk hierarki — siklus dicegah di aplikasi (`MANAGER_CYCLE`, cek reparent org unit). Lihat `02-org-structure.md` §4.
- **Tenancy 2 level:** `tenant_id` adalah batas isolasi utama; `branch_id` sub-pembeda cabang (sesuai [Tenancy Model](../../architecture/HRMS_Tenancy_Model.md) — final: A2 + B1 shared DB). `employees` membawa `branch_id` (penempatan operasional). Org unit & posisi **tidak** membawa `branch_id` — keduanya milik tenant secara langsung, satu struktur organisasi untuk seluruh tenant (lihat `02-org-structure.md` §0).
- **Kepatuhan:** `national_id` & data pribadi adalah data sensitif (UU PDP) — pertimbangkan enkripsi at-rest.
