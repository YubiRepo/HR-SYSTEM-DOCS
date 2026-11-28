<!-- 📁 modules/mobile/issues/notification.md -->
# Issues Backend — Notification

Kebutuhan notifikasi dari aplikasi mobile. Endpoint dasarnya sudah dirancang di [api/notification.md](../api/notification.md) (device, inbox, badge, tandai dibaca, preferensi) dan [modul Notification](../../notification/README.md). Yang belum ada: **event bisnis** di katalog (saat ini hanya `system.test`). Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [NOTIF-1](#notif-1) | Event bisnis untuk fitur mobile (katalog lengkap) | P2 | `Done` |
| [NOTIF-2](#notif-2) | Bahasa push mengikuti bahasa app | P3 | `Done` |
| [NOTIF-3](#notif-3) | Kontrak `data` push yang dibaca mobile | P2 | `Done` |
| [NOTIF-4](#notif-4) | Lifecycle device & token FCM (register, refresh, revoke) | P2 | `Done` |

> **Review BE 2026-11-28.** Spesifikasi di bawah sudah dicocokkan dengan kode API. Perubahan dari versi awal:
> - Setiap event kini punya kolom **channel** (in-app / push / email). Tidak semua event dikirim ke email, aturannya ada di [Aturan channel email](#aturan-channel-email).
> - Event yang kurang ditambahkan (payroll run, SPL dibatalkan, billing, keamanan akun).
> - Pemicu disesuaikan dengan alur yang benar-benar ada di kode, termasuk yang ternyata belum ada fiturnya.
> - `ref_id` berupa tanggal diganti `data.date`, karena kolom `ref_id` bertipe UUID.
> - Nama env FCM disamakan dengan server.
>
> Penerapan di backend: [plan Event Bisnis Notification](../../../plans/2026-11-28-notification-event-bisnis.md) — **selesai 2026-11-28** (lihat Catatan BE tiap issue).

---

### NOTIF-1
**Event bisnis untuk fitur mobile (katalog lengkap)** · P2 · `Done`

- **Konteks:** app sudah menerima push FCM (project `easy-hr-78795`) dan membuka layar sesuai `ref_type`. Tanpa event bisnis, push tidak pernah terkirim di luar `system.test`.
- **Prinsip (sesuai [03-event-catalog](../../notification/03-event-catalog.md)):**
  - Tidak ada data sensitif di judul/isi push maupun email (nominal gaji, alasan cuti sakit).
  - Aktor tidak menerima notifikasi atas aksinya sendiri. Contohnya, cuti yang langsung disetujui karena tidak ada approver tidak memicu `leave.approved` ke pengaju.
  - `DedupeKey` stabil per kejadian.
- **Yang tidak perlu dari server:** pengingat absen masuk/pulang harian. Pengingat ini sudah dijadwalkan lokal di HP dari `/attendance/me/schedule` + `clockout_reminder_min` (`/attendance/me/rules`). Server jangan mengirim pengingat yang sama (dobel).

#### Aturan channel email

In-app selalu dikirim. Push dikirim untuk semua event bisnis. **Email hanya untuk event yang perlu jadi arsip di kotak masuk user**, yaitu:

| Kirim email (✉) | Tidak kirim email |
|---|---|
| **Keputusan final** atas pengajuan yang berdampak ke hak, gaji, atau status kerja: cuti, lembur, payroll run | **Tugas yang perlu ditindaklanjuti di app**, mis. `approval.pending`: volumenya tinggi dan cukup dengan push + badge |
| **Dokumen / informasi resmi**: slip gaji terbit, SPL, kontrak berakhir, mutasi/promosi | **Info operasional harian** yang sudah terlihat di app: jadwal berubah, absen pulang otomatis, belum absen, koreksi absen |
| **Akun, keamanan & tagihan**: password diganti, tagihan, langganan berakhir, tenant ditangguhkan | **Pemberitahuan pembatalan** yang hanya membersihkan antrean, mis. `approval.cancelled` |
| **Eskalasi**: pengajuan menunggu > 24 jam (`approval.reminder`) | Event yang **emailnya sudah dikirim modul lain**, mis. undangan tenant (email undangan dari modul auth) |

User tetap bisa mematikan email/push per kategori di preferensi, kecuali event **Wajib** (sel preferensi terkunci).

#### Daftar event

Teks contoh dalam bahasa Indonesia; teks `en` menyesuaikan. Kolom channel: 🔔 in-app · 📱 push · ✉ email.

**Prioritas rilis**

| # | Event key | Kategori | Penerima | Pemicu (kode) | `ref_type` / `ref_id` | Judul / isi (contoh) | Channel | Wajib |
|---|---|---|---|---|---|---|---|---|
| 1 | `approval.pending` | approval | Approver step aktif. Bila step tanpa approver tetap → semua pemegang permission approve tipe itu (`leave:approve` / `attendance:approve` / `payroll:approve`) di cabang pengajuan | Engine `Submit` (step pertama) dan `Decide` hasil `advanced` (step berikutnya). Tipe: cuti, lembur, koreksi absen, payroll run | `approval_request` / `request_id` | **Persetujuan baru** · "Sari mengajukan cuti 20–21 Nov" | 🔔 📱 | |
| 2 | `leave.approved` | approval | Pengaju | Review cuti hasil `final_approved` | `leave_request` / id | **Cuti disetujui** · "Cuti 20–21 Nov disetujui" | 🔔 📱 ✉ | |
| 3 | `leave.rejected` | approval | Pengaju | Review cuti hasil `rejected` (step mana pun) | `leave_request` / id | **Cuti ditolak** · "Cuti 20–21 Nov ditolak. Lihat catatan atasan." | 🔔 📱 ✉ | |
| 4 | `overtime.approved` | approval | Pengaju | Review lembur disetujui (final) | `overtime_request` / id | **Lembur disetujui** · "Lembur 26 Nov 17:00–19:00 disetujui" | 🔔 📱 ✉ | |
| 5 | `overtime.rejected` | approval | Pengaju | Review lembur ditolak | `overtime_request` / id | **Lembur ditolak** · "Lembur 26 Nov ditolak. Lihat catatan atasan." | 🔔 📱 ✉ | |
| 6 | `correction.approved` | approval | Pengaju | Review koreksi disetujui (final) | `attendance_correction` / id | **Koreksi disetujui** · "Jam masuk 26 Nov diubah ke 08:00" | 🔔 📱 | |
| 7 | `correction.rejected` | approval | Pengaju | Review koreksi ditolak | `attendance_correction` / id | **Koreksi ditolak** · "Koreksi jam masuk 26 Nov ditolak" | 🔔 📱 | |
| 8 | `payroll.payslip_published` | payroll | Karyawan pemilik slip pada run itu | Payroll run **disetujui final**. Tidak ada langkah "terbit" tersendiri: slip terlihat di ESS sejak run `approved` | `payslip` / id | **Slip gaji terbit** · "Slip gaji November 2026 sudah tersedia" (tanpa nominal) | 🔔 📱 ✉ | ✅ |
| 9 | `overtime_order.issued` | attendance | Karyawan di baris SPL yang aktif | SPL berstatus `issued` | `overtime_order` / id | **Surat perintah lembur** · "Anda dijadwalkan lembur 28 Nov 17:00–20:00" | 🔔 📱 ✉ | |
| 10 | `attendance.auto_clocked_out` | attendance | Karyawan | Sweep auto clock-out menutup record (`auto_clockout_enabled`). **Catatan:** sweep saat ini dinonaktifkan di server; event aktif setelah sweep dinyalakan | `attendance_record` / record id | **Absen pulang otomatis** · "Absen pulang 26 Nov ditutup otomatis. Ajukan koreksi bila jamnya salah." | 🔔 📱 | |
| 11 | `employment.contract_expiring` (+ `employment.contract_expiring_team` untuk HR) | employment | Karyawan + pemegang `employees:read` cabangnya | Job harian `core_hr.contract.expiry_check` (menggantikan sender email `Noop`). Dikirim **sekali per ambang**: H-30 dan H-7 | `contract` / id | **Kontrak segera berakhir** · "Kontrak Anda berakhir 31 Des 2026" | 🔔 📱 ✉ | |
| 12 | `employment.assignment_changed` | employment | Karyawan | Mutasi/promosi **diterapkan**, baik langsung saat disetujui maupun lewat job `core_hr.mutation_request.apply_scheduled` | `assignment` / assignment id | **Penempatan baru** · "Mulai 1 Des Anda di Cabang Bandung sebagai Supervisor" | 🔔 📱 ✉ | |
| 13 | `schedule.changed` | attendance | Karyawan | HR mengubah jadwal yang jatuh pada **hari ini s/d 14 hari ke depan**: assign manual, generate pola, hapus jadwal, atau ganti pola lewat mutasi. Satu notifikasi per karyawan per aksi (bukan per hari) | `schedule` / — (tanggal di `data.date` = tanggal terdekat yang berubah) | **Jadwal berubah** · "Shift 30 Nov diubah ke Malam (22:00–06:00)" / "Jadwal 30 Nov–5 Des diperbarui" | 🔔 📱 | |
| 14 | `auth.tenant_invitation` | system | Akun yang diundang (akun sudah ada) | Undangan ke perusahaan lain dibuat / dikirim ulang. Email undangan **sudah** dikirim modul auth, jadi event ini tanpa email | `tenant_invitation` / tenant_id | **Undangan perusahaan** · "Anda diundang bergabung ke PT Yubi Techno Craft" | 🔔 📱 | |
| 15 | `system.subscription_ending` | system | Pemegang `billing:read` di tenant | Job harian: **trial** berakhir ≤ 3 hari lagi (sekali per tanggal berakhir). Langganan berbayar diperpanjang otomatis dan memicu #21. Lihat [PLAT-1](./platform.md#plat-1) | `subscription` / id | **Langganan segera berakhir** · "Langganan perusahaan berakhir 3 hari lagi" | 🔔 📱 ✉ | ✅ |

**Tambahan dari review BE** (event yang dibutuhkan tetapi belum ada di daftar awal)

| # | Event key | Kategori | Penerima | Pemicu (kode) | `ref_type` / `ref_id` | Judul / isi (contoh) | Channel | Wajib |
|---|---|---|---|---|---|---|---|---|
| 16 | `payroll.run_approved` | payroll | Pembuat run (maker) | Payroll run disetujui final | `payroll_run` / id | **Payroll disetujui** · "Payroll November 2026 Cabang Jakarta disetujui" | 🔔 📱 ✉ | |
| 17 | `payroll.run_rejected` | payroll | Pembuat run (maker) | Payroll run ditolak (kembali ke `calculated`) | `payroll_run` / id | **Payroll ditolak** · "Payroll November 2026 ditolak. Lihat catatan approver." | 🔔 📱 ✉ | |
| 18 | `overtime_order.cancelled` | attendance | Karyawan di baris SPL | SPL yang sudah `issued` dibatalkan, atau baris karyawan itu dibatalkan | `overtime_order` / id | **SPL dibatalkan** · "Lembur 28 Nov dibatalkan" | 🔔 📱 ✉ | |
| 19 | `leave.cancelled_by_hr` | approval | Pengaju | HR membatalkan cuti yang **masih menunggu**. Membatalkan cuti yang sudah disetujui belum ada fiturnya (non-goal v1) | `leave_request` / id | **Cuti dibatalkan HR** · "Pengajuan cuti 20–21 Nov dibatalkan oleh HR" | 🔔 📱 ✉ | |
| 20 | `auth.password_changed` | system | Pemilik akun | Password diganti sendiri, lewat reset, atau direset admin | — | **Password diganti** · "Password akun Anda diganti pada 28 Nov 10:15. Bukan Anda? Hubungi admin." | 🔔 ✉ | ✅ |
| 21 | `billing.invoice_issued` | system | Pemegang `billing:read` di tenant | Tagihan terbit (perpanjangan otomatis atau terbit manual) | `invoice` / id | **Tagihan baru** · "Tagihan baru PT Yubi untuk 1 Des – 31 Des 2026 terbit, jatuh tempo 10 Des 2026" | 🔔 ✉ | ✅ |
| 22 | `billing.payment_approved` / `billing.payment_rejected` | system | Pemegang `billing:read` | Pembayaran manual disetujui / ditolak platform | `invoice` / id | **Pembayaran diterima** / **Pembayaran ditolak** | 🔔 📱 ✉ | ✅ |
| 23 | `billing.tenant_suspended` | system | Pemegang `billing:read` di tenant | Dunning menangguhkan tenant setelah masa tenggang | `subscription` / id | **Akun perusahaan ditangguhkan** · "Akses dibatasi karena tagihan belum dibayar" | 🔔 📱 ✉ | ✅ |

**Opsional / menyusul** (tidak memblokir rilis)

| Event key | Kategori | Channel | Keterangan |
|---|---|---|---|
| `approval.reminder` | approval | 🔔 📱 ✉ | Pengajuan menunggu > 24 jam di step yang sama, 1× per hari ke approver. Email sebagai eskalasi |
| `approval.cancelled` | approval | 🔔 📱 | Pengaju membatalkan ajuan yang sedang menunggu → approver step aktif, agar kartu tidak dibuka sia-sia. Berlaku untuk cuti & lembur; koreksi absen belum punya fitur batal |
| `employment.document_expiring` | employment | 🔔 📱 ✉ | Sertifikat (`certificates[].expire_date`) berakhir ≤ 30 hari |
| `employment.mutation_failed` | employment | 🔔 ✉ | Mutasi terjadwal gagal diterapkan → pembuat pengajuan (HR) |
| `attendance.missed_clock_in` | attendance | 🔔 📱 | **Jaring pengaman dari server.** Dikirim bila karyawan belum clock-in **X menit setelah shift mulai** (usul X = `late_tolerance_min` shift, atau setting baru di attendance rule). Syarat: hanya hari kerja (`day_kind = workday`), tidak dikirim bila cuti approved, hari libur, atau sudah clock-in. Maksimal 1× per hari (`DedupeKey` = `attendance.missed_clock_in:<employee_id>:<date>`). Tidak dobel dengan pengingat lokal di HP, karena pengingat lokal **sebelum** shift dan ini **sesudah** shift mulai. `ref_type` `attendance_record` tanpa `ref_id`, tanggal di `data.date`; link mobile `/attendance?tab=today`. Butuh job berkala (mis. tiap 5 menit) yang membaca jadwal + record hari itu |
| `system.announcement` | system | 🔔 📱 | Pengumuman HR ke seluruh tenant / cabang (butuh fitur pengumuman di backoffice) |

- **Catatan BE:** (2026-11-28) semua event prioritas rilis #1–15 dan tambahan #16–23 dikirim server — katalog: [03-event-catalog](../../notification/03-event-catalog.md), plan: [event bisnis](../../../plans/2026-11-28-notification-event-bisnis.md). Penyesuaian: #11 juga punya `employment.contract_expiring_team` (HR, tanpa push); #22 dipecah `billing.payment_approved` / `billing.payment_rejected` ke pemegang `billing:read`; #15 hanya untuk **trial** (langganan berbayar memicu #21); #10 aktif setelah sweep auto clock-out dinyalakan; `schedule.changed` dari mutasi pola kerja belum. Event opsional belum dikerjakan.
  - Penerima adalah **user**. Karyawan tanpa akun login (`employees.user_id` kosong) tidak menerima notifikasi apa pun, dan tidak ada fallback email ke `employees.email`.
  - Modul leave, attendance, dan payroll belum punya lookup karyawan → user. Saat penerapan perlu port baru di atas `corehr.FindEmployeeRef`, dan versi batch untuk slip gaji per run serta baris SPL.
  - Ada pemicu yang **tidak berjalan di dalam transaksi**: sweep auto clock-out, perubahan jadwal, mutasi yang ditolak/dijadwalkan, seluruh modul auth, dunning, dan review pembayaran. Notifikasinya tetap dikirim lewat outbox, tetapi tidak atomik dengan perubahan datanya.
  - Event #14, #20, dan #21–23 bersifat akun/perusahaan, bukan tenant aktif user. Inbox saat ini hanya menampilkan notifikasi tenant aktif, dan dispatcher membuang penerima tanpa membership aktif, sehingga undangan ke tenant lain tidak akan sampai. Penyesuaian saat penerapan:
    - Notifikasi tingkat akun disimpan dengan `tenant_id` kosong.
    - Inbox tenant juga menampilkan notifikasi akun milik user itu.
    - Pengecekan membership dilewati untuk event tingkat akun.

---

### NOTIF-2
**Bahasa push mengikuti bahasa app** · P3 · `Done`

- **Konteks:** katalog punya teks `en` + `id`, tetapi **server saat ini selalu merender `en`** untuk inbox, email, maupun push. `users` tidak punya kolom bahasa.
- **Usulan:**
  - Tambah field opsional `locale` (`id` / `en`) di `POST /notifications/devices`. App mengirim ulang field ini saat user ganti bahasa.
  - **Push** dirender per device sesuai `locale` device tersebut.
  - **Inbox & email** memakai bahasa penerima, yaitu `locale` device yang paling baru aktif. User tanpa device memakai `en`. Teks inbox disimpan saat dikirim, jadi tidak ikut berubah bila user ganti bahasa kemudian.
  - Backoffice ikut mendaftarkan browser sebagai device `web` dengan `locale`.
- **Catatan BE:** (2026-11-28) `locale` (`id`/`en`, tag seperti `id-ID` diterima) di `POST /notifications/devices`. Teks dirender **per user**, bukan per device: bahasa user = `locale` device aktif yang paling baru `last_seen_at`; tanpa device = `en`. Inbox, email, dan push memakai teks itu; teks inbox disimpan saat dikirim. Tanggal & bulan ikut bahasa ("20 Des 2026").

---

### NOTIF-3
**Kontrak `data` push yang dibaca mobile** · P2 · `Done`

- **Konteks:** [api/notification.md §3](../api/notification.md) sudah mendefinisikan `notification_id`, `event_key`, `category`, `tenant_id`, `ref_type`, `ref_id`, `link`. Mobile memetakan layar dari `ref_type`, bukan dari `link` (path backoffice).
- **Yang diminta:**
  - Nilai `ref_type` mengikuti tabel di bawah (string tetap, huruf kecil).
  - Untuk `approval.pending`, tambahkan `data.document_type` (`leave_request` / `overtime_request` / `attendance_correction` / `payroll_run`) agar app langsung membuka tab yang tepat.
  - Semua nilai `data` berupa string (aturan FCM).
- **Penyesuaian dari review BE:**
  - **`ref_id` selalu UUID atau kosong.** Kolom `notifications.ref_id` bertipe UUID, jadi event yang merujuk tanggal (`schedule.changed`, `attendance.missed_clock_in`) mengirim `ref_type` tanpa `ref_id`, dan tanggalnya ada di **`data.date`** (`YYYY-MM-DD`).
  - **Field tambahan `data`** (`document_type`, `date`) saat ini belum terkirim. Push baru membawa 7 key dasar. Saat penerapan, `Notify` mendapat field `Data` terpisah dari parameter teks. Field ini disimpan di `notifications.data` (ikut di respons inbox) dan disalin ke `data` push. Parameter teks (nama, tanggal) tidak ikut terkirim sebagai `data`.
  - `android.notification.channel_id` dan `apns.aps.badge` belum dikirim server. Keduanya ditambahkan saat penerapan.

Mobile membuka layar dari `ref_type` + `ref_id`. **Link mobile** di bawah adalah route di app (GoRouter). Server tidak perlu mengirim link mobile; cukup `ref_type` / `ref_id` (plus `document_type` atau `date` bila ada). `link` tetap berisi path backoffice.

#### Approval

| Event key | `ref_type` | `ref_id` | Extra `data` | Link mobile | Tab / aksi di layar |
|---|---|---|---|---|---|
| `approval.pending` | `approval_request` | `request_id` | `document_type` | `/approvals?type={kind}` | Tab **Menunggu**, chip sesuai `kind` |
| `approval.reminder` *(opsional)* | `approval_request` | `request_id` | `document_type` | `/approvals?type={kind}` | sama |
| `approval.cancelled` *(opsional)* | `approval_request` | `request_id` | `document_type` | `/approvals?tab=history` | Tab **Riwayat** |

`kind` diturunkan dari `document_type`: `leave_request` → `leave` · `overtime_request` → `overtime` · `attendance_correction` → `correction` · `payroll_run` → `payroll`.

#### Leave (Cuti)

| Event key | `ref_type` | `ref_id` | Link mobile | Tab / aksi |
|---|---|---|---|---|
| `leave.approved` | `leave_request` | leave request id | `/leave?tab=history&id={ref_id}` | Tab **Riwayat**, buka detail ajuan (timeline) |
| `leave.rejected` | `leave_request` | leave request id | `/leave?tab=history&id={ref_id}` | sama, catatan atasan tampil |
| `leave.cancelled_by_hr` | `leave_request` | leave request id | `/leave?tab=history&id={ref_id}` | sama |

#### Attendance (Presensi, Lembur, Jadwal)

| Event key | `ref_type` | `ref_id` | Extra `data` | Link mobile | Tab / aksi |
|---|---|---|---|---|---|
| `overtime.approved` | `overtime_request` | overtime request id | — | `/overtime?tab=requests&id={ref_id}` | Tab **Pengajuan**, kartu di-highlight |
| `overtime.rejected` | `overtime_request` | overtime request id | — | `/overtime?tab=requests&id={ref_id}` | sama |
| `overtime_order.issued` | `overtime_order` | SPL id | — | `/overtime?tab=orders&id={ref_id}` | Tab **SPL** |
| `overtime_order.cancelled` | `overtime_order` | SPL id | — | `/overtime?tab=orders&id={ref_id}` | Tab **SPL** |
| `correction.approved` | `attendance_correction` | correction id | — | `/attendance?tab=summary&id={ref_id}` | Tab **Ringkasan** → Pengajuan koreksi |
| `correction.rejected` | `attendance_correction` | correction id | — | `/attendance?tab=summary&id={ref_id}` | sama |
| `attendance.auto_clocked_out` | `attendance_record` | record id | `date` | `/attendance?tab=today&date={date}` | Tab **Hari Ini** (atau riwayat tanggal itu) + tombol koreksi |
| `attendance.missed_clock_in` *(opsional)* | `attendance_record` | — | `date` | `/attendance?tab=today` | Tab **Hari Ini**, tombol Absen Masuk |
| `schedule.changed` | `schedule` | — | `date` | `/attendance?tab=schedule&date={date}` | Tab **Jadwal Shift**, tanggal terpilih |

#### Payroll

| Event key | `ref_type` | `ref_id` | Link mobile | Tab / aksi |
|---|---|---|---|---|
| `payroll.payslip_published` | `payslip` | payslip id | `/payroll?id={ref_id}` | Buka detail slip (perlu PIN/biometrik bila diaktifkan) |
| `payroll.run_approved` / `payroll.run_rejected` | `payroll_run` | run id | — (backoffice saja) | Pembuat run adalah admin HR; di app cukup tampil di inbox |

#### Employment (Profil & Karier)

| Event key | `ref_type` | `ref_id` | Link mobile | Tab / aksi |
|---|---|---|---|---|
| `employment.contract_expiring` | `contract` | contract id | `/career` | Bagian **Kontrak** |
| `employment.assignment_changed` | `assignment` | assignment id | `/career` | Bagian **Posisi & Penempatan** |
| `employment.document_expiring` *(opsional)* | `employee_document` | document id | `/biodata?tab=documents` | Tab **Dokumen** |

#### System, akun & tagihan

| Event key | `ref_type` | `ref_id` | Link mobile | Tab / aksi |
|---|---|---|---|---|
| `auth.tenant_invitation` | `tenant_invitation` | tenant id | `/profile` | Kartu **Undangan perusahaan** |
| `auth.password_changed` | — | — | `/notification` | Inbox (tanpa push) |
| `system.subscription_ending` | `subscription` | subscription id | `/` | Beranda, banner langganan |
| `billing.invoice_issued`, `billing.payment_approved`, `billing.payment_rejected` | `invoice` | invoice id | `/notification` | Inbox; tagihan dikelola di backoffice |
| `billing.tenant_suspended` | `subscription` | subscription id | `/` | Beranda, banner langganan |
| `system.announcement` *(opsional)* | `announcement` | announcement id | `/notification?id={ref_id}` | Detail di inbox |
| `system.test` | — | — | `/notification` | Inbox |
| *(tidak dikenal / tanpa `ref_type`)* | — | — | `/notification` | Inbox |

#### Route app & parameter

Route yang sudah ada dan parameter yang **disiapkan mobile** (bukan tugas BE; dicantumkan agar kontrak lengkap):

| Route | Layar | Parameter | Status di app |
|---|---|---|---|
| `/` | Beranda | — | Ada |
| `/approvals` | Pusat Persetujuan | `type` = `leave`/`overtime`/`correction`/`payroll`, `tab` = `waiting`/`history` | `type` ada · `tab` disiapkan |
| `/leave` | Cuti | `tab` = `balance`/`history`, `id` | Disiapkan |
| `/overtime` | Lembur | `tab` = `requests`/`realisation`/`orders`, `id` | Disiapkan |
| `/attendance` | Presensi | `tab` = `today`/`schedule`/`summary`, `date`, `id` | Disiapkan |
| `/schedules` | Kalender jadwal | `date` | Disiapkan |
| `/payroll` | Slip gaji | `id` | Disiapkan |
| `/career` | Riwayat Karier | — | Ada |
| `/biodata` | Biodata | `tab` = `documents` | Disiapkan |
| `/profile` | Profil | — | Ada |
| `/notification` | Inbox notifikasi | `id` | Disiapkan (layar inbox baru) |

**Alur di app (sudah / akan dikerjakan di mobile):**
1. Setelah login, pilih tenant, ganti tenant, dan setiap `onTokenRefresh`, panggil `POST /notifications/devices` (`token`, `platform`, `device_id`, `device_name`, `app_version`, `locale`). Simpan `data.id`.
2. Saat logout, panggil `DELETE /notifications/devices/{id}` **sebelum** `POST /auth/logout`; abaikan 404.
3. Push diterima saat app terbuka: tampilkan sebagai notifikasi lokal dan perbarui badge (`GET /notifications/unread-count`).
4. Push dibuka:
   - Bila `tenant_id` berbeda dengan tenant aktif, tanya user lalu panggil `POST /auth/switch-tenant`. Notifikasi tingkat akun tidak membawa `tenant_id`, jadi tidak perlu ganti tenant.
   - Buka layar sesuai `ref_type`.
   - Panggil `PATCH /notifications/{notification_id}/read`.
5. Menu **Notifikasi** memakai `GET /notifications` (filter belum dibaca / kategori). "Tandai semua dibaca" memakai `POST /notifications/read-all`.
6. Profil → **Pengaturan notifikasi** memakai `GET`/`PUT /notifications/preferences` (push dan email per kategori; sel `locked` tampil non-aktif).
7. App berhenti subscribe topic global lama (`all_employees`, `announcements`). Semua push lewat token device per user/tenant.

**Contoh push lengkap (`approval.pending`):**

```json
{
  "message": {
    "token": "<fcm-token>",
    "notification": {
      "title": "Persetujuan baru",
      "body": "Sari Wulandari mengajukan cuti 20–21 Nov"
    },
    "data": {
      "notification_id": "6c1e…",
      "event_key": "approval.pending",
      "category": "approval",
      "tenant_id": "a236f608-…",
      "ref_type": "approval_request",
      "ref_id": "apr-91d…",
      "document_type": "leave_request",
      "link": "/approvals/apr-91d…"
    },
    "android": { "priority": "high", "notification": { "channel_id": "hr_app_default_channel" } },
    "apns": { "payload": { "aps": { "sound": "default", "badge": 3 } } }
  }
}
```

- `android.notification.channel_id` = `hr_app_default_channel` (channel yang dibuat app, importance tinggi).
- `apns.aps.badge` = jumlah belum dibaca terbaru (opsional, agar ikon app iOS sesuai).
- **Prasyarat iOS:** APNs key (.p8) dari Apple Developer PT Yubi Technology (`6HF6B53G32`) di-upload ke Firebase Console → Cloud Messaging. Tanpa ini push tidak sampai ke iPhone.
- **Catatan BE:** (2026-11-28) `ref_type` sesuai tabel; `data.document_type` (approval.pending) dan `data.date` (schedule.changed, attendance.auto_clocked_out) dikirim. `ref_id` selalu UUID — event berbasis tanggal tanpa `ref_id`. Notifikasi tingkat akun tidak membawa `data.tenant_id`. Push membawa `android.notification.channel_id = hr_app_default_channel` dan `apns.aps.badge` = jumlah belum dibaca. `link` berisi path BO `/go/*`.

---

### NOTIF-4
**Lifecycle device & token FCM (register, refresh, revoke)** · P2 · `Done`

- **Konteks:** endpoint device sudah ada di [api/notification.md §1–2](../api/notification.md). Issue ini mengunci kapan app memanggilnya dan perilaku server yang dibutuhkan agar push tidak salah orang / salah perusahaan.

**Endpoint**

| Endpoint | Kapan dipanggil app | Body / respons | Server saat ini |
|---|---|---|---|
| `POST /notifications/devices` | (1) setelah login berhasil, (2) setelah pilih / ganti tenant / ganti cabang, (3) setiap `onTokenRefresh`, (4) saat app dibuka bila terakhir register > 7 hari, (5) saat user ganti bahasa app | Body: `token`, `platform` (`android`/`ios`/`web`), `device_id`, `device_name`, `app_version`, `locale` (NOTIF-2). Respons: `data.id` disimpan di HP | Ada, tanpa `locale` |
| `DELETE /notifications/devices/{id}` | Logout, **sebelum** `POST /auth/logout`; juga saat user mematikan izin notifikasi OS | 204; `404 NOTIFICATION_DEVICE_NOT_FOUND` diabaikan | Ada |
| `GET /notifications/devices` *(usulan, opsional)* | Profil → Pengaturan notifikasi → daftar perangkat aktif | List device milik user (nama, platform, `last_seen_at`) | Belum ada |
| `DELETE /notifications/devices` *(usulan, opsional)* | "Keluar dari semua perangkat" | Hapus semua device user (dipakai juga saat ganti password) | Belum ada |

**`device_id`:** dibuat app sekali per install (UUID, disimpan lokal), bukan ID hardware. Install ulang = device baru.

**Perilaku server yang dibutuhkan**

| Kasus | Yang diharapkan | Server saat ini |
|---|---|---|
| Token sama didaftarkan ulang | Update `last_seen_at`, `app_version`, `locale`; tidak membuat baris baru | Sudah (kecuali `locale`) |
| Token sama, user lain (HP dipakai bergantian) | Pindah ke user baru; user lama tidak menerima push di HP itu lagi | Sudah |
| `device_id` sama, token baru (FCM rotate) | Ganti token pada baris device yang sama, bukan menambah baris | **Belum**: upsert per token, jadi token baru membuat baris baru. Token lama baru nonaktif setelah FCM membalas token mati |
| User punya beberapa tenant | Push hanya untuk notifikasi tenant yang punya membership aktif; `data.tenant_id` selalu diisi untuk notifikasi tenant agar app bisa ganti tenant sebelum membuka | Sudah (pengecekan membership saat dispatch) |
| FCM membalas `UNREGISTERED` / `INVALID_ARGUMENT` (token mati) | Nonaktifkan device itu | Sudah |
| Logout, ganti password, akun dinonaktifkan, keluar dari tenant | Device user dicabut. Ganti password & akun nonaktif: semua device. Keluar tenant: push tenant itu berhenti | Logout sudah (lewat `DELETE`). Keluar tenant sudah lewat pengecekan membership. **Ganti password & akun nonaktif belum** |
| Device tidak aktif > 60 hari | Dibersihkan job berkala | **Belum** (job retensi hanya membersihkan notifikasi) |
| Rate | Satu event = satu push per device; `DedupeKey` mencegah dobel saat retry | Sudah |

**Topic FCM:** app berhenti memakai topic global `all_employees` / `announcements` (bocor lintas perusahaan). Bila nanti butuh broadcast (pengumuman), pakai fan-out per user dari server, atau topic per tenant `tenant_{tenant_id}` yang di-subscribe/unsubscribe app saat ganti tenant.

**Konfigurasi server**

| Variabel | Isi |
|---|---|
| `NOTIFICATION_PUSH_ENABLED` | `true` untuk mengaktifkan channel push |
| `FCM_PROJECT_ID` | `easy-hr-78795` |
| `FCM_CREDENTIALS_FILE` | Path service account JSON (mis. `./certs/easy-hr-78795-firebase-adminsdk-….json`, folder `certs/` sudah di-ignore git). Diberikan terpisah, **tidak** lewat repo / chat |

**Prasyarat iOS:** APNs Authentication Key (.p8) dari Apple Developer **PT Yubi Technology** (`6HF6B53G32`), di-upload ke Firebase Console → Project settings → Cloud Messaging → Apple app configuration (Key ID + Team ID). Bundle ID iOS = Android = `com.yubidev.easyhr`.

- **Catatan BE:** (2026-11-28) semua kolom "Server saat ini" sudah terpenuhi: `locale`; rotasi token per `(user, device_id)`; `GET /notifications/devices` dan `DELETE /notifications/devices`; semua device dicabut saat password diganti / reset dan saat akun dinonaktifkan platform (satu transaksi dengan perubahannya); job retensi harian menghapus device nonaktif atau tidak terlihat > 60 hari. Keluar dari tenant tetap lewat pengecekan membership saat dispatch. Project Firebase yang sama juga dipakai push browser di backoffice (`platform = web`).
