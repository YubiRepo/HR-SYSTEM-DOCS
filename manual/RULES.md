# Aturan Manua Backoffice (Tenant Admin)

Dokumen ini adalah **kontrak penulisan & pemeliharaan** seluruh manual di folder
`manual/`. Baca ini dulu sebelum membuat atau mengubah dokumen manual apa pun.

> Manual ini adalah panduan **end-user** (HR admin perusahaan / tenant admin)
> untuk memakai aplikasi backoffice — bukan dokumen teknis modul (itu ada di
> [`modules/`](../modules/)). Contoh yang benar: "cara menambah karyawan",
> bukan "skema tabel `employees`".

---

## 1. Prinsip Utama

1. **Living docs — wajib ikut berubah.** Dokumen manual adalah cermin dari
   aplikasi. Setiap kali UI, label, alur, validasi, permission, atau endpoint
   yang dipakai sebuah halaman berubah, dokumen manual halaman itu **wajib
   diperbarui di perubahan/PR yang sama**. Tidak ada manual yang "nanti
   disusul".
2. **Sumber kebenaran = kode aplikasi.** Bukan asumsi, bukan desain lama.
   Selalu buka halaman backoffice (`HR-SYSTEM-BACKOFFICE`) sebelum menulis
   mock atau langkah.
3. **Satu halaman aplikasi = satu bagian terdokumentasi.** Setiap menu dan
   sub-halaman di sidebar tenant admin harus punya alurnya sendiri yang bisa
   diikuti pembaca tanpa membuka aplikasi.
4. **Bahasa Indonesia untuk narasi**, **label UI dikutip persis apa adanya**
   (saat ini berbahasa Inggris, mis. `Add Employee`, `Refresh`).

---

## 2. Struktur Folder

Satu folder per **menu tingkat atas** di sidebar tenant admin. Nama folder =
slug menu, huruf kecil, tanda hubung.

```
manual/
├── README.md              # indeks manual
├── RULES.md               # aturan ini
├── employees/             # menu "Employees"
├── hr-setting/            # menu "HR Setting"
├── leave/                 # menu "Leave"
├── attendance/            # menu "Attendance"
├── salary/                # menu "Salary"
├── recruitment/           # menu "Recruitment & ATS"
├── performance/           # menu "Performance & Goals"
├── company-settings/      # menu "Company Settings"
├── ess/                   # portal karyawan (Employee Self-Service)
└── account/               # Profil & Keamanan milik user
```

Peta menu → folder → sub-halaman (sumber: `app/layouts/default.vue` sidebar):

| Menu sidebar | Folder | Sub-halaman |
|---|---|---|
| Employees | `employees/` | Employees Info, Mutasi |
| HR Setting | `hr-setting/` | Organizations, Positions, Working Time, Holiday & Leave Calendar, Attendance Rules, Leave Types, Salary Component, Tax and BPJS, Custom Fields |
| Leave | `leave/` | Leave Request, Leave Balances |
| Attendance | `attendance/` | Working Time Patterns, Employee Calendars, Daily Records, Overtime Request, Payroll Rekap Summary, Machines & Agents, Machine ID Mapping, Machine Punches |
| Salary | `salary/` | Employee Payrolls, Payroll Runs, Payslips |
| Recruitment & ATS | `recruitment/` | Lowongan Kerja, Pipeline Seleksi (ATS), Database Pelamar, Penawaran & Konversi, Konfigurasi Pipeline |
| Performance & Goals | `performance/` | Sasaran Kerja (KPI/OKR), Siklus Penilaian, Penilaian Kinerja, 360° Feedback, Sesi Kalibrasi (9-Box), Kerangka & Kompetensi |
| Company Settings | `company-settings/` | Overview, Cabang, Billing, Pengguna, Peran & Hak Akses, Aktivitas |
| Employee Portal | `ess/` | Beranda, Absensi Saya, Cuti Saya, Profil, Payslip |
| Account | `account/` | Profil, Keamanan |

