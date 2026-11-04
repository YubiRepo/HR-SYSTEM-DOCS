<!-- 📁 plans/2026-11-04-tenant-member-email-global.md -->
# Rencana: Identitas User Global + Tenant Member (Email Unik Global)

| | |
|---|---|
| **Status** | **Dikerjakan 2026-11-04** (BE + Backoffice) sebagai cutover langsung karena data di-*migrate fresh*: tanpa backfill, dual-write, atau fallback token lama. Fase 0 (laporan duplikat) dan Fase 3 (merge) tidak diperlukan. Migration: `20261104000001_tenant_members_and_role_assignments`. Lihat §9. |
| **Tanggal** | 2026-11-04 |
| **Pemicu** | Email yang sama bisa didaftarkan di dua tenant tanpa error. Setelah itu, orang tersebut tidak bisa login dari Backoffice (`AMBIGUOUS_IDENTIFIER`, karena Backoffice tidak pernah mengirim `tenant_id`). |
| **Keputusan user** | (1) Satu orang = satu akun, bisa menjadi **anggota (member) di banyak tenant**. (2) **Email, phone, username unik global.** (3) Email yang sudah terdaftar ditambahkan lewat **undangan**. (4) Staf platform **tidak** boleh menjadi member tenant. (5) **Tidak ada akun kembar** di data saat ini, jadi tidak ada penggabungan akun. Lihat §4. |
| **Modul terdampak** | Auth (user, RBAC, token), Platform (provisioning, entitlement/kuota, admin console), Core HR (akun karyawan, link akun, bulk import), modul yang membaca principal (Attendance, Leave, Payroll), Backoffice |
| **Repo terkait** | HR-SYSTEM-API, HR-SYSTEM-BACKOFFICE, HR-SYSTEM-DOCS |
| **Mengubah keputusan** | [architectures/HRMS_Tenancy_Model.md](../architectures/HRMS_Tenancy_Model.md) baris "identifier user unik **per tenant**" dan [modules/auth/04-data-model.md](../modules/auth/04-data-model.md) §2.2 |

---

## 1. Ringkasan

Saat ini `users.tenant_id` adalah **satu-satunya** penanda keanggotaan user di sebuah tenant. Identifier (email/phone/username) unik per `(tenant_id, …)`. Akibatnya orang yang sama di dua perusahaan memiliki dua baris `users`, masing-masing dengan password, lockout, avatar, dan refresh token sendiri, dan login tanpa tenant menjadi ambigu.

Target:

```
users (identitas global)          tenant_members                 tenants
  id, email UNIK GLOBAL   1 ──< *   user_id, tenant_id, status  * >── 1  id
  password, lockout, MFA            (UNIQUE tenant_id+user_id)
                                         │
   role_assignments (tenant_id, user_id, ─┘   employees.user_id (per tenant)
     role_id, scope_type, scope_id)
```

- **`users`** = siapa orangnya: kredensial, verifikasi, lockout, MFA, avatar. Berlaku global.
- **`tenant_members`** = di tenant mana orang itu boleh masuk dan statusnya di sana. Dikelola admin tenant.
- **`role_assignments`** = role apa yang dipegang user di tenant itu, berlaku untuk seluruh tenant atau untuk cabang tertentu.
- **Token akses** selalu terikat ke satu tenant aktif. Pindah tenant menghasilkan token baru.
- **Staf platform** = user yang memiliki peran platform (`roles.tenant_id IS NULL`), tidak lagi ditandai dengan `users.tenant_id IS NULL`. Staf platform **tidak pernah** memiliki baris `tenant_members`, dan user yang menjadi member tenant tidak boleh diberi peran platform.

---

## 2. Kondisi Saat Ini (fakta dari kode)

Path relatif ke HR-SYSTEM-API kecuali ditandai **BO** (HR-SYSTEM-BACKOFFICE).

