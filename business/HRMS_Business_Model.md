# HRMS Business Model
## Yubiteck — HR Management System

| | |
|---|---|
| **Dokumen** | Business Model — HRMS |
| **Versi** | 1.0 |
| **Tanggal** | 9 Agustus 2026 |
| **Target Pasar** | Semua segmen (UMKM, Menengah, Enterprise) |
| **Produk** | HRMS SaaS + Kustomisasi |

---

## 1. Ringkasan

Yubiteck menyasar **semua segmen** — dari UMKM hingga enterprise — dengan satu produk HRMS yang scalable. Karena rentang pelanggannya lebar, model bisnisnya **tidak tunggal**, melainkan kombinasi beberapa model yang saling melengkapi: langganan SaaS sebagai tulang punggung, modular add-on untuk fleksibilitas, dan layer services untuk kebutuhan kustomisasi/enterprise.

Dokumen ini memetakan model-model yang ada, kelebihan/kekurangannya, lalu memberi rekomendasi kombinasi untuk Yubiteck.

---

## 2. Peta Model Bisnis

Ringkasan model yang relevan untuk produk HRMS:

| Model | Cara Kerja | Sumber Pendapatan |
|---|---|---|
| **SaaS Subscription** | Host di cloud, multi-tenant, bayar rutin | Recurring (bulanan/tahunan) |
| **Modular / à la carte** | Bayar per modul yang dipakai | Recurring per modul |
| **Freemium** | Versi gratis terbatas + upgrade berbayar | Konversi ke berbayar |
| **Hybrid SaaS + Services** | Langganan + biaya implementasi/kustomisasi | Recurring + one-time/project |
| **On-Premise / License** | Install di server klien, lisensi + maintenance | One-time + maintenance tahunan |

---

## 3. Rincian Tiap Model

### 3.1 SaaS Subscription
Model paling umum untuk HRMS. Aplikasi di-host Yubiteck, semua pelanggan pakai sistem yang sama (multi-tenant).

**Varian skema harga:**
| Skema | Basis | Cocok Untuk |
|---|---|---|
| Per employee/month (PEPM) | Per karyawan aktif | HRMS umum — naik-turun ikut ukuran klien |
| Per user/month | Per user yang login | Bila tak semua karyawan pakai sistem |
| Tiered/flat plan | Paket Basic/Pro/Enterprise | Klien yang mau harga pasti |

**Kelebihan:** pendapatan berulang & prediktable, mudah di-scale, update terpusat.
**Kekurangan:** butuh infrastruktur cloud andal, biaya akuisisi pelanggan di awal.

### 3.2 Modular / À la carte
Klien bayar hanya untuk modul yang dipakai. Core HR jadi basis wajib, sisanya add-on.

| Modul | Posisi |
|---|---|
| Core HR | Basis (wajib) |
| Payroll | Add-on |
| Attendance & Leave | Add-on |
| Recruitment / ATS | Add-on |
| Performance Management | Add-on |

**Kelebihan:** cocok dengan arsitektur modular HRMS, entry point murah untuk UMKM, upsell natural.
**Kekurangan:** manajemen paket lebih kompleks, perlu kontrol dependensi antar modul.

### 3.3 Freemium
Versi gratis terbatas (mis. Core HR untuk tim kecil), lalu upgrade untuk fitur lanjutan/skala lebih besar.

**Kelebihan:** akuisisi pasar UMKM cepat, funnel pelanggan besar.
**Kekurangan:** butuh basis pengguna sangat besar agar konversi menutup biaya, beban support pengguna gratis.

### 3.4 Hybrid SaaS + Services
Menggabungkan langganan SaaS (recurring) dengan pendapatan jasa: implementasi, kustomisasi, migrasi data, training, dan support.

**Sumber pendapatan:**
| Jenis | Sifat |
|---|---|
| Langganan SaaS | Recurring |
| Implementasi & onboarding | One-time |
| Kustomisasi & integrasi | Project-based |
| Training & support premium | One-time / berkala |

**Kelebihan:** paling pas untuk pasar enterprise Indonesia yang sering minta penyesuaian; pendapatan lebih beragam.
**Kekurangan:** komponen services sulit di-scale (butuh tim), margin services lebih rendah dari SaaS murni.