> Folder kosong disimpan dengan `.gitkeep` sampai dokumennya dibuat.
> Menu platform (`platform/`) **tidak** masuk manual ini — itu area admin
> Yubiteck, bukan tenant admin.

### Struktur di dalam satu folder menu

```
<menu>/
├── README.md              # indeks menu: ringkasan, aktor, permission, daftar halaman
├── 01-<halaman>.md        # panduan per halaman (satu halaman app = satu file)
├── 02-<halaman>.md
├── 03-<alur>.md           # alur lintas halaman (mis. alur onboarding karyawan)
└── 99-faq.md              # FAQ & troubleshooting menu (opsional)
```

- `README.md` dan `index.md` otomatis **tidak** muncul di sidebar (karena itu
  selalu sediakan minimal satu file bernomor agar menu terlihat).
- Nomor dua digit (`01`, `02`, …) menentukan urutan baca.

---

## 3. Peta Sumber Kebenaran

Saat menulis/memperbarui sebuah dokumen, **wajib** merujuk sumber nyata di
bawah ini. Semua path relatif terhadap dua repo:

- Backoffice: `HR-SYSTEM-BACKOFFICE/`
- API & dokumen modul: `HR-SYSTEM-API/` dan `HR-SYSTEM-DOCS/modules/`

| Folder manual | Halaman backoffice | Composable terkait | Dokumen modul terkait |
|---|---|---|---|
| `employees/` | `app/pages/tenants/employee/**`, `employee.vue` | `useEmployees`, `useEmployeeMovement`, `useMutationRequests`, `useEmployeeFields`, `useEmployeeComponents`, `useEmployeeRecordSections`, `useContracts`, `useOrgUnits`, `usePositions` | `modules/core-hr/**` |
| `hr-setting/` | `app/pages/tenants/hr-setting/**` | `useOrgUnits`, `usePositions`, `useShifts`, `useSchedules`, `useScheduleGroups`, `useSchedulePatterns`, `useAttendanceRules`, `useHolidays`, `useLeaveTypes`, `usePayComponents`, `usePayrollTaxProfiles`, `useEmployeeFields`, `useTenantBranches` | `modules/core-hr/**`, `modules/attendance/**`, `modules/leave/**`, `modules/payroll/**` |
| `leave/` | `app/pages/tenants/leave/**` | `useLeaveRequests`, `useLeaveBalances`, `useLeaveTypes`, `useLeaveApprovalFlows`, `useLeaveBalancePreview` | `modules/leave/**` |
| `attendance/` | `app/pages/tenants/attendance/**` | `useAttendance*`, `useOvertimeRequests`, `useMachineIntegration`, `useShifts`, `useSchedule*`, `useAttendanceCorrections`, `useAttendanceSummary` | `modules/attendance/**` |
| `salary/` | `app/pages/tenants/salary/**` | `usePayroll`, `usePayrollRuns`, `usePayrollConfig`, `usePayrollProfiles`, `usePayslips`, `usePayComponents` | `modules/payroll/**` |
| `recruitment/` | `app/pages/tenants/recruitment/**` | `useRecruitment` | `modules/recruitment/**` |
| `performance/` | `app/pages/tenants/performance/**` | (logika di halaman/komponen) | `modules/performance/**` |
| `company-settings/` | `app/pages/tenants/settings/**`, `settings.vue` | `useTenants`, `useTenantBranches`, `useMyTenant`, `useBilling`, `useMyBilling`, `useAccessUsers`, `useAccessRoles`, `useAccessPermissions` | `modules/platform/tenant/**`, `modules/platform/billing/**`, `modules/rbac/**` |
| `ess/` | `app/pages/ess/**` | `useMyEmployee`, `useMyProfile`, `useMyTenant`, `useMyBilling` | `modules/mobile/**` |
| `account/` | `app/pages/tenants/account/**` | `useMyProfile`, `useAccessPermissions` | `modules/auth/**` |

> Path composable ada di `app/composables/`. Aturan navigasi/visibilitas menu
> ada di `app/layouts/default.vue` (`topLinks`/`bottomLinks` +
> gate `can([...])`/`hasFeature(...)`).
> Konvensi UI backoffice ada di `HR-SYSTEM-BACKOFFICE/CLAUDE.md`.

