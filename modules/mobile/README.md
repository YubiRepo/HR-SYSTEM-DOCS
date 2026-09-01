<!-- 📁 modules/mobile/README.md -->
# Mobile App

Dokumentasi aplikasi mobile HRMS. Mobile adalah **klien** dari modul-modul yang sudah ada (Attendance, Payroll, Leave, dll) — bukan modul dengan logika bisnis sendiri. Dokumen di sini memetakan bagaimana fitur modul disajikan di aplikasi HP, per peran.

| | |
|---|---|
| **Modul** | Mobile (klien) |
| **Sifat** | Presentation layer — konsumen API modul lain |
| **Peran** | Multi-role: karyawan, manajer, HR/admin |

---

## Struktur File

| File | Isi |
|---|---|
| [`README.md`](./README.md) | Indeks (dokumen ini) |
| [`01-feature-breakdown.md`](./01-feature-breakdown.md) | Fitur mobile per peran; mana yang tetap di web |

---

## Prinsip

- **Mobile = cepat & di lapangan** — fitur harian, aksi singkat, approval on-the-go.
- **Setup berat tetap di web** — konfigurasi, master data, billing.
- **Multi-role** — satu app, tampilan menyesuaikan peran (dari RBAC).
- **Klien, bukan sumber** — mobile memakai API & data model modul yang ada; tak ada logika bisnis baru.

---

## Lanjutan (Belum Dibuat)

- Navigasi & struktur layar per peran.
- Spesifikasi teknis (offline, sync, push, GPS/kamera).
- Mockup / prototype visual.

---

## Referensi
- Absensi: [`../attendance`](../attendance/README.md)
- Gaji: [`../payroll`](../payroll/README.md)
- Cuti: [`../leave`](../leave/README.md)
- Peran & izin: [`../rbac`](../rbac/README.md)
