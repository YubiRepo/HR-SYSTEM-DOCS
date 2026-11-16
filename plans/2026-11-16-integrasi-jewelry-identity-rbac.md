<!-- 📁 plans/2026-11-16-integrasi-jewelry-identity-rbac.md -->
# Rencana: Integrasi Jewelry sebagai Identity, Registry Company/Branch & Master RBAC untuk HR System

| | |
|---|---|
| **Status** | **Sedang dikerjakan.** Selesai: Fase 1–11. |
| **Tanggal** | 2026-11-16 |
| **Pemicu** | Auth, authz, tenant (company) dan branch HR dipindahkan ke platform Jewelry. Company yang terdaftar di Jewelry otomatis dapat akses semua aplikasi, sehingga entitlement HR dihapus. |
| **Keputusan user** | (1) **Tenant HR = company Jewelry** (`tenants.id` HR = `companies.id` Jewelry; branch HR = branch Jewelry; semua UUID). (2) **Jewelry menjadi master RBAC**: catalog permission HR didaftarkan di Jewelry dengan dimensi aplikasi, role & assignment HR dikelola di backoffice Jewelry. (3) **Data HR boleh direset**, tanpa migrasi data lama. (4) **jewelry-be/fe boleh diubah dan ditambah fitur** untuk kebutuhan HR. (5) Role HR yang di-seed hanya `company_admin`, `branch_admin`, `employee`. (6) Tanpa registrasi aplikasi; konfigurasi aplikasi lewat env. (7) **Tema backoffice HR mengikuti tema BO Jewelry.** (8) **Database HR selama pengerjaan integrasi: `hr_system_jewerly`.** |
| **Modul terdampak** | HR: auth, rbac, platform (tenant, branch, entitlement, billing, impersonation), core-hr (akun karyawan), attendance/leave/payroll (gate entitlement), worker. Jewelry: auth, authz/role, organization, router, backoffice shell. |
| **Repo terkait** | Lihat tabel di bawah. |
| **Mengubah keputusan** | Menggantikan [architectures/HRMS_Tenancy_Model.md](../architectures/HRMS_Tenancy_Model.md) (provisioning tenant oleh platform HR), dokumen modul [auth](../modules/auth/), [rbac](../modules/rbac/), dan [platform](../modules/platform/) (entitlement/billing/tenant lifecycle). Dokumen modul tersebut diperbarui setelah fase terkait selesai. |

### Repo & tag

Setiap fase diberi tag repo di judulnya. Path file dalam fase ditulis **relatif terhadap root repo tag tersebut**.

| Tag | Peran | Path repo | Branch kerja |
|---|---|---|---|
| `[HR-API]` | Target | `/home/yubi/Data/projects/easy-hr/HR-SYSTEM-API` | `jewerly-integration` |
| `[HR-BO]` | Target | `/home/yubi/Data/projects/easy-hr/HR-SYSTEM-BACKOFFICE` | `jewerly-integration` |
| `[JW-BE]` | Referensi (identity provider) | `/home/yubi/Data/projects/jewelry/jewelry-be` | `hr-system` |
| `[JW-FE]` | Referensi (backoffice) | `/home/yubi/Data/projects/jewelry/jewelry-fe` | `hr-system` |

> **Catatan database:** selama pengerjaan integrasi Jewelry, `[HR-API]` memakai database baru **`hr_system_jewerly`** (bukan `hr_system`), agar database HR lama tetap utuh. Ubah `DB_NAME` di `.env` dan `.env.example`, default `POSTGRES_DB`/healthcheck di `docker-compose.dev.yml`, dan default `DB_NAME` di `internal/shared/config/config.go`. Pembuatan database dan menjalankan migrasi dilakukan oleh user. Dikerjakan di awal Fase 11.

Aturan kerja: commit hanya jika diminta; migrasi dan seeder ditulis tetapi dijalankan oleh user; `graphify update .` setelah mengubah kode.

---

## 1. Kondisi saat ini

