<!-- 📁 modules/mobile/issues/payroll.md -->
# Issues Backend — Payroll

Kekurangan endpoint modul **Payroll** di [API docs](../api/README.md) yang ditemukan saat integrasi aplikasi mobile. Dicek ke kode backend `HR-SYSTEM-API` (`origin/main`, 20 Nov 2026). Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [PAY-1](#pay-1) | Belum ada API pinjaman & kasbon untuk karyawan | P2 | `Perlu keputusan` |

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
