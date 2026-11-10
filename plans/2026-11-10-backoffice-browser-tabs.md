<!-- 📁 plans/2026-11-10-backoffice-browser-tabs.md -->
# Rencana: Layer Tab Mirip Browser di Backoffice

| | |
|---|---|
| **Status** | **Rencana — belum dikerjakan.** |
| **Tanggal** | 2026-11-10 |
| **Pemicu** | Admin ingin membuka beberapa halaman sekaligus dalam satu sesi backoffice, masing-masing dengan konteks data sendiri (mis. dua tab Leave Request dengan filter berbeda), tanpa login ulang dan tanpa keluar dari satu sesi auth/authz. Perilaku tab meniru tab browser: buka, switch, tutup, dan state halaman tetap hidup saat berpindah tab. |
| **Keputusan user** | (1) Strip tab diletakkan **di bawah AppNavbar** (di atas body halaman) — lihat pertanyaan awal. (2) State halaman **disimpan penuh** lewat KeepAlive, termasuk filter dan fetch yang sedang berjalan. (3) Tab boleh **duplikat untuk menu yang sama** asalkan filter state-nya berbeda. (4) Tab **dibuat hanya saat "open new tab"**; navigasi biasa memindahkan tab aktif. (5) **Tanpa pinned home tab.** (6) Ikon & label tab diambil dari **sidebar**. (7) Ganti cabang **me-reset semua tab**. (8) Daftar tab **bertahan saat reload** (sessionStorage) untuk semua portal (`/platform`, `/tenants`, `/ess`). |
| **Modul terdampak** | Hanya HR-SYSTEM-BACKOFFICE (layout, navbar, routing). Tidak ada perubahan API/backend dan tidak ada perubahan kontrak auth/authz. |
| **Repo terkait** | HR-SYSTEM-BACKOFFICE (utama), HR-SYSTEM-DOCS |
| **Mengubah keputusan** | Tidak mengubah dokumen modul mana pun. Dokumen ini menambah lapisan UI/routing di atas arsitektur navigasi yang sudah ada (lihat `CLAUDE.md` backoffice: "sidebar hanya, tanpa top nav duplikat"). |

---

## 1. Ringkasan

### 1.1 Kondisi saat ini

| Area | Kondisi | Lokasi |
|---|---|---|
| Layout | `default.vue` merender `UDashboardSidebar` (satu-satunya sumber navigasi) + kolom konten `flex`. Tidak ada top navbar global; `AppNavbar` dirender **per halaman**. | `app/layouts/default.vue:475-603` |
| Navbar | `AppNavbar` = `UDashboardNavbar` berisi breadcrumb (`useBreadcrumbs`) di kiri dan `UserMenu` di kanan. Dipakai oleh semua wrapper modul dan banyak halaman leaf. | `app/components/AppNavbar.vue` |
| Routing | Satu `NuxtPage` global di `app.vue`; wrapper modul (mis. `tenants/leave.vue`) merender `<UDashboardPanel>` dengan `#header` (`AppNavbar`) dan `#body` (inner `<NuxtPage>`). | `app/app.vue:36-38`, `app/pages/tenants/leave.vue:43-70` |
| Page key | Wrapper memakai `:page-key="route => route.path"` atau `route.fullPath` secara tidak konsisten. | 18 wrapper di `app/pages/**/*.vue` |
| Filter list | `useListFilters` menyimpan nilai filter ke query URL dan membaca ulang dari URL saat mount/back-forward. Query key yang tidak dikenal **dipertahankan** saat menulis filter. | `app/composables/useListFilters.ts` |
| Auth | Satu session (cookie `access_token`/`refresh_token` + Pinia `useUserStore`). `auth.global.ts` menegakkan tier persona dan `meta.permissions` di setiap navigasi. | `app/middleware/auth.global.ts`, `app/stores/user.ts` |
| KeepAlive Nuxt 4 | `NuxtPage` mendukung prop `keepalive` dan `pageKey`; `RouteProvider` memberi snapshot route per instance sehingga `useRoute()` di halaman ter-cache tetap stabil saat tab lain aktif. | `node_modules/nuxt/dist/pages/runtime/page.js`, `route-provider.js` |
| Data async | Sebagian besar key `useAsyncData` sudah ber-identitas (mis. `leave-requests-${JSON.stringify(query)}`), tetapi beberapa halaman detail memakai key statis. | lihat §10 |

