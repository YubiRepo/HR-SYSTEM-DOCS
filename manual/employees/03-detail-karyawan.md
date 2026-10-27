# 03 · Detail Karyawan

Halaman profil satu karyawan. Menampilkan ringkasan profil (foto + data
kunci), form edit data pribadi, kontrak, riwayat karier (career path),
kebijakan kerja (work policy), riwayat & data lainnya, custom fields, dan pengaturan akun login — plus menu
**Actions** untuk mengubah penempatan atau status siklus hidup.

**Akses:** `/tenants/employee/:id` · **Permission:** `employees:read` (lihat),
`employees:write` (ubah), `employees:delete` (arsip), `contracts:write`
(kontrak), `users:write` (reset password)

## Tampilan

<!-- ui-mock: employees-detail -->
```html
<div aria-label="Mockup Detail Karyawan" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:8px 10px;color:#bfdbfe">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
      <div>
        <div style="color:#71717a;font-size:11px">← Back to Employee List &nbsp;•&nbsp; <span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px">Active</span></div>
        <div style="font-size:17px;font-weight:700;margin-top:4px">Budi Santoso</div>
        <div style="color:#71717a;font-size:11px;margin-top:3px">Software Engineer · Engineering (Jakarta HQ)</div>
      </div>
      <div style="display:flex;gap:8px">
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">↻ Refresh</span>
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">⚙ Actions ▾</span>
      </div>
    </div>
    <div style="display:flex;gap:4px;border-bottom:1px solid #e4e4e7;margin-top:12px;font-size:12px">
      <span style="padding:8px 14px;border-bottom:2px solid #2563eb;color:#2563eb;font-weight:600">Profile</span>
      <span style="padding:8px 14px;color:#71717a">Contracts</span>
      <span style="padding:8px 14px;color:#71717a">Career History</span>
      <span style="padding:8px 14px;color:#71717a">Work Policy</span>
      <span style="padding:8px 14px;color:#71717a">Others</span>
      <span style="padding:8px 14px;color:#71717a">Account Settings</span>
    </div>
    <div style="display:flex;gap:20px;align-items:center;border:1px solid #e4e4e7;background:#fff;border-radius:12px;padding:18px;margin-top:14px">
      <div style="width:84px;height:84px;border-radius:999px;background:#dbeafe;color:#1d4ed8;display:grid;place-items:center;font-weight:700;font-size:24px;flex-shrink:0">BS</div>
      <div style="flex:1">
        <div style="font-size:18px;font-weight:700">Budi Santoso <span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:11px;font-weight:500">Active</span></div>
        <div style="color:#71717a;margin-top:2px">Software Engineer · Engineering</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px 18px;margin-top:12px">
          <div><div style="color:#71717a;font-size:11px"># Employee No.</div><div style="font-weight:500">EMP-0001</div></div>
          <div><div style="color:#71717a;font-size:11px">✉ Work Email</div><div style="font-weight:500">budi@perusahaan.co.id</div></div>
          <div><div style="color:#71717a;font-size:11px">☎ Phone</div><div style="font-weight:500">0812-3456-7890</div></div>
          <div><div style="color:#71717a;font-size:11px">📅 Joined</div><div style="font-weight:500">2024-02-01 (2 yrs 8 mos)</div></div>
          <div><div style="color:#71717a;font-size:11px">📄 Employment Type</div><div style="font-weight:500">PKWT</div></div>
          <div><div style="color:#71717a;font-size:11px">📍 Branch</div><div style="font-weight:500">Jakarta HQ</div></div>
          <div><div style="color:#71717a;font-size:11px">🔑 Login Account</div><div style="font-weight:500">Linked</div></div>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:200px 1fr;gap:16px;margin-top:18px">
      <div><div style="font-weight:700">👤 Contact &amp; Identity</div><div style="color:#71717a;font-size:11px;margin-top:3px">How to reach the employee, their reporting line, and identity numbers.</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;font-weight:600">Work Email</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">budi@perusahaan.co.id</div></div>
        <div><div style="font-size:11px;font-weight:600">Phone / WhatsApp</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">0812-3456-7890</div></div>
        <div><div style="font-size:11px;font-weight:600">Short Name</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">Budi</div></div>
        <div><div style="font-size:11px;font-weight:600">NIK</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px;font-family:monospace">3175012345678901</div></div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;border:1px solid #e4e4e7;background:#fff;border-radius:12px;padding:10px 14px;margin-top:16px;box-shadow:0 4px 12px rgba(0,0,0,.08)">
      <span style="color:#b45309;font-size:11px;font-weight:500">You have unsaved changes.</span>
      <span style="display:flex;gap:8px"><span style="padding:6px 12px">Discard</span><span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">✓ Save Changes</span></span>
    </div>
  </main>
</div>
```
<!-- /ui-mock -->

