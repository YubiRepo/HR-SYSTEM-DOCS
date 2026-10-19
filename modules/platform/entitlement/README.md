<!-- 📁 modules/entitlement/README.md -->
# Entitlement Module

Modul **foundational** yang menjadi sumber kebenaran atas "apa yang boleh diakses sebuah tenant" — **Benefit** bertipe `feature` (tersedia/tidak) atau `quota` (kapasitas), dibekukan per subscription. Dikonsumsi oleh **semua modul** HRMS untuk gerbang fitur & kuota.

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
| **Entitlement** | Dari langganan itu (snapshot benefit + override), benefit *efektif* & access mode apa |
| **RBAC** | User *berperan* apa (izin per user) |

Entitlement membaca plan & subscription dari Billing, lalu menghitung hasil efektif yang dipakai modul lain.

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks (dokumen ini) |
| [`01-model.md`](./01-model.md) | Benefit, matriks plan, snapshot, override, access mode |
| [`02-evaluation.md`](./02-evaluation.md) | Cara cek benefit, quota & access mode; penegakan; cache |
| [`03-api-contract.md`](./03-api-contract.md) | Endpoint (dikonsumsi service internal) |
| [`04-integration.md`](./04-integration.md) | Cara modul lain mengonsumsi |

---

## Prinsip

1. **Sumber kebenaran tunggal** — modul lain tak mengecek nama plan; mereka tanya benefit ke sini (lewat `shared/entitlementgate`).
2. **Backend penegak** — frontend hanya kosmetik (sembunyikan UI).
3. **Configurable** — benefit & matriks plan dirakit di backoffice; edit plan berlaku pada ganti plan / renewal berikutnya (snapshot).
4. **Berlapis dengan RBAC** — fitur harus ada di plan (entitlement) **dan** user harus punya izin (RBAC).

---

## Referensi

- Strategi plan: [`HRMS_Business_Model.md`](../../HRMS_Business_Model.md)
- Billing (plan & subscription): [`modules/platform/billing`](../platform/billing/README.md)
- RBAC (perbedaan): [`modules/rbac`](../rbac/README.md)