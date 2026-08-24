# 02 · Leave Types

Jenis cuti bersifat **configurable**: sistem menyediakan **preset standar Indonesia**, dan tenant boleh menambah jenis **custom** atau mengubah parameter (durasi, berbayar/tidak) sesuai kebijakan (PKB/peraturan perusahaan) selama ≥ minimum UU.

---

## 1. Sifat Tiap Jenis Cuti

Setiap jenis cuti punya atribut:

| Atribut | Pilihan | Fungsi |
|---|---|---|
| `code` / `name` | — | Identitas (mis. `annual`, "Cuti Tahunan") |
| `paid` | ya / tidak | Berbayar atau memotong gaji |
| `quota_days` | angka / unlimited | Jatah per periode |
| `accrual` | upfront / monthly / none | Cara saldo bertambah |
| `carry_over` | ya / tidak (+ batas) | Sisa dibawa ke tahun depan |
| `requires_document` | ya / tidak | Perlu lampiran (mis. surat dokter) |
| `approval_flow_id` | — | Alur approval yang dipakai (lihat `04`) |
| `gender` | all / female / male | Batasan (mis. melahirkan = female) |
| `eligibility` | aturan | Syarat (mis. masa kerja ≥ 12 bulan) |

---

## 2. Preset Standar Indonesia

Mengikuti UU Ketenagakerjaan, UU Cipta Kerja, & UU KIA. **Ilustratif & configurable** — verifikasi dengan regulasi terbaru.

| Jenis | Durasi (default) | Berbayar | Catatan |
|---|---|---|---|
| **Cuti Tahunan** | min. 12 hari/tahun | Ya | Setelah masa kerja 12 bulan; boleh > 12 via kebijakan |
| **Cuti Sakit** | sesuai surat dokter | Ya (bertingkat) | 100% (4 bln), 75% (4 bln), 50% (4 bln), 25% (setelahnya) |
| **Cuti Melahirkan** | 3 bulan (baseline) | Ya | 1,5 bln sebelum + 1,5 sesudah; UU KIA membuka hingga 6 bln pada kondisi tertentu |
| **Cuti Keguguran** | 1,5 bulan | Ya | Sesuai surat dokter |
| **Cuti Haid** | maks 2 hari | Ya | Hari ke-1 & ke-2 haid |
| **Cuti Menikah** | 3 hari | Ya | Cuti khusus (alasan penting) |
| **Cuti Menikahkan Anak** | 2 hari | Ya | Cuti khusus |
| **Cuti Khitan/Baptis Anak** | 2 hari | Ya | Cuti khusus |
| **Cuti Pendampingan Istri Melahirkan** | 2 hari (dapat diperpanjang) | Ya | Untuk suami (UU KIA) |
| **Cuti Keluarga Meninggal** | 1–2 hari | Ya | Anggota keluarga inti/serumah |
| **Cuti Besar / Panjang** | opsional | Ya | Tidak wajib (UU Cipta Kerja); via kebijakan |
| **Unpaid Leave** | sesuai kebijakan | Tidak | No work no pay; biasanya saat jatah habis |

> **Cuti bersama** dikelola di modul Attendance (kalender libur, `is_observed`), dan menurut regulasi dihitung sebagai bagian cuti tahunan bila diterapkan. Leave & Attendance saling merujuk.

---

## 3. Preset + Custom

- **Preset** aktif secara default saat tenant onboard (bisa dinonaktifkan/diedit).
- **Custom**: tenant membuat jenis sendiri (mis. "Cuti Ulang Tahun", "Cuti Volunteer") dengan atribut penuh.
- Semua jenis (preset/custom) memakai mekanisme saldo & approval yang sama.

---

## 4. Cuti Berbayar vs Tak Berbayar

- **Berbayar** (`paid: true`): gaji tetap dibayar. Untuk cuti sakit, besaran mengikuti aturan bertingkat.
- **Tak berbayar** (`paid: false`): memicu potongan di Payroll (lihat `07-integration.md`).
- Cuti tahunan yang **belum terpakai saat PHK** wajib diganti uang (aturan UU) — ditangani sebagai kompensasi di final pay (Payroll off-cycle).

---

## 5. Kelayakan (Eligibility)

Beberapa jenis punya syarat:
- **Cuti tahunan**: umumnya setelah masa kerja 12 bulan (configurable; sebagian perusahaan pro-rata sejak awal).
- **Melahirkan/haid/keguguran**: khusus karyawan perempuan.
- **Pendampingan istri**: khusus laki-laki.

Sistem memvalidasi kelayakan saat pengajuan (mis. tolak bila belum memenuhi masa kerja, kecuali kebijakan pro-rata).