### 2.1 Skema
- `users.tenant_id` berupa UUID nullable **tanpa FK**; NULL berarti staf platform. Index unik parsial `(tenant_id,email)`, `(tenant_id,phone)`, `(tenant_id,username)` ada di `migrations/20260827000002_create_auth_tables.up.sql:33-38`. Karena NULL dianggap berbeda di Postgres, email staf platform **tidak dijaga DB** dan hanya dicek di aplikasi.
- Data yang sudah melekat di baris user (dan memang seharusnya global): password, `email_verified`, `status`, `failed_attempts`, `locked_until`, `last_login_at`, `avatar_key`.
- `user_roles (user_id, role_id, assigned_by, branch_id, team_id)` **tidak punya `tenant_id`**; tenant hanya diketahui lewat `roles.tenant_id`. `ListRolesByUser` tidak memfilter tenant, dan `Replace` menghapus `WHERE user_id=$1` sehingga peran di **semua** tenant ikut terhapus (`internal/modules/auth/infrastructure/role/persistence/postgres_user_role_repo.go:46-48,110-118`).
- `employees.user_id` tidak memiliki index unik.
- FK nyata ke `users(id)` hanya `refresh_tokens`, `password_resets`, dan `password_history`. Kolom aktor lain (`created_by`, `approved_by`, `requested_by`, `actor_id`, …, ±20 tabel) berupa UUID biasa tanpa FK.

### 2.2 Jalur pembuatan akun (semuanya `entity.NewUser(id, tenantID, …)` + cek duplikat per tenant)
| Jalur | Lokasi |
|---|---|
| `POST /auth/register` (oleh admin) | `internal/modules/auth/application/user/command/register.go:64-117` |
| `POST /auth/users` (invite, password sementara, email auto-verified) | `register.go:158-181` |
| Provisioning tenant (admin tenant) | `platform/.../provision_tenant.go:149,163` → `auth.Contract.CreateAdminUser` → `register.go:200` |
| Create employee (`create_account` default true) | `core-hr/.../create_employee.go:363-375` → `Contract.CreateUser` → `ExecuteInvite` |
| `POST /employees/{id}/account` | `core-hr/.../create_employee_account.go:49-72` |
| Bulk import karyawan | `core-hr/.../bulk/command/import_employees.go:45` (memakai create employee) |
| Seeder staf platform | `internal/seeders/user_seeder.go:35-91` |

Cek duplikat dijalankan sebelum insert dan **tidak aman terhadap race**. Pelanggaran index muncul sebagai 500 `save user failed` (`register.go:134-135`).

### 2.3 Login, token, principal
- `findByIdentifier` mencari dalam tenant terlebih dahulu. Bila tenant nil, pencarian dilakukan lintas tenant: 0 hasil → `INVALID_CREDENTIALS`, 1 → user tersebut, >1 → `AMBIGUOUS_IDENTIFIER` (`identifier_lookup.go:27-80`). Forgot-password memakai lookup yang sama.
- Klaim JWT `tenant_id` diisi dari `user.TenantID` (`login.go:172-188`). Refresh memuat ulang user lalu menyusun klaim dari `user.TenantID` (`token_grant.go:284-306`); refresh token **tidak** menyimpan tenant.
- `PrincipalMiddleware` me-resolve peran dan permission hanya dari `UserID`. Cache principal Redis juga hanya dikunci oleh user id (`internal/modules/auth/module.go:391-425`, `redis_principal_cache.go:39`).
- Pemeriksaan "user milik tenant ini" membandingkan `user.TenantID`: `get_user.go:33`, `admin_reset_password.go:63`, `admin_set_status.go:49`, `usergateway.UserBelongsToTenant` (`role/usergateway/gateway.go:28-34`).
- Kuota `max_users` menghitung `users` per `tenant_id` (`CountActiveByTenant`). Terminasi tenant memanggil `DisableAllByTenant`, yang mengubah **status global user**.
- Belum ada endpoint pilih tenant atau ganti tenant.

