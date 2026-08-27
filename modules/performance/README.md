# Performance Module

Modul manajemen kinerja untuk HR Management System. Mengelola kerangka penilaian (KPI/OKR/kompetensi — configurable), siklus review, self-assessment, manager review, 360 feedback, hingga kalibrasi & rating akhir. Opsional terhubung ke Payroll untuk bonus kinerja.

| | |
|---|---|
| **Modul** | Performance |
| **Versi** | 1.0 |
| **Sifat** | Modul HR operasional (hilir — penilaian karyawan) |
| **Dependensi** | Core HR (karyawan, reporting line), Entitlement, RBAC |
| **Memberi ke** | Payroll (rating → bonus, opsional) |

---

## Ruang Lingkup

- **Kerangka penilaian** — KPI / OKR / kompetensi (configurable per tenant)
- **Goal/target** — penetapan & tracking sasaran
- **Siklus review** — periode penilaian (kuartalan/tahunan)
- **Self & manager review** — penilaian diri & atasan (reporting line)
- **360 feedback** — masukan dari atasan, rekan, bawahan (opsional)
- **Kalibrasi & rating** — normalisasi skor lintas tim, rating akhir
- **Bonus link** — hasil rating → bonus Payroll (opsional)

**Di luar cakupan:** penggajian (Payroll), pencatatan kehadiran (Attendance). Performance mengelola *penilaian & sasaran*, bukan gaji/absensi.

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks (dokumen ini) |
| [`01-overview.md`](./01-overview.md) | Konsep, aktor, relasi modul |
| [`02-frameworks-goals.md`](./02-frameworks-goals.md) | KPI/OKR/kompetensi + goal |
| [`03-review-cycle.md`](./03-review-cycle.md) | Siklus, self/manager/360, kalibrasi |
| [`04-api-contract.md`](./04-api-contract.md) | Endpoint goal, review, feedback |
| [`05-data-model.md`](./05-data-model.md) | Skema entitas performance |
| [`06-integration.md`](./06-integration.md) | Integrasi Core HR, Payroll, dll |

---

## Prinsip

1. **Configurable** — kerangka (KPI/OKR/kompetensi), form, skala rating, bobot = data per tenant.
2. **Berbasis reporting line** — reviewer ditentukan struktur atasan dari Core HR.
3. **Adil & transparan** — kalibrasi mengurangi bias antar-penilai; hasil dapat ditinjau.
4. **Bonus opsional** — kaitan ke Payroll bisa diaktifkan/nonaktifkan; performance tetap berguna tanpa bonus.
5. **Auditable** — semua penilaian & perubahan tercatat.
6. **Berlapis Entitlement & RBAC** — fitur & scope dijaga.

---

## Referensi
- Karyawan & reporting line: [`../core-hr`](../core-hr/README.md)
- Bonus kinerja: [`../payroll`](../payroll/README.md)
- Peran & izin: [`../rbac`](../rbac/README.md)
