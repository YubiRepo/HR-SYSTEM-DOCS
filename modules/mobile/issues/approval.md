<!-- 📁 modules/mobile/issues/approval.md -->
# Issues Backend — Approval

Kekurangan endpoint modul **Approval** di [API docs](../api/README.md) yang ditemukan saat integrasi aplikasi mobile. Tiap issue mengacu ke endpoint yang terdokumentasi dan dicek langsung ke server (akun karyawan `budi@gmail.com`, admin `nurdiansyah@gmail.com`, 11 Nov 2026). Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [APR-1](#apr-1) | Butuh contoh data & bentuk respons inbox approval | P3 | Open |

---

### APR-1
**Butuh contoh data & bentuk respons inbox approval** · P3 · `Open`

- **Endpoint:** `GET /approval/inbox` (List My Approval Inbox) → `data: []` untuk admin; dokumen belum mencantumkan contoh respons.
- **Kebutuhan:** app ingin memakai inbox ini menggantikan `GET /leave/requests?status=pending`. Mohon contoh respons item inbox (jenis dokumen, id, pengaju, step, aksi) dan seed data contoh.
- **Catatan BE:** —
