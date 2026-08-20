# 05 · Data Model

Entitas milik modul Billing. `tenants` dirujuk dari modul Tenant.

---

## 1. Diagram Relasi

```
  plans ───< plan_features >─── features
    │  └──< plan_limits
    │ 1
    │ N
  subscriptions >─── tenants (modul Tenant)
    │ 1
    │ N
  invoices ───< payments
  tenant_overrides (1:N ke tenants)
```

---

## 2. Entitas

### 2.1 `features`
| Field | Tipe | Keterangan |
|---|---|---|
| `key` | string (PK) | mis. `payroll`, `sso` |
| `name` | string | |
| `description` | string | |
| `module` | string | Modul pemilik (info) |

### 2.2 `plans`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `plan_...` |
| `name` | string | Free, Pro, custom, ... |
| `pricing` | json | `{ model, currency, ... }` |
| `is_public` | boolean | Publik vs privat (custom) |
| `trial_days` | int | 0 = tanpa trial |
| `is_active` | boolean | |

### 2.3 `plan_features` (join)
| Field | Tipe |
|---|---|
| `plan_id` | string (FK) |
| `feature_key` | string (FK) |
> PK `(plan_id, feature_key)`.

### 2.4 `plan_limits`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `plan_id` | string (FK) | |
| `limit_key` | string | `max_employees`, `payroll.max_payslips_month` |
| `value` | int | −1 = unlimited |

### 2.5 `subscriptions`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `sub_...` |
| `tenant_id` | string (FK) | |
| `plan_id` | string (FK) | |
| `status` | enum | `trialing`, `active`, `past_due`, `canceled` |
| `billing_cycle` | string | Kode cycle terpilih (`monthly`, `quarterly`, `annual`, ...) |
| `period_start` / `period_end` | date | |
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
| `add_features` | json | |
| `remove_features` | json | |
| `limits` | json | Override (menang atas plan) |
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

---

## 3. Indeks

| Tabel | Indeks | Alasan |
|---|---|---|
| `subscriptions` | `tenant_id`, `status` | Lookup langganan aktif |
| `invoices` | `(tenant_id, status)`, `due_date` | Tagihan & tunggakan |
| `plan_features` | `plan_id` | Rakit definisi plan |
| `tenant_overrides` | `tenant_id`, `expires_at` | Override & auto-expire |

---

## 4. Catatan
- **Uang** = integer minor unit + `currency` (konsisten API Response Architecture).
- Definisi Plan/Feature/Limit & override di sini menjadi **sumber** bagi Entitlement (yang menghitung hasil efektif).
- Perubahan (plan, override, refund) memancarkan event untuk invalidasi cache Entitlement.
