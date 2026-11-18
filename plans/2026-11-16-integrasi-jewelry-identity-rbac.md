<!-- 📁 plans/2026-11-16-integrasi-jewelry-identity-rbac.md -->
# Rencana: Integrasi Jewelry sebagai Identity, Registry Company/Branch & Master RBAC untuk HR System

| | |
|---|---|
| **Status** | **Sedang dikerjakan.** Selesai: Fase 1–30. Fase 31: uji E2E level API selesai, tersisa uji browser & skenario `branch_admin`. Bagian G: Fase 33–35 selesai (fondasi menu HR di BO Jewelry); Fase 37 (Employees Info, CRUD inti) Fase 38 (tab detail karyawan), Fase 39 (Contract History), Fase 40 (Import karyawan), Fase 41 (Employee Calendars), Fase 42 (Daily Records), Fase 43 (Overtime Transactions), Fase 44 (Payroll Rekap Summary), Fase 45 (menu HR Settings → HR BO), dan Fase 46 (payroll diparkir) selesai. |
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
5. **Login karyawan (ESS)**: login Jewelry hanya via email; email unik global; satu user hanya satu tenant. Karyawan tanpa email tidak bisa login, dan email yang sudah dipakai di tenant lain akan bentrok. **Diputuskan (2026-11-17): email wajib** untuk karyawan yang butuh akun ESS. Karyawan tanpa email tetap bisa dibuat, hanya tanpa akun (pembuatan akun otomatis dilewati dengan warning; pembuatan akun eksplisit menolak dengan validation error).
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
- **Catatan pelaksanaan:** form user (`BoUserAssignmentFields`) semula hanya menampilkan role Jewelry karena lookup `/backoffice/roles` tanpa `app` (backend memakai default `jewelry`). `useAccessLookups.fetchAssignableRoles` kini mengambil kedua aplikasi (`app=jewelry` dan `app=hr`) sekaligus; label role non-Jewelry diberi awalan nama aplikasi (mis. `HR System · HR Branch Admin`) agar tidak tertukar dengan role Jewelry yang kodenya sama.

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
- Migrasi drop `refresh_tokens`, `password_resets`, `password_history`, serta kolom password/lockout/login di `users`. **Catatan pelaksanaan:** drop `tenant_members` dipindah ke migrasi Fase 20 karena role assignment lokal masih membacanya sampai fase itu. Folder `certs/` (tidak dilacak git, milik root) dihapus manual oleh user.
- **Selesai bila**: `go build ./...` & `go test ./...` lulus.

#### Fase 20 — Hapus RBAC lokal `[HR-API]`
- Hapus usecase role, endpoint `/api/v1/rbac/*`, role templates, seeder platform roles/role templates. `permissions.go` tetap sebagai konstanta key (dipakai `RequirePermission`).
- Migrasi drop `roles`, `role_permissions`, `role_assignments`, `role_templates`, dan `tenant_members` (dipindah dari Fase 19).
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
- **Catatan pelaksanaan:** `switchTenant`/`switchBranch` di `app/stores/user.ts` dan sumber daftar di `TeamsMenu.vue` sudah dipindah ke Jewelry `switch-context`/`profile` saat Fase 24 (endpoint HR lama sudah hilang). Sisa fase ini: `BranchSelect.vue`, `useTenants`, `useAccessBranches`. Halaman profil: nama & email read-only (dikelola di Jewelry), ganti password lewat Jewelry `/auth/change-password`, avatar tetap milik HR (`/auth/me` kini mengembalikan `avatar_url`). `useAccessBranches`, `useTenants`, dan identitas login akun karyawan di `tenants/employee/[id].vue` ikut dibereskan di Fase 29. Superadmin lintas tenant belum didukung (switch-context Jewelry hanya untuk company di tenant user).

#### Fase 28 — Hapus UI entitlement & billing `[HR-BO]`
- Hapus `useEntitlementGate` (nav di `app/layouts/default.vue` & `app/pages/tenants/employee/*`), `useEntitlements`, `useBilling`, `useMyBilling`, `app/components/{entitlements,billing}`, `app/pages/platform/{entitlements,billing}`, `app/pages/tenants/settings/billing.vue`, mock server terkait.
- **Selesai bila**: typecheck lulus; semua menu tampil sesuai permission saja.
- **Catatan pelaksanaan:** konsol tenant platform (`pages/platform/tenants`, `useTenants`, modal tenant platform, mock `server/api/{platform,tenants,branches}`) ikut dihapus di fase ini karena bergantung pada `useEntitlements` dan endpoint yang sudah hilang di Fase 23. Sisa konsol platform (`/platform` overview, access, audit, health, settings, `usePlatformOverview`, `useImpersonation`) tetap untuk Fase 29.

