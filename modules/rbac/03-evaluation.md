# 03 · Evaluation

## 1. Algoritma Evaluasi Akses

Ketika sebuah endpoint dilindungi (mis. `requires: employees:write`), resource server menjalankan:

1. Ambil `roles` & `scope` dari klaim token.
2. Kumpulkan seluruh permission dari `roles` (mapping role→permission).
3. Hitung izin efektif = permission ∩ scope token.
4. Cek apakah `employees:write` termasuk (atau tercakup wildcard `employees:*` / `*:*`).
5. **Cek data-scope** bila perlu (lihat bagian 3).
6. Lolos → lanjut; gagal → `403 PERMISSION_DENIED`.

```
token.roles ──▶ expand ke permissions ──┐
                                         ├──▶ irisan ──▶ cek vs required ──▶ allow/deny
token.scope ─────────────────────────────┘
```

---

## 2. Pencocokan Wildcard

| Required | Dimiliki | Hasil |
|---|---|---|
| `employees:read` | `employees:read` | ✅ |
| `employees:read` | `employees:*` | ✅ |
| `employees:read` | `*:*` | ✅ |
| `employees:write` | `employees:read` | ❌ |
| `payroll:run` | `employees:*` | ❌ |

---

## 3. Data-Level Scoping

Selain izin fungsional, akses sering dibatasi pada cakupan data:

| Scope data | Arti |
|---|---|
| `self` | Hanya data milik pengguna sendiri |
| `team` | Data anggota tim yang dipimpin |
| `branch` | Seluruh data dalam satu cabang (untuk branch admin) |
| `tenant` | Seluruh data dalam tenant (semua cabang + katalog) |

Contoh: `employee` punya `payslip:read` tetapi terbatas `self`; `payroll_officer` punya `payslip:read` dengan cakupan `tenant`. Seorang **branch admin** punya izin luas tetapi dibatasi `branch` — hanya cabang yang ia kelola; **tenant admin** memakai cakupan `tenant` (lintas semua cabang).

**Penegakan branch scope:** untuk aktor bercakupan `branch`, query difilter `WHERE branch_id IN (cabang yang dikelola)`. Cakupan `tenant` tidak difilter per cabang (lihat semua). Katalog tenant (job grade, template, jenis divisi) hanya dapat diubah oleh cakupan `tenant`.

Data-scope dievaluasi **setelah** izin fungsional lolos, dengan menyaring query data (mis. `WHERE owner_id = :sub` untuk `self`).

---

## 4. Multi-Tenant

- Evaluasi selalu dalam konteks `tenant_id` dari token.
- Pengguna satu tenant tidak pernah memperoleh izin atas data tenant lain, terlepas dari peran.
- `tenant_id` di token wajib cocok dengan `tenant_id` resource; jika tidak → `403 TENANT_MISMATCH`.

---

## 5. Kegagalan & Respons

| Kondisi | Respons |
|---|---|
| Permission kurang | `403 PERMISSION_DENIED` |
| Scope token tak memuat izin | `403 INSUFFICIENT_SCOPE` |
| Tenant tidak cocok | `403 TENANT_MISMATCH` |

Prinsip fail-safe: bila ragu atau data tidak lengkap, **tolak** akses.