### 1.2 Target

- Strip tab setinggi satu baris, muncul **tepat di bawah AppNavbar** dan di atas body halaman, di semua halaman dashboard (`/platform`, `/tenants`, `/ess`), tidak muncul di `/auth` dan `/landing`.
- Beberapa tab dapat terbuka bersamaan. Tab aktif dirender; tab lain tetap hidup di belakang (KeepAlive) dengan state, filter, scroll, dan fetch-nya masing-masing.
- Dua tab dari menu yang sama boleh memiliki filter berbeda dan **data yang benar-benar terpisah** (termasuk saat salah satu masih melakukan fetch).
- Auth/authz tetap satu pintu: setiap perpindahan tab menjalankan middleware yang sama; tidak ada token/session tambahan per tab.
- Daftar tab bertahan saat reload (sessionStorage); ganti cabang me-reset seluruh tab.

## 2. Keputusan desain

| # | Keputusan | Alasan |
|---|---|---|
| D1 | Identitas tab = **`_tab` (ID internal) di query URL**, bukan `fullPath`/`path`. | Dua tab menu sama dengan filter berbeda harus punya instance terpisah. `fullPath` akan berubah saat filter berubah sehingga sulit dipakai sebagai kunci cache yang stabil. |
| D2 | KeepAlive di **level top (`app.vue`)** dengan `page-key` berbasis `_tab`, ditambah `keepalive` di **inner `NuxtPage` wrapper** (key = `route.path`). | Level top mengisolasi satu tab penuh (wrapper + isinya); level inner menjaga state antar-child di dalam satu tab tanpa remount saat query filter berubah. |
| D3 | Navigasi biasa **memperbarui tab aktif**; tab baru hanya dari aksi eksplisit (middle/ctrl-click, tombol `+`, context menu). | Sesuai jawaban user "saat open new tab"; mencegah tab meledak setiap klik menu/filter. |
| D4 | URL tab membawa `?_tab=<id>` hanya ketika multi-tab; tab pertama memakai ID turunan `hash(path)` agar injeksi `_tab` pertama tidak memicu remount. | Menjaga URL tetap bersih saat satu tab, tanpa mengorbankan isolasi saat multi-tab. |
| D5 | Label & ikon tab di-resolve dari definisi link sidebar (`topLinks`/`bottomLinks`) via **longest-prefix match**. | Jawaban user: ikon dari sidebar; menghindari duplikasi daftar menu. |
| D6 | `sessionStorage` (bukan `localStorage`). | Semantik tab browser: bertahan saat reload, hilang saat browser ditutup; tidak bocor antar-tab browser. |
| D7 | Reset semua tab saat `currentBranchId` berubah, diikuti reload halaman. | Menjamin data per cabang segar; reload juga membersihkan cache KeepAlive yang tidak bisa dibersihkan manual. |

## 3. Arsitektur

### 3.1 Identitas tab dan `_tab`

Tipe data:

```ts
// app/stores/tabs.ts
export interface AppTab {
  id: string          // ID internal, unik per tab
  fullPath: string    // URL terakhir tab, termasuk query (dan `_tab`)
  path: string        // path tanpa query
  label: string       // dari sidebar
  icon?: string       // dari sidebar
  closable: boolean
}
```

- `id` dibuat saat tab baru dibuka (`crypto.randomUUID()` atau counter pendek).
- Setiap URL milik tab membawa `?_tab=<id>`.
- Contoh dua tab menu sama:

```
/tenants/leave/requests?status=pending&_tab=a1b2
/tenants/leave/requests?status=approved&_tab=c3d4
```

- `useListFilters` sudah mempertahankan query key asing, jadi `_tab` tidak hilang saat Apply/Preset/Reset filter (`useListFilters.ts` fungsi `toUrl`).

### 3.2 Sinkronisasi router

**`app/plugins/app-tabs.client.ts`**

