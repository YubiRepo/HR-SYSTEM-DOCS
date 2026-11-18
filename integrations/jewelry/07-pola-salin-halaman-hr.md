<!-- 📁 integrations/jewelry/07-pola-salin-halaman-hr.md -->
# Pola Salin Halaman HR BO → BO Jewelry

Panduan untuk agent atau developer yang menyalin halaman admin HR BO (`HR-SYSTEM-BACKOFFICE`, Nuxt UI) ke backoffice Jewelry (`jewelry-fe`, Vuetify). **Baca ini sebelum menyalin halaman berikutnya.**

Konteks arsitektur (client HR, permission HR, guard, menu): [`06-menu-hr-di-bo-jewelry.md`](./06-menu-hr-di-bo-jewelry.md). Rencana dan daftar halaman: Bagian G di [plan](../../plans/2026-11-16-integrasi-jewelry-identity-rbac.md) (tabel G.2).

Contoh lengkap pertama: **Employees Info** (list, create, detail Profile, archive). Saat ragu, tiru file-file itu (lihat bagian "Referensi").

---

## 1. Alur kerja per halaman

1. **Baca sumber HR BO.** Baca page, composable, dan komponen yang dipakai. Halaman HR BO besar dan bergantung pada banyak lookup, jadi delegasikan pengumpulan kontrak API ke satu agent read-only. Minta keluaran per endpoint: method + path, query, body, field respons, permission (dicek ke router Go di `HR-SYSTEM-API`).
2. **Sepakati cakupan dengan user.** Halaman detail HR BO biasanya punya banyak tab dan aksi. Pecah menjadi "CRUD inti" dulu, lalu tab/aksi lain di fase berikutnya.
3. **Tipe** → `app/types/backoffice/hr-<fitur>.type.ts`. DTO tetap **snake_case**, persis seperti JSON HR-API. Jangan menyalin konversi camelCase HR BO.
4. **Composable data** → `app/composables/backoffice/useHr<Fitur>.ts`.
   - Pakai `useHrApi()`. Path tanpa `/api/v1`.
   - Pakai `useLatestRequest`. State list/detail disimpan di store.
   - Lookup bersama ada di `useHrLookups`; picker berhalaman memakai `useHrPagedOptions`.
5. **Store** → `app/stores/backoffice/hr-<fitur>.store.ts`. Isinya list, meta, params `ListQuery`, detail, dan `reset`.
6. **Util** → `app/utils/backoffice/hr-<fitur>.catalog.ts` dan `hr-<fitur>.form.ts`.
   - Catalog berisi path, label status/tone, opsi filter/sort, dan `LIST_CONFIG`.
   - Form berisi model form, payload, dan validasi.
   - Tambahkan test `*.test.ts`.
7. **Komponen** → `app/components/backoffice/hr/<fitur>/`, ditambah `hr/shared/` untuk komponen lintas fitur. Satu seksi form = satu komponen, karena batas 500 baris per file.
8. **Page** → `app/pages/backoffice/hr/<fitur>/...`. Isinya hanya `definePageMeta` + `useHead` + satu komponen view yang **dibungkus `<BoHrPageGate>`**. Gate ini yang menampilkan popup pilih company, kartu tanpa akses, dan error HR. Jangan menaruh pengecekan akses HR di view.
9. **Menu** → tambah child di `app/utils/backoffice/hr.navigation.ts`. Isi `permission: null` dan `hrPermission`. Update test `shell.navigation.test.ts`.
10. **i18n** → semua teks lewat `t()`, di en/id/ko (lihat §3).
11. **Cek** (§5) lalu isi tabel G.2 + catatan fase di plan.

## 2. Pemetaan komponen HR BO → BO Jewelry

