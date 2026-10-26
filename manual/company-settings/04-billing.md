# 04 · Billing

Menampilkan langganan perusahaan: paket yang aktif, fitur & kuota yang
didapat, riwayat invoice, serta pengiriman bukti pembayaran manual.

**Akses:** `/tenants/settings/billing` (tab **Billing**) · **Permission:**
`billing:read` (lihat), `billing:write` (kirim bukti bayar),
`entitlement:manage` (ubah paket)

## Tampilan

<!-- ui-mock: company-billing -->
```html
<div aria-label="Mockup Billing" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;color:#bfdbfe">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="flex:1;min-height:120px"></div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Company Settings</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Company Settings</div>
    <div style="display:flex;gap:4px;padding:6px 16px;border-bottom:1px solid #e4e4e7;background:#fff;font-size:12px">
      <span style="padding:6px 10px">Overview</span><span style="padding:6px 10px">Branches</span><span style="padding:6px 10px">Common Codes</span>
      <span style="padding:6px 10px;border-radius:6px;background:#f4f4f5;color:#2563eb;font-weight:600">Billing</span>
      <span style="padding:6px 10px">Users</span><span style="padding:6px 10px">Roles &amp; Permissions</span>
    </div>
    <div style="padding:18px 20px">
      <section style="border:1px solid #e4e4e7;background:#fff;border-radius:18px;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-weight:800;font-size:15px">✨ Business <span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:11px">Active</span> <span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:11px">MONTHLY</span></div>
            <div style="color:#71717a;font-size:11px;margin-top:3px">Periode berjalan: <b>1/11/2026</b> s/d <b>30/11/2026</b></div>
          </div>
          <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">Ubah Paket</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">
          <div style="border:1px solid #e4e4e7;background:#fafafa;border-radius:12px;padding:10px"><div style="color:#71717a;font-size:11px">Kursi Aktif</div><div style="font-weight:800;font-family:monospace">120</div></div>
          <div style="border:1px solid #e4e4e7;background:#fafafa;border-radius:12px;padding:10px"><div style="color:#71717a;font-size:11px">Tarif</div><div style="font-weight:800;font-family:monospace">Rp 25.000/karyawan/bln</div></div>
          <div style="border:1px solid #e4e4e7;background:#fafafa;border-radius:12px;padding:10px"><div style="color:#71717a;font-size:11px">Estimasi Tagihan</div><div style="font-weight:800;font-family:monospace">Rp 3.000.000 / bln</div></div>
        </div>
      </section>
      <section style="border:1px solid #e4e4e7;background:#fff;border-radius:18px;padding:16px;margin-top:12px">
        <div style="font-weight:800">🛡 Features &amp; quotas</div>
        <div style="color:#71717a;font-size:11px">What your current subscription grants — frozen for this period, refreshed on plan change or renewal.</div>
        <div style="margin-top:8px;font-size:11px;color:#52525b;font-weight:600">Included features</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:11px">Attendance</span><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:11px">Leave</span><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:11px">Overtime</span><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:11px">Payroll</span></div>
        <div style="margin-top:10px;font-size:11px;color:#52525b;font-weight:600">Quotas &amp; usage</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px"><span>Employees</span><span style="font-family:monospace">98 / 120</span></div>
        <div style="height:6px;border-radius:999px;background:#e4e4e7;margin-top:4px"><div style="width:82%;height:6px;border-radius:999px;background:#2563eb"></div></div>
      </section>
      <section style="border:1px solid #e4e4e7;background:#fff;border-radius:18px;padding:16px;margin-top:12px">
        <div style="font-weight:800">🧾 Riwayat Invoice</div>
        <div style="margin-top:8px;border:1px solid #e4e4e7;border-radius:10px;overflow:hidden">
          <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr 0.7fr 30px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600"><div style="padding:8px 10px">Invoice</div><div style="padding:8px 10px">Periode</div><div style="padding:8px 10px">Jumlah</div><div style="padding:8px 10px">Jatuh Tempo</div><div style="padding:8px 10px">Status</div><div></div></div>
          <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center"><div style="padding:8px 10px;font-family:monospace;font-weight:700;font-size:11px">INV-2026-11-0042</div><div style="padding:8px 10px;color:#71717a">2026-11</div><div style="padding:8px 10px;font-family:monospace;font-weight:700">Rp 3.000.000</div><div style="padding:8px 10px;font-family:monospace;color:#71717a">10/11/2026</div><div style="padding:8px 10px"><span style="background:#e0f2fe;color:#0369a1;border-radius:6px;padding:1px 8px;font-size:10px">Open</span></div><div style="color:#71717a">⋯</div></div>
          <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr 0.7fr 30px;align-items:center"><div style="padding:8px 10px;font-family:monospace;font-weight:700;font-size:11px">INV-2026-10-0031</div><div style="padding:8px 10px;color:#71717a">2026-10</div><div style="padding:8px 10px;font-family:monospace;font-weight:700">Rp 2.950.000</div><div style="padding:8px 10px;font-family:monospace;color:#71717a">10/10/2026</div><div style="padding:8px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Paid</span></div><div></div></div>
        </div>
      </section>
    </div>
  </main>
</div>
```
<!-- /ui-mock -->

