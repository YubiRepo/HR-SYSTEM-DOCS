<!-- 📁 modules/mobile/issues/auth.md -->
# Issues Backend — Auth

Kekurangan endpoint modul **Auth** di [API docs](../api/README.md) yang ditemukan saat integrasi aplikasi mobile. Tiap issue mengacu ke endpoint yang terdokumentasi dan dicek langsung ke server (akun karyawan `budi@gmail.com`, admin `nurdiansyah@gmail.com`, 11 Nov 2026). Keterangan status & prioritas: [Issues Backend](./README.md).

| ID | Judul | Prioritas | Status |
|---|---|---|---|
| [AUTH-1](#auth-1) | `PATCH /auth/me` tidak memvalidasi format HP & username | P2 | `Done` |
| [AUTH-2](#auth-2) | Confirm avatar dengan key tidak valid membalas `500` | P3 | `Done` |
| [AUTH-3](#auth-3) | Karyawan tidak bisa cek ketersediaan username / HP | P2 | `Done` |

---

### AUTH-1
**`PATCH /auth/me` tidak memvalidasi format HP & username** · P2 · `Done`

- **Endpoint:** `PATCH /auth/me` (Update My Profile)
- **Temuan:** input salah (mis. HP bukan E.164) ikut tersimpan. Validasi sementara hanya ada di app.
- **Catatan BE:** diperbaiki 26 Nov 2026 (Fase 3). `PATCH /auth/me` (dan `PATCH /auth/users/{id}/identifiers` admin, yang punya celah sama) kini memakai aturan registrasi: `phone` E.164, `username` `^[a-zA-Z0-9_.]{3,30}$` → salah format `400 INVALID_IDENTIFIER`. Hanya divalidasi bila nilainya **berubah**, supaya data lama yang formatnya tidak valid tidak menghalangi simpan field lain. Lihat [api/auth.md](../api/auth.md) §6a.

### AUTH-2
**Confirm avatar dengan key tidak valid membalas `500`** · P3 · `Done`

- **Endpoint:** `POST /auth/me/avatar/confirm`
- **Harapan:** `4xx` (mis. `400 INVALID_ARGUMENT`), bukan `500`.
- **Catatan BE:** diperbaiki 26 Nov 2026 (Fase 3). Key di luar `pending/avatars/` atau objek yang tidak ada di storage (belum di-upload / kedaluwarsa / key karangan) → `422 VALIDATION_ERROR` ("upload the file again"). Gangguan storage tetap `500`. Storage kini membedakan objek tidak ada (`storage.ErrUploadNotFound`) dari error koneksi.

### AUTH-3
**Karyawan tidak bisa cek ketersediaan username / HP** · P2 · `Done`

- **Endpoint:** `GET /auth/identifiers/availability?username=&phone=&email=&exclude_user_id=` (Check Identifier Availability) → `PERMISSION_DENIED` untuk karyawan (dicek dengan akun `tester.presensi@gmail.com`, 11 Nov 2026). Saat ini dibatasi `users:write` (router `auth/interfaces/http/user/router.go`).
- **Kebutuhan:** form *Akun Login* di app mengecek username / nomor HP **sebelum** `PATCH /auth/me` — saat mengetik dan sekali lagi tepat sebelum simpan. App sudah memanggil endpoint ini dengan `exclude_user_id` = id user sendiri.
- **Usulan:** buka endpoint ini untuk karyawan (scope `self`) tanpa endpoint baru. Bila khawatir enumerasi email/HP, cukup batasi `exclude_user_id` = user yang login untuk non-admin, plus rate limit.
- **Perilaku app sampai dibuka:** cek yang ditolak tidak memblokir — tampil "Ketersediaan dicek saat disimpan", dan server tetap menolak duplikat via `USERNAME_ALREADY_EXISTS` / `PHONE_ALREADY_EXISTS`. Setelah dibuka, app langsung jalan tanpa perubahan.
- **Catatan BE:** diselesaikan dengan endpoint self-service baru `GET /auth/me/identifiers/availability?username=&phone=&email=` (*Check My Identifier Availability*, `auth/interfaces/http/user/router.go:43`). Tanpa `exclude_user_id`: nilai milik user yang login otomatis dianggap tersedia. Endpoint admin tetap `users:write`.
- **Di app (16 Nov 2026):** form *Akun Login* pindah ke endpoint ini; respons sama (`username_available`, `phone_available`, `email_available`).