### 2.4 Bug yang sudah ada dan akan ikut tertutup
- **Link akun lintas tenant:** `link_user_id` / `link_employee_account.go:144-172` tidak membandingkan tenant user dengan tenant karyawan. `AssignSystemRole` dipanggil dengan tenant nil sehingga cek kepemilikan dilewati, dan user tenant A bisa menerima peran `employee` tenant B.
- `user_roles.Replace` menghapus peran user di semua tenant.
- `leave/infrastructure/authgateway/gateway.go:23` `GetUserRoleNames` mengembalikan peran dari semua tenant.

### 2.5 Backoffice
- `app/stores/user.ts:556-575` hanya mengirim `{identifier, password}`, dan `AMBIGUOUS_IDENTIFIER` tidak ditangani di mana pun.
- `currentTenantId` / `switchTenant` / `TeamsMenu.vue` masih **mock** (data persona dev).

---

## 3. Desain Target

### 3.1 Tabel `users` (identitas global)
- Hapus `tenant_id`, setelah fase migrasi selesai (lihat §5).
- `email`: `UNIQUE (email) WHERE email IS NOT NULL`. Email sudah dinormalisasi huruf kecil oleh `valueobject.NewEmail`.
- `phone`: `UNIQUE (phone) WHERE phone IS NOT NULL` (E.164).
- `username`: `UNIQUE (lower(username)) WHERE username IS NOT NULL`. Pembandingan dibuat tidak peka huruf besar/kecil, karena saat ini username tidak dinormalisasi.
- Kolom baru `last_tenant_id UUID NULL`, dipakai sebagai tenant default saat login.
- `status` tetap global, khusus untuk keamanan akun: `pending`, `active`, `locked`, `disabled`. `disabled` hanya diubah oleh platform, bukan oleh admin tenant.

### 3.2 Tabel baru `tenant_members`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID NOT NULL | |
| `user_id` | UUID NOT NULL FK → `users(id)` | |
| `status` | enum | `invited`, `active`, `suspended`, `removed` |
| `invited_by` | UUID NULL | aktor |
| `joined_at` | timestamptz NULL | diisi saat menjadi `active` |
| `created_at` / `updated_at` | timestamptz | |

- `UNIQUE (tenant_id, user_id)`, plus index `(user_id, status)` untuk daftar tenant milik user saat login.
- Admin tenant hanya mengubah `tenant_members.status`, tidak menyentuh `users.status`. Contohnya `admin_set_status` untuk user tenant menjadi suspend member.
- Terminasi tenant (`DisableAllByTenant`) diganti menjadi **suspend semua member tenant itu**. Akun user yang juga anggota tenant lain tetap hidup.

### 3.3 RBAC: Role Assignment

`user_roles` diganti tabel **`role_assignments`**. Satu baris = "user X memegang role Y di tenant T, berlaku untuk scope S". Company = tenant (model A2), jadi tidak ada kolom company terpisah.

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID NULL | Tenant tempat assignment berlaku. NULL hanya untuk peran platform. |
| `user_id` | UUID NOT NULL | |
| `role_id` | UUID NOT NULL FK → `roles(id)` | |
| `scope_type` | enum | `tenant` atau `branch`. Peran platform memakai `platform`. |
| `scope_id` | UUID NULL | `scope_type=tenant` → sama dengan `tenant_id`; `branch` → `branch_id`; `platform` → NULL |
| `assigned_by` | UUID NULL | aktor |
| `assigned_at` | timestamptz | |

