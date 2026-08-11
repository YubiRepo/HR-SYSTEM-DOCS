# 01 · Overview

## 1. Tujuan

Modul Auth bertanggung jawab menjawab dua pertanyaan mendasar untuk setiap request di HRMS:

- **Authentication** — "Siapa kamu?" (memverifikasi identitas pengguna/sistem)
- **Authorization** — "Boleh melakukan apa?" (menentukan hak akses via RBAC)

Modul ini menjadi satu-satunya sumber kebenaran identitas bagi seluruh modul lain (Core HR, Payroll, Attendance, dst).

---

## 2. Konsep Inti

| Konsep | Penjelasan |
|---|---|
| **Identity** | Representasi pengguna (karyawan, admin, sistem) di dalam sistem |
| **Identifier** | Pengenal login pengguna — dapat berupa email, nomor telepon, atau username |
| **Credential** | Bukti identitas (password, MFA, client secret) |
| **Authentication** | Proses verifikasi credential |
| **Authorization** | Penentuan izin berdasarkan peran & scope |
| **Access Token** | JWT berumur pendek yang membuktikan identitas pada setiap request |
| **Refresh Token** | Token berumur panjang untuk memperbarui access token |
| **Session** | Konteks login aktif; direpresentasikan oleh pasangan token |
| **Tenant** | Organisasi terisolasi dalam sistem multi-tenant |

---

## 3. Terminologi OAuth 2.0

| Istilah | Arti dalam konteks HRMS |
|---|---|
| **Resource Owner** | Pengguna (karyawan/admin) pemilik data |
| **Client** | Aplikasi yang meminta akses (web app, mobile, integrasi) |
| **Authorization Server** | Modul Auth — menerbitkan token |
| **Resource Server** | Modul HRMS lain yang dilindungi token |
| **Scope** | Cakupan izin yang diminta client (mis. `employees:read`) |
| **Grant** | Metode memperoleh token (lihat arsitektur) |

---

## 4. Komponen Modul

| Komponen | Peran |
|---|---|
| **Identity Store** | Menyimpan data pengguna, credential, status |
| **Token Service** | Menerbitkan, memvalidasi, merotasi, mencabut token |
| **RBAC Engine** | Mengevaluasi peran & permission terhadap request |
| **MFA Service** | Mengelola faktor kedua (TOTP, OTP, dsb) |
| **SSO Connector** | Integrasi ke IdP eksternal (OIDC/SAML) |
| **Audit Logger** | Mencatat peristiwa autentikasi & otorisasi |

---

## 5. Tipe Pengguna & Client

**Tipe pengguna:**
- **Karyawan** — akses self-service terbatas pada data sendiri
- **Manajer** — tambahan akses approval & data tim
- **HR/Admin** — akses administratif lintas karyawan
- **Super Admin (tenant)** — konfigurasi & manajemen pengguna dalam tenant
- **Service account** — akun mesin untuk integrasi server-to-server

**Tipe client:**
- **Confidential client** — dapat menyimpan secret (server backend)
- **Public client** — tidak dapat menyimpan secret (SPA, mobile) → wajib PKCE

---

## 6. Batasan & Asumsi

- Semua komunikasi wajib melalui HTTPS/TLS 1.2+.
- Access token bersifat stateless (JWT); refresh token bersifat stateful (dapat dicabut).
- Setiap identitas terikat tepat pada satu `tenant_id`.
- Password tidak pernah disimpan dalam bentuk plaintext (hanya hash).
- Modul tidak menyimpan data bisnis HR — hanya identitas & otorisasi.
