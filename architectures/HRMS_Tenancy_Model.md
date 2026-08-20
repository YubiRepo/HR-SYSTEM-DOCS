# HRMS Tenancy Model

Keputusan arsitektur level sistem: bagaimana **organisasi, unit, dan isolasi data** ditata di HRMS. Fondasional — jadi acuan semua modul.

| | |
|---|---|
| **Dokumen** | Tenancy Model — HRMS |
| **Jenis** | Architecture Decision (level sistem) |
| **Status** | ✅ Accepted — diputuskan 11 Agustus 2026 |
| **Tanggal** | 9 Agustus 2026 (diputuskan 11 Agustus 2026) |
| **Berdampak ke** | Seluruh modul, isolasi data, billing |

---

## 1. Apa yang Diputuskan

Tenancy = cara HRMS memisahkan data antar organisasi pelanggan. Ada **dua keputusan** yang perlu diambil, dan keduanya independen:

| Keputusan | Pertanyaan |
|---|---|
| **A · Kedalaman Hirarki** | Berapa tingkat struktur di dalam satu pelanggan? |
| **B · Isolasi Data** | Bagaimana data tiap tenant dipisah di database? |

---

## 2. Keputusan A · Kedalaman Hirarki

Seberapa dalam struktur organisasi yang perlu ditopang sistem.

### Opsi A1 — Satu Level
Tenant = satu perusahaan. Tidak ada sub-unit.

```
Tenant (PT Acme)
   └── (semua karyawan langsung di sini)
```

| Cocok untuk | Kurang cocok bila |
|---|---|
| UMKM, perusahaan tunggal | Ada banyak cabang dgn aturan beda |

---

### Opsi A2 — Dua Level
Tenant menaungi beberapa cabang/unit. Payroll, cuti, approval bisa beda per cabang.

```
Tenant (PT Acme)
   ├── Cabang Jakarta
   ├── Cabang Surabaya
   └── Cabang Bandung
```

| Cocok untuk | Kurang cocok bila |
|---|---|
| Perusahaan multi-cabang | Struktur grup usaha berlapis |

---

### Opsi A3 — Tiga Level
Grup usaha menaungi beberapa company, tiap company punya cabang.

```
Grup (Acme Group)
   ├── Company: PT Acme Indonesia
   │      ├── Cabang Jakarta
   │      └── Cabang Surabaya
   └── Company: PT Acme Malaysia
          ├── Cabang KL
          └── Cabang Penang
```

| Cocok untuk | Kurang cocok bila |
|---|---|
| Grup usaha / enterprise | UMKM (kompleksitas berlebih) |

> **Catatan penting:** hirarki di sini adalah batas **tenancy** (isolasi data, billing, administrasi) — berbeda dari **struktur organisasi** (departemen, jabatan, atasan-bawahan) yang nanti diatur di modul Core HR. Jangan dicampur.

---

## 3. Keputusan B · Isolasi Data

Bagaimana data tiap tenant dipisah secara teknis di database. Independen dari kedalaman hirarki.

### Pola B1 — Shared (kolom `tenant_id`)
Semua tenant berbagi database & tabel yang sama. Tiap baris ditandai `tenant_id`.

```
┌─ Database ──────────────────────────────┐
│  Tabel: employees                        │
│  ┌──────────┬───────────┬─────────────┐  │
│  │ tenant_id│ nama      │ ...         │  │
│  │ A        │ Budi      │ ...         │  │
│  │ B        │ Siti      │ ...         │  │
│  │ A        │ Andi      │ ...         │  │
│  └──────────┴───────────┴─────────────┘  │
└──────────────────────────────────────────┘
```

| Plus | Minus |
|---|---|
| Termurah & termudah di-scale | Isolasi paling lemah (bergantung filter query) |
| Maintenance satu tempat | Risiko kebocoran bila query lupa filter |

---

### Pola B2 — Schema per Tenant
Satu database, tapi tiap tenant punya schema (namespace tabel) sendiri.

```
┌─ Database ──────────────────────────────┐
│  schema_A: employees, payroll, ...       │
│  schema_B: employees, payroll, ...       │
│  schema_C: employees, payroll, ...       │
└──────────────────────────────────────────┘
```

| Plus | Minus |
|---|---|
| Isolasi lebih baik dari B1 | Migrasi skema harus ke banyak schema |
| Masih satu DB (biaya sedang) | Jumlah schema besar bisa berat |