> **Prompt gambar:** "Ubah HTML di dalam blok `ui-mock` menjadi screenshot UI
> aplikasi HR backoffice yang realistis dan utuh: render semua elemen persis
> seperti tertulis, pertahankan layout, warna, dan teks. Gunakan data nyata
> bergaya perusahaan Indonesia. Latar terang, sudut membulat, bayangan halus.
> Keluarkan sebagai satu gambar."

Halaman terdiri dari empat bagian, dari atas ke bawah.

### 1. Paket langganan

| Elemen | Fungsi |
|---|---|
| Nama paket + badge | Status langganan (**Active**, **Trialing**, **Past Due**, **Canceled**) dan siklus tagihan (mis. **MONTHLY**) |
| **Periode berjalan** | Tanggal mulai s/d akhir periode tagihan saat ini |
| **Ubah Paket** | Buka modal ubah paket (hanya tampil bila punya `entitlement:manage`) |
| **Kursi Aktif** | Jumlah kursi (seat) yang dibayar |
| **Tarif** | Harga paket: per karyawan per bulan, per bulan, *Rp 0*, atau *Custom* |
| **Estimasi Tagihan** | Tarif × kursi (hanya untuk paket per karyawan) |
| **Trial Berakhir** | Tanggal akhir masa trial (bila sedang trial) |

Bila belum berlangganan muncul *Belum ada langganan aktif.*

### 2. Features & quotas

Fitur yang termasuk dalam paket (**Included features**) dan pemakaian kuota
(**Quotas & usage**, mis. *98 / 120* dengan bilah progres; *Unlimited* bila tanpa
batas, *Not included* bila tidak termasuk paket).

> **Penting:** Bila langganan lewat jatuh tempo, muncul peringatan
> **Read-only: subscription lapsed** — data tetap bisa dilihat, tetapi perubahan
> diblokir sampai langganan diperpanjang. Bila tidak ada langganan sama sekali:
> **No active subscription** — modul tidak tersedia sampai paket diaktifkan.

### 3. Riwayat Invoice

Tabel invoice yang terbit otomatis setiap siklus tagihan: **Invoice**,
**Periode**, **Jumlah**, **Jatuh Tempo**, **Status** (**Open**, **Paid**,
**Draft**, **Void**, **Uncollectible**). Invoice berstatus **Open** punya aksi
**⋯ → Bayar (Kirim Bukti)**.

### 4. Riwayat Pembayaran Saya

Pembayaran manual yang sudah dikirim: **Invoice**, **Jumlah**, **Bukti** (tautan
*Lihat bukti*), **Waktu**, **Status** (**Pending**, **Succeeded**, **Failed**,
**Refunded**), dan **Catatan Review** dari tim billing.

## Modal Ubah Paket Langganan

*"Tetapkan paket, siklus penagihan, dan jumlah kursi (seat) untuk perusahaan
Anda."* Disertai info **Limit & Entitlement Dihitung Ulang** — kuota dan fitur
langsung mengikuti paket baru.

| Field | Wajib | Catatan |
|---|---|---|
| **Paket Langganan (Plan)** | Ya | Pilih dari daftar paket |
| **Siklus Penagihan** | Ya | Mis. *MONTHLY (1 bulan)*, *YEARLY (12 bulan, diskon 10%)* |
| **Jumlah Kursi (Seat)** | Ya | Minimal 1 |
| **Proration** | — | Sakelar: tandai sebagai penyesuaian pro-rata pada siklus berjalan |

Tombol: **Batal** / **Terapkan Perubahan Langganan**.

## Modal Bayar Invoice (Manual)

*"Unggah bukti pembayaran untuk invoice yang sedang berjalan. Tim billing akan
memverifikasi sebelum invoice ditandai lunas."*

| Field | Wajib | Catatan |
|---|---|---|
| **Invoice** | — | Terisi otomatis |
| **Jumlah Dibayar (IDR)** | Ya | Nominal transfer |
| **Metode Transfer** | — | Tetap *Transfer* |
| **Bukti Pembayaran** | Ya | Klik/seret file; JPG, PNG, WEBP, atau PDF |
| **Catatan (opsional)** | Tidak | Nomor referensi transfer, nama bank pengirim, dll. |

Tombol: **Batal** / **Kirim Bukti Pembayaran**. Pembayaran tercatat sebagai
**Pending** sampai diverifikasi tim billing.

## Langkah — Membayar Invoice

1. Buka **Company Settings → Billing**.
2. Pada invoice berstatus **Open**, klik **⋯ → Bayar (Kirim Bukti)**.
3. Isi **Jumlah Dibayar**, unggah **Bukti Pembayaran**, tambahkan catatan.
4. Klik **Kirim Bukti Pembayaran**.
5. Pantau status di **Riwayat Pembayaran Saya**; setelah disetujui, invoice
   berubah menjadi **Paid**.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/settings/billing.vue` |
| Modal | `HR-SYSTEM-BACKOFFICE/app/components/billing/MySubscriptionModal.vue`, `PayInvoiceManualModal.vue` |
| Label status | `HR-SYSTEM-BACKOFFICE/app/components/billing/billingStatus.ts` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useMyBilling.ts` |
| Modul | `modules/platform/billing/**`, `modules/platform/entitlement/**` |