| HR BO (Nuxt UI) | BO Jewelry (Vuetify) | Catatan |
|---|---|---|
| `AppListPage` | `BoRecordListLayout variant="compact"` + `BoListToolbar` + tabel `BoDataTable` | `compact` = tanpa stat cards (HR BO juga tanpa stat cards). Slot `#detail` dikosongkan bila detail adalah halaman sendiri. |
| `useListFilters` / `usePageState` (query string) | `useListRoute(params, LIST_CONFIG, fetch)` | Filter, sort, search, dan page disimpan di URL. Petakan ke query HR lewat fungsi seperti `hrEmployeeListParams`. |
| Kolom `TableColumn` + `h()` render | `TableColumn[]` + slot `#cell-<key>` | Nama dengan link: `BoMediaCell @open`. |
| Row double-click → halaman detail | `BoMediaCell @open` → `navigateTo(path)` | |
| `UBadge` status | `BoStatusChip :tone` | Tone yang tersedia: `active`, `draft`, `inactive`, `warning`. |
| `CoreHrFormSection` | `BoFormSection :title :icon` | Deskripsi seksi ditulis sebagai `<p class="pt-2.5 text-body text-ink-2">`. |
| `UFormField` + `UInput` | `VTextField v-bind="field('nama_field')"` | `field()` dari `useStoreForm` memasang pesan error dan menghapus error saat field diubah. |
| `USelect` / `USelectMenu` | `VSelect item-title="label" item-value="value"` | Opsi dibuat dengan `lazyOptions` di catalog. |
| `UInputNumber` | `VTextField type="number"` | Simpan sebagai `number \| null`, dikonversi di computed setter. |
| `UInput type="date"` | `BoDateField size="lg" :error="errors.x"` | Error dikirim lewat prop `error`, bukan `field()`. |
| `USwitch` / `UCheckbox` | `VSwitch` / `VCheckbox` | |
| `UTextarea autoresize` | `VTextarea rows="2" auto-grow` | |
| `UAccordion` | `VExpansionPanels multiple variant="accordion"` | |
| `UModal` | `BoDialog` (slot default + `#footer`) atau `BoConfirmDialog` | |
| `PagedSelect` + `usePagedOptions` | `BoHrPagedSelect` + `useHrPagedOptions` | Search server-side dengan debounce 300 ms; tombol "Load more" di `#append-item`. Opsi terpilih dijaga lewat cache `known`. |
| `CommonCodeSelect` | `BoHrCommonCodeSelect` | Nilai yang disimpan adalah `code`. Kode nonaktif ditampilkan dengan `fallbackLabel`. |
| `AppPermissionGate` / `usePermissions().can` | `useHrAccess().canHr('key')` | |
| `definePageMeta({ permissions })` | `middleware: ['backoffice-auth', 'backoffice-hr-access']`, `permission: null`, `hrPermission` | |
| `useAsyncData` di page | composable + store + `useLatestRequest` | |
| `useToast().add` | `useToastStore()` + `userMessage(error)` | Toast sukses form ditangani `useFormPage`. |
| Form save manual | `useStoreForm` + `useFormPage` | Validasi menghasilkan `FormErrors` dengan kunci = nama field (snake_case). Error server dipetakan lewat `serverFieldErrors(toAppError(e), FIELD_ORDER, ALIASES)`. |
| Ikon `i-lucide-*` | Hanya ikon di `app/assets/icons/manifest.json` | Build gagal untuk ikon yang tidak terdaftar. |

## 3. Pelajaran dan aturan `jewelry-fe` yang mudah terlewat

- **Tanpa komentar kode** (`check:comments`). Penjelasan desain ditulis di dokumen ini atau di `06-…`, bukan di kode. Aturan ini juga berlaku untuk `.env*.example`.
- **Semua teks harus lewat i18n** (`check:i18n`), termasuk placeholder seperti `budi@company.com`.
- **Namespace i18n baru** harus didaftarkan di 3 tempat:
  1. `i18n/locales/{en,id,ko}/backoffice/<ns>.json` dengan kunci yang identik.
  2. Import tipe di `app/core/i18n/backoffice.ts` (`Catalog`).
  3. `BACKOFFICE_NAMESPACES` di `shared/i18n/locales.ts`.
- **Bahasa Korea wajib Hangul.** Brand, kode, dan contoh literal (mis. `HR`, `NPWP`, contoh email/alamat) dimasukkan ke `BACKOFFICE_UNTRANSLATED` di `shared/i18n/locales.test.ts`.
- **Label di level modul** tidak boleh menyalin teks saat modul dimuat:
  - Pakai `lazyMessages` / `lazyOptions` / getter `get label()`.
  - Konfigurasi yang menyimpan *kunci* i18n lalu diterjemahkan saat render (mis. `HR_RECORD_SECTIONS`) didaftarkan di `KEY_HOLDERS` pada `app/utils/backoffice/shared.lazy-labels.test.ts`.
- **Batas 500 baris per file** (`check:file-size`). Form HR BO yang panjang dipecah per seksi.
- **Lint:** pakai `toReversed()`/`toSorted()`, bukan `await` di dalam loop (gunakan rekursi berantai), dan fungsi helper yang tidak menangkap variabel ditaruh di scope modul.
- **Konvensi aksi destruktif:** HR BO mengarsipkan karyawan tanpa konfirmasi, sedangkan BO Jewelry selalu memakai `BoConfirmDialog tone="danger"`.
- **Simpan bertahap:** create karyawan diikuti PATCH riwayat dan POST kontrak memakai `Promise.allSettled` setelah karyawan dibuat. Kegagalan satu bagian tidak membatalkan yang lain.
- **Alur setelah simpan:** bila perlu menampilkan dialog (password sementara), pakai `useFormPage({ stayAfterSave: () => … })`, lalu `guard.release(listPath)` saat dialog ditutup.
- **Lookup tanpa permission:** endpoint lookup bisa ditolak untuk role tertentu (mis. `attendance:read` untuk pola jadwal). Lookup menangkap error dan mengembalikan list kosong agar halaman tetap jalan. Kontrak hanya dibuat bila `canHr('contracts:write')`.
- **Error test lama:** `print-device.form.test.ts` sudah gagal di branch `hr-system` sebelum pekerjaan HR. Jangan dianggap regresi.

## 4. Yang belum ada di BO Jewelry (salin saat dibutuhkan)

- Detail karyawan: tab Payroll, aksi transfer/promotion, ubah lifecycle status, offboarding, dan tombol menuju Career Mutation.
- Import History (`tenants/core-hr/data-operations.vue`).
- Inline create common code (HR BO: user dengan `settings:write` bisa menambah kode dari select).

