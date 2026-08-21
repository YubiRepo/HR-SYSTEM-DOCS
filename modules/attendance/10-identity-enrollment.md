# 10 · Identity Enrollment

Agar karyawan bisa absen dengan sidik jari, wajah, atau kartu, identitas fisik itu harus **didaftarkan (enroll)** lebih dulu dan ditautkan ke `employee_id`. Dokumen ini menjelaskan kapan, di mana, dan bagaimana enrollment dilakukan.

---

## 1. Dua Hal Berbeda: Identitas vs Enrollment

| | Identitas karyawan | Enrollment alat |
|---|---|---|
| **Apa** | `employee_id`, nama, akun login | Sidik jari / wajah / UID kartu |
| **Kapan** | Saat karyawan dibuat (Core HR, Pola A) | Saat enrollment (dokumen ini) |
| **Sudah ada?** | Ya | Belum — langkah tambahan |

Punya record karyawan ≠ bisa absen biometrik. Enrollment menautkan "identitas fisik" ke identitas sistem.

```
Core HR: emp_budi
   ├── Fingerprint mesin A → employee_ref "1023"
   ├── Face (template)     → face_id "f_88"
   └── Kartu NFC           → card_uid "04A2B3C4"
```

Satu karyawan bisa punya beberapa identitas alat sekaligus.

---

## 2. Kapan Enrollment (Fleksibel)

Enrollment bisa dilakukan **dua waktu**:

| Waktu | Skenario |
|---|---|
| **Saat onboarding** | Bagian dari proses karyawan baru (setelah record dibuat via Pola A) |
| **Menyusul** | Kapan saja lewat menu enrollment (mis. karyawan lama saat mesin baru dipasang, ganti kartu hilang, re-enroll wajah) |

> Nyambung ke Core HR Pola A: saat karyawan baru dibuat, bila cabangnya memakai metode biometrik/kartu, enrollment dijadwalkan sebagai bagian onboarding. Bila belum sempat, bisa menyusul.

---

## 3. Di Mana Disimpan (Tergantung Alat)

Penyimpanan berbeda per metode — mengikuti sifat teknis & privasi:

| Metode | Disimpan di | Yang disimpan | Catatan |
|---|---|---|---|
| **Fingerprint** | **Mesin (lokal)** | Template sidik jari | Umumnya tak dikirim ke server (privasi & teknis); mesin simpan lokal |
| **Face** | **Mesin atau server (sentral)** | Face template (data matematis) | Bisa sentral agar berlaku lintas mesin/mobile |
| **NFC/RFID** | **Server (mapping)** | UID kartu → employee_id | Bukan biometrik; hanya pemetaan |

**Prinsip penting:**
- Biometrik disimpan sebagai **template matematis**, bukan gambar/rekaman asli.
- Untuk fingerprint di mesin lokal: server pusat hanya menyimpan **mapping** (`employee_ref` mesin → `employee_id`), bukan sidik jarinya.
- Untuk face sentral: template boleh di server agar satu wajah berlaku di banyak titik absen (mesin + mobile).

> **Privasi (UU PDP):** data biometrik tergolong sensitif. Simpan sebagai template terenkripsi, akses sangat dibatasi, dan sediakan penghapusan saat karyawan offboard. Detail keamanan biometrik menjadi bahasan lanjutan.

---

## 4. Alur Enrollment per Metode

### 4.1 Fingerprint
```
1. Admin pilih karyawan di sistem (emp_budi)
2. Karyawan scan jari di mesin (2–3× untuk akurasi)
3. Mesin simpan template lokal + beri employee_ref (mis. "1023")
4. Sistem simpan mapping: mesin A · ref "1023" → emp_budi
```

---

## 4a. Strategi Pencocokan ID Mesin ↔ Karyawan

Mesin fingerprint mengenal karyawan sebagai **nomor** (mis. 1023), bukan `employee_id`. Harus ada yang mencocokkan nomor mesin ke karyawan di sistem. Untuk menghindari pekerjaan manual satu-per-satu, disediakan **tiga cara berlapis**.

### Cara 1 — Samakan dengan Employee Number (DEFAULT, disarankan)

Pakai **nomor induk karyawan (`employee_number`)** yang sudah ada di Core HR sebagai ID di mesin.

```
Sistem : Budi punya employee_number "1023"
Mesin  : daftarkan Budi dengan ID "1023" juga (sama)
→ pencocokan OTOMATIS — mesin kirim "1023", sistem langsung kenal Budi
```

- Tak perlu mapping terpisah; `employee_ref` = `employee_number`.
- Menutup mayoritas kasus tanpa kerja tambahan.
- Saat enroll, admin cukup mengetik nomor induk yang sudah ada (bukan nomor acak).

### Cara 2 — Mapping Manual (fallback)

Bila nomor mesin tak bisa disamakan (mesin lama sudah pakai nomor sendiri, batas digit, format employee_number tak didukung mesin):
```
Admin: pilih Budi → isi "mesin A, ref 1023" (manual)
```
Cocok untuk sedikit karyawan atau kasus khusus.

### Cara 3 — Import Massal (bila terlanjur banyak yang beda)

