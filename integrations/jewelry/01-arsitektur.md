<!-- 📁 integrations/jewelry/01-arsitektur.md -->
# 01 — Arsitektur

## Komponen

```
Browser (HR-BO, Nuxt)
  │  token Jewelry (cookie access_token / refresh_token)
  ├──► Jewelry BE  /api/v1/auth/*          login, refresh, switch-context, handoff, profile
  └──► HR API      /api/v1/*               Authorization: Bearer <token Jewelry>
          │
          ├─ AuthMiddleware ──► JWKS Jewelry (cache, refetch saat kid baru)
          ├─ PrincipalMiddleware ──► GET Jewelry /api/v1/auth/authorization?app=hr  (cache Redis 60 dtk)
          │      └─ hook idpsync ──► service API Jewelry /api/v1/internal/*  (X-App-Key)
          └─ handler modul (RequirePermission / Authorize — tidak berubah)
```

| Repo | Peran |
|---|---|
| jewelry-be | Identity provider, master RBAC (permission ber-dimensi aplikasi `hr`), SSO handoff, service API untuk HR |
| jewelry-fe | Editor role per aplikasi (Jewelry / HR), app launcher di topbar |
| HR-SYSTEM-API | Resource server: verifikasi token, grant dari Jewelry, proyeksi company/branch/user |
| HR-SYSTEM-BACKOFFICE | Login & SSO ke Jewelry, pemilih company, UI HR tanpa RBAC/billing |

## Token & klaim

Token staff Jewelry: RS256, header `kid` (thumbprint RFC 7638), `aud` berisi `jewelry` dan `hr` (`TOKEN_AUDIENCES`). HR memeriksa tanda tangan, `iss`, `aud=hr`, kedaluwarsa, dan `typ=staff`.

| Klaim | Principal HR |
|---|---|
| `sub` | `UserID` |
| `cid` (company aktif) | `TenantID` |
| `bid` (branch aktif, opsional) | `ActiveBranchID` |
| `sid` | `SessionID` |
| `tid` | tenant Jewelry (tidak dipakai sebagai tenant HR) |

Token valid tanpa `cid` → `403 CONTEXT_REQUIRED`; klien meminta user memilih company (Jewelry `switch-context`).

## Grant & scope

`PrincipalMiddleware` memanggil Jewelry `GET /api/v1/auth/authorization?app=hr` dengan token user. Hasilnya `roles[]` dan `grants[] {code, scope_type, company_id, branch_id, data_scope}` untuk company aktif.

| Jewelry | Scope HR |
|---|---|
| `scope_type=company` | `tenant` |
| `scope_type=branch` | `branch` (+ `branch_id`) |
| `data_scope=self` | `self` |

- Assignment level **tenant** Jewelry (mis. `owner`) dan role `grants_all` (`owner`, `company_admin`) serta superadmin mendapat **semua** permission HR.
- Role sistem HR: `company_admin` (grants_all), `branch_admin`, `employee`. Role HR kustom dibuat di backoffice Jewelry (tab aplikasi HR).
- Kode permission HR (`resource:action`) sama dengan katalog lama, jadi `RequirePermission` / `Authorize` / `NarrowToBranch` di modul HR tidak berubah.
- **Katalog milik HR.** Sumbernya HR-API `internal/modules/auth/domain/role/constant/permissions.go` (kode, group, label EN/ID, role sistem). Setiap kali API HR start, `auth.SyncCatalog` mengirimnya ke Jewelry (`PUT /api/v1/internal/catalog`, header `X-App-Key`) di background dengan retry; Jewelry down tidak memblokir API. Jewelry menyimpan katalog di DB, memprovisikan role sistem HR ke semua tenant, dan menandai *deprecated* kode yang tidak dikirim lagi (baris di role tetap ada tetapi diabaikan). Menambah permission HR cukup di HR-API, tanpa deploy atau seeder jewelry-be.
- Superadmin Jewelry boleh memilih company lewat header `X-Company-ID` (diabaikan untuk user lain).

## Cache & kegagalan

| Kondisi | Respons HR |
|---|---|
| Grant di cache Redis (`sid@company`, 60 dtk) | dipakai langsung |
| Jewelry menolak sesi (logout, dicabut, user disuspend) | `401 TOKEN_REVOKED` — paling lambat 60 dtk setelah pencabutan |
| Jewelry tidak bisa dihubungi | `503 IDENTITY_PROVIDER_UNAVAILABLE` (fail-closed) |
| Proyeksi company gagal dimuat | `503 IDENTITY_SYNC_FAILED` |
| Token salah / kedaluwarsa | `401 TOKEN_INVALID` (klien refresh ke Jewelry) |

## Yang dihapus dari HR

Login & token lokal, refresh token, password/lockout, invitation, MFA mock, RBAC lokal (`roles`, `role_assignments`, `role_templates`, `tenant_members`), entitlement & billing (plan, subscription, invoice, payment), provisioning & lifecycle tenant, impersonation, konsol `/platform` di backoffice.
