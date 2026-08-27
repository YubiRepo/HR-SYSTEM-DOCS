# 02 · Roles

## 1. Peran Bawaan (Default Roles)

| Peran | Cakupan Izin (ringkas) |
|---|---|
| **employee** | Data & aksi milik sendiri: `profile:read/write`, `leave:request`, `payslip:read:self` |
| **manager** | Izin employee + `team:read`, `leave:approve`, `performance:review` |
| **hr_admin** | `employees:*`, `leave:*`, `recruitment:*`, `performance:*` |
| **branch_admin** | Seperti hr_admin tetapi **cakupan `branch`** — kelola karyawan, struktur, & posisi hanya di cabangnya (rakit dari katalog, boleh tambah di luar katalog); `branch:read` cabangnya (tidak membuat/menutup cabang) |
| **payroll_officer** | `payroll:*`, `payslip:read`, `tax:read` |
| **tenant_admin** | Manajemen pengguna & konfigurasi tenant: `users:*`, `roles:*`, `settings:*`, **katalog org (`catalog:*`)**, **manajemen cabang (`branch:*`)**, **langganan self-service (`billing:manage`, mode self-service)**, cakupan `tenant` (semua cabang) |
| **service** | Izin spesifik integrasi via scope (mis. `payroll:read`) |

Peran bawaan ditandai `is_system = true` dan tidak dapat dihapus, hanya dilihat/dirujuk.

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
2. Hindari memberi `*:*` kecuali super admin tenant.
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
