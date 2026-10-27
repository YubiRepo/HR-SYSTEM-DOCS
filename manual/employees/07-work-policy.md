# 07 · Work Policy (OT Type & Working Time)

Tab **Work Policy** pada halaman detail karyawan. Menetapkan kebijakan kerja
yang melekat ke satu karyawan: **OT Type** (jenis lembur yang berlaku) dan
**Working Time** (shift/jam kerja default). Setiap perubahan dicatat dengan
tanggal efektif sehingga riwayatnya bisa ditelusuri.

> **Penting — status: rencana.** Tab ini **belum tersedia** di aplikasi
> backoffice maupun API. Dokumen ini adalah spesifikasi UI & alur yang disepakati
> untuk dibangun. Saat fitur dirilis, perbarui dokumen ini mengikuti label dan
> perilaku aktual (lihat [RULES §4](../RULES.md)) lalu hapus catatan ini.

**Akses:** tab di `/tenants/employee/:id` · **Permission (usulan):**
`employees:read` (lihat), `employees:write` (ubah)

## Konsep

| Istilah | Arti | Sumber data |
|---|---|---|
| **OT Type** | Jenis lembur yang berlaku untuk karyawan, mis. *Lembur Reguler (Kepmenaker 102/2004)*, *Lembur Lumpsum*, *Tidak Berhak Lembur*. | Master baru **Overtime Types** (HR Setting) — belum ada |
| **Working Time** | Shift/jam kerja default karyawan, mis. *Office Hour 08:00–17:00*. | Master shift di **HR Setting → Working Time** (sudah ada) |
| **Effective Date** | Tanggal mulai berlakunya kombinasi OT Type + Working Time. | — |

Shift disimpan sebagai **field langsung** pada karyawan (bukan lewat Working
Time Patterns / schedule pattern).

## Tampilan

