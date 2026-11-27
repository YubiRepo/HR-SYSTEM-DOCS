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

Cycle diatur per plan dari backoffice (form plan). Menghapus cycle **tidak** menghapus barisnya, hanya `is_active = false`: cycle itu tidak ditawarkan lagi untuk subscription baru, tetapi subscription yang sudah memakainya tetap di-renew dan di-invoice dengan cycle tersebut. Menambah lagi code yang sama mengaktifkan kembali baris lama.

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
| **Custom** | `custom_rate` (harga nego per bulan, disimpan di subscription) × bulan — **tanpa** diskon cycle | Plan privat |

Plan custom tidak punya rate katalog: harga nego per tenant diisi staff platform (`custom_rate`, wajib) saat assign/ubah subscription. Subscription custom tanpa `custom_rate` ditolak saat assign (`CUSTOM_RATE_REQUIRED`), dan tidak di-invoice (renewal dilewati) sampai rate diisi — tidak pernah ditagih Rp 0. Self-service tenant tidak bisa memilih plan custom.

Seat yang **ditagih** (PEPM) = `max(seat_count, plan.min_seats)` — `min_seats` diatur per plan (default 1). Provisioning tanpa trial: admin boleh mengisi perkiraan jumlah karyawan (`initial_seats`) untuk invoice periode pertama, karena tenant baru belum punya karyawan; invoice berikutnya memakai jumlah aktif sebenarnya.

`seat_count` bersumber dari Core HR (karyawan aktif tenant, minimal 1) dan dihitung ulang otomatis saat assign/ubah plan, saat *issue invoice now*, dan saat renewal — bukan input manual. Nilai `seat_count` di request hanya dipakai sebagai fallback bila hitungan Core HR tidak tersedia. Multi-year ditangani lewat plan custom/enterprise, atau sebagai cycle tambahan bila diperlukan.

---

## 5. Trial

- Mengikuti `trial_days` plan (mis. Pro 14–30 hari). Saat provisioning, `start_trial: false` melewati trial (subscription & tenant langsung `active`); tanpa field itu, ikut `trial_days` plan. Plan dengan `trial_days = 0` selalu tanpa trial.
- Selama trial: akses penuh sesuai plan, tidak ada invoice.
- **Memilih plan saat trial** (staff atau self-service): sisa trial **tetap berjalan**, tanggal akhir tidak diperpanjang, dan subscription ditandai `convert_after_trial`. Pengecualian, trial langsung berakhir dan periode berbayar mulai hari ini bila: `end_trial: true`, `period_end` kontrak diisi, atau pindah ke plan lain yang tidak punya trial (mis. custom/Enterprise). Mengonfirmasi plan yang sedang di-trial selalu mempertahankan sisa trial — tombol **"Continue after trial"** di halaman billing tenant dan di tenant detail (staff) melakukan ini.
- **Trial habis** (diproses di awal job harian `entitlement.subscription.renewal_check`, sebelum renewal):
  - sudah memilih plan (`convert_after_trial`) atau trial di plan default → menjadi `active` di plan itu; renewal di run yang sama langsung menerbitkan invoice periode pertama;
  - belum memilih plan → **turun ke plan default** (`is_default`, mis. Free) sebagai `active` mulai hari ini (bukan blokir total), agar data aman & funnel terjaga. Kuota tidak divalidasi saat turun: data yang ada tetap, hanya penambahan baru yang dibatasi;
  - tidak ada plan default aktif → tenant menjadi **`expired`** (read-only) sampai plan dipilih (ganti plan → `active`), atau sampai plan default diset (job berikutnya menurunkan ke plan default → `active`).
  - Selain kasus `expired`, status tenant berubah `trial` → `active`.
- Notifikasi menjelang & saat trial berakhir: **belum diimplementasikan** (ditunda).

---

## 6. Siklus Billing & Invoice

```
awal periode ──▶ hitung tagihan (PEPM × seat / flat)
             ──▶ terbitkan invoice
             ──▶ tagih (payment gateway)
                   ├─ sukses → active, periode lanjut
                   └─ gagal  → past_due → retry → (grace habis) suspend
```

Kapan invoice terbit:

| Kejadian | Invoice |
|---|---|
| Provisioning **tanpa** trial | Periode pertama, saat itu juga |
| Ganti plan / "end trial now" (periode baru mulai hari ini) | Periode baru, dalam transaksi yang sama (belum ada kredit proration sisa periode lama) |
| Memilih plan saat trial (trial tetap jalan) | Tidak ada; ditagih saat trial habis |
| Trial habis & dikonversi | Periode pertama berbayar, oleh renewal di run job yang sama |
| Renewal (akhir periode) | Periode berikutnya |
| Total Rp 0 (mis. Free) | Tidak pernah diterbitkan — invoice Rp 0 yang open tidak akan dibayar dan akan memicu dunning |

| Entitas | Fungsi |
|---|---|
| **Invoice** | Tagihan satu periode (jumlah, pajak, status) |
| **Payment** | Pembayaran atas invoice |
| **Adjustment** | Koreksi (refund, diskon, proration) |

### Jatuh tempo & dunning