### 3.5 On-Premise / License
Klien beli lisensi & install di server sendiri, bayar maintenance tahunan.

**Kelebihan:** relevan untuk instansi/perusahaan dengan kebijakan data harus on-premise.
**Kekurangan:** tren pasar bergeser ke cloud, deployment & maintenance lebih berat, sulit di-scale.

---

## 4. Kecocokan Model per Segmen

| Segmen | Kebutuhan Khas | Model yang Pas |
|---|---|---|
| **UMKM (<50)** | Murah, cepat pakai, fitur inti | Freemium / SaaS PEPM tier rendah + Core HR |
| **Menengah (50–500)** | Beberapa modul, sedikit penyesuaian | SaaS PEPM + modular add-on |
| **Enterprise (500+)** | Modul lengkap, kustomisasi, integrasi | Hybrid SaaS + Services (opsi on-premise) |

---

## 5. Model Bisnis Terpilih (Keputusan)

Diputuskan: **Freemium + Tiered Subscription (PEPM)** dengan **feature + capacity gating**, ditopang **services** untuk enterprise. Positioning: menang lewat **kelengkapan fitur (value)**, bukan harga termurah.

| Komponen | Keputusan | Peran |
|---|---|---|
| **Basis harga** | Per employee/month (PEPM) | Pendapatan tumbuh mengikuti ukuran pelanggan |
| **Batas billing** | Per tenant (perusahaan) | 1 perusahaan = 1 tagihan (selaras Tenancy Model) |
| **Pembeda tier** | Kombinasi fitur + kapasitas | Upgrade karena butuh fitur *dan* karena tumbuh |
| **Akuisisi** | Free selamanya (kecil) + trial Pro | Pintu masuk UMKM |
| **Enterprise** | Custom plan + services | Nilai kontrak terbesar |

### Logika strategis
1. UMKM masuk lewat **Free** (Core HR, batas karyawan kecil) — data nyangkut, HRMS bersifat sticky.
2. Tumbuh melewati batas / butuh Payroll → **upgrade ke Pro** (Payroll sengaja ditaruh di Pro sebagai pendorong upgrade).
3. Kebutuhan kustomisasi/integrasi → **Enterprise** + services.

---

## 6. Plan Configurable (Plan · Benefit · Feature · Limit)

Agar bisnis fleksibel, tier **tidak di-hardcode**. Plan adalah **data** yang dirakit dari komponen, dikelola lewat Backoffice — plan baru/promo bisa dibuat tanpa mengubah kode.

### Empat istilah kunci

| Istilah | Bahasa | Arti | Contoh |
|---|---|---|---|
| **Plan** | Komersial | Paket yang dijual | Free, Starter, Pro, Enterprise |
| **Benefit** | Marketing | Nilai yang dirasakan pelanggan | "Hitung gaji otomatis PPh21 & BPJS" |
| **Feature** | Sistem | Kemampuan teknis (on/off) | `payroll`, `sso`, `recruitment` |
| **Limit** | Sistem | Batas kapasitas (angka) | max karyawan, max cabang |

**Hubungannya:** Plan menawarkan **Benefit** → Benefit diwujudkan oleh satu/lebih **Feature** → Feature & tenant dibatasi **Limit**.

```
PLAN (Free · Starter · Pro · Enterprise · + Custom)
  │
  ├── BENEFIT ──▶ FEATURE            (on/off: payroll, sso, recruitment)
  │                 └── limit per-fitur (opsional): max slip/bulan, max lowongan
  │
  └── GLOBAL LIMIT                   (kapasitas tenant: max karyawan, max cabang, storage)
        │ dilanggan oleh
        ▼
TENANT → Plan (+ override per-tenant bila perlu)
```

### Dua macam Limit

| Macam | Milik | Contoh | Peran |
|---|---|---|---|
| **Global limit** | Tenant (lintas fitur) | max karyawan, max cabang, storage | **Pendorong upgrade utama** (capacity gating) |
| **Limit per-fitur** | Fitur tertentu | max slip gaji/bulan, max lowongan aktif | Kuota spesifik; hanya berlaku bila fitur aktif |

