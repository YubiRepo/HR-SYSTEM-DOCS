# 04 · Working Patterns (Pola Kerja)

Mengelola **pola kerja** — aturan hari kerja yang dipasang ke karyawan. Pola
**Fixed** menjalankan satu shift pada hari-hari tertentu (mis. Senin–Jumat);
pola **Rotation** memutar beberapa shift dan hari libur dalam satu siklus
(mis. 3 hari pagi, 3 hari malam, 1 hari libur). Halaman ini menggantikan menu
lama **Attendance → Working Time Patterns**.

**Akses:** `/tenants/hr-setting/working-patterns` (menu **HR Setting → Working
Patterns**) · **Permission:** menu tampil bila fitur **Attendance** aktif di
langganan dan punya `attendance:read`; **Add Pattern**, **Edit pattern**, dan
**Deactivate/Activate pattern** butuh `attendance:config`; **Generate
schedule** dan **Simulate** butuh `attendance:write`

## Hubungan Shift, Pola Kerja, dan Karyawan

| Lapisan | Diatur di | Isinya |
|---|---|---|
| **Shift** | **HR Setting → Working Time** ([`03-working-time.md`](./03-working-time.md)) | Hanya jam: masuk, pulang, istirahat, jendela absen |
| **Pola kerja** | Halaman ini | *Kapan* shift dipakai: hari kerja (Fixed) atau urutan shift & libur (Rotation) |
| **Penugasan karyawan** | Data karyawan: **Schedule Type** + **Pattern** saat menambah karyawan, atau lewat **Career Mutation** | Pola mana yang berlaku untuk karyawan dan sejak kapan |

Dengan kata lain: shift adalah "jam kerjanya", pola kerja adalah "jadwal
mingguan/siklusnya", dan karyawan dipasangkan ke **pola**, bukan langsung ke
shift. **Attendance Rules** tidak lagi menyimpan shift default maupun hari
kerja — aturan di sana hanya mengatur toleransi telat, lembur, lokasi absen,
dan sejenisnya ([`06-attendance-rules.md`](./06-attendance-rules.md)).

- **Pola Fixed** dihitung langsung (*resolved live*): begitu karyawan
  dipasangkan, jadwalnya langsung berlaku tanpa langkah tambahan.
- **Pola Rotation** baru menjadi jadwal harian setelah **Generate schedule**
  dijalankan untuk rentang tanggal tertentu.

## Tampilan

