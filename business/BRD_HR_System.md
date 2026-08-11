# Business Requirements Document (BRD)
## HR Management System

| | |
|---|---|
| **Nama Dokumen** | BRD – HR Management System |
| **Versi** | 1.0 (Draft) |
| **Tanggal** | 9 Agustus 2026 |
| **Status** | Draft |
| **Pemilik Dokumen** | Tim HR / Project Sponsor |
| **Pendekatan Solusi** | Beli SaaS + Kustomisasi |

---

## 1. Pendahuluan

### 1.1 Latar Belakang
Perusahaan membutuhkan sistem HR terpusat untuk menggantikan proses manual (spreadsheet, dokumen tersebar) yang saat ini rawan error, lambat, dan sulit diaudit. Sistem dipilih berbasis **SaaS yang dikustomisasi** agar cepat diimplementasikan namun tetap fleksibel mengikuti proses bisnis internal.

### 1.2 Tujuan
- Menyatukan seluruh data karyawan dalam satu sumber (single source of truth).
- Mengotomasi proses payroll, absensi, cuti, rekrutmen, dan penilaian kinerja.
- Menyediakan self-service bagi karyawan dan approval berjenjang bagi manajer.
- Menghasilkan laporan dan dashboard HR yang akurat dan real-time.

### 1.3 Ruang Lingkup
**Termasuk:** Core HR, Payroll, Attendance & Leave, Recruitment/ATS, Performance Management.
**Tidak Termasuk:** Learning Management System (LMS), modul akuntansi keuangan penuh (hanya integrasi payroll ke finance).

### 1.4 Prinsip Desain — Skalabilitas
Sistem harus **fleksibel untuk skala kecil hingga besar**: mendukung mulai dari puluhan hingga ribuan karyawan tanpa perubahan arsitektur besar. Model lisensi dan konfigurasi harus bisa tumbuh mengikuti jumlah karyawan (modular per-modul, per-user pricing).

---

## 2. Pemangku Kepentingan (Stakeholders)

| Peran | Tanggung Jawab | Kepentingan Utama |
|---|---|---|
| Project Sponsor | Persetujuan anggaran & arah proyek | ROI, timeline |
| HR Manager | Pemilik proses bisnis HR | Akurasi data, efisiensi |
| Payroll Officer | Pengelola penggajian | Ketepatan hitung & pajak |
| IT / Admin | Konfigurasi & integrasi | Keamanan, uptime |
| Manajer Lini | Approval & review kinerja | Kemudahan approval |
| Karyawan | Pengguna self-service | Akses mudah, transparan |
| Vendor SaaS | Penyedia platform | Delivery & support |

---

## 3. Kebutuhan Bisnis per Modul

### 3.1 Core HR
| ID | Kebutuhan | Prioritas |
|---|---|---|
| CH-01 | Manajemen data master karyawan (biodata, kontrak, posisi, riwayat) | Must |
| CH-02 | Struktur organisasi & hierarki pelaporan yang dapat dikonfigurasi | Must |
| CH-03 | Manajemen dokumen karyawan (kontrak, sertifikat, KTP) | Must |
| CH-04 | Employee self-service (update data pribadi, unduh slip) | Must |
| CH-05 | Audit trail perubahan data | Should |
| CH-06 | Onboarding & offboarding workflow | Should |

### 3.2 Payroll
| ID | Kebutuhan | Prioritas |
|---|---|---|
| PY-01 | Perhitungan gaji otomatis (gaji pokok, tunjangan, potongan) | Must |
| PY-02 | Perhitungan pajak PPh 21 sesuai regulasi Indonesia | Must |
| PY-03 | Perhitungan BPJS Ketenagakerjaan & Kesehatan | Must |
| PY-04 | Generate & distribusi slip gaji digital | Must |
| PY-05 | Integrasi ke sistem finance / bank untuk pembayaran | Should |
| PY-06 | Riwayat payroll & laporan pajak (bukti potong) | Must |
| PY-07 | Konfigurasi komponen gaji fleksibel per grade/lokasi | Should |

### 3.3 Attendance & Leave
| ID | Kebutuhan | Prioritas |
|---|---|---|
| AT-01 | Pencatatan kehadiran (mobile/web check-in, geolocation) | Must |
| AT-02 | Integrasi mesin absensi / fingerprint (opsional) | Could |
| AT-03 | Manajemen shift & jadwal kerja | Should |
| AT-04 | Pengajuan & approval cuti berjenjang | Must |
| AT-05 | Saldo cuti otomatis sesuai kebijakan perusahaan | Must |
| AT-06 | Perhitungan lembur (overtime) | Should |
| AT-07 | Integrasi data absensi ke payroll | Must |