> Gating utama mengandalkan **global limit** — terutama *max karyawan* & *max cabang* (selaras Tenancy 2-level & billing per tenant). Limit per-fitur bersifat pelengkap, dipakai seperlunya.

**Keuntungan model ini:**
- Plan baru/promo dibuat dari Backoffice tanpa deploy.
- **Custom plan per tenant** untuk nego enterprise (mis. "Pro + SSO tanpa Recruitment").
- **Pengecekan seragam** di semua modul: cek "punya Feature X?" & "lewat Limit Y?" — bukan cek nama Plan.
- **Override per tenant** untuk goodwill/promo (mis. naikkan limit sementara).

---

## 7. Contoh Isi Plan

Contoh ilustratif (Feature & Limit dapat dikonfigurasi ulang; angka hanya contoh, harga menyusul analisis pasar). Baris **Benefit** = bahasa pelanggan; baris **Feature/Limit** = bahasa sistem.

| | **Free** | **Starter** | **Pro** ⭐ | **Enterprise** |
|---|---|---|---|---|
| **Sasaran** | Coba-coba / mikro | UMKM | Menengah–besar | Korporat |
| **Harga** | Gratis selamanya | PEPM rendah | PEPM standar | Custom (nego) |
| *Feature:* Core HR | ✅ | ✅ | ✅ | ✅ |
| *Feature:* Attendance & Leave | — | ✅ | ✅ | ✅ |
| *Feature:* Payroll (PPh21, BPJS) | — | — | ✅ | ✅ |
| *Feature:* Performance | — | — | ✅ | ✅ |
| *Feature:* Recruitment/ATS | — | — | ✅ | ✅ |
| *Feature:* SSO (OIDC/SAML) | — | — | — | ✅ |
| *Feature:* Custom report & integrasi | — | — | terbatas | ✅ penuh |
| *Feature:* Kustomisasi & services | — | — | — | ✅ |
| *Global limit:* Max karyawan | 15 | 50 | 500 | unlimited |
| *Global limit:* Max cabang | 1 | 3 | multi | unlimited |
| **Support** | Community | Email | Priority | Dedicated + SLA |
| **Trial Pro** | ✅ 14–30 hari | ✅ | — | — |
| **Custom report & integrasi** | — | — | terbatas | ✅ penuh |
| **Kustomisasi & services** | — | — | — | ✅ |
| **Trial Pro** | ✅ 14–30 hari | ✅ | — | — |

**Cara membaca:**
- **Payroll di Pro** = pendorong upgrade utama (Feature "wajib" yang bikin orang mau bayar lebih).
- **Free** cukup untuk mikro-bisnis, tapi Global limit 15 karyawan & 1 cabang mendorong pertumbuhan ke berbayar.
- **Enterprise** membuka SSO, integrasi penuh, dan services — pintu kontrak besar.
- Semua baris Feature & Limit di atas dirakit dari komponen Plan — bisa digeser kapan saja tanpa deploy.

---

## 8. Pertimbangan Pendukung

| Aspek | Catatan |
|---|---|
| **Billing** | Sistem billing mendukung PEPM + plan configurable + proration + override per tenant |
| **Pengecekan akses** | Cek Feature & Limit seragam lintas modul (bukan cek nama Plan) — spec teknis di modul Backoffice |
| **Trial** | Trial Pro otomatis turun ke Free (bukan blokir total) saat habis, agar data tetap aman |
| **Kontrak** | Bulanan vs tahunan (diskon tahunan untuk retensi) |
| **Margin** | SaaS margin tinggi; services margin lebih rendah tapi mengunci klien enterprise |
| **Retensi** | HRMS sticky (data & proses terikat) — free tier memperkuat funnel |
| **Kepatuhan** | Payroll ID (PPh 21, BPJS) jadi nilai jual & pembeda; sengaja ditaruh di Pro |

---

*Strategi & struktur plan di dokumen ini menjadi acuan bisnis. Implementasi teknis (Feature, Limit, Plan, subscription, proration) dispesifikasikan di modul Platform/Backoffice. Angka harga final menyusul analisis biaya, kompetitor, dan willingness-to-pay per segmen.*