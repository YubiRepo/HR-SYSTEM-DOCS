# 04 · Request & Approval

Pengajuan cuti dan alur persetujuan. Alur **configurable per jenis cuti** — cuti tahunan bisa 1 level, unpaid leave bisa multi-level.

---

## 1. Pengajuan (Leave Request)

Karyawan mengajukan:
```
jenis    : Cuti Tahunan
tanggal  : 2026-02-10 s/d 2026-02-12 (3 hari)
alasan   : keperluan keluarga
lampiran : (opsional / wajib tergantung jenis)
```

**Validasi saat pengajuan:**
- Jenis cuti masih aktif? (jenis nonaktif → `LEAVE_TYPE_INACTIVE`)
- Saldo cukup? (kecuali jenis tanpa jatah) — dipotong dari saldo **periode tanggal mulai cuti**, bukan periode saat diajukan
- Memenuhi kelayakan? (masa kerja dihitung sampai **tanggal mulai cuti**, gender)
- Lampiran ada bila `requires_document`? (mis. surat dokter untuk sakit)
- Tidak bentrok dengan cuti lain?

**Setengah hari:** `half_day: true` hanya untuk pengajuan satu tanggal (hari kerja) → `days = 0,5`. Selain itu `days` = jumlah hari kerja Sen–Jum dalam rentang.

Setelah valid → masuk alur approval, status `pending`, dan hari yang diajukan direservasi (`pending`) di saldo. Pengecekan bentrok + reservasi saldo dijalankan dalam satu transaksi dengan lock per karyawan, sehingga dua pengajuan bersamaan tidak bisa sama-sama lolos.

---

## 2. Alur Approval — Configurable per Jenis

> **Status implementasi (Okt 2026):** approval saat ini **satu step** (atasan langsung, fallback HR bila tak punya atasan) untuk semua jenis cuti. Tenant hanya di-seed flow "1 Level (Atasan Direct)", tenant lama dipindahkan ke flow itu oleh migrasi `20261016000002`, dan backoffice tidak menampilkan/mengatur flow. Skema & domain tetap mendukung multi-step (contoh di bawah) untuk diaktifkan nanti.

Tiap jenis cuti menunjuk **approval flow**. Contoh:

| Jenis cuti | Alur |
|---|---|
| Cuti Tahunan | 1 level: atasan langsung |
| Cuti Sakit | 1 level: atasan (verifikasi surat oleh HR) |
| Unpaid Leave | 2 level: atasan → HR |
| Cuti Melahirkan | 2 level: atasan → HR |
| Cuti Besar | 3 level: atasan → HR → direksi |

**Definisi flow:** urutan langkah, tiap langkah menunjuk **approver** berdasar peran/relasi:
```
step 1: manager (reporting line dari Core HR)
step 2: hr_admin
step 3: role tertentu / jabatan tertentu
```

---

## 3. Approver dari Reporting Line

Langkah "atasan" memakai **reporting line Core HR** — sistem tahu manajer si karyawan tanpa hardcode. Bila atasan kosong (mis. level tertinggi), fallback ke HR (configurable).

**Aturan otorisasi per step** (selain permission `leave:approve`):
- Pemohon tidak boleh meng-approve/reject pengajuannya sendiri.
- Satu user tidak boleh meng-approve lebih dari satu step pada pengajuan yang sama.
- Step `manager` → hanya atasan langsung pemohon (atau siapa pun pemegang `leave:approve` bila atasan kosong).
- Step `role` → reviewer wajib memegang role `approver_ref` (mis. `hr_admin`).
- Pelanggaran → `NOT_CURRENT_APPROVER`. Dua approver yang bertindak bersamaan pada step yang sama: yang kedua mendapat `INVALID_STATE`.

Delegasi: bila approver berhalangan (sedang cuti juga), bisa didelegasikan ke pengganti (configurable).

---

## 4. Status Pengajuan

```
DRAFT → PENDING → (tiap step) → APPROVED → berlaku
                              ↘ REJECTED
                              ↘ CANCELLED (oleh karyawan sebelum disetujui)
```

| Status | Arti |
|---|---|
| `pending` | Menunggu approval (di step tertentu) |
| `approved` | Semua step disetujui → saldo terpotong, Attendance ditandai |
| `rejected` | Ditolak di salah satu step (dengan alasan) |
| `cancelled` | Dibatalkan karyawan sebelum final |

---

## 5. Efek Setelah Disetujui

```
approved:
  ├─ saldo cuti berkurang (used += durasi)
  ├─ Attendance: hari itu ditandai on_leave (bukan alpha)
  ├─ Core HR: status on_leave bila cuti panjang (mis. melahirkan)
  └─ bila unpaid → info ke Payroll untuk potongan
```

---

## 6. Pembatalan Setelah Disetujui

Bila karyawan batal setelah disetujui (belum diambil):
- Ajukan pembatalan → approver setujui → **saldo dikembalikan** & tanda Attendance dibatalkan.
- Bila sudah lewat / sedang berjalan: mengikuti kebijakan (mis. tak bisa dibatalkan).

---

## 7. Kalender Cuti Tim

Manajer/HR melihat **kalender cuti** — siapa cuti kapan — untuk:
- Menghindari terlalu banyak orang cuti bersamaan (mis. batasi max % tim).
- Membantu keputusan approval.

Karyawan melihat kalender tim (tergantung kebijakan privasi) agar bisa merencanakan.

---

## 8. Konkurensi & Kuota Bersamaan

Aturan opsional: batasi jumlah orang cuti bersamaan per tim/cabang (mis. maks 2 orang/hari di 1 divisi). Pengajuan yang melampaui → ditandai/butuh approval khusus.