### `[HR-API]` / `[HR-BO]`
- **Auth**: JWT RS256 diterbitkan sendiri (`internal/modules/auth/infrastructure/user/security/jwt_token_generator.go`, key di `certs/`), JWKS di `/.well-known/jwks.json`. Refresh token opaque dengan rotasi family (`refresh_tokens`). Password argon2. User global, keanggotaan lewat `tenant_members`.
- **Principal**: `internal/shared/principal/principal.go` (UserID, TenantID, SessionID, Grants, AssignedGrants, ActiveBranchID, …). Tenant hanya dari klaim `tenant_id`.
- **RBAC**: 68 permission di `internal/modules/auth/domain/role/constant/permissions.go`. Tabel `roles`, `role_permissions` (dengan data scope `self|branch|tenant`), `role_assignments` (scope `tenant|branch|platform`), `role_templates`. Pengecekan lewat ~156 `middleware.RequirePermission` dan ~35 `Principal.Authorize` + `internal/shared/branchscope`.
- **Tenant & branch**: `internal/modules/platform/` (`tenants`, `branches`, `ProvisionTenantUseCase`, lifecycle). ~80 tabel memakai `tenant_id`, ~14 tabel memakai `branch_id`, tanpa FK ke `tenants`.
- **Entitlement/billing**: `plans`, `subscriptions`, `benefits`, dll.; gate di `internal/shared/entitlementgate` (10 `RequireBenefit`, 14 file `EnsureBenefit/EnsureQuota`); job renewal/dunning di worker.
- **Frontend**: `app/stores/user.ts`, `app/composables/useApiClient.ts` (token di cookie), `app/middleware/auth.global.ts`, `usePermissions`, `AppPermissionGate`, `useEntitlementGate`.

### `[JW-BE]` / `[JW-FE]`
- **Hierarki**: tenant → company → branch. User punya satu `tenant_id`; akses ke company/branch lewat `user_role_assignments` (scope `tenant|company|branch`).
- **Token**: JWT RS256 (`internal/infrastructure/jwttoken/*`), klaim `iss`, `aud="jewelry"` (hard-coded), `sub`, `typ`, `tid`, `cid`, `bid`, `sid`. **Belum ada `kid` dan JWKS.** Permission tidak di token; setiap request divalidasi ke DB (`ResolveStaffPrincipal`).
- **RBAC**: tabel `permissions` (catalog global, kode `UPPER_SNAKE`), `roles` (`grants_all`, `is_system`), `role_permissions`, `user_role_assignments`. Catalog di `internal/domain/authz/constant/permissions.go`. **Tidak ada dimensi aplikasi.**
- **Tidak ada**: SSO/OIDC, service-to-service API, event/broker, konsep aplikasi/entitlement.
- **Frontend**: token di localStorage/sessionStorage (`app/utils/backoffice/auth.token-storage.ts`), header Bearer; belum ada app launcher.

---

## 2. Arsitektur target

- **HR menjadi resource server.** HR tidak lagi menerbitkan token. HR FE memegang token Jewelry (access + refresh) dan me-refresh ke Jewelry. HR API memverifikasi JWT Jewelry via **JWKS** (`aud` berisi `hr`).
- **Mapping klaim → `principal.Principal`**: `sub`→UserID, `cid`→TenantID, `bid`→ActiveBranchID, `sid`→SessionID, `typ` wajib `staff`. Token tanpa `cid` → 403 `CONTEXT_REQUIRED`.
- **Permission tidak di token.** `PrincipalMiddleware` HR memanggil `GET /api/v1/auth/authorization?app=hr` di Jewelry dengan token user; hasil di-cache Redis per `sid` (pola `redis_principal_cache.go`, TTL 60 detik). 401 dari Jewelry berarti sesi dicabut.
- **Data master di HR = proyeksi.** `tenants`, `branches`, `users` tetap ada dengan id = id Jewelry, ditambah kolom milik HR (timezone, profil perusahaan HR, `is_default` branch). Diisi **JIT** + **sync periodik**. Tabel `tenant_id`/`branch_id` lain tidak berubah.
- **SSO dari backoffice Jewelry**: one-time handoff code (TTL 60 detik, sekali pakai, redirect hanya ke callback URL yang dikonfigurasi lewat env) → HR FE menukar code → token pair sesi baru.
- **Tanpa entitlement**: semua company aktif di Jewelry otomatis bisa memakai semua aplikasi aktif.

---

## 3. Hal yang perlu diperhatikan