> **Prompt gambar:** "Ubah HTML di dalam blok `ui-mock` menjadi screenshot UI
> aplikasi HR backoffice yang realistis dan utuh: render semua elemen persis
> seperti tertulis, pertahankan layout, warna, dan teks. Gunakan data nyata
> bergaya perusahaan Indonesia. Latar terang, sudut membulat, bayangan halus.
> Keluarkan sebagai satu gambar."

## Elemen Header

| Elemen | Fungsi |
|---|---|
| **Back to Employee List** | Kembali ke daftar |
| Badge status | Status siklus hidup saat ini (`Probation`, `Active`, `On leave`, `Resigned`, `Terminated`, `Offboarded`) |
| Nama & subjudul | Nama lengkap, lalu *Posisi · Unit (Cabang)* |
| **Refresh** | Muat ulang data karyawan & akun (serta riwayat karier bila tab **Career History** sedang dibuka) |
| **Actions** | Menu aksi (lihat tabel di bawah) |

### Menu Actions

| Item | Hasil | Syarat |
|---|---|---|
| **Transfer or promotion** | Buka modal penempatan baru (langsung diterapkan) | `employees:write` |
| **Change lifecycle status** | Buka modal ubah status | `employees:write` & status punya transisi valid |
| **Create New Account** | Buat akun login baru + tampilkan password sementara | `employees:write` & akun belum tertaut |
| **Link Existing Account** | Tautkan akun yang sudah ada (belum dipakai) | `employees:write` & akun belum tertaut |
| **Start offboarding** | Buka modal offboarding | `employees:write` & status bukan `Offboarded` |
| **Archive employee** | Arsipkan karyawan lalu kembali ke daftar | `employees:delete` |

> **Penting:** Item **Change lifecycle status** hanya aktif bila status saat ini
> punya transisi valid:
> `Probation → Active/Terminated`, `Active → Active/Resigned/Terminated`,
> `Resigned → Offboarded`, `Terminated → Offboarded`.

## Tab

