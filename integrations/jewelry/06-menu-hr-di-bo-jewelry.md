<!-- 📁 integrations/jewelry/06-menu-hr-di-bo-jewelry.md -->
# Menu HR di BO Jewelry

Sebagian halaman admin HR BO **disalin** (bukan dipindah) ke backoffice Jewelry (`jewelry-fe`). Halaman salinan memanggil HR-SYSTEM-API langsung dengan token Jewelry yang sama. HR BO tetap dipelihara, dan ESS tetap hanya ada di HR BO. Rencana: Bagian G di [plan](../../plans/2026-11-16-integrasi-jewelry-identity-rbac.md).

> Cara menyalin halaman berikutnya: [`07-pola-salin-halaman-hr.md`](./07-pola-salin-halaman-hr.md).
>
> `jewelry-fe` melarang komentar di kode (`npm run check:comments`). Penjelasan desain bagian ini dicatat di dokumen ini.

## Komponen (`jewelry-fe`)

| File | Peran |
|---|---|
| `app/core/api/hr-envelope.ts` | `createHrTransport`: membungkus transport HTTP ke base URL HR dan mengubah envelope HR ke envelope backoffice, sehingga `createApiClient` (refresh, `AppError`, logging, toast) dipakai tanpa perubahan. |
| `app/composables/backoffice/useHrApi.ts` | `useHrApi`/`hrApiFor`: client HR. Token dari storage Jewelry, refresh lewat `refreshAccessToken` Jewelry, header `X-Company-ID` (= `session.context.company_id`) hanya untuk superadmin. |
| `app/composables/backoffice/useApi.ts` | `refreshAccessToken` kini single-flight lintas client (lihat "Refresh token"). |
| `app/stores/backoffice/hr-access.store.ts` + `app/composables/backoffice/useHrAccess.ts` | Principal HR dari `GET /auth/me`: `ensure()`, `canHr()`, `hrAvailable`, `status`, `error`. |
| `app/utils/backoffice/hr.permissions.ts` | `HR_PERMISSIONS` (salinan catalog HR), tipe `HrPermission`, `hrPrincipalAllows`. |
| `app/utils/backoffice/hr.navigation.ts` | Grup menu "HR" dengan struktur menu admin HR BO. |
| `app/utils/backoffice/hr.guards.ts` + `app/middleware/backoffice-hr-access.ts` | Guard halaman HR. |
| `app/types/backoffice/page-meta.d.ts` | Meta halaman `hrPermission`. |

Config: `NUXT_PUBLIC_HR_API_BASE_URL` (runtime config `public.hrApiBaseUrl`, termasuk `/api/v1`). Kosong berarti semua menu HR disembunyikan. Di HR-SYSTEM-API, `X-Company-ID` ditambahkan ke `Access-Control-Allow-Headers` (`internal/shared/middleware/cors.go`).

## Pemetaan envelope

| HR-SYSTEM-API | Backoffice Jewelry |
|---|---|
| `{success: true, data, pagination: {page, per_page, total_items, total_pages}}` | `{status: 'success', data, meta: {current_page, per_page, total, total_pages}}` (tanpa pagination → `meta: null`) |
| `{success: false, error: {code, message, details: [{field, issue}]}}` | `{status: 'error', error_code: code, errors: {field: issue}}` (issue pertama per field); tanpa details → `errors: message` |
| Blob / teks CSV | Diteruskan apa adanya |

Kode error HR (mis. `VALIDATION_ERROR`, `EMPLOYEE_NOT_FOUND`) masuk ke `AppError.code`. Pesan 4xx yang aman tampil sebagai `safeMessage`, sama seperti error Jewelry.

## Permission HR

- Sumbernya HR `GET /auth/me`, bukan Jewelry `/auth/authorization?app=hr`. Grant di sana sudah dipersempit ke branch aktif dan superadmin sudah ditandai, jadi menu selalu sama dengan yang ditegakkan HR-API.
- `canHr(key | key[] | null)`: kunci persis, OR untuk daftar, superadmin = semua (sama dengan `usePermissions().can` HR BO). `null` berarti cukup punya akses HR. Tanpa principal → selalu `false`.
- `ensure()` memuat ulang bila konteks berubah. Kunci konteks = `user | company | branch | acting tenant`. Request paralel untuk konteks yang sama digabung.
- `BoSidebar.vue` memanggil `ensure()` saat user, company, branch, atau acting tenant berubah.
- Status `unavailable` bila: `hrApiBaseUrl` kosong, session tanpa `company_id` (HR mewajibkan klaim `cid`), atau `/auth/me` gagal (`error` disimpan).

## Navigasi

