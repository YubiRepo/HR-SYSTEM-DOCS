# 06 · Flows

Alur end-to-end untuk operasi utama. Notasi: `C`=Client, `A`=Auth, `R`=Resource Server, `U`=User, `IdP`=Identity Provider.

---

## 1. Login (Password + opsional MFA)

```
U → C : masukkan identifier (email/phone/username) & password
C → A : POST /auth/login
A     : resolusi identifier → tipe (email/phone/username), cari user dlm tenant
A     : verifikasi credential, cek status akun
        ├─ gagal → 401 / naikkan failed_attempts (→ lockout bila melebihi batas)
        └─ sukses:
            ├─ MFA aktif? → balas { mfa_required, mfa_token }
            │     U → C : masukkan kode
            │     C → A : POST /auth/mfa/verify { mfa_token, code }
            │     A     : verifikasi kode
            └─ terbitkan access + refresh
A → C : { access_token, refresh_token, expires_in }
C     : simpan token (access di memori, refresh aman)
A     : catat audit login.success
```

---

## 2. Mengakses Resource yang Dilindungi

```
C → R : GET /employees   Authorization: Bearer <access>
R     : verifikasi signature (JWKS via kid)
R     : cek exp, iss, type=access, (opsional) jti tidak di-blacklist
R     : evaluasi RBAC (roles ∩ scope vs izin dibutuhkan)
        ├─ token invalid/exp → 401
        ├─ izin kurang       → 403
        └─ lolos             → proses & balas data
```

---

## 3. Refresh Token (dengan Rotation)

```
C     : access token kedaluwarsa (401 dari R)
C → A : POST /auth/token { grant_type: refresh_token, refresh_token }
A     : hash & cari refresh; validasi belum dicabut/kedaluwarsa
        ├─ token dicabut & sudah pernah dipakai? → REUSE DETECTED
        │     A : cabut seluruh family (semua sesi terkait) → 401
        └─ valid:
            A : terbitkan access baru + refresh baru
            A : tandai refresh lama revoked, set replaced_by
A → C : { access_token, refresh_token (baru), expires_in }
```

---

## 4. Logout

```
C → A : POST /auth/logout { refresh_token }
A     : cabut refresh (revoked_at = now)
A     : tambahkan jti access ke blacklist s/d exp (logout instan)
A → C : 204 No Content
A     : catat audit logout
```

---

## 5. Reset Password (Lupa Password)

```
U → C : klik "lupa password", isi email
C → A : POST /auth/password/forgot { email, tenant_id }
A     : (selalu) balas 202  ← cegah user enumeration
A     : bila akun ada → buat password_reset (token hash, exp 30 mnt)
A → Email : kirim tautan berisi reset_token
──────────────────────────────────────────────
U → C : buka tautan, isi password baru
C → A : POST /auth/password/reset { reset_token, new_password }
A     : validasi token (belum dipakai, belum exp), cek kekuatan password
A     : update password_hash, tandai token used
A     : cabut SEMUA sesi aktif user (refresh tokens)
A → C : 200 OK
```

---

## 6. Authorization Code + PKCE (Web/Mobile)

```
C     : buat code_verifier (acak) & code_challenge = SHA256(verifier)
C → A : GET /authorize?response_type=code&client_id&redirect_uri
                        &scope&code_challenge&code_challenge_method=S256
U     : autentikasi di halaman Auth (+MFA bila perlu)
A → C : redirect ke redirect_uri?code=ac_...
C → A : POST /auth/token { grant_type=authorization_code, code,
                           code_verifier, redirect_uri }
A     : verifikasi code_verifier vs code_challenge tersimpan
A → C : { access_token, refresh_token, expires_in }
```

PKCE mencegah interception authorization code pada public client.

---

## 7. Client Credentials (Service-to-Service)

```
Svc → A : POST /auth/token { grant_type=client_credentials,
                             client_id, client_secret, scope }
A       : verifikasi client & scope yang diizinkan
A → Svc : { access_token, expires_in }   (tanpa refresh token)
Svc → R : panggil API dengan Bearer access token
```

---

## 8. SSO (OIDC)

```
U → C : pilih "Login dengan SSO"
C → A : mulai SSO
A → IdP : redirect ke IdP (authorization request)
U → IdP : autentikasi di IdP
IdP → A : callback dengan id_token/assertion
A       : verifikasi assertion, cocokkan/provisioning user (JIT)
A → C   : terbitkan token HRMS internal (access + refresh)
```

**JIT provisioning:** bila user belum ada, buat otomatis dari klaim IdP (email, nama) lalu petakan ke peran default tenant.

---

## 9. Account Lockout

```
setiap login gagal → failed_attempts += 1
failed_attempts ≥ batas (mis. 5) → status = locked, mulai cooldown
                                    (atau butuh reset via email)
login sukses → failed_attempts = 0
```