1. **Hierarki beda**: assignment level *tenant* Jewelry (mis. `owner`) berlaku sebagai scope `tenant` HR di **setiap company** milik tenant itu.
2. **Model scope beda**: HR punya data scope `self|branch|tenant` per permission; Jewelry hanya scope assignment. Tambah `role_permissions.data_scope` (`self` | null) di Jewelry. Mapping: company→`tenant`, branch→`branch`, `data_scope=self`→`self`. `Principal.Authorize` dan `branchscope` HR tidak berubah.
3. **Format kode permission**: kode HR (`resource:action`) disimpan apa adanya di Jewelry dengan `app='hr'`, sehingga pemanggilan `RequirePermission`/`Authorize` di HR tidak perlu disentuh.
4. **`grants_all`** (`owner`, `company_admin`): rekomendasi mencakup semua permission HR, sesuai prinsip "company otomatis dapat akses semua aplikasi".
5. **Login karyawan (ESS)**: login Jewelry hanya via email; email unik global; satu user hanya satu tenant. Karyawan tanpa email tidak bisa login, dan email yang sudah dipakai di tenant lain akan bentrok. **Harus diputuskan sebelum Fase 11** (wajib email, atau tambah login username/phone di Jewelry).
6. **Ketergantungan runtime**: setiap request HR bergantung pada Jewelry (dengan cache 60 detik). Rekomendasi: fail-closed.
7. **JWKS & `aud`**: perubahan di Jewelry tidak boleh merusak klien Jewelry yang sudah ada.
8. **Service-to-service** belum ada di Jewelry → perlu API key per aplikasi, diset lewat **env** (tanpa tabel registry aplikasi).
13. **Role HR hanya tiga**: `company_admin`, `branch_admin`, `employee`. Role HR lama `hr_admin`, `manager`, `tenant_admin` tidak dibawa. Permission yang dulu dipegang `manager` (mis. approval bawahan) harus tercakup oleh `employee` + logika approval berbasis atasan langsung (`EmployeeByUserID`/manager chain), bukan oleh role. Perlu dicek saat Fase 5.
14. **Nama role bentrok**: Jewelry sudah punya role sistem `company_admin` (app `jewelry`, `grants_all`). Role HR memakai kode yang sama dengan `app='hr'`, jadi unique key role harus menyertakan `app`.
15. **Tema beda library**: BO Jewelry memakai Vuetify dengan preset tema per tenant (`green`, `brown`, `gold`, `black`; default `green`), disimpan di `tenant_themes` dan dikirim di payload session (`theme` di `internal/app/dto/auth_dto.go`). Token desain ada di `[JW-FE]` `design/tokens.target.json` dan `app/assets/css/themes.css`. HR BO memakai Nuxt UI (`primary: 'blue'`, `neutral: 'zinc'` di `app/app.config.ts`). Jadi yang diikuti adalah **token** (warna brand per preset, font, radius), bukan komponen Vuetify.
9. **Superadmin Jewelry** menggantikan `platform_super_admin` HR; memilih company lewat header (mis. `X-Company-ID`) yang hanya berlaku untuk superadmin. **Impersonation HR dihapus.**
10. **Fitur HR yang hilang/pindah ke Jewelry**: invite member, register, forgot/reset password, MFA (mock), halaman roles/users, platform tenants/billing/entitlements.
11. **Default branch & bootstrap tenant**: Jewelry tidak punya `is_default`; HR menyimpannya sendiri (default: branch aktif tertua). Seed default leave/payroll/common-code dijalankan idempotent saat company pertama kali terlihat.
12. **CORS** Jewelry: tambah origin HR secara eksplisit (token via header Bearer, tanpa cookie lintas domain).

---

## 4. Fase pengerjaan

Setiap fase kecil, bisa di-build dan di-test sendiri, serta tidak merusak fase sebelumnya. Urutan: Jewelry dulu (provider siap), lalu HR API, lalu HR FE, lalu bersih-bersih.

### Bagian A — Identity provider

#### Fase 1 — JWKS & `kid` `[JW-BE]`
- `internal/infrastructure/jwttoken/{key,issuer}.go`: hitung `kid` (thumbprint RFC 7638) dari public key, set header `kid` saat sign.
- Endpoint publik `GET /.well-known/jwks.json`.
- **Selesai bila**: token baru punya `kid`; JWKS mengembalikan key yang bisa memverifikasi token. Test unit issuer + handler.