<!-- ui-mock: working-patterns-list -->
```html
<div aria-label="Mockup Working Patterns" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Working Patterns</div>
    <div style="padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #e4e4e7;padding-bottom:12px">
        <div><div style="font-weight:800;font-size:15px">Working Patterns</div><div style="color:#71717a;font-size:11px;margin-top:3px">What employees are assigned to. A fixed pattern runs one shift on set weekdays; a rotation cycles through shifts and days off and needs Generate to create schedule rows.</div></div>
        <div style="display:flex;gap:8px;white-space:nowrap">
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:5px 10px;font-size:11px">⟳ Refresh</span>
          <span style="background:#2563eb;color:#fff;border-radius:8px;padding:5px 10px;font-weight:600;font-size:11px">+ Add Pattern</span>
        </div>
      </div>
      <div style="margin-top:14px;display:flex;justify-content:space-between;border:1px solid #e4e4e7;border-radius:10px;background:#fafafa;padding:8px">
        <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;color:#a1a1aa;width:240px">🔍 Search pattern name...</span>
        <div style="display:flex;gap:8px">
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;font-size:11px">All modes ▾</span>
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;font-size:11px">All statuses ▾</span>
          <span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:6px 10px;font-size:11px">Display ⚙</span>
        </div>
      </div>
      <div style="margin-top:8px;border:1px solid #e4e4e7;border-radius:10px;background:#fff;overflow:hidden">
        <div style="display:grid;grid-template-columns:1.3fr 0.7fr 2.3fr 0.6fr 0.6fr 30px;background:#fafafa;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:11px;font-weight:600">
          <div style="padding:9px 10px">Name</div><div style="padding:9px 10px">Mode</div><div style="padding:9px 10px">Schedule</div><div style="padding:9px 10px">Employees</div><div style="padding:9px 10px">Status</div><div></div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 0.7fr 2.3fr 0.6fr 0.6fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#3b82f6;margin-top:4px"></span><div><div style="font-weight:700">Kantor Senin–Jumat</div><div style="color:#71717a;font-size:10px">Staf kantor Jakarta HQ</div></div></div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">📅 Fixed</span></div>
          <div style="padding:9px 10px"><div style="font-size:11px;font-weight:600">Shift Kantor Reguler <span style="font-family:monospace;color:#71717a;font-weight:400">08:00–17:00</span></div><div style="display:flex;gap:3px;margin-top:4px;font-size:10px;font-weight:700"><span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 5px">Mon</span><span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 5px">Tue</span><span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 5px">Wed</span><span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 5px">Thu</span><span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 5px">Fri</span><span style="background:#f4f4f5;color:#a1a1aa;border-radius:4px;padding:1px 5px">Sat</span><span style="background:#f4f4f5;color:#a1a1aa;border-radius:4px;padding:1px 5px">Sun</span></div></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">48</span></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋮</div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 0.7fr 2.3fr 0.6fr 0.6fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#ec4899;margin-top:4px"></span><div><div style="font-weight:700">Rotasi Gudang Regu A</div><div style="color:#71717a;font-size:10px">Kantor Cabang Makassar</div></div></div>
          <div style="padding:9px 10px"><span style="background:#e0f2fe;color:#0369a1;border-radius:6px;padding:1px 8px;font-size:10px">🔁 Rotation</span></div>
          <div style="padding:9px 10px"><div style="display:flex;gap:3px;font-size:10px;font-weight:600"><span style="background:#f59e0b;color:#fff;border-radius:4px;padding:1px 5px">3× Shift Pagi Gudang</span><span style="background:#8b5cf6;color:#fff;border-radius:4px;padding:1px 5px">3× Shift Malam Gudang</span><span style="background:#fff1f2;color:#f43f5e;border:1px dashed #fda4af;border-radius:4px;padding:0 5px">1× Off</span></div><div style="color:#71717a;font-size:10px;margin-top:4px">7-day cycle • anchor 2026-11-02 • offset 0</div></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">12</span></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋮</div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 0.7fr 2.3fr 0.6fr 0.6fr 30px;border-bottom:1px solid #f4f4f5;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#06b6d4;margin-top:4px"></span><div><div style="font-weight:700">Rotasi Gudang Regu B</div><div style="color:#71717a;font-size:10px">Regu kedua, bergeser 3 hari</div></div></div>
          <div style="padding:9px 10px"><span style="background:#e0f2fe;color:#0369a1;border-radius:6px;padding:1px 8px;font-size:10px">🔁 Rotation</span></div>
          <div style="padding:9px 10px"><div style="display:flex;gap:3px;font-size:10px;font-weight:600"><span style="background:#f59e0b;color:#fff;border-radius:4px;padding:1px 5px">3× Shift Pagi Gudang</span><span style="background:#8b5cf6;color:#fff;border-radius:4px;padding:1px 5px">3× Shift Malam Gudang</span><span style="background:#fff1f2;color:#f43f5e;border:1px dashed #fda4af;border-radius:4px;padding:0 5px">1× Off</span></div><div style="color:#71717a;font-size:10px;margin-top:4px">7-day cycle • anchor 2026-11-02 • offset 3</div></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">11</span></div>
          <div style="padding:9px 10px"><span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:1px 8px;font-size:10px">Active</span></div><div style="color:#71717a">⋮</div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 0.7fr 2.3fr 0.6fr 0.6fr 30px;align-items:center">
          <div style="padding:9px 10px;display:flex;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#10b981;margin-top:4px"></span><div><div style="font-weight:700">Kantor Senin–Sabtu</div></div></div>
          <div style="padding:9px 10px"><span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:1px 8px;font-size:10px">📅 Fixed</span></div>
          <div style="padding:9px 10px"><div style="font-size:11px;font-weight:600">Shift Kantor Reguler <span style="font-family:monospace;color:#71717a;font-weight:400">08:00–17:00</span></div><div style="display:flex;gap:3px;margin-top:4px;font-size:10px;font-weight:700"><span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 5px">Mon</span><span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 5px">Tue</span><span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 5px">Wed</span><span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 5px">Thu</span><span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 5px">Fri</span><span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 5px">Sat</span><span style="background:#f4f4f5;color:#a1a1aa;border-radius:4px;padding:1px 5px">Sun</span></div></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">0</span></div>
          <div style="padding:9px 10px"><span style="background:#f4f4f5;color:#52525b;border-radius:6px;padding:1px 8px;font-size:10px">Inactive</span></div><div style="color:#71717a">⋮</div>
        </div>
      </div>
      <div style="margin-top:8px;display:flex;justify-content:space-between;color:#71717a;font-size:11px"><span>Total 4 data.</span><span>Rows per page 10 · ‹ 1 ›</span></div>
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

<!-- ui-mock: working-patterns-rotation-form -->
```html
<div aria-label="Mockup Working Patterns Add Working Pattern" style="font-family:Inter,system-ui,sans-serif;width:960px;display:grid;grid-template-columns:200px 1fr;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;color:#18181b;font-size:13px">
  <aside style="background:#172554;color:#fff;padding:14px 12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-weight:800;font-size:15px;margin-bottom:10px">Easy&nbsp;HR</div>
    <div style="padding:8px 10px;color:#bfdbfe">Employees</div>
    <div style="padding:8px 10px;border-radius:8px;background:#2563eb;font-weight:600">HR Setting</div>
    <div style="padding:8px 10px;color:#bfdbfe">Leave</div>
    <div style="padding:8px 10px;color:#bfdbfe">Attendance</div>
    <div style="padding:8px 10px;color:#bfdbfe">Salary</div>
  </aside>
  <main>
    <div style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:15px;background:#fff">Working Patterns</div>
    <div style="padding:18px 20px;background:rgba(24,24,27,.35)">
      <div style="width:620px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;font-size:12px">
        <div style="padding:14px 16px;border-bottom:1px solid #e4e4e7"><div style="font-weight:700;font-size:14px">Add Working Pattern</div><div style="color:#71717a;font-size:11px;margin-top:2px">Cycles through shifts and days off from an anchor date. Schedule rows exist only after Generate.</div></div>
        <div style="padding:14px 16px;display:flex;flex-direction:column;gap:12px">
          <div><div style="font-weight:600;margin-bottom:4px">Mode *</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div style="border:1px solid #e4e4e7;background:#fafafa;border-radius:10px;padding:8px"><div style="font-weight:600">📅 Fixed</div><div style="color:#71717a;font-size:11px">One shift on set weekdays</div></div>
              <div style="border:1px solid #2563eb;background:#eff6ff;border-radius:10px;padding:8px"><div style="font-weight:600">🔁 Rotation</div><div style="color:#71717a;font-size:11px">Cycle of shifts and days off</div></div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 60px;gap:10px">
            <div><div style="font-weight:600;margin-bottom:4px">Pattern Name *</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 10px">Rotasi Gudang Regu A</div></div>
            <div><div style="font-weight:600;margin-bottom:4px">Color</div><div style="height:28px;border:1px solid #d4d4d8;border-radius:8px;background:#ec4899"></div></div>
          </div>
          <div style="border:1px solid #e4e4e7;background:#fafafa;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px">
            <div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:600">Rotation Sequence *</div><div style="color:#71717a;font-size:11px">Legs run in order, then the cycle repeats. Each leg is an active shift or a day off.</div></div><span style="border:1px solid #d4d4d8;background:#fff;border-radius:8px;padding:4px 8px;font-size:11px">+ Add leg</span></div>
            <div style="display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #e4e4e7;border-radius:8px;padding:6px"><b style="color:#71717a">1</b><span style="width:10px;height:10px;border-radius:50%;background:#f59e0b"></span><span style="flex:1;border:1px solid #d4d4d8;border-radius:6px;padding:4px 8px">Shift Pagi Gudang (OPS-AM) · 06:00–14:00</span><span style="border:1px solid #d4d4d8;border-radius:6px;padding:4px 8px;width:50px">3 d</span><span style="color:#71717a">˄ ˅ 🗑</span></div>
            <div style="display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #e4e4e7;border-radius:8px;padding:6px"><b style="color:#71717a">2</b><span style="width:10px;height:10px;border-radius:50%;background:#8b5cf6"></span><span style="flex:1;border:1px solid #d4d4d8;border-radius:6px;padding:4px 8px">Shift Malam Gudang (OPS-NT) · 22:00–06:00</span><span style="border:1px solid #d4d4d8;border-radius:6px;padding:4px 8px;width:50px">3 d</span><span style="color:#71717a">˄ ˅ 🗑</span></div>
            <div style="display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #e4e4e7;border-radius:8px;padding:6px"><b style="color:#71717a">3</b><span style="width:10px;height:10px;border-radius:50%;background:#fecdd3;border:1px solid #fda4af"></span><span style="flex:1;border:1px solid #d4d4d8;border-radius:6px;padding:4px 8px">Off (day off)</span><span style="border:1px solid #d4d4d8;border-radius:6px;padding:4px 8px;width:50px">1 d</span><span style="color:#71717a">˄ ˅ 🗑</span></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
            <div><div style="font-weight:600;margin-bottom:4px">Cycle Length</div><div style="border:1px solid #e4e4e7;background:#fafafa;border-radius:8px;padding:6px 10px;font-weight:700">7 days</div><div style="color:#71717a;font-size:11px">Sum of all legs.</div></div>
            <div><div style="font-weight:600;margin-bottom:4px">Anchor Date *</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 10px">02/11/2026</div><div style="color:#71717a;font-size:11px">Where the cycle is counted from.</div></div>
            <div><div style="font-weight:600;margin-bottom:4px">Phase Offset</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 10px">0</div><div style="color:#71717a;font-size:11px">Days to shift the cycle (e.g. a second crew).</div></div>
          </div>
          <div><div style="display:flex;justify-content:space-between"><b>Cycle Preview</b><span style="color:#71717a;font-size:11px">On 2026-11-02 the cycle is on day 1 (outlined).</span></div>
            <div style="display:flex;gap:4px;margin-top:6px;font-size:10px;font-weight:700;text-align:center">
              <div style="width:40px;background:#f59e0b;color:#fff;border-radius:6px;padding:3px 0;outline:2px solid #18181b">D1<br>OPS-AM</div>
              <div style="width:40px;background:#f59e0b;color:#fff;border-radius:6px;padding:3px 0">D2<br>OPS-AM</div>
              <div style="width:40px;background:#f59e0b;color:#fff;border-radius:6px;padding:3px 0">D3<br>OPS-AM</div>
              <div style="width:40px;background:#8b5cf6;color:#fff;border-radius:6px;padding:3px 0">D4<br>OPS-NT</div>
              <div style="width:40px;background:#8b5cf6;color:#fff;border-radius:6px;padding:3px 0">D5<br>OPS-NT</div>
              <div style="width:40px;background:#8b5cf6;color:#fff;border-radius:6px;padding:3px 0">D6<br>OPS-NT</div>
              <div style="width:40px;background:#fff1f2;color:#f43f5e;border:1px dashed #fda4af;border-radius:6px;padding:3px 0">D7<br>Off</div>
            </div>
          </div>
          <div><div style="font-weight:600;margin-bottom:4px">Description</div><div style="border:1px solid #d4d4d8;border-radius:8px;padding:6px 10px">Kantor Cabang Makassar</div></div>
        </div>
        <div style="padding:12px 16px;border-top:1px solid #e4e4e7;display:flex;justify-content:flex-end;gap:8px"><span style="padding:6px 12px">Cancel</span><span style="background:#2563eb;color:#fff;border-radius:8px;padding:6px 12px;font-weight:600">✓ Save Pattern</span></div>
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
| **Refresh** | Muat ulang daftar pola dan katalog shift |
| **Add Pattern** | Buka modal pola baru (tampil bila punya `attendance:config`) |
| Kolom pencarian | *Search pattern name...* — mencari nama pola di seluruh data (bukan hanya halaman yang tampil) |
| Filter mode | **All modes** / **Fixed** / **Rotation** |
| Filter status | **All statuses** / **Active** / **Inactive** |
| **Display** | Pilih kolom tabel yang ditampilkan |
| **⋮** (aksi baris) | Lihat tabel aksi di bawah |
| Footer tabel | *Total (n) data.*, **Rows per page** (default 10), dan navigasi halaman |