#### Fase 29 — Hapus UI RBAC & platform tenant `[HR-BO]`
- Hapus `app/pages/tenants/settings/{roles,users}.vue`, `app/pages/platform/{access,tenants}`, `app/components/access/PermissionPicker.vue`; halaman branches hanya edit timezone/default. Tambah link "Manage roles & users in Backoffice". `usePermissions`, `AppPermissionGate`, `auth.global.ts` tetap. Teks UI baru dalam bahasa Inggris.
- **Selesai bila**: typecheck lulus; tidak ada link ke halaman yang dihapus.
- **Catatan pelaksanaan:** seluruh konsol `/platform` (overview, access, audit, health, settings) ikut dihapus. Picker approver dan tab akun karyawan memakai endpoint baru `[HR-API]` `GET /api/v1/auth/users`, `GET /api/v1/auth/users/:id`, `POST /api/v1/auth/users/:id/password-reset` (read-only dari Jewelry service API; reset = Jewelry mengirim email). Filter peran di approval policy belum berfungsi karena service API Jewelry belum mengembalikan role user.

#### Fase 30 — Tema mengikuti BO Jewelry `[HR-BO]` (referensi `[JW-FE]`)
- Salin token desain dari `[JW-FE]` `design/tokens.target.json` (palette per preset, `--font-sans`/`--font-serif`, `--radius-*`) ke `[HR-BO]` `app/assets/css/main.css` sebagai variabel CSS per `[data-theme='green|brown|gold|black']`, dipetakan ke skala warna Nuxt UI (`--ui-primary`, dst.).
- `app/app.config.ts`: `primary` diarahkan ke warna brand (bukan `blue`); sesuaikan override komponen yang menganggap biru (pill aktif navigasi, tombol solid).
- Composable `useHrTheme` (pola `[JW-FE]` `app/composables/backoffice/useBackofficeTheme.ts`): ambil `theme` dari session Jewelry, `themeOrDefault` (default `green`), set atribut `data-theme` di `<html>`, ingat di cookie untuk halaman login sebelum session ada.
- Logo/nama di sidebar & halaman login disesuaikan dengan identitas BO Jewelry.
- **Selesai bila**: mengganti tema tenant di BO Jewelry → setelah reload, HR BO tampil dengan warna, font, dan radius yang sama; terang/gelap tetap terbaca.
- **Catatan pelaksanaan:** skala warna Nuxt UI `brand` diturunkan dari satu variabel `--hr-brand` per preset (token `--color-brand-800`) dengan `color-mix`; panel sidebar/login memakai `--hr-shell` (token `--color-brand-950`); mode gelap memakai `--hr-brand-light` agar tema `black` tetap terbaca. Logo `msgrn` disalin dari `[JW-FE]` `public/brand/`. Warna biru semantik di halaman modul (badge status, chart) tidak diubah.

### Bagian E — Integrasi

#### Fase 31 — Uji end-to-end & cutover `[HR-API]` `[HR-BO]` `[JW-BE]` `[JW-FE]`
- Reset DB HR (`hr_system_jewerly`); seed company/branch/user di Jewelry; jalankan sync; jalankan skenario verifikasi di §5.
- Perbarui dokumen modul `auth`, `rbac`, `platform` dan `HRMS_Tenancy_Model.md`.
- **Catatan pelaksanaan:** dokumen modul awal tidak diubah (cabang khusus). Dokumentasi integrasi ditulis di [`integrations/jewelry/`](../integrations/jewelry/README.md); hasil uji di [`05-hasil-uji-e2e.md`](../integrations/jewelry/05-hasil-uji-e2e.md).

### Bagian F — Catalog permission milik HR

#### Fase 32 — Sync catalog permission & role sistem HR ke Jewelry `[HR-API]` `[JW-BE]`
Latar: Fase 5 menyalin catalog HR ke `[JW-BE]` (`permissions_hr.go` + role HR di `system_roles.go`) dan mengisinya ke DB lewat seeder. Akibatnya ada dua sumber kebenaran, dan di server yang seeder-nya belum dijalankan picker role menampilkan permission HR (dari kode) tetapi penyimpanan menolak (`DOMAIN_ROLE_PERMISSION_UNKNOWN`, cek ke tabel `permissions`).

Keputusan user:
1. Sync **otomatis saat API HR start**; bila Jewelry tidak bisa dihubungi, API tetap jalan (warning + retry di background).
2. **Label permission dikirim HR** (EN/ID); `[JW-FE]` tidak perlu diubah tiap ada permission baru.
3. Permission yang dihapus dari catalog HR **diabaikan**: baris di role custom tidak dihapus, tetapi tidak lagi berlaku dan tidak tampil.

`[HR-API]`:
- `internal/modules/auth/domain/role/constant/permissions.go` menjadi satu-satunya sumber: catalog (kode, group, label EN/ID, `data_scope` self untuk permission ESS) dan definisi role sistem HR (`company_admin` grants_all, `branch_admin`, `employee`). Permission yang tidak lagi dipakai (`roles:*`, `users:*`, `platform_audit:read`) dihapus.
- `internal/shared/idp`: `ServiceClient.SyncCatalog` → `PUT /api/v1/internal/catalog` (header `X-App-Key`).
- `cmd/api`: goroutine sync saat start, retry dengan backoff, tidak memblokir server.

