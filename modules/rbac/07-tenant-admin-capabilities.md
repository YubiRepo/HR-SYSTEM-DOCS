# 07 · Peta Kewenangan Tenant Admin

Kewenangan **tenant admin** (super admin sebuah perusahaan, mis. PT A) tersebar di banyak modul — tidak ada satu "modul admin" tunggal. RBAC-lah yang menyatukannya: peran `tenant_admin` = kumpulan permission dari berbagai modul. Dokumen ini merangkum "admin PT A bisa apa & di modul mana".

> Ini berbeda dari **admin platform (Yubiteck)** yang mengelola semua tenant lewat Admin Console. Lihat perbedaannya di `platform/admin-console`.

---

## 1. Ringkasan Lintas Modul

| Kewenangan | Modul | Permission | Catatan |
|---|---|---|---|
| Kelola user & peran | RBAC | `users:*`, `roles:*` | Buat user, tetapkan peran, bikin peran kustom |
| Kelola cabang | Platform/Tenant | `branch:*` | Buat/ubah/tutup cabang (self-service), dibatasi `max_branches` |
| Kelola langganan | Platform/Billing | `billing:manage` | Upgrade/downgrade sendiri (mode self-service) |
| Kelola katalog org | Core HR | `catalog:*` | Job grade, position template, jenis divisi |
| Kelola karyawan | Core HR | `employees:*` | Lintas semua cabang (scope tenant) |
| Konfigurasi payroll | Payroll | `payroll:config` | Komponen gaji, tarif, grade template |
| Konfigurasi attendance | Attendance | `attendance:config` | Metode absen, aturan, shift |
| Konfigurasi leave | Leave | `leave:config` | Jenis cuti, aturan, approval flow |
| Pengaturan tenant | Platform/Tenant | `settings:*` | Identitas, preferensi, kebijakan |

Cakupan tenant_admin = `tenant` (lintas semua cabang). Semua di atas adalah **default**; tenant admin dapat mendelegasikan sebagian ke peran lain (mis. `branch_admin`, `payroll_officer`).

---

## 2. Kenapa Tersebar (Bukan Satu Modul)

- **Tiap modul memiliki fitur & endpoint-nya sendiri** (payroll di modul Payroll, cabang di Tenant, dst).
- **RBAC menyatukan** — peran `tenant_admin` mengumpulkan permission dari semua modul menjadi satu identitas.
- **UI menyatukan secara visual** — aplikasi biasanya punya area "Settings / Admin" yang mengumpulkan menu (user, cabang, billing, konfigurasi) di satu tempat; di belakang layar ia memanggil endpoint dari modul berbeda.

```
UI "Admin Panel PT A"  (satu halaman)
   ├─ Users & Roles    → RBAC
   ├─ Branches         → Platform/Tenant
   ├─ Subscription     → Platform/Billing
   ├─ Org Catalog      → Core HR
   └─ Module configs   → Payroll / Attendance / Leave
```

Jadi "admin panel" adalah **UI yang mengumpulkan**, bukan modul tunggal.

---

## 3. Self-service vs Managed (Billing)

Untuk langganan, tenant_admin dibatasi `billing_mode` tenant:
- **`self_service`** (default): tenant_admin bisa upgrade/downgrade & bayar sendiri.
- **`managed`**: hanya lihat; perubahan lewat admin Yubiteck (mis. kontrak enterprise).

Selain billing, kewenangan tenant_admin tidak bergantung mode ini.

---

## 4. Delegasi ke Peran Lain

Tenant admin tidak harus mengerjakan semua sendiri. Lazimnya didelegasikan:

| Peran | Menerima kewenangan |
|---|---|
| `branch_admin` | Kelola operasional 1 cabang (scope branch) |
| `hr_admin` | Kelola karyawan, cuti, rekrutmen |
| `payroll_officer` | Jalankan payroll |
| Peran kustom | Sesuai kebutuhan tenant |

Delegasi dilakukan dengan menetapkan peran (+ `branch_scope` bila perlu) ke user — lihat `02-roles.md`.

---

## 5. Batas Kewenangan

Tenant admin **tidak bisa**:
- Mengakses/melihat data tenant lain (isolasi multi-tenant — `03-evaluation.md` §4).
- Mengubah definisi Plan/Feature/Limit (itu milik Yubiteck; tenant hanya memilih plan).
- Melewati limit langganan (mis. tambah cabang melebihi `max_branches`) tanpa upgrade.
- Tindakan platform (suspend tenant lain, provisioning) — itu ranah admin Yubiteck.
