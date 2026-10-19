# 04 · Integration

Cara modul lain (Core HR, Leave, Attendance, Payroll, Auth) mengonsumsi Entitlement.

---

## 1. Gate bersama: `internal/shared/entitlementgate`

Gate tidak dimiliki modul mana pun. `platform.Contract.ResolveEntitlement(ctx, tenantID)` mengimplementasikan `entitlementgate.Resolver`, dan setiap modul meneruskan `platform.Contract`-nya:

| Fungsi | Dipakai untuk |
|---|---|
| `RequireBenefit(resolver, keys...)` | Middleware gin di route group / sub-router |
| `EnsureQuota(ctx, resolver, tenantID, key, current, adding)` | Use case yang menambah pemakaian |
| `EnsureBenefit(ctx, resolver, tenantID, write, keys...)` | Jalur tanpa principal (agent attendance) |

Resolver `nil` (modul dibangun tanpa platform, mis. di test) mematikan gate.

---

## 2. Penempatan Gate

| Route / aksi | Benefit |
|---|---|
| `/api/v1/core-hr/*` | `core_hr` |
| `/api/v1/core-hr/employees/import*` | + `core_hr.bulk_import` |
| `/api/v1/attendance/*` | `attendance` |
| `/attendance/agents`, `/devices`, `/employee-mappings`, `/raw-events` | + `attendance.device` |
| `/attendance/overtime*`, `/attendance/me/overtime` | + `attendance.overtime` |
| `/api/v1/attendance/agent/*` (X-Agent-Key) | `attendance` + `attendance.device`, dicek di `AuthenticateAgent` |
| `/api/v1/leave/*` | `leave` |
| `/api/v1/payroll/*` | `payroll` |
| `/payroll/employees/{id}/tax-profile` | + `payroll.tax` |
| Create employee / bulk import | quota `max_employees` |
| Tambah cabang | quota `max_branches` |
| Daftar / aktivasi mesin | quota `max_devices` |
| Register / invite user | quota `max_users` |
| Job generate jadwal bulanan | dilewati untuk tenant tanpa `attendance` atau access ≠ `full` |

Tidak di-gate: `/api/v1/entitlement`, `/billing`, `/tenants/me`, `/branches` (read), `/auth`, `/rbac`.

---

## 3. Menambah Benefit Baru

1. Daftarkan benefit di backoffice (*Plans & Entitlements → Master benefits*) atau di `entitlement_catalog_seeder.go`.
2. Isi selnya di matriks plan.
3. Pasang gate: `entitlementgate.RequireBenefit(m.entitlement, "<key>")` di route, atau `EnsureQuota` di use case.
4. Subscription berjalan baru menerima benefit itu saat ganti plan / renewal. Seeder katalog juga menambahkan baris snapshot yang **belum ada** untuk subscription berjalan (nilai yang sudah ada tidak diubah).

---

## 4. Propagasi Perubahan

| Perubahan | Efek |
|---|---|
| Edit plan / sel matriks | Tidak ada untuk subscription berjalan (snapshot) |
| Ganti plan / subscribe | Snapshot ulang + invalidasi cache |
| Renewal ke periode baru | Snapshot ulang dari plan terkini + invalidasi cache |
| Override diterapkan | Invalidasi cache |
| Past due / suspend / pembayaran | Invalidasi cache (access mode bisa berubah) |

---

## 5. Frontend

`useEntitlementGate()` membaca `GET /entitlement/me`: `hasFeature(key)` untuk menyembunyikan menu, dan `accessMode` untuk banner read-only. Frontend tetap kosmetik; backend yang menegakkan.
