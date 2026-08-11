# 07 · Security

## 1. Kebijakan Password

| Aturan | Ketentuan |
|---|---|
| Panjang minimum | ≥ 12 karakter |
| Kompleksitas | Kombinasi huruf, angka, simbol (atau passphrase) |
| Hashing | Argon2id (disarankan) atau bcrypt cost tinggi |
| Blocklist | Tolak password umum/terkena breach |
| Riwayat | Cegah pemakaian ulang N password terakhir |
| Rotasi | Tidak dipaksa berkala (mengikuti panduan NIST modern) |

Password **tidak pernah** disimpan/di-log dalam bentuk plaintext.

---

## 2. Keamanan Token

| Aspek | Praktik |
|---|---|
| Access token | Umur pendek (mis. 15 mnt), JWT RS256, stateless |
| Refresh token | Opaque, disimpan sebagai hash, rotation + reuse detection |
| Penyimpanan klien | Access di memori; refresh di HttpOnly Secure cookie / secure storage |
| Signing key | Private key di KMS; rotasi berkala via `kid` + JWKS |
| Revocation | Blacklist `jti` untuk logout instan; refresh dapat dicabut |
| Klaim minimal | Hindari data sensitif dalam JWT (payload terbaca) |

---

## 3. Perlindungan Transport & Cookie

- Wajib **HTTPS/TLS 1.2+**; tolak koneksi non-TLS.
- HSTS diaktifkan.
- Cookie refresh: `HttpOnly`, `Secure`, `SameSite=Strict/Lax`.
- CORS dibatasi ke origin yang di-allowlist.

---

## 4. Rate Limiting & Anti-Brute-Force

| Titik | Perlindungan |
|---|---|
| `/auth/login` | Rate limit per IP + per akun; lockout progresif |
| `/auth/password/forgot` | Rate limit per IP/email |
| `/auth/mfa/verify` | Batasi percobaan kode; kadaluarsa cepat |
| `/auth/token` | Rate limit per client |

Terapkan exponential backoff & CAPTCHA opsional setelah beberapa kegagalan.

---

## 5. Multi-Factor Authentication (MFA)

- Dukung TOTP (disarankan), OTP email/SMS sebagai alternatif.
- Sediakan recovery codes sekali pakai (disimpan sebagai hash).
- MFA wajib untuk peran sensitif (admin, payroll) — konfigurabel per tenant.

---

## 6. Ancaman & Mitigasi

| Ancaman | Mitigasi |
|---|---|
| Credential stuffing | Rate limit, breach-password blocklist, MFA |
| Brute force | Lockout progresif, backoff |
| Token theft | Umur pendek, rotation, reuse detection, cabut family |
| CSRF | SameSite cookie, token anti-CSRF pada alur cookie |
| XSS (pencurian token) | Jangan simpan token di localStorage; CSP ketat |
| Replay | `exp` pendek, `jti`, nonce pada OIDC |
| User enumeration | Respons seragam pada forgot-password & login |
| Privilege escalation | Deny-by-default, validasi scope, audit perubahan role |
| Man-in-the-middle | TLS wajib, HSTS, certificate pinning (mobile) |
| Key compromise | KMS, rotasi kunci, pemisahan private/public |

---

## 7. Audit & Monitoring

Peristiwa yang wajib dicatat ke `audit_logs`:

- `login.success`, `login.failed`, `account.locked`
- `token.issued`, `token.refreshed`, `token.revoked`, `token.reuse_detected`
- `password.changed`, `password.reset`
- `mfa.enrolled`, `mfa.verified`, `mfa.failed`
- `role.assigned`, `role.removed`, `permission.changed`

Setiap entri menyertakan aktor, IP, user agent, `tenant_id`, dan waktu. Pantau anomali (lonjakan kegagalan, login lokasi tak biasa).

---

## 8. Privasi & Kepatuhan

- Patuhi UU PDP (Indonesia): data identitas diperlakukan sebagai data pribadi.
- Enkripsi field sensitif at-rest (secret MFA, dsb).
- Sediakan mekanisme penghapusan/anonymisasi data saat akun dihapus.
- Minimalkan data di token & log; jangan log credential atau token penuh.

---

## 9. Checklist Hardening

1. TLS wajib + HSTS aktif.
2. Password di-hash Argon2id, blocklist breach aktif.
3. Access token pendek + refresh rotation + reuse detection.
4. Rate limit di semua endpoint sensitif.
5. MFA tersedia & wajib untuk peran admin/payroll.
6. Deny-by-default RBAC + validasi scope.
7. Audit lengkap + monitoring anomali.
8. Signing key di KMS + rotasi terjadwal.
9. Respons seragam untuk cegah enumeration.
10. CORS allowlist + cookie HttpOnly/Secure/SameSite.
