# 03 · Detail Karyawan

Halaman profil satu karyawan. Menampilkan data kepegawaian, form edit data
pribadi, riwayat karier, dokumen, custom fields, dan pengaturan akun login —
plus menu **Actions** untuk mengubah penempatan atau status siklus hidup.

**Akses:** `/tenants/employee/:id` · **Permission:** `employees:read` (lihat),
`employees:write` (ubah), `employees:delete` (arsip), `users:write` (reset password)

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
        <div style="color:#71717a;font-size:11px">← Kembali ke Daftar Karyawan &nbsp;•&nbsp; <span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px">Active</span></div>
        <div style="font-size:17px;font-weight:700;margin-top:4px">Budi Santoso</div>
        <div style="color:#71717a;font-size:11px;margin-top:3px">Software Engineer · Engineering (Jakarta HQ)</div>
      </div>
      <div style="display:flex;gap:8px">
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">Refresh</span>
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">⚙ Actions ▾</span>
      </div>
    </div>
    <div style="display:flex;gap:4px;border-bottom:1px solid #e4e4e7;margin-top:12px;font-size:12px">
      <span style="padding:8px 14px;border-bottom:2px solid #2563eb;color:#2563eb;font-weight:600">Profile</span>
      <span style="padding:8px 14px;color:#71717a">Career History</span>
      <span style="padding:8px 14px;color:#71717a">Contracts</span>
      <span style="padding:8px 14px;color:#71717a">Documents Vault</span>
      <span style="padding:8px 14px;color:#71717a">Custom Fields</span>
      <span style="padding:8px 14px;color:#71717a">Account Settings</span>
    </div>
    <div style="font-weight:700;font-size:12px;margin-top:14px;color:#3f3f46">Riwayat Kepegawaian</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">
      <div style="border:1px solid #e4e4e7;border-radius:10px;padding:10px;background:#fff"><div style="color:#71717a;font-size:11px">Hire date</div><div style="font-weight:600;margin-top:3px">2024-02-01</div></div>
      <div style="border:1px solid #e4e4e7;border-radius:10px;padding:10px;background:#fff"><div style="color:#71717a;font-size:11px">Employment type</div><div style="font-weight:600;margin-top:3px">PKWT</div></div>
      <div style="border:1px solid #e4e4e7;border-radius:10px;padding:10px;background:#fff"><div style="color:#71717a;font-size:11px">Branch</div><div style="font-weight:600;margin-top:3px">Jakarta HQ</div></div>
      <div style="border:1px solid #e4e4e7;border-radius:10px;padding:10px;background:#fff"><div style="color:#71717a;font-size:11px">Org unit / Position</div><div style="font-weight:600;margin-top:3px">Engineering · Software Engineer</div></div>
      <div style="border:1px solid #e4e4e7;border-radius:10px;padding:10px;background:#fff"><div style="color:#71717a;font-size:11px">Auth account</div><div style="font-weight:600;margin-top:3px">Linked</div></div>
    </div>
    <section style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:12px;margin-top:12px">
      <div style="font-weight:700;font-size:12px;border-bottom:1px solid #f4f4f5;padding-bottom:8px">Data Pribadi &amp; Kontak</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        <div><div style="font-size:11px;font-weight:600">Email Kerja</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;margin-top:3px">budi@perusahaan.co.id</div></div>
        <div><div style="font-size:11px;font-weight:600">Nomor Telepon / WhatsApp</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;margin-top:3px">0812-3456-7890</div></div>
        <div><div style="font-size:11px;font-weight:600">NPWP</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;margin-top:3px">—</div></div>
        <div><div style="font-size:11px;font-weight:600">Manajer Langsung</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;margin-top:3px">Siti Rahmawati ▾</div></div>
      </div>
      <div style="text-align:right;margin-top:10px"><span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">✓ Simpan Perubahan</span></div>
    </section>
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
| **Kembali ke Daftar Karyawan** | Kembali ke daftar |
| Badge status | Status siklus hidup saat ini (`Active`, `Probation`, …) |
| **Refresh** | Muat ulang data karyawan & akun |
| **Actions** | Menu aksi (lihat tabel di bawah) |

### Menu Actions

| Item | Hasil | Syarat |
|---|---|---|
| **Transfer or promotion** | Buka modal penempatan baru (langsung diterapkan) | `employees:write` |
| **Change lifecycle status** | Buka modal ubah status | `employees:write` & status punya transisi valid |
| **Create New Account** | Buat akun login baru + tampilkan password sementara | `employees:write` & akun belum tertaut |
| **Link Existing Account** | Tautkan akun yang sudah ada (belum dipakai) | `employees:write` & akun belum tertaut |
| **Start offboarding** | Buka modal offboarding | `employees:write` & belum offboarded |
| **Archive employee** | Arsipkan karyawan lalu kembali ke daftar | `employees:delete` |

> **Penting:** Item **Change lifecycle status** hanya aktif bila target status
> valid dari status saat ini:
> `Probation → Active/Terminated`, `Active → Active/Resigned/Terminated`,
> `Resigned → Offboarded`, `Terminated → Offboarded`.

## Tab

