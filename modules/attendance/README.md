# Attendance Module

Modul kehadiran untuk HR Management System. Mencatat kapan karyawan masuk & pulang, mengelola shift/jadwal kerja, menghitung lembur & keterlambatan, lalu menyediakan rekap yang dipakai Payroll.

| | |
|---|---|
| **Modul** | Attendance |
| **Versi** | 1.0 |
| **Sifat** | Modul HR operasional |
| **Dependensi** | Core HR (karyawan, cabang, reporting line), Entitlement, RBAC |
| **Memberi ke** | Payroll (jam lembur, hari absen, potongan), Leave (status kehadiran) |
| **Terkait** | Leave (cuti mengurangi kewajiban hadir) |

---

## Ruang Lingkup

- **Absensi** — clock in/out via mobile, web, atau mesin; dengan lokasi/foto opsional
- **Shift & jadwal** — pola kerja (pagi/siang/malam, WFH), penugasan shift
- **Lembur (overtime)** — deteksi & hitung jam di luar jadwal
- **Keterlambatan & alpha** — telat, pulang cepat, mangkir
- **Rekap periode** — ringkasan per karyawan untuk Payroll

**Di luar cakupan:** cuti & izin (modul Leave), penggajian (Payroll). Attendance hanya mencatat *kehadiran & waktu*.

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks (dokumen ini) |
| [`01-overview.md`](./01-overview.md) | Konsep, aktor, relasi modul |
| [`02-shift-schedule.md`](./02-shift-schedule.md) | Shift, jadwal kerja, penugasan |
| [`03-attendance-recording.md`](./03-attendance-recording.md) | Clock in/out, sumber, validasi, koreksi |
| [`04-overtime-lateness.md`](./04-overtime-lateness.md) | Lembur, keterlambatan, alpha, rekap |
| [`05-api-contract.md`](./05-api-contract.md) | Endpoint absensi, shift, rekap |
| [`06-data-model.md`](./06-data-model.md) | Skema entitas attendance |
| [`07-integration.md`](./07-integration.md) | Integrasi dengan Payroll, Leave, Core HR |
| [`08-device-integration.md`](./08-device-integration.md) | Metode absen: mobile, mesin, NFC, face; push/pull |
| [`09-method-config.md`](./09-method-config.md) | Konfigurasi metode absen per tenant/cabang |
| [`10-identity-enrollment.md`](./10-identity-enrollment.md) | Daftar sidik jari/wajah/kartu & tautkan ke karyawan |

---

## Prinsip

1. **Sumber kebenaran waktu** — semua perhitungan lembur/telat mengacu jadwal (shift) karyawan.
2. **Configurable** — aturan lembur, toleransi telat, pembulatan jam = data per tenant.
3. **Multi-sumber absensi** — mobile/web/mesin, dengan bukti (lokasi/foto) opsional.
4. **Auditable** — koreksi absensi tercatat (siapa mengubah, kapan, alasan).
5. **Berlapis Entitlement & RBAC** — fitur & scope (branch) dijaga.

---

## Referensi
- Karyawan & reporting line: [`../core-hr`](../core-hr/README.md)
- Konsumen data: [`../payroll`](../payroll/README.md)
- Cuti: [`../leave`](../leave/README.md)
