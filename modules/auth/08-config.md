# 09 · Configuration

Parameter konfigurasi modul Auth. Nilai bersifat contoh/rekomendasi — sesuaikan dengan kebutuhan & kebijakan keamanan. Rahasia (secret/key) **wajib** dikelola via secret manager, bukan hardcode.

---

## 1. Token

| Parameter | Contoh | Keterangan |
|---|---|---|
| `ACCESS_TOKEN_TTL` | `15m` | Umur access token |
| `REFRESH_TOKEN_TTL` | `30d` | Umur refresh token |
| `TOKEN_ALGORITHM` | `RS256` | Algoritma signing |
| `TOKEN_ISSUER` | `https://auth.hrms.example.com` | Klaim `iss` |
| `JWKS_CACHE_TTL` | `1h` | Cache public key di resource server |
| `KEY_ROTATION_INTERVAL` | `90d` | Interval rotasi signing key |

---

## 2. Password

| Parameter | Contoh | Keterangan |
|---|---|---|
| `PASSWORD_MIN_LENGTH` | `12` | Panjang minimum |
| `PASSWORD_HASH_ALGO` | `argon2id` | Algoritma hashing |
| `PASSWORD_HISTORY_COUNT` | `5` | Jumlah riwayat yang dicegah |
| `PASSWORD_BREACH_CHECK` | `true` | Cek terhadap daftar breach |
| `RESET_TOKEN_TTL` | `30m` | Umur token reset |

---

## 3. Lockout & Rate Limit

| Parameter | Contoh | Keterangan |
|---|---|---|
| `MAX_FAILED_ATTEMPTS` | `5` | Batas gagal sebelum lockout |
| `LOCKOUT_DURATION` | `15m` | Durasi kunci |
| `LOGIN_RATE_LIMIT` | `10/min/ip` | Batas login per IP |
| `FORGOT_RATE_LIMIT` | `3/hour/email` | Batas request reset |

---

## 4. MFA

| Parameter | Contoh | Keterangan |
|---|---|---|
| `MFA_ENABLED` | `true` | Aktifkan MFA |
| `MFA_ENFORCED_ROLES` | `["tenant_admin","payroll_officer"]` | Peran yang wajib MFA |
| `MFA_TOTP_WINDOW` | `1` | Toleransi window TOTP |
| `MFA_CODE_TTL` | `5m` | Umur OTP email/SMS |
| `RECOVERY_CODES_COUNT` | `10` | Jumlah recovery code |

---

## 5. SSO

| Parameter | Contoh | Keterangan |
|---|---|---|
| `SSO_ENABLED` | `true` | Aktifkan SSO |
| `SSO_PROTOCOLS` | `["oidc","saml"]` | Protokol didukung |
| `SSO_JIT_PROVISIONING` | `true` | Buat user otomatis dari IdP |
| `SSO_DEFAULT_ROLE` | `employee` | Peran default user JIT |

---

## 6. Session & Cookie

| Parameter | Contoh | Keterangan |
|---|---|---|
| `REFRESH_COOKIE_NAME` | `hrms_rt` | Nama cookie refresh |
| `COOKIE_SECURE` | `true` | Hanya via HTTPS |
| `COOKIE_HTTPONLY` | `true` | Tidak dapat diakses JS |
| `COOKIE_SAMESITE` | `strict` | Kebijakan SameSite |
| `CORS_ALLOWED_ORIGINS` | `["https://app.example.com"]` | Allowlist origin |

---

## 7. Secrets (via Secret Manager)

| Secret | Keterangan |
|---|---|
| `JWT_PRIVATE_KEY` | Private key signing (KMS) |
| `JWT_PUBLIC_KEY` | Public key (dipublikasikan via JWKS) |
| `MFA_ENCRYPTION_KEY` | Kunci enkripsi secret TOTP |
| `SSO_CLIENT_SECRET` | Secret client ke IdP |

> Jangan pernah menaruh secret di repo, env plaintext yang ter-commit, atau log.

---

## 8. Environment Profiles

| Profil | Perbedaan tipikal |
|---|---|
| **development** | TTL lebih longgar, rate limit ringan, key dummy |
| **staging** | Mirror produksi, data uji |
| **production** | Kebijakan penuh, MFA enforced, monitoring aktif |