- `UNIQUE (user_id, role_id, scope_type, scope_id)`, sehingga **satu role bisa dipegang di beberapa cabang** (saat ini PK `(user_id, role_id)` membatasi satu cabang per role). Tambah index `(user_id, tenant_id)` untuk resolusi principal.
- **Scope `team` dihapus** (keputusan user, 2026-11-04). Kolom `team_id` hilang bersama `user_roles`.
- **Aturan validasi saat assign:**
  - `role.tenant_id` = `tenant_id` assignment (role tenant lain ditolak);
  - user adalah member `active` (atau `invited`, assignment baru berlaku setelah aktif) di `tenant_id` → `UserBelongsToTenant` diganti `IsMember(tenantID, userID)`;
  - `scope_type=branch` → cabang milik `tenant_id` (memakai `BranchGateway.BranchBelongsToTenant` yang sudah ada);
  - `scope_type=platform` hanya untuk peran platform dan hanya untuk user yang **bukan** member tenant mana pun (K3), begitu juga sebaliknya.
- **Resolusi permission** (`EffectivePermissions`) hanya membaca assignment dengan `tenant_id` = tenant aktif di token. Batas data sebuah grant = irisan antara scope assignment dan scope permission di `role_permissions.scope`:

  | `role_permissions.scope` | Assignment `tenant` | Assignment `branch` (cabang X) |
  |---|---|---|
  | `tenant` | seluruh tenant | hanya cabang X |
  | `branch` | seluruh tenant | hanya cabang X |
  | `self` | data milik sendiri | data milik sendiri |

  Role dengan assignment di beberapa cabang menghasilkan gabungan cabang-cabang tersebut. `RequiredContextKinds` (yang saat ini mewajibkan `branch_id` kalau role punya permission berscope `branch`) tidak lagi dipakai: role apa pun boleh di-assign di scope tenant maupun branch.
- **Konsekuensi untuk `role_permissions.scope`:** nilai `team` tidak punya sumber konteks lagi, dan `branch` menjadi setara dengan `tenant` (batasnya sekarang ditentukan assignment). Rencananya `team` dihapus dari CHECK constraint, dan `branch` dipertahankan untuk sementara agar data lama tetap valid. Penyederhanaan lebih lanjut menyusul.
- API RBAC berubah dari "daftar role per user" menjadi "daftar assignment": `POST /rbac/assignments`, `DELETE /rbac/assignments/{id}`, `GET /rbac/users/{id}/assignments` (difilter tenant aktif). `Replace` hanya mengganti assignment milik tenant aktif, sehingga bug §2.4 tertutup. `GetUserRoleNames` di gateway leave juga memfilter tenant.
- Model domain: `entity.UserRole` + `valueobject.AssignmentContext` diganti `entity.RoleAssignment` dengan `Scope{Type, ID}`; `principal.PermissionGrant` membawa `BranchIDs []string` (kosong = seluruh tenant) menggantikan `BranchID`/`TeamID`.

### 3.4 Konteks tenant, token, principal
- Klaim JWT: `sub` (user), `tenant_id` (tenant aktif; kosong = staf platform), `mid` (member id, opsional), `roles` milik tenant aktif (untuk member) atau peran platform (untuk staf platform). Satu token tidak pernah memuat keduanya.
- `refresh_tokens.tenant_id UUID NULL` (baru). Refresh menyusun klaim dari tenant yang tersimpan dan **memvalidasi ulang** bahwa membership masih `active` dan tenant tidak suspended. Kalau tidak valid, refresh ditolak.
- Kunci cache principal menjadi `(user_id, tenant_id)`, dan invalidasi juga per pasangan itu.
- Impersonation (`contract.go:405-417`) tetap bekerja karena tenant sudah eksplisit di klaim.

### 3.5 Alur login baru
1. Resolve identifier **secara global**. Tidak ada lagi fallback lintas tenant dan tidak ada `AMBIGUOUS_IDENTIFIER`.
2. Verifikasi password, lockout, status, dan MFA, semuanya global.
3. Kalau user adalah **staf platform**, langsung terbitkan token platform (`tenant_id` kosong) dan lewati langkah pilih tenant. Kalau bukan, ambil membership `active` di tenant yang `active`:
   - 0 membership → `NO_ACTIVE_MEMBERSHIP` (403).
   - 1 membership → langsung terbitkan token untuk tenant itu.
   - >1 membership → bila `tenant_id` dikirim di body atau `last_tenant_id` masih valid, pakai itu. Kalau tidak, kembalikan `200 { tenant_selection_required: true, selection_token, tenants: [{id, name}] }`.
