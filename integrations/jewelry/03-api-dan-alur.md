<!-- 📁 integrations/jewelry/03-api-dan-alur.md -->
# 03 — API dan Alur

## Endpoint HR (`/api/v1/auth`)

| Method | Path | Permission | Isi |
|---|---|---|---|
| GET | `/auth/me` | login | Principal efektif: `user`, `tenant_id`, `active_branch_id`, `session_id`, `is_super_admin`, `roles`, `grants[{key, scope, branch_id}]` (sudah dipersempit ke branch aktif), `assigned_grants` (grant asli sebelum dipersempit, dipakai switcher branch), `avatar_url` |
| POST | `/auth/me/avatar/presign` · `/confirm`, DELETE `/auth/me/avatar` | login | Avatar HR |
| GET | `/auth/users` | `employees:read` / `employees:write` / `approval:config` | Akun company (dari Jewelry) |
| GET | `/auth/users/:id` | sama | Satu akun, hanya bila anggota company |
| POST | `/auth/users/:id/password-reset` | `employees:write` | Jewelry mengirim email reset |

## Endpoint Jewelry yang dipakai

| Pemakai | Endpoint |
|---|---|
| HR-BO | `POST /api/v1/auth/login`, `/refresh`, `/logout`, `GET /auth/profile`, `POST /auth/switch-context`, `POST /auth/handoff/exchange`, `POST /auth/change-password` |
| Jewelry-FE (launcher) | `GET /api/v1/apps`, `POST /api/v1/auth/handoff` |
| HR-API | `GET /.well-known/jwks.json`, `GET /api/v1/auth/authorization?app=hr`, `/api/v1/internal/*` (companies, branches, users, provision user, assign role, ubah status, `PUT /catalog` sync katalog permission & role sistem) dengan `X-App-Key` |

## Alur

### Login di halaman HR
1. HR-BO `POST Jewelry /auth/login` (email, password).
2. Token disimpan di cookie HR; HR-BO memuat Jewelry `/auth/profile` + HR `/auth/me`.
3. Bila token belum punya company (user punya >1 company) → `/auth/select-company` → Jewelry `switch-context` → token baru.
4. Bila tidak punya role HR di company itu → `/auth/no-access`.

### SSO dari backoffice Jewelry
1. App launcher → Jewelry `POST /auth/handoff {app: "hr"}` → redirect ke `<HR_APP_URL>/auth/callback#code=…` (kode di fragment, sekali pakai, 60 dtk).
2. HR-BO `/auth/callback` membaca kode, langsung menghapusnya dari URL, lalu `POST /auth/handoff/exchange` → sesi Jewelry baru.
3. Lanjut seperti langkah 2–4 login.

### Ganti company / branch
Switcher di sidebar memanggil Jewelry `switch-context {company_id, branch_id}`, menyimpan token baru, lalu me-reload aplikasi. `branch_id` kosong = seluruh company. Boleh-tidaknya memilih "All Branches" dibaca dari `assigned_grants` (`branch:read` scope tenant), bukan `grants`, supaya role tingkat company yang sedang di satu branch tetap bisa kembali ke semua branch atau pindah ke branch lain.

### Refresh
Saat HR menjawab 401, HR-BO memanggil Jewelry `/auth/refresh` (single-flight, refresh token dirotasi) lalu mengulang request sekali.

- **Antar-tab**: refresh berjalan di bawah Web Lock `hr-token-refresh` dan membaca ulang cookie lebih dulu. Bila tab lain sudah merotasi token, tab ini memakai token baru itu, bukan me-refresh dengan token lama (yang pasti ditolak Jewelry lalu menghapus cookie milik tab lain).
- **Gagal**: hanya penolakan refresh token (4xx) yang menghapus sesi dan kembali ke login. Error jaringan / 5xx Jewelry membiarkan sesi; request itu saja yang gagal.
- **Umur sesi** diatur Jewelry: access token 15 menit; refresh token 30 hari bila login dengan *Remember me*, 12 jam (bergeser tiap refresh) bila tidak. SSO dari BO Jewelry mewarisi pilihan *Remember me* sesi asalnya.

### Pencabutan
Logout, suspend user, atau cabut role di Jewelry berlaku di HR paling lambat 60 dtk (umur cache grant).

## Tema

Jewelry mengirim `theme` (`green | brown | gold | black`) di respons login/profile. HR-BO memasang `<html data-theme>`; `assets/css/main.css` memetakan tiap preset ke skala warna `brand` Nuxt UI, font Inter/Cormorant Garamond, dan radius 6px. Tema terakhir diingat di cookie `hr_theme` untuk halaman login.
