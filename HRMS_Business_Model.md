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

## 5. Rekomendasi untuk Yubiteck

Karena Yubiteck menyasar **semua segmen**, model tunggal tidak cukup. Rekomendasi: **kombinasi tiga lapis** yang mengikuti perjalanan pelanggan dari kecil ke besar.

| Lapis | Model | Peran |
|---|---|---|
| **1. Basis** | SaaS Subscription (PEPM) | Tulang punggung pendapatan berulang, scalable lintas segmen |
| **2. Fleksibilitas** | Modular add-on | Entry murah untuk UMKM, upsell natural ke menengah |
| **3. Enterprise** | Services (kustomisasi, integrasi, implementasi) | Menangkap kebutuhan enterprise & memperbesar nilai kontrak |

**Opsional pelengkap:**
- **Freemium/free trial** sebagai pintu akuisisi UMKM menuju paket berbayar.
- **Opsi on-premise/private cloud** khusus klien dengan syarat kedaulatan data.

**Logika strategisnya:**
1. UMKM masuk lewat trial/freemium atau tier rendah dengan Core HR.
2. Saat tumbuh, mereka menambah modul (Payroll, Attendance, dst) — pendapatan naik tanpa ganti sistem.
3. Enterprise membayar langganan penuh + services kustomisasi — nilai kontrak terbesar.

Dengan begini, satu produk melayani seluruh spektrum pasar, dan pendapatan Yubiteck tumbuh seiring pertumbuhan pelanggannya.

---

## 6. Pertimbangan Pendukung

| Aspek | Catatan |
|---|---|
| **Billing** | Perlu sistem billing yang mendukung PEPM + add-on + proration |
| **Kontrak** | Bulanan vs tahunan (diskon tahunan untuk retensi) |
| **Margin** | SaaS margin tinggi; services margin lebih rendah tapi mengunci klien |
| **Retensi** | Fokus pada churn rendah — HRMS bersifat sticky (data & proses terikat) |
| **Kepatuhan** | Payroll ID (PPh 21, BPJS) jadi nilai jual & pembeda di pasar lokal |

---

*Dokumen ini adalah kerangka model bisnis. Angka pricing spesifik dapat disusun terpisah setelah analisis biaya, kompetitor, dan willingness-to-pay per segmen.*