`[JW-BE]`:
- Migrasi: `permissions.data_scope`, `permissions.translations` (JSONB), `permissions.deprecated_at`; tabel `app_role_templates` (template role sistem per aplikasi non-jewelry).
- `PUT /api/v1/internal/catalog` (app = pemilik `X-App-Key`): dalam satu transaksi upsert permission app itu, tandai `deprecated_at` untuk kode yang hilang, simpan template role, provisikan role sistem app itu ke **semua tenant** (permission role sistem disamakan dengan template), selaraskan `role_permissions.data_scope`.
- Catalog aplikasi non-jewelry dibaca dari DB (hanya yang belum deprecated): daftar permission picker, validasi kode role, grant `grants_all`/superadmin, `data_scope`. Label dipilih dari `translations` sesuai locale request.
- Tenant baru: `ProvisionSystemRoles` memakai role jewelry dari kode + template dari `app_role_templates`.
- Hapus `permissions_hr.go`, role HR di `system_roles.go`, kunci locale `permission.*` HR; seeder `permissions` hanya untuk catalog jewelry.

- **Selesai bila**: menambah permission di `[HR-API]` → setelah API HR restart, permission muncul di picker role HR `[JW-FE]` dan bisa disimpan tanpa deploy atau seeder `[JW-BE]`; role sistem HR muncul di semua tenant; `go test ./...` lulus di kedua repo.

### Bagian G — Menu HR di BO Jewelry

Latar: sebagian halaman admin HR BO **disalin** (bukan dipindah) ke BO Jewelry, sehingga user bisa memakai fitur HR tersebut tanpa pindah aplikasi. Data diambil langsung dari `[HR-API]` memakai token Jewelry yang sama.

Keputusan user (2026-11-18):
1. Halaman **ditulis ulang** di `[JW-FE]` (Vuetify, design system Jewelry). Yang identik adalah fitur, alur, field, dan struktur menunya, bukan komponen Nuxt UI.
2. **HR BO tetap dipelihara.** Halaman asli tidak dihapus. Perubahan fitur di halaman yang sudah disalin harus dikerjakan di kedua FE.
3. **Hanya sebagian halaman yang disalin.** Daftarnya menyusul dan dicatat di tabel G.2. Bagian ini menyiapkan fondasi dan resep agar halaman bisa ditambah satu per satu.
4. **ESS tetap di HR BO.** Yang disalin hanya halaman admin (`/tenants/*`).
5. **Sumber permission HR di `[JW-FE]` = `[HR-API]` `GET /api/v1/auth/me`.** Hasilnya sudah disaring HR-API (branch aktif, data scope, superadmin), jadi tetap satu sumber dengan HR BO.

#### G.1 Hal yang perlu diperhatikan
1. **Beda library UI**: HR BO memakai Nuxt UI 4 + Tailwind, `[JW-FE]` memakai Vuetify 4. Tidak boleh memasang Nuxt UI/Tailwind ke `[JW-FE]` (CSS bentrok). Logika (tipe, composable, validasi) boleh disalin; template ditulis ulang.
2. **Envelope respons beda**: `[HR-API]` mengirim pagination di field `pagination` (`page`, `per_page`, `total_items`, `total_pages`), sedangkan `[JW-FE]` `core/api/client.ts` hanya mengembalikan `data` + `meta`. Error `[HR-API]` berbentuk `{success, error: {code, message, details[{field, issue}]}, meta}`. Client HR butuh adapter.
3. **Transport mock**: `[JW-FE]` default `apiMock: true` dengan routed transport ke base URL Jewelry. Client HR memakai transport HTTP sendiri ke base URL HR, tidak lewat mock Jewelry.
4. **Context company wajib**: `[HR-API]` menolak token tanpa `cid` (403 `CONTEXT_REQUIRED`). User level tenant (mis. `owner`) yang belum memilih company tidak bisa membuka menu HR, jadi menu HR disembunyikan atau diarahkan ke pemilih company.
5. **Header superadmin**: `[JW-FE]` mengirim `X-Tenant-ID` (acting tenant), sedangkan `[HR-API]` membaca `X-Company-ID` (`internal/modules/auth/principal_middleware.go`). `Access-Control-Allow-Headers` di `[HR-API]` `internal/shared/middleware/cors.go` belum memuat header tersebut.
6. **Dua katalog permission**: tipe `Permission` `[JW-FE]` (`app/utils/backoffice/auth.permissions.ts`, `UPPER_SNAKE`) terpisah dari permission HR (`resource:action`). Nav dan guard halaman HR memakai tipe dan pengecekan sendiri.
7. **Branch aktif**: data HR disaring `bid`. Setelah switch company/branch di Jewelry, cache permission HR dan data halaman HR harus di-reset.
8. **Konvensi `[JW-FE]`**: semua label lewat i18n EN/ID (`t()`), setiap composable punya `*.test.ts`, route di namespace `/backoffice/hr/...`, `definePageMeta` dengan `layout: 'backoffice'` + middleware `backoffice-auth`.
9. **Halaman mock HR tidak disalin**: recruitment, performance, devices, enrollment.
10. **Komponen bersama dibuat sesuai kebutuhan**, bukan disalin semua di awal. Contoh di HR BO: `AppDataTable`, `AppEmployeeSelect`, `AppFilterPanel`, `AppFormSlideover`, `PagedSelect`, `BranchSelect`, `CommonCodeSelect`, `AppCurrencyInput`, `AppGeofenceMapPicker`. Komponen dibuat saat halaman pertama yang membutuhkannya disalin, lalu dipakai ulang.