#### Fase 2 — Audience multi-aplikasi `[JW-BE]`
- Config `TOKEN_AUDIENCES` (default `jewelry`); token staff berisi `aud: ["jewelry","hr"]`. Authenticator Jewelry tetap menerima `jewelry`.
- **Selesai bila**: login Jewelry lama tetap jalan; token punya kedua audience.

#### Fase 3 — Konfigurasi aplikasi via env `[JW-BE]`
- **Tanpa tabel/registrasi aplikasi.** Aplikasi eksternal didefinisikan di env, mis. `HR_APP_URL` (base URL HR backoffice), `HR_APP_CALLBACK_URL` (default `${HR_APP_URL}/auth/callback`), `HR_APP_API_KEY` (service key HR).
- Struct config + validasi saat start (aplikasi dianggap aktif bila `HR_APP_URL` terisi). Tambahkan ke `.env.example`, `.env.staging.example`, dan compose.
- Endpoint `GET /api/v1/apps` (authenticated) → daftar app dari config (`code`, `name`, `url`) untuk launcher. Tanpa entitlement.
- **Selesai bila**: endpoint mengembalikan HR saat env diisi dan kosong saat tidak.

#### Fase 4 — Dimensi aplikasi pada RBAC (schema) `[JW-BE]`
- Migrasi: `permissions.app` (default `jewelry`), `roles.app` (default `jewelry`), `role_permissions.data_scope` (nullable, `self`).
- Unique key `roles` menyertakan `app` (role HR `company_admin` berdampingan dengan role Jewelry `company_admin`).
- Update entity/repo role & permission; validasi: role hanya boleh berisi permission dari app yang sama.
- `internal/app/usecase/access/actor.go` dan `internal/domain/authz/service/permission_resolver.go` hanya memakai permission `app='jewelry'` untuk pengecekan Jewelry.
- **Selesai bila**: semua test Jewelry lama lulus, perilaku Jewelry tidak berubah.

#### Fase 5 — Seed catalog & role sistem HR `[JW-BE]`
- Salin catalog dari `[HR-API]` `internal/modules/auth/domain/role/constant/permissions.go` ke `[JW-BE]` `internal/domain/authz/constant/permissions_hr.go` (app `hr`).
- Seed **tiga** role sistem HR (`app='hr'`, `is_system`, read-only):

  | Role | Scope assignment | Isi permission |
  |---|---|---|
  | `company_admin` | company | Semua permission HR (setara `grants_all` untuk app `hr`) |
  | `branch_admin` | branch | Permission operasional HR (karyawan, absensi, cuti, lembur, payroll) terbatas branch yang di-assign |
  | `employee` | company/branch | Permission self-service (`IsSelfServicePermission`) dengan `data_scope=self` |

  Pemetaan permission per role diambil dari role template HR yang ada (`internal/modules/auth/application/role/command/role_templates.go` di `[HR-API]`) dan dicek terhadap kebutuhan approval (poin 3.13).
- `grants_all` mencakup permission HR (poin 3.4). Label permission di `locales/`.
- **Selesai bila**: seeder idempotent; resolver mengembalikan permission HR untuk role HR.

#### Fase 6 — Endpoint authorization per aplikasi `[JW-BE]`
- `GET /api/v1/auth/authorization?app=hr` → `{user, company, branch, is_super_admin, roles[], grants[{code, scope_type, company_id, branch_id, data_scope}]}` untuk context aktif. Assignment level tenant dikembalikan sebagai scope company.
- **Selesai bila**: test untuk owner (tenant-level), role company, role branch, role `employee` (self).

#### Fase 7 — SSO handoff `[JW-BE]`
- Migrasi `auth_handoff_codes` (`code_hash`, `user_id`, `company_id`, `branch_id`, `app`, `expires_at`, `used_at`).
- `POST /api/v1/auth/handoff` (authenticated, body `app`) → `{code, redirect_url}`; `POST /api/v1/auth/handoff/exchange` (publik) → token pair sesi baru.
- **Selesai bila**: test code expired, dipakai ulang, dan app yang tidak dikonfigurasi di env ditolak. Redirect hanya ke `HR_APP_CALLBACK_URL`.