Bila mesin sudah berisi banyak nomor yang berbeda dari sistem:
```
Export dari mesin → daftar (ref, nama)
→ cocokkan ke employee_id (by nama/employee_number)
→ import mapping sekaligus (2 fase: validasi → commit)
```
Mengikuti pola bulk import Core HR (dry-run + partial success). Sekali jalan, semua ter-mapping — tak satu-satu.

### Ringkas

| Cara | Kapan | Usaha |
|---|---|---|
| **1. Samakan employee_number** | Default, mesin baru | Nyaris nol (otomatis) |
| **2. Mapping manual** | Sedikit / kasus khusus | Per karyawan |
| **3. Import massal** | Terlanjur banyak beda | Sekali import |

> **Prinsip:** `employee_number` adalah **jembatan utama** ke semua alat (mesin & referensi). Default samakan; sediakan mapping/import hanya untuk kasus yang tak bisa disamakan. Siapa yang melakukan: branch_admin/HR cabang; kapan: saat enrollment (onboarding atau menyusul).

### 4.2 Face
```
1. Pilih karyawan
2. Ambil wajah — via mesin/tablet ATAU self-enroll di mobile app (selfie)
3. Buat face template
4. Simpan template (mesin/server) + mapping → emp_budi
```
Self-enrollment via mobile membuat proses praktis (tak perlu antre di mesin).

### 4.3 NFC / RFID
```
1. Pilih karyawan
2. Tap kartu ke reader → baca card_uid
3. Simpan mapping: card_uid → emp_budi
```
Ganti kartu (hilang): nonaktifkan UID lama, enroll UID baru.

---

## 5. Siapa yang Meng-enroll (RBAC)

| Peran | Kewenangan |
|---|---|
| **branch_admin / HR** | Enroll karyawan di cabangnya (fingerprint, kartu, face di mesin) |
| **Karyawan** | Self-enroll wajah via mobile (bila diaktifkan) |
| **tenant_admin** | Lintas cabang |

Cakupan mengikuti data-scoping RBAC (`branch`/`tenant`).

---

## 6. Lifecycle Enrollment

| Peristiwa | Aksi |
|---|---|
| **Onboarding** | Enroll metode sesuai cabang |
| **Kartu hilang** | Nonaktifkan UID lama, enroll baru |
| **Re-enroll wajah** | Perbarui template (mis. akurasi turun) |
| **Pindah cabang** | Enroll ulang di mesin cabang baru bila perlu |
| **Offboarding** | Hapus/nonaktifkan enrollment & biometrik (kepatuhan) |

> Saat karyawan offboard (Core HR), enrollment biometrik & kartu dinonaktifkan/dihapus sesuai kebijakan retensi & UU PDP.

---

## 7. Endpoint

| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| POST | `/attendance/enroll/fingerprint` | Daftarkan sidik jari (map ref mesin) | `attendance:config` |
| POST | `/attendance/enroll/face` | Daftarkan wajah (mesin/mobile) | `attendance:config` / self |
| POST | `/attendance/enroll/card` | Daftarkan kartu NFC | `attendance:config` |
| GET | `/attendance/employees/{id}/enrollments` | Daftar enrollment karyawan | `attendance:read` |
| POST | `/attendance/enroll/import` | Import mapping massal (mesin lama) | `attendance:config` |
| DELETE | `/attendance/enrollments/{id}` | Nonaktifkan/hapus enrollment | `attendance:config` |

**Contoh `POST /attendance/enroll/card`:**
```json
{ "employee_id": "emp_budi", "card_uid": "04A2B3C4", "device_id": "dev_nfc_01" }
```

**Contoh `POST /attendance/enroll/fingerprint`:**
```json
{ "employee_id": "emp_budi", "device_id": "dev_fp_01", "employee_ref": "1023" }
```
(Template sidik jari tetap di mesin; sistem menyimpan mapping ref → employee.)

**Contoh `GET /attendance/employees/{id}/enrollments`:**
```json
{
  "success": true,
  "data": [
    { "method": "fingerprint", "device_id": "dev_fp_01", "ref": "1023", "status": "active" },
    { "method": "nfc", "card_uid": "04A2B3C4", "status": "active" }
  ]
}
```

---

## 8. Data Model (ringkas)

### `attendance_enrollments`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | `enr_...` |
| `employee_id` | string (FK) | |
| `method` | enum | `fingerprint`, `face`, `nfc` |
| `device_id` | string (FK, nullable) | Untuk fingerprint/mesin |
| `employee_ref` | string (nullable) | ID lokal di mesin — **default = `employee_number`** karyawan (lihat §4a) |
| `card_uid` | string (nullable) | Untuk NFC |
| `template_ref` | string (nullable) | Lokasi/ID template (face sentral) |
| `storage` | enum | `device_local` / `server` |
| `status` | enum | `active`, `disabled` |
| `enrolled_by` | string | Aktor (audit) |
| `enrolled_at` | timestamp | |

> Kartu NFC juga tercermin di `device_cards` (lihat `08-device-integration.md`); `attendance_enrollments` menyatukan semua metode dalam satu tampilan per karyawan.
