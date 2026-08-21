# 09 · Method Configuration

Bagaimana sebuah tenant/cabang menentukan **metode absen mana yang dipakai** (mobile GPS, mesin, NFC, face, web). Metode absen adalah **konfigurasi**, di-set berlapis: tenant menetapkan default, cabang boleh override.

---

## 1. Prinsip: Konfigurasi Berlapis

Sejalan pola katalog→override di seluruh sistem:

```
TENANT (default)
  └── metode default perusahaan
        ├── Cabang Kantor  → mobile GPS (WFH-friendly)
        ├── Cabang Pabrik  → mesin fingerprint (di gerbang)
        └── Cabang Toko    → mobile GPS + NFC
```

Dalam satu perusahaan, tiap cabang bisa berbeda cara absennya. Karena itu konfigurasi tidak "satu tenant satu metode", melainkan **tenant default + override cabang**.

---

## 2. Dua Lapis: Boleh vs Dipakai

| Lapis | Menjawab | Ditentukan oleh |
|---|---|---|
| **Diperbolehkan** | Metode apa yang boleh dipakai tenant | Entitlement (gerbang fitur) |
| **Dipakai** | Dari yang boleh, mana yang diaktifkan | Konfigurasi tenant/cabang |

**Status saat ini:** semua metode **dibuka** (belum di-gate plan). Namun struktur sudah disiapkan agar mudah di-gate nanti — cukup jadikan metode tertentu (mis. face recognition) sebagai `feature` di Entitlement, tanpa mengubah mekanisme konfigurasi.

```
(sekarang)  semua metode boleh → tinggal aktifkan yang diinginkan
(nanti)     Entitlement batasi → mis. face hanya plan Pro
```

---

## 3. Konfigurasi per Tenant/Cabang

```
attendance_method_config
  ├── scope: tenant | branch
  ├── allowed_methods : [mobile_gps, machine, nfc]   ← yang diaktifkan
  ├── require_geofence: true      ← mobile wajib dalam radius
  ├── require_photo   : false     ← selfie opsional
  ├── require_face    : false     ← wajib verifikasi wajah (mobile)
  └── devices         : [dev_fp_01, dev_fp_02]  ← mesin terdaftar (cabang)
```

- **Tenant** mengisi default (mis. `[mobile_gps]`).
- **Cabang** boleh override (mis. pabrik → `[machine]`, toko → `[mobile_gps, nfc]`).
- Bila cabang tak punya override, memakai default tenant.

---

## 4. Resolusi Konfigurasi (Efektif)

Saat karyawan absen, metode yang berlaku ditentukan berlapis (spesifik menang):

```
1. Config cabang karyawan  (bila ada)   ← menang
2. Config default tenant
```

Karyawan hanya bisa absen dengan metode yang **aktif di cabangnya**. Mencoba metode tak aktif → ditolak.

---

## 5. Siapa yang Mengatur (RBAC)

| Peran | Kewenangan |
|---|---|
| **tenant_admin** | Set default tenant, kelola semua cabang, daftar device |
| **branch_admin** | Set metode cabangnya sendiri (dari yang diperbolehkan), kelola device cabang |

Cakupan mengikuti data-scoping RBAC (`branch` vs `tenant`).

---

## 6. Alur Setup (Ringkas)

```
1. (Entitlement) metode apa yang boleh  → sekarang: semua
2. tenant_admin  → set default tenant + daftar mesin/device
3. branch_admin  → pilih metode cabang (override bila perlu)
4. karyawan      → absen; hanya metode aktif cabang yang diterima
```

---

## 7. Endpoint Konfigurasi

| Method | Endpoint | Deskripsi | Izin |
|---|---|---|---|
| GET | `/attendance/config` | Config efektif (tenant/cabang) | `attendance:read` |
| PUT | `/attendance/config` | Set config tenant | `attendance:config` (tenant) |
| PUT | `/attendance/branches/{id}/config` | Set/override config cabang | `attendance:config` (branch) |

**Contoh `PUT /attendance/branches/{id}/config`:**
```json
{
  "allowed_methods": ["mobile_gps", "nfc"],
  "require_geofence": true,
  "require_photo": false
}
```

**Contoh `GET /attendance/config` (efektif untuk cabang):**
```json
{
  "success": true,
  "data": {
    "scope": "branch",
    "branch_id": "branch_toko_sby",
    "allowed_methods": ["mobile_gps", "nfc"],
    "require_geofence": true,
    "inherited_from": "branch"
  }
}
```
`inherited_from`: `branch` (punya override) atau `tenant` (pakai default).

---

## 8. Data Model (ringkas)

### `attendance_method_config`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string (PK) | |
| `tenant_id` | string (FK) | |
| `branch_id` | string (FK, nullable) | null = default tenant |
| `allowed_methods` | json | mis. `["mobile_gps","machine","nfc"]` |
| `require_geofence` | boolean | |
| `require_photo` | boolean | |
| `require_face` | boolean | |
| `updated_by` | string | Aktor (audit) |

> Device fisik terdaftar di `attendance_devices` (lihat `08-device-integration.md`); config ini menentukan metode & aturan, device menautkan alatnya.
