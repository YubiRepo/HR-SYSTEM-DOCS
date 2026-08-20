# 06 · Integration

Cara modul lain (Core HR, Payroll, dst) mengonsumsi RBAC.

---

## 1. Pola Integrasi

RBAC dipakai di dua titik:

| Titik | Peran |
|---|---|
| **Saat token issue (Auth)** | Auth memanggil RBAC untuk mengisi `roles` & permission efektif ke klaim token |
| **Saat request masuk (Resource Server)** | Middleware mengevaluasi izin token vs izin yang dibutuhkan endpoint |

```
Auth ──(minta peran & permission user)──▶ RBAC
   ↑                                        │
   └──────── klaim roles/scope ─────────────┘
                     │
                     ▼ (token)
Client ──▶ Resource Server ──(evaluasi izin)──▶ RBAC rules
```

---

## 2. Middleware Otorisasi (Konseptual)

Setiap endpoint mendeklarasikan izin yang dibutuhkan, lalu middleware memeriksanya:

```
@requires("employees:write")
PATCH /employees/{id}

middleware:
  1. baca token → roles, scope, tenant_id
  2. expand roles → permissions (via RBAC)
  3. cek "employees:write" ⊆ (permissions ∩ scope)
  4. cek tenant_id cocok
  5. lolos → handler; gagal → 403
```

Deklarasi izin sebaiknya deklaratif (dekorator/anotasi/config route), bukan logika tersebar di handler.

---

## 3. Sumber Kebenaran Permission

Untuk performa, permission per role dapat:
- **Disematkan di token** (`scope`) saat issue — cepat, tanpa lookup, tapi "basi" hingga token refresh.
- **Di-lookup real-time** dari RBAC — selalu terkini, tapi ada biaya query (bisa di-cache).

**Rekomendasi:** sematkan `roles` di token, cache mapping role→permission di resource server (TTL pendek), dan sediakan mekanisme invalidasi saat peran berubah.

---

## 4. Perubahan Peran & Propagasi

| Skenario | Efek |
|---|---|
| Peran user diubah | Berlaku saat token berikutnya diterbitkan / setelah refresh |
| Butuh efek instan | Terapkan revocation token (via modul Auth) agar user re-login/refresh |
| Permission sebuah role diubah | Invalidasi cache role→permission di resource server |

---

## 5. Kontrak Antar Modul

**RBAC menyediakan:**
- Resolusi `user → roles → permissions` (untuk Auth saat issue token).
- Definisi & katalog permission.
- Endpoint manajemen peran (untuk admin).

**Modul lain menyediakan:**
- Deklarasi izin yang dibutuhkan tiap endpoint.
- Penerapan data-level scoping pada query mereka sendiri.

> RBAC menentukan *boleh atau tidak*; penyaringan data aktual (mis. `WHERE`) tetap tanggung jawab modul pemilik data.
