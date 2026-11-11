# 04 · Payroll Run

## 1. Apa itu Payroll Run

**Payroll run** = satu kali proses gajian untuk satu periode (mis. "Gaji Januari 2026"), mencakup semua karyawan aktif. Karena payroll menyangkut uang banyak orang, run diproses secara terstruktur: dihitung, ditinjau, disetujui, dikunci.

---

## 2. Lifecycle Status

```
DRAFT ──▶ CALCULATED ──▶ IN_REVIEW ──▶ APPROVED ──▶ PAID ──▶ CLOSED
```

| Status | Arti | Bisa apa |
|---|---|---|
| `draft` | Run dibuat, parameter periode & peserta diatur | Edit bebas |
| `calculated` | Sistem sudah menghitung semua karyawan | Hitung ulang bila data salah |
| `in_review` | Ditinjau HR/finance (cek anomali) | Kembali ke draft atau lanjut |
| `approved` | Disetujui checker, siap bayar | Eksekusi pembayaran |
| `paid` | Transfer dieksekusi & slip dikirim | — |
| `closed` | Dikunci permanen (audit) | Hanya baca |

---

## 3. Prinsip: Closed = Terkunci

Setelah `closed`, angka **tidak dapat diubah**. Alasan: laporan pajak & BPJS sudah disetor berdasar angka itu; mengubahnya merusak audit.

**Bila ada kesalahan setelah closed** → buat **koreksi di run berikutnya** (komponen penyesuaian), bukan mengedit run lama. Contoh: kelebihan bayar Januari Rp500.000 → run Februari memuat komponen `koreksi_bulan_lalu = −500.000`. Jejak terlihat, audit terjaga.

> Prinsip sama seperti akuntansi: tidak menghapus transaksi, tetapi membuat transaksi pembalik.

---

## 4. Maker–Checker

Payroll sensitif, maka **yang menghitung ≠ yang menyetujui**:

| Peran | Izin (RBAC) | Aksi |
|---|---|---|
| **Maker** (payroll officer) | `payroll:run` | Buat & hitung run |
| **Checker** (finance/HR manager) | `payroll:approve` | Tinjau & setujui |

Sistem menolak bila aktor yang menyetujui sama dengan yang membuat (dapat dikonfigurasi sesuai kebijakan tenant).

---

## 5. Anatomi Run

```
Payroll Run "Januari 2026" (status: calculated)
  ├── period: 2026-01-01 .. 2026-01-31
  ├── target: filter peserta (lihat §5.1)
  ├── items:
  │     ├── Payslip Budi  → komponen, BPJS, PPh21, net
  │     ├── Payslip Sari  → ...
  │     └── ...
  └── totals: total gross, total potongan, total net, total setoran
```

Satu run = kumpulan **payslip** karyawan terpilih untuk periode itu + ringkasan total.

### 5.1 Target Peserta (Filter Fleksibel)

Run tidak harus mencakup semua karyawan — pesertanya ditentukan **filter fleksibel**, karena beda kelompok bisa punya siklus/tipe gaji berbeda:

| Filter | Contoh guna |
|---|---|
| `branch_id` | Payroll per cabang |
| `department_id` | Hanya divisi tertentu |
| `grade_id` | Hanya grade tertentu |
| `salary_type` | Hanya `daily` (buruh harian) atau `monthly` (staff) |
| `employment_type` | Tetap / kontrak / magang |
| `employee_ids` | Pilih manual (kasus khusus) |

**Contoh:**
```
Run "Buruh Harian" → filter: salary_type=daily
Run "Bulanan Staff" → filter: salary_type=monthly, employment_type=permanent
```
Filter bisa dikombinasi. Ini memungkinkan satu tenant menjalankan beberapa run berbeda untuk kelompok karyawan berbeda. Siklus bayar (mingguan / dua mingguan) mengikuti schedule payroll (P4), bukan filter.

**Schedule & periode (P4):** run regular wajib memilih **periode payroll** (`period_id`). Peserta = karyawan yang versi kompensasinya (berlaku di `end_date` periode) memakai schedule periode itu (tanpa `schedule_id` = schedule default). Absensi/cuti dibaca pada jendela cutoff periode, komponen dinilai terhadap `start_date`..`end_date`, dan `period` run = masa pajak (bulan `pay_date`), sehingga satu masa bisa berisi beberapa run mingguan. Plafon upah BPJS berlaku **per bulan**: run kedua dst. di masa yang sama hanya memakai sisa plafon setelah dasar BPJS run lain (non-draft) di masa itu. Run off-cycle (THR/bonus/final) boleh tanpa periode.