| Tab | Isi |
|---|---|
| **Profile** | Riwayat kepegawaian (read-only) + form edit data pribadi + riwayat & data lainnya |
| **Career History** | Timeline penugasan (unit & posisi) |
| **Contracts** | Panel kontrak kerja — lihat [`04-kontrak-kerja.md`](./04-kontrak-kerja.md) |
| **Documents Vault** | Daftar & unggah dokumen |
| **Custom Fields** | Hanya tampil bila tenant punya field kustom |
| **Account Settings** | Hanya tampil bila karyawan sudah punya akun login |

> Tab **Direct Reports** ada di kode namun sedang dinonaktifkan.

### Profile — Riwayat Kepegawaian (read-only)

Menampilkan Hire date, Employment type, Branch, Org unit · Position, dan Auth
account. Field penempatan **tidak** bisa diubah di sini — perubahan
unit/posisi harus lewat **Actions → Transfer or promotion** atau **Mutasi**.

### Profile — Data Pribadi & Kontak (editable)

Field yang dapat diubah langsung lalu **Simpan Perubahan**: Email Kerja, Nomor
Telepon/WhatsApp, NPWP, Manajer Langsung, National ID (NIK), Tanggal Lahir,
Jenis Kelamin, Status Pernikahan (Belum Menikah/Menikah/Cerai/Janda-Duda),
Nama Pendek, Tempat Lahir, Kewarganegaraan, Agama, Jumlah Anak, No. KK, Tinggi
Badan, Berat Badan, Alamat KTP, Sedang hamil, dan **Alamat Domisili**
(Provinsi → Kelurahan/Desa + baris alamat + kode pos).

### Profile — Riwayat & Data Lainnya

11 daftar berulang (Rekening Bank, Riwayat Pendidikan, Riwayat Karir
Sebelumnya, Sertifikat, Data Keluarga, Training, Medical Record, Personnel
Appraisal, Reward/Warning, Term of Contract, Data Asuransi). Setiap baris
disunting lewat modal kecil (**Tambah** / ikon pensil / ikon hapus).

### Documents Vault

- Daftar dokumen: nama file (dapat diklik bila URL tersedia), jenis, dan waktu
  unggah. Ikon hapus tersedia dengan `employees:write`.
- **Unggah Dokumen**: pilih **Jenis Dokumen** (Kontrak, KTP, Sertifikat,
  Pajak, Lainnya), seret/pilih file (JPG, PNG, WEBP, PDF), tunggu status
  "siap disimpan", lalu klik **Simpan Dokumen**.

### Account Settings

Menampilkan **Status Akun**, **Email**, **Login Terakhir**, badge **Role**,
serta daftar **Effective Permissions** (kunci permission + badge scope:
`tenant`/`branch`/`team`/`self`). Aksi tersedia:

| Tombol | Fungsi | Syarat |
|---|---|---|
| **Reset Password** | Reset password & tampilkan password sementara | `users:write` |
| **Kirim Ulang Undangan** | Kirim ulang undangan akun | `employees:write` & status akun `Invited` |

## Modal Penempatan/Status/Offboarding

### Transfer or promotion — "Assignment Movement / Promotion"

| Field | Wajib | Catatan |
|---|---|---|
| **Org unit** | Ya | Unit tujuan |
| **Position** | Ya | Posisi dibatasi unit terpilih |
| **Movement type** | Ya | Promotion / Transfer / Demotion |
| **Effective date** | Ya | — |

Tombol simpan: **Save Movement**. Perubahan **langsung diterapkan** ke riwayat
karier (tanpa approval).

### Change Lifecycle Status

| Field | Wajib | Catatan |
|---|---|---|
| **New status** | Ya | Pilihan dibatasi transisi valid (lihat catatan di atas) |
| **Effective date** | Ya | — |
| **Reason** | Tidak | Penjelasan perubahan status |

Tombol simpan: **Save Movement**.

### Employee Offboarding

| Field | Wajib | Catatan |
|---|---|---|
| **Last working date** | Ya | Tanggal kerja terakhir |
| **Reason** | Tidak | Alasan keluar |
| **Revoke Auth login access** | — | Toggle; menonaktifkan akun & sesi pada tanggal efektif |

Tombol simpan: **Confirm Offboarding** (warna merah).

## Langkah — Ubah Penempatan (contoh promosi)

1. Buka detail karyawan, klik **Actions → Transfer or promotion**.
2. Pilih **Org unit** dan **Position** tujuan, pilih **Movement type**
   (**Promotion**), isi **Effective date**.
3. Klik **Save Movement**. Perubahan tercatat di tab **Career History**.

## Langkah — Buat/Tautkan Akun

1. Untuk karyawan tanpa akun, buka **Actions**.
2. **Create New Account** → salin password sementara pada modal → **Tutup**.
3. Atau **Link Existing Account** → pilih user pada dropdown → **Hubungkan**.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/[id].vue` |
| Modal gerakan | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrMovementModal.vue` |
| Alamat | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrAddressFields.vue` |
| Riwayat | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrRecordListEditor.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useEmployees.ts`, `useEmployeeMovement.ts`, `useEmployeeRecordSections.ts`, `useAccessUsers.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