#### Fase 8 — Service API untuk HR `[JW-BE]`
- Middleware `RequireAppKey` (header `X-App-Key`, dibandingkan constant-time dengan `HR_APP_API_KEY` dari env; tanpa tabel).
- `GET /internal/v1/companies`, `/branches`, `/users` dengan `updated_since` + paging.
- `POST /internal/v1/users` (buat user di tenant milik company + assign role HR), `POST /internal/v1/users/:id/roles`, `PATCH /internal/v1/users/:id/status`.
- CORS: tambah origin HR di config (`internal/interfaces/http/middleware/cors.go`).
- **Selesai bila**: test middleware + tiap endpoint.

### Bagian B — Backoffice Jewelry

#### Fase 9 — Editor role per aplikasi `[JW-FE]`
- Halaman role: tab/filter aplikasi (Jewelry / HR), permission picker per app, pilihan data scope (`self`) untuk permission HR.
- **Selesai bila**: bisa membuat role HR dan meng-assign ke user di company/branch.

#### Fase 10 — App launcher `[JW-FE]`
- Launcher di `app/components/backoffice/shell/BoTopbarAccount.vue`: ambil `/apps` (dari env backend), tampilkan app yang user punya ≥1 permission; klik → `POST /auth/handoff` → redirect.
- **Selesai bila**: klik HR redirect ke `<hr-backoffice>/auth/callback#code=...`.

### Bagian C — HR API

#### Fase 11 — Client Jewelry & config `[HR-API]`
- Pindah database ke `hr_system_jewerly` (lihat catatan database di atas).
- Package `internal/shared/idp`: JWKS fetcher (cache, refetch saat `kid` baru), client `authorization`, client service API.
- Config `IDP_ISSUER`, `IDP_JWKS_URL`, `IDP_AUDIENCE=hr`, `IDP_BASE_URL`, `IDP_APP_KEY` di `internal/shared/config`.
- **Selesai bila**: unit test dengan `httptest` server.

#### Fase 12 — Verifikasi token Jewelry di `AuthMiddleware` `[HR-API]`
- `auth.Module.AuthMiddleware()` (`internal/modules/auth/module.go`) memverifikasi JWT Jewelry → isi `Principal` (UserID, TenantID=`cid`, ActiveBranchID=`bid`, SessionID=`sid`). Hapus cek session Redis HR.
- **Selesai bila**: test mapping klaim; token dengan `aud` salah, expired, atau tanpa `cid` ditolak.

#### Fase 13 — Permission dari Jewelry di `PrincipalMiddleware` `[HR-API]`
- Ganti sumber `EffectivePermissions` dengan client authorization; konversi grants → `principal.PermissionGrant` + `AssignedGrants`; tetap `NarrowToBranch`; cache Redis per `sid` (`internal/modules/auth/infrastructure/role/cache/redis_principal_cache.go`). Superadmin → semua permission HR + header `X-Company-ID`.
- `GET /api/v1/auth/me` mengembalikan principal efektif untuk FE.
- **Selesai bila**: test konversi (tenant/branch/self, superadmin); 401 dari Jewelry → 401 HR.

#### Fase 14 — Proyeksi tenant/branch/user + JIT `[HR-API]`
- Migrasi: `external_synced_at` di `tenants`, `branches`, `users`; kolom yang tidak relevan dijadikan nullable dulu.
- Usecase/middleware `EnsureTenantProjection`: bila tenant/branch/user belum ada atau basi → ambil dari service API → upsert.
- **Selesai bila**: request pertama dari company baru membuat baris tenant/branch/user.

#### Fase 15 — Bootstrap tenant idempotent `[HR-API]`
- Ekstrak seed leave/payroll/common-code dari `internal/modules/platform/application/tenant/command/provision_tenant.go` ke `BootstrapTenantUseCase` (idempotent); dipanggil saat proyeksi tenant pertama kali dibuat. Set `is_default` branch.
- **Selesai bila**: company baru langsung punya default leave/payroll; dipanggil dua kali tidak duplikat.

#### Fase 16 — Sync periodik `[HR-API]`
- Route MQ baru di `cmd/worker` (pola `internal/modules/platform/interfaces/mq/routing.go`): sync incremental companies/branches/users via `updated_since`; status suspended/inactive ikut tersinkron.
- **Selesai bila**: perubahan nama/status di Jewelry muncul di HR setelah job jalan.