Status periode: `open` → `locked` (absensi dalam jendela cutoff dibekukan — koreksi ditolak — run tetap bisa dihitung; bisa `reopen`) → `closed` (final; tidak bisa membuat atau menghitung run baru).

**Implementasi peserta run (P15):** karyawan ikut run bila punya versi kompensasi (bukan draft) yang berlaku pada **hari terakhir periode** run. Karyawan tanpa kompensasi tidak ikut. Sumber tiap filter: `branch_id` (dan cabang run) = cabang versi kompensasi; `salary_type` = structure versi tersebut; `employment_type` = jenis kontrak aktif di Core HR. `employee_ids` (off-cycle) mengabaikan filter lain, tetapi setiap karyawan yang disebut wajib punya kompensasi berlaku — bila tidak, run gagal (`BUSINESS_RULE_VIOLATED`), tidak dilewati diam-diam. `department_id` / `grade_id` belum diimplementasikan.

---

## 6. Off-cycle Run

Pembayaran di luar siklus reguler, ditangani sebagai run terpisah:

| Jenis | Contoh |
|---|---|
| **THR** | Tunjangan Hari Raya (sekali setahun) |
| **Bonus** | Bonus tahunan/kinerja |
| **Final pay** | Gaji terakhir + pesangon karyawan resign/terminate |

Off-cycle run memakai lifecycle status yang sama, tetapi komponen & perhitungan pajaknya bisa berbeda (mis. THR dihitung bersama gaji pada bulan pembayaran untuk TER).

---

## 7. Scope per Cabang (Multi-Cabang)

Sejalan Tenancy 2-level:
- Run dapat dijalankan **per cabang** atau **seluruh tenant**.
- Branch admin (`scope: branch`) hanya menjalankan/melihat run cabangnya.
- Tenant admin dapat menjalankan lintas cabang.
- Total setoran (PPh 21/BPJS) tetap diagregasi di level tenant (satu badan usaha).

---

## 8. Jadwal & Kepatuhan Pasca-Bayar

Setelah `paid`/`closed`, run menghasilkan data untuk:
- **Setor PPh 21** ke negara (mis. jatuh tempo bulan berikutnya).
- **Setor iuran BPJS** (mis. BPJS Kesehatan jatuh tempo tgl 10).
- **Lapor** (SPT masa, dsb) — via ekspor/integrasi.

Modul dapat memunculkan pengingat jatuh tempo (lewat Notification) agar tenant tidak terkena denda.

## 9. Laporan Setoran (Statutory Reports, P13)

Setelah run final (`approved` / `paid` / `closed`), payroll/finance melihat berapa yang harus disetor untuk satu periode (`YYYY-MM`) di menu **Salary › Statutory Reports**. Semua angka dibaca dari `payslips` (snapshot P11/P12) — tidak ada tabel laporan sendiri.

| Laporan | Isi |
|---|---|
| Rekap BPJS | Per lembaga (BPJS Kesehatan / Ketenagakerjaan) dan per program: peserta, iuran karyawan, iuran perusahaan, total setor. Slip sebelum P11 (tanpa rincian) masuk total sebagai "tanpa rincian". |
| Peserta BPJS | Per karyawan per program: nomor kepesertaan (ditandai bila kosong), dasar upah, iuran. |
| Rekap PPh 21 | Dipotong, ditanggung perusahaan, DTP, terutang; **setor = dipotong + ditanggung perusahaan** (DTP tidak disetor). Dipisah per `tax_treatment`. |
| Daftar bukti potong | Per karyawan: NIK, NPWP, PTKP, TER, metode, perlakuan, bruto, PPh. Beberapa run di satu periode dijumlahkan; snapshot dari slip final terakhir. |

- Run yang belum final pada periode itu **tidak ikut total**, ditampilkan sebagai "pending".
- Masa pajak sementara = `payroll_runs.period` (lihat plan §8 #12; setelah P4 memakai tanggal bayar periode).
- Semua laporan bisa diunduh CSV (`?format=csv`). Format impor resmi e-Bupot / SIPP / e-Dabu belum tersedia.