Bila belum ada pola (atau tidak ada yang cocok dengan filter), tabel
menampilkan *No working patterns yet.*

### Aksi Baris (⋮)

| Aksi | Muncul bila | Fungsi |
|---|---|---|
| **Edit pattern** | Punya `attendance:config` | Buka modal **Edit Working Pattern** |
| **Generate schedule** | Pola **Rotation** yang **Active**, dan punya `attendance:write` | Buka modal **Generate Schedule** |
| **Simulate** | Sama dengan **Generate schedule** | Pindah ke **Attendance → Rotation Simulations** dengan pola ini sudah terpilih dan form simulasi baru langsung terbuka |
| **Deactivate pattern** | Pola aktif, dan punya `attendance:config` | Buka konfirmasi nonaktif |
| **Activate pattern** | Pola nonaktif, dan punya `attendance:config` | Mengaktifkan kembali tanpa konfirmasi |

### Kolom Tabel

| Kolom | Isi |
|---|---|
| **Name** | Titik warna pola, nama pola, dan deskripsi (bila ada) |
| **Mode** | **Fixed** (biru) atau **Rotation** (biru muda, ikon putar) |
| **Schedule** | **Fixed:** nama shift + jamnya, lalu tujuh kotak hari **Mon**–**Sun** (hari kerja berwarna biru, hari libur abu-abu). **Rotation:** deretan *leg* berwarna sesuai shift, mis. *3× Shift Pagi Gudang*, *1× Off*, lalu baris *(n)-day cycle • anchor (tanggal) • offset (n)* |
| **Employees** | Jumlah karyawan yang saat ini memakai pola ini; `-` bila jumlahnya gagal dimuat |
| **Status** | **Active** (hijau) atau **Inactive** (abu-abu) |

