# 02 · Roles

## 1. Peran Bawaan (Default Roles)

**Tiga peran sistem** yang di-seed — satu tingkat platform, dua tingkat tenant. `employee` adalah peran self-service dasar yang otomatis diberikan ke setiap akun yang dibuat lewat onboarding karyawan (lihat core-hr `CreateEmployeeUseCase`), sehingga karyawan yang punya akun langsung bisa mengakses profil & absensi dirinya sendiri tanpa perlu penugasan peran manual. Peran operasional lainnya (manager, hr_admin, branch_admin, payroll_officer, service, dll) tetap **dibentuk sebagai peran kustom per tenant** sesuai kebutuhan, bukan direplikasi sebagai peran sistem.

| Peran | Jenis | Cakupan Izin (ringkas) |
|---|---|---|
| **platform_super_admin** | Platform (global, `tenant_id` NULL) | Tertinggi tingkat platform (strict keys): `platform_tenants:read/write`, `platform_billing:read/write`, `platform_entitlement:read/write`, `platform_support:read/write`, `roles:read/write/assign`, `users:write`, `platform_audit:read` |
| **tenant_admin** | Tenant (di-replikasi per tenant) | Tertinggi tingkat tenant (strict keys): `users:read/write`, `roles:read/write/assign`, `settings:write`, `branch:read/write`, `billing:read` + `billing:write` (kirim bukti bayar), `entitlement:read/manage` |
| **employee** | Tenant (di-replikasi per tenant) | Peran dasar self-service (scope `self`): `profile:read`, `profile:write`, `attendance:self` — diberikan otomatis ke akun baru hasil onboarding karyawan |

Peran bawaan ditandai `is_system = true` dan tidak dapat dihapus, hanya dilihat/dirujuk.

> Kedua template ini **tersimpan di tabel `role_templates`** dan bisa **diedit dari platform** (Access → Roles → Template Peran Sistem), lalu disinkronkan ke seluruh tenant. Lihat §6.

---

## 2. Kustomisasi per Tenant

Definisi peran & permission bersifat **per tenant** — tiap perusahaan mengatur sendiri.

- Tenant dapat membuat peran kustom (mis. `recruiter`, `finance_viewer`, `kepala_shift`) dengan kombinasi permission sendiri.
- Peran kustom terikat `tenant_id` dan tidak terlihat oleh tenant lain (constraint `UNIQUE(tenant_id, name)`).
- Peran dengan **nama sama boleh berbeda isi antar tenant** — `manager` di PT A bisa punya permission berbeda dari `manager` di PT B.
- Peran sistem (bawaan) tersedia sebagai basis; peran kustom melengkapi/menggantikan.

**Contoh peran kustom:**
| Peran | Permission |
|---|---|
| `recruiter` | `recruitment:read`, `recruitment:write`, `candidate:manage` |
| `finance_viewer` | `payroll:read`, `tax:read` |
| `kepala_shift` | `attendance:read`, `attendance:approve` (scope branch) |

### 2.1 Keputusan: Definisi Peran di Level Tenant, BUKAN per Cabang

Definisi peran (permission apa yang dikandung) ditetapkan **di level tenant**, berlaku sama untuk semua cabang tenant itu. **Tidak** ada definisi peran berbeda per cabang — ini keputusan sadar untuk menjaga kesederhanaan.

**Alasan:**
- Yang lazim berbeda antar cabang adalah **siapa** yang memegang peran & **data cabang mana** yang terlihat — bukan **isi permission** perannya.
- Definisi peran per cabang akan membuat evaluasi izin harus selalu bertanya "peran user ini versi cabang mana", menambah kompleksitas besar di setiap pengecekan.

**Bila benar-benar butuh peran berbeda antar cabang:** buat **dua peran tenant** yang berbeda (mis. `supervisor_gudang` vs `supervisor_kantor`) lalu tetapkan sesuai cabang. Fleksibilitas tercapai tanpa menggandakan definisi peran per cabang.

Perbedaan antar-cabang ditangani lewat **scope** (data-level, lihat `03-evaluation.md`) dan **assignment ber-scope cabang** (§3.1), bukan lewat definisi peran.

---

## 3. Penetapan Peran (Assignment)

- Satu user dapat memiliki **beberapa peran**; izin efektifnya adalah gabungan (union) permission dari semua peran.
- Penetapan & pencabutan peran dicatat di audit log.
- Perubahan peran berlaku pada penerbitan token berikutnya (atau setelah refresh), kecuali revocation instan diterapkan.

### 3.1 Assignment Ber-scope Cabang

Penetapan peran dapat **dibatasi ke cabang tertentu**, sehingga user memegang peran itu hanya untuk cabang tersebut:

```
Budi:
  payroll_officer @ cabang Jakarta   → hanya proses payroll Jakarta
  (tanpa akses cabang lain)
```

- Assignment menyimpan opsional daftar cabang (`branch_scope`).
- Bila kosong → peran berlaku sesuai cakupan default peran (mis. `tenant` untuk tenant_admin).
- Ini menjawab "peran yang sama, cabang berbeda" tanpa mengubah definisi peran.