#### G.2 Daftar halaman yang disalin

Diisi bertahap sesuai info user. Setiap baris dikerjakan sebagai satu fase dengan resep di Fase 36.

| No | Halaman HR BO (`[HR-BO]`) | Route `[JW-FE]` | Permission HR | Komponen bersama baru | Status |
|---|---|---|---|---|---|
| 1 | `tenants/employee/{index,create,[id]}.vue` (Employees Info: list, create, detail tab Profile, archive) | `/backoffice/hr/employees`, `/create`, `/:id` | `employees:read` (list/detail), `employees:write` (create/edit), `employees:delete` (archive), `contracts:write` (kontrak awal) | `BoHrPagedSelect`, `BoHrCommonCodeSelect` | Selesai (Fase 37, 38) |
| 2 | `tenants/employee/contracts.vue` (Contract History) | `/backoffice/hr/contracts` | `contracts:read` (list), `contracts:write` (renew, terminate, dokumen) | – (memakai ulang dialog kontrak Fase 38) | Selesai (Fase 39) |
| 3 | `tenants/employee/import.vue` (Import Employees) | `/backoffice/hr/employees/import` | `employees:write` | – | Selesai (Fase 40) |
| 4 | `tenants/attendance/employee-calendars.vue` (Employee Calendars) | `/backoffice/hr/attendance/employee-calendars` | `attendance:read` (lihat), `attendance:write` (jadwal kustom) | `BoHrEmployeeSelect` | Selesai (Fase 41) |
| 5 | `tenants/attendance/records.vue` (Daily Records) | `/backoffice/hr/attendance/records` | `attendance:read` (lihat), `attendance:write` (evaluasi, input manual), `attendance:approve` (setujui koreksi) | – | Selesai (Fase 42) |
| 6 | `tenants/attendance/overtime-transactions.vue` (Overtime Transactions) | `/backoffice/hr/attendance/overtime-transactions` | `attendance:read` (lihat), `attendance:write` (proses), `attendance:approve` (review) | – | Selesai (Fase 43) |
| 7 | `tenants/attendance/payroll-rekap-summary.vue` (Payroll Rekap Summary) | `/backoffice/hr/attendance/payroll-rekap-summary` | `attendance:read` | – | Selesai (Fase 44) |

#### Fase 33 — Akses `[HR-API]` dari origin BO Jewelry `[HR-API]`
- `internal/shared/middleware/cors.go`: tambah `X-Company-ID` ke `Access-Control-Allow-Headers`.
- Pastikan token dari login BO Jewelry (bukan hasil handoff) diterima: `aud` berisi `hr`, `cid` terisi setelah switch-context.
- **Selesai bila**: preflight dari origin `[JW-FE]` lolos; `GET /api/v1/auth/me` dengan token BO Jewelry mengembalikan grants HR.
- **Catatan pelaksanaan:** hanya CORS yang diubah. Verifier sudah menerima token Jewelry mana pun dengan `aud` `hr` (Fase 2/12), dan `X-Company-ID` tetap hanya berlaku untuk superadmin. Uji preflight dan `/auth/me` dari browser dilakukan bersama Fase 31.

#### Fase 34 — Client HR & permission HR `[JW-FE]`
- Runtime config `public.hrApiBaseUrl` (env `NUXT_PUBLIC_HR_API_BASE_URL`, di section "HR System" paling bawah `.env.example`, `.env.staging.example`, `.env.production.example`). Kosong berarti menu HR tidak tampil.
- `app/core/api/hr-client.ts` (atau `apiClientFor` dengan transport HTTP terpisah) + composable `useHrApi`: token dan refresh dari `backofficeApiFor` (refresh tetap ke Jewelry), header `X-Company-ID` untuk superadmin yang sedang acting, adapter envelope `[HR-API]` (data, pagination, error → `ApiError` `[JW-FE]` agar toast dan error form tetap jalan).
- Store `hr-access.store.ts` + composable `useHrAccess`: ambil `/auth/me` HR setelah session Jewelry siap dan setiap switch context; `canHr(key | key[])`, `hrReady`, `hrAvailable` (false bila tanpa company, HR tidak terkonfigurasi, atau HR-API gagal).
- Tipe `HrPermission` di `app/utils/backoffice/hr.permissions.ts`, disalin dari `[HR-BO]` (hanya key yang dipakai halaman tersalin).
- **Selesai bila**: unit test adapter envelope/error, refresh 401, reset saat switch context, `canHr` untuk grant tenant/branch.
- **Catatan pelaksanaan:**
  - Adapter dibuat sebagai transport (`app/core/api/hr-envelope.ts`, `createHrTransport`), jadi `createApiClient` dipakai tanpa perubahan.
  - `refreshAccessToken` di `useApi.ts` dijadikan single-flight lintas client. Tanpa ini, refresh paralel dari client backoffice dan client HR dengan refresh token yang sama bisa terdeteksi sebagai reuse dan mencabut sesi.
  - Client HR tidak memasang `onSessionExpired`, sehingga 401 dari HR tidak mengakhiri sesi Jewelry.
  - `HrPermission` memuat seluruh catalog HR (bukan hanya key yang dipakai), agar halaman berikutnya cukup memakai tipe yang sudah ada.
  - `jewelry-fe` melarang komentar di kode, jadi penjelasan desain dicatat di [`integrations/jewelry/06-menu-hr-di-bo-jewelry.md`](../integrations/jewelry/06-menu-hr-di-bo-jewelry.md).

