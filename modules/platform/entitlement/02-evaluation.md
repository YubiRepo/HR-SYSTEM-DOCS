# 02 · Evaluation

## 1. Dua Jenis Pengecekan

### 1.1 Feature check (on/off)
"Boleh pakai fitur ini?"
```
require_feature("payroll")
  → entitlement.features.includes("payroll") ? lanjut : 403 FEATURE_NOT_IN_PLAN
```

### 1.2 Limit check (kuota)
"Masih dalam batas?"
```
check_limit("max_employees", current=498, adding=5)
  → 498 + 5 > 500 ? 402 LIMIT_EXCEEDED : lanjut
```
Limit dicek **sebelum** operasi yang menambah pemakaian (tambah karyawan, buat cabang, dsb). Nilai `-1` berarti unlimited.

---

## 2. Penegakan: Backend Wajib, Frontend Kosmetik

- **Backend** penegak sebenarnya (Feature & Limit dicek di server sebelum eksekusi).
- **Frontend** hanya menyembunyikan/menonaktifkan UI demi UX — tidak boleh jadi satu-satunya penjaga.

---

## 3. Urutan Cek dengan RBAC

Untuk endpoint yang butuh keduanya, cek berlapis:

```
request → 1) Entitlement: tenant punya Feature? & dalam Limit?
        → 2) RBAC: user punya permission?
        → lolos keduanya → eksekusi
```

Bila fitur tak dientitle → `403 FEATURE_NOT_IN_PLAN` (arahkan upgrade).
Bila izin kurang → `403 PERMISSION_DENIED`.

---

## 4. Sumber Pemakaian (Usage)

Limit check butuh angka pemakaian terkini. Sumbernya dari modul pemilik data:

| Limit | Sumber angka |
|---|---|
| `max_employees` | Core HR (jumlah karyawan aktif) |
| `max_branches` | Tenant module (jumlah cabang) |
| `payroll.max_payslips_month` | Payroll |

Entitlement menyediakan **batas**; modul pemilik menyediakan **pemakaian**; perbandingan dilakukan saat operasi.

---

## 5. Performa & Caching

- Entitlement efektif per tenant dapat **di-cache** dengan TTL pendek.
- **Invalidasi** cache saat: plan berubah, override diterapkan, atau status subscription berpindah.
- Untuk latensi rendah, entitlement ringkas bisa disematkan di konteks request (mis. gateway) — tetap dengan penegakan backend.