## Modal Add Working Pattern / Edit Working Pattern

Deskripsi modal berubah sesuai mode:

- Fixed: *"One shift on the chosen weekdays. Resolved live — no generation
  needed."*
- Rotation: *"Cycles through shifts and days off from an anchor date. Schedule
  rows exist only after Generate."*

### Field umum

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Mode \*** | pilihan kartu | Ya | **Fixed** — *One shift on set weekdays*; **Rotation** — *Cycle of shifts and days off*. Default **Fixed**. Saat edit tidak bisa diubah: *"Mode is set at creation and can't be changed."* | Rotation |
| **Pattern Name \*** | teks | Ya | Placeholder *e.g. Office Mon–Fri* (Fixed) atau *e.g. Security 3-3-1 Rotation* (Rotation) | Rotasi Gudang Regu A |
| **Color** | pemilih warna | Tidak | Default biru `#3b82f6`; saat edit terisi warna pola (atau warna shift untuk pola Fixed tanpa warna sendiri) | Merah muda |
| **Description** | teks | Tidak | Placeholder *e.g. Warehouse security crew A* | Kantor Cabang Makassar |

### Field mode Fixed

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Shift \*** | pilihan + cari | Ya | Placeholder *Select an active shift*. Tiap opsi tampil sebagai *(nama) ((kode)) · (mulai)–(selesai)*. Hanya shift aktif; shift pola lama yang sudah nonaktif tetap tampil dengan akhiran *(inactive)*. Bila belum ada shift aktif muncul peringatan *"No active shift — create one under HR Setting → Working Time."* | Shift Kantor Reguler (REG-0817) · 08:00–17:00 |
| **Working Days \*** | tombol hari | Ya | Tombol **Mon**, **Tue**, **Wed**, **Thu**, **Fri**, **Sat**, **Sun**; klik untuk menyalakan/mematikan. Default Senin–Jumat. Keterangan: *"Other days are days off for employees on this pattern."* | Mon–Fri |

