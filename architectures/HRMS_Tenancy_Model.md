# HRMS Tenancy Model

Keputusan arsitektur level sistem: bagaimana **organisasi, unit, dan isolasi data** ditata di HRMS. Fondasional — jadi acuan semua modul.

| | |
|---|---|
| **Dokumen** | Tenancy Model — HRMS |
| **Jenis** | Architecture Decision (level sistem) |
| **Status** | 🟡 Proposed — belum diputuskan |
| **Tanggal** | 9 Agustus 2026 |
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

## 6. Rekomendasi Awal (untuk didiskusikan)

Titik awal, bukan keputusan final. Untuk HRMS yang menyasar semua segmen:

- **Mulai dari A2 + B1** — dukung 2 level (tenant → cabang) dengan shared DB. Ini menutup mayoritas kebutuhan (UMKM cukup pakai 1 cabang, menengah pakai banyak cabang) tanpa biaya berlebih.
- **Siapkan jalur ke B3** untuk klien enterprise yang menuntut isolasi data penuh (opsi premium).
- **A3 (grup)** ditambahkan hanya bila ada permintaan nyata dari grup usaha.

> Rekomendasi perlu diverifikasi setelah tahu: proporsi pelanggan enterprise vs UMKM, dan apakah ada kebutuhan kedaulatan/isolasi data yang ketat.

---

## 7. Pertanyaan Terbuka

- Seberapa besar porsi pelanggan yang butuh >1 level cabang?
- Adakah klien yang mensyaratkan data terisolasi penuh (regulasi/kebijakan)?
- Apakah billing dihitung per tenant, per cabang, atau per karyawan? (memengaruhi di level mana batas tenancy ditarik)
