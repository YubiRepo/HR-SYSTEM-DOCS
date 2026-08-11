# 02 · Architecture

## 1. Gambaran Arsitektur

```
                    ┌─────────────────────────────────────────┐
   Client  ───────▶ │            Auth Module                   │
 (web/mobile/       │  ┌─────────────┐   ┌──────────────────┐  │
  service)          │  │ Token       │   │ RBAC Engine      │  │
                    │  │ Service     │   │ (roles/scopes)   │  │
                    │  └─────────────┘   └──────────────────┘  │
                    │  ┌─────────────┐   ┌──────────────────┐  │
                    │  │ Identity    │   │ MFA / SSO        │  │
                    │  │ Store       │   │ Connectors       │  │
                    │  └─────────────┘   └──────────────────┘  │
                    │  ┌────────────────────────────────────┐  │
                    │  │ Audit Logger                        │  │
                    │  └────────────────────────────────────┘  │
                    └───────────────────┬─────────────────────┘
                                        │ issues/validates token
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │  Resource Servers (Core HR, Payroll...)  │
                    └─────────────────────────────────────────┘
```

Access token bersifat **self-contained (JWT)** sehingga resource server dapat memvalidasi tanpa memanggil Auth setiap kali — cukup memverifikasi tanda tangan & klaim.

---

## 2. Struktur Token

### 2.1 Access Token (JWT)
Berumur pendek (mis. 15 menit). Tidak disimpan di server (stateless).

**Header:**
```json
{ "alg": "RS256", "typ": "JWT", "kid": "key-2026-08" }
```

**Payload (claims):**
```json
{
  "iss": "https://auth.hrms.example.com",
  "sub": "usr_01H8X...",
  "tenant_id": "tenant_01H8...",
  "roles": ["hr_admin"],
  "scope": "employees:read employees:write payroll:read",
  "type": "access",
  "iat": 1754899200,
  "exp": 1754900100,
  "jti": "tok_01H8..."
}
```

| Claim | Arti |
|---|---|
| `iss` | Penerbit token (Auth server) |
| `sub` | Subject — ID pengguna |
| `tenant_id` | Isolasi multi-tenant |
| `roles` | Daftar peran pengguna |
| `scope` | Izin granular (space-separated) |
| `type` | `access` / `refresh` |
| `iat` / `exp` | Waktu terbit & kedaluwarsa |
| `jti` | ID unik token (untuk revocation list) |

### 2.2 Refresh Token
Berumur panjang (mis. 30 hari), **opaque** (bukan JWT), dan **stateful** — disimpan (hash) di server agar dapat dicabut & dirotasi.

---

## 3. Signing & Key Management

| Aspek | Ketentuan |
|---|---|
| **Algoritma** | RS256 (asymmetric) — resource server cukup punya public key |
| **Key rotation** | Rotasi berkala; `kid` di header menunjuk key aktif |
| **JWKS** | Public key dipublikasikan via endpoint `GET /.well-known/jwks.json` |
| **Private key** | Disimpan aman (KMS/secret manager), tak pernah keluar Auth |

---

## 4. OAuth 2.0 Grant Types

| Grant | Kegunaan | Client |
|---|---|---|
| **Authorization Code + PKCE** | Login pengguna via browser/mobile | Public & confidential |
| **Client Credentials** | Integrasi server-to-server | Service account |
| **Refresh Token** | Memperbarui access token | Semua |
| **Password (ROPC)** | *Legacy* — hindari; hanya untuk first-party terpercaya | Confidential |

> **Rekomendasi:** gunakan Authorization Code + PKCE untuk semua login pengguna. Hindari ROPC kecuali benar-benar diperlukan.

---

## 5. Token Lifecycle

```
Login ──▶ issue(access + refresh)
                │
   access exp ──┤
                ▼
        POST /token (refresh) ──▶ issue(access baru + refresh baru)
                │                          │
                │                   (refresh lama dicabut = rotation)
                ▼
        Logout / revoke ──▶ refresh dicabut, access di-blacklist s/d exp
```

**Refresh token rotation:** setiap kali refresh dipakai, terbitkan refresh baru & cabut yang lama. Jika refresh lama dipakai ulang → indikasi pencurian → cabut seluruh sesi pengguna.

---

## 6. Validasi Token di Resource Server

Langkah verifikasi pada setiap request masuk:

1. Ambil token dari header `Authorization: Bearer <token>`.
2. Verifikasi tanda tangan dengan public key (via `kid` → JWKS).
3. Cek `exp` (belum kedaluwarsa) & `iss` (penerbit benar).
4. Cek `type` = `access`.
5. Cek `jti` tidak ada di revocation list (opsional, untuk logout instan).
6. Ambil `tenant_id`, `roles`, `scope` untuk evaluasi RBAC.

---

## 7. Multi-Tenancy

- Setiap identitas, token, dan peran terikat pada satu `tenant_id`.
- `tenant_id` selalu hadir dalam klaim token dan divalidasi di resource server.
- Isolasi data ditegakkan di lapisan Auth (klaim) + lapisan data (query scoping).

---

## 8. Integrasi SSO

| Protokol | Kegunaan |
|---|---|
| **OIDC** | SSO modern berbasis OAuth2 (Google Workspace, Azure AD, Okta) |
| **SAML 2.0** | SSO enterprise legacy |

Alur: pengguna diarahkan ke IdP → IdP memverifikasi → Auth menerima assertion → Auth menerbitkan token HRMS internal (token exchange). Detail alur di `06-flows.md`.