### Field mode Rotation

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **Rotation Sequence \*** | daftar *leg* | Ya | *"Legs run in order, then the cycle repeats. Each leg is an active shift or a day off."* Pola baru langsung berisi dua leg: 3 hari (shift belum dipilih) dan 1 hari **Off**. Bila semua leg dihapus tertulis *"No legs yet — add at least one."* | 3× Pagi, 3× Malam, 1× Off |
| Shift tiap leg | pilihan | Ya | Placeholder *Select shift or Off*. Opsi pertama **Off (day off)**, lalu shift aktif (format sama seperti di atas) | Shift Malam Gudang (OPS-NT) · 22:00–06:00 |
| Jumlah hari tiap leg | angka (`d`) | Ya | Minimal 1 | 3 |
| **Cycle Length** | tampilan saja | — | Jumlah hari semua leg (*Sum of all legs.*), mis. *7 days* | 7 days |
| **Anchor Date \*** | tanggal | Ya | Tanggal awal siklus dihitung (*Where the cycle is counted from.*); default hari ini | 02/11/2026 |
| **Phase Offset** | angka | Tidak | Menggeser siklus beberapa hari (*Days to shift the cycle (e.g. a second crew).*); default 0 | 3 |

Tombol tiap leg: **˄** (*Move up*), **˅** (*Move down*), dan ikon tempat sampah
(*Remove leg*). Klik **Add leg** untuk menambah leg baru (1 hari, shift belum
dipilih).

