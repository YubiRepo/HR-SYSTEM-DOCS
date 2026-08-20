# Entitlement Module

Modul **foundational** yang menjadi sumber kebenaran atas "apa yang boleh diakses sebuah tenant" — Feature (on/off) & Limit (kapasitas). Dikonsumsi oleh **semua modul** HRMS untuk gerbang fitur & kuota.

| | |
|---|---|
| **Modul** | Entitlement |
| **Versi** | 1.0 |
| **Sifat** | Foundational (sejajar Auth, RBAC), stack-agnostic |
| **Dependensi** | Billing (sumber plan & subscription) |
| **Dikonsumsi** | Core HR, Payroll, Attendance, dan seluruh modul tenant |

---

## Kenapa Modul Terpisah?

Sama seperti RBAC dipisah dari Auth: entitlement dikonsumsi **lintas modul**. Bila ia menempel di Billing, semua modul jadi bergantung ke Billing hanya untuk mengecek Feature/Limit. Dipisah membuat dependensi bersih — modul cukup bertanya ke Entitlement.

**Batas tanggung jawab:**
| Modul | Menjawab |
|---|---|
| **Billing** | Tenant *berlangganan* plan apa (uang, invoice) |
| **Entitlement** | Dari langganan itu, Feature & Limit *efektif* apa |
| **RBAC** | User *berperan* apa (izin per user) |

Entitlement membaca plan & subscription dari Billing, lalu menghitung hasil efektif yang dipakai modul lain.

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks (dokumen ini) |
| [`01-model.md`](./01-model.md) | Feature, Limit, entitlement efektif, override |
| [`02-evaluation.md`](./02-evaluation.md) | Cara cek Feature & Limit; penegakan |
| [`03-api-contract.md`](./03-api-contract.md) | Endpoint (dikonsumsi service internal) |
| [`04-integration.md`](./04-integration.md) | Cara modul lain mengonsumsi |

---

## Prinsip

1. **Sumber kebenaran tunggal** — modul lain tak mengecek nama plan; mereka tanya Feature/Limit ke sini.
2. **Backend penegak** — frontend hanya kosmetik (sembunyikan UI).
3. **Configurable** — mengikuti Plan/Feature/Limit yang dirakit di Billing.
4. **Berlapis dengan RBAC** — fitur harus ada di plan (entitlement) **dan** user harus punya izin (RBAC).

---

## Referensi

- Strategi plan: [`business/HRMS_Business_Model.md`](../../business/HRMS_Business_Model.md)
- Billing (plan & subscription): [`modules/platform/billing`](../platform/billing/README.md)
- RBAC (perbedaan): [`modules/rbac`](../rbac/README.md)
