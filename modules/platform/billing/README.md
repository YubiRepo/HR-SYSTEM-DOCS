# Billing Module

Bagian dari **Platform/Backoffice**. Mengelola sisi komersial: Plan (Feature/Limit), subscription, invoice, pembayaran, trial, dan proration.

| | |
|---|---|
| **Modul** | Platform · Billing |
| **Versi** | 1.0 |
| **Pengguna** | Admin platform (super admin, billing admin) |
| **Dependensi** | Tenant (subjek langganan), payment gateway (eksternal) |
| **Menyediakan untuk** | Entitlement (definisi Plan/Feature/Limit & override) |

---

## Ruang Lingkup

- **Plan** — rakitan Feature + Limit + harga (configurable, bukan hardcoded)
- **Feature & Limit catalog** — definisi komponen penyusun plan
- **Subscription** — ikatan tenant ↔ plan
- **Invoice & Payment** — penagihan & pembayaran
- **Trial & Proration** — masa uji coba & penyesuaian tengah periode
- **Override per tenant** — penyesuaian Feature/Limit khusus (sumber, dipakai Entitlement)

**Di luar cakupan:** perhitungan Feature/Limit efektif (Entitlement), lifecycle tenant (Tenant), monitoring (Admin Console).

---

## Hubungan dengan Entitlement

Billing **mendefinisikan** Plan/Feature/Limit & override; Entitlement **menghitung** hasil efektif untuk dipakai modul lain. Pemisahan ini menjaga agar modul konsumen tak bergantung ke Billing.

```
Billing (definisi Plan/Feature/Limit + override)
        │ dibaca oleh
        ▼
Entitlement (hitung efektif) ──▶ semua modul
```

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks (dokumen ini) |
| [`01-overview.md`](./01-overview.md) | Konsep, aktor, relasi |
| [`02-plans.md`](./02-plans.md) | Plan, Feature, Limit, custom plan |
| [`03-subscription-billing.md`](./03-subscription-billing.md) | Subscription, trial, invoice, proration |
| [`04-api-contract.md`](./04-api-contract.md) | Endpoint plan, subscription, invoice |
| [`05-data-model.md`](./05-data-model.md) | Skema entitas billing |

---

## Referensi
- Strategi & tier: [`business/HRMS_Business_Model.md`](../../../business/HRMS_Business_Model.md)
- Entitlement: [`../../entitlement`](../../entitlement/README.md) · Tenant: [`../tenant`](../tenant/README.md)