**Cycle Preview** menampilkan setiap hari dalam satu siklus (**D1**, **D2**, …)
berwarna sesuai shift dengan kode shiftnya, atau merah putus-putus untuk
**Off**. Kotak yang diberi garis tepi adalah hari siklus yang jatuh tepat pada
**Anchor Date**: *"On (tanggal) the cycle is on day (n) (outlined)."* Dengan
offset 0 yang ditandai adalah D1; dengan offset 3 yang ditandai adalah D4.

Tombol: **Cancel** / **Save Pattern** (tambah) atau **Save Changes** (ubah).

### Pesan validasi & toast

Semua validasi muncul sebagai toast **Validation Failed**:

| Kondisi | Pesan |
|---|---|
| Nama kosong | *Pattern name is required.* |
| Fixed tanpa shift | *Pick a shift.* |
| Fixed tanpa hari kerja | *Pick at least one working day.* |
| Rotation tanpa leg | *Add at least one leg to the rotation sequence.* |
| Leg dengan hari kurang dari 1 | *Every rotation leg needs at least 1 day.* |
| Leg kerja tanpa shift | *Pick a shift (or Off) for every rotation leg.* |
| Semua leg berisi Off | *A rotation needs at least one working leg.* |
| Anchor Date kosong | *Anchor date is required for a rotation pattern.* |

