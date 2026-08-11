# HR Management System — Arsitektur Modul Besar

| | |
|---|---|
| **Dokumen** | HRMS — Arsitektur Modul Besar |
| **Versi** | 1.0 |
| **Tanggal** | 9 Agustus 2026 |
| **Model** | SaaS + Kustomisasi |
| **Skala** | Fleksibel — kecil hingga enterprise |

---

## 1. Gambaran Besar

HRMS terdiri dari **lima modul inti** yang berdiri di atas **satu lapisan platform bersama**. Semua modul memakai autentikasi, API, database, dan notifikasi yang sama — inilah yang membuat sistem tetap terpadu meski kompleks.

```
┌──────────────────────────────────────────────────────────┐
│                     MODUL INTI HRMS                        │
│  ┌────────────────────┐   ┌────────────────────┐          │
│  │ Core HR + Payroll  │   │ Attendance & Leave │          │
│  └────────────────────┘   └────────────────────┘          │
│  ┌────────────────────┐   ┌────────────────────┐          │
│  │ Recruitment / ATS  │   │ Performance Mgmt   │          │
│  └────────────────────┘   └────────────────────┘          │
│  ┌──────────────────────────────────────────────┐         │
│  │ Self-Service & Manager Portal                 │         │
│  └──────────────────────────────────────────────┘         │
├──────────────────────────────────────────────────────────┤
│                 PLATFORM BERSAMA (FONDASI)                 │
│  Auth & RBAC │ API Gateway │ Data & Storage │ Notifikasi  │
│  Reporting & Analytics                                     │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Modul Inti

### 2.1 Core HR + Payroll
Pusat data karyawan sekaligus mesin penggajian — menjadi **sumber data utama (single source of truth)** bagi seluruh sistem.

| Aspek | Cakupan |
|---|---|
| **Fungsi utama** | Data master karyawan, struktur organisasi, kontrak, dokumen |
| **Payroll** | Perhitungan gaji, tunjangan, potongan |
| **Kepatuhan ID** | PPh 21, BPJS Ketenagakerjaan & Kesehatan |
| **Output** | Slip gaji digital, bukti potong pajak, riwayat payroll |
| **Ketergantungan** | Menerima data dari Recruitment & Attendance |

### 2.2 Attendance & Leave
Mengelola kehadiran, jadwal, dan cuti — datanya mengalir ke Payroll untuk perhitungan gaji dan lembur.

| Aspek | Cakupan |
|---|---|
| **Kehadiran** | Check-in/out (mobile/web, geolocation), integrasi mesin absensi |
| **Jadwal** | Manajemen shift & pola kerja |
| **Cuti** | Pengajuan & approval berjenjang, saldo cuti otomatis |
| **Lembur** | Perhitungan overtime |
| **Output** | Data absensi & lembur → Payroll |

### 2.3 Recruitment / ATS
Mengelola proses rekrutmen dari lowongan hingga kandidat diterima — lalu dikonversi menjadi karyawan di Core HR.

| Aspek | Cakupan |
|---|---|
| **Lowongan** | Job posting & portal karir |
| **Kandidat** | Database & pelacakan pipeline seleksi |
| **Seleksi** | Penjadwalan interview, scoring, evaluasi |
| **Output** | Kandidat diterima → Core HR (jadi karyawan) |

### 2.4 Performance Management
Mengelola siklus penilaian kinerja, tujuan, dan feedback.

| Aspek | Cakupan |
|---|---|
| **Tujuan** | Penetapan KPI/OKR per karyawan |
| **Penilaian** | Siklus berkala (kuartalan/tahunan) |
| **Feedback** | Review berjenjang & penilaian 360° |
| **Output** | Kaitan hasil ke kompensasi/promosi, dashboard kinerja |

### 2.5 Self-Service & Manager Portal
Antarmuka lintas modul bagi karyawan dan manajer.

| Aspek | Cakupan |
|---|---|
| **Karyawan** | Update data pribadi, unduh slip, ajukan cuti |
| **Manajer** | Approval berjenjang, review tim |
| **Umum** | Dashboard & laporan HR |

---

## 3. Platform Bersama (Fondasi)

Lapisan yang dipakai bersama oleh semua modul — memastikan konsistensi keamanan, integrasi, dan data.

| Lapisan | Fungsi |
|---|---|
| **Auth & RBAC** | SSO, OAuth2/JWT, kontrol akses berbasis peran |
| **API Gateway** | REST, rate limiting, versioning, gerbang integrasi |
| **Data & Storage** | Database terpusat, penyimpanan dokumen, audit trail |
| **Notifikasi & Event** | Email, webhook, pemrosesan job async |
| **Reporting & Analytics** | Dashboard, laporan pajak, metrik HR |

---

## 4. Alur Data Antar Modul

Yang membuat sistem "kompleks tapi terpadu" adalah bagaimana data mengalir antar modul dan ke sistem eksternal.

| Dari | Ke | Data yang Mengalir |
|---|---|---|
| Recruitment | Core HR | Kandidat diterima → karyawan baru |
| Core HR | Payroll | Data karyawan, komponen gaji |
| Attendance | Payroll | Kehadiran, cuti, lembur |
| Payroll | Finance | Posting biaya penggajian |
| Payroll | Bank | Instruksi transfer gaji |
| Core HR | SSO / AD | Autentikasi terpusat |
| Semua modul | Email | Notifikasi & dokumen |

```
Recruitment ──▶ Core HR ──▶ Payroll ──▶ Finance
                   ▲            │
Attendance ────────┘            ├──▶ Bank
                                └──▶ Email
```

---

## 5. Integrasi Eksternal

| Sistem | Tujuan | Arah Data |
|---|---|---|
| SSO / Active Directory | Autentikasi terpusat | Dua arah |
| Sistem Finance/Akuntansi | Posting biaya payroll | HRMS → Finance |
| Bank / Payment Gateway | Transfer gaji | HRMS → Bank |
| Mesin Absensi | Data kehadiran | Mesin → HRMS |
| Email / Notifikasi | Slip, approval, reminder | HRMS → Karyawan |

---

## 6. Prinsip Arsitektur

1. **Single source of truth** — Core HR jadi acuan data karyawan bagi semua modul.
2. **Modular** — tiap modul bisa diaktifkan bertahap sesuai kebutuhan & skala.
3. **Shared platform** — auth, API, data, notifikasi dipakai bersama agar konsisten.
4. **API-first** — semua modul & integrasi lewat API gateway yang seragam.
5. **Scalable** — arsitektur sama untuk skala kecil hingga enterprise.
6. **Compliant** — payroll mengikuti regulasi Indonesia (PPh 21, BPJS) & UU PDP.

---

*Dokumen ini adalah gambaran besar arsitektur modul. Detail requirement per modul tersedia di BRD, dan kontrak API tersedia di dokumen API Response Architecture.*