<!-- ui-mock: employees-work-policy -->
```html
<div aria-label="Mockup Work Policy" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
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
      <span style="padding:8px 14px;color:#71717a">Profile</span>
      <span style="padding:8px 14px;color:#71717a">Contracts</span>
      <span style="padding:8px 14px;color:#71717a">Career History</span>
      <span style="padding:8px 14px;border-bottom:2px solid #2563eb;color:#2563eb;font-weight:600">Work Policy</span>
      <span style="padding:8px 14px;color:#71717a">Others</span>
      <span style="padding:8px 14px;color:#71717a">Account Settings</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
      <div>
        <div style="font-weight:700;font-size:12px;color:#3f3f46">Current Work Policy</div>
        <div style="color:#71717a;font-size:11px;margin-top:2px">Effective since 2026-01-01</div>
      </div>
      <span style="border:1px solid #2563eb;color:#2563eb;border-radius:8px;padding:5px 12px;font-weight:600">✎ Change Policy</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
      <div style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:14px">
        <div style="color:#71717a;font-size:11px">⏱ OT Type</div>
        <div style="font-weight:700;font-size:15px;margin-top:4px">Lembur Reguler</div>
        <div style="color:#71717a;font-size:11px;font-family:monospace;margin-top:2px">OT-REG</div>
        <div style="color:#52525b;font-size:12px;margin-top:8px">Hourly overtime per Kepmenaker 102/2004 (1.5× first hour, 2× next hours).</div>
      </div>
      <div style="border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:14px">
        <div style="color:#71717a;font-size:11px">🕗 Working Time</div>
        <div style="font-weight:700;font-size:15px;margin-top:4px">Office Hour <span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:11px;font-weight:500">Fixed Hours</span></div>
        <div style="color:#71717a;font-size:11px;font-family:monospace;margin-top:2px">SHIFT-OH</div>
        <div style="color:#52525b;font-size:12px;margin-top:8px">08:00 – 17:00 · Break 12:00 – 13:00 · 8h effective</div>
      </div>
    </div>
    <div style="font-weight:700;font-size:12px;color:#3f3f46;margin-top:18px">Policy History</div>
    <div style="margin-top:8px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
      <div style="display:grid;grid-template-columns:110px 1fr 1fr 1.3fr 110px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
        <div style="padding:9px 10px">Effective Date</div><div style="padding:9px 10px">OT Type</div><div style="padding:9px 10px">Working Time</div><div style="padding:9px 10px">Remark</div><div style="padding:9px 10px">Updated By</div>
      </div>
      <div style="display:grid;grid-template-columns:110px 1fr 1fr 1.3fr 110px;border-bottom:1px solid #f4f4f5">
        <div style="padding:9px 10px;font-family:monospace;font-size:11px">2026-01-01</div><div style="padding:9px 10px">Lembur Reguler</div><div style="padding:9px 10px">Office Hour</div><div style="padding:9px 10px;color:#71717a">Pindah ke tim produk</div><div style="padding:9px 10px;color:#71717a">Siti R.</div>
      </div>
      <div style="display:grid;grid-template-columns:110px 1fr 1fr 1.3fr 110px">
        <div style="padding:9px 10px;font-family:monospace;font-size:11px">2024-02-01</div><div style="padding:9px 10px">Tidak Berhak Lembur</div><div style="padding:9px 10px">Shift Pagi</div><div style="padding:9px 10px;color:#71717a">—</div><div style="padding:9px 10px;color:#71717a">Siti R.</div>
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

## Elemen

| Elemen | Fungsi |
|---|---|
| **Current Work Policy** | Judul bagian + *Effective since …* (tanggal mulai) dari penugasan yang sedang berlaku |
| **Change Policy** | Buka modal ubah kebijakan (`employees:write`) |
| Kartu **OT Type** | Nama, kode, dan deskripsi singkat jenis lembur |
| Kartu **Working Time** | Nama shift, kode, badge tipe (*Fixed Hours* / *Flexible (WFH)*), jam kerja, istirahat, dan durasi efektif |
| **Policy History** | Tabel riwayat penugasan, terbaru di atas |
| Kosong | *No work policy assigned yet.* + tombol **Assign Policy** |

### Kolom Policy History

| Kolom | Isi |
|---|---|
| **Effective Date** | Tanggal mulai berlaku |
| **OT Type** | Nama OT Type saat itu |
| **Working Time** | Nama shift saat itu |
| **Remark** | Catatan perubahan |
| **Updated By** | User yang melakukan perubahan |

## Modal Change Work Policy

Deskripsi modal: *"A new policy is recorded from its effective date — earlier
history is kept."*

| Field | Tipe | Wajib | Validasi / Catatan | Contoh |
|---|---|---|---|---|
| **OT Type** | pilihan (master Overtime Types, aktif saja) | Ya | Default: OT Type yang berlaku | Lembur Reguler |
| **Working Time** | pilihan (shift aktif dari HR Setting → Working Time) | Ya | Menampilkan nama, kode, dan jam kerja; default: shift yang berlaku | Office Hour (08:00–17:00) |
| **Effective Date** | tanggal | Ya | Default: hari ini; tidak boleh sebelum tanggal efektif penugasan terakhir | 2026-11-01 |
| **Remark** | teks panjang | Tidak | Maks 255 karakter | Pindah ke tim produk |

Tombol: **Cancel** / **Save Policy**.

## Langkah — Mengubah Work Policy

1. Buka detail karyawan → tab **Work Policy**.
2. Klik **Change Policy** (atau **Assign Policy** bila belum ada).
3. Pilih **OT Type** dan **Working Time**.
4. Isi **Effective Date** dan **Remark** bila perlu.
5. Klik **Save Policy**. Kartu atas menampilkan kebijakan baru bila tanggal
   efektifnya sudah lewat/hari ini, dan baris baru muncul di **Policy History**.

## Catatan & Aturan

- Perubahan **langsung diterapkan** tanpa approval (sama seperti
  **Actions → Transfer or promotion**).
- Penugasan dengan **Effective Date** di masa depan tampil di **Policy
  History** dan baru menjadi *Current Work Policy* saat tanggalnya tiba.
- Hanya OT Type dan shift yang berstatus aktif yang bisa dipilih. Menonaktifkan
  master tidak menghapus riwayat karyawan yang sudah memakainya.
- **OT Type** menentukan apakah dan bagaimana lembur karyawan dihitung (dipakai
  oleh **Attendance → Overtime Request** dan **Salary**).
- **Working Time** menjadi jam kerja default karyawan untuk perhitungan
  absensi (terlambat, pulang cepat, lembur).

## Keputusan Terbuka

Hal berikut perlu diputuskan sebelum implementasi dan diperbarui di dokumen ini:

1. **Prioritas shift vs Working Time Patterns** — apakah **Working Time** di
   tab ini menimpa schedule pattern (dept/position/group/individu), atau hanya
   dipakai bila tidak ada pattern yang berlaku.
2. **Isi master Overtime Types** — field apa saja (mis. metode hitung: per jam
   Kepmenaker / lumpsum / tidak berhak; pengali; butuh approval) dan di menu
   mana (usulan: **HR Setting → Overtime Types**).
3. **Diisi saat tambah karyawan?** — apakah form **Add Employee** perlu bagian
   *Work Policy* opsional, atau cukup lewat tab ini.
4. **Ikut Mutasi?** — apakah pengajuan Mutasi bisa sekaligus mengubah Work
   Policy.
5. **Permission** — memakai `employees:write` atau permission baru.

## Sumber

| Jenis | Path |
|---|---|
| Halaman induk | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/[id].vue` *(tab belum ada)* |
| Master shift | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/working-time/index.vue`, `app/composables/useShifts.ts` |
| Master OT Type | *(belum ada)* |
| Endpoint | *(belum ada — akan ditambahkan ke `modules/core-hr/04-api-contract.md`)* |
| Modul terkait | `modules/attendance/02-shift-schedule.md` |
