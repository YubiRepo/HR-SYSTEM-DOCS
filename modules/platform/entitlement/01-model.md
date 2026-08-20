# 01 · Model

## 1. Komponen

| Komponen | Sifat | Contoh |
|---|---|---|
| **Feature** | on/off | `core_hr`, `payroll`, `sso`, `recruitment` |
| **Limit (global)** | angka, milik tenant | `max_employees`, `max_branches`, `storage_gb` |
| **Limit (per-fitur)** | angka, milik fitur | `payroll.max_payslips_month`, `recruitment.max_open_jobs` |

Feature & Limit didefinisikan di katalog (dikelola di Billing/Plan). Entitlement **mengonsumsi** definisi ini, tidak membuatnya.

---

## 2. Entitlement Efektif

Hasil akhir yang dipakai modul lain, dihitung dari: **plan aktif** (dari Billing) + **override tenant** + **status subscription**.

```
effective.features = plan.features ∪ overrides.add − overrides.remove
effective.limits   = plan.limits  ⊕ overrides.limits   (override menang)
disesuaikan oleh   → status subscription (suspended/expired memangkas)
```

**Contoh:**
```json
{
  "tenant_id": "tenant_01H8...",
  "features": ["core_hr","attendance","leave","payroll","performance","recruitment","sso"],
  "limits": { "max_employees": 700, "max_branches": 10 },
  "source": { "plan": "pro", "overrides": ["sso","max_employees:700"] },
  "subscription_status": "active"
}
```

---

## 3. Override per Tenant

Penyesuaian khusus satu tenant tanpa membuat plan baru — mis. goodwill menaikkan `max_employees`, atau menambah `sso` untuk nego enterprise. Override bisa punya `expires_at`. Sumber data override ada di Billing; Entitlement memakainya saat menghitung hasil efektif.

---

## 4. Pengaruh Status Subscription

| Status | Entitlement efektif |
|---|---|
| `trial` | Sesuai plan trial |
| `active` | Penuh (plan + override) |
| `past_due` | Penuh (grace) + peringatan |
| `suspended` | Dipangkas (read-only / blok) |
| `expired` | Turun ke Free / blok |
| `terminated` | Kosong |

---

## 5. Perbedaan dengan RBAC

| | Entitlement | RBAC |
|---|---|---|
| **Menjawab** | Tenant berlangganan apa | User berperan apa |
| **Batas** | Feature & Limit per tenant | Permission per user |
| **Contoh** | "Tenant punya Payroll?" | "User boleh `payroll:run`?" |

Keduanya dicek berlapis: fitur harus **ada di plan** (entitlement) **dan** user harus **punya izin** (RBAC).
