<!-- 📁 modules/mobile/issues/payroll.md -->
# Issues Backend — Payroll

Kekurangan endpoint modul **Payroll** di [API docs](../api/README.md) yang ditemukan saat integrasi aplikasi mobile. Dicek ke kode backend `HR-SYSTEM-API` (`origin/main`, 20 Nov 2026). Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [PAY-1](#pay-1) | Belum ada API pinjaman & kasbon untuk karyawan | P2 | `Perlu keputusan` |
| [PAY-2](#pay-2) | Hitung payroll run `500` untuk satu karyawan (gaji besar, TK/0) | P2 | `Open` |

---

### PAY-1
**Belum ada API pinjaman & kasbon untuk karyawan** · P2 · `Perlu keputusan`

- **Konteks:** [api/payroll.md](../api/payroll.md) bagian *Catatan Mobile* sudah menyebut: *"Pinjaman & cicilan belum tersedia di API. Potongan cicilan saat ini hanya terlihat sebagai baris `deduction` di §3."* Di backend hanya ada `payroll_config` untuk batas potongan pinjaman; tidak ada data pinjaman, cicilan, maupun pengajuan.
- **Dampak:** karyawan tidak bisa melihat sisa pinjaman / cicilan, apalagi mengajukan kasbon dari app.
- **Di app (20 Nov 2026):** tab *Pinjaman & Cicilan* **dihapus**. Sebelumnya tab itu hanya menampilkan data contoh (hardcoded) dan tombol ajukan yang tidak pernah terkirim ke server. Potongan cicilan tetap terlihat di rincian slip gaji (baris `deduction` dari `GET /payroll/me/payslips/{id}/lines`).
- **Pertanyaan:** apakah pinjaman/kasbon masuk roadmap Payroll? Bila ya, yang dibutuhkan app:
  - `GET /payroll/me/loans` — daftar pinjaman: jenis, pokok, sisa, cicilan per bulan, tenor (sudah / total), status (`active` / `paid_off`).
  - `GET /payroll/me/loans/{id}` — riwayat potongan per periode.
  - (Opsional) `POST /payroll/me/loans` — pengajuan kasbon, masuk engine approval seperti cuti.
- **Catatan BE:** —

### PAY-2
**Hitung payroll run `500` untuk satu karyawan (gaji besar, TK/0)** · P2 · `Open`

- **Endpoint:** `POST /payroll/runs/{id}/calculate`
- **Temuan (28 Nov 2026, staging, tenant *PT Yubi Demo HR*):** saat menyiapkan data simulasi, run regular Oktober & November gagal dihitung dengan `500 INTERNAL_ERROR` — `"calculate payroll for employee 5e9d1ee1-f444-4fd1-8d3b-2814db205f22 failed"` (Hendra Wijaya, Direktur Utama). Seluruh run berhenti, bukan hanya slip karyawan itu yang `error`. Karyawan lain di run yang sama terhitung normal setelah Hendra dikeluarkan dari `target_filter`.
- **Data karyawan:** struktur `STR-G5` (Gaji Pokok Rp30.000.000, Tunjangan Jabatan Rp10.000.000, Transport Rp3.000.000, Makan Rp1.500.000 — total bruto Rp44.500.000), kompensasi aktif mulai 2026-01-01, tax profile `TK/0` (TER kategori A), kontrak PKWTT, tanpa BPJS enrollment khusus.
- **Dugaan (belum dicek di kode):** bruto bulanan di atas batas atas tabel TER kategori A yang ter-seed di tenant baru, atau batas upah BPJS, sehingga lookup tarif tidak menemukan baris dan error tidak ditangkap per slip.
- **Temuan terkait (bukan bug, data awal tenant):** tenant baru hanya punya tabel TER **kategori A** (`GET /payroll/config/pph21-ter-rates` = 24 baris kategori A), padahal master PTKP memetakan `K/1`, `K/2`, `TK/2`, `TK/3` ke kategori B dan `K/3` ke C. Karyawan dengan status itu gagal dihitung (`no ter rate configured for category B`) sampai HR mengisi tabel B/C. Pertimbangkan seed TER A/B/C lengkap saat provisioning.
- **Usulan:** (1) error hitung satu karyawan masuk ke slip itu (`status: error`, `error_message`) seperti error lain, bukan `500` untuk seluruh run; (2) seed tabel TER A/B/C (PMK 168/2023) untuk tenant baru.
- **Catatan BE:** —

