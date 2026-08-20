# 09 · Clients (Web & Mobile)

Modul Auth bersifat **API-first** — semua fungsi tersedia via REST + OAuth2/JWT, sehingga dapat dipakai oleh web maupun mobile (dan integrasi server). Dokumen ini menjelaskan perbedaan penanganan per platform.

---

## 1. Prinsip

Backend Auth **sama** untuk semua platform. Yang berbeda hanya di sisi client: jenis client (public vs confidential), grant flow, dan cara menyimpan token. Tidak ada endpoint terpisah "khusus mobile" atau "khusus web".

---

## 2. Ringkasan per Platform

| Aspek | Web (SPA) | Web (server-rendered) | Mobile (native) |
|---|---|---|---|
| **Tipe client** | Public | Confidential | Public |
| **Grant utama** | Auth Code + PKCE | Auth Code | Auth Code + PKCE |
| **Simpan access token** | Memori (variabel) | Sesi server | Secure storage OS |
| **Simpan refresh token** | HttpOnly Secure cookie | Sesi server | Keychain / Keystore |
| **PKCE** | Wajib | Opsional | Wajib |
| **Client secret** | Tidak boleh | Boleh (di server) | Tidak boleh |

---

## 3. Web

### 3.1 Single Page App (React/Vue/dll) — Public Client
- Gunakan **Authorization Code + PKCE** (bukan implicit flow yang sudah usang).
- **Access token** disimpan di memori aplikasi (bukan `localStorage`/`sessionStorage`) untuk mengurangi risiko XSS.
- **Refresh token** sebaiknya di **HttpOnly Secure cookie** (`SameSite=Strict/Lax`) agar tidak terbaca JavaScript.
- Terapkan **CSP ketat** untuk menekan risiko XSS.

### 3.2 Server-Rendered / BFF (Backend-for-Frontend) — Confidential Client
- Token dikelola di server; browser hanya memegang cookie sesi.
- Pola **BFF** direkomendasikan untuk keamanan tertinggi: token tak pernah menyentuh browser.
- Client secret aman disimpan di server.

---

## 4. Mobile (iOS/Android) — Public Client

- Gunakan **Authorization Code + PKCE** melalui browser sistem (ASWebAuthenticationSession di iOS, Custom Tabs di Android) — **hindari** WebView tersemat untuk login.
- Simpan token di **secure storage OS**:
  - iOS → **Keychain**
  - Android → **Keystore / EncryptedSharedPreferences**
- Refresh token berumur panjang cocok untuk mobile (sesi bertahan lama); andalkan **rotation + reuse detection**.
- Gunakan **redirect URI** berbasis custom scheme atau App Links/Universal Links.
- Pertimbangkan **certificate pinning** untuk mencegah MITM.
- Manfaatkan biometrik OS (Face ID/fingerprint) sebagai gate lokal sebelum memakai refresh token (bukan pengganti MFA server).

---

## 5. Token yang Sama, Penyimpanan Berbeda

Access token JWT bersifat **stateless & portabel** — token yang sama valid dipakai dari web atau mobile karena resource server hanya memverifikasi tanda tangan & klaim. Perbedaannya murni pada **cara menyimpan** token dengan aman di tiap platform (lihat tabel bagian 2).

---

## 6. Multi-Device & Multi-Session

- Satu pengguna dapat login di beberapa perangkat sekaligus (web + mobile).
- Tiap sesi = satu `refresh_token` dengan `family_id` sendiri; konteks perangkat (`user_agent`, `ip`) dicatat.
- Logout di satu perangkat mencabut hanya sesi perangkat itu; sediakan opsi "logout semua perangkat" (cabut seluruh refresh milik user).

---

## 7. Pertimbangan CORS & Redirect

| Platform | Konfigurasi |
|---|---|
| Web | Origin di-allowlist (`CORS_ALLOWED_ORIGINS`); redirect URI HTTPS terdaftar |
| Mobile | Redirect URI via custom scheme / App Links / Universal Links terdaftar |

Semua `redirect_uri` wajib terdaftar (allowlist) di konfigurasi client untuk mencegah open-redirect.

---

## 8. Ringkasan Rekomendasi

1. Semua login pengguna → **Authorization Code + PKCE**.
2. Web SPA → access di memori, refresh di HttpOnly cookie; pertimbangkan **BFF**.
3. Mobile → token di Keychain/Keystore, login via browser sistem, pertimbangkan pinning + biometrik.
4. Jangan simpan token di `localStorage` atau WebView login.
5. Andalkan refresh rotation + reuse detection lintas semua platform.
6. Sediakan manajemen sesi multi-perangkat & "logout semua".