#### Fase 17 — Akun karyawan lewat Jewelry `[HR-API]`
- Implementasi `auth.Contract` (`internal/modules/auth/contract.go`: `CreateUser`, `AssignSystemRole`, dsb.) memanggil service API Jewelry. `internal/modules/core-hr/application/employee/command/create_employee_account.go` & `link_employee_account.go` tetap lewat authgateway.
- **Selesai bila**: membuat akun karyawan dari HR → user ada di Jewelry dengan role HR `employee`.

#### Fase 18 — Branch read-only (kecuali kolom HR) `[HR-API]`
- `/api/v1/branches`: hapus create/close; edit hanya timezone & `is_default`. Hapus route platform tenant/branch.
- **Selesai bila**: test handler branch lulus.

#### Fase 19 — Hapus auth lokal `[HR-API]`
- Hapus login, token grant/refresh, select/switch tenant & branch, invitation, register, forgot/reset password, verify email, argon2, JWT generator, JWKS HR, session store Redis, `certs/`.
- Migrasi drop `refresh_tokens`, `password_resets`, `password_history`, `tenant_members`, serta kolom password/lockout di `users`.
- **Selesai bila**: `go build ./...` & `go test ./...` lulus.

#### Fase 20 — Hapus RBAC lokal `[HR-API]`
- Hapus usecase role, endpoint `/api/v1/rbac/*`, role templates, seeder platform roles/role templates. `permissions.go` tetap sebagai konstanta key (dipakai `RequirePermission`).
- Migrasi drop `roles`, `role_permissions`, `role_assignments`, `role_templates`.
- **Selesai bila**: build & test lulus.

#### Fase 21 — Hapus gate entitlement di modul `[HR-API]`
- Hapus 10 `RequireBenefit` (core-hr, attendance, leave, payroll) dan 14 file `EnsureBenefit/EnsureQuota` (termasuk `pkg/attendanceingest`, `branch_management.go`, `create_employee.go`), `SetEntitlementResolver`/`SetQuotaGuard`, `internal/shared/entitlementgate`, wiring di `cmd/api/main.go`.
- **Selesai bila**: build & test lulus; semua fitur terbuka tanpa subscription.

#### Fase 22 — Hapus entitlement & billing (modul platform) `[HR-API]`
- Hapus `internal/modules/platform/application/{entitlement,billing}`, `internal/modules/platform/infrastructure/entitlement`, route MQ renewal/dunning di `cmd/worker`, webhook payment, `internal/seeders/entitlement_catalog_seeder.go`, `IsFeatureEnabled`/`ResolveEntitlement` dari `platform.Contract`.
- Migrasi drop `plans`, `plan_billing_cycles`, `benefits`, `plan_benefits`, `subscriptions`, `subscription_benefits`, `tenant_overrides`, `invoices`, `payments`.
- **Selesai bila**: build & test lulus.

#### Fase 23 — Hapus provisioning & impersonation `[HR-API]`
- Hapus `ProvisionTenantUseCase`, `tenant_lifecycle.go`, impersonation (`impersonation_sessions`, `middleware.BlockWriteWhenImpersonatedReadOnly` di semua `RegisterRoutes`, `MintImpersonationToken`).
- **Selesai bila**: build & test lulus; `graphify update .`.

### Bagian D — HR Backoffice

#### Fase 24 — Client auth & token `[HR-BO]`
- `app/composables/useApiClient.ts`: base URL Jewelry untuk auth; refresh single-flight ke Jewelry `/auth/refresh`; token tetap di cookie HR.
- `app/stores/user.ts`: `login` → Jewelry `/auth/login`; `fetchSession` → Jewelry `/auth/profile` + HR `/auth/me`; hapus mock persona & `app/components/DevAccountSwitcher.vue`.
- **Selesai bila**: login, refresh, dan logout berjalan terhadap Jewelry.

#### Fase 25 — Halaman login & pemilih company `[HR-BO]`
- `app/pages/auth/login.vue` memakai akun Jewelry; bila belum ada context → pemilih company/branch (Jewelry `/auth/switch-context`); bila tidak punya permission HR → halaman "No HR access".
- Forgot password → link ke Jewelry. Hapus `register`, `reset-password`, `verify-email`, `mfa`.
- **Selesai bila**: user satu company langsung masuk; user multi-company memilih dulu.

#### Fase 26 — Halaman callback SSO `[HR-BO]`
- `app/pages/auth/callback.vue`: baca `code` dari fragment URL (`#code=`), tukar via Jewelry `/auth/handoff/exchange` → simpan token → redirect dashboard.
- **Selesai bila**: alur dari launcher Jewelry masuk HR tanpa login ulang.

