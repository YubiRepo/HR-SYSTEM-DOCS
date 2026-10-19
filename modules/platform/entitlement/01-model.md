# 01 · Model

## 1. Benefit — satu konsep untuk fitur & kuota

Semua yang bisa diberikan sebuah plan didefinisikan sebagai **Benefit** di katalog master (`benefits`). Tidak ada lagi katalog Feature dan Limit yang terpisah.

| Tipe | Sifat | Contoh key |
|---|---|---|
| `feature` | tersedia / tidak | `core_hr`, `attendance`, `leave`, `payroll`, `core_hr.bulk_import`, `attendance.device`, `attendance.overtime`, `payroll.tax` |
| `quota` | tersedia + angka batas (`-1` = unlimited) | `max_employees`, `max_branches`, `max_devices`, `max_users` |

- Key berbentuk segmen `snake_case` dipisah titik. Benefit modul (mis. `attendance`) menggerbang seluruh modul; sub-benefit (mis. `attendance.device`) menggerbang sub-fitur di dalamnya.
- Key dan tipe **tidak bisa diubah** setelah dibuat, karena sel plan dan snapshot subscription dibaca lewat keduanya.
- Benefit tidak dihapus, hanya dinonaktifkan. Penonaktifan ditolak (`BENEFIT_IN_USE`) selama masih diaktifkan di plan yang aktif.

---

## 2. Matriks Plan (`plan_benefits`)

Setiap plan punya satu sel per benefit:

| Kolom | Arti |
|---|---|
| `enabled` | Benefit termasuk dalam plan |
| `quota` | Hanya untuk benefit `quota`: batas angka, `-1` = unlimited |

Sel yang tidak ada = benefit tidak termasuk. Quota benefit yang dimatikan disimpan sebagai `enabled=false, quota=0`.

---

## 3. Snapshot Subscription (`subscription_benefits`)

Entitlement **tidak** dihitung dari plan secara langsung. Saat subscription:

- dibuat (provisioning / subscribe pertama),
- berganti plan (`ChangeSubscription`, oleh platform maupun self-service),
- diperpanjang ke periode baru (job renewal),

isi matriks plan saat itu **dibekukan** ke `subscription_benefits` (beserta nama & tipe benefit, `source_plan_id`, `snapshot_at`).

Akibatnya, mengubah plan **tidak** mengubah subscription yang sedang berjalan. Nilai baru baru berlaku saat tenant ganti plan atau memasuki periode berikutnya.

---

## 4. Override per Tenant

Penyesuaian khusus satu tenant tanpa membuat plan baru, mis. goodwill menaikkan `max_employees` atau pilot `payroll`. Override berisi map `benefit_key → {enabled, quota}`. Setiap entri **menggantikan** nilai snapshot untuk key itu, atau menambahkannya bila snapshot belum memilikinya. Override punya `expires_at` opsional; yang berlaku adalah override terbaru yang belum kedaluwarsa.

---

## 5. Entitlement Efektif & Access Mode

```
effective.benefits = snapshot subscription ⊕ override aktif   (override menang per key)
access_mode        = none      bila tidak ada subscription, status canceled, atau tenant terminated
                     read_only bila tenant suspended/expired, atau now > period_end + grace
                     full      selain itu
```

`grace` = konfigurasi `Billing.GracePeriodDays` (dipakai juga oleh dunning). Trial yang lewat masa trial + grace ikut menjadi `read_only`.

| Access mode | Efek di endpoint ber-gate |
|---|---|
| `full` | Normal (fitur & kuota sesuai benefit) |
| `read_only` | GET boleh; write ditolak `402 SUBSCRIPTION_READ_ONLY` |
| `none` | Semua ditolak `402 SUBSCRIPTION_INACTIVE` |

Endpoint billing/entitlement/auth/tenant-self-service **tidak** di-gate, sehingga tenant tetap bisa membayar atau upgrade.

**Contoh (`GET /entitlement/me`):**
```json
{
  "tenant_id": "9aeb9a72-...",
  "subscription_status": "active",
  "access_mode": "full",
  "period_end": "2027-01-01T00:00:00Z",
  "grace_ends_at": "2027-01-08T00:00:00Z",
  "features": ["core_hr", "max_branches", "max_employees", "max_users", "payroll"],
  "benefits": {
    "core_hr": { "name": "Core HR", "type": "feature", "enabled": true },
    "max_employees": { "name": "Active Employees", "type": "quota", "enabled": true, "quota": 15 }
  }
}
```
`features` berisi semua key benefit yang aktif (untuk gating menu).

---

## 6. Perbedaan dengan RBAC

| | Entitlement | RBAC |
|---|---|---|
| **Menjawab** | Tenant berlangganan apa | User berperan apa |
| **Batas** | Benefit per tenant | Permission per user |
| **Contoh** | "Tenant punya Payroll?" | "User boleh `payroll:run`?" |

Keduanya dicek berlapis: benefit harus **ada di subscription** (entitlement), **lalu** user harus **punya izin** (RBAC).
