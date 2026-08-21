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
  ├── scope: semua karyawan aktif (opsional filter cabang)
  ├── items:
  │     ├── Payslip Budi  → komponen, BPJS, PPh21, net
  │     ├── Payslip Sari  → ...
  │     └── ...
  └── totals: total gross, total potongan, total net, total setoran
```

Satu run = kumpulan **payslip** semua karyawan untuk periode itu + ringkasan total.

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
