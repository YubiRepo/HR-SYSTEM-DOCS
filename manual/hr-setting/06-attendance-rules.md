# 06 · Attendance Rules (Aturan Presensi)

Mengatur kebijakan absensi: toleransi telat, aturan lembur, geofence kantor, dan
auto clock-out bila karyawan lupa absen pulang.
Kebijakan dibuat sekali untuk seluruh perusahaan (**Default Tenant**) dan bisa
ditimpa per cabang.

**Akses:** `/tenants/hr-setting/attendance-rules` · **Permission:** menu tampil
bila fitur `attendance` aktif dan punya `attendance:read`; menyimpan kebijakan
butuh `attendance:config`

## Tampilan

<!-- ui-mock: hr-setting-attendance-rules -->
```html
<div aria-label="Mockup Attendance Rules" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Attendance Rules</div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #e4e4e7;padding-bottom:10px">
        <div><div style="font-weight:800;font-size:15px">Attendance Rules</div><div style="color:#71717a;font-size:11px;margin-top:3px">Configure lateness tolerance, overtime rounding, geofence, and auto clock-out per branch or tenant-wide. Working days are set on each working pattern in <span style="color:#2563eb">Working Patterns</span>.</div></div>
        <span style="border:1px solid #e4e4e7;background:#fff;border-radius:8px;padding:5px 10px;font-weight:600;font-size:11px;white-space:nowrap">&#8635; Refresh</span>
      </div>
      <div style="margin-top:12px;border:1px solid #e4e4e7;background:#fff;border-radius:14px;padding:12px 14px">
        <div style="font-weight:700">Attendance, Overtime &amp; Lateness Tolerance Policies</div>
        <div style="color:#71717a;font-size:11px;margin-top:2px">Expand the Tenant Default or any branch below to view its full policy, or edit it directly. A branch without its own policy follows the Tenant Default.</div>
      </div>
      <div style="margin-top:12px;border:1px solid #e4e4e7;background:#fff;border-radius:12px;padding:10px 14px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="width:30px;height:30px;border-radius:8px;background:#f4f4f5;display:grid;place-items:center;color:#71717a">&#127970;</span>
          <div style="flex:1"><div style="font-weight:700;font-size:12px">Default Tenant</div><div style="color:#71717a;font-size:11px;font-family:monospace">Late 15m · OT 30m/30m · Geofence 100m</div></div>
          <span style="color:#71717a">&#9650;</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;font-size:12px">
          <div style="display:flex;justify-content:space-between;background:#f4f4f5;border-radius:8px;padding:8px 10px"><span style="color:#71717a">Lateness Tolerance</span><b>15 min</b></div>
          <div style="display:flex;justify-content:space-between;background:#f4f4f5;border-radius:8px;padding:8px 10px"><span style="color:#71717a">OT Threshold / Rounding</span><b>30m / 30m</b></div>
          <div style="display:flex;justify-content:space-between;background:#f4f4f5;border-radius:8px;padding:8px 10px"><span style="color:#71717a">Approval Required</span><b>Yes</b></div>
          <div style="display:flex;justify-content:space-between;background:#f4f4f5;border-radius:8px;padding:8px 10px"><span style="color:#71717a">Geofence</span><b>100 m radius</b></div>
          <div style="grid-column:span 2;display:flex;justify-content:space-between;background:#f4f4f5;border-radius:8px;padding:8px 10px"><span style="color:#71717a">Auto Clock-Out</span><b>23 hrs cap · 30 min reminder</b></div>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:10px"><span style="border:1px solid #e4e4e7;border-radius:8px;padding:4px 10px;font-weight:600;font-size:11px">&#9881; Edit</span></div>
      </div>
      <div style="margin-top:8px;border:1px solid #e4e4e7;background:#fff;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:10px">
        <span style="width:30px;height:30px;border-radius:8px;background:#f4f4f5;display:grid;place-items:center;color:#71717a">&#127971;</span>
        <div style="flex:1"><div style="font-weight:700;font-size:12px">Jakarta HQ</div><div style="color:#71717a;font-size:11px;font-family:monospace">Late 15m · OT 30m/30m · Geofence 100m</div></div>
        <span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Follows Tenant Default</span>
        <span style="color:#71717a">&#9660;</span>
      </div>
      <div style="margin-top:8px;border:1px solid #e4e4e7;background:#fff;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:10px">
        <span style="width:30px;height:30px;border-radius:8px;background:#f4f4f5;display:grid;place-items:center;color:#71717a">&#127971;</span>
        <div style="flex:1"><div style="font-weight:700;font-size:12px">Kantor Cabang Makassar</div><div style="color:#71717a;font-size:11px;font-family:monospace">Late 10m · OT 60m/60m · Geofence Off</div></div>
        <span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">Own Policy</span>
        <span style="color:#71717a">&#9660;</span>
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
| Teks pengantar | *"Working days are set on each working pattern in Working Patterns."* dengan tautan ke **Working Patterns**. Hari kerja diatur per hari pada pola **Fixed** di halaman tersebut |
| **Refresh** | Muat ulang kebijakan Default Tenant dan semua cabang |
| Daftar kebijakan (accordion) | Baris pertama **Default Tenant** (terbuka otomatis), lalu satu baris per cabang. Klik baris untuk membuka/menutup rinciannya; beberapa baris boleh terbuka bersamaan |
| Ringkasan baris | `Late (menit)m · OT (ambang)m/(pembulatan)m · Geofence (radius)m` atau `Geofence Off`; *No policy configured* bila belum ada kebijakan |
| Badge cabang | **Own Policy** — cabang punya kebijakan sendiri; **Follows Tenant Default** — cabang mengikuti Default Tenant |
| **Edit** | Ubah kebijakan Default Tenant atau kebijakan sendiri milik cabang |
| **Set Own Policy** | Pada cabang yang masih mengikuti Default Tenant: buat kebijakan khusus cabang itu |
| **Create Policy** | Pada Default Tenant yang belum punya kebijakan (*No policy configured for this scope yet.*) |

> Tombol **Edit**/**Set Own Policy**/**Create Policy** tampil untuk semua
> pengguna yang bisa membuka halaman, tetapi penyimpanan ditolak bila tidak
> punya `attendance:config` (muncul toast gagal).

### Rincian Kebijakan (isi accordion)

| Baris | Isi |
|---|---|
| **Lateness Tolerance** | Toleransi telat, mis. *15 min* |
| **OT Threshold / Rounding** | Ambang mulai lembur / pembulatan lembur, mis. *30m / 30m* |
| **Approval Required** | **Yes**/**No** — lembur perlu persetujuan atasan |
| **Geofence** | *(radius) m radius* atau *Off* |
| **Auto Clock-Out** | *(cap) hrs cap · (pengingat) min reminder* atau *Off* |

## Modal Edit Policy — (nama cakupan)

Judul modal: **Edit Policy — Default Tenant** atau **Edit Policy — (nama
cabang)**. Deskripsi: *"Configure clock-in lateness grace period and employee
overtime rounding rules."* Bila kebijakan sudah ada, form terisi nilainya; saat
**Set Own Policy** pada cabang yang mengikuti default, form terisi nilai Default
Tenant sebagai titik awal.

Di bagian atas modal ada kotak info: *"Working days and shifts are no longer set
here: working days live on each working pattern, and every employee's schedule
comes from the schedule type + working pattern on their career path."* dengan
tombol **Open Working Patterns** untuk pindah ke halaman pola. Hari kerja kini
diatur per hari pada pola **Fixed** di **Working Patterns**, bukan pada shift.

### Telat & Lembur

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Lateness Tolerance (Min)** | angka | Ya | *"Still On-Time within this many minutes."* Batas isian 0–60 | 15 |
| **OT Starts After (Min)** | angka | Ya | *"Minutes after shift end that are not counted."* Batas isian 0–120 | 30 |
| **Rounding Unit (Min)** | angka | Ya | *"e.g. 30 or 60; 0 = no rounding."* Batas isian 0–60 | 30 |
| **Rounding Tolerance (Min)** | angka | Tidak | *"A leftover this close to a full unit counts as one unit."* Harus lebih kecil dari Rounding Unit. Di bawah field tampil contoh hasil, mis. *"85 min after shift end → 60 min OT"* | 5 |
| **Overtime Rule** | pilihan | Tidak | Overtime Rule aktif (HR Setting → Overtime Rules); *None* = lembur cabang ini tidak diproses | OT-5D |
| **Requires Direct Manager Approval** | sakelar | — | *"Only approved overtime is forwarded to the Payroll component."* Default aktif | Aktif |

### Office Geofence

*"Require clock-in/out within the office radius."* Sakelar; bila aktif muncul:

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Radius (Meters)** | angka | Ya | Batas isian 10–5000 | 100 |
| **Office Latitude** | angka desimal | Tidak | Placeholder *-6.200000* | -6.208763 |
| **Office Longitude** | angka desimal | Tidak | Placeholder *106.816666* | 106.845599 |

### Auto Clock-Out

*"Auto-close a record that forgot to clock out."* Sakelar; bila aktif muncul:

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Forgot Cap (Hours)** | angka | Ya | *"Runs after this duration."* Batas isian 1–48 | 23 |
| **Reminder (Min)** | angka | Ya | *"Sent before the cap."* Batas isian 0–180 | 30 |

Tombol: **Cancel** / **Save Policy**. Berhasil → toast **Attendance Rule
Updated**; gagal → **Failed to Update Attendance Rule**. Bila memuat gagal muncul
**Failed to Load Attendance Rule** atau **Failed to Load Branch List**.

## Arti Setiap Pengaturan bagi Karyawan

| Pengaturan | Dampak |
|---|---|
| **Lateness Tolerance** | Karyawan yang clock-in masih dalam toleransi tetap dihitung tepat waktu. Contoh: shift 08:00, toleransi 15 → clock-in 08:12 tepat waktu; 08:20 dicatat telat |
| **OT Starts After** | Lembur dihitung mulai `jam pulang + nilai ini`; menit sebelumnya dibuang. Contoh: 30 → pulang 17:00, clock out 17:45 = lembur 15 menit |
| **Rounding Unit** | Durasi lembur dibulatkan ke bawah per kelipatan menit ini. Contoh: 30 → 1 jam 20 menit dihitung 1 jam |
| **Rounding Tolerance** | Sisa yang kurang dari toleransi untuk genap satu satuan disubsidi jadi satu satuan. Contoh: satuan 30, toleransi 5 → 55 menit dihitung 60, 54 menit dihitung 30 |
| **Overtime Rule** | Day type & tier (OT1, OT2, …) untuk memecah lembur cabang ini — lihat [`11-overtime-rules.md`](./11-overtime-rules.md) |
| **Requires Direct Manager Approval** | Bila aktif, hanya lembur yang disetujui atasan langsung yang masuk ke komponen gaji |
| **Office Geofence** | Bila aktif, clock-in/out dari aplikasi hanya diterima dalam radius dari titik kantor; di luar radius ditolak |
| **Auto Clock-Out** | Bila karyawan lupa clock-out, sesi yang terbuka lebih lama dari **Forgot Cap** ditutup otomatis oleh sistem dan ditandai otomatis agar HR bisa mengoreksinya. Karyawan menerima pengingat **Reminder** menit sebelum cap tercapai |

## Langkah — Mengatur Kebijakan Perusahaan

1. Buka **HR Setting → Attendance Rules**.
2. Pada baris **Default Tenant**, klik **Edit** (atau **Create Policy** bila
   belum ada).
3. Isi **Lateness Tolerance (Min)**, **OT Start Threshold (Min)**, dan **OT
   Rounding (Min)**.
4. Atur sakelar **Requires Direct Manager Approval**, **Office Geofence**, dan
   **Auto Clock-Out**, lalu lengkapi isiannya bila diaktifkan.
5. Klik **Save Policy**.

## Langkah — Membuat Kebijakan Khusus Cabang

1. Buka baris cabang berbadge **Follows Tenant Default**, mis. **Kantor Cabang
   Makassar**.
2. Klik **Set Own Policy**; form terisi nilai Default Tenant.
3. Ubah nilai yang berbeda untuk cabang ini, mis. **Lateness Tolerance (Min)**
   10 dan koordinat kantor Makassar.
4. Klik **Save Policy**. Badge cabang berubah menjadi **Own Policy**.

## Catatan & Aturan

- Kebijakan ini **tidak** lagi menentukan shift atau hari kerja. Shift (jam kerja
  & istirahat) diatur di **Working Time**
  ([`03-working-time.md`](./03-working-time.md)); hari kerja dan rotasi diatur di
  **Working Patterns** ([`04-working-patterns.md`](./04-working-patterns.md)).
  Jadwal tiap karyawan berasal dari tipe jadwal + pola kerja pada riwayat
  kariernya.
- Setiap cakupan hanya punya **satu** kebijakan: satu Default Tenant dan
  paling banyak satu per cabang. Menyimpan lagi akan menimpa kebijakan cakupan
  itu.
- Cabang tanpa kebijakan sendiri otomatis mengikuti Default Tenant, termasuk
  bila Default Tenant diubah kemudian. Cabang dengan **Own Policy** tidak ikut
  berubah.
- Saat menyimpan, seluruh isian dikirim ulang — field yang tidak terlihat
  (mis. radius saat geofence dimatikan) tetap tersimpan dengan nilai terakhir.
- Belum ada tombol untuk menghapus kebijakan cabang agar kembali mengikuti
  Default Tenant.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/attendance-rules.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useAttendanceRules.ts` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useTenantBranches.ts` |
| Gate menu | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Modul | [Pencatatan Absensi](/modules/attendance/03-attendance-recording), [Lembur & Keterlambatan](/modules/attendance/04-overtime-lateness), [Geofence](/modules/attendance/11-geofence) |
