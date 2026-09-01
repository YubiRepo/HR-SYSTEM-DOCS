<!-- 📁 modules/mobile/01-feature-breakdown.md -->
# Mobile App — Feature Breakdown

Pemetaan fitur yang tersedia di **aplikasi mobile** HRMS, dipisah per peran. Dokumen ini menjawab: dari semua modul yang ada, mana yang muncul di app HP, untuk siapa, dan mana yang tetap di web.

> Dokumen tingkat **fitur** (bukan spesifikasi teknis app atau desain layar). Rancangan navigasi, alur layar, dan mockup menyusul terpisah.

---

## 1. Prinsip Pemilihan Fitur

**Mobile = cepat & di lapangan; setup berat tetap di web.**

Fitur masuk mobile bila memenuhi salah satu:
- **Sering** dipakai (harian) — mis. absen.
- **Di lapangan** — dipakai saat tak di depan komputer (approval, absen di pabrik).
- **Cepat** — aksi singkat yang butuh respons segera (lihat slip, ajukan cuti).

Fitur tetap di web bila:
- **Berat & jarang** — konfigurasi, setup, master data.
- **Butuh layar lebar & fokus** — kalibrasi kinerja, atur payroll.

App bersifat **multi-role**: satu aplikasi, tampilan menyesuaikan peran (dari RBAC). Karyawan melihat menu karyawan; manajer melihat tambahan approval; HR melihat monitoring.

---

## 2. Karyawan (Self-service)

Peran paling sering memakai mobile — kebutuhan harian.

| Fitur | Modul sumber | Keterangan |
|---|---|---|
| **Absen clock in/out** | Attendance | GPS/face/NFC; inti penggunaan harian |
| **Lihat jadwal shift** | Attendance | Jadwal ke depan (`/me/schedule`) |
| **Slip gaji** | Payroll | Lihat & unduh payslip sendiri |
| **Ajuan cuti + saldo** | Leave | Ajukan cuti, cek sisa saldo |
| **Sisa hutang/cicilan** | Payroll (loan) | Outstanding pinjaman & riwayat cicilan |
| **Self-assessment** | Performance | Isi penilaian diri saat siklus review |
| **Data diri & dokumen** | Core HR | Lihat/perbarui info pribadi, unduh dokumen |
| **Koreksi lupa absen** | Attendance | Ajukan koreksi bila lupa clock in/out |
| **Notifikasi** | Notification | Pengingat absen, status ajuan, slip terbit |

---

## 3. Manajer (Approval & Tim)

Manajer sering tak di meja — approval on-the-go penting.

| Fitur | Modul sumber | Keterangan |
|---|---|---|
| **Approve cuti** | Leave | Setujui/tolak ajuan tim (reporting line) |
| **Approve lembur/koreksi** | Attendance | Setujui lembur & koreksi absen tim |
| **Approve payroll run** | Payroll | Maker-checker: setujui run (bila reviewer) |
| **Kehadiran tim** | Attendance | Pantau siapa hadir/telat/cuti hari ini |
| **Review kinerja tim** | Performance | Manager review bawahan |
| **Approve offer** | Recruitment | Setujui penawaran kandidat |

> Manajer juga punya semua fitur karyawan (dia juga karyawan). Menu approval muncul tambahan sesuai peran.

---

## 4. HR / Admin (Monitoring Ringan)

Bukan untuk kerja berat — hanya pantau & tindakan cepat di HP.

| Fitur | Modul sumber | Keterangan |
|---|---|---|
| **Dashboard ringkas** | Core HR / Attendance | Ringkasan hadir/cuti hari ini |
| **Approval tertunda** | Lintas modul | Daftar hal yang menunggu keputusan |
| **Jadwal interview** | Recruitment | Agenda interview mendatang |

Konfigurasi & pengelolaan mendalam tetap di web (lihat §6).

---

## 5. Fitur Lintas-Role (Umum)

Ada di semua peran:
- **Login & keamanan** — Auth (biometrik unlock opsional).
- **Notifikasi push** — Notification.
- **Ganti bahasa / profil** — pengaturan app.
- **Switch peran/konteks** — bila user punya banyak peran/cabang.

---

## 6. Tetap di Web (Tidak di Mobile)

Setup berat & jarang, butuh layar lebar:

| Area | Modul |
|---|---|
| Konfigurasi payroll, setup grade/komponen | Payroll |
| Kelola cabang | Platform/Tenant |
| RBAC (peran & izin) | RBAC |
| Billing / subscription | Platform/Billing |
| Bikin lowongan & kelola pipeline | Recruitment |
| Kalibrasi kinerja, setup framework | Performance |
| Master data & katalog | Core HR |
| Admin Console (Yubiteck) | Platform/Admin Console |

> Sebagian bisa **dilihat** (read-only) di mobile lewat dashboard, tetapi **pengaturannya** dilakukan di web.

---

## 7. Catatan untuk Tahap Berikut

Dokumen ini baru tingkat fitur. Lanjutan yang mungkin:
- **Navigasi & struktur layar** — tab bar, hierarki screen per peran.
- **Spesifikasi teknis** — offline mode, sinkronisasi, push notification, akses GPS/kamera.
- **Mockup / prototype** — tampilan visual layar utama.

> Semua fitur di atas memakai **API & data model modul yang sudah ada** — mobile adalah *klien* dari modul-modul tersebut, bukan modul baru dengan logika sendiri.
