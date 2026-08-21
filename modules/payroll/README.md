# Payroll Module

Modul penggajian untuk HR Management System. Menghitung gaji karyawan dari komponen yang dapat dikonfigurasi, memotong iuran BPJS & PPh 21 sesuai regulasi Indonesia, lalu menghasilkan slip gaji dan instruksi pembayaran.

| | |
|---|---|
| **Modul** | Payroll |
| **Versi** | 1.0 |
| **Sifat** | Modul HR operasional (fitur premium — plan Pro ke atas) |
| **Dependensi** | Core HR (data karyawan), Entitlement (gerbang fitur), RBAC (izin) |
| **Menerima dari** | Attendance & Leave (lembur, potongan absen) — bila modul aktif |
| **Memberi ke** | Billing (jumlah karyawan aktif / seat count), Notification (kirim slip) |

---

## Ruang Lingkup

- **Komponen gaji configurable** — earning & deduction yang didefinisikan tenant
- **Perhitungan** — gaji kotor → BPJS → PPh 21 (TER) → gaji bersih
- **Payroll run** — siklus gajian per periode dengan lifecycle status & approval
- **Slip gaji** — rincian per karyawan
- **Instruksi pembayaran** — file/April transfer bank
- **Kepatuhan** — data untuk setor & lapor PPh 21 & BPJS

**Di luar cakupan:** pencatatan kehadiran/cuti (Attendance & Leave), transfer bank aktual (integrasi eksternal), pelaporan pajak ke DJP (integrasi/ekspor).

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks (dokumen ini) |
| [`01-overview.md`](./01-overview.md) | Konsep, aktor, relasi modul |
| [`02-salary-components.md`](./02-salary-components.md) | Komponen gaji configurable + 4 flag |
| [`03-calculation.md`](./03-calculation.md) | Urutan perhitungan, PPh 21 (TER), BPJS |
| [`04-payroll-run.md`](./04-payroll-run.md) | Lifecycle run, maker-checker, off-cycle |
| [`05-api-contract.md`](./05-api-contract.md) | Endpoint run, komponen, slip |
| [`06-data-model.md`](./06-data-model.md) | Skema entitas payroll |
| [`07-integration.md`](./07-integration.md) | Integrasi dengan modul lain |

---

## Prinsip

1. **Configurable, bukan hardcoded** — komponen gaji, tarif pajak & BPJS, plafon semuanya data yang bisa diubah tanpa deploy (regulasi berubah tiap tahun).
2. **Kepatuhan Indonesia** — PPh 21 metode TER (2024+) & BPJS mengikuti aturan terbaru; jadi nilai jual utama.
3. **Auditable** — run yang sudah `closed` dikunci; koreksi lewat run berikutnya, bukan edit.
4. **Maker-checker** — yang menghitung run berbeda dari yang menyetujui (via RBAC).
5. **Berlapis dengan Entitlement & RBAC** — fitur payroll harus ada di plan tenant (Entitlement) dan user harus berizin (RBAC).

---

## Catatan Regulasi

Tarif & batas yang dipakai modul (PPh 21 TER, PTKP, persentase & plafon BPJS) mengikuti regulasi yang berlaku dan **disimpan sebagai data konfigurasi**, bukan angka mati di kode. Saat pemerintah memperbarui aturan, cukup perbarui data konfigurasi. Contoh angka pada dokumen ini merujuk ketentuan 2026 dan bersifat ilustratif — selalu verifikasi dengan sumber resmi (DJP, BPJS).

---

## Referensi
- Data karyawan: [`../core-hr`](../core-hr/README.md)
- Gerbang fitur & limit: [`../entitlement`](../entitlement/README.md)
- Peran & izin: [`../rbac`](../rbac/README.md)
- Strategi tier (Payroll di Pro): [`../../business/HRMS_Business_Model.md`](../../business/HRMS_Business_Model.md)
