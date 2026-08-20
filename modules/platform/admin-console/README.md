# Admin Console Module

Bagian dari **Platform/Backoffice**. Antarmuka operasional Yubiteck untuk memantau & mendukung seluruh tenant: dashboard, health, metrik, impersonation, dan audit platform.

| | |
|---|---|
| **Modul** | Platform · Admin Console |
| **Versi** | 1.0 |
| **Pengguna** | Admin platform (super admin, support, viewer) |
| **Dependensi** | Tenant, Billing, Entitlement (baca data), Auth (impersonation) |

---

## Ruang Lingkup

- **Dashboard & metrik** — ringkasan lintas tenant (pertumbuhan, MRR, konversi)
- **Health & observability** — uptime, error rate, status job
- **Support tools** — tenant inspector, usage viewer, manual adjustment
- **Impersonation** — akses dukungan sebagai tenant (time-boxed, teraudit)
- **Audit platform** — jejak semua aksi backoffice

**Di luar cakupan:** definisi plan/billing (Billing), lifecycle tenant (Tenant), perhitungan Feature/Limit (Entitlement). Modul ini **membaca & mengoperasikan**, bukan mendefinisikan.

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks (dokumen ini) |
| [`01-overview.md`](./01-overview.md) | Konsep, aktor, relasi |
| [`02-monitoring.md`](./02-monitoring.md) | Dashboard, metrik, health |
| [`03-support-impersonation.md`](./03-support-impersonation.md) | Support tools & impersonation |
| [`04-audit-security.md`](./04-audit-security.md) | Audit platform & keamanan akses |
| [`05-api-contract.md`](./05-api-contract.md) | Endpoint metrics, health, impersonate, audit |

---

## Prinsip
1. **Read & operate** — mengonsumsi data modul lain, tidak mendefinisikan aturan bisnis.
2. **Impersonation ketat** — time-boxed, scoped, selalu teraudit.
3. **Akses paling sensitif** — MFA wajib, least privilege, audit penuh.

---

## Referensi
- Tenant: [`../tenant`](../tenant/README.md) · Billing: [`../billing`](../billing/README.md) · Entitlement: [`../../entitlement`](../../entitlement/README.md) · Auth: [`../../auth`](../../auth/README.md)