#### Fase 27 — Switcher company/branch `[HR-BO]`
- `app/components/TeamsMenu.vue`, `BranchSelect.vue`, `useTenants`, `useAccessBranches`: data dari profile Jewelry; switch via Jewelry `switch-context`, lalu reload session.
- **Selesai bila**: ganti company/branch mengubah data yang tampil.

#### Fase 28 — Hapus UI entitlement & billing `[HR-BO]`
- Hapus `useEntitlementGate` (nav di `app/layouts/default.vue` & `app/pages/tenants/employee/*`), `useEntitlements`, `useBilling`, `useMyBilling`, `app/components/{entitlements,billing}`, `app/pages/platform/{entitlements,billing}`, `app/pages/tenants/settings/billing.vue`, mock server terkait.
- **Selesai bila**: typecheck lulus; semua menu tampil sesuai permission saja.

#### Fase 29 — Hapus UI RBAC & platform tenant `[HR-BO]`
- Hapus `app/pages/tenants/settings/{roles,users}.vue`, `app/pages/platform/{access,tenants}`, `app/components/access/PermissionPicker.vue`; halaman branches hanya edit timezone/default. Tambah link "Manage roles & users in Backoffice". `usePermissions`, `AppPermissionGate`, `auth.global.ts` tetap. Teks UI baru dalam bahasa Inggris.
- **Selesai bila**: typecheck lulus; tidak ada link ke halaman yang dihapus.

#### Fase 30 — Tema mengikuti BO Jewelry `[HR-BO]` (referensi `[JW-FE]`)
- Salin token desain dari `[JW-FE]` `design/tokens.target.json` (palette per preset, `--font-sans`/`--font-serif`, `--radius-*`) ke `[HR-BO]` `app/assets/css/main.css` sebagai variabel CSS per `[data-theme='green|brown|gold|black']`, dipetakan ke skala warna Nuxt UI (`--ui-primary`, dst.).
- `app/app.config.ts`: `primary` diarahkan ke warna brand (bukan `blue`); sesuaikan override komponen yang menganggap biru (pill aktif navigasi, tombol solid).
- Composable `useHrTheme` (pola `[JW-FE]` `app/composables/backoffice/useBackofficeTheme.ts`): ambil `theme` dari session Jewelry, `themeOrDefault` (default `green`), set atribut `data-theme` di `<html>`, ingat di cookie untuk halaman login sebelum session ada.
- Logo/nama di sidebar & halaman login disesuaikan dengan identitas BO Jewelry.
- **Selesai bila**: mengganti tema tenant di BO Jewelry → setelah reload, HR BO tampil dengan warna, font, dan radius yang sama; terang/gelap tetap terbaca.

### Bagian E — Integrasi

#### Fase 31 — Uji end-to-end & cutover `[HR-API]` `[HR-BO]` `[JW-BE]` `[JW-FE]`
- Reset DB HR (`hr_system_jewerly`); seed company/branch/user di Jewelry; jalankan sync; jalankan skenario verifikasi di §5.
- Perbarui dokumen modul `auth`, `rbac`, `platform` dan `HRMS_Tenancy_Model.md`.

---

## 5. Verifikasi

- Unit test per fase (kriteria "Selesai bila"); `go test ./...` di `[HR-API]` dan `[JW-BE]`; lint/typecheck `[HR-BO]` dan `[JW-FE]`.
- Skenario E2E:
  1. Owner login di backoffice Jewelry → launcher → HR terbuka tanpa login ulang, akses penuh.
  2. Login di halaman login HR dengan akun Jewelry → user multi-company memilih company → data hanya company itu.
  3. Role HR `company_admin` → semua data company; role HR `branch_admin` di branch A → list karyawan hanya branch A; role `employee` → hanya ESS.
  4. Cabut role atau suspend user di Jewelry → HR menolak dalam ≤60 detik.
  5. Company baru di Jewelry → langsung bisa dipakai di HR tanpa subscription; default leave/payroll ter-seed.
  6. Buat akun karyawan dari HR → user muncul di Jewelry dengan role HR `employee` → bisa login ESS.
  7. Tema tenant di BO Jewelry diganti (mis. `gold`) → HR BO ikut berganti tema.
