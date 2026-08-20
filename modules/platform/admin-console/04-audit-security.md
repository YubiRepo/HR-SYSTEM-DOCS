# 04 · Audit & Security

## 1. Audit Log Platform

Semua aksi backoffice tercatat — termasuk log paling sensitif di sistem.

| Kategori | Contoh event |
|---|---|
| Tenant | `tenant.created`, `tenant.suspended`, `tenant.terminated` |
| Billing | `plan.changed`, `invoice.issued`, `refund.issued`, `override.applied` |
| Support | `impersonation.started`, `impersonation.ended`, `manual_adjustment` |
| Config | `feature.created`, `plan.updated`, `limit.changed` |

Tiap entri: aktor platform, target tenant, aksi, before/after (bila relevan), IP, waktu. **Append-only**, hanya dapat dibaca peran berwenang.

> Modul Tenant & Billing memancarkan event masing-masing; Admin Console mengagregasi & menyajikan untuk penelusuran.

---

## 2. Keamanan Akses Backoffice

Karena backoffice mengendalikan semua tenant, aksesnya paling kritikal:

1. **MFA wajib** untuk semua akun platform.
2. **Least privilege** — pisahkan peran (super admin / billing / support / viewer).
3. **IP allowlist / VPN** (opsional, disarankan).
4. **Sesi pendek** + re-auth untuk aksi berbahaya (terminate tenant, refund besar).
5. **Audit penuh** + monitoring anomali akses.
6. **Pemisahan lingkungan** — backoffice produksi terisolasi.

---

## 3. Pemisahan Peran Platform

| Peran | Boleh |
|---|---|
| **super_admin** | Semua, termasuk terminate & config |
| **billing** | Subscription, invoice, refund |
| **support** | Inspector, impersonation terbatas |
| **viewer** | Read-only monitoring |

Peran platform dikelola via RBAC (terpisah dari peran tenant).
