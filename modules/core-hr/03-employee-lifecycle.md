# 03 · Employee Lifecycle

## 1. Tahapan Siklus

Status kepegawaian karyawan berpindah melalui tahapan berikut:

```
   (dari Recruitment)
          │
          ▼
     ┌─────────┐   selesai probation   ┌────────┐
     │ Probation├──────────────────────▶│ Active │
     └────┬─────┘                        └───┬────┘
          │ gagal                            │
          ▼                                  │ mutasi/promosi (tetap active)
     ┌──────────┐                            │
     │ Terminated│◀───────────────────────────┤ resign / kontrak habis / PHK
     └──────────┘                            │
                                             ▼
                                        ┌──────────┐
                                        │ Offboarded│
                                        └──────────┘
```

| Status | Arti |
|---|---|
| `probation` | Masa percobaan (baru bergabung) |
| `active` | Karyawan tetap/aktif penuh |
| `on_leave` | Cuti panjang (mis. melahirkan) — opsional, detail di Attendance |
| `resigned` | Mengundurkan diri (proses offboarding berjalan) |
| `terminated` | Diberhentikan (PHK / gagal probation) |
| `offboarded` | Selesai keluar; data diarsipkan |

---

## 2. Transisi & Pemicunya

| Dari | Ke | Pemicu |
|---|---|---|
| — | `probation` | Konversi kandidat (Recruitment) / hire langsung |
| `probation` | `active` | Lulus masa percobaan |
| `probation` | `terminated` | Gagal masa percobaan |
| `active` | `active` | Mutasi / promosi (assignment baru, status tetap) |
| `active` | `resigned` | Pengunduran diri |
| `active` | `terminated` | PHK / kontrak berakhir |
| `resigned`/`terminated` | `offboarded` | Proses keluar selesai |

Setiap transisi dicatat (waktu, aktor, alasan) untuk audit.

---

## 3. Onboarding

Saat karyawan masuk (`probation`):
- Buat record employee (atau konversi dari kandidat Recruitment).
- **Otomatis buat akun user (Auth) & kirim undangan** — default (Pola A). Lihat bagian 3.1.
- Buat assignment awal (unit + posisi).
- Set data kontrak & tanggal mulai.

### 3.1 Pembuatan Akun (Pola A — default)

Secara default, membuat karyawan **sekaligus** memicu pembuatan akun login di modul Auth, lalu mengirim undangan aktivasi (email/SMS) agar karyawan menyetel password sendiri.

```
POST /employees (create_account = true, default)
   ├─ buat record employee (Core HR)
   ├─ buat akun user (Auth) → status pending
   ├─ tautkan employee.user_id = user.id
   ├─ seed peran default (RBAC, mis. "employee")
   └─ kirim undangan aktivasi (Auth → email/SMS karyawan)
              │
   karyawan  ▼
   set password → akun aktif → bisa login self-service
```

**Opsi skip:** untuk karyawan yang tak membutuhkan akses sistem (mis. pekerja harian yang hanya diproses payroll), set `create_account = false`. Record karyawan tetap dibuat tanpa akun; akun dapat ditambahkan menyusul.

**Menautkan akun yang sudah ada:** bila karyawan sudah punya akun (mis. hasil konversi kandidat), kirim `link_user_id` alih-alih membuat akun baru.

> Pembuatan akun & undangan adalah tanggung jawab modul **Auth**; Core HR memicunya dan menyimpan tautan `user_id`. Kredensial (password, MFA) tidak pernah disimpan di Core HR.

> **Enrollment absensi:** bila cabang karyawan memakai metode biometrik/kartu (fingerprint/face/NFC), pendaftaran sidik jari/wajah/kartu dijadwalkan sebagai bagian onboarding (bisa juga menyusul). Ini ditangani modul Attendance — lihat `attendance/10-identity-enrollment.md`.

