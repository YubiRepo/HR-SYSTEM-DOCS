# 06 · Leave Types (Jenis Cuti)

Mengatur jenis cuti yang bisa diajukan karyawan: jatah (kuota), cara saldo
bertambah, sisa akhir periode (carry-over), syarat masa kerja, dan siapa yang
berhak. Preset cuti sesuai regulasi Indonesia sudah tersedia otomatis;
perusahaan bisa mengubahnya atau menambah jenis cuti sendiri.

**Akses:** `/tenants/hr-setting/leave-types` · **Permission:** menu tampil bila
fitur `leave` aktif dan punya `leave:config` atau `settings:write`; tambah &
ubah jenis cuti butuh `leave:config`

## Tampilan

<!-- ui-mock: hr-setting-leave-types -->
```html
<div aria-label="Mockup Leave Types" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Leave Types</div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
        <div><div style="font-weight:800;font-size:16px">Leave Types</div><div style="color:#71717a;font-size:11px;margin-top:3px">Configure Indonesian labor law presets (Labor Law &amp; Child Support Law) and customize company-specific policies.</div></div>
        <div style="display:flex;gap:8px;white-space:nowrap">
          <span style="border:1px solid #e4e4e7;background:#fff;border-radius:8px;padding:6px 12px;font-weight:600">&#8635; Refresh</span>
          <span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">+ Add Custom Leave Type</span>
        </div>
      </div>
      <div style="margin-top:12px;border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa;width:280px">Search leave type code or name...</div>
      <div style="margin-top:10px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden;font-size:12px">
        <div style="display:grid;grid-template-columns:1.8fr 0.9fr 0.7fr 0.8fr 0.9fr 0.9fr 0.7fr 0.7fr 30px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
          <div style="padding:9px 10px">Leave Type</div><div style="padding:9px 6px">Pay Treatment</div><div style="padding:9px 6px">Quota</div><div style="padding:9px 6px">Accrual</div><div style="padding:9px 6px">Document</div><div style="padding:9px 6px">Carry-Over</div><div style="padding:9px 6px">Eligibility</div><div style="padding:9px 6px">Status</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:1.8fr 0.9fr 0.7fr 0.8fr 0.9fr 0.9fr 0.7fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:8px;align-items:center"><span style="width:8px;height:8px;border-radius:9px;background:#3b82f6"></span><div><b>Cuti Tahunan</b> <span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:0 6px;font-size:10px">Preset</span><div style="color:#71717a;font-size:10px;font-family:monospace">annual</div></div></div>
          <div style="padding:9px 6px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Paid</span></div>
          <div style="padding:9px 6px;font-family:monospace">12 days</div><div style="padding:9px 6px;font-family:monospace">Upfront</div>
          <div style="padding:9px 6px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Not required</span></div>
          <div style="padding:9px 6px">Max 6 days<div style="color:#71717a;font-size:10px;font-family:monospace">use by 03-31</div></div>
          <div style="padding:9px 6px">All</div>
          <div style="padding:9px 6px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">&#8943;</div>
        </div>
        <div style="display:grid;grid-template-columns:1.8fr 0.9fr 0.7fr 0.8fr 0.9fr 0.9fr 0.7fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:8px;align-items:center"><span style="width:8px;height:8px;border-radius:9px;background:#f59e0b"></span><div><b>Cuti Sakit</b> <span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:0 6px;font-size:10px">Preset</span><div style="color:#71717a;font-size:10px;font-family:monospace">sick</div></div></div>
          <div style="padding:9px 6px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Paid</span></div>
          <div style="padding:9px 6px;font-family:monospace">Unlimited</div><div style="padding:9px 6px;font-family:monospace">None</div>
          <div style="padding:9px 6px"><span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:1px 8px;font-size:10px">Required</span></div>
          <div style="padding:9px 6px">None</div><div style="padding:9px 6px">All</div>
          <div style="padding:9px 6px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">&#8943;</div>
        </div>
        <div style="display:grid;grid-template-columns:1.8fr 0.9fr 0.7fr 0.8fr 0.9fr 0.9fr 0.7fr 0.7fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:8px;align-items:center"><span style="width:8px;height:8px;border-radius:9px;background:#f43f5e"></span><div><b>Cuti Melahirkan</b> <span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:0 6px;font-size:10px">Preset</span><div style="color:#71717a;font-size:10px;font-family:monospace">maternity</div></div></div>
          <div style="padding:9px 6px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Paid</span></div>
          <div style="padding:9px 6px;font-family:monospace">90 days</div><div style="padding:9px 6px;font-family:monospace">None</div>
          <div style="padding:9px 6px"><span style="background:#fef3c7;color:#b45309;border-radius:6px;padding:1px 8px;font-size:10px">Required</span></div>
          <div style="padding:9px 6px">None</div><div style="padding:9px 6px">Female</div>
          <div style="padding:9px 6px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">&#8943;</div>
        </div>
        <div style="display:grid;grid-template-columns:1.8fr 0.9fr 0.7fr 0.8fr 0.9fr 0.9fr 0.7fr 0.7fr 30px;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:8px;align-items:center"><span style="width:8px;height:8px;border-radius:9px;background:#2563eb"></span><div><b>Cuti Ulang Tahun</b><div style="color:#71717a;font-size:10px;font-family:monospace">birthday</div></div></div>
          <div style="padding:9px 6px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Paid</span></div>
          <div style="padding:9px 6px;font-family:monospace">1 days</div><div style="padding:9px 6px;font-family:monospace">Upfront</div>
          <div style="padding:9px 6px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Not required</span></div>
          <div style="padding:9px 6px">None</div><div style="padding:9px 6px">All</div>
          <div style="padding:9px 6px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Inactive</span></div><div style="color:#71717a">&#8943;</div>
        </div>
      </div>
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
| **Refresh** | Muat ulang daftar jenis cuti |
| **Add Custom Leave Type** | Buka modal jenis cuti baru (tampil bila punya `leave:config`) |
| Kolom pencarian | *Search leave type code or name...* — saat ini hanya mencocokkan **kode** jenis cuti |
| **⋯** (aksi baris) | **Edit Rules** — buka modal ubah kebijakan |

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Leave Type** | Titik warna, nama jenis cuti, badge **Preset** (bawaan regulasi), dan kode |
| **Pay Treatment** | **Paid** (hijau) atau **Unpaid** (merah) |
| **Quota** | Jatah per periode, mis. *12 days*, atau *Unlimited* bila tanpa batas |
| **Accrual** | Cara saldo bertambah: *Upfront*, *Monthly*, atau *None* |
| **Document** | **Required** bila pengajuan wajib melampirkan dokumen, selain itu **Not required** |
| **Carry-Over** | *None*, *Full*, atau *Max (n) days*; bila ada batas pakai tampil *use by (MM-DD)* |
| **Eligibility** | Gender yang berhak: *All*, *Female*, atau *Male* |
| **Status** | **Active** (bisa diajukan) atau **Inactive** |

> Daftar menampilkan semua jenis cuti, termasuk yang **Inactive**. Jenis cuti
> nonaktif tidak muncul di form pengajuan cuti karyawan.

## Modal Add Custom Leave Type / Edit Leave Type Policy

Deskripsi: *"Configure eligibility, quota, accrual, and carry-over for this
leave policy."*

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Leave Type Code** | teks | Ya | Placeholder *e.g. annual, custom_vac*. **Tidak bisa diubah** saat edit | `birthday` |
| **Leave Type Name** | teks | Ya | Placeholder *e.g. Birthday Leave* | Cuti Ulang Tahun |
| **Paid** | centang | — | *Counted as paid leave*. Default tercentang | Ya |
| **Requires Document** | centang | — | *Supporting file needed* — karyawan wajib melampirkan bukti (mis. surat dokter) | Tidak |
| **Active** | centang | — | *Can be requested*. Hanya muncul saat edit | Ya |
| **Carry-Over at Period End** | pilihan | Tidak | **None (leftover expires)**, **Full (carry everything over)**, **Limited (up to a maximum)**. Default None | Limited (up to a maximum) |
| **Max Carry-Over Days** | angka | Ya bila Limited | Minimal 0. Hanya muncul untuk **Limited** | 6 |
| **Use Carried Days By (MM-DD)** | teks | Tidak | Placeholder *e.g. 03-31 (optional)*. Muncul bila carry-over bukan None. Keterangan: *"Recorded on the policy; carried days don't expire automatically yet."* | 03-31 |
| **Quota (Days)** | angka | Tidak | Placeholder *Blank = unlimited*. Default 12 | 12 |
| **Minimum Tenure (Months)** | angka | Tidak | Masa kerja minimal sebelum karyawan berhak. Default 0 | 12 |
| **Balance Accrual Mode** | pilihan | Tidak | **Upfront (Start of Period)**, **Monthly (quota ÷ 12, credited each month)**, **None (No Accrual)**. Default Upfront. Saat edit: *"Applies to balances opened after saving; balances already running keep their current accrual."* | Upfront (Start of Period) |
| **Target Gender (Eligibility)** | pilihan | Tidak | **All Employees**, **Female Only**, **Male Only** | All Employees |

Tombol: **Cancel** / **Save Leave Policy**. Berhasil → toast **Leave Type
Created** atau **Leave Type Updated**; gagal → **Failed to Create Leave Type** /
**Failed to Update Leave Type**.

### Pesan Validasi

| Kondisi | Toast |
|---|---|
| Kode atau nama kosong | **Form Incomplete** — *A code and name for the leave type are required.* |
| Akrual Monthly tanpa kuota | **Quota Required** — *Monthly accrual needs a quota to accrue — set Quota (Days) or pick another accrual mode.* |
| Carry-over Limited tanpa batas | **Max Carry-Over Required** — *Limited carry-over needs a maximum number of days (0 or more).* |
| Format tanggal salah | **Invalid Expiry Date** — *Use MM-DD, e.g. 03-31 for 31 March.* |

## Arti Setiap Pengaturan bagi Karyawan

| Pengaturan | Dampak |
|---|---|
| **Quota (Days)** | Jatah hari per periode. Kosong = tanpa batas (cocok untuk cuti per kejadian seperti cuti sakit) |
| **Upfront** | Seluruh jatah langsung tersedia sejak saldo dibuka, mis. 12 hari di awal tahun |
| **Monthly** | Jatah dicicil: kuota ÷ 12 ditambahkan tiap awal bulan (dibulatkan ke bawah per 0,5 hari). Karyawan baru mendapat saldo bertahap sejak bulan masuk |
| **None** | Tidak ada akrual bertahap; jatah penuh tersedia sejak saldo dibuka (untuk cuti per kejadian) |
| **Minimum Tenure (Months)** | Karyawan baru berhak setelah masa kerjanya mencapai angka ini. Contoh: Upfront + 12 bulan → belum ada jatah di bulan 1–11, genap 12 bulan langsung dapat 12 hari |
| **Carry-Over** | Sisa saldo akhir periode: **None** hangus, **Full** dibawa semua, **Limited** dibawa maksimal sesuai **Max Carry-Over Days** |
| **Use Carried Days By** | Batas pemakaian sisa yang dibawa; saat ini hanya dicatat, sisa **belum** hangus otomatis |
| **Paid** | Menentukan apakah hari cuti dibayar atau dipotong saat penggajian |
| **Target Gender** | Hanya karyawan dengan gender tersebut yang bisa mengajukan, mis. Cuti Melahirkan untuk perempuan |

## Langkah — Mengubah Preset Cuti Tahunan

1. Buka **HR Setting → Leave Types**.
2. Pada baris **Cuti Tahunan**, klik **⋯ → Edit Rules**.
3. Ubah **Quota (Days)**, **Minimum Tenure (Months)**, atau **Carry-Over at
   Period End** sesuai kebijakan perusahaan.
4. Klik **Save Leave Policy**.

## Langkah — Menambah Jenis Cuti Sendiri

1. Klik **Add Custom Leave Type**.
2. Isi **Leave Type Code** (mis. `birthday`) dan **Leave Type Name** (mis.
   Cuti Ulang Tahun).
3. Atur **Paid**, **Requires Document**, kuota, akrual, carry-over, dan
   **Target Gender (Eligibility)**.
4. Klik **Save Leave Policy**. Jenis cuti baru langsung bisa diajukan karyawan.

## Langkah — Menonaktifkan Jenis Cuti

1. Klik **⋯ → Edit Rules** pada jenis cuti.
2. Hapus centang **Active**, lalu klik **Save Leave Policy**. Status berubah
   menjadi **Inactive** dan jenis cuti hilang dari pilihan pengajuan.

## Catatan & Aturan

- Jenis cuti tidak bisa dihapus — gunakan **Active** untuk menonaktifkan.
- Persetujuan cuti selalu satu tahap oleh atasan langsung dan tidak bisa
  diatur di halaman ini.
- Perubahan **Balance Accrual Mode** hanya berlaku untuk saldo yang dibuka
  setelah disimpan.
- Saat edit, mengosongkan **Quota (Days)** tidak mengubah kuota menjadi
  tanpa batas — kuota lama tetap tersimpan.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/leave-types.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useLeaveTypes.ts` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useLeaveApprovalFlows.ts` |
| Gate menu | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Modul | [Jenis Cuti](/modules/leave/02-leave-types), [Saldo & Akrual](/modules/leave/03-balance-accrual) |
