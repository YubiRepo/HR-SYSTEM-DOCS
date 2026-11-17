<!-- 📁 integrations/jewelry/04-config-dan-migrasi.md -->
# 04 — Konfigurasi dan Migrasi

## Environment variable

| Repo | Variabel | Keterangan |
|---|---|---|
| jewelry-be | `ISSUER_URL` | Issuer token; harus sama dengan `IDP_ISSUER` HR |
| jewelry-be | `TOKEN_AUDIENCES=jewelry,hr` | Audience token staff |
| jewelry-be | `HR_APP_URL` | Base URL HR-BO (tujuan SSO, otomatis masuk CORS) |
| jewelry-be | `HR_APP_CALLBACK_URL` | Opsional; default `${HR_APP_URL}/auth/callback` |
| jewelry-be | `HR_APP_API_KEY` | Kunci service API; harus sama dengan `IDP_APP_KEY` HR |
| HR-API | `IDP_BASE_URL` | URL Jewelry dari sisi container HR (mis. `http://host.docker.internal:8383`) |
| HR-API | `IDP_ISSUER` | Default `IDP_BASE_URL` |
| HR-API | `IDP_JWKS_URL` | Default `<IDP_BASE_URL>/.well-known/jwks.json` |
| HR-API | `IDP_AUDIENCE` | `hr` |
| HR-API | `IDP_APP_KEY` | Sama dengan `HR_APP_API_KEY` |
| HR-API | `IDP_HTTP_TIMEOUT_SECONDS` | Default 5 |
| HR-API | `DB_NAME=hr_system_jewerly` | Database terpisah selama integrasi |
| HR-BO | `NUXT_PUBLIC_JEWELRY_API_BASE_URL` | Jewelry API dari browser, tanpa `/api/v1` |
| HR-BO | `NUXT_PUBLIC_JEWELRY_BACKOFFICE_URL` | URL backoffice Jewelry (link lupa password, kelola role/user/branch) |

Variabel yang dihapus dari HR-API: konfigurasi JWT/password/lockout/SMTP/auth rate limit lokal dan `BILLING_GRACE_PERIOD_DAYS`.

## Migrasi

**jewelry-be:** `20261116094208_add_app_to_rbac`, `20261116101431_create_auth_handoff_codes`, `20261117084026_app_permission_catalog` (`permissions.data_scope/translations/position/deprecated_at`, tabel `app_role_templates`). Katalog & role sistem HR **tidak** di-seed: terisi otomatis saat API HR start (lihat [01-arsitektur.md](01-arsitektur.md)). Seeder `permissions` hanya untuk katalog jewelry.

**HR-API (`hr_system_jewerly`):**

| Migrasi | Isi |
|---|---|
| `20261116000002_add_idp_projection_columns` | `external_synced_at` di tenants/branches/users |
| `20261116000003_add_tenant_hr_bootstrapped_at` | Penanda bootstrap tenant |
| `20261116000004_create_idp_sync_state` | Kursor sync periodik |
| `20261117000001_drop_local_auth` | Drop refresh token, password reset/history, kolom password & lockout |
| `20261117000002_drop_local_rbac` | Drop roles, role_permissions, role_assignments, role_templates, tenant_members |
| `20261117000003_drop_entitlement_billing` | Drop plans, benefits, subscriptions, invoices, payments, dll. |
| `20261117000004_drop_provisioning_impersonation` | Drop impersonation_sessions, tenant_status_history |

Semua migrasi drop punya `down` yang membuat ulang struktur (tanpa data).

## Urutan menjalankan (dev)

1. jewelry-be: isi env → recreate container → `make migrate-up` → `make seed`.
2. HR-API: buat DB `hr_system_jewerly` → isi env → rebuild container → `make migrate-up`.
3. jewelry-fe di port berbeda dari HR-BO (mis. `npm run dev -- --port 3001`).
4. HR-BO `npm run dev` di origin yang sama dengan `HR_APP_URL`.