> **Penetapan jadwal kerja:** saat register, karyawan langsung ditetapkan jadwalnya — secara default mengikuti **pattern shift departemennya**, atau HR memilih pattern tertentu (override). Jadwal langsung ter-generate agar karyawan tahu kapan masuk sejak hari pertama. Ditangani Attendance (schedule_patterns).

---

## 4. Mutasi & Promosi

- **Mutasi** — pindah unit/lokasi: tutup assignment lama, buat assignment baru. Status tetap `active`.
- **Promosi** — naik posisi/grade: assignment baru dengan posisi lebih tinggi.
- Keduanya **menambah riwayat**, tidak menimpa data lama, sehingga jejak karier terlacak.

### 4.1 Alur Persetujuan (Mutation Requests)

Perubahan mutasi/promosi/demosi (assignment), transisi status, dan offboarding tidak wajib langsung efektif — bisa diajukan lebih dulu sebagai **mutation request** yang menunggu persetujuan, lalu baru dieksekusi saat disetujui. Ini adalah lapisan opsional di atas mekanisme langsung-efektif pada bagian 2 & 5: memanggil endpoint aslinya (`/transition`, `/assignments`, `/offboarding`) tetap langsung berlaku seperti biasa; mengajukan lewat `/mutation-requests` menunda eksekusinya sampai ada approval.

```
POST /employees/{id}/mutation-requests   (kind: transition | assignment | offboarding)
        │
        ▼
   status: pending  ──reject──▶  status: rejected  (tidak ada perubahan apapun)
        │
     approve
        ▼
  eksekusi use case aslinya (transition / assignment / offboarding)
        │
   ┌────┴────┐
 sukses     gagal (mis. status karyawan sudah berubah, org unit nonaktif)
   │            │
   ▼            ▼
approved      failed  (reviewer tetap tercatat; failure_reason menjelaskan sebabnya)
```

- **pending** — diajukan, belum ada keputusan; karyawan belum berubah sama sekali.
- **approved** — disetujui *dan* berhasil dieksekusi; karyawan sudah berubah sesuai pengajuan.
- **rejected** — ditolak; tidak ada eksekusi sama sekali.
- **failed** — disetujui, tapi eksekusinya gagal saat itu terjadi (mis. state karyawan sudah berbeda dari saat pengajuan). Berbeda dari `rejected`: di sini reviewer-nya sudah bertindak (approve), hanya saja perubahannya tidak berhasil diterapkan — perlu diajukan ulang.
- Alasan pengajuan (`reason`) dan siapa yang mengajukan/meninjau (`requested_by`/`reviewed_by`) selalu tercatat pada request itu sendiri, terlepas dari status akhirnya.

Lihat `04-api-contract.md` §"Mutation Requests" untuk detail endpoint dan `05-data-model.md` untuk skema `mutation_requests`.

---

## 5. Offboarding

Saat karyawan keluar (`resigned`/`terminated` → `offboarded`):
- Tutup assignment aktif (isi tanggal selesai).
- Nonaktifkan akun user (modul Auth) — cabut akses.
- Tandai tanggal & alasan keluar.
- Arsipkan data sesuai kebijakan retensi & kepatuhan (UU PDP).

> Data tidak langsung dihapus; diarsipkan agar riwayat & kewajiban (mis. pajak) tetap tersedia.

---

## 6. Riwayat (Historization)

Prinsip penting Core HR: **perubahan besar disimpan sebagai riwayat**, bukan menimpa nilai lama.

| Yang di-historisasi | Contoh |
|---|---|
| Assignment | Riwayat unit & posisi (karier) |
| Status lifecycle | Kapan probation→active→resigned |
| Kontrak | Perpanjangan/perubahan kontrak |
| Employment history | Peristiwa kepegawaian lain di luar assignment/status, mis. pergantian atasan (`manager_change`) |

Ini memungkinkan pertanyaan seperti "posisi Budi Januari lalu apa?" atau "berapa lama ia di Tim AP?" terjawab akurat.