4. `POST /auth/select-tenant { selection_token, tenant_id }` menerbitkan pasangan access + refresh untuk tenant itu. `selection_token` berumur pendek (mis. 5 menit), sekali pakai, dan tidak bisa dipakai untuk memanggil API lain.
5. `POST /auth/switch-tenant { tenant_id }` (butuh access token) mencabut family refresh token lama, menerbitkan token baru, dan memperbarui `last_tenant_id`.
6. `GET /auth/me/tenants` mengembalikan daftar konteks untuk menu pindah tenant di Backoffice.

Forgot/reset password dan verifikasi email bersifat global, karena hanya ada satu akun.

### 3.6 Pembuatan akun: dua kasus
Fungsi baru di auth, `EnsureMember(tenantID, email, …)`, dipakai **semua** jalur di §2.2 (kecuali seeder platform):

| Kondisi email | Hasil |
|---|---|
| Belum ada di `users` | Buat user baru (password sementara seperti invite saat ini) + membership `active`. Perilaku sama dengan sekarang. |
| Sudah ada dan sudah member tenant ini | `MEMBER_ALREADY_EXISTS` (409) |
| Sudah ada, bukan member tenant ini, bukan staf platform | Buat membership `invited` dan kirim email undangan. Password **tidak** di-reset. User menjadi `active` setelah menerima undangan lewat `POST /auth/invitations/accept` (token undangan sekali pakai, butuh login). Undangan bisa ditolak atau dibatalkan oleh admin tenant (status `removed`). |
| Sudah ada dan milik staf platform | Tolak dengan `EMAIL_NOT_AVAILABLE` (409). Staf platform tidak boleh menjadi member. |

- Cek duplikat ditambah penanganan pelanggaran unique index (`23505`) dipetakan ke error 409 yang benar, bukan 500.
- Kuota `max_users` menghitung `tenant_members` berstatus `active` + `invited`, bukan `users`.
- Link akun karyawan (`link_user_id`, `link_employee_account`) **wajib** dilakukan oleh member tenant karyawan. Tambahkan `UNIQUE (tenant_id, user_id) WHERE user_id IS NOT NULL` di `employees`.
- `UpdateProfile`: cek keunikan phone/username menjadi global.
- Selama undangan masih `invited`, karyawan belum ter-link ke akun. Link ke `employees.user_id` dilakukan saat undangan diterima.

### 3.7 Error baru / berubah (perbarui `modules/auth/07-errors.md`)
| Kode | HTTP | Arti |
|---|---|---|
| `EMAIL_ALREADY_EXISTS` / `PHONE_ALREADY_EXISTS` / `USERNAME_ALREADY_EXISTS` | 409 | Sekarang global. Dipakai di register staf platform dan update profil. |
| `MEMBER_ALREADY_EXISTS` | 409 | User sudah menjadi member tenant ini (termasuk undangan yang masih `invited`) |
| `EMAIL_NOT_AVAILABLE` | 409 | Email milik staf platform, tidak bisa dijadikan member tenant |
| `INVALID_INVITATION` | 400 | Token undangan kedaluwarsa, sudah dipakai, dibatalkan, atau bukan milik user yang login |
| `NO_ACTIVE_MEMBERSHIP` | 403 | Login berhasil tapi tidak ada tenant/konteks aktif |
| `MEMBERSHIP_INACTIVE` | 403 | Pilih/pindah/refresh ke tenant yang membership-nya sudah tidak aktif |
| `INVALID_SELECTION_TOKEN` | 401 | Token seleksi kedaluwarsa, sudah dipakai, atau salah |
| `AMBIGUOUS_IDENTIFIER` | — | Dihapus setelah fase 4 |

