# 02 · Evaluation

## 1. Tiga Jenis Pengecekan

### 1.1 Access mode
```
access_mode == none                       → 402 SUBSCRIPTION_INACTIVE
access_mode == read_only && bukan GET     → 402 SUBSCRIPTION_READ_ONLY
```

### 1.2 Benefit check (tersedia / tidak)
```
require_benefit("payroll")
  → effective.benefits["payroll"].enabled ? lanjut : 403 FEATURE_NOT_IN_PLAN
```

### 1.3 Quota check
```
ensure_quota("max_employees", current=15, adding=1)
  → quota == -1 ? lanjut
  → 15 + 1 > quota ? 402 LIMIT_EXCEEDED : lanjut
```
Quota dicek **sebelum** operasi yang menambah pemakaian. Benefit quota yang tidak ada atau dimatikan dihitung sebagai quota `0`.

---

## 2. Penegakan: Backend Wajib, Frontend Kosmetik

- **Backend** adalah penegak sebenarnya: middleware route + cek kuota di use case.
- **Frontend** hanya menyembunyikan menu (`useEntitlementGate`) dan menampilkan banner read-only.

---

## 3. Urutan Cek dengan RBAC

```
request → auth → principal → 1) Entitlement: access mode + benefit modul/sub-fitur
                           → 2) RBAC: user punya permission?
                           → 3) Use case: quota (bila menambah pemakaian)
                           → eksekusi
```

Platform staff (tanpa `tenant_id`) melewati gate entitlement; RBAC tetap berlaku.

---

## 4. Sumber Pemakaian (Usage)

| Quota | Sumber angka | Ditegakkan di |
|---|---|---|
| `max_employees` | Core HR (karyawan `is_active`) | Create employee, bulk import (per baris; dry-run ikut mensimulasikan) |
| `max_branches` | Tenant (cabang aktif) | Tambah cabang (self-service & platform) |
| `max_devices` | Attendance (mesin `status=active`) | Daftar mesin, aktivasi ulang mesin |
| `max_users` | Auth (user tenant non-disabled) | Register/invite user. Admin pertama saat provisioning dikecualikan |

Entitlement menyediakan **batas**; modul pemilik menyediakan **pemakaian**.

Ganti plan juga dicek: bila pemakaian saat ini melebihi quota plan tujuan (mis. downgrade 30 karyawan ke plan 15), perubahan ditolak `LIMIT_EXCEEDED`. Key yang tertutup override aktif dilewati.

---

## 5. Performa & Caching

- Entitlement efektif per tenant di-cache di Redis (`platform:entitlement:v1:<tenant_id>`, TTL 60 detik, fail-open).
- Dalam satu request, hasilnya di-resolve sekali walau beberapa gate bertumpuk.
- **Invalidasi** setelah: ganti/cancel subscription, override, renewal, dunning (past_due/suspend), pembayaran (webhook/approval manual).
- Edit plan **tidak** perlu invalidasi (snapshot tidak berubah).
- Perubahan status tenant di luar dunning, serta perubahan dari proses worker (yang tidak terhubung Redis), menyusul dalam ≤ TTL.
