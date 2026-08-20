# 01 · Model

## 1. Model Inti

Akses ditentukan oleh rantai: **User → Roles → Permissions**. Token (dari modul Auth) membawa `roles` & `scope`; resource server mengevaluasi apakah izin mencukupi.

```
User ──has──▶ Role(s) ──grants──▶ Permission(s)
                                       │
Request  ──requires──▶ Permission ─────┘  (boleh bila cocok)
```

Prinsip: **deny by default** — akses ditolak kecuali ada permission eksplisit.

---

## 2. Format Permission

Permission memakai pola `resource:action`:

| Contoh | Arti |
|---|---|
| `employees:read` | Melihat data karyawan |
| `employees:write` | Membuat/mengubah data karyawan |
| `payroll:run` | Menjalankan proses payroll |
| `leave:approve` | Menyetujui cuti |
| `*:*` | Semua izin (super admin) |

Action umum: `read`, `write`, `delete`, `approve`, `run`, `manage`.

**Wildcard:**
- `employees:*` — semua action pada resource `employees`.
- `*:*` — seluruh izin (hanya untuk super admin tenant).

---

## 3. Scope vs Role

| Aspek | Role | Scope |
|---|---|---|
| **Sumber** | Ditetapkan ke user | Diminta client saat token issue |
| **Fungsi** | Kumpulan permission luas | Membatasi izin dalam satu token |
| **Contoh** | `hr_admin` | `employees:read` saja |

Scope efektif = irisan antara permission dari role user **dan** scope yang diminta client. Ini memungkinkan token bertindak lebih terbatas dari hak penuh user (least privilege).

---

## 4. Hubungan dengan Token (Modul Auth)

Modul Auth menyematkan hasil RBAC ke klaim token:

```json
{
  "sub": "usr_01H8...",
  "tenant_id": "tenant_01H8...",
  "roles": ["hr_admin"],
  "scope": "employees:read employees:write"
}
```

RBAC-lah yang mendefinisikan peran `hr_admin` dan permission apa yang dikandungnya. Auth hanya membawa referensinya di token. Resource server memakai definisi RBAC untuk mengevaluasi (lihat `03-evaluation.md`).
