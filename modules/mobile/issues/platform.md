<!-- 📁 modules/mobile/issues/platform.md -->
# Issues Backend — Platform & Langganan

Temuan modul **Platform / Entitlement** saat integrasi aplikasi mobile. Dicek ke server (`192.168.1.29:8111`) dan kode `HR-SYSTEM-API` (`a51daf4`, 26 Nov 2026). Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [PLAT-1](#plat-1) | Trial habis diam-diam → semua tulis ditolak `SUBSCRIPTION_READ_ONLY` | P2 | `Perlu keputusan` |
| [PLAT-2](#plat-2) | Tidak ada cara perpanjang trial tanpa mengubah status jadi `active` | P3 | `Perlu keputusan` |

---

### PLAT-1
**Trial habis diam-diam → semua tulis ditolak `SUBSCRIPTION_READ_ONLY`** · P2 · `Perlu keputusan`

- **Temuan (25 Nov 2026):** trial **PT Nurdiansyah** berakhir 18 Nov dan **PT Yubi Techno Craft** 25 Nov (siang). Setelah itu `access_mode: read_only`: clock-in, koreksi, pengajuan cuti/lembur, SPL ditolak `402 SUBSCRIPTION_READ_ONLY` dengan pesan bahasa Inggris. Tidak ada peringatan sebelumnya ke admin maupun karyawan.
- **Dampak:** di tenant demo/testing, tim mengira app error (*"absen di akun Nurdi error"*). Di tenant nyata, karyawan tiba-tiba tidak bisa absen.
- **Di app (25 Nov 2026):** pesan error diterjemahkan; Dashboard menampilkan banner *"Langganan perusahaan berakhir"* dari `GET /entitlement/me` (`access_mode`).
- **Pertanyaan / usulan:**
  1. Absen (clock-in/out) dikecualikan dari read-only selama masa grace (`grace_ends_at`), agar data kehadiran tidak bolong?
  2. Notifikasi ke tenant admin H-7 / H-1 sebelum trial / periode habis.
  3. Tenant demo/testing diberi trial panjang atau plan khusus yang tidak kedaluwarsa.
- **Keputusan:** (26 Nov 2026) **belum diputuskan.** Opsi yang diusulkan: notifikasi H-7/H-1, absen tetap jalan selama grace, endpoint *extend trial*, plan demo tanpa kedaluwarsa.
- **Catatan BE:** —

### PLAT-2
**Tidak ada cara perpanjang trial tanpa mengubah status jadi `active`** · P3 · `Perlu keputusan`

- **Endpoint:** `POST /platform/tenants/{id}/subscription` (Change Tenant Subscription), satu-satunya cara memperpanjang.
- **Temuan (kode `subscription_management.go` → `Subscription.ChangePlan`):** bila status `trialing`, otomatis menjadi `active` dan `trial_ends_at` dihapus. Tidak ada endpoint *extend trial*.
- **Kejadian (25 Nov 2026):** untuk melanjutkan testing, langganan **PT Nurdiansyah** dan **PT Yubi Techno Craft** diperpanjang s/d **31 Des 2026** lewat endpoint ini (akun platform admin), sehingga statusnya kini `active` (tanpa invoice / tagihan; tercatat di audit log platform).
- **Usulan:** endpoint / opsi *extend trial* (mis. `trial_ends_at` baru) yang mempertahankan status `trialing`.
- **Keputusan:** (26 Nov 2026) **belum diputuskan.** Opsi yang diusulkan: notifikasi H-7/H-1, absen tetap jalan selama grace, endpoint *extend trial*, plan demo tanpa kedaluwarsa.
- **Catatan BE:** —
