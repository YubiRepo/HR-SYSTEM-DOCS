<!-- 📁 modules/mobile/api/auth.md -->
# Mobile API · Auth

Login, konteks tenant, dan data untuk menyusun menu per peran. Prefix `/api/v1/auth`. Token: JWT access token (Bearer) + refresh token opaque. Tidak memakai cookie.

---

## 1. Login — `POST /auth/login`
```json
{ "identifier": "budi@example.com", "password": "••••••", "tenant_id": null }
```
Response `200`, salah satu dari dua bentuk:

**a. Langsung masuk** (`expires_in` = TTL access token dalam detik, sesuai konfigurasi)
```json
{ "success": true, "data": { "access_token": "…", "refresh_token": "…", "token_type": "Bearer", "expires_in": 3600, "tenant_id": "…", "tenant_selection_required": false } }
```

**b. User punya beberapa tenant**
```json
{ "success": true, "data": { "tenant_selection_required": true, "selection_token": "…", "tenants": [ { "tenant_id": "…", "tenant_name": "PT Contoh", "status": "active" } ] } }
```
Untuk bentuk (b), lanjutkan ke §2.

## 2. Pilih Tenant — `POST /auth/select-tenant`
```json
{ "selection_token": "…", "tenant_id": "…" }
```
Response: token pair seperti §1a.

## 3. Refresh Token — `POST /auth/token`
```json
{ "grant_type": "refresh_token", "refresh_token": "…" }
```

## 4. Ganti Tenant (switch konteks) — `GET /auth/me/tenants` · `POST /auth/switch-tenant`
- `GET /auth/me/tenants` mengembalikan daftar membership dan `current_tenant_id`.
- Untuk pindah: `POST /auth/switch-tenant` dengan body `{ "tenant_id": "…", "refresh_token": "…" }`. Refresh token lama ikut dicabut, dan response berisi token pair baru.

## 5. Logout — `POST /auth/logout`
```json
{ "refresh_token": "…" }
```

## 6. Akun Saya — `GET /auth/me`
Berisi `id`, `email`, `phone`, `username`, `tenant_id`, `roles`, `status`, `avatar_url`. Field `employee_id` **tidak** ada di sini; data karyawan diambil dari `GET /core-hr/me/employee` (lihat [`core-hr.md`](./core-hr.md)).

## 7. Permission untuk Menu — `GET /rbac/users/{user_id}/permissions`
User boleh memanggil endpoint ini untuk dirinya sendiri (`user_id` diambil dari `/auth/me`). Hasilnya dipakai app untuk menampilkan atau menyembunyikan menu, misalnya menu approval hanya bila user memegang `leave:approve`.

---

## Catatan Mobile
- Simpan refresh token di secure storage. Biometrik cukup sebagai kunci lokal untuk membuka refresh token; server tidak punya endpoint biometrik.
- Access token tidak membawa daftar permission, jadi muat ulang §7 setelah login atau switch tenant.