> Perbedaan **isi permission** tetap dari definisi peran (per tenant); assignment ber-scope hanya membatasi **di cabang mana** peran itu berlaku. Lihat penegakan scope di `03-evaluation.md` §3.

---

## 4. Praktik Baik

1. Mulai dari peran bawaan; buat peran kustom hanya bila perlu.
2. Tetapkan izin **paling kecil yang cukup** (least privilege) — peran custom hanya berisi key yang dibutuhkan.
3. Tinjau peran berkala (access review) untuk mencegah privilege creep.
4. Terapkan least privilege pada service account lewat scope sempit.

---

## 5. Audit Perubahan

Setiap perubahan pada peran, permission, dan penetapan **wajib dicatat** untuk keperluan keamanan & kepatuhan. Peristiwa yang dicatat:

| Event | Kapan |
|---|---|
| `role.created` | Peran kustom dibuat |
| `role.updated` | Nama/permission peran diubah |
| `role.deleted` | Peran dihapus |
| `role.permission_added` | Permission ditambahkan ke peran |
| `role.permission_removed` | Permission dicabut dari peran |
| `user.role_assigned` | Peran ditetapkan ke user |
| `user.role_revoked` | Peran dicabut dari user |

Tiap entri memuat: aktor (`changed_by`), target (user/role), perubahan (before/after bila relevan), `tenant_id`, IP/waktu. Log ini terintegrasi dengan audit platform (lihat modul Auth `06-security.md`).

> Karena RBAC menentukan hak akses, jejak auditnya termasuk yang paling sensitif — pastikan tidak dapat diubah (append-only) dan hanya dapat dibaca oleh peran berwenang.

---

## 6. Template & Sinkronisasi Peran Sistem (Template → Produksi)

Definisi ketiga peran sistem (tenant_admin, employee, platform_super_admin) **tersimpan di tabel `role_templates`**, di-seed dari kode di awal (`make seed-all`), lalu **dapat diedit dari platform** dan **disinkronkan ke seluruh tenant**:

| Jalur | Kapan | Cara |
|---|---|---|
| **Edit template** | Platform super admin, kapan saja | Access → Roles → **Template Peran Sistem** → Edit → `PATCH /api/v1/rbac/role-templates/{id}` |
| **Sync ke tenant** | Setelah edit template | Tombol **"Sync Peran Sistem"** → `POST /api/v1/platform/system-roles/sync` |

**Perilaku:**
1. `role_templates` di-seed dari kode **hanya untuk nama yang belum ada** — edit platform tidak pernah ditimpa oleh code default.
2. `SeedSystemRoles` (per tenant) & `SeedPlatformRoles` (global) **membaca dari `role_templates`**, fallback ke code default hanya jika tabel kosong (DB baru sebelum seeder).
3. Sync → seed ulang tiap tenant → `ReplacePermissions` membuat permission system-role persis sesuai template terkini + invalidasi cache principal.
4. Tidak menghapus definisi role, tidak mengubah assignment user, aman dijalankan berulang.

> **Catatan migrasi:** hanya `tenant_admin`, `employee`, dan `platform_super_admin` yang direplikasi sebagai peran sistem. Tenant lama yang masih punya peran sistem lain (manager, hr_admin, dll — dari sebelum `employee` dipromosikan menjadi peran sistem) **tidak otomatis dihapus** oleh sync (non-destruktif); peran tsb tetap berfungsi sampai dihapus manual / peran kustom baru dibuat. Penugasan otomatis peran `employee` hanya berlaku untuk akun yang dibuat lewat onboarding karyawan setelah perubahan ini di-deploy — tidak ada tool backfill untuk karyawan/akun lama (lingkungan lama cukup di-reset). Permission **catalog** bersifat in-memory di kode (`PermissionCatalog`), jadi permission baru langsung valid setelah deploy — yang perlu sinkronisasi hanyalah pemberian permission tsb ke role system tenant lama.

---

## 7. Strict Key Only (Tanpa Wildcard)

Sistem ini **tidak mengenal wildcard** (`resource:*` / `*:*`). Setiap permission adalah key `resource:action` yang eksplisit, dan pemberiannya lewat picker memilih key konkret satu per satu:

- **Penulisan/validasi:** key apa pun yang bukan `resource:action` konkret ditolak (`INVALID_PERMISSION`); validasi peran mewajibkan key ada di katalog.
- **Evaluasi akses:** `principal.Authorize` memakai **pencocokan key eksak**. Gate route dengan beberapa key memakai **OR** (`require(a, b)` = punya a atau b).
- **Akses super admin** diberikan lewat **role** `platform_super_admin` (role gate), bukan key wildcard — memegang semua key platform yang eksplisit.

> Aturan pakai: karena tidak ada wildcard, peran yang butuh "semua aksi resource" mencantumkan seluruh key `resource:action` yang relevan (mis. `users:read` + `users:write`). Permission baru yang ditambahkan ke sistem **tidak otomatis** dimiliki peran lama — perlu di-sync/sesuaikan, ini konsekuensi disengaja dari desain strict-key.