Berhasil → **Working Pattern Added** (*"(nama) was saved."*) atau **Working
Pattern Updated**. Gagal → **Failed to Add Working Pattern** / **Failed to
Update Working Pattern** beserta alasan dari server.

## Modal Generate Schedule

Judul *Generate Schedule — (nama pola)*. Deskripsi: *"Creates schedule rows for
every employee currently on this rotation pattern. Manually edited days are
never overwritten."* Hanya tersedia untuk pola **Rotation** yang aktif.

| Field | Tipe | Wajib | Catatan | Contoh |
|---|---|---|---|---|
| **From \*** | tanggal | Ya | Default hari ini | 01/11/2026 |
| **To \*** | tanggal | Ya | Default akhir bulan depan; tidak boleh sebelum **From** | 31/12/2026 |

Di bawahnya tertulis *"(n) day(s) — at most 366 per run. Employees are placed
on this pattern through a career mutation (e.g. from a Rotation Simulation)."*
(teks merah bila melebihi 366 hari).

Tombol **Cancel** / **Generate**. Setelah berhasil, kotak **Done** muncul di
modal berisi tiga angka: **Employees**, **Days generated**, dan **Manual days
kept**; tombol **Cancel** berubah menjadi **Close**.

| Kondisi | Toast |
|---|---|
| Tanggal kosong atau **To** sebelum **From** | **Validation Failed** — *Pick a valid date range.* |
| Rentang lebih dari 366 hari | **Validation Failed** — *The range can span at most 366 days.* |
| Berhasil | **Schedule Generated** — *(n) day(s) generated for (n) employee(s)* (ditambah *, (n) manual day(s) kept* bila ada) |
| Gagal | **Failed to Generate Schedule** beserta alasannya |

## Modal Deactivate Working Pattern?

*"\"(nama)\" will no longer be assignable to employees. This is refused while
employees are still assigned to it."* Tombol **Cancel** / **Deactivate**
(merah).

| Hasil | Toast |
|---|---|
| Berhasil | **Working Pattern Deactivated** |
| Masih ada karyawan di pola ini | **Working Pattern Is Still In Use** — pesan dari server (berisi jumlah karyawan) diikuti *"Reassign those employees to another pattern through a career mutation, then try again."* |
| Gagal karena alasan lain | **Failed to Deactivate Working Pattern** beserta alasannya |

**Activate pattern** langsung dijalankan tanpa konfirmasi → toast **Working
Pattern Activated** (gagal → **Failed to Activate Working Pattern**).

## Langkah — Membuat Pola Fixed

1. Pastikan shift yang dibutuhkan sudah ada dan aktif di **HR Setting →
   Working Time**.
2. Buka **HR Setting → Working Patterns**, klik **Add Pattern**.
3. Biarkan **Mode** pada **Fixed**.
4. Isi **Pattern Name**, mis. *Kantor Senin–Jumat*, dan pilih **Color** bila
   perlu.
5. Pilih **Shift**, mis. *Shift Kantor Reguler (REG-0817) · 08:00–17:00*.
6. Atur **Working Days**: nyalakan hari kerja, matikan hari libur.
7. Klik **Save Pattern**. Jadwal karyawan yang memakai pola ini langsung
   berlaku tanpa perlu Generate.

## Langkah — Membuat Pola Rotation

1. Klik **Add Pattern**, lalu pilih kartu **Rotation**.
2. Isi **Pattern Name**, mis. *Rotasi Gudang Regu A*.
3. Pada **Rotation Sequence**, atur leg berurutan, mis.:
   1. *Shift Pagi Gudang* — 3 hari,
   2. *Shift Malam Gudang* — 3 hari (klik **Add leg** untuk menambah),
   3. **Off (day off)** — 1 hari.
4. Pakai **˄** / **˅** untuk mengubah urutan bila perlu. Pastikan **Cycle
   Length** sesuai (contoh: *7 days*).