---

## 4. Aturan "Selalu Ikut Berubah"

### 4.1 Blok Sumber di akhir setiap dokumen

Setiap file manual (kecuali `README.md` dan `RULES.md`) **wajib** diakhiri
dengan bagian `## Sumber` yang menyebutkan file asal, sehingga penelusuran
balik mudah:

```markdown
## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/create.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useEmployees.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
```

### 4.2 Kapan dokumen wajib diperbarui

Perbarui dokumen menu terkait bila perubahan menyentuh **salah satu** dari:

- label/tombol/judul/placeholder/empty state/pesan toast,
- field form (tambah/hapus/ubah/rename/urutan),
- validasi & pesan error,
- permission/gate `can([...])` atau `hasFeature(...)` yang mengubah akses,
- route/path halaman atau item sidebar,
- alur (langkah wizards, status, tombol aksi massal),
- kolom tabel/filter/export,
- endpoint API yang dipakai halaman (perubahan kontrak).

### 4.3 Checklist pemutakhiran (jalankan di PR yang sama)

- [ ] Buka halaman backoffice yang berubah, bandingkan dengan mock di dokumen.
- [ ] Perbarui langkah, tabel field, dan catatan permission.
- [ ] Perbarui blok `## Sumber` bila path berubah.
- [ ] Perbarui `stock` status di `manual/README.md` bila halaman baru/hapus.
- [ ] `npm run docs:build` hijau.

> **Aturan emas:** kalau sebuah perubahan kode mengubah pengalaman pengguna di
> satu halaman, anggap perubahan itu **belum selesai** sampai manual halaman
> tersebut ikut diubah.

---

## 5. Konvensi Penulisan

- **Judul file** pakai `# <Nomor> · <Judul>` (mis. `# 01 · Daftar Karyawan`).
- **Narasi** dalam bahasa Indonesia; **label UI** dikutip persis (Inggris)
  dengan *bold* atau `code`, mis. klik **Add Employee**, isi `Employee Number`.
- **Langkah** pakai daftar bernomor, satu aksi per langkah.
- **Tabel field** wajib menyebut: nama label, tipe input, wajib/opsional,
  validasi, dan contoh. Lihat template di §7.
- **Tips/peringatan** pakai blockquote:
  - `> **Tip:** …`
  - `> **Penting:** …`
- **Link** ke dokumen modul memakai path absolut VitePress tanpa ekstensi,
  mis. `[Core HR](/modules/core-hr/01-overview)`.
- **Jangan** menyalin data asli/karyawan nyata — pakai data dummy realistis.
- Jangan menulis mockup sebagai gambar `.png`; pakai format §6 agar bisa
  dirender ulang oleh AI setiap saat.

---

## 6. Format Mock UI (siap dirender AI menjadi gambar)

Mock UI ditulis sebagai **wireframe HTML self-contained** (inline style, tanpa
dependency) yang dibungkus penanda `ui-mock`. Tujuannya: dokumen tetap ringan
di git, mudah diperbarui, dan bisa disuruh ubah ke gambar utuh oleh AI chat.

### 6.1 Anatomi blok

````markdown
<!-- ui-mock: employees-info-list -->
```html
<div aria-label="Mockup Employees Info" style="...">
  <!-- sidebar + konten -->
</div>
```
<!-- /ui-mock -->
````

Aturan blok:
- `slug` pada penanda unik per mockup di dalam file.
- HTML harus **self-contained** (inline style, tanpa `<script>`, tanpa aset
  eksternal) agar renderer tidak butuh konteks lain.
- Gunakan `<div>`/`<span>` semantik + teks berisi label persis dari aplikasi.
- **Selalu** tambahkan `aria-label="Mockup <Nama Halaman>"`.

### 6.2 Design token (samakan dengan backoffice)

