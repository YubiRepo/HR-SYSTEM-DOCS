<!-- 📁 modules/mobile/issues/notification.md -->
# Issues Backend — Notification

Kebutuhan notifikasi dari aplikasi mobile. Endpoint dasarnya sudah dirancang di [api/notification.md](../api/notification.md) (device, inbox, badge, tandai dibaca, preferensi) dan [modul Notification](../../notification/README.md). Yang belum ada: **event bisnis** di katalog (saat ini hanya `system.test`). Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [NOTIF-1](#notif-1) | Event bisnis untuk fitur mobile (katalog lengkap) | P2 | `Open` |
| [NOTIF-2](#notif-2) | Bahasa push mengikuti bahasa app | P3 | `Open` |
| [NOTIF-3](#notif-3) | Kontrak `data` push yang dibaca mobile | P2 | `Open` |

---

### NOTIF-1
**Event bisnis untuk fitur mobile (katalog lengkap)** · P2 · `Open`

- **Konteks:** app sudah menerima push FCM (project `easy-hr-78795`) dan membuka layar sesuai `ref_type`. Tanpa event bisnis, push tidak pernah terkirim di luar `system.test`.
- **Prinsip (sesuai [03-event-catalog](../../notification/03-event-catalog.md)):** tidak ada data sensitif di judul/isi push (nominal gaji, alasan cuti sakit). Aktor tidak menerima notifikasi atas aksinya sendiri. `DedupeKey` stabil per kejadian.
- **Yang tidak perlu dari server:** pengingat absen masuk/pulang harian. Sudah dijadwalkan lokal di HP dari `/attendance/me/schedule` + `clockout_reminder_min` (`/attendance/me/rules`). Server jangan mengirim pengingat yang sama (dobel).

**Daftar event yang dibutuhkan** (urut prioritas; teks contoh dalam bahasa Indonesia, `en` menyesuaikan):

| # | Event key | Kategori | Penerima | Pemicu | `ref_type` / `ref_id` | Judul / isi (contoh) | Wajib |
|---|---|---|---|---|---|---|---|
| 1 | `approval.pending` | approval | Approver step aktif (sesuai policy) | Pengajuan masuk ke step yang ia pegang (cuti, lembur, koreksi, payroll run) | `approval_request` / `request_id` | **Persetujuan baru** · "Sari mengajukan cuti 20–21 Nov" | |
| 2 | `leave.approved` | approval | Pengaju | Cuti disetujui di step terakhir | `leave_request` / id | **Cuti disetujui** · "Cuti 20–21 Nov disetujui" | |
| 3 | `leave.rejected` | approval | Pengaju | Cuti ditolak di step mana pun | `leave_request` / id | **Cuti ditolak** · "Cuti 20–21 Nov ditolak. Lihat catatan atasan." | |
| 4 | `overtime.approved` | approval | Pengaju | Ajuan lembur disetujui | `overtime_request` / id | **Lembur disetujui** · "Lembur 26 Nov 17:00–19:00 disetujui" | |
| 5 | `overtime.rejected` | approval | Pengaju | Ajuan lembur ditolak | `overtime_request` / id | **Lembur ditolak** · "Lembur 26 Nov ditolak. Lihat catatan atasan." | |
| 6 | `correction.approved` | approval | Pengaju | Koreksi absen disetujui | `attendance_correction` / id | **Koreksi disetujui** · "Jam masuk 26 Nov diubah ke 08:00" | |
| 7 | `correction.rejected` | approval | Pengaju | Koreksi absen ditolak | `attendance_correction` / id | **Koreksi ditolak** · "Koreksi jam masuk 26 Nov ditolak" | |
| 8 | `payroll.payslip_published` | payroll | Karyawan pemilik slip | Payroll run `paid` / slip terbit | `payslip` / id | **Slip gaji terbit** · "Slip gaji November 2026 sudah tersedia" (tanpa nominal) | ✅ |
| 9 | `overtime_order.issued` | attendance | Karyawan di baris SPL | SPL berstatus `issued` | `overtime_order` / id | **Surat perintah lembur** · "Anda dijadwalkan lembur 28 Nov 17:00–20:00" | |
| 10 | `attendance.auto_clocked_out` | attendance | Karyawan | Sweep auto clock-out menutup record (`auto_clockout_enabled`) | `attendance_record` / id | **Absen pulang otomatis** · "Absen pulang 26 Nov ditutup otomatis. Ajukan koreksi bila jamnya salah." | |
| 11 | `employment.contract_expiring` | employment | Karyawan + pemegang `employees:read` cabangnya | Job `core_hr.contract.expiry_check` (sudah ada, saat ini email) | `contract` / id | **Kontrak segera berakhir** · "Kontrak Anda berakhir 31 Des 2026" | |
| 12 | `employment.assignment_changed` | employment | Karyawan | Mutasi/promosi terjadwal diterapkan (`core_hr.mutation_request.apply_scheduled`) | `assignment` / id | **Penempatan baru** · "Mulai 1 Des Anda di Cabang Bandung sebagai Supervisor" | |
| 13 | `schedule.changed` | attendance | Karyawan | Jadwal/shift hari ini s/d 14 hari ke depan diubah HR (manual / pola) | `schedule` / tanggal `YYYY-MM-DD` | **Jadwal berubah** · "Shift 30 Nov diubah ke Malam (22:00–06:00)" | |
| 14 | `auth.tenant_invitation` | system | Akun yang diundang | Undangan ke perusahaan lain dibuat | `tenant_invitation` / tenant_id | **Undangan perusahaan** · "Anda diundang bergabung ke PT Yubi Techno Craft" | |
| 15 | `system.subscription_ending` | system | Pemegang permission admin tenant | Trial/langganan berakhir ≤ 3 hari lagi, dan saat jadi `read_only` (lihat [PLAT-1](./platform.md#plat-1)) | `subscription` / id | **Langganan segera berakhir** · "Langganan perusahaan berakhir 3 hari lagi" | ✅ |

**Opsional / menyusul** (tidak memblokir rilis):

| Event key | Kategori | Keterangan |
|---|---|---|
| `approval.reminder` | approval | Pengajuan menunggu > 24 jam di step yang sama, 1× per hari ke approver |
| `approval.cancelled` | approval | Pengaju membatalkan ajuan yang sedang menunggu → approver step aktif, agar kartu tidak dibuka sia-sia |
| `leave.cancelled_by_hr` | approval | HR membatalkan cuti yang sudah disetujui |
| `employment.document_expiring` | employment | Sertifikat (`certificates[].expire_date`) berakhir ≤ 30 hari |
| `system.announcement` | system | Pengumuman HR ke seluruh tenant / cabang (butuh fitur pengumuman di backoffice) |

- **Catatan BE:** —

---

### NOTIF-2
**Bahasa push mengikuti bahasa app** · P3 · `Open`

- **Konteks:** katalog punya teks `en` + `id`, tetapi push dikirim tanpa konteks bahasa penerima. App default Bahasa Indonesia, user bisa ganti ke English.
- **Usulan:** tambah field opsional `locale` (`id` / `en`) di `POST /notifications/devices`; render teks push per device (fallback `en`). App mengirim ulang saat user ganti bahasa. Inbox (`GET /notifications`) boleh memakai header `Accept-Language` yang sudah dikirim app.
- **Catatan BE:** —

---

### NOTIF-3
**Kontrak `data` push yang dibaca mobile** · P2 · `Open`

- **Konteks:** [api/notification.md §3](../api/notification.md) sudah mendefinisikan `notification_id`, `event_key`, `category`, `tenant_id`, `ref_type`, `ref_id`, `link`. Mobile memetakan layar dari `ref_type`, bukan dari `link` (path backoffice).
- **Yang diminta:** nilai `ref_type` mengikuti tabel di bawah (string tetap, huruf kecil), dan untuk `approval.pending` tambahkan `data.document_type` (`leave_request` / `overtime_request` / `attendance_correction` / `payroll_run`) agar app langsung membuka tab yang tepat. Semua nilai `data` string (aturan FCM).

| `ref_type` | Layar di app | Catatan |
|---|---|---|
| `approval_request` | Pusat Persetujuan, tab sesuai `document_type` | |
| `leave_request` | Cuti → detail ajuan (timeline) | |
| `overtime_request` | Lembur → tab Pengajuan | |
| `overtime_order` | Lembur → tab SPL | |
| `attendance_correction` | Presensi → Ringkasan → Pengajuan koreksi | |
| `attendance_record` | Presensi → Hari Ini / riwayat tanggal itu | |
| `schedule` | Jadwal Shift, tanggal `ref_id` | `ref_id` = tanggal |
| `payslip` | Payroll → detail slip | |
| `contract`, `assignment` | Profil → Riwayat Karier | |
| `tenant_invitation` | Profil → kartu undangan | |
| `subscription` | Beranda (banner langganan) | |
| *(kosong / tidak dikenal)* | Inbox notifikasi | |

**Alur di app (sudah / akan dikerjakan di mobile):**
1. Setelah login, pilih tenant, ganti tenant, dan setiap `onTokenRefresh` → `POST /notifications/devices` (`token`, `platform`, `device_id`, `device_name`, `app_version`, `locale`). Simpan `data.id`.
2. Logout → `DELETE /notifications/devices/{id}` **sebelum** `POST /auth/logout`; 404 diabaikan.
3. Push diterima saat app terbuka → tampil sebagai notifikasi lokal + perbarui badge (`GET /notifications/unread-count`).
4. Push dibuka → bila `tenant_id` ≠ tenant aktif, tanya user lalu `POST /auth/switch-tenant`; buka layar sesuai `ref_type`; `PATCH /notifications/{notification_id}/read`.
5. Menu **Notifikasi** = `GET /notifications` (filter belum dibaca / kategori), "Tandai semua dibaca" = `POST /notifications/read-all`.
6. Profil → **Pengaturan notifikasi** = `GET`/`PUT /notifications/preferences` (push per kategori; sel `locked` tampil non-aktif).
7. App berhenti subscribe topic global lama (`all_employees`, `announcements`) — semua push lewat token device per user/tenant.

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
- **Catatan BE:** —
