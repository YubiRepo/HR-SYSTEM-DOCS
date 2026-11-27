<!-- 📁 plans/2026-11-27-login-with-google.md -->
# Rencana: Login dengan Google (Sign in with Google)

| | |
|---|---|
| **Status** | **Draft — menunggu review.** Belum ada fase yang dikerjakan. |
| **Tanggal** | 2026-11-27 |
| **Pemicu** | User ingin masuk ke HR System (backoffice/ESS dan mobile) memakai akun Google, tanpa mengetik password. |
| **Referensi** | Implementasi Google login di `k-forum-api` (lihat [§1.2](#_1-2-referensi-k-forum-api)). |
| **Modul terdampak** | HR-API: auth (user, session, config). HR-BO: halaman login, store user, halaman profil. Docs: modul [auth](../modules/auth/). |
| **Mengubah keputusan** | Menambah metode login di samping password. Tidak mengubah model tenancy, RBAC, atau alur pemilihan tenant. |

### Repo & tag

| Tag | Peran | Path repo |
|---|---|---|
| `[HR-API]` | Target | `/home/yubi/Data/projects/easy-hr/HR-SYSTEM-API` |
| `[HR-BO]` | Target | `/home/yubi/Data/projects/easy-hr/HR-SYSTEM-BACKOFFICE` |
| `[DOCS]` | Target | `/home/yubi/Data/projects/easy-hr/HR-SYSTEM-DOCS` |
| `[KF-API]` | Referensi | `/home/yubi/Data/projects/k-forum-ws/k-forum-api` |

Path file dalam fase ditulis relatif terhadap root repo tag tersebut.

Aturan kerja: commit hanya jika diminta; migrasi ditulis tetapi dijalankan oleh user; `graphify update .` setelah mengubah kode; teks UI dalam bahasa Inggris.

---

## 1. Kondisi saat ini

### 1.1 HR System `[HR-API]` / `[HR-BO]`

- Akun bersifat **global** (`users`: email/phone/username unik global) dan akses ke tenant lewat `tenant_members` (`active` / `invited` / `suspended`).
- **Tidak ada registrasi mandiri.** Akun dibuat oleh admin (`POST /auth/register`) atau lewat undangan (`POST /auth/users`). Akun baru yang dibuat dengan password sementara langsung `email_verified = true`.
- `POST /auth/login` (`internal/modules/auth/application/user/command/login.go`) melakukan dua hal yang terpisah secara logika:
  1. **Autentikasi**: cari user via identifier → `MaybeUnlock` → `EnsureCanLogin` → verifikasi password → catat gagal/sukses (lockout).
  2. **Penentuan konteks sesi**: platform staff → sesi tanpa tenant; `tenant_id` diminta → masuk tenant itu; satu membership → masuk langsung; selebihnya → `tenant_selection_required` + `selection_token`.
- Penerbitan token lewat `sessionIssuer` (`command/session.go`): access JWT RS256 + refresh token opaque (rotasi + reuse detection).
- `users.avatar_key` sudah mendukung prefix `ext:<url>` (komentar di entity menyebut contoh "Google picture").
- Semua endpoint `/auth/*` sudah dibungkus `authRateLimitMW`.
- BO menyimpan token di cookie (`useAuthTokens`), store `app/stores/user.ts` punya `login()` dan alur pilih tenant.

### 1.2 Referensi k-forum-api

| Bagian | File `[KF-API]` | Catatan |
|---|---|---|
| Port verifier | `internal/app/port/google_oauth_verifier.go` | `VerifyIDToken(ctx, idToken, allowedClientIDs) → {Subject, Email, Name, Picture}` |
| Adapter | `internal/infrastructure/external/googleoauth/verifier.go` | Memanggil `https://oauth2.googleapis.com/tokeninfo`, cek `aud` ∈ allowlist, `email_verified` |
| Use case | `internal/app/usecase/auth/google_login.go` | Cari identity `GOOGLE` by `sub` → kalau tidak ada, cari by email (harus verified) lalu **link** → kalau tidak ada, **buat user baru** |
| Model | `internal/domain/user/entity/credential.go` | `Credential` tipe `GOOGLE` + `LoginIdentity` (kind `GOOGLE`, value = `sub`) |
| Config | `internal/config` + `.env.example` | `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID` → `AllowedGoogleClientIDs()` |
| Route | `router.go` | `POST /web/auth/login/google`, `POST /mobile/auth/login/google`, `DELETE /user-settings/linked-accounts/google` |
| Error | `user_constant.go` | `GOOGLE_UNLINK_REQUIRES_PASSWORD`, `GOOGLE_NOT_LINKED` |

**Yang diambil:** pola *ID token dari client → diverifikasi backend → token internal diterbitkan*, port verifier yang bisa di-fake di test, allowlist `aud` per platform, linking by `sub` lalu fallback by email, guard unlink.

**Yang tidak diambil:**
- **Auto-create user.** k-forum adalah aplikasi publik; HR System hanya untuk akun yang dibuat admin/undangan. Akun Google yang tidak cocok dengan user mana pun ditolak.
- **Model `Credential` + `LoginIdentity`.** HR tidak punya pemisahan ini; cukup satu tabel identitas eksternal.
- **Verifikasi via endpoint `tokeninfo`.** Endpoint itu ditujukan untuk debugging, menambah satu round-trip ke Google per login, dan tidak memverifikasi `iss`. HR memverifikasi tanda tangan secara lokal dengan JWKS Google (lihat §2.3).

---

## 2. Arsitektur target

### 2.1 Alur

```
 BO (Google Identity Services)            HR-API                              Google
 ─────────────────────────────            ──────                              ──────
 klik "Sign in with Google"
   ── popup / One Tap ───────────────────────────────────────────────────────▶ consent
   ◀────────────────────────────────────────────────────── credential (ID token JWT)
 POST /api/v1/auth/login/google
   { id_token, tenant_id? } ─────────────▶ GoogleVerifier.Verify
                                            (JWKS cache, iss, aud, exp,
                                             email_verified)
                                           resolve user:
                                            1. user_external_identities(google, sub)
                                            2. users.email = email  → link
                                            3. tidak ada → GOOGLE_ACCOUNT_NOT_REGISTERED
                                           EnsureCanLogin (locked/disabled)
                                           completeLogin(...)  ← dipakai bersama
                                            dengan login password
   ◀── token pair  |  tenant_selection_required + selection_token
 (alur pilih tenant sama persis dengan login password)
```

Mobile identik, tetapi ID token didapat dari Google Sign-In native SDK dan dikirim ke endpoint yang sama.

### 2.2 Pemisahan autentikasi vs konteks sesi

Bagian kedua `LoginUseCase.Execute` (platform/tenant/selection) diekstrak menjadi helper bersama, misalnya `loginFinisher.complete(ctx, user, requestedTenantID, ua, ip, now)` di `command/login_flow.go`. `LoginUseCase` (password) dan `GoogleLoginUseCase` hanya berbeda di tahap autentikasi. Dengan begitu aturan tenant, audit `login.success`, dan `LastTenantID` tidak terduplikasi.

### 2.3 Verifikasi ID token

Port baru di `application/user/ports`:

```go
type GoogleIdentity struct {
    Subject       string // claim "sub" — kunci identitas yang stabil
    Email         string // lowercase
    EmailVerified bool
    Name          string
    Picture       string
    HostedDomain  string // claim "hd" (akun Google Workspace), kosong untuk @gmail.com
}

type GoogleTokenVerifier interface {
    Verify(ctx context.Context, idToken string) (*GoogleIdentity, error)
}
```

Adapter `infrastructure/user/external/google_verifier.go`:
- Verifikasi tanda tangan RS256 memakai JWKS `https://www.googleapis.com/oauth2/v3/certs` (cache sesuai header `Cache-Control`, refresh saat `kid` tidak dikenal). Dapat memakai `github.com/golang-jwt/jwt/v5` yang sudah ada di `go.mod` + fetcher JWKS kecil, atau `google.golang.org/api/idtoken`.
- Cek `iss` ∈ {`accounts.google.com`, `https://accounts.google.com`}, `aud` ∈ allowlist client ID, `exp`/`iat` dengan leeway kecil, `email_verified == true`.
- Allowlist kosong → fitur dianggap mati (bukan error 500).

### 2.4 Aturan pencocokan akun

| Kondisi | Hasil |
|---|---|
| `(google, sub)` sudah tertaut ke user X | Login sebagai X (email Google boleh sudah berubah) |
| Belum tertaut, ada user dengan `users.email` = email Google | **Tautkan** `(google, sub)` ke user itu, lalu login. Kalau `email_verified` user masih `false`, tandai `true` (Google sudah membuktikan kepemilikan email). Audit `identity.google.linked`. |
| User itu sudah punya tautan Google dengan `sub` lain | Tolak `GOOGLE_ACCOUNT_CONFLICT` (409) — satu user satu akun Google |
| Tidak ada user dengan email itu | Tolak `GOOGLE_ACCOUNT_NOT_REGISTERED` (401). Tidak ada auto-create. |
| User `disabled` / `locked` | Tolak dengan error yang sama seperti login password (`ACCOUNT_DISABLED` / `ACCOUNT_LOCKED`) |
| User tanpa membership aktif/invited (bukan platform staff) | `NO_ACTIVE_MEMBERSHIP`, sama seperti login password |

Login Google tidak menambah `failed_attempts` (tidak ada tebakan password), tetapi sukses login tetap memanggil `RecordSuccessfulLogin` (`last_login_at`).

Profil: kalau `avatar_key` kosong → isi `ext:<picture>`; kalau `display_name` kosong → isi `name`. Tidak menimpa nilai yang sudah ada.

### 2.5 Model data

Migrasi baru `[HR-API]` `migrations/<ts>_user_external_identities.{up,down}.sql`:

```sql
CREATE TABLE IF NOT EXISTS user_external_identities (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider      VARCHAR(20) NOT NULL CHECK (provider IN ('google')),
    subject       VARCHAR(255) NOT NULL,     -- claim "sub"
    email         VARCHAR(255),              -- email saat ditautkan (informasi, bukan kunci)
    linked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_uei_provider_subject ON user_external_identities (provider, subject);
CREATE UNIQUE INDEX IF NOT EXISTS idx_uei_user_provider    ON user_external_identities (user_id, provider);
```

Kolom `provider` sengaja generik agar Microsoft/Apple bisa ditambah tanpa tabel baru.

### 2.6 Kontrak API

| Method & path | Auth | Keterangan |
|---|---|---|
| `GET /api/v1/auth/providers` | Publik | `{ "password": true, "google": { "enabled": true, "client_id": "<web client id>" } }` — BO memutuskan menampilkan tombol dari sini |
| `POST /api/v1/auth/login/google` | Publik, rate-limited | Body `{ id_token, tenant_id? }`. Response **sama persis** dengan `POST /auth/login` (`LoginResponse`) |
| `GET /api/v1/auth/me/linked-accounts` | Login | `[{ provider, email, linked_at, last_used_at }]` |
| `POST /api/v1/auth/me/linked-accounts/google` | Login | Body `{ id_token }`. Menautkan akun Google ke user yang sedang login (email Google boleh berbeda dari email akun) |
| `DELETE /api/v1/auth/me/linked-accounts/google` | Login | Lepas tautan. Ditolak `GOOGLE_UNLINK_REQUIRES_PASSWORD` kalau user tidak punya `password_hash` |

Selection token, `POST /auth/select-tenant`, refresh, dan logout tidak berubah.

### 2.7 Kode error baru

| Code | HTTP | Kapan |
|---|---|---|
| `GOOGLE_LOGIN_DISABLED` | 404 | Allowlist client ID kosong / flag mati |
| `GOOGLE_TOKEN_INVALID` | 401 | Tanda tangan, `iss`, `aud`, atau `exp` tidak valid |
| `GOOGLE_EMAIL_UNVERIFIED` | 401 | `email_verified` false |
| `GOOGLE_ACCOUNT_NOT_REGISTERED` | 401 | Tidak ada akun HR yang cocok |
| `GOOGLE_ACCOUNT_CONFLICT` | 409 | `sub` sudah dipakai user lain, atau user sudah tertaut ke `sub` lain |
| `GOOGLE_NOT_LINKED` | 404 | Unlink padahal belum tertaut |
| `GOOGLE_UNLINK_REQUIRES_PASSWORD` | 422 | Unlink akan membuat akun tanpa cara login |

### 2.8 Konfigurasi

Tambah section **Google Sign-In** di bagian bawah `.env.example` / `.env.staging.example` `[HR-API]`:

```dotenv
# --- Google Sign-In ---------------------------------------------------------
# Kosongkan semua client ID untuk mematikan login Google.
GOOGLE_WEB_CLIENT_ID=
GOOGLE_ANDROID_CLIENT_ID=
GOOGLE_IOS_CLIENT_ID=
```

Catatan mobile: pada Android, ID token dari Google Sign-In umumnya ber-`aud` **web client ID** (`serverClientId`), bukan Android client ID. Allowlist tetap menerima ketiganya.

`[HR-BO]` tidak perlu env tambahan bila client ID diambil dari `GET /auth/providers`.

---

## 3. Hal yang perlu diperhatikan

1. **Tanpa auto-create.** Ini perbedaan paling penting dari k-forum. Pesan error di BO harus jelas: "No HR account uses this Google email. Ask your administrator to invite you."
2. **Linking otomatis by email** aman karena akun HR hanya dibuat oleh admin dan Google sudah memverifikasi email. Risiko yang tersisa: admin salah mengetik email undangan ke alamat milik orang lain — sama risikonya dengan alur reset password hari ini.
3. **Kunci identitas adalah `sub`, bukan email.** Email Google bisa berubah; setelah tertaut, login tetap jalan walau email berbeda.
4. **Lockout tetap dihormati.** User yang dikunci karena salah password tidak bisa melewatinya lewat Google (konsisten, sederhana). Jika nanti diputuskan sebaliknya, cukup ubah satu cek.
5. **MFA.** Belum ada MFA di API. Jika ditambahkan, langkah MFA berada di `completeLogin`, sehingga berlaku untuk kedua metode.
6. **Pembatasan domain (`hd`).** Tidak dikerjakan sekarang. Klaim `hd` sudah dibawa di `GoogleIdentity` agar nanti tenant bisa mewajibkan domain Workspace tertentu.
7. **Integrasi Jewelry.** Di branch `jewerly-integration`, auth lokal HR dihapus (Fase 19 [plan Jewelry](./2026-11-16-integrasi-jewelry-identity-rbac.md)). Rencana ini menyasar auth lokal HR (`staging`/`main`). Bila integrasi Jewelry di-merge, login Google seharusnya dipindahkan ke Jewelry sebagai identity provider; port verifier dan aturan pencocokan di dokumen ini tetap bisa dipakai ulang di sana.
8. **CSP/BO.** Script `https://accounts.google.com/gsi/client` dan popup Google harus diizinkan bila BO memasang Content-Security-Policy; `Cross-Origin-Opener-Policy` tidak boleh `same-origin` di halaman login (pakai `same-origin-allow-popups`).
9. **Google Cloud Console.** Daftarkan origin BO (dev `http://localhost:<port>`, staging, production) di *Authorized JavaScript origins* web client. Tidak perlu redirect URI karena memakai alur ID token, bukan authorization code.

---

## 4. Fase pengerjaan

### Bagian A — Backend

#### Fase 1 — Config & verifier `[HR-API]`
- `internal/shared/config/config.go`: `GoogleConfig{WebClientID, AndroidClientID, IOSClientID}` + `AllowedGoogleClientIDs()` (trim, buang kosong) + `GoogleEnabled()`.
- `.env.example`, `.env.staging.example`: section Google Sign-In (§2.8).
- Port `GoogleTokenVerifier` di `internal/modules/auth/application/user/ports/ports.go`.
- Adapter `internal/modules/auth/infrastructure/user/external/google_verifier.go` (JWKS cache, cek `iss`/`aud`/`exp`/`email_verified`). Unit test dengan JWKS & token buatan sendiri (kunci RSA test).

#### Fase 2 — Model & repository `[HR-API]`
- Migrasi `user_external_identities` (§2.5), up & down.
- Entity `domain/user/entity/external_identity.go` + konstanta provider `google`.
- `ExternalIdentityRepository` di `domain/user/repository/interfaces.go`: `FindByProviderSubject`, `FindByUserProvider`, `ListByUser`, `Save`, `Touch(lastUsedAt)`, `Delete`.
- Implementasi `infrastructure/user/persistence/postgres_external_identity_repo.go` + model GORM di `model.go`.

#### Fase 3 — Refactor alur login `[HR-API]`
- Ekstrak bagian penentuan konteks dari `command/login.go` ke `command/login_flow.go` (`complete(...)`) tanpa perubahan perilaku.
- Test `login` yang sudah ada harus tetap hijau sebelum lanjut.

#### Fase 4 — Use case Google `[HR-API]`
- `command/google_login.go`: verifikasi → resolve user (§2.4) → `MaybeUnlock` + `EnsureCanLogin` → link bila perlu (dalam transaksi bersama `MarkEmailVerified`) → isi avatar/display name kosong → `RecordSuccessfulLogin` → `complete(...)`.
- `command/linked_accounts.go`: link (user login), unlink (guard password), list.
- Kode error baru di `domain/user/constant/constant.go` + mapping HTTP (§2.7).
- Audit: `login.success` dengan atribut metode `google`, `login.google.failed`, `identity.google.linked`, `identity.google.unlinked`.
- Unit test dengan verifier fake: sub sudah tertaut, link by email, email belum verified di HR, akun tidak terdaftar, konflik sub, user disabled/locked, multi-tenant → selection, platform staff.

#### Fase 5 — HTTP & wiring `[HR-API]`
- DTO di `application/user/dto/auth_dto.go`: `GoogleLoginRequest{IDToken, TenantID}`, `LinkGoogleRequest`, `LinkedAccountResponse`, `AuthProvidersResponse`.
- Handler + route di `interfaces/http/user/{handler,router}.go` (§2.6); endpoint publik otomatis kena `authRateLimitMW`. Swagger annotation.
- Wiring di `internal/modules/auth/module.go` (verifier, repo, use case).
- `test.http` / koleksi request: contoh login Google.

### Bagian B — Backoffice

#### Fase 6 — Tombol login Google `[HR-BO]`
- Composable `useGoogleSignIn()` yang memuat GIS client script sekali, inisialisasi dengan `client_id` dari `GET /auth/providers`, dan mengembalikan `credential`.
- `app/pages/auth/login.vue`: tombol "Sign in with Google" (render `google.accounts.id.renderButton`) di bawah form, hanya bila provider aktif.
- `app/stores/user.ts`: `loginWithGoogle(idToken)` yang memakai jalur hasil yang sama dengan `login()` (token pair atau pemilihan tenant).
- Pesan error per kode (§2.7), teks bahasa Inggris.

#### Fase 7 — Linked accounts di profil `[HR-BO]`
- Bagian "Linked accounts" di halaman profil/akun: status tertaut (email Google, terakhir dipakai), tombol Link / Unlink.
- Sesuaikan CSP / COOP bila ada (§3 poin 8).

### Bagian C — Mobile & dokumentasi

#### Fase 8 — Kontrak mobile `[DOCS]`
- `modules/mobile/api/`: endpoint `POST /auth/login/google` dan catatan `aud` Android (`serverClientId` = web client ID).

#### Fase 9 — Dokumen modul auth `[DOCS]`
- [`03-api-contract.md`](../modules/auth/03-api-contract.md): endpoint §2.6.
- [`04-data-model.md`](../modules/auth/04-data-model.md): tabel `user_external_identities`.
- [`05-flows.md`](../modules/auth/05-flows.md): alur login Google & linking.
- [`06-security.md`](../modules/auth/06-security.md): verifikasi ID token, tanpa auto-create, `sub` sebagai kunci.
- [`07-errors.md`](../modules/auth/07-errors.md), [`08-config.md`](../modules/auth/08-config.md), [`09-clients.md`](../modules/auth/09-clients.md).

#### Fase 10 — Uji E2E
- Buat OAuth client di Google Cloud Console (staging origin).
- Skenario: user undangan login Google pertama kali (link otomatis), login kedua (by `sub`), email tidak terdaftar, user disabled, user multi-tenant (pilih tenant), platform staff, link/unlink dari profil, refresh token setelah login Google.

---

## 5. Keputusan yang perlu dikonfirmasi

| # | Pertanyaan | Usulan |
|---|---|---|
| 1 | Auto-create akun dari Google? | **Tidak** — hanya akun yang sudah dibuat admin/undangan |
| 2 | Auto-link by email saat login pertama? | **Ya**, dan tandai email terverifikasi |
| 3 | User `locked` boleh masuk lewat Google? | **Tidak** (konsisten dengan login password) |
| 4 | Batasi domain Google Workspace per tenant? | Ditunda; `hd` sudah disimpan di identitas hasil verifikasi |
| 5 | Target branch | `staging` → `main`; dipindah ke Jewelry bila integrasi di-merge |