---

## 4. Keputusan (diputuskan user, 2026-11-04)

| # | Pertanyaan | Keputusan |
|---|---|---|
| **K1** | Apakah `phone` dan `username` juga unik global? | **Ya.** Semua identifier login unik global, sehingga login tanpa tenant tidak pernah ambigu. |
| **K2** | Email sudah terdaftar di tenant lain: tempel langsung atau lewat undangan? | **Undangan** (`invited` → diterima user). User tidak masuk ke tenant tanpa persetujuannya. |
| **K3** | Bolehkah staf platform sekaligus member tenant? | **Tidak.** Staf platform dan member tenant adalah dua jenis akun yang terpisah. Tidak ada konteks "Platform" di layar pilih tenant. |
| **K4** | Aturan memilih akun "pemenang" saat menggabungkan duplikat? | **Tidak berlaku:** tidak ada akun kembar di data saat ini, jadi tidak ada penggabungan. Fase 0 tetap memverifikasi ini, dan pembuatan index unik di fase 3 akan gagal (aman, tanpa perubahan data) kalau ternyata ada duplikat. |
| **K5** | Kolom aktor lama (`created_by`, dst.) yang menunjuk user hasil merge? | **Tidak berlaku** karena tidak ada merge (K4). ID user tidak berubah, jadi semua kolom aktor tetap valid. |
| **K6** | Bentuk penugasan role? | **Role assignment** `(tenant_id, user_id, role_id, scope_type, scope_id)`, lihat §3.3. Company = tenant, jadi tidak ada `company_id`. |
| **K7** | Scope assignment apa saja? | Hanya **`tenant`** dan **`branch`** (plus `platform` untuk staf platform). Scope **`team` dihapus**. |

---

## 5. Fase Implementasi

Prinsip: setiap fase bisa di-deploy sendiri dan bisa di-rollback. Migration, backfill, dan script laporan **ditulis** oleh developer, sedangkan **eksekusinya** dilakukan oleh pemilik environment.

### Fase 0 — Laporan data (read-only)
Script SQL/CLI yang melaporkan (diharapkan kosong, sesuai K4):
- grup `email`, `phone`, dan `lower(username)` yang muncul di >1 baris `users`, termasuk kombinasi platform (NULL) vs tenant;
- user staf platform (punya peran platform) yang juga punya `tenant_id` atau peran tenant (melanggar K3);
- `employees.user_id` yang user-nya berasal dari tenant berbeda dengan karyawan (bug §2.4);
- `user_roles` yang tenant perannya ≠ `users.tenant_id`;
- `user_roles` dengan `team_id` terisi, dan `role_permissions` dengan `scope='team'` (keduanya hilang karena K7, jadi perlu keputusan manual per baris);
- `employees` dengan `(tenant_id, user_id)` ganda.

Kalau laporan tidak kosong, temuan diselesaikan manual bersama user sebelum lanjut ke fase 3. Rencana ini tidak memuat script penggabungan otomatis.

### Fase 1 — Skema aditif + dual-write
- Migration: `tenant_members`, `role_assignments`, `refresh_tokens.tenant_id`, `users.last_tenant_id`.
- Backfill:
  - satu membership per user yang memiliki `tenant_id` (status mengikuti `users.status`: `disabled` → `suspended`, selain itu `active`);
  - `role_assignments` dari `user_roles`: `tenant_id` = `roles.tenant_id`; `branch_id` terisi → `scope_type=branch, scope_id=branch_id`; peran platform → `scope_type=platform`; selain itu → `scope_type=tenant, scope_id=tenant_id`. Baris dengan `team_id` **tidak** di-backfill otomatis dan muncul di laporan fase 0.
