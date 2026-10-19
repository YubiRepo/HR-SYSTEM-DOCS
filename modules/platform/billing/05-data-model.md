# 05 · Data Model

Entitas milik modul Billing. `tenants` dirujuk dari modul Tenant.

---

## 1. Diagram Relasi

```
  plans ───< plan_benefits >─── benefits
    │ 1
    │ N
  subscriptions >─── tenants (modul Tenant)
    │ 1 └──< subscription_benefits   (snapshot benefit per periode)
    │ N
  invoices ───< payments
  tenant_overrides (1:N ke tenants)
```

---

## 2. Entitas

### 2.1 `benefits` (master)
| Field | Tipe | Keterangan |
|---|---|---|
| `key` | string (PK) | mis. `payroll`, `attendance.device`, `max_employees` |
| `name` | string | |
| `description` | string | |
| `module` | string | Modul pemilik (info & pengelompokan matriks) |
| `type` | enum | `feature` (tersedia/tidak) atau `quota` (+ angka batas) |
| `unit` | string | Satuan quota, mis. `employees` |
| `sort_order` | int | Urutan tampil |
| `is_active` | boolean | Soft delete |

### 2.2 `plans`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `plan_...` |
| `name` | string | Free, Pro, custom, ... |
| `pricing` | json | `{ model, currency, ... }` |
| `is_public` | boolean | Publik vs privat (custom) |
| `trial_days` | int | 0 = tanpa trial |
| `is_active` | boolean | |

### 2.3 `plan_benefits` (matriks plan)
| Field | Tipe | Keterangan |
|---|---|---|
| `plan_id` | string (FK) | |
| `benefit_key` | string (FK) | |
| `enabled` | boolean | Termasuk dalam plan |
| `quota` | int (nullable) | Hanya untuk `quota`; −1 = unlimited |
> PK `(plan_id, benefit_key)`. Baris tidak ada = benefit tidak termasuk.

### 2.4 `subscription_benefits` (snapshot)
| Field | Tipe | Keterangan |
|---|---|---|
| `subscription_id` | string (FK, cascade) | |
| `tenant_id` | string | |
| `benefit_key` | string | |
| `benefit_name` / `benefit_type` | string | Disalin agar snapshot tetap terbaca |
| `enabled` | boolean | |
| `quota` | int (nullable) | |
| `source_plan_id` | string | Plan asal snapshot |
| `snapshot_at` | timestamp | |
> PK `(subscription_id, benefit_key)`. Ditulis ulang saat subscribe, ganti plan, dan renewal — **tidak** saat plan diedit.

### 2.5 `subscriptions`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `sub_...` |
| `tenant_id` | string (FK) | |
| `plan_id` | string (FK) | |
| `status` | enum | `trialing`, `active`, `past_due`, `canceled` |
| `billing_cycle` | string | Kode cycle terpilih (`monthly`, `quarterly`, `annual`, ...) |
| `period_start` / `period_end` | date | `period_end` = "aktif sampai"; lewat `period_end + grace` → read-only |
| `seat_count` | int | Basis PEPM (karyawan **aktif** saja) |
| `trial_ends_at` | date (nullable) | |

### 2.5b `plan_billing_cycles`
Opsi jangka waktu + diskon per plan (configurable).
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `plan_id` | string (FK) | |
| `code` | string | `monthly`, `quarterly`, `annual`, ... |
| `months` | int | Panjang periode (bulan) |
| `discount_pct` | number | Diskon cycle (0 = tanpa diskon) |
| `is_active` | boolean | Tersedia dipilih |
> Menambah cycle baru = menambah baris di sini, tanpa ubah kode.

### 2.6 `tenant_overrides`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string (FK) | |
| `benefits` | json | `{ benefit_key: { enabled, quota? } }` — menang atas snapshot per key |
| `reason` | string | |
| `expires_at` | date (nullable) | |

### 2.7 `invoices`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `inv_...` |
| `tenant_id` | string (FK) | |
| `subscription_id` | string (FK) | |
| `period_start` / `period_end` | date | |
| `amount` | int | Minor unit |
| `currency` | string | `IDR` |
| `tax` | int | mis. PPN |
| `status` | enum | `draft`, `open`, `paid`, `void`, `uncollectible` |
| `due_date` | date | |

### 2.8 `payments`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `invoice_id` | string (FK) | |
| `amount` | int | |
| `method` | string | `va`, `card`, `transfer` |
| `status` | enum | `pending`, `succeeded`, `failed`, `refunded` |
| `paid_at` | timestamp | |
| `proof_key` | string (nullable) | Object key **bucket private** dari bukti pembayaran manual (hasil upload presign→confirm→promote, `payment-proofs/...`) |
| `notes` | text (nullable) | Catatan tenant saat submit bukti (mis. nomor referensi transfer) |
| `reviewed_by` | string (nullable) | User ID staff yang approve/reject pembayaran manual |
| `reviewed_at` | timestamp (nullable) | Waktu review |
| `review_notes` | text (nullable) | Catatan/alasan reviewer saat approve/reject |

> **Dua sumber baris:** webhook gateway langsung `succeeded`/`failed`
> (tanpa review, tanpa dokumen); pembayaran manual mulai `pending` dengan
> `proof_key` lalu `succeeded`/`failed` setelah review staff (kolom
> `reviewed_*` diisi). `proof_url` pada API dihasilkan on-demand sebagai
> presigned GET dari `proof_key`, bukan disimpan.

---

## 3. Indeks

| Tabel | Indeks | Alasan |
|---|---|---|
| `subscriptions` | `tenant_id`, `status` | Lookup langganan aktif |
| `invoices` | `(tenant_id, status)`, `due_date` | Tagihan & tunggakan |
| `subscription_benefits` | `tenant_id` | Hitung entitlement efektif |
| `tenant_overrides` | `tenant_id`, `expires_at` | Override & auto-expire |

---

## 4. Catatan
- **Uang** = integer minor unit + `currency` (konsisten API Response Architecture).
- Master benefit, matriks plan, snapshot subscription & override di sini menjadi **sumber** bagi Entitlement (yang menghitung hasil efektif dari snapshot + override).
- Edit plan tidak mengubah subscription berjalan; ganti plan / renewal / override / perubahan status menginvalidasi cache Entitlement. Lihat [`entitlement/01-model.md`](../entitlement/01-model.md).