- **Jatuh tempo** = tanggal invoice terbit + `BILLING_PAYMENT_TERM_DAYS` (default **0** = bayar di muka, jatuh tempo hari itu juga). Dulu jatuh tempo = akhir periode yang ditagih, sehingga tenant memakai satu periode penuh sebelum dianggap telat.
- Job dunning harian (03:00): invoice `open` lewat jatuh tempo → subscription `past_due`; lewat jatuh tempo + `BILLING_GRACE_PERIOD_DAYS` (default 7) → tenant di-suspend dengan `suspension_kind = nonpayment`. Dengan default, tenant yang tidak bayar ter-suspend di hari ke-8.
- **Pembayaran** (webhook / approve bukti manual):
  - subscription `past_due` → `active` hanya bila **tidak ada lagi** invoice yang lewat jatuh tempo;
  - tenant diaktifkan lagi hanya bila suspend-nya `nonpayment` **dan** tidak ada lagi invoice yang lewat grace — supaya tidak bolak-balik suspend/aktif;
  - suspend **manual** (keputusan admin) tidak pernah terangkat oleh pembayaran; hanya admin yang bisa reactivate.

### Renewal & status tenant

| Status tenant | Renewal menerbitkan invoice? |
|---|---|
| `active` / `trial` | Ya |
| `suspended` (`nonpayment`) | Ya — tunggakan tetap bertambah |
| `suspended` (`manual`) | Tidak — dilewati sampai admin mengaktifkan lagi |
| `terminated` | Tidak — subscription dibatalkan saat terminate |

**Suspend manual = pause.** Saat admin mengaktifkan kembali tenant yang di-suspend manual, `period_end` subscription diperpanjang sepanjang masa suspend (`tenants.suspended_at` → saat reactivate), bila periode itu masih berjalan saat suspend dimulai. Hari yang sudah dibayar tidak hilang, hari selama suspend tidak ditagih. Sebagai pengaman, bila renewal tetap tertinggal lebih dari satu periode penuh, periode baru dimulai hari itu (tidak ditagih mundur).

---

## 7. Proration (Perubahan Tengah Periode)

Berlaku untuk subscription di periode berbayar yang berjalan (`active`/`past_due`, bukan trial, tanpa `period_end` kontrak). Plan lama dan baru dihitung dengan seat saat ini lalu dibandingkan **per bulan** (termasuk diskon cycle):

| Perubahan | Perilaku |
|---|---|
| Plan & cycle sama | Hanya seat/custom rate yang diperbarui; perubahan terjadwal dibatalkan; tanpa invoice |
| **Lebih murah per bulan (downgrade)** | **Dijadwalkan** (`pending_plan_id`, `pending_billing_cycle`, `pending_custom_rate`) dan diterapkan oleh renewal di akhir periode — harga, invoice & snapshot benefit periode berikutnya memakai plan baru. Tanpa refund. Bisa dibatalkan (`…/subscription/scheduled-change/cancel`) |
| **Sama/lebih mahal, cycle sama (upgrade)** | Berlaku **sekarang**, `period_end` tetap. Invoice `kind = proration` sebesar `baru × sisa/total hari − lama × sisa/total hari` |
| **Sama/lebih mahal, cycle beda** | Periode baru mulai sekarang. Invoice `proration` = periode baru penuh − kredit sisa periode lama |

Invoice lama tetap berlaku (dibayar/terutang penuh); kredit di invoice proration yang mengimbangi bagian yang tidak terpakai. Hari dihitung utuh (sisa hari dibulatkan ke atas). Bila hasil bersih ≤ 0 tidak ada invoice.

- **Perubahan seat (PEPM) di tengah periode** → tidak diprorata; jumlah karyawan aktif dipakai di invoice berikutnya (renewal).
- `period_end` kontrak (staff) tetap memulai periode kontrak baru yang ditagih penuh, tanpa kredit.

---

## 8. Integrasi Pembayaran

- Terhubung ke payment gateway (VA, transfer, kartu) via modul integrasi/eksternal.
- Webhook pembayaran memperbarui status invoice & subscription.
- Semua transaksi tercatat untuk audit & rekonsiliasi.

> Dokumen menetapkan mekanisme; tarif & pajak (mis. PPN) mengikuti kebijakan final.

---

## 9. Pembayaran Manual (Kirim Bukti)

Sebelum payment gateway & object storage (S3) tersedia, tenant membayar via
transfer dan **mengirim bukti berupa URL dokumen**:

1. Invoice terbit (scheduler atau `generate-now`) dengan status `open`.
2. Tenant submit bukti → `POST /billing/invoices/{id}/payments/manual`
   (amount, `proof_url`, catatan) → payment `pending`, method `transfer`.
3. Staff platform memverifikasi di halaman Payments:
   - **Approve** → payment `succeeded`, invoice `paid`, subscription
     `past_due`→`active`, tenant ter-suspend ikut diaktifkan kembali.
   - **Reject** → payment `failed`, invoice tetap `open` (tenant bisa
     submit ulang).
4. Setiap langkah (submit/approve/reject) tercatat di audit log.

Ketika S3/integrasi gateway tersedia nanti, `proof_url` diganti upload file
dan status `pending` bisa jadi otomatis via webhook — alur ini tetap valid
sebagai jalur manual/offline.
