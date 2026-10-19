# Manual Backoffice (Tenant Admin)

Panduan pemakaian aplikasi backoffice Easy HR untuk **admin tenant / HR admin**.
Setiap menu di sidebar punya foldernya sendiri di bawah `manual/`, berisi
langkah operasional, tabel field, dan mock UI yang bisa dirender menjadi gambar.

> Sebelum menulis atau mengubah manual, **wajib** baca
> [Aturan Manua (`RULES.md`)](./RULES.md) — terutama aturan *living docs*: manual
> harus ikut berubah di perubahan yang sama dengan kode halaman terkait.

## Daftar Menu

| Menu sidebar | Folder | Cakupan | Status |
|---|---|---|---|
| Employees | [`employees/`](./employees/) | Data karyawan & mutasi/transfer | Selesai |
| HR Setting | [`hr-setting/`](./hr-setting/) | Struktur & kebijakan (organisasi, posisi, jam kerja, cuti, gaji, custom field) | Belum |
| Leave | [`leave/`](./leave/) | Pengajuan & saldo cuti | Belum |
| Attendance | [`attendance/`](./attendance/) | Absensi, jadwal, lembur, mesin absen | Belum |
| Salary | [`salary/`](./salary/) | Payroll, run, payslip | Belum |
| Recruitment & ATS | [`recruitment/`](./recruitment/) | Lowongan, pipeline, pelamar, penawaran | Belum |
| Performance & Goals | [`performance/`](./performance/) | KPI/OKR, siklus penilaian, 360°, kalibrasi | Belum |
| Company Settings | [`company-settings/`](./company-settings/) | Profil perusahaan, cabang, billing, pengguna, peran | Belum |
| Employee Portal | [`ess/`](./ess/) | Self-service karyawan (absensi, cuti, profil, payslip) | Belum |
| Account | [`account/`](./account/) | Profil & keamanan akun user | Belum |

## Cara Pakai

- Setiap folder menu punya `README.md` sebagai indeks + file bernomor untuk
  tiap halaman. Baca berurutan dari `01`.
- Mock UI ditulis sebagai blok `ui-mock` (HTML self-contained). Untuk melihat
  versi gambar, salin blok tersebut beserta **Prompt gambar** ke AI chat.
- Setiap dokumen diakhiri bagian `## Sumber` yang menunjuk file asal di repo
  backoffice — jadikan acuan saat memverifikasi perubahan.

## Kontribusi

1. Baca [`RULES.md`](./RULES.md).
2. Verifikasi ke halaman backoffice terbaru (`HR-SYSTEM-BACKOFFICE`).
3. Buat/ubah dokumen sesuai template.
4. `npm run docs:build`.
