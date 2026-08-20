# Tenant Module

Bagian dari **Platform/Backoffice**. Mengelola siklus hidup tenant (perusahaan pelanggan) dan cabangnya: provisioning, lifecycle, suspend/terminate, retensi data.

| | |
|---|---|
| **Modul** | Platform · Tenant |
| **Versi** | 1.0 |
| **Pengguna** | Admin platform (Yubiteck) |
| **Dependensi** | Auth (akun admin tenant), RBAC (seed peran), Tenancy Model (2-level) |
| **Terkait** | Billing (subscription awal), Entitlement (hitung awal) |

---

## Ruang Lingkup

- Provisioning tenant baru + cabang default
- Identitas tenant (slug/subdomain)
- Manajemen cabang (tenancy 2-level)
- Lifecycle: trial → active → suspended → terminated
- Termination & retensi data

**Di luar cakupan:** langganan/invoice (Billing), Feature/Limit (Entitlement), monitoring/impersonation (Admin Console).

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks (dokumen ini) |
| [`01-overview.md`](./01-overview.md) | Konsep, aktor, relasi |
| [`02-lifecycle.md`](./02-lifecycle.md) | Provisioning, cabang, lifecycle, terminasi |
| [`03-api-contract.md`](./03-api-contract.md) | Endpoint tenant & cabang |
| [`04-data-model.md`](./04-data-model.md) | Skema tenants & branches |

---

## Referensi
- Tenancy Model (final): [`architecture/HRMS_Tenancy_Model.md`](../../../architecture/HRMS_Tenancy_Model.md)
- Billing: [`../billing`](../billing/README.md) · Entitlement: [`../../entitlement`](../../entitlement/README.md)