```ts
router.beforeEach((to) => {
  if (!isDashboardRoute(to)) return
  if (to.query._tab) return                 // sudah punya ID tab
  const id = tabs.activeId
  if (!id) return                           // tab pertama diurus setelah sync
  return { ...to, query: { ...to.query, _tab: id } }
})

router.afterEach((to, from) => {
  if (!isDashboardRoute(to)) return
  tabs.syncFromRoute(to, from)
})
```

Aturan `syncFromRoute`:

1. Jika `to.query._tab` ada dan cocok dengan tab yang dikenal → jadikan tab itu aktif, update `fullPath`/`path`.
2. Jika tidak ada tab (initial load) → buat tab pertama dengan `id = hash(to.path)` lalu `router.replace` menambahkan `_tab` (key KeepAlive tidak berubah karena sama-sama `hash(path)`).
3. Jika tidak ada `_tab` tetapi ada tab aktif → perbarui `fullPath`/`path` tab aktif (navigasi biasa dalam tab).
4. Jika `_tab` tidak dikenal (mis. URL lama dari storage) → buat tab baru dengan ID tersebut atau ganti ke ID baru; buang bila route tidak valid/unauthorized.

Aksi tab:

- `openInNewTab(fullPath)`: buat tab baru (background) dengan `id` baru; tidak mengubah route aktif sampai user mengkliknya.
- `activate(id)`: `router.push(tabFullPath(tab))`.
- `close(id)`: hapus tab; jika tab aktif ditutup, aktifkan tetangga terdekat lalu `router.push`.
- `closeOthers`, `closeAll` (lalu buat satu tab baru untuk halaman home aktif).
- Bila tab yang tersisa hanya satu, `_tab` boleh tetap ada di URL; tidak perlu distrip.

### 3.3 KeepAlive dua lapis

**Level top — `app/app.vue`**

```vue
<NuxtPage
  :keepalive="{ max: 50 }"
  :page-key="route => `${route.query._tab || hash(route.path)}:${route.matched[0]?.path || ''}`"
/>
```

- Satu instance penuh per (tab, modul top-level). Pindah tab = deactivate instance lama, activate instance target.
- Navigasi di dalam tab yang sama mempertahankan `_tab` (lihat §3.2), jadi key tidak berubah dan state tidak hilang.
- Ganti modul di dalam tab yang sama mengganti segmen modul pada key sehingga konten tab berganti (perilaku tab browser). Instance lama bisa tersisa di cache sampai terviksi `max`.

**Level wrapper — inner `NuxtPage`**

```vue
<NuxtPage keepalive :page-key="route => route.path" />
```

- Anak-anak modul (mis. `leave/requests` ↔ `leave/balances`) di-cache per path.
- Query filter tidak mengubah `route.path`, sehingga Apply filter **tidak** remount halaman — `useListFilters` menangani perubahan lewat `watch(route.query)`.

**Mengapa dua lapis?**

- Level top yang di-key `_tab` mengisolasi dua tab menu sama; level inner mengisolasi child page di dalam satu tab. Keduanya diperlukan agar "dua menu sama, filter beda" dan "pindah child lalu balik" sama-sama mempertahankan state.

### 3.4 Isolasi data per tab

- Halaman yang ter-cache tidak di-unmount, jadi fetch yang sedang berjalan tetap berlanjut dan hasilnya masuk ke instance tab tersebut.
- `RouteProvider` Nuxt memberi snapshot route per instance, sehingga `useRoute()` di tab non-aktif tidak berubah saat tab lain aktif.
- **Syarat keras:** key `useAsyncData` tidak boleh statis untuk data yang bergantung pada record/query. Bila dua tab memakai key statis yang sama, data akan saling menimpa. Audit ada di §10.

## 4. Siklus hidup tab

