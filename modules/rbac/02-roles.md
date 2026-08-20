# 02 · Roles

## 1. Peran Bawaan (Default Roles)

| Peran | Cakupan Izin (ringkas) |
|---|---|
| **employee** | Data & aksi milik sendiri: `profile:read/write`, `leave:request`, `payslip:read:self` |
| **manager** | Izin employee + `team:read`, `leave:approve`, `performance:review` |
| **hr_admin** | `employees:*`, `leave:*`, `recruitment:*`, `performance:*` |
| **payroll_officer** | `payroll:*`, `payslip:read`, `tax:read` |
| **tenant_admin** | Manajemen pengguna & konfigurasi tenant: `users:*`, `roles:*`, `settings:*` |
| **service** | Izin spesifik integrasi via scope (mis. `payroll:read`) |

Peran bawaan ditandai `is_system = true` dan tidak dapat dihapus, hanya dilihat/dirujuk.

---

## 2. Kustomisasi per Tenant

- Tenant dapat membuat peran kustom (mis. `recruiter`, `finance_viewer`) dengan kombinasi permission sendiri.
- Peran kustom terikat `tenant_id` dan tidak terlihat oleh tenant lain.
- Peran sistem tetap tersedia sebagai basis; peran kustom melengkapi.

**Contoh peran kustom:**
| Peran | Permission |
|---|---|
| `recruiter` | `recruitment:read`, `recruitment:write`, `candidate:manage` |
| `finance_viewer` | `payroll:read`, `tax:read` |

---

## 3. Penetapan Peran (Assignment)

- Satu user dapat memiliki **beberapa peran**; izin efektifnya adalah gabungan (union) permission dari semua peran.
- Penetapan & pencabutan peran dicatat di audit log.
- Perubahan peran berlaku pada penerbitan token berikutnya (atau setelah refresh), kecuali revocation instan diterapkan.

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
