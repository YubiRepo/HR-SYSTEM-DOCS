<!-- 📁 modules/payroll/10-loan-deduction.md -->
# 10 · Loan & Deduction (Hutang Karyawan)

Penanganan **hutang karyawan ke perusahaan** yang dipotong dari gaji — kasbon, pinjaman, cicilan barang, denda/ganti rugi. Dibangun di atas komponen potongan sekali-pakai (lihat `02-salary-components.md` §2a), ditambah pelacakan sisa & batas potongan.

---

## 1. Bentuk Hutang Karyawan

| Bentuk | Contoh | Pola potong |
|---|---|---|
| **Kasbon** | Pinjam kecil, dipotong bulan depan | Sekali / beberapa kali |
| **Pinjaman** | Pinjam besar, dicicil berbulan | Cicilan tetap sampai lunas |
| **Cicilan barang** | Beli barang via perusahaan | Cicilan tetap |
| **Denda/ganti rugi** | Kerusakan/kehilangan | Sekali / dicicil |

Semua = **potongan (deduction)** yang mengurangi gaji bersih.

---

## 2. Kenapa Butuh Lebih dari Potongan Biasa

Potongan biasa hanya "potong tiap periode sampai dihentikan manual". Hutang butuh tambahan:

1. **Pelacakan sisa (outstanding)** — tahu pokok, sudah terbayar berapa, sisa berapa.
2. **Auto-stop saat lunas** — berhenti otomatis ketika sisa = 0 (tak menunggu dicabut manual).
3. **Batas potongan** — agar gaji bersih tidak habis (configurable).
4. **Riwayat & persetujuan** — kapan pinjam, berapa, disetujui siapa.

---

## 3. Entitas Pinjaman (Loan)

```
Loan "Pinjaman Budi"
  ├── principal      : 3.000.000   (pokok)
  ├── installment    : 500.000     (cicilan per periode)
  ├── outstanding    : 2.000.000   (sisa berjalan)
  ├── start_period   : 2026-02
  ├── status         : active / paid_off / cancelled
  └── auto-stop saat outstanding = 0
```

| Field | Keterangan |
|---|---|
| `principal` | Pokok pinjaman |
| `installment_amount` | Cicilan per periode |
| `outstanding` | Sisa (berkurang tiap potong) |
| `installment_type` | `fixed` (nominal tetap) / `percentage` (% gaji) |
| `start_period` | Mulai dipotong |
| `status` | `active` / `paid_off` / `cancelled` |
| `approved_by` | Persetujuan (audit) |

---

## 4. Alur Potong per Periode

```
payroll run periode berjalan:
  untuk tiap loan aktif karyawan:
    ├─ potong = min(installment, outstanding)      ← cicilan terakhir bisa < cicilan biasa
    ├─ terapkan batas potongan (§5) → sesuaikan bila perlu
    ├─ kurangi outstanding
    └─ bila outstanding = 0 → status: paid_off (auto-stop)
```

**Cicilan terakhir otomatis pas:** bila sisa 300.000 sedang cicilan 500.000, yang dipotong hanya 300.000 (tak overpotong).

```
Pinjaman 3.000.000, cicilan 500.000:
  Feb: potong 500rb → sisa 2.500.000
  ...
  Jul: potong 500rb → sisa 0 → LUNAS (auto-stop)
```

---

## 5. Batas Potongan (Configurable)

Agar gaji bersih tidak habis, ada **batas maksimal potongan** yang dapat diatur tenant.

```
cap potongan (configurable): mis. maks 30% dari gaji bersih
  total cicilan + potongan lain melebihi cap?
    → cicilan periode ini dikurangi agar tak melewati cap
    → sisa hutang tetap tercatat (tenor memanjang)
```

| Config | Keterangan |
|---|---|
| `max_deduction_percent` | Batas potongan (mis. 30% dari gaji bersih) — **configurable per tenant** |
| `apply_to` | Basis: gaji bersih / gaji pokok |
| `on_exceed` | Bila melewati: kurangi cicilan (tenor mundur) / tetap potong (izin khusus) |

> Batas ini menjaga karyawan tetap menerima gaji layak (juga selaras praktik perlindungan upah). Bila cicilan dikurangi karena cap, tenor otomatis memanjang; sisa hutang tak hilang.

---

## 6. Kaitan dengan Salary Component

Loan diterjemahkan menjadi **potongan** di perhitungan gaji:
```
loan aktif → hasilkan payslip line (deduction) tiap periode
   ├── komponen: "Cicilan Pinjaman" (type: deduction)
   └── terhubung ke loan_id (jejak)
```
Secara mekanis memakai jalur one-time deduction `until_revoked` (§2a), tetapi dengan pelacakan sisa & auto-stop dari entitas Loan. Potongan ini muncul di slip gaji seperti potongan lain (transparan bagi karyawan).

---

## 7. Riwayat & Transparansi

- **Karyawan** melihat sisa hutang & riwayat cicilan di slip / halaman sendiri.
- **HR** melihat daftar pinjaman, sisa, status lunas.
- Semua perubahan (pinjam, cicil, lunas, batal) **tercatat** (audit).
- Saat **PHK**: sisa hutang dapat diselesaikan dari final pay (lihat integrasi Payroll off-cycle) — configurable.

---

## 8. Endpoint

| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/payroll/loans` | Daftar pinjaman (filter karyawan/status) | `payroll:read` |
| POST | `/payroll/loans` | Buat pinjaman | `payroll:config` |
| GET | `/payroll/me/loans` | Pinjaman & sisa sendiri | `payslip:self` |
| PATCH | `/payroll/loans/{id}` | Ubah (cicilan/status) | `payroll:config` |
| POST | `/payroll/loans/{id}/cancel` | Batalkan/hapuskan sisa | `payroll:config` |

**Contoh `POST /payroll/loans`:**
```json
{
  "employee_id": "emp_budi",
  "principal": 3000000,
  "installment_amount": 500000,
  "installment_type": "fixed",
  "start_period": "2026-02"
}
```

**Contoh `GET /payroll/me/loans`:**
```json
{
  "success": true,
  "data": [
    { "id": "loan_...", "principal": 3000000, "outstanding": 2000000, "installment": 500000, "status": "active" }
  ]
}
```

---

## 9. Data Model (ringkas)

### `employee_loans`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `loan_...` |
| `tenant_id` / `branch_id` | string (FK) | |
| `employee_id` | string (FK) | |
| `type` | enum | `cash_advance`/`loan`/`installment`/`penalty` |
| `principal` | int | Pokok |
| `installment_amount` | int | Cicilan per periode |
| `installment_type` | enum | `fixed` / `percentage` |
| `outstanding` | int | Sisa berjalan |
| `start_period` | string | mis. `2026-02` |
| `status` | enum | `active`/`paid_off`/`cancelled` |
| `approved_by` | string | Audit |

### `loan_deductions` (jejak potong per periode)
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `loan_id` | string (FK) | |
| `payroll_run_id` | string (FK) | |
| `period` | string | |
| `amount` | int | Dipotong periode ini |
| `outstanding_after` | int | Sisa setelah potong |

> Cap potongan disimpan di konfigurasi Payroll tenant (`max_deduction_percent`, dll). Lihat `06-data-model.md`.