| Aksi | Perilaku |
|---|---|
| Load pertama | Buat satu tab untuk route awal (`id = hash(path)`), tambahkan `_tab`. |
| Klik menu sidebar / link biasa | Perbarui tab aktif (path, label, ikon); tidak membuat tab baru. |
| Middle-click / Ctrl/Cmd-click link sidebar | Buat tab baru (background) dengan `id` baru; klik tab untuk aktivasi. |
| Tombol `+` di tab bar | Buat tab baru untuk portal home (`/platform`, `/tenants`, atau `/ess`). |
| Klik tab | Aktifkan tab; `router.push` ke `fullPath` tab. Middleware auth tetap berjalan. |
| Ubah filter di tab aktif | Query berubah, `_tab` tetap; halaman **tidak** remount; data difetch ulang oleh composable filter. |
| Tutup tab | Hapus dari store; jika aktif, pindah ke tab kiri/kanan. |
| Tutup tab terakhir | Buat ulang satu tab untuk halaman home portal saat ini. |
| Reload | Daftar tab dipulihkan dari `sessionStorage`; tab aktif dimuat ulang dari URL. |
| Ganti cabang | Semua tab dihapus lalu halaman di-reload. |
| Logout / session mati | Semua tab dihapus. |

## 5. UI `AppTabsBar.vue`

- Diletakkan di `AppNavbar.vue`, tepat setelah `</UDashboardNavbar>` (di dalam `#header` panel).
- Struktur: `role="tablist"`, tiap tab `role="tab"` + `aria-selected`.
- Elemen tab: ikon, label, tombol close (`aria-label="Close tab"`), indikator aktif.
- Interaksi: klik = switch; middle-click = close; context menu = Close / Close Others / Close All / Reload; tombol `+`.
- Overflow: scroll horizontal (wheel + tombol kiri/kanan) dan keyboard `←`/`→`.
- Mobile: label bisa dipotong; strip tetap satu baris.
- Escape hatch: `definePageMeta({ tabs: false })` untuk halaman yang tidak ingin menampilkan strip (print/embed).
- Tanpa pinned home tab.

## 6. Label & ikon dari sidebar

- `default.vue` sudah menghitung `topLinks` dan `bottomLinks` (berisi `label`, `icon`, dan `to`; children bersarang).
- Tambahkan watcher yang mem-flatten kedua daftar menjadi peta `path → { label, icon }` lalu `tabs.setNavMap(map)`.
- Saat membuat/memperbarui tab, resolve via **longest-prefix match** supaya detail seperti `/tenants/employee/123` memakai item `/tenants/employee`.
- Fallback berurutan: `route.meta.title` → `useBreadcrumbLabel` override (bila ada) → `titleCase(segment terakhir)`.
- Ikon detail (mis. nama karyawan) tidak wajib; label menu utama sudah cukup. Opsional: tooltip berisi ringkasan filter agar dua tab menu sama mudah dibedakan.

## 7. Auth & authz

- Tidak ada perubahan backend. Semua tab memakai satu cookie session dan satu Pinia `useUserStore`.
- Setiap switch tab memakai `router.push`, sehingga `auth.global.ts` menegakkan tier persona (`/platform`, `/tenants`, `/ess`) dan `meta.permissions` di setiap aktivasi.
- Saat restore dari `sessionStorage`, `pruneUnauthorized()` membuang tab yang:
  - tier-nya tidak cocok dengan `personaTier`, atau
  - `router.resolve(fullPath).meta.permissions` gagal `usePermissions().can()`.
- Tab baru hanya bisa dibuka dari link yang memang terlihat di sidebar (sudah difilter permission/entitlement), lalu tetap divalidasi middleware saat diaktifkan.

## 8. Persistensi

- Simpan `{ tabs, activeId }` ke `sessionStorage` (key mis. `app-tabs:v1`).
- Simpan `id`, `fullPath`, `path`, `label`, `icon`; label/ikon boleh di-resolve ulang dari nav map saat load.
- Saat load: validasi `fullPath` dengan `router.resolve`, buang yang tidak valid/unauthorized, lalu sinkronkan tab aktif dengan `_tab` di URL.
- Tab background tidak difetch sampai diaktifkan; tab aktif refetch seperti reload biasa.

## 9. Reset saat ganti cabang

- Watcher `userStore.currentBranchId`:
  1. `tabs.clear()`
  2. hapus `sessionStorage` key tab
  3. `window.location.reload()` (atau `router.replace` tanpa `_tab` lalu reload) untuk memastikan cache KeepAlive dan data benar-benar segar.
- Reload dipilih karena KeepAlive tidak menyediakan API publik untuk membersihkan cache; ini juga menjamin `useAsyncData` ter-rekey dari nol.

## 10. File yang dibuat / diubah

