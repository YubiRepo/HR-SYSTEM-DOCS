# 02 · Tambah Karyawan

Formulir pendaftaran karyawan baru. Mengisi data pribadi, penempatan awal
(cabang, unit organisasi, posisi, manajer), data kustom tenant, riwayat
tambahan, dan opsi pembuatan akun login.

**Akses:** `/tenants/employee/create` · **Permission:** `employees:write`

## Tampilan

<!-- ui-mock: employees-create -->
```html
<div aria-label="Mockup Tambah Karyawan" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">Employees</div>
    <div style="padding:8px 10px;color:#bfdbfe">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
  </aside>
  <main style="padding:18px 20px">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
      <div>
        <div style="color:#71717a;font-size:11px">← Kembali ke Daftar Karyawan &nbsp;•&nbsp; <span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px">Pendaftaran Karyawan Baru</span></div>
        <div style="font-size:17px;font-weight:700;margin-top:4px">Employees Info</div>
      </div>
      <div style="display:flex;gap:8px">
        <span style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 12px;background:#fff">Batal</span>
        <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">✓ Simpan Karyawan</span>
      </div>
    </div>
    <div style="border:2px solid #fcd34d;background:#fffbeb;border-radius:10px;padding:12px;margin-top:12px;display:flex;gap:10px;align-items:center">
      <span style="background:#fde68a;color:#b45309;border-radius:8px;padding:6px 8px">🛡</span>
      <div><div style="font-weight:700">☑ Akses Akun Login</div><div style="color:#71717a;font-size:11px">Buat akun login karyawan otomatis &amp; hubungkan akses ke portal HR (Pola A).</div></div>
    </div>
    <section style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:12px;margin-top:12px">
      <div style="font-weight:700;font-size:12px;border-bottom:1px solid #f4f4f5;padding-bottom:8px">1. Data Pribadi &amp; Identitas</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        <div><div style="font-size:11px;font-weight:600">Nama Lengkap <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;color:#a1a1aa;margin-top:3px">Contoh: Budi Santoso</div></div>
        <div><div style="font-size:11px;font-weight:600">NIK / KTP (16 Digit) <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;color:#a1a1aa;margin-top:3px">3175xxxxxxxxxxxx</div></div>
        <div><div style="font-size:11px;font-weight:600">Email Kerja <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;color:#a1a1aa;margin-top:3px">budi@perusahaan.co.id</div></div>
        <div><div style="font-size:11px;font-weight:600">Nomor Telepon / WhatsApp</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;color:#a1a1aa;margin-top:3px">0812-3456-7890</div></div>
        <div><div style="font-size:11px;font-weight:600">Tanggal Lahir</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;color:#a1a1aa;margin-top:3px">dd/mm/yyyy</div></div>
        <div><div style="font-size:11px;font-weight:600">Jenis Kelamin</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;margin-top:3px">Laki-laki ▾</div></div>
      </div>
    </section>
    <section style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:12px;margin-top:10px">
      <div style="font-weight:700;font-size:12px;border-bottom:1px solid #f4f4f5;padding-bottom:8px">2. Informasi Pekerjaan &amp; Jabatan</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        <div><div style="font-size:11px;font-weight:600">Cabang Kerja</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;color:#a1a1aa;margin-top:3px">Default branch</div></div>
        <div><div style="font-size:11px;font-weight:600">Unit Organisasi <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;color:#a1a1aa;margin-top:3px">Ketik nama unit organisasi...</div></div>
        <div><div style="font-size:11px;font-weight:600">Posisi / Jabatan <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;color:#a1a1aa;margin-top:3px">Ketik nama posisi...</div></div>
        <div><div style="font-size:11px;font-weight:600">Manajer Langsung</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;color:#a1a1aa;margin-top:3px">Ketik nama / NIK manajer...</div></div>
        <div><div style="font-size:11px;font-weight:600">Tanggal Bergabung <span style="color:#dc2626">*</span></div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 8px;color:#a1a1aa;margin-top:3px">dd/mm/yyyy</div></div>
      </div>
    </section>
    <section style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:12px;margin-top:10px;color:#71717a">3. Custom Fields (muncul bila tenant punya field kustom) · 4. Riwayat &amp; Data Tambahan (Opsional)</section>
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
| **Kembali ke Daftar Karyawan** | Batal & kembali tanpa menyimpan |
| **Batal** | Sama seperti di atas |
| **Simpan Karyawan** | Validasi lalu buat karyawan baru |
| **Akses Akun Login** (checkbox) | Bila dicentang, akun login karyawan dibuat otomatis (default: aktif) |

## Blok Formulir

### Blok kuning — Akses Akun Login

Checkbox **Akses Akun Login**. Bila aktif, sistem membuat akun login dan
menautkannya ke karyawan. Setelah tersimpan, **password sementara** ditampilkan
sekali (lihat bagian bawah dokumen ini).

### 1. Data Pribadi & Identitas

| Field | Tipe | Wajib | Contoh / Catatan |
|---|---|---|---|
| **Nama Lengkap** | teks | Ya | Contoh: Budi Santoso |
| **NIK / KTP (16 Digit)** | teks | Ya | `3175xxxxxxxxxxxx` |
| **Email Kerja** | email | Ya | `budi@perusahaan.co.id` |
| **Nomor Telepon / WhatsApp** | teks | Tidak | `0812-3456-7890` |
| **Tanggal Lahir** | tanggal | Tidak | — |
| **Jenis Kelamin** | pilihan | Tidak | Laki-laki / Perempuan |
| **Alamat Domisili** | bertingkat | Tidak | Provinsi → Kota/Kabupaten → Kecamatan → Kelurahan/Desa, lalu Alamat Baris 1/2 & Kode Pos |
| **Nama Pendek** | teks | Tidak | Nama panggilan |
| **Tempat Lahir** | teks | Tidak | — |
| **Kewarganegaraan** | teks | Tidak | Default: Indonesia |
| **Agama** | teks | Tidak | — |
| **Jumlah Anak** | angka | Tidak | Minimal 0 |
| **No. KK (Kartu Keluarga)** | teks | Tidak | — |
| **Tinggi Badan (cm)** | angka | Tidak | — |
| **Berat Badan (kg)** | angka | Tidak | — |
| **Alamat KTP** | teks panjang | Tidak | Bila berbeda dari alamat domisili |
| **Sedang hamil** | checkbox | Tidak | — |

### 2. Informasi Pekerjaan & Jabatan

| Field | Tipe | Wajib | Catatan |
|---|---|---|---|
| **Cabang Kerja** | pencarian | Tidak | Kosong = pakai default branch |
| **Unit Organisasi** | pencarian (server) | Ya | Pencarian ke server |
| **Posisi / Jabatan** | pencarian (server) | Ya | Pilihannya dibatasi unit organisasi terpilih |
| **Manajer Langsung** | pencarian (server) | Tidak | Cari nama/NIK karyawan |
| **Tanggal Bergabung** | tanggal | Ya | Default: hari ini |

> **Penting:** Mengubah **Unit Organisasi** akan mengosongkan **Posisi /
> Jabatan** bila posisi sebelumnya tidak berada di unit tersebut.

### 3. Custom Fields

Hanya muncul bila tenant mendefinisikan field kustom aktif (lihat HR Setting →
Custom Fields). Setiap field mengikuti tipe yang didefinisikan: teks, tanggal,
angka, pilihan, atau boolean.

### 4. Riwayat & Data Tambahan (Opsional)

11 daftar berulang yang bisa ditambah baris satu per satu (tombol **Tambah**):

| Section | Isi |
|---|---|
| Rekening Bank | Nama Bank, Nomor Rekening, Nama Pemilik |
| Riwayat Pendidikan | Jenjang, Nama Sekolah, tanggal, IPK, dll. |
| Riwayat Karir Sebelumnya | Perusahaan, posisi, gaji terakhir, periode |
| Sertifikat | Nama, jenis, tanggal terbit/kedaluwarsa, grade |
| Data Keluarga | Nama, hubungan, tanggal lahir, KTP, BPJS, dll. |
| Training | Jenis, tanggal, penyelenggara, durasi, skor |
| Medical Record | Penyakit, tanggal, status |
| Personnel Appraisal | Tanggal, periode, kontribusi, hasil |
| Reward / Warning | Jenis, nama, periode, penerbit, alasan |
| Term of Contract | Status kontrak, tanggal mulai/berakhir, tanpa batas waktu |
| Data Asuransi | Nama, nomor, status aktif, tanggal mulai |

## Langkah

1. Klik **Tambah Karyawan** dari halaman daftar.
2. Isi **Nama Lengkap**, **NIK/KTP**, dan **Email Kerja**.
3. Pilih **Unit Organisasi**, **Posisi / Jabatan**, dan **Tanggal Bergabung**
   (wajib). Pilih **Manajer Langsung** bila ada.
4. (Opsional) lengkapi alamat, data pribadi tambahan, custom fields, dan
   riwayat tambahan.
5. Tentukan apakah **Akses Akun Login** dibuat otomatis.
6. Klik **Simpan Karyawan**.

## Hasil Setelah Simpan

- Bila **Akses Akun Login** aktif, muncul modal **Password Sementara Akun
  Login**. Salin password, lalu klik **Tutup** (tombol baru aktif setelah
  password disalin) untuk kembali ke daftar.
- Bila tidak membuat akun, halaman langsung kembali ke daftar karyawan.

## Pesan Validasi

| Kondisi | Pesan |
|---|---|
| Ada field wajib kosong | **"Mohon Lengkapi Form"** — Nama lengkap, NIK, email, unit organisasi, posisi, dan tanggal bergabung wajib diisi. |

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/create.vue` |
| Alamat | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrAddressFields.vue` |
| Riwayat | `HR-SYSTEM-BACKOFFICE/app/components/core-hr/CoreHrRecordListEditor.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useEmployees.ts`, `useEmployeeRecordSections.ts`, `useEmployeeFields.ts`, `useOrgUnits.ts`, `usePositions.ts` |
| Endpoint | `modules/core-hr/04-api-contract.md` |
