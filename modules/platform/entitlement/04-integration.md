# 04 · Integration

Cara modul lain (Core HR, Payroll, dst) mengonsumsi Entitlement.

---

## 1. Pola Konsumsi

| Titik | Contoh |
|---|---|
| **Gerbang fitur** | Payroll menolak jalan bila `payroll` tak dientitle |
| **Guard kapasitas** | Core HR menolak `POST /employees` bila `max_employees` terlampaui |
| **UI adaptif** | Frontend menyembunyikan menu fitur yang tak dientitle |

---

## 2. Alur Cek di Modul Lain

```
Core HR: POST /employees
   │
   ├─ Entitlement.check(feature "core_hr", limit max_employees +1)
   │      └─ allow? tidak → 402/403 (arahkan upgrade)
   ├─ RBAC: user punya employees:write?
   │      └─ tidak → 403
   └─ ya semua → buat karyawan
```

Dua penjaga berlapis: **Entitlement** (tenant boleh & dalam batas) + **RBAC** (user berizin).

---

## 3. Menyediakan Angka Pemakaian

Entitlement tahu **batas**, tapi tidak menyimpan **pemakaian**. Modul pemilik data menyediakannya saat cek:

| Limit | Modul penyedia usage |
|---|---|
| `max_employees` | Core HR |
| `max_branches` | Tenant module |
| `payroll.max_payslips_month` | Payroll |

Pola: modul menghitung `current`, kirim ke `POST /entitlement/check` bersama `adding`.

---

## 4. Propagasi Perubahan

| Perubahan (di Billing) | Efek di Entitlement |
|---|---|
| Upgrade/downgrade plan | Entitlement efektif berubah; invalidasi cache tenant |
| Override diterapkan/kedaluwarsa | Hitung ulang; invalidasi cache |
| Status subscription berubah | Entitlement dipangkas/dipulihkan |

Entitlement mendengarkan event dari Billing (mis. `subscription.updated`, `override.applied`) untuk menyegarkan cache.

---

## 5. Kontrak Antar Modul

**Entitlement menyediakan:** hasil Feature/Limit efektif & endpoint cek.
**Billing menyediakan:** definisi Plan/Feature/Limit & override (sumber).
**Modul konsumen menyediakan:** angka pemakaian + penegakan hasil cek di endpoint mereka.

> Entitlement menentukan *boleh atau tidak*; eksekusi & penyaringan data tetap tanggung jawab modul pemilik.