5. Isi **Anchor Date** — tanggal hari pertama siklus.
6. Untuk regu kedua yang bergiliran, buat pola baru dengan leg yang sama dan
   isi **Phase Offset** (mis. 3) agar siklusnya bergeser.
7. Periksa **Cycle Preview**, lalu klik **Save Pattern**.

## Langkah — Memasang Pola ke Karyawan

Pola tidak dipasang dari halaman ini, melainkan pada data karyawan:

- **Karyawan baru:** di form tambah karyawan, pilih **Schedule Type** (Fixed /
  Rotation) lalu **Pattern** (lihat
  [`02-tambah-karyawan.md`](../employees/02-tambah-karyawan.md)).
- **Karyawan lama:** ajukan **Career Mutation** dengan isian **Schedule type**
  dan **Pattern** baru (lihat [`05-mutasi.md`](../employees/05-mutasi.md)).
- **Rotasi untuk banyak karyawan:** pakai **⋮ → Simulate** untuk mencoba pola
  rotasi pada sekelompok karyawan di **Attendance → Rotation Simulations**,
  lalu ubah hasil simulasi menjadi batch Career Mutation.

## Langkah — Generate Jadwal Rotasi

1. Pastikan karyawan sudah terpasang ke pola rotasi tersebut (kolom
   **Employees** lebih dari 0).
2. Pada baris pola rotasi yang aktif, klik **⋮ → Generate schedule**.
3. Atur **From** dan **To** (maksimal 366 hari sekali jalan).
4. Klik **Generate** dan tunggu kotak **Done** muncul.
5. Periksa angka **Days generated** dan **Manual days kept**, lalu klik
   **Close**. Jadwal bisa dilihat di **Attendance → Employee Calendars**.

## Catatan & Aturan

- Pola berlaku untuk seluruh perusahaan (tidak per cabang).
- **Mode** tidak bisa diubah setelah pola dibuat; buat pola baru bila perlu
  mode lain.
- Pola **Fixed** tidak perlu (dan tidak bisa) di-Generate. Pola **Rotation**
  harus di-Generate ulang untuk periode berikutnya sebelum jadwalnya habis.
- Generate **tidak pernah menimpa** hari yang sudah diubah manual; hari itu
  dihitung sebagai *Manual days kept*.
- Generate hanya membuat jadwal untuk karyawan yang **saat ini** memakai pola
  tersebut. Karyawan yang dipasang belakangan perlu Generate lagi.
- Pola yang masih dipakai karyawan tidak bisa dinonaktifkan; pindahkan dulu
  karyawannya lewat Career Mutation.
- Shift yang masih dipakai pola aktif tidak bisa dinonaktifkan di **Working
  Time**. Bila shift sebuah pola lama sudah nonaktif, pilihan itu tetap tampil
  dengan akhiran *(inactive)* saat pola diedit.
- Bagi pengguna tanpa `attendance:config` maupun `attendance:write`, tombol
  **⋮** tetap tampil tetapi menunya kosong.

## Sumber

| Jenis | Path |
|---|---|
| Halaman | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/hr-setting/working-patterns/index.vue` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useSchedulePatterns.ts` |
| Composable | `HR-SYSTEM-BACKOFFICE/app/composables/useShifts.ts` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/AppDataTable.vue` |
| Komponen | `HR-SYSTEM-BACKOFFICE/app/components/AppPermissionGate.vue` |
| Tipe | `HR-SYSTEM-BACKOFFICE/app/types/attendance.ts` |
| Halaman terkait | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/attendance/rotation-simulations/index.vue` |
| Halaman terkait | `HR-SYSTEM-BACKOFFICE/app/pages/tenants/employee/create.vue` |
| Navigasi | `HR-SYSTEM-BACKOFFICE/app/layouts/default.vue` |
| Modul | [Shift & Jadwal](/modules/attendance/02-shift-schedule) |
