<!-- 📁 modules/platform/README.md -->
# Platform / Backoffice

Kumpulan modul administrasi **level-platform** untuk HRMS — dipakai oleh **Yubiteck (penyedia SaaS)**, bukan pelanggan. Backoffice berdiri di atas semua tenant dan yang membuat tenant.

```
┌─ BACKOFFICE (Yubiteck) ─ kelola SEMUA tenant ─────┐
│   Tenant A      Tenant B      Tenant C   ...       │
└──────┼─────────────┼─────────────┼─────────────────┘
   HR admin A    HR admin B    HR admin C
```

---

## Dua Level Administrasi

| Level | Siapa | Kelola apa | Modul |
|---|---|---|---|
| **Platform admin** | Yubiteck | Semua tenant, billing, plan | Modul di sini |
| **Tenant admin** | Pelanggan | Data perusahaan sendiri | Core HR, RBAC |

---

## Sub-Modul

Backoffice dipecah menjadi modul-modul dengan concern terpisah:

| Modul | Tanggung jawab |
|---|---|
| [`tenant/`](./tenant/README.md) | Provisioning, cabang, lifecycle tenant |
| [`billing/`](./billing/README.md) | Plan, subscription, invoice, proration, override |
| [`admin-console/`](./admin-console/README.md) | Monitoring, support, impersonation, audit |

> **Entitlement** (Feature/Limit efektif) dipisah sebagai modul **foundational** di [`../entitlement/`](../entitlement/README.md) — sejajar Auth & RBAC — karena dikonsumsi semua modul, bukan hanya backoffice.

---

## Alur Antar Modul

```
Tenant (provisioning)
   └─ memicu → Billing (subscription awal)
                  └─ definisi Plan/Feature/Limit + override
                         └─ dibaca → Entitlement (hitung efektif) → semua modul
Admin Console → membaca Tenant + Billing + Entitlement (monitor & support)
```

---

## Referensi
- Strategi bisnis: [`HRMS_Business_Model.md`](../../HRMS_Business_Model.md)
- Tenancy Model: [`architecture/HRMS_Tenancy_Model.md`](../../architecture/HRMS_Tenancy_Model.md)