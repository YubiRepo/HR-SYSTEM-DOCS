# Leave Module

Modul cuti untuk HR Management System. Mengelola jenis cuti, saldo (jatah & sisa), pengajuan & persetujuan, carry-over, serta kalender cuti tim. Terhubung ke Attendance (hari cuti bukan alpha), Payroll (cuti tak berbayar memotong gaji), dan Core HR (reporting line untuk approval).

| | |
|---|---|
| **Modul** | Leave |
| **Versi** | 1.0 |
| **Sifat** | Modul HR operasional |
| **Dependensi** | Core HR (karyawan, reporting line), Entitlement, RBAC |
| **Memberi ke** | Attendance (status cuti), Payroll (cuti tak berbayar) |

---

## Ruang Lingkup

- **Jenis cuti** — preset standar Indonesia + custom per tenant
- **Saldo cuti** — jatah, terpakai, sisa; per jenis per karyawan
- **Pengajuan & approval** — alur configurable per jenis cuti
- **Carry-over** — sisa cuti hangus atau dibawa ke tahun depan
- **Kalender cuti tim** — lihat siapa cuti kapan (bantu approval)

**Di luar cakupan:** pencatatan kehadiran (Attendance), perhitungan gaji (Payroll). Leave mengelola *hak & pengajuan cuti*, bukan absensi harian.

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks (dokumen ini) |
| [`01-overview.md`](./01-overview.md) | Konsep, aktor, relasi modul |
| [`02-leave-types.md`](./02-leave-types.md) | Jenis cuti (preset + custom), sifat |
| [`03-balance-accrual.md`](./03-balance-accrual.md) | Saldo, akrual, carry-over |
| [`04-request-approval.md`](./04-request-approval.md) | Pengajuan & approval configurable |
| [`05-api-contract.md`](./05-api-contract.md) | Endpoint cuti, saldo, approval |
| [`06-data-model.md`](./06-data-model.md) | Skema entitas leave |
| [`07-integration.md`](./07-integration.md) | Integrasi Attendance, Payroll, Core HR |
| [`08-period-basis-implementation-plan.md`](./08-period-basis-implementation-plan.md) | Rencana implementasi `period_basis` anniversary/hybrid (belum dikerjakan) |

---

## Prinsip

1. **Configurable** — jenis cuti, aturan saldo, alur approval semua data per tenant.
2. **Kepatuhan Indonesia** — preset mengikuti UU Ketenagakerjaan & UU Cipta Kerja (cuti tahunan min. 12 hari, melahirkan, sakit, dll).
3. **Saldo akurat** — tiap pengajuan disetujui mengurangi saldo; tercatat & auditable.
4. **Approval berbasis reporting line** — memakai struktur atasan dari Core HR.
5. **Berlapis Entitlement & RBAC** — fitur & scope (branch/self) dijaga.

---

## Catatan Regulasi

Preset jenis cuti & aturannya (durasi, berbayar/tidak) mengikuti regulasi yang berlaku dan **disimpan sebagai data konfigurasi**. Angka pada dokumen ini merujuk ketentuan 2026 dan bersifat ilustratif — verifikasi dengan sumber resmi (UU Ketenagakerjaan, UU Cipta Kerja, UU KIA). Perusahaan boleh memberi lebih dari minimum (via PKB/peraturan perusahaan).

---

## Referensi
- Karyawan & reporting line: [`../core-hr`](../core-hr/README.md)
- Status kehadiran: [`../attendance`](../attendance/README.md)
- Potongan gaji: [`../payroll`](../payroll/README.md)
