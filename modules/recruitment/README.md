# Recruitment Module (ATS)

Modul rekrutmen (Applicant Tracking System) untuk HR Management System. Mengelola lowongan, kandidat, pipeline seleksi (configurable), evaluasi, offer, hingga konversi kandidat diterima menjadi karyawan di Core HR.

| | |
|---|---|
| **Modul** | Recruitment |
| **Versi** | 1.0 |
| **Sifat** | Modul HR operasional (hulu — pintu masuk karyawan) |
| **Dependensi** | Core HR (posisi, cabang, konversi karyawan), Entitlement, RBAC |
| **Memberi ke** | Core HR (kandidat hired → karyawan baru) |

---

## Ruang Lingkup

- **Lowongan (job posting)** — buka posisi, per cabang, publish
- **Kandidat (applicant)** — pelamar + CV/data + sumber
- **Pipeline seleksi** — tahapan configurable (screening → interview → offer → hired)
- **Evaluasi** — rating & catatan tiap tahap
- **Offer** — surat penawaran & statusnya
- **Konversi** — kandidat diterima → karyawan Core HR

**Di luar cakupan (untuk sekarang):** portal kandidat mandiri (pelamar punya akun lihat status) — disiapkan arsitekturnya, dibangun nanti. Onboarding pasca-hired ditangani Core HR.

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks (dokumen ini) |
| [`01-overview.md`](./01-overview.md) | Konsep, aktor, relasi modul |
| [`02-job-posting.md`](./02-job-posting.md) | Lowongan: buat, publish, per cabang |
| [`03-candidate-pipeline.md`](./03-candidate-pipeline.md) | Kandidat, pipeline configurable, evaluasi |
| [`04-offer-conversion.md`](./04-offer-conversion.md) | Offer & konversi ke karyawan (Core HR) |
| [`05-api-contract.md`](./05-api-contract.md) | Endpoint lowongan, kandidat, pipeline, offer |
| [`06-data-model.md`](./06-data-model.md) | Skema entitas recruitment |
| [`07-integration.md`](./07-integration.md) | Integrasi Core HR, multi-cabang, dll |

---

## Prinsip

1. **Configurable** — tahapan pipeline, sumber kandidat, form evaluasi = data per tenant.
2. **Nyambung Core HR** — konversi kandidat hired memakai jalur Pola A (`link_user_id`/create employee).
3. **Multi-cabang** — lowongan & kandidat ter-scope per cabang.
4. **Auditable** — perpindahan tahap & keputusan tercatat.
5. **Siap portal** — struktur data disiapkan agar portal kandidat mudah ditambah nanti.
6. **Berlapis Entitlement & RBAC** — fitur & scope dijaga.

---

## Referensi
- Posisi & konversi karyawan: [`../core-hr`](../core-hr/README.md)
- Peran & izin: [`../rbac`](../rbac/README.md)
- Gerbang fitur: [`../entitlement`](../entitlement/README.md)