**Baru**

| File | Isi |
|---|---|
| `app/stores/tabs.ts` | State tab, `AppTab`, CRUD, `syncFromRoute`, `openInNewTab`, `activate`, `close*`, `setNavMap`, persistensi, `clear`. |
| `app/composables/useAppTabs.ts` | Jembatan router↔store, resolve label/ikon, `pruneUnauthorized`, `isDashboardRoute`, `hash`. |
| `app/components/AppTabsBar.vue` | UI strip tab, context menu, keyboard, overflow. |
| `app/plugins/app-tabs.client.ts` | `beforeEach` injeksi `_tab`, `afterEach` sinkronisasi, restore `sessionStorage` saat init. |

**Diubah**

| File | Perubahan |
|---|---|
| `app/app.vue` | `<NuxtPage :keepalive="{ max: 50 }" :page-key="...">`. |
| `app/components/AppNavbar.vue` | Render `<AppTabsBar v-if="showTabs" />` di bawah baris navbar. |
| `app/layouts/default.vue` | Bangun nav map untuk label/ikon; intercept `auxclick` (middle) dan click+ctrl/meta untuk open-in-new-tab; watcher `currentBranchId`. |
| 18 wrapper modul (`app/pages/tenants/*.vue`, `app/pages/platform/*.vue`, `app/pages/ess.vue`, `ess-account.vue`) | Inner `<NuxtPage keepalive :page-key="route => route.path" />`; samakan key (sebelumnya campuran `path`/`fullPath`). |
| `app/pages/tenants/employee/[id].vue` | Key async ber-identitas untuk 4 fetch: detail, reporting line, akun user, permission akun. |

**Audit key async (status per 2026-11-10)**

| Halaman | Status |
|---|---|
| `tenants/employee/[id].vue` — `core-hr-employee-detail`, `core-hr-employee-reporting-line`, `core-hr-employee-account`, `core-hr-employee-account-permissions` | **Perlu diperbaiki**: key statis, id bervariasi. Ubah ke getter `() => \`...-${employeeId.value}\`` dengan `watch: [employeeId]`. `access-users` boleh tetap statis (data referensi). |
| `tenants/attendance/rotation-simulations/[id].vue` | Aman — key sudah `attendance-schedule-simulation-${simulationId}`. |
| `tenants/hr-setting/working-time/[id].vue` | Aman — key sudah `attendance-shift-${id}`. |
| `tenants/employee/mutasi/[id].vue` | Aman — `getMutationBatch` memakai key `core-hr-mutation-request-batch-${id}`. |
| `tenants/performance/reviews/[id].vue`, `goals/[id].vue` | Aman — `useFetch` dengan URL berisi id (auto-key). |
| `platform/tenants/[id].vue` | Aman — state dari composable yang di-key per tenant. |
| Key referensi bersama (`platform-users`, `access-roles`, `tenant-branches`, `core-hr-branches`, `platform-plans`, dll.) | Boleh tetap statis: datanya sama lintas tab. |

## 11. Fase implementasi

| Fase | Isi | Output |
|---|---|---|
| 0 | **Spike** 1 wrapper + 1 halaman detail: validasi `_tab`-keyed KeepAlive, nested `NuxtPage`, `RouteProvider`, `pageTransition mode: out-in`. | Keputusan final soal interaksi key/type-change di KeepAlive. |
| 1 | Store + `useAppTabs` + plugin (`_tab` inject/afterEach) + persistensi + prune authz. | Tab bisa dibuat/diaktifkan lewat devtools; reload memulihkan. |
| 2 | `AppTabsBar` + integrasi `AppNavbar` + nav map ikon/label. | Strip tab tampil dan bisa dipakai. |
| 3 | Open-in-new-tab (middle/ctrl/`+`), inner wrapper `keepalive`, audit & perbaikan key async. | Dua tab menu sama dengan filter berbeda terisolasi penuh. |
| 4 | Branch reset, logout, tab terakhir, unauthorized prune, keyboard/overflow/mobile. | Edge case selesai. |
| 5 | Verifikasi: `bun run lint`, `bun run typecheck`, uji manual skenario §13. | Siap review. |

