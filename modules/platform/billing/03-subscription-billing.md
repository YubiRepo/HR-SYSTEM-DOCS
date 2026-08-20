# 03 · Subscription & Billing

## 1. Subscription

Ikatan tenant ↔ plan pada periode.

| Field | Fungsi |
|---|---|
| `tenant_id` | Tenant pelanggan |
| `plan_id` | Plan yang dilanggan |
| `status` | `trialing`, `active`, `past_due`, `canceled` |
| `billing_cycle` | Kode cycle terpilih (mis. `monthly`, `quarterly`, `annual`) |
| `current_period` | Awal–akhir periode berjalan |
| `seat_count` | Jumlah karyawan **aktif** (basis PEPM) |

> **Definisi seat:** hanya karyawan berstatus aktif (`probation` + `active`). Karyawan `resigned`/`terminated`/`offboarded` **tidak** dihitung sebagai seat berbayar. Sumber angka: Core HR.

---

## 2. Billing Cycle (Configurable)

Jangka waktu langganan **tidak di-hardcode**. Tiap plan menawarkan beberapa **cycle option**, masing-masing dengan durasi & diskon sendiri. Menambah cycle baru (mis. `2-year`) cukup menambah data, tanpa mengubah kode.

```
Plan "Pro"
  └── billing_cycles:
        ├── { code: "monthly",   months: 1,  discount_pct: 0 }
        ├── { code: "quarterly", months: 3,  discount_pct: 5 }
        └── { code: "annual",    months: 12, discount_pct: 15 }
```

| Field cycle | Fungsi |
|---|---|
| `code` | Pengenal cycle (`monthly`, `quarterly`, `annual`, ...) |
| `months` | Panjang periode dalam bulan |
| `discount_pct` | Diskon untuk cycle ini (0 = tanpa diskon) |
| `is_active` | Cycle tersedia untuk dipilih atau tidak |

**Contoh umum:** monthly (0%), quarterly (~5%), annual (~15%). Angka diskon dapat diatur per plan.

---

## 3. Perhitungan dengan Diskon

Harga cycle = harga dasar PEPM × jumlah bulan × seat, dikurangi diskon cycle:

```
base       = pepm_rate × seat_count × cycle.months
discount    = base × (cycle.discount_pct / 100)
total       = base − discount
```

**Contoh:** Pro Rp 25.000 PEPM, 100 karyawan, annual (12 bulan, diskon 15%):
```
base     = 25.000 × 100 × 12   = 30.000.000
discount = 30.000.000 × 0,15   =  4.500.000
total    = 25.500.000  (dibayar di muka untuk 1 tahun)
```

Diskon cycle panjang mendorong komitmen & menurunkan churn; pembayaran di muka juga memperbaiki cashflow.

---

## 4. Model Harga

| Model | Cara hitung | Dipakai |
|---|---|---|
| **PEPM** | Harga/karyawan × seat × bulan (− diskon cycle) | Basis utama |
| **Flat** | Harga tetap per periode | Plan sederhana/promo |
| **Custom** | Nego (enterprise), termasuk multi-year | Plan privat |

`seat_count` bersumber dari Core HR (karyawan aktif tenant). Multi-year ditangani lewat plan custom/enterprise, atau sebagai cycle tambahan bila diperlukan.

---

## 5. Trial

- Mengikuti `trial_days` plan (mis. Pro 14–30 hari).
- Trial habis tanpa bayar → tenant **turun ke Free** (bukan blokir total), agar data aman & funnel terjaga.
- Notifikasi menjelang & saat trial berakhir.

---

## 6. Siklus Billing & Invoice

```
awal periode ──▶ hitung tagihan (PEPM × seat / flat)
             ──▶ terbitkan invoice
             ──▶ tagih (payment gateway)
                   ├─ sukses → active, periode lanjut
                   └─ gagal  → past_due → retry → (grace habis) suspend
```

| Entitas | Fungsi |
|---|---|
| **Invoice** | Tagihan satu periode (jumlah, pajak, status) |
| **Payment** | Pembayaran atas invoice |
| **Adjustment** | Koreksi (refund, diskon, proration) |

Status tenant `suspended` dipicu dari sini (via modul Tenant) saat grace habis.

---

## 7. Proration (Perubahan Tengah Periode)

- **Upgrade** → hitung selisih pro-rata sisa periode; tagih segera / masuk invoice berikutnya.
- **Downgrade** → berlaku periode berikutnya (hindari refund rumit) atau beri kredit.
- **Perubahan seat (PEPM)** → sesuaikan di invoice berikutnya (tentukan kebijakan: rata-rata / nilai akhir).

---

## 8. Integrasi Pembayaran

- Terhubung ke payment gateway (VA, transfer, kartu) via modul integrasi/eksternal.
- Webhook pembayaran memperbarui status invoice & subscription.
- Semua transaksi tercatat untuk audit & rekonsiliasi.

> Dokumen menetapkan mekanisme; tarif & pajak (mis. PPN) mengikuti kebijakan final.