---

### Pola B3 — Isolated (database per tenant)
Tiap tenant punya database terpisah sepenuhnya.

```
┌─ DB tenant A ─┐  ┌─ DB tenant B ─┐  ┌─ DB tenant C ─┐
│  employees    │  │  employees    │  │  employees    │
│  payroll ...  │  │  payroll ...  │  │  payroll ...  │
└───────────────┘  └───────────────┘  └───────────────┘
```

| Plus | Minus |
|---|---|
| Isolasi terkuat | Termahal, operasional berat |
| Cocok untuk data sensitif/enterprise | Sulit di-scale ke ribuan tenant |

---

## 4. Cara Membaca Dua Keputusan Ini

Kedalaman hirarki (A) dan isolasi data (B) **saling tegak lurus** — bisa dikombinasikan bebas. Contoh:

| Kombinasi | Arti |
|---|---|
| A1 + B1 | Perusahaan tunggal, shared DB → paling sederhana (cocok UMKM/SaaS massal) |
| A2 + B1 | Multi-cabang, shared DB → umum untuk SaaS menengah |
| A3 + B2/B3 | Grup enterprise, isolasi kuat → untuk klien besar/sensitif |

---

## 5. Matriks Ringkas

**Kedalaman hirarki:**
| Opsi | Level | Untuk |
|---|---|---|
| A1 | 1 (perusahaan) | UMKM |
| A2 | 2 (→ cabang) | Multi-cabang |
| A3 | 3 (grup → company → cabang) | Enterprise |

**Isolasi data:**
| Pola | Isolasi | Biaya | Untuk |
|---|---|---|---|
| B1 shared | Lemah | Rendah | Skala massal |
| B2 schema | Sedang | Sedang | Menengah |
| B3 isolated | Kuat | Tinggi | Enterprise/sensitif |

---

## 6. Keputusan (Final)

Diputuskan **11 Agustus 2026** untuk HRMS lintas segmen:

| Keputusan | Pilihan | Alasan |
|---|---|---|
| **Hirarki** | **A2 — 2 level (Tenant → Cabang)** | Cukup untuk semua segmen tanpa over-engineering |
| **Isolasi Data** | **B1 — Shared DB (`tenant_id`)** | Termurah & mudah di-scale |
| **Billing** | **Per tenant (perusahaan)** | Batas komersial jelas: 1 perusahaan = 1 tenant = 1 tagihan |

### Rincian penerapan
- **Tenant = perusahaan pelanggan.** Batas billing, langganan, dan isolasi data ditarik di sini.
- **Cabang = unit di dalam tenant.** Dipakai untuk payroll, approval cuti, dan laporan yang berbeda per lokasi.
- **UMKM** cukup memakai **satu cabang default** — praktis seperti 1 level, tanpa kerumitan.
- **Menengah/besar** memakai banyak cabang di bawah satu tenant.
- Semua data lintas cabang berada di **database yang sama**, dipisah dengan `tenant_id` sebagai batas utama dan `branch_id` sebagai sub-pembeda.

### Konsekuensi ke data model
- Setiap entitas ber-tenant membawa **`tenant_id`** (batas isolasi utama) dan, bila relevan, **`branch_id`** (sub-unit).
- Query wajib selalu discope minimal ke `tenant_id`. Penyaringan per cabang lewat `branch_id`.
- Keunikan (mis. identifier user, NIK karyawan) diterapkan **per tenant**.

### Jalur ekspansi (bila dibutuhkan nanti)
- **B3 (isolated DB)** — untuk klien enterprise yang menuntut isolasi data penuh; ditawarkan sebagai opsi premium tanpa mengubah model dasar.
- **A3 (grup usaha)** — hanya ditambahkan bila ada permintaan nyata dari grup dengan banyak perusahaan.

Kedua ekspansi bersifat opsional dan tidak memblokir implementasi model A2 + B1 saat ini.

---

## 7. Catatan

- Struktur **cabang** (tenancy) berbeda dari **struktur organisasi** (divisi/departemen/jabatan) yang diatur di modul Core HR. Cabang adalah batas tenancy; org unit adalah org chart di dalamnya.
- Provisioning tenant & cabang dikelola oleh modul **Platform/Backoffice**.