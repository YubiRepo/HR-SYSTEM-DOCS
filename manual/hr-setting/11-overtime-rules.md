# 11 · Overtime Rules (Aturan Lembur)

Mengatur bagaimana menit lembur yang eligible dipecah ke komponen lembur
(OT1, OT2, …) beserta multiplier-nya, per jenis hari. Satu aturan dipakai oleh
cabang lewat **Attendance Rules → Overtime Rule**.

**Akses:** `/tenants/hr-setting/overtime-rules` · **Permission:** menu tampil bila
fitur `attendance.overtime` aktif dan punya `attendance:config`

## Elemen Halaman

| Elemen | Fungsi |
|---|---|
| **Refresh** | Muat ulang daftar aturan |
| **Add Overtime Rule** | Buka editor aturan baru (semua day type dari sistem tercantum, belum aktif) |
| Tabel | Rule (nama & kode), day type aktif urut prioritas, kebijakan *Unauthorized / Excess*, status |
| Aksi baris | **Edit rule**, **Deactivate rule** / **Activate rule** |

## Editor

| Bagian | Isi |
|---|---|
| **Rule Code / Name / Description** | Identitas aturan; kode unik per tenant |
| **Overtime without an approved request** | *Not eligible* (dicatat, tidak dihitung) atau *Needs review* (HR menentukan menit eligible) |
| **Overtime past the approved time** | Sama, untuk kelebihan dari waktu yang disetujui |
| **Day Types & Details** | Satu list klasifikasi hari dari sistem (`WORKING_DAY`, `REST_DAY`, `PUBLIC_HOLIDAY`) — **tidak bisa ditambah, dihapus, atau diubah kodenya**. Urutan list = **prioritas**: bila satu tanggal cocok dengan beberapa, yang paling atas menang; ubah dengan panah naik/turun (`#1`, `#2`, …). **Active** menandai apakah rule ini mencakup hari tersebut; day type otomatis aktif saat detail pertamanya ditambahkan |
| Buka/tutup day type | Klik baris (atau ikon panah di kiri) untuk membuka **detail** milik day type itu: tabel Component, Name, Hours (*from – to*), Multiplier, Status, aksi edit/hapus. Masalah urutan jam (celah/tumpang tindih) tampil di baris day type |
| **Add Detail** / edit | Form muncul di dalam day type yang dibuka: **Component Code** (mis. OT1), **Component Name**, **From/To (hour)** — batas jam dari lembur hari itu (mis. 0–1 jam, lalu 1 jam ke atas; To kosong = terbuka; dikonversi ke menit dengan jam × 60), **Multiplier**, **Active**. Kode & jam awal disarankan otomatis; detail terakhir yang masih terbuka ditutup tepat di awal detail baru |

## Aturan

- Tier harus berurutan tanpa celah atau tumpang tindih, mulai dari jam 0 dan
  setiap tier mulai di jam akhir tier sebelumnya;
  hanya tier terakhir yang boleh terbuka. Tier terakhir yang tertutup membatasi
  lembur harian.
- Day type hanya boleh kode klasifikasi dari sistem; kode lain ditolak API.
- Tanggal yang klasifikasinya tidak punya day type ditolak saat diproses (tidak
  ditebak).
- Aturan yang masih dipakai Attendance Rules tidak bisa dinonaktifkan.
- Mengubah aturan tidak mengubah transaksi lembur yang sudah ada (tersimpan
  sebagai snapshot); berlaku saat tanggal diproses berikutnya.

Referensi teknis: `modules/attendance/13-overtime-management.md`.
