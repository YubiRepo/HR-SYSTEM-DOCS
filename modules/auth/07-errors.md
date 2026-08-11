# 08 · Error Catalog

Semua error mengikuti envelope standar HRMS:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email atau password salah.",
    "details": []
  },
  "meta": { "request_id": "req_...", "timestamp": "2026-08-09T08:30:00Z" }
}
```

Konsumen bercabang berdasarkan `code` (stabil), bukan `message` (bisa berubah/terlokalisasi).

---

## 1. Autentikasi

| Code | HTTP | Arti | Catatan |
|---|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Email/password salah | Pesan seragam (anti-enumeration) |
| `ACCOUNT_LOCKED` | 423 | Akun terkunci karena terlalu banyak percobaan | Sertakan info cooldown bila perlu |
| `ACCOUNT_DISABLED` | 403 | Akun dinonaktifkan admin | |
| `EMAIL_NOT_VERIFIED` | 403 | Email belum diverifikasi | |
| `TENANT_SUSPENDED` | 403 | Tenant tidak aktif | |

---

## 2. Token & OAuth

| Code | HTTP | Arti |
|---|---|---|
| `TOKEN_EXPIRED` | 401 | Access token kedaluwarsa |
| `TOKEN_INVALID` | 401 | Tanda tangan/format token tidak valid |
| `TOKEN_REVOKED` | 401 | Token telah dicabut |
| `INVALID_GRANT` | 400 | `grant_type` atau kode/refresh tidak valid |
| `INVALID_CLIENT` | 401 | `client_id`/`client_secret` salah |
| `INVALID_SCOPE` | 400 | Scope diminta tidak diizinkan |
| `REUSE_DETECTED` | 401 | Refresh token dipakai ulang → seluruh family dicabut |
| `PKCE_VERIFICATION_FAILED` | 400 | `code_verifier` tidak cocok challenge |

---

## 3. Otorisasi (RBAC)

| Code | HTTP | Arti |
|---|---|---|
| `PERMISSION_DENIED` | 403 | Peran/scope tidak mencukupi |
| `TENANT_MISMATCH` | 403 | Token dari tenant berbeda |
| `INSUFFICIENT_SCOPE` | 403 | Token tidak memuat scope yang dibutuhkan |

---

## 4. Password

| Code | HTTP | Arti |
|---|---|---|
| `WEAK_PASSWORD` | 422 | Password tidak memenuhi kebijakan |
| `PASSWORD_REUSED` | 422 | Password sama dengan riwayat |
| `INVALID_RESET_TOKEN` | 400 | Token reset tidak valid/kedaluwarsa/terpakai |
| `SAME_PASSWORD` | 422 | Password baru sama dengan lama |

---

## 5. MFA

| Code | HTTP | Arti |
|---|---|---|
| `MFA_REQUIRED` | 401 | Perlu langkah MFA (bukan error fatal — lanjut verifikasi) |
| `INVALID_MFA_CODE` | 401 | Kode MFA salah |
| `MFA_TOKEN_EXPIRED` | 400 | Sesi challenge MFA kedaluwarsa |
| `MFA_ALREADY_ENROLLED` | 409 | Faktor sudah terdaftar |

---

## 6. Validasi & Umum

| Code | HTTP | Arti |
|---|---|---|
| `VALIDATION_ERROR` | 400/422 | Input tidak lolos validasi (lihat `details`) |
| `INVALID_IDENTIFIER` | 400 | Format identifier tak dikenali sebagai email/phone/username |
| `EMAIL_ALREADY_EXISTS` | 409 | Email sudah terdaftar di tenant |
| `PHONE_ALREADY_EXISTS` | 409 | Nomor telepon sudah terdaftar di tenant |
| `USERNAME_ALREADY_EXISTS` | 409 | Username sudah terdaftar di tenant |
| `RATE_LIMIT_EXCEEDED` | 429 | Terlalu banyak permintaan |
| `INTERNAL_ERROR` | 500 | Kesalahan server |

---

## 7. Panduan Penanganan Klien

| Situasi | Aksi klien |
|---|---|
| `TOKEN_EXPIRED` | Coba refresh token; bila gagal → arahkan login |
| `REUSE_DETECTED` / `TOKEN_REVOKED` | Hapus token lokal, paksa login ulang |
| `MFA_REQUIRED` | Tampilkan layar input kode MFA |
| `ACCOUNT_LOCKED` | Tampilkan info & opsi reset password |
| `RATE_LIMIT_EXCEEDED` | Backoff sesuai header `Retry-After` |
| `PERMISSION_DENIED` | Tampilkan pesan akses ditolak, jangan retry |

> Prinsip: jangan bocorkan detail sensitif dalam `message`. Pesan untuk kegagalan login selalu seragam.