| Elemen | Warna |
|---|---|
| Sidebar | bg `#172554`, teks `#ffffff`, item aktif `#2563eb` |
| Aksi utama (primary) | bg `#2563eb`, teks `#ffffff` |
| Latar halaman | `#f4f4f5` |
| Kartu/tabel | bg `#ffffff`, border `#e4e4e7` |
| Teks utama / sekunder | `#18181b` / `#71717a` |
| Font | `Inter, system-ui, sans-serif` |

Ukuran kanvas anjuran: lebar `960px` (desktop), tinggi dinamis. Sertakan
sidebar gelap + header konten agar mock langsung terbaca sebagai backoffice.

### 6.3 Prompt standar untuk AI chat (render gambar)

Sertakan kutipan ini tepat di bawah setiap blok `ui-mock`:

> **Prompt gambar:**
> "Ubah HTML di dalam blok `ui-mock` menjadi screenshot UI aplikasi HR
> backoffice yang realistis dan utuh: render semua elemen persis seperti
> tertulis, pertahankan layout, warna, dan teks. Gunakan data nyata bergaya
> perusahaan Indonesia. Latar terang, sudut membulat, bayangan halus. Keluarkan
> sebagai satu gambar."

### 6.4 Alternatif wireframe teks (untuk versi ringkas)

Bila halaman sangat sederhana, boleh memakai wireframe ASCII di dalam blok
```` ```text ```` sebagai pelengkap. HTML (§6.1) tetap bentuk utama untuk
render gambar.

---

## 7. Template

### 7.1 Template `README.md` per menu

````markdown
# <Menu> — Manual

<Ringkasan menu dalam 1–2 kalimat.>

| | |
|---|---|
| **Menu** | <Nama menu di sidebar> |
| **Aktor** | <role, mis. tenant_admin, HR admin> |
| **Permission** | `<perm>` (lihat `app/layouts/default.vue`) |
| **Akses** | <path, mis. `/tenants/employee`> |

## Daftar Halaman

| # | Halaman | Dokumen | Ringkasan |
|---|---|---|---|
| 1 | Employees Info | [`01-....md`](./01-....md) | … |
| 2 | Mutasi | [`02-....md`](./02-....md) | … |

## Alur Umum

1. …
````

### 7.2 Template halaman

````markdown
# 01 · <Nama Halaman>

<Ringkasan 1–2 kalimat: halaman ini untuk apa.>

**Akses:** <path> · **Permission:** `<perm>`

## Tampilan

<!-- ui-mock: <slug> -->
```html
<div aria-label="Mockup <Nama Halaman>" style="…">…</div>
```
<!-- /ui-mock -->

> **Prompt gambar:** "…"

## Elemen Halaman

| Elemen | Fungsi |
|---|---|
| **Refresh** | Memuat ulang data |
| **Add Employee** | Membuka form tambah karyawan |

## Langkah

1. …
2. …

## Field

| Field | Tipe | Wajib | Validasi | Contoh |
|---|---|---|---|---|
| `Full Name` | teks | Ya | maks 100 | Budi Santoso |

## Catatan & Aturan

- …

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/...` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/use....ts` |
````

---

## 8. Menambah Menu / Halaman Baru

1. Buat folder menu dari daftar §2 (jika belum ada) dan hapus `.gitkeep`.
2. Tulis `README.md` menu dari template §7.1.
3. Tulis dokumen halaman dari template §7.2 (mulai dari `01-…`).
4. Daftarkan/cek status di `manual/README.md`.
5. Jalankan `npm run docs:build` — sidebar terbentuk otomatis dari struktur
   folder (tidak perlu mengedit `.vitepress/config.mts` untuk menu manual).

---

## 9. Definition of Done

Sebuah dokumen manual dianggap selesai bila:

- [ ] Semua sub-halaman menu terwakili minimal satu dokumen.
- [ ] Setiap dokumen punya mock UI (§6) dan blok `## Sumber` (§4.1).
- [ ] Langkah & label diverifikasi langsung ke halaman backoffice terbaru.
- [ ] Permission & akses sesuai gate di `app/layouts/default.vue`.
- [ ] `manual/README.md` mutakhir.
- [ ] `npm run docs:build` berhasil tanpa dead link.