#### Fase 35 — Shell: grup menu HR & guard route `[JW-FE]`
- `app/utils/backoffice/shell.navigation.ts`: `NavItem` mendukung `hrPermission` (selain `permission` Jewelry). Tambah grup "HR" yang mengikuti struktur menu HR BO (HR Setting, Employees, Leave, Attendance, Payroll, Company Settings), tetapi hanya berisi halaman yang ada di tabel G.2. Grup/parent kosong tidak dirender.
- Middleware `backoffice-hr-access`: halaman HR butuh `hrAvailable` dan `canHr(meta.hrPermission)`. Bila belum ada company → arahkan ke pemilih context; bila tanpa izin → halaman 403 yang sudah ada.
- Label menu lewat i18n (`shell.nav.hr.*`), EN/ID.
- **Selesai bila**: tanpa halaman tersalin, grup HR tidak tampil; dengan satu halaman dummy, menu tampil sesuai permission HR dan hilang saat permission dicabut di Jewelry (≤60 detik + reload).
- **Catatan pelaksanaan:**
  - Grup HR disimpan terpisah di `app/utils/backoffice/hr.navigation.ts` dan digabung oleh `visibleNavigation(can, canHr)` lewat `filterNavigation`. Uji "halaman dummy" memakai grup HR tiruan di `shell.navigation.test.ts`.
  - Bila tidak ada company, belum ada pemilih context umum di BO Jewelry. Akibatnya menu HR disembunyikan dan guard mengembalikan 403. Bila HR-API down, guard mengembalikan status error tersebut (default 503).
  - Ikon parent sementara memakai ikon yang sudah ada di `app/assets/icons`.

#### Fase 36 — Resep menyalin satu halaman `[JW-FE]` (referensi `[HR-BO]`)
Versi lengkap (alur, pemetaan komponen, aturan `jewelry-fe`): [`07-pola-salin-halaman-hr.md`](../integrations/jewelry/07-pola-salin-halaman-hr.md). Ringkasnya, setiap kali menambah baris di tabel G.2:
1. Baca halaman `[HR-BO]` beserta composable, tipe, dan komponen yang dipakainya. Catat endpoint, permission (`definePageMeta`), filter, kolom, form, dan aksi.
2. Salin tipe ke `app/types/backoffice/hr/*.type.ts` dan composable ke `app/composables/backoffice/hr/use*.ts` (ganti `useApiClient` HR BO dengan `useHrApi`), plus `*.test.ts`.
3. Tulis ulang halaman di `app/pages/backoffice/hr/<modul>/<halaman>.vue` dengan komponen Vuetify/`[JW-FE]` (list, filter, form drawer mengikuti pola halaman `[JW-FE]` yang sudah ada). Field, validasi, urutan kolom, dan aksi sama dengan HR BO.
4. Komponen bersama yang belum ada dibuat di `app/components/backoffice/hr/` lalu dicatat di tabel G.2.
5. Tambah item nav (Fase 35) dan kunci i18n EN/ID.
6. Isi baris tabel G.2 (route, permission, komponen baru, status).
- **Selesai bila** (per halaman): typecheck, lint, dan test `[JW-FE]` lulus; hasil CRUD dari BO Jewelry sama dengan dari HR BO untuk company/branch yang sama; user `branch_admin` hanya melihat data branch-nya.

#### Fase 37 — Employees Info (CRUD inti) `[JW-FE]` (referensi `[HR-BO]` `tenants/employee/*`)
- Label grup menu menjadi **"HR"**; menu pertama: Employees → Employees Info.
- Cakupan (keputusan user 2026-11-18): list (filter branch/org unit/status/jadwal, search, sort, paging; tanpa stat cards), create lengkap (Basic, Employment, Contract, Personal, Address, Login Access, Custom Fields, History & Records 10 seksi, dialog password sementara), detail tab Profile (edit data dasar, atasan langsung, data pribadi & alamat, verifikasi ID pajak) dan archive.
- **Selesai bila**: typecheck, lint, test, dan semua `check:*` `[JW-FE]` lulus.
- **Catatan pelaksanaan:**
  - Archive memakai dialog konfirmasi (HR BO tanpa konfirmasi) sesuai konvensi BO Jewelry.
  - Tidak disalin: tombol Import Excel, upload avatar, tab detail lain, aksi mutasi/status/offboarding/akun. Daftarnya ada di [`07-pola-salin-halaman-hr.md`](../integrations/jewelry/07-pola-salin-halaman-hr.md) §4.
  - Pola kerja dan pemetaan komponen untuk halaman berikutnya dicatat di [`07-pola-salin-halaman-hr.md`](../integrations/jewelry/07-pola-salin-halaman-hr.md).
  - Uji browser terhadap HR-API nyata belum dilakukan.

#### Fase 38 — Detail karyawan: tab lengkap & avatar `[JW-FE]` (referensi `[HR-BO]` `tenants/employee/[id].vue`)
- **Keputusan user (2026-11-18):**
  - Semua tab diterapkan kecuali **Payroll**: Profile, Contracts, Documents, Career History, Work Policy, Others (10 seksi riwayat + custom fields), dan Account Settings (hanya bila karyawan punya akun).
  - Upload foto profil dan kartu identitas profil (layout HR BO) ikut dibuat.
  - **Ditunda:** transfer/promotion, ubah lifecycle status, dan offboarding.
- **Isi:**
  - Menu Actions berisi Create New Account (dengan dialog password sementara), Link Existing Account, dan Archive.
  - Tab Contracts: kontrak baru, perpanjang, akhiri, dan dokumen kontrak (upload presign).
  - Tab Documents: upload presign dengan jenis common code `document_type`, serta hapus dengan konfirmasi.
  - Tab Account: link "kelola role" mengarah ke halaman user BO Jewelry (`/backoffice/users/:id/edit`), bukan URL eksternal seperti di HR BO.
  - Tab disimpan di query `?tab=`. Tab Profile tetap ter-mount (`v-show`) agar perubahan yang belum disimpan tidak hilang saat pindah tab.
- **Selesai bila:** typecheck, lint, test, dan semua `check:*` `[JW-FE]` lulus.
- **Catatan pelaksanaan:**
  - Seksi Others disimpan dengan tombol simpan per seksi (bar simpan menempel di bawah).
  - Tombol "Request Change in Career Mutation" di tab Work Policy tidak disalin karena halaman mutasi belum ada di BO Jewelry.
  - Uji browser terhadap HR-API nyata belum dilakukan.

#### Fase 39 — Contract History `[JW-FE]` (referensi `[HR-BO]` `tenants/employee/contracts.vue`)
- Menu Employees → Contract History di `/backoffice/hr/contracts`, sumber data `GET /core-hr/contracts`.
- **Filter:** status (default Active, seperti HR BO; opsi "Semua status" dikirim tanpa `filter[status]`), jenis kontrak (common code `contract_type`), cabang, dan "berakhir dalam 30 hari". Ada juga search dan sort.
- **Tabel:** kolom End Date diberi penanda "N hari lagi" / "Berakhir hari ini" / "Lewat tanggal berakhir" untuk kontrak aktif.
- **Aksi baris:** buka karyawan (`?tab=contracts`), kelola/lihat dokumen, perpanjang, dan akhiri. Dialognya sama dengan tab Contracts dan diberi teks pengantar.
- **Selesai bila:** typecheck, lint, test, dan semua `check:*` `[JW-FE]` lulus.
- **Catatan pelaksanaan:** HR BO memakai checkbox untuk filter "expiring". Di BO Jewelry filter ini menjadi select di toolbar, karena `BoListToolbar` hanya mendukung select.

#### Fase 40 — Import karyawan `[JW-FE]` (referensi `[HR-BO]` `tenants/employee/import.vue`)
- Tombol "Import Excel" di Employees Info membuka `/backoffice/hr/employees/import`. Alurnya 3 langkah seperti HR BO:
  1. **Upload:** unduh template, unggah `.xlsx`/`.csv` (maks 5 MB), dan opsi buat akun login / kirim undangan sekarang.
  2. **Review:** hasil cek (dry run) berisi total, siap, dan bermasalah, dengan tab Masalah/Siap. Bisa unduh baris bermasalah, lalu konfirmasi import.
  3. **Result:** progres di-polling tiap 2 detik dan job disimpan di query `?job=`, sehingga bisa dibuka ulang. Ringkasan hasil, unduh baris yang dilewati, dan kirim undangan.
- **Endpoint:** `POST /core-hr/employees/import/presign` → `PUT` ke `upload_url` → `POST /core-hr/employees/import` (cek) → `POST /core-hr/bulk/jobs/:id/commit`, ditambah `GET …/jobs/:id`, `…/problems`, `…/invitations`, dan `GET /core-hr/employees/import/template`.
- **Selesai bila:** typecheck, lint, test, dan semua `check:*` `[JW-FE]` lulus.
- **Catatan pelaksanaan:**
  - Transport HR kini menormalisasi error yang dikirim sebagai blob (unduhan file gagal), sehingga pesan error tetap terbaca.
  - Halaman Import History (`tenants/core-hr/data-operations.vue`) belum disalin. Teks "hasil tersedia di Import History" sengaja diganti menjadi "import tetap berjalan".

#### Fase 41 — Attendance → Employee Calendars `[JW-FE]` (referensi `[HR-BO]` `tenants/attendance/employee-calendars.vue`)
- Parent menu baru **Attendance** dengan child pertama **Employee Calendars** (`/backoffice/hr/attendance/employee-calendars`).
- **Tampilan Roster** (default): tabel karyawan × tanggal.
  - Rentang: Minggu Ini, Bulan Ini, kustom (maks 62 hari), serta tombol sebelumnya/berikutnya.
  - Sel diwarnai sesuai warna shift dan diberi penanda sumber (rotasi, tetap, kustom, duty call, libur, tanpa jadwal). Ada paging.
- **Tampilan Monthly Calendar** (`?view=calendar`): jumlah karyawan per shift per hari, libur nasional/cabang, hitungan libur dan tanpa jadwal. Klik tanggal membuka dialog detail per kelompok shift.
- **Filter:** cabang, unit organisasi, jabatan (mengikuti unit), pola jadwal (mengikuti tipe), tipe jadwal, dan search.
- **Aksi** (`attendance:write`):
  - Atur Jadwal Kustom untuk satu karyawan pada satu hari, berupa shift atau libur.
  - Ubah atau hapus entri kustom.
  - Sel hasil pola bisa dilihat detailnya lalu "Timpa Hari Ini".
- **Endpoint:** `GET /attendance/schedules/roster`, `GET /attendance/schedules/roster-summary`, `POST /attendance/schedules?branch_id=`, `DELETE /attendance/schedules/:id`, `GET /attendance/shifts`, `GET /attendance/holidays`, `GET /attendance/schedule-patterns`, `GET /core-hr/positions`.
- **Selesai bila:** typecheck, lint, test, dan semua `check:*` `[JW-FE]` lulus.
- **Catatan pelaksanaan:**
  - Namespace i18n baru `hrAttendance`.
  - Nama hari/bulan memakai `Intl.DateTimeFormat` sesuai bahasa backoffice, bukan daftar teks.
  - Warna shift berasal dari API (hex), jadi dipakai sebagai style inline, bukan token desain.

#### Fase 42 — Attendance → Daily Records `[JW-FE]` (referensi `[HR-BO]` `tenants/attendance/records.vue`)
- **Tab Attendance Log**:
  - Filter tanggal (default bulan berjalan), cabang, karyawan, status, dan shift.
  - Kolom: karyawan, tanggal, jam masuk/pulang (sesuai zona waktu cabang), lembur, kanal, chip status (+ "dalam radius").
  - Aksi baris: lihat bukti lokasi dan ajukan koreksi.
- **Tab Correction Approvals**: filter status, perubahan waktu lama → baru, alasan, serta setujui/tolak (`attendance:approve`, hanya yang pending).
- **Header**:
  - Refresh dan Ajukan Koreksi.
  - Evaluasi Kehadiran (`attendance:write`, maks 31 hari sampai kemarin) dengan ringkasan hasil.
  - Input Manual (Testing), hanya di mode development (`import.meta.dev`).
- **Selesai bila:** typecheck, lint, test, dan semua `check:*` `[JW-FE]` lulus.
- **Catatan pelaksanaan (beda dari HR BO):**
  - Peta bukti absen memakai embed OpenStreetMap (iframe + marker) dan link "Buka di OpenStreetMap", bukan Leaflet dari CDN. Radius geofence tidak digambar; jarak ke kantor ditampilkan bila ada.
  - Filter status satu pilihan (HR BO: multi "semua dari").
  - Search "cari di halaman ini" (client-side) tidak disalin.
  - Nama karyawan diambil dari `GET /core-hr/employees?per_page=-1`, karena record tidak membawa nama. HR BO hanya memakai 100 karyawan pertama.

#### Fase 43 — Attendance → Overtime Transactions `[JW-FE]` (referensi `[HR-BO]` `tenants/attendance/overtime-transactions.vue`)
- **List transaksi lembur:**
  - Filter status, realisasi, karyawan, dan tanggal kerja (default bulan berjalan).
  - Kolom: karyawan, tanggal kerja (+ penanda penyesuaian), jenis hari & kode aturan, menit disetujui/aktual/diakui, sumber persetujuan, rincian komponen upah, realisasi, dan status.
- **Aksi:**
  - Detail transaksi: klasifikasi, fakta absensi, pengukuran lembur, dan hasil beserta rincian.
  - Review menit yang diakui (`attendance:approve`, hanya `pending_review`, dibatasi rentang dari server).
  - Proses Lembur untuk rentang tanggal (`attendance:write`) dengan ringkasan hasil.
- **Endpoint:** `GET /attendance/overtime/transactions`, `POST …/process`, `POST …/:id/review`.
- **Selesai bila:** typecheck, lint, test, dan semua `check:*` `[JW-FE]` lulus.
- **Catatan pelaksanaan:** badge sumber "Order" belum menjadi link ke halaman Overtime Order karena halaman itu belum disalin.