- Kode: semua jalur pembuatan akun juga menulis membership (`EnsureMember`), dan assign/revoke role menulis ke `user_roles` **dan** `role_assignments`. Pembacaan masih memakai `users.tenant_id` dan `user_roles`.
- Perbaiki bug link lintas tenant (§2.4) sekarang juga, karena tidak bergantung fase lain.

### Fase 2 — Baca dari membership
- Login (§3.5), `select-tenant`, `switch-tenant`, `me/tenants`, refresh dengan tenant tersimpan.
- Alur undangan: kirim/kirim ulang/batalkan (admin tenant), `POST /auth/invitations/accept` (user), daftar undangan tertunda di `GET /auth/me/tenants`.
- Principal/RBAC per `(user_id, tenant_id)` dibaca dari `role_assignments` (aturan irisan scope §3.3); endpoint `/rbac/assignments`; ownership memakai `IsMember`; kuota dari `tenant_members`; `DisableAllByTenant` diganti suspend member; `GET /auth/users/tenant` dan daftar user platform di-join lewat `tenant_members`.
- `GetUserSummary` dan `GET /auth/me` tidak lagi mengembalikan `tenant_id` dari user; tenant aktif diambil dari token.
- **Backoffice:** layar pilih tenant setelah login, form assign role memilih scope (seluruh tenant / satu atau beberapa cabang) dan input team dihapus, `TeamsMenu` memakai `GET /auth/me/tenants` + `switch-tenant` (mock dihapus), refresh tetap jalan, halaman manajemen user menampilkan status member.

### Fase 3 — Unik global
- Jalankan ulang laporan fase 0; harus kosong.
- Migration: buat index `UNIQUE (email)`, `UNIQUE (phone)`, `UNIQUE (lower(username))`. Kalau ternyata ada duplikat, pembuatan index gagal tanpa mengubah data.
- Ganti cek `ExistsByTenantAnd*` menjadi `ExistsBy*` global, dan petakan pelanggaran index (`23505`) ke 409.

### Fase 4 — Bersih-bersih
- Drop `users.tenant_id` beserta index `idx_users_tenant_*`.
- Hapus `FindByTenantAnd*`, `FindAllBy*`, `ExistsByTenantAnd*`, fallback lintas tenant, dan `AMBIGUOUS_IDENTIFIER`.
- Hapus field `TenantID` dari `entity.User`.
- Drop `user_roles`, `entity.UserRole`, `valueobject.AssignmentContext`, `RequiredContextKinds`, dan nilai `team` dari CHECK `role_permissions.scope`.

---

## 6. Dokumen yang Harus Diperbarui
- `architectures/HRMS_Tenancy_Model.md`: identifier user unik **global**; keanggotaan lewat `tenant_members`.
- `modules/auth/04-data-model.md`: §2.2 `users`, tabel baru `tenant_members`, `role_assignments` menggantikan §2.5 `user_roles`, `refresh_tokens.tenant_id`, indeks §3.
- `modules/rbac/05-data-model.md` dan dokumen scope di `modules/rbac/`: hapus `team`, tambahkan aturan irisan scope assignment × scope permission.
- `modules/auth/03-api-contract.md`: login (respons seleksi tenant), `select-tenant`, `switch-tenant`, `me/tenants`, dan catatan tenancy baris 37.
- `modules/auth/05-flows.md`: alur login, pilih tenant, pindah tenant, undangan member.
- `modules/auth/07-errors.md`: §3.7.
- Dokumen Core HR terkait akun karyawan (create/link account).

---