### 3.4 Recruitment / ATS
| ID | Kebutuhan | Prioritas |
|---|---|---|
| RC-01 | Manajemen lowongan (job posting) | Must |
| RC-02 | Database kandidat & pelacakan tahap seleksi (pipeline) | Must |
| RC-03 | Penjadwalan interview & notifikasi | Should |
| RC-04 | Scoring / evaluasi kandidat | Should |
| RC-05 | Konversi kandidat diterima menjadi karyawan (ke Core HR) | Must |
| RC-06 | Portal karir & integrasi job board | Could |

### 3.5 Performance Management
| ID | Kebutuhan | Prioritas |
|---|---|---|
| PM-01 | Penetapan tujuan / KPI / OKR per karyawan | Must |
| PM-02 | Siklus penilaian berkala (kuartalan/tahunan) | Must |
| PM-03 | Penilaian 360° (atasan, rekan, bawahan) | Should |
| PM-04 | Review & feedback berjenjang | Must |
| PM-05 | Kaitan hasil kinerja ke kompensasi/promosi | Could |
| PM-06 | Dashboard kinerja tim & individu | Should |

---

## 4. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| **Skalabilitas** | Mendukung 10 s.d. 10.000+ karyawan tanpa re-arsitektur |
| **Keamanan** | Enkripsi data, role-based access control (RBAC), kepatuhan UU PDP |
| **Ketersediaan** | SLA uptime ≥ 99,5% |
| **Kinerja** | Respons halaman < 3 detik; payroll run massal < 30 menit |
| **Aksesibilitas** | Web & mobile responsive |
| **Bahasa** | Bahasa Indonesia (utama) & Inggris |
| **Integrasi** | API terbuka untuk finance, bank, email, SSO |
| **Backup** | Backup harian & disaster recovery |
| **Audit** | Log aktivitas & jejak audit lengkap |

---

## 5. Integrasi Sistem

| Sistem | Tujuan Integrasi | Arah Data |
|---|---|---|
| Sistem Finance/Akuntansi | Posting biaya payroll | HR → Finance |
| Bank / Payment Gateway | Transfer gaji | HR → Bank |
| Email / Notifikasi | Slip gaji, approval, reminder | HR → Karyawan |
| SSO / Active Directory | Autentikasi terpusat | Dua arah |
| Mesin Absensi | Data kehadiran | Mesin → HR |

---

## 6. Asumsi & Batasan

**Asumsi**
- Vendor SaaS menyediakan kemampuan kustomisasi (konfigurasi & API).
- Regulasi payroll mengikuti ketentuan Indonesia (PPh 21, BPJS).
- Data karyawan existing tersedia untuk migrasi.

**Batasan**
- Kustomisasi dibatasi kapabilitas platform SaaS yang dipilih.
- Ketergantungan pada roadmap & SLA vendor.
- Anggaran dan timeline mengikuti persetujuan sponsor.

---

## 7. Pendekatan Implementasi (SaaS + Kustomisasi)

| Fase | Aktivitas | Output |
|---|---|---|
| 1. Discovery | Finalisasi requirement, pemilihan vendor | Vendor terpilih, gap analysis |
| 2. Konfigurasi | Setup modul, kebijakan, komponen gaji | Sistem terkonfigurasi |
| 3. Kustomisasi | Penyesuaian workflow & integrasi via API | Fitur khusus & integrasi |
| 4. Migrasi Data | Import data karyawan & saldo cuti | Data live |
| 5. UAT | Pengujian oleh HR & pengguna | Sign-off UAT |
| 6. Go-Live | Rollout bertahap per modul | Sistem operasional |
| 7. Support | Pelatihan & hypercare | Adopsi pengguna |

---

## 8. Kriteria Keberhasilan

- Seluruh proses payroll berjalan otomatis dengan akurasi ≥ 99%.
- Pengurangan waktu proses HR administratif minimal 50%.
- Adopsi self-service oleh ≥ 80% karyawan dalam 3 bulan.
- Data HR terpusat, akurat, dan dapat diaudit.

---

## 9. Persetujuan

| Nama | Peran | Tanda Tangan | Tanggal |
|---|---|---|---|
| | Project Sponsor | | |
| | HR Manager | | |
| | IT Lead | | |

---

*Dokumen ini adalah draft awal dan dapat direvisi sesuai hasil diskusi lanjutan dengan stakeholder dan vendor.*