- `NavItem.hrPermission` (opsional). Bila diisi (termasuk `null`), item juga wajib lolos `canHr`. Item HR tetap memakai `permission: null` untuk cek Jewelry.
- `visibleNavigation(can, canHr)` = grup Jewelry lalu `hrNavigation`, difilter oleh `filterNavigation`. Parent tanpa child disembunyikan, sehingga parent tanpa halaman tersalin tidak tampil. Halaman yang sudah disalin: Employees → Employees Info (`/backoffice/hr/employees`).
- Grup diberi label **"HR"**. Parent grup HR mengikuti HR BO: HR Setting, Employees, Leave, Attendance, Payroll, Company Settings. Ikon sementara memakai ikon yang sudah ada di `app/assets/icons` (`iconsax-bulk:setting`, `phosphor:address-book`, `iconsax-bulk:calendar-2`, `phosphor:clock`, `iconsax-bulk:document`, `iconsax-bulk:category`).
- Label: `shell.nav.hr.*` (en/id/ko).

## Tanpa company aktif: menu tetap tampil, popup wajib pilih company

Pola ini sama dengan POS yang meminta branch.
- `useHrAccess().needsCompany` bernilai true bila HR dikonfigurasi, user punya ≥1 company, tetapi token belum punya company aktif.
- **Menu:** sidebar memakai `canSeeHr`, yaitu `needsCompany || canHr(key)`. Akibatnya grup HR tetap tampil. Setelah company dipilih, item yang tidak diizinkan HR akan hilang.
- **Guard:** `backoffice-hr-access` meloloskan navigasi bila `needsCompany`.
- **Popup:** setiap page HR membungkus view-nya dengan `app/components/backoffice/hr/shared/BoHrPageGate.vue`, yang menampilkan:
  - Dialog persistent "Pilih company untuk HR" (company wajib, branch opsional). Konfirmasi memanggil `switchContext` tanpa pindah halaman, lalu `ensure()` ulang.
  - Konten halaman hanya bila `canHr(route.meta.hrPermission)`. Konten di-key per company/branch sehingga ter-mount ulang saat context berganti.
  - Kartu "Tidak punya akses" bila permission HR tidak ada, atau error state bila HR-API gagal.
- **i18n:** `shell.hrAccess.*`.

## Guard halaman HR

```ts
definePageMeta({
  layout: 'backoffice',
  middleware: ['backoffice-auth', 'backoffice-hr-access'],
  permission: null,
  hrPermission: 'employees:read',
})
```

- HR tidak tersedia karena error server/network → error page dengan status error itu (default 503).
- HR tidak tersedia karena alasan lain (tanpa company / tidak dikonfigurasi), atau `canHr(meta.hrPermission)` gagal → 403.

## Refresh token

Refresh token Jewelry berotasi. Bila client backoffice dan client HR sama-sama menerima 401 lalu me-refresh dengan refresh token yang sama, permintaan kedua terlihat sebagai *reuse* dan bisa mencabut sesi. Karena itu `refreshAccessToken` (`useApi.ts`) single-flight per `NuxtApp` dan dipakai kedua client.

401 dari HR (setelah refresh gagal) **tidak** mengakhiri sesi Jewelry. Client HR tidak memasang `onSessionExpired`, sehingga salah konfigurasi HR (mis. `aud`) tidak menendang user keluar dari BO Jewelry.

## Pemilih company/branch

HR mewajibkan company aktif (klaim `cid`). Jewelry hanya memilih company otomatis bila user punya akses ke tepat satu company. Owner, superadmin, atau user multi-company login tanpa `cid`, sehingga HR menjawab 403 `CONTEXT_REQUIRED` dan menu HR tersembunyi.

`app/components/backoffice/shell/BoContextSwitcher.vue` mengatasi ini:
- **Tampilan** (meniru `WorkspaceContext` + `UserMenu` HR BO): chip berisi ikon, nama company, dan cabang aktif. Klik chip membuka menu bersegmen **Company** dan **Cabang** ("Semua cabang" + daftar cabang), dengan tanda centang di pilihan aktif. Bila belum ada company, chip berbingkai warning bertuliskan "Wajib untuk HR".
- **Letak:** di topbar untuk `md` ke atas, dan di menu akun untuk layar kecil. Daftar diambil dari `session.companies`.
- **Cara kerja:** memanggil `useSession().switchContext` (Jewelry `POST /auth/switch-context`), lalu kembali ke dashboard. Sidebar kemudian memuat ulang permission HR.
- **Batasan:** kembali ke level tenant tidak bisa, karena `company_id` wajib di `switch-context`.
- **i18n:** `shell.context.*`.

## Menu yang mengarah ke HR BO (tidak disalin)

Halaman yang sengaja tidak disalin bisa ditaruh di menu sebagai link SSO ke HR BO. Contohnya **HR Settings**:
- **Item navigasi:** `NavItem.external = { app: 'hr', path: '/tenants/…' }`. `BoSidebar` merender item ini dengan ikon panah keluar dan membuka tab baru lewat `useHrHandoff().openInNewTab(path)`.
- **Mekanisme:** handoff Jewelry (`POST /auth/handoff`), lalu `redirect_url#code=…&next=<path>`. HR BO `auth/callback.vue` mengarahkan ke `next` bila itu path internal yang aman.
- **Halaman cadangan:** `to` item tetap berupa route BO Jewelry (`/backoffice/hr/settings`) yang mengalihkan di tab yang sama (`redirectHere`), untuk URL langsung atau bookmark.