| Tab | Isi | Tampil bila |
|---|---|---|
| **Profile** | Ringkasan profil + form edit data pribadi | Selalu |
| **Contracts** | Panel kontrak kerja — lihat [`04-kontrak-kerja.md`](./04-kontrak-kerja.md) | Selalu |
| **Career History** | Timeline career path karyawan — lihat [Career History](#career-history) | Selalu |
| **Work Policy** | Penugasan **OT Type** & **Working Time (shift)** — lihat [`07-work-policy.md`](./07-work-policy.md) | Selalu *(rencana — belum tersedia di aplikasi)* |
| **Others** | Sub-tab riwayat & data lainnya + Custom Fields | Selalu |
| **Account Settings** | Status akun login, role, permission | Karyawan sudah punya akun login |

> **Catatan:** Tab *Documents Vault* dan *Direct Reports* masih ada di kode
> tetapi **tidak** ditampilkan di bar tab saat ini.

### Profile — Ringkasan (read-only)

Kartu atas berisi **foto profil** (bisa diganti dengan `employees:write`),
nama, badge status, *Posisi · Unit*, dan 7 data kunci: **Employee No.**,
**Work Email**, **Phone**, **Joined** (tanggal + masa kerja, mis. *2 yrs 8 mos*),
**Employment Type** (dari kontrak aktif), **Branch**, **Login Account**.

Penempatan (unit/posisi/cabang) **tidak** bisa diubah di sini — gunakan
**Actions → Transfer or promotion** atau menu **Career Mutation**
([`05-mutasi.md`](./05-mutasi.md)).

### Profile — Form edit

Semua bagian di bawah ringkasan disimpan sekaligus dengan satu tombol.

| Bagian | Field |
|---|---|
| **Contact & Identity** | Work Email, Phone / WhatsApp, Short Name, NIK, NPWP |
| **Personal Details** | Date of Birth, Place of Birth, Gender, Marital Status, Religion, Nationality |
| **Family & Physical** | Family Card Number (KK), Number of Children, Height (cm), Weight (kg), Currently pregnant |
| **Address** | Province → City / Regency → District → Village / Subdistrict, Address Line 1, Address Line 2, Postal Code, ID Card Address |

Bar aksi bawah (menempel, butuh `employees:write`):

- Teks status: *All changes saved.* atau *You have unsaved changes.* (kuning).
- **Discard** — muncul bila ada perubahan; mengembalikan isi form.
- **Save Changes** — aktif hanya bila ada perubahan.

> **Catatan:** Field **Direct Manager** untuk sementara disembunyikan.

### Career History

Menampilkan **career path** karyawan: setiap entri adalah potret lengkap
penempatan karyawan pada satu periode — cabang, unit, posisi, jadwal kerja, dan
status. Entri terbaru di paling atas. Entri baru tercipta saat karyawan
didaftarkan, saat **Actions → Transfer or promotion** disimpan, atau saat
pengajuan **Career Mutation** disetujui.

Isi tiap entri:

| Elemen | Isi |
|---|---|
| Judul | Jenis career path (mis. *Promotion*, *Transfer* — mengikuti master common code `career_path_type` tenant) |
| Badge | `Current` (hijau) untuk entri yang sedang berlaku, `Past` untuk entri lama |
| Periode | *tanggal mulai — tanggal selesai*, atau *— Present* untuk entri yang sedang berlaku |
| **Branch:** | Cabang kerja |
| **Department:** | Unit organisasi |
| **Position:** | Posisi/jabatan |
| **Schedule:** | Badge `Fixed` / `Rotation` + nama working pattern |
| **Status:** | Status karyawan pada periode itu |
| Alasan | Teks miring di bawah bila alasan diisi |

Saat memuat muncul *Loading career path...*; bila belum ada entri muncul
*No career path recorded yet.* Gagal memuat menampilkan toast **"Failed to
Load Career Path"**.

<!-- ui-mock: employees-detail-career-history -->
```html
<div aria-label="Mockup Career History" style="font-family:Inter,system-ui,sans-serif;width:720px;background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:18px 20px;color:#18181b;font-size:13px">
  <div style="display:flex;gap:16px">
    <div style="width:12px;display:flex;flex-direction:column;align-items:center"><span style="width:10px;height:10px;border-radius:999px;border:2px solid #2563eb;margin-top:5px"></span><span style="flex:1;width:1px;background:#e4e4e7"></span></div>
    <div style="flex:1;padding-bottom:18px">
      <div style="display:flex;gap:8px;align-items:center"><span style="font-weight:600">Promotion</span><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:11px">Current</span></div>
      <div style="font-family:monospace;font-size:11px;color:#a1a1aa;margin-top:4px">2026-07-01 — Present</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:12px;margin-top:6px">
        <div><span style="color:#71717a">Branch:</span> Jakarta HQ</div>
        <div><span style="color:#71717a">Department:</span> Engineering</div>
        <div><span style="color:#71717a">Position:</span> Senior Software Engineer</div>
        <div><span style="color:#71717a">Schedule:</span> <span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 6px;font-size:10px">🕑 Fixed</span> Office Mon–Fri</div>
        <div><span style="color:#71717a">Status:</span> Active</div>
      </div>
      <div style="font-size:12px;font-style:italic;color:#71717a;margin-top:6px">Kinerja tahunan sangat baik.</div>
    </div>
  </div>
  <div style="display:flex;gap:16px">
    <div style="width:12px;display:flex;flex-direction:column;align-items:center"><span style="width:10px;height:10px;border-radius:999px;border:2px solid #a1a1aa;margin-top:5px"></span></div>
    <div style="flex:1">
      <div style="display:flex;gap:8px;align-items:center"><span style="font-weight:600">New Hire</span><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:11px">Past</span></div>
      <div style="font-family:monospace;font-size:11px;color:#a1a1aa;margin-top:4px">2024-02-01 — 2026-06-30</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:12px;margin-top:6px">
        <div><span style="color:#71717a">Branch:</span> Jakarta HQ</div>
        <div><span style="color:#71717a">Department:</span> Engineering</div>
        <div><span style="color:#71717a">Position:</span> Software Engineer</div>
        <div><span style="color:#71717a">Schedule:</span> <span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 6px;font-size:10px">🕑 Fixed</span> Office Mon–Fri</div>
        <div><span style="color:#71717a">Status:</span> Probation</div>
      </div>
    </div>
  </div>
</div>
```
<!-- /ui-mock -->

### Others

Klik tab **Others** untuk menampilkan deretan sub-tab (dengan badge jumlah
baris): **Bank Accounts**, **Education History**, **Previous Employment**,
**Certificates**, **Family**, **Training**, **Medical Record**, **Personnel
Appraisal**, **Reward / Warning**, **Insurance**, dan **Custom Fields** (hanya
bila tenant punya field kustom aktif). Tab **Others** mengingat sub-tab
terakhir yang dibuka.

- **Sub-tab riwayat** — daftar baris; **Add** untuk menambah, ikon pensil
  untuk mengubah (modal **Add/Edit — (nama bagian)** → **Save**), ikon hapus untuk
  menghapus. Perubahan langsung tersimpan tanpa memuat ulang halaman. Isi field
  per bagian sama dengan bagian *History & Records* di
  [`02-tambah-karyawan.md`](./02-tambah-karyawan.md).
- **Custom Fields** — isi nilai field kustom lalu **Save Custom Fields**
  (`employees:write`).

### Account Settings

Menampilkan **Account Status**, **Email**, **Last Login**, badge **Role**, serta
daftar **Effective Permissions** (kunci permission + badge scope:
`tenant`/`branch`/`team`/`self`). Aksi tersedia:

| Tombol | Fungsi | Syarat |
|---|---|---|
| **Reset Password** | Reset password & tampilkan modal **New Temporary Password** | `users:write` |
| **Resend Invitation** | Kirim ulang undangan akun | `employees:write` & status akun `Invited` |

## Modal Penempatan/Status/Offboarding

Semua modal ini berdeskripsi *"Maintains historical integrity. Changes are
appended to the career timeline."*

### Transfer or promotion — "Assignment Movement / Promotion"

Modal menampilkan *Target employee:* (nama karyawan). **Org unit** dan
**Position** otomatis terisi penempatan saat ini.

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Org unit** | pilihan | Ya | Unit tujuan | Engineering |
| **Position** | pilihan | Ya | Posisi dibatasi unit terpilih; dikosongkan bila tidak cocok dengan unit baru | Senior Software Engineer |
| **Career path type** | pilihan (common code `career_path_type`) | Ya | Placeholder *Select type...*; daftar mengikuti master common code tenant | Promotion |
| **Effective date** | tanggal | Ya | Default: hari ini | 2026-07-01 |
| **Reason** | teks panjang | Tidak | *Explanation for this movement...* | Kinerja tahunan sangat baik. |

Tombol: **Cancel** / **Save Movement**. Perubahan **langsung diterapkan**
(tanpa approval) dan muncul sebagai entri baru di tab **Career History**.
Berhasil → toast **"New Assignment Saved"** (*Employee career history has been
updated.*); gagal → toast **"Failed to Save Assignment"**.

> **Penting:** Modal ini hanya mengubah unit dan posisi. Untuk mengubah cabang
> atau jadwal kerja (schedule type & pattern), gunakan **Career Mutation**
> ([`05-mutasi.md`](./05-mutasi.md)).

> **Catatan:** Bila **Career path type** belum dipilih, tombol **Save
> Movement** tidak melakukan apa-apa (tanpa pesan). Pastikan tipe sudah
> dipilih.

### Change Lifecycle Status

| Field | Wajib | Catatan |
|---|---|---|
| **New status** | Ya | Pilihan dibatasi transisi valid (lihat catatan di atas) |
| **Effective date** | Ya | — |
| **Reason** | Tidak | *Explanation for status change...* |

Tombol: **Cancel** / **Save Movement**.

### Employee Offboarding

| Field | Wajib | Catatan |
|---|---|---|
| **Last working date** | Ya | Tanggal kerja terakhir |
| **Reason** | Tidak | *Explanation for departure...* |
| **Revoke Auth login access** | — | Toggle; menonaktifkan akun & semua sesi pada tanggal kerja terakhir |

Tombol: **Cancel** / **Confirm Offboarding**.

### Link to Existing Account

Pilih user pada dropdown (*Select user...*) — hanya akun yang belum tertaut ke
karyawan lain. Bila kosong muncul *No unlinked user accounts available.*
Tombol: **Cancel** / **Link**.

## Langkah — Ubah Data Pribadi

1. Buka detail karyawan (tab **Profile**).
2. Ubah field yang diperlukan — bar bawah berubah menjadi *You have unsaved
   changes.*
3. Klik **Save Changes** (atau **Discard** untuk membatalkan).

## Langkah — Ubah Penempatan (contoh promosi)

1. Klik **Actions → Transfer or promotion**.
2. Pilih **Org unit** dan **Position** tujuan, pilih **Career path type**
   (mis. **Promotion**), isi **Effective date**, dan (opsional) **Reason**.
3. Klik **Save Movement**. Subjudul header ikut berubah ke posisi baru, dan
   entri baru muncul di tab **Career History**.

## Langkah — Buat/Tautkan Akun

1. Untuk karyawan tanpa akun, buka **Actions**.
2. **Create New Account** → salin password sementara di modal → **Close**
   (aktif setelah password disalin).
3. Atau **Link Existing Account** → pilih user → **Link**.
4. Setelah akun tertaut, tab **Account Settings** muncul.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/[id].vue` |
| Foto profil | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrEmployeeAvatar.vue` |
| Bagian form | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrFormSection.vue`, `CoreHrEmployeePersonalSections.vue`, `CoreHrAddressFields.vue` |
| Modal gerakan | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrMovementModal.vue`, `HR-SYSTEM-BACKOFFICE/app/components/CommonCodeSelect.vue` |
| Career History | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CareerPathTimeline.vue`, `ScheduleTypeBadge.vue` |
| Riwayat | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrRecordListEditor.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useEmployees.ts`, `useEmployeeMovement.ts`, `useEmployeeRecordSections.ts`, `useEmployeeFields.ts`, `useAccessUsers.ts`, `useCareerPathLookups.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
