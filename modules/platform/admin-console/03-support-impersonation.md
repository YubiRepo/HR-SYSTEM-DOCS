# 03 · Support & Impersonation

## 1. Support Tools

| Alat | Fungsi |
|---|---|
| **Tenant inspector** | Lihat status, plan, subscription, entitlement tenant |
| **Usage viewer** | Pemakaian vs limit (mendekati batas?) |
| **Invoice & payment** | Riwayat tagihan & pembayaran (baca dari Billing) |
| **Action log** | Jejak aksi admin/tenant untuk diagnosa |
| **Manual adjustment** | Kredit, perpanjang trial, override limit (teraudit) |

Manual adjustment yang menyentuh billing/entitlement dieksekusi lewat modul terkait (Billing), tetapi dipicu & dicatat dari sini.

---

## 2. Impersonation (Login-as / Support Access)

Support Agent dapat "masuk sebagai" tenant untuk membantu — fitur kuat yang **wajib dijaga ketat**.

**Aturan wajib:**
1. **Consent/kebijakan jelas** — sesuai perjanjian layanan & privasi.
2. **Scoped** — akses terbatas (mis. read-only, atau modul tertentu).
3. **Time-boxed** — sesi kedaluwarsa otomatis.
4. **Selalu teraudit** — siapa, tenant apa, kapan, berapa lama, aksi apa.
5. **Banner jelas** — indikator sedang mode impersonation.
6. **Tidak menyentuh kredensial** — tak pernah melihat/menyimpan password pengguna.

```
Support → mulai impersonation(tenant, alasan, scope, durasi)
        → Auth terbitkan token act_as (time-boxed)
        → sesi berjalan (semua aksi teraudit)
        → selesai/expired → token dicabut, audit ditutup
```

Teknis token mengikuti modul Auth (klaim `act_as`, masa berlaku pendek).

---

## 3. Batasan Impersonation

- Default **read-only**; akses tulis butuh justifikasi & peran lebih tinggi.
- Aksi sangat sensitif (mis. hapus data tenant) **tidak** boleh via impersonation.
- Durasi maksimum dibatasi (mis. 30–60 menit) & dapat dihentikan manual.
