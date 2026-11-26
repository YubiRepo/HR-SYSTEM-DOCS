# 11 · Overtime Rules (Aturan Lembur)

Master aturan lembur: bagaimana menit lembur dipecah ke komponen lembur
(OT1, OT2, …) beserta multiplier-nya per jenis hari, plus potongan jam
istirahat. Tenant boleh punya **banyak** aturan aktif; setiap **Working
Pattern** memilih aturan yang dipakai untuk lembur karyawannya (lihat
[`04-working-patterns.md`](./04-working-patterns.md)).

**Akses:** `/tenants/hr-setting/overtime-rules` · **Permission:** menu tampil bila
fitur `attendance.overtime` aktif dan punya `attendance:config`. Di sidebar,
menu ini berada **sebelum Working Time**.

## Halaman

| Halaman | Path | Isi |
|---|---|---|
| **Index — tab OT Codes** (tab pertama, default) | `/tenants/hr-setting/overtime-rules` | Master kode OT (lihat bagian **OT Codes**). Kolom *Code*, *Name* (+ deskripsi), *Payroll Variables*, *Order*, *Status*. **Add OT Code**; aksi baris **Edit**, **Deactivate** / **Activate** |
| **Index — tab Rules** | `/tenants/hr-setting/overtime-rules?tab=rules` | Tabel rule: *Name & Code*, *Day Types* (day type yang dicakup + jumlah tier), *Unapproved / Excess* (policy), *Breaks* (ringkasan tier break per day type), *Description*, *Status*. Filter **Status**, pencarian nama/kode, **Refresh**, **Add Overtime Rule**. Double-click baris = buka detail. Aksi baris (⋮): **View**, **Edit**, **Deactivate** (dengan konfirmasi) / **Activate** |
| **Create** | `/tenants/hr-setting/overtime-rules/create` | Editor kosong (semua day type sistem tercantum, belum aktif). **Create Rule** → pindah ke detail |
| **Detail** | `/tenants/hr-setting/overtime-rules/:id` | Read-only: **Overview** (deskripsi, policy), **Day Types** urut prioritas (tier, kuota, break), **Used by Working Patterns** (pola yang memakai rule + jumlah karyawan). Tombol **Edit**, **Deactivate** / **Activate** |
| **Edit** | `/tenants/hr-setting/overtime-rules/:id/edit` | Editor terisi rule; **Save Changes** → kembali ke detail; **Cancel** / **Reset** |

Tombol ubah (Add, Edit, Activate/Deactivate) hanya untuk `attendance:config`.

## OT Codes

Master kode komponen lembur — **siapkan dulu** sebelum membuat tier rule.

| Field | Keterangan |
|---|---|
| **Code** | Wajib, huruf besar: diawali huruf, hanya `A-Z 0-9 _`, maks 30 (mis. `OT1`, `OT_HOLIDAY`). **Tidak bisa diubah** setelah dibuat |
| **Name** / **Description** | Nama tampilan (dipakai sebagai nama tier) dan keterangan; bisa diubah |
| **Order** | Urutan tampil dan urutan saran kode saat menambah tier |

- Setiap kode menjadi variabel formula payroll `ot_min_<CODE>` (menit) dan
  `ot_wmin_<CODE>` (menit × multiplier), tersedia sejak kode dibuat.
- Kode yang masih dipakai tier pada rule **aktif** tidak bisa dinonaktifkan.
  Rule yang sudah memakai kode yang kemudian nonaktif tetap bisa disimpan,
  tetapi kode nonaktif tidak bisa dipilih untuk tier baru.
- Saat migrasi, kode tier yang sudah ada (OT1, OT2, …) otomatis dibuat di
  master.

## Editor

| Bagian | Isi |
|---|---|
| **Active** (switch di editor) | On = rule bisa dipakai Working Pattern. Off = lembur karyawan pada pola yang memakai rule ini **tidak diproses** (skipped) sampai diaktifkan lagi |
| **Rule Code / Name / Description** | Identitas aturan; kode unik per tenant |
| **Unapproved overtime** | Lembur tanpa request/SPL: *Not eligible* (dicatat, tidak dihitung), *Needs review* (HR menentukan menit eligible), atau *Auto-approved* (dibayar s.d. **Auto quota** day type) |
| **Excess overtime** | Kelebihan dari waktu yang disetujui: pilihan sama; *Auto-approved* = dibayar s.d. **Excess quota** day type |
| **Day Types & Details** | Satu list klasifikasi hari dari sistem (`WORKING_DAY`, `REST_DAY`, `HOLIDAY`) — **tidak bisa ditambah, dihapus, atau diubah kodenya**. Urutan list = **prioritas**: bila satu tanggal cocok dengan beberapa, yang paling atas menang; ubah dengan panah naik/turun. **Active** menandai apakah rule ini mencakup hari tersebut; day type otomatis aktif saat detail pertamanya ditambahkan |
| Buka/tutup day type | Klik baris untuk membuka detail, kuota, dan break milik day type itu. Masalah (celah jam, kuota, break) tampil di baris day type |
| **Auto quota (h)** / **Excess quota (h)** | Tampil hanya bila policy terkait *Auto-approved*, dan **wajib** untuk day type aktif |
| **Add Detail** / edit | **OT Code** (pilih dari master OT Codes; satu kode hanya sekali per day type; nama tier mengikuti nama di master). Kode yang belum ada bisa langsung dibuat lewat **New Code** (isi kode & nama → **Add Code**; kode masuk ke master OT Codes dan otomatis terpilih), **From/To (hour)** (To kosong = terbuka; jam × 60 = menit), **Multiplier**, **Active**. |
| **Breaks** / **Add Break** | Tier istirahat per day type: **Overtime ≥ (h)** dan **Break (min)**. Bila lembur aktual hari itu mencapai ambang, menit break dipotong sebelum dihitung. Bila beberapa ambang tercapai, yang **tertinggi** berlaku. Kolom *Example* menampilkan efeknya (mis. `4h → 3h 30m`) |

Contoh break `WORKING_DAY`: ≥ 4 jam → 30 menit, ≥ 8 jam → 60 menit.
Lembur 3 jam 50 m → tidak dipotong; 5 jam → 4 jam 30 m; 9 jam → 8 jam.

## Aturan

- Tier harus berurutan tanpa celah atau tumpang tindih, mulai dari jam 0;
  hanya tier terakhir yang boleh terbuka.
- Break: ambang > 0 dan unik per day type; menit break > 0 dan **lebih kecil**
  dari ambangnya.
- Potongan break diterapkan ke **lembur aktual sebelum realisasi** (sebelum
  dibandingkan dengan menit yang disetujui / kuota dan sebelum dipecah ke tier).
- Day type hanya boleh kode klasifikasi dari sistem; kode lain ditolak API.
- Tanggal yang klasifikasinya tidak punya day type ditolak saat diproses.
- Lembur **tidak diproses** (skipped) bila karyawan tidak punya Working
  Pattern, pattern-nya belum memilih Overtime Rule, atau rule-nya nonaktif.
- Kuota auto-approve tidak membuat transaksi bila karyawan tidak lembur.
- Mengubah aturan tidak mengubah transaksi lembur yang sudah ada (tersimpan
  sebagai snapshot); berlaku saat tanggal diproses berikutnya.

Referensi teknis: `modules/attendance/13-overtime-management.md`.