## 4a. Pola tambahan dari detail karyawan

- **Upload file (presign):** `POST …/presign {content_type}` → `PUT` file ke `presign_url` dengan header `Content-Type` → `POST` simpan `{type, file_name, key}`, atau `{key}` untuk avatar. Helper: `putToPresignedUrl` + `useHrEmployeeDetail`. UI: `BoHrDocumentUploader` (`BoDropzone`) + `BoHrDocumentList`.
- **Unduhan file dari HR-API** (template, file hasil): `useHrApi().getBlob(path)` + `downloadBlob(nama, blob)` dari `app/utils/backoffice/shared.download.ts`. Error yang dikirim sebagai blob sudah dinormalisasi oleh transport HR.
- **Job berjalan lama** (import): simpan id job di query (`?job=`), polling dengan `setTimeout` yang dihentikan di `onBeforeUnmount`.
- **Namespace i18n per modul HR**: `hrEmployees` (Employees), `hrAttendance` (Attendance). Modul baru = namespace baru, didaftarkan di 3 tempat (§3).
- **Nama hari/bulan**: pakai `Intl.DateTimeFormat(backofficeLanguage(), …)` (lihat `weekdayShort`/`monthTitle` di `hr-roster.catalog.ts`), jangan daftar teks manual.
- **Warna dari data API** (mis. warna shift): style inline lewat helper (`shiftCellStyle`). `check:tokens` menolak literal hex di kode dan test, jadi di test bentuk nilainya tanpa literal (`'#'.concat('0c7c40')`).
- **List non-standar** (roster dengan rentang tanggal): `useListRoute` tetap dipakai untuk filter/search/page di URL. State lain (rentang, bulan, view) disimpan lokal atau di query sendiri, lalu `watch(...) → load()`.
- **Satu halaman, dua list bertab** (Daily Records): satu `useListRoute` dengan gabungan filter. Nama filter dibuat unik per tab (mis. `correction_status`), `load()` memilih endpoint sesuai tab, dan ganti tab = `router.replace({ query: { tab } })` lalu panggil `load()` manual (query kosong tidak memicu fetch ulang).
- **Peta**: tanpa library; embed OpenStreetMap (`osmEmbedUrl`) + link keluar.
- **Fitur khusus development** di HR BO (`isDevelopment`) → `import.meta.dev`.
- **Halaman bertab:** `BoRouteTabs` + query `?tab=`. Tab yang punya form diberi `v-show` agar tidak kehilangan perubahan; tab lain `v-if` dengan `:key` untuk refresh.
- **Seksi dua kolom ala HR BO** (judul/ikon/deskripsi di kiri, kartu di kanan): `BoHrFormSection`. Header panel tab: `BoHrPanelHeader`.
- **Filter default bukan "kosong"** (mis. status default Active): `ListQueryConfig` tidak punya nilai default filter. Jadikan nilai `''` sebagai default di fungsi params (contoh `hrContractListParams`), lalu sediakan opsi eksplisit seperti `any` untuk "semua". Filter boolean HR BO menjadi select `''`/`'1'` di `BoListToolbar`.
- **Tipe yang dipakai komponen lain** taruh di `app/types/...`, bukan `export interface` di `.vue`. `check:boundaries` gagal membaca `import X, { type Y } from './X.vue'`.

## 5. Cek sebelum selesai (`jewelry-fe`)

```bash
npx oxfmt <file-baru>
npx oxlint
npm run -s typecheck            # error print-device.form.test.ts = lama
npx vitest run
npm run -s check:boundaries && npm run -s check:comments && npm run -s check:tokens \
  && npm run -s check:i18n && npm run -s check:file-size && npm run -s format:check
```

## 6. Referensi (Employees Info)

| Lapisan | File `jewelry-fe` |
|---|---|
| Tipe | `app/types/backoffice/hr-employee.type.ts`, `hr-lookup.type.ts` |
| Data | `app/composables/backoffice/useHrEmployee.ts`, `useHrLookups.ts`, `useHrPagedOptions.ts` |
| Store | `app/stores/backoffice/hr-employee.store.ts` |
| Util | `app/utils/backoffice/hr-employee.catalog.ts`, `hr-employee.form.ts`, `hr-employee.records.ts` (+ test) |
| Komponen bersama | `app/components/backoffice/hr/shared/BoHrPagedSelect.vue`, `BoHrCommonCodeSelect.vue` |
| Komponen fitur | `app/components/backoffice/hr/employees/*` (list, create, detail bertab, seksi form, dialog kontrak/akun) |
| Detail (API & tipe) | `app/composables/backoffice/useHrEmployeeDetail.ts`, `app/types/backoffice/hr-employee-detail.type.ts`, `app/utils/backoffice/hr-employee-detail.catalog.ts` |
| Page | `app/pages/backoffice/hr/employees/{index,create,[id]}.vue` |
| i18n | `i18n/locales/*/backoffice/hrEmployees.json`, `shell.json` (`shell.nav.hr.*`, `shell.head.hr*`) |
