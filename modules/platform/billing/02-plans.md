# 02 · Plans

Mengacu strategi di [Business Model](../../../business/HRMS_Business_Model.md). Dokumen ini menspesifikasikan bagaimana Plan dirakit dari Feature & Limit.

---

## 1. Komponen (Plan · Feature · Limit)

| Komponen | Sifat | Contoh |
|---|---|---|
| **Feature** | on/off | `core_hr`, `payroll`, `sso`, `recruitment` |
| **Limit (global)** | angka, milik tenant | `max_employees`, `max_branches`, `storage_gb` |
| **Limit (per-fitur)** | angka, milik fitur | `payroll.max_payslips_month`, `recruitment.max_open_jobs` |
| **Plan** | rakitan Feature + Limit + harga | Free, Starter, Pro, Enterprise, custom |

Plan adalah **data**, bukan kode. Menambah/mengubah plan lewat backoffice tanpa deploy.

---

## 2. Struktur Plan

```
Plan "Pro"
  ├── features : [core_hr, attendance, leave, payroll,
  │               performance, recruitment]
  ├── limits   : { max_employees: 500, max_branches: 10,
  │               payroll.max_payslips_month: 600 }
  ├── pricing  : { model: "pepm", currency: "IDR", rate: ... }
  ├── cycles   : [ {monthly,0%}, {quarterly,5%}, {annual,15%} ]
  └── flags    : { is_public: true, trial_days: 14 }
```

| Field plan | Fungsi |
|---|---|
| `features` | Daftar Feature aktif |
| `limits` | Peta Limit (global & per-fitur) |
| `pricing` | Model & parameter harga (PEPM/flat) |
| `cycles` | Opsi jangka waktu + diskon (monthly/quarterly/annual, configurable) |
| `is_public` | Tampil di halaman harga atau plan privat (custom) |
| `trial_days` | Durasi trial bila ada |

---

## 3. Contoh Plan (ilustratif)

| | Free | Starter | Pro ⭐ | Enterprise |
|---|---|---|---|---|
| Core HR | ✅ | ✅ | ✅ | ✅ |
| Attendance & Leave | — | ✅ | ✅ | ✅ |
| Payroll | — | — | ✅ | ✅ |
| Performance | — | — | ✅ | ✅ |
| Recruitment | — | — | ✅ | ✅ |
| SSO | — | — | — | ✅ |
| max_employees | 15 | 50 | 500 | unlimited |
| max_branches | 1 | 3 | multi | unlimited |
| Harga | Gratis | PEPM rendah | PEPM standar | Custom |

Payroll sengaja di Pro sebagai pendorong upgrade (lihat Business Model).

---

## 4. Custom Plan per Tenant

Untuk nego enterprise, buat plan privat (`is_public: false`) khusus satu tenant — mis. "Pro + SSO tanpa Recruitment" dengan limit nego. Ini inti model configurable.

---

## 5. Override per Tenant

Selain plan, tenant bisa punya override (tambah/cabut Feature, ubah Limit) tanpa membuat plan baru — mis. goodwill naikkan `max_employees`. Override bisa `expires_at`. Definisinya di sini; hasil efektifnya dihitung modul **Entitlement**.

---

## 6. Katalog Feature & Limit

- **Feature catalog** — daftar Feature yang dikenal sistem (di-seed, global). Modul baru mendaftarkan Feature-nya di sini.
- **Limit catalog** — jenis Limit yang tersedia (global & per-fitur).

Plan hanya boleh memakai Feature/Limit yang terdaftar di katalog (validasi saat buat/ubah plan).
