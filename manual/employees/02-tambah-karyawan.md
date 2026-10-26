# 02 · Tambah Karyawan

Formulir pendaftaran karyawan baru dalam satu halaman panjang yang dibagi per
bagian: informasi dasar, penempatan, kontrak pertama, data pribadi, alamat,
akses login, custom fields, dan riwayat. Hanya field bertanda `*` yang wajib —
sisanya bisa dilengkapi belakangan dari halaman detail.

**Akses:** `/tenants/employee/create` · **Permission:** `employees:write`

## Tampilan

<!-- ui-mock: employees-create -->
```html
<div aria-label="Mockup Add Employee" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:8px 10px;color:#bfdbfe">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="border-bottom:1px solid #e4e4e7;padding-bottom:12px">
      <div style="color:#71717a;font-size:11px">← Back to Employee List</div>
      <div style="font-size:19px;font-weight:700;margin-top:4px">Add Employee</div>
      <div style="color:#71717a;font-size:12px;margin-top:3px">Fields marked <span style="color:#dc2626">*</span> are required — everything else can be filled in later from the employee's profile.</div>
    </div>
    <div style="display:grid;grid-template-columns:200px 1fr;gap:16px;margin-top:16px">
      <div><div style="font-weight:700">👤 Basic Information</div><div style="color:#71717a;font-size:11px;margin-top:3px">Name, contact details, and tax/identity numbers.</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;font-weight:600">Full Name <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">Budi Santoso</div></div>
        <div><div style="font-size:11px;font-weight:600">Short Name <span style="color:#a1a1aa;font-weight:400">Optional</span></div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">Budi</div></div>
        <div><div style="font-size:11px;font-weight:600">Work Email <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">✉ budi@perusahaan.co.id</div></div>
        <div><div style="font-size:11px;font-weight:600">Phone / WhatsApp</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">0812-3456-7890</div></div>
        <div><div style="font-size:11px;font-weight:600">NIK <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px;font-family:monospace">3175012345678901</div><div style="color:#71717a;font-size:10px;margin-top:2px">16-digit national ID number.</div></div>
        <div><div style="font-size:11px;font-weight:600">NPWP <span style="color:#a1a1aa;font-weight:400">Optional</span></div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px;color:#a1a1aa">Tax ID number</div></div>
      </div>
    </div>
    <div style="border-top:1px solid #e4e4e7;margin:16px 0"></div>
    <div style="display:grid;grid-template-columns:200px 1fr;gap:16px">
      <div><div style="font-weight:700">💼 Employment</div><div style="color:#71717a;font-size:11px;margin-top:3px">Where the employee sits in the organization and when they started.</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;font-weight:600">Org Unit <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">Engineering ▾</div></div>
        <div><div style="font-size:11px;font-weight:600">Position <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">Software Engineer ▾</div></div>
        <div><div style="font-size:11px;font-weight:600">Work Branch</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px;color:#a1a1aa">Default branch ▾</div><div style="color:#71717a;font-size:10px;margin-top:2px">Leave empty to use the default branch.</div></div>
        <div><div style="font-size:11px;font-weight:600">Hire Date <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">2026-11-02</div></div>
      </div>
    </div>
    <div style="border-top:1px solid #e4e4e7;margin:16px 0"></div>
    <div style="display:grid;grid-template-columns:200px 1fr;gap:16px">
      <div><div style="font-weight:700">📄 Contract</div><div style="color:#71717a;font-size:11px;margin-top:3px">The employee's first contract. Optional — you can also add it later from the Contracts tab.</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:span 2"><div style="font-size:11px;font-weight:600">Contract Type</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">PKWT ▾</div></div>
        <div><div style="font-size:11px;font-weight:600">Start Date <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">2026-11-02</div></div>
        <div><div style="font-size:11px;font-weight:600">End Date</div><div style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 8px;margin-top:3px">2027-11-01</div></div>
      </div>
    </div>
    <div style="color:#a1a1aa;font-size:11px;text-align:center;margin:14px 0">… Personal Details · Family &amp; Physical · Address · Login Access · Custom Fields · History &amp; Records …</div>
    <div style="display:flex;justify-content:space-between;align-items:center;border:1px solid #e4e4e7;background:#fff;border-radius:12px;padding:10px 14px;box-shadow:0 4px 12px rgba(0,0,0,.08)">
      <span style="color:#71717a;font-size:11px">A login account will be created for this employee.</span>
      <span style="display:flex;gap:8px"><span style="padding:6px 12px">Cancel</span><span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">✓ Save Employee</span></span>
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

## Elemen Halaman

| Elemen | Fungsi |
|---|---|
| **Back to Employee List** | Kembali ke daftar tanpa menyimpan |
| Bar aksi bawah (menempel) | Selalu terlihat saat menggulir; teks kiri menunjukkan apakah akun login akan dibuat |
| **Cancel** | Batal & kembali ke daftar |
| **Save Employee** | Validasi lalu buat karyawan baru |

## Bagian Formulir

Setiap bagian tampil dengan judul + deskripsi di kiri dan field di kanan.

### 1. Basic Information

| Field | Tipe | Wajib | Contoh / Catatan |
|---|---|---|---|
| **Full Name** | teks | Ya | Budi Santoso |
| **Short Name** | teks | Tidak | Budi |
| **Work Email** | email | Ya | `budi@perusahaan.co.id` — juga dipakai sebagai email akun login |
| **Phone / WhatsApp** | teks | Tidak | `0812-3456-7890` |
| **NIK** | teks | Ya | 16 digit, maks 16 karakter |
| **NPWP** | teks | Tidak | — |

### 2. Employment

| Field | Tipe | Wajib | Catatan |
|---|---|---|---|
| **Org Unit** | pencarian (server) | Ya | Ketik nama unit untuk mencari |
| **Position** | pencarian (server) | Ya | Pilihan dibatasi pada **Org Unit** terpilih |
| **Work Branch** | pencarian | Tidak | Kosong = pakai default branch |
| **Hire Date** | tanggal | Ya | Default: hari ini |

> **Penting:** Mengganti **Org Unit** akan mengosongkan **Position** bila posisi
> sebelumnya tidak berada di unit tersebut.

> **Catatan:** Field **Direct Manager** untuk sementara disembunyikan dari form.

### 3. Contract (opsional)

Kontrak pertama karyawan. Bila **Contract Type** dibiarkan kosong (*No contract
yet*), tidak ada kontrak yang dibuat — kontrak bisa ditambahkan nanti dari tab
**Contracts** ([`04-kontrak-kerja.md`](./04-kontrak-kerja.md)).

| Field | Tipe | Wajib | Catatan |
|---|---|---|---|
| **Contract Type** | pilihan (common code `contract_type`) | Tidak | Mis. PKWT, PKWTT — daftar mengikuti master common code tenant |
| **Start Date** | tanggal | Ya* | Muncul setelah tipe dipilih; otomatis diisi **Hire Date** |
| **End Date** | tanggal | Tidak | Nonaktif bila **No end date** dinyalakan |
| **No end date** | switch | — | Untuk kontrak tanpa batas waktu |
| **Remark** | teks panjang | Tidak | Nomor SK, catatan, dll. |

\* Wajib hanya bila **Contract Type** diisi.

### 4. Personal Details

*Identity details as stated on the employee's ID card.*

| Field | Tipe | Catatan |
|---|---|---|
| **Date of Birth** | tanggal | — |
| **Place of Birth** | teks | Mis. Jakarta |
| **Gender** | pilihan | Male / Female |
| **Marital Status** | pilihan | Single / Married / Divorced / Widowed |
| **Religion** | pilihan (common code `religion`) | — |
| **Nationality** | teks | Mis. Indonesia |

### 5. Family & Physical

| Field | Tipe | Catatan |
|---|---|---|
| **Family Card Number (KK)** | teks | 16 digit |
| **Number of Children** | angka | Minimal 0 |
| **Height** | angka (cm) | — |
| **Weight** | angka (kg) | — |
| **Currently pregnant** | switch | Dipakai untuk kelayakan cuti melahirkan |

### 6. Address

| Field | Tipe | Catatan |
|---|---|---|
| **Province → City / Regency → District → Village / Subdistrict** | pilihan bertingkat | Pilihan level berikutnya mengikuti level sebelumnya |
| **Address Line 1** | teks | Mis. Jl. Merdeka No. 10 |
| **Address Line 2** | teks | RT/RW, blok, dll. (opsional) |
| **Postal Code** | teks | — |
| **ID Card Address** | teks panjang | Opsional — hanya bila berbeda dari alamat domisili |

### 7. Login Access

Switch **Create a login account** (default: **aktif**). Bila aktif, akun dibuat
dengan **Work Email** di atas, ber-role *Employee*, dan password sementara
ditampilkan setelah simpan.

### 8. Custom Fields

Hanya muncul bila tenant punya field kustom aktif (HR Setting → Custom Fields).
Tipe input mengikuti definisi: teks, tanggal, angka, pilihan, atau boolean.
Field kustom yang didefinisikan wajib ditandai `*`.

### 9. History & Records (opsional)

Akordeon berisi 10 daftar berulang. Badge angka di judul menunjukkan jumlah
baris yang sudah diisi. Tiap baris ditambah lewat tombol **Add** → modal
**Add — (nama bagian)** → **Save**.

| Bagian | Isi field |
|---|---|
| Bank Accounts | Bank, Account Number, Account Holder |
| Education History | Education Level, School Name, Start/Graduation Date, Graduation Status, Major, Study Program, Grade/GPA, Remark |
| Previous Employment | Company Name, Last Job, Last Position, Last Gross Salary, Start/End Date, Remark |
| Certificates | Certificate Name/Type, Issue/Expiry Date, Grade, Remark |
| Family | Full Name, Relationship, Date/Place of Birth, Occupation, ID Card Number (KTP), BPJS Number, Clinic, Lives Together |
| Training | Training Type, Date, Organizer, Trainer, Duration (Hours), Score (0-100), Info, Detail, Has Certificate, Remark |
| Medical Record | Disease/Condition, Date, Status, Remark |
| Personnel Appraisal | Date, Period, Contribution, Result, Capability, Remark |
| Reward / Warning | Type, Name, From/To Date, Issued By, Reason |
| Insurance | Insurance Name/Number, Active, Start Date, Remark |

> **Catatan:** Bagian *Term of Contract* sudah dihapus — kontrak kini dicatat
> lewat bagian **Contract** di atas atau tab **Contracts**.

## Langkah

1. Klik **Tambah Karyawan** dari halaman daftar.
2. Isi **Full Name**, **Work Email**, dan **NIK**.
3. Pilih **Org Unit**, **Position**, dan pastikan **Hire Date** benar.
4. (Opsional) pilih **Contract Type** untuk langsung membuat kontrak pertama,
   lalu lengkapi tanggal dan remark.
5. (Opsional) lengkapi data pribadi, alamat, custom fields, dan riwayat.
6. Tentukan **Create a login account** (nyala/mati).
7. Klik **Save Employee**.

## Hasil Setelah Simpan

- Karyawan dibuat lebih dulu, lalu riwayat (History & Records) dan kontrak
  pertama disimpan sesudahnya. Gagal di salah satu bagian riwayat tidak
  membatalkan karyawan yang sudah dibuat.
- Bila **Create a login account** aktif, muncul modal **Temporary Login
  Password**. Salin password (ikon salin), lalu klik **Close** — tombol baru
  aktif setelah password disalin — untuk kembali ke daftar.
- Bila tidak membuat akun, halaman langsung kembali ke daftar karyawan.

## Pesan Validasi

| Kondisi | Pesan |
|---|---|
| Ada field wajib kosong | Toast **"Incomplete Form"** — *Full name, NIK, email, org unit, position, and hire date are required.* Field yang kosong ditandai **Required**. |

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/create.vue` |
| Bagian form | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrFormSection.vue`, `CoreHrEmployeePersonalSections.vue` |
| Alamat | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrAddressFields.vue` |
| Riwayat | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrRecordListEditor.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useEmployees.ts`, `useContracts.ts`, `useEmployeeRecordSections.ts`, `useEmployeeFields.ts`, `useOrgUnits.ts`, `usePositions.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