## 12. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Cache KeepAlive bocor antar tab karena key async statis | Audit §10; key detail ber-identitas; verifikasi dengan dua tab detail berbeda. |
| KeepAlive dengan key sama tetapi tipe komponen berbeda (ganti modul dalam satu tab) | Key top-level menyertakan `route.matched[0]?.path`; validasi di spike. |
| Filter berubah memicu remount | Dihindari: key inner = `route.path` (bukan query), top-level = `_tab`. |
| `_tab` hilang saat navigasi manual | `beforeEach` menyuntikkan ulang; `useListFilters` mempertahankan query asing. |
| URL tercemar `_tab` | Hanya saat multi-tab; nilai pendek; tidak memengaruhi breadcrumb/middleware. |
| Memori membengkak | `keepalive.max = 50`, tab closable, reset saat ganti cabang. |
| `UDashboardPanel` header pecah karena baris tambahan | Bar dibungkus fragment/`div`; uji di beberapa modul; gunakan slot header yang ada. |
| Middle-click bentrok dengan perilaku browser | Tangani `auxclick`, `preventDefault`, `stopPropagation` hanya untuk link sidebar. |
| Unsaved form hilang saat tab ditutup | Di luar cakupan v1; opsi guard `useUnsavedChanges` per halaman nanti. |
| Logout menyisakan cache admin | KeepAlive berada di dalam `NuxtLayout`; pindah ke layout `auth` meng-unmount cache. Ditambah `tabs.clear()`. |

## 13. Skenario uji / definition of done

1. Buka dua tab Leave Request dengan status berbeda → filter, data, dan scroll masing-masing tetap.
2. Trigger fetch di tab A, pindah ke tab B sebelum selesai → hasil fetch masuk ke tab A, bukan B.
3. Reload saat multi-tab → daftar tab pulih, tab aktif memuat data benar.
4. Ganti cabang → semua tab hilang, satu tab baru untuk halaman saat ini dengan data cabang baru.
5. Middle/Ctrl-click sidebar → tab baru muncul; klik biasa → tab aktif berganti konten tanpa menambah tab.
6. Filter Apply/Preset/Reset di tab aktif → halaman tidak remount, `_tab` tetap.
7. Buka dua detail karyawan berbeda → data tidak tertukar.
8. Permission dicabut / tier berubah → tab terkait hilang saat restore/aktivasi.
9. Close / Close Others / Close All / tab terakhir.
10. Keyboard `←`/`→` dan overflow pada viewport sempit.
11. `bun run lint` dan `bun run typecheck` bersih.

## 14. Keterbatasan & keputusan tertunda

- **Back/Forward browser bersifat global**, bukan per tab, karena hanya ada satu Vue Router. Per-tab history membutuhkan stack manual dan intervensi `popstate`; **disarankan ditunda** kecuali diminta.
- **Ganti modul di dalam tab yang sama** mengganti konten tab tersebut; state modul lama bisa tetap di cache sampai terviksi `max`.
- **Duplikat URL identik** (path + query sama persis) tidak dibuat sebagai dua instance terpisah; klik URL yang sama akan mengaktifkan tab yang sudah ada. Duplikat yang didukung adalah dua tab dengan query/filter berbeda.
- **Unsaved form guard** saat menutup tab belum termasuk v1.
- Reload setelah ganti cabang membuat tab aktif kehilangan state transient; ini disengaja demi konsistensi data.

## 15. Referensi kode

- `app/layouts/default.vue` — struktur sidebar + konten, `topLinks`/`bottomLinks`.
- `app/components/AppNavbar.vue` — titik integrasi strip tab.
- `app/app.vue` — `NuxtPage` global untuk KeepAlive.
- `app/composables/useListFilters.ts` — sinkronisasi filter ke URL dan preservasi query asing.
- `app/middleware/auth.global.ts` — auth/authz per navigasi.
- `app/stores/user.ts` — `isAuthenticated`, `personaTier`, `currentBranchId`.
- `node_modules/nuxt/dist/pages/runtime/page.js` — dukungan `keepalive`/`pageKey` pada `NuxtPage`.
- `node_modules/nuxt/dist/app/components/route-provider.js` — snapshot route per instance (isolasi `useRoute()` pada halaman ter-cache).