#### Fase 44 — Attendance → Payroll Rekap Summary `[JW-FE]` (referensi `[HR-BO]` `tenants/attendance/payroll-rekap-summary.vue`)
- **Rekap per karyawan** dari `GET /attendance/summary` (filter tanggal default bulan berjalan dan cabang; search nama/nomor di sisi client).
- **Kolom:**
  - Kolom tetap (kehadiran, terlambat/pulang, jenis hari, lembur, cuti).
  - Kolom dinamis dari data (komponen lembur, jenis cuti, shift), dengan nama variabel payroll (`ot_min_OT_1`, dst.).
- **Pengaturan tampilan** (disimpan di localStorage): grup kolom, header label/variabel, durasi menit/jam, dan sembunyikan kolom nol.
- **Interaksi:**
  - Status "N lembur menunggu" (link ke Overtime Transactions `status=pending_review`) atau "Siap".
  - Nilai bisa diklik menuju sumbernya: Daily Records (filter status/shift) atau Overtime Transactions.
  - Ekspor CSV sesuai kolom yang tampil.
- **Selesai bila:** typecheck, lint, test, dan semua `check:*` `[JW-FE]` lulus.
- **Catatan pelaksanaan:**
  - Nilai cuti belum bisa diklik karena halaman Leave Request belum disalin.
  - Link ke Daily Records memakai satu status saja (filter di sana satu pilihan). Contohnya "libur dikerjakan" hanya memfilter `holiday`, tidak `holiday`+`present`.

#### Fase 45 — Menu HR Settings mengarah ke HR BO `[JW-FE]` `[HR-BO]`
- Grup menu HR mendapat item **HR Settings** di posisi parent "HR Setting" HR BO (parent kosong dihapus). Item ini **tidak disalin**, tetapi membuka HR BO lewat SSO.
- **Cara kerja:**
  - `[JW-FE]` klik menu → `POST /auth/handoff {app: "hr"}` → tab baru ke `redirect_url` + `&next=/tenants/hr-setting/organizations` (`useHrHandoff`).
  - Context company/branch aktif ikut terbawa lewat sesi handoff.
  - URL langsung `/backoffice/hr/settings` menjadi halaman cadangan yang mengalihkan di tab yang sama.
- **Visibilitas:** tampil bila user memegang salah satu permission konfigurasi HR (`org:read`, `org:write`, `approval:config`, `attendance:config`, `leave:config`, `payroll:config`, `settings:write`). Ikuti juga aturan `canSeeHr` (tampil saat company belum dipilih).
- `[HR-BO]` `app/pages/auth/callback.vue`: membaca `next` dari fragment. Hanya path internal yang diterima (diawali `/`, bukan `//`, tanpa `\`, bukan `/auth/*`); selain itu tetap ke `landingPath`.
- **Selesai bila:** typecheck, lint, test, dan semua `check:*` `[JW-FE]` lulus; typecheck `[HR-BO]` tidak menambah error.
- **Catatan pelaksanaan:** butuh env `[JW-BE]` `HR_APP_URL`/`HR_APP_CALLBACK_URL` seperti app launcher (Fase 3/7).

#### Fase 46 — Payroll diparkir sementara `[HR-API]` `[HR-BO]`
- **Keputusan user (2026-11-18):** semua fitur payroll dinonaktifkan dulu. Menu di-comment (tidak dihapus), dan endpoint menjawab "fitur tidak tersedia".
- `[HR-API]`:
  - Config `PAYROLL_ENABLED` (default `false`, env di section terpisah `.env.example` / `.env.jewelry.example`).
  - Selama `false`, `payroll.Module.RegisterRoutes` hanya memasang `grp.Any("/*path")` yang menjawab **501 `FEATURE_UNAVAILABLE`** ("the payroll feature is not available yet"), tanpa auth dan tanpa menyentuh handler. Modul payroll tetap dibuat agar seam period-lock attendance/leave dan seeder default tetap jalan.
  - Test: `internal/modules/payroll/module_routes_test.go`.
- `[HR-BO]` yang di-comment (dengan catatan cara mengaktifkan kembali):
  - Sidebar: grup Payroll, item HR Setting (Salary Component, Salary Structures, Payroll Schedules, Tax and BPJS), dan ESS Payslip.
  - Quick link Payroll di dashboard admin, kartu Latest Payslip + pemanggilannya di dashboard ESS, dan tab Payroll di detail karyawan.
  - Halaman payroll tidak dihapus dan masih bisa dibuka lewat URL; datanya akan berisi error 501.
- **Tidak termasuk:** Payroll Rekap Summary (menu Attendance), karena sumbernya `/attendance/summary` (modul attendance), bukan modul payroll.
- **Mengaktifkan kembali:** `PAYROLL_ENABLED=true` di HR-API, lalu uncomment blok yang ditandai di HR BO.

#### Fase 47 dst. — Salin halaman sesuai tabel G.2 `[JW-FE]`
- Satu fase per halaman (atau per kelompok halaman kecil dalam satu modul), mengikuti [`07-pola-salin-halaman-hr.md`](../integrations/jewelry/07-pola-salin-halaman-hr.md).

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
  8. Login BO Jewelry dengan role HR `company_admin` → grup menu HR tampil (hanya halaman di tabel G.2) → data sama dengan HR BO; ganti company/branch → data HR ikut berganti; user tanpa permission HR → grup HR tidak tampil.
