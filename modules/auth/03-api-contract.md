# 03 · API Contract

Semua endpoint mengikuti envelope response standar HRMS (`success` + `data`/`error` + `meta`) dan berada di bawah prefix `/api/v1/auth`. Semua request wajib HTTPS.

---

## Ringkasan Endpoint

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/auth/register` | Registrasi pengguna baru | Admin |
| POST | `/auth/login` | Login (issue token) | Publik |
| POST | `/auth/token` | Tukar/refresh token (OAuth2) | Publik |
| POST | `/auth/logout` | Cabut sesi | Bearer |
| POST | `/auth/token/introspect` | Cek status token | Service |
| POST | `/auth/token/revoke` | Cabut token spesifik | Bearer |
| GET | `/auth/me` | Profil & klaim pengguna aktif | Bearer |
| POST | `/auth/password/forgot` | Minta reset password | Publik |
| POST | `/auth/password/reset` | Setel ulang password via token | Publik |
| POST | `/auth/password/change` | Ganti password (login) | Bearer |
| POST | `/auth/email/verify` | Verifikasi email | Publik |
| POST | `/auth/mfa/enroll` | Daftarkan MFA | Bearer |
| POST | `/auth/mfa/verify` | Verifikasi kode MFA | Publik* |
| GET | `/.well-known/jwks.json` | Public keys (JWKS) | Publik |

\* dalam konteks challenge login yang sudah dimulai.

---

## 1. POST /auth/login

Field `identifier` menerima **email, nomor telepon, atau username**. Server mendeteksi tipenya otomatis (lihat catatan resolusi di bawah).

> **Catatan tenancy:** `tenant_id` di-resolve otomatis (mis. dari subdomain/discovery), bukan diketik user. Model tenancy sudah final — 2 level (Tenant → Cabang), shared DB. Lihat [`architecture/HRMS_Tenancy_Model.md`](../../architecture/HRMS_Tenancy_Model.md). Identifier unik **per tenant**.

**Request**
```json
{
  "identifier": "budi@example.com",
  "password": "••••••••",
  "tenant_id": "tenant_01H8..."
}
```

Contoh nilai `identifier` yang valid:
```
"budi@example.com"      → email
"+6281234567890"        → phone (format E.164)
"budi.santoso"          → username
```

**Resolusi identifier (sisi server):**
1. Cocok pola email (mengandung `@`) → cari berdasarkan `email`.
2. Cocok pola telepon (diawali `+`/digit, format E.164) → cari berdasarkan `phone`.
3. Selain itu → cari berdasarkan `username`.
4. Pencarian selalu dalam lingkup `tenant_id`; kegagalan tetap membalas `INVALID_CREDENTIALS` yang seragam.

**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "refresh_token": "rt_9f2a...",
    "token_type": "Bearer",
    "expires_in": 900
  },
  "meta": { "request_id": "req_...", "timestamp": "2026-08-09T08:30:00Z" }
}
```

**Response `200 OK` — MFA diperlukan**
```json
{
  "success": true,
  "data": {
    "mfa_required": true,
    "mfa_token": "mfa_01H8...",
    "methods": ["totp"]
  }
}
```

**Error:** `401 INVALID_CREDENTIALS`, `423 ACCOUNT_LOCKED`, `403 EMAIL_NOT_VERIFIED`.

---

## 2. POST /auth/token

Endpoint OAuth2 multiguna berbasis `grant_type`.

**Refresh token**
```json
{ "grant_type": "refresh_token", "refresh_token": "rt_9f2a..." }
```

**Authorization code + PKCE**
```json
{
  "grant_type": "authorization_code",
  "code": "ac_01H8...",
  "code_verifier": "dBjftJeZ...",
  "redirect_uri": "https://app.example.com/callback"
}
```

**Client credentials (service-to-service)**
```json
{
  "grant_type": "client_credentials",
  "client_id": "svc_payroll",
  "client_secret": "••••••••",
  "scope": "payroll:read"
}
```

**Response `200 OK`** — sama seperti login (`access_token`, `refresh_token`, `expires_in`). Pada refresh, `refresh_token` baru dikembalikan (rotation).

**Error:** `400 INVALID_GRANT`, `401 INVALID_CLIENT`, `400 INVALID_SCOPE`.

---

## 3. POST /auth/logout

**Request**
```json
{ "refresh_token": "rt_9f2a..." }
```
**Response `204 No Content`** — refresh dicabut; access di-blacklist hingga `exp`.

---

## 4. POST /auth/token/introspect

Untuk resource server memeriksa token opaque / status revocation.

**Request**
```json
{ "token": "eyJhbGci..." }
```
**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "active": true,
    "sub": "usr_01H8...",
    "tenant_id": "tenant_01H8...",
    "scope": "employees:read",
    "exp": 1754900100
  }
}
```

---

## 5. GET /auth/me

**Header:** `Authorization: Bearer <access_token>`

**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "id": "usr_01H8...",
    "email": "budi@example.com",
    "phone": "+6281234567890",
    "username": "budi.santoso",
    "tenant_id": "tenant_01H8...",
    "roles": ["hr_admin"],
    "scope": ["employees:read", "employees:write"],
    "mfa_enabled": true,
    "status": "active"
  }
}
```

---

## 6. POST /auth/password/forgot

**Request** — `identifier` bisa email/phone/username.
```json
{ "identifier": "budi@example.com", "tenant_id": "tenant_01H8..." }
```
**Response `202 Accepted`** — selalu balas sukses walau identifier tak terdaftar (cegah user enumeration). Instruksi reset dikirim ke kanal terverifikasi milik akun (email dan/atau SMS) bila akun ada.

---

## 7. POST /auth/password/reset

**Request**
```json
{ "reset_token": "prt_01H8...", "new_password": "••••••••" }
```
**Response `200 OK`** — password diperbarui; seluruh sesi aktif dicabut.

**Error:** `400 INVALID_TOKEN`, `422 WEAK_PASSWORD`.

---

## 8. POST /auth/password/change

**Header:** `Authorization: Bearer <access_token>`
```json
{ "current_password": "••••••••", "new_password": "••••••••" }
```
**Response `200 OK`**. **Error:** `401 INVALID_CREDENTIALS`, `422 WEAK_PASSWORD`.

---

## 9. MFA

**Enroll — `POST /auth/mfa/enroll`** (Bearer)
```json
{ "method": "totp" }
```
Response berisi `secret` & `otpauth_uri` (untuk QR).

**Verify — `POST /auth/mfa/verify`**
```json
{ "mfa_token": "mfa_01H8...", "code": "123456" }
```
Response `200 OK` → menerbitkan pasangan token penuh.

**Error:** `401 INVALID_MFA_CODE`, `400 MFA_TOKEN_EXPIRED`.

---

## 10. GET /.well-known/jwks.json

**Response `200 OK`** — daftar public key untuk verifikasi JWT.
```json
{
  "keys": [
    { "kty": "RSA", "kid": "key-2026-08", "use": "sig", "alg": "RS256", "n": "...", "e": "AQAB" }
  ]
}
```