## 7. Pengujian
- **Unit:** `EnsureMember` (empat kasus §3.6, termasuk email staf platform → `EMAIL_NOT_AVAILABLE`), terima/batalkan undangan, staf platform tidak bisa diberi membership dan member tidak bisa diberi peran platform, login 0/1/banyak konteks, `last_tenant_id`, `selection_token` sekali pakai dan kedaluwarsa, refresh ditolak setelah member di-suspend, `Replace` peran hanya menyentuh satu tenant, kuota menghitung member; role assignment: role tenant lain ditolak, cabang tenant lain ditolak, role yang sama di dua cabang menghasilkan dua cabang di grant, assignment scope tenant + permission `branch` → seluruh tenant, `self` tetap hanya data sendiri.
- **Integrasi (DB asli):** pelanggaran unique email/phone/username global → 409; migration fase 3 gagal bersih di data contoh yang berisi duplikat; terminasi tenant A tidak memengaruhi login user ke tenant B.
- **Keamanan:** token tenant A tidak bisa mengakses data tenant B (semua `httpkit` tetap mengambil tenant dari principal); `switch-tenant` ke tenant yang bukan milik user → 403; admin tenant B tidak bisa me-reset password atau men-disable akun global user.
- **Backoffice:** login satu tenant (tanpa layar pilih), login banyak tenant (layar pilih), pindah tenant dari menu (data halaman ikut berganti), login staf platform (langsung ke konsol platform), terima undangan.

---

## 9. Catatan Implementasi (2026-11-04)

- **Karyawan dengan email yang sudah ada:** akun di-link ke karyawan langsung saat diundang (bukan menunggu undangan diterima). Selama membership masih `invited`, orang itu belum bisa masuk ke tenant ini.
- **Masuk ke tenant yang mengundang = menerima undangan:** dari layar pilih tenant atau menu pindah organisasi. Ada juga `POST /auth/me/invitations/{tenant_id}/accept|decline`.
- **Endpoint baru:** `POST /auth/select-tenant`, `POST /auth/switch-tenant`, `GET /auth/me/tenants`, `POST /auth/me/invitations/{tenant_id}/accept|decline`, `DELETE /auth/users/{id}/membership`, `POST /auth/users/{id}/invitation/resend`, `DELETE /rbac/assignments/{id}`.
- **Reset password oleh admin tenant** hanya untuk akun yang tidak dipakai di tenant lain (selain itu `SHARED_ACCOUNT`).
- **Status oleh admin tenant** (`PATCH /auth/users/{id}/status`) mengubah status membership (`active`/`suspended`), bukan status akun global. Akibatnya admin tenant tidak bisa membuka akun yang `locked`; akun terbuka sendiri setelah masa lockout, atau dibuka oleh staf platform.
- **Batasan multi-cabang:** data role assignment sudah mendukung satu role di beberapa cabang, dan `principal.BranchIDs(key)` mengembalikan semua cabangnya. Namun filter data di modul (via `principal.Authorize`) masih memakai satu cabang (yang pertama). Filter multi-cabang per modul adalah pekerjaan lanjutan.
- **Status tenant (suspended/terminated)** tidak dicek saat login; terminasi men-suspend semua member tenant itu.

## 8. Risiko
- **Asumsi "tidak ada akun kembar" (K4) salah.** Mitigasinya: laporan fase 0 dan index unik fase 3 akan menolak, bukan merusak data.
- **Cache principal** dengan kunci lama harus di-flush saat deploy fase 2.
- **Token lama** (tanpa tenant di refresh token): fallback sementara ke `users.tenant_id` selama fase 2. Fallback ini dihapus di fase 4 setelah semua refresh token lama kedaluwarsa.
- **Perubahan hak akses saat backfill role:** assignment yang dulu tanpa `branch_id` menjadi scope tenant, jadi aksesnya tetap sama. Assignment ber-`team_id` kehilangan konteksnya. Karena itu baris-baris ini dilaporkan di fase 0 dan diputuskan manual, bukan dikonversi diam-diam.
- **Enumerasi email:** respons dari jalur "tambah karyawan dengan email yang sudah ada di tenant lain" tidak boleh membocorkan bahwa akun itu ada. Karena itu K2 memilih undangan dengan respons yang seragam.
