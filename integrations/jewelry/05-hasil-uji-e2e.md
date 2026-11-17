<!-- 📁 integrations/jewelry/05-hasil-uji-e2e.md -->
# 05 — Hasil Uji End-to-End

Diuji 17 November 2026 di lingkungan dev (jewelry-be :8383, HR-API :8111, HR-BO :3000, jewelry-fe :3001) memakai akun owner seed Jewelry dengan dua company: **Main Company** (1 branch) dan **Perusahaan B** (tanpa branch). Uji dilakukan di level API (skrip ke endpoint yang sama yang dipanggil HR-BO); uji visual di browser belum dilakukan.

| # | Skenario | Hasil | Catatan |
|---|---|---|---|
| 1 | Owner dari backoffice Jewelry → launcher → HR tanpa login ulang, akses penuh | ✅ (API) | `GET /apps` → `hr`, `has_access: true`; handoff → exchange 200; kode dipakai ulang → 401. Owner punya 2 company sehingga token SSO tanpa company → HR `403 CONTEXT_REQUIRED` → pilih company. Setelah `switch-context`: role `owner`, 37 grant HR. |
| 2 | Login di halaman HR, user multi-company memilih company, data hanya company itu | ✅ (API) | Karyawan uji hanya muncul di Main Company; Perusahaan B kosong. |
| 3 | `company_admin` semua data; `branch_admin` hanya branch A; `employee` hanya ESS | ⚠️ Sebagian | `employee`: `/core-hr/me/employee` 200, `/core-hr/employees` & `/branches` 403 ✅. `owner` (grants_all) melihat semua ✅. `branch_admin` belum diuji — butuh company dengan ≥2 branch. |
| 4 | Cabut sesi/role di Jewelry → HR menolak ≤60 dtk | ✅ | Logout Jewelry → HR `401 TOKEN_REVOKED` setelah 60 dtk (umur cache grant). |
| 5 | Company baru langsung bisa dipakai tanpa subscription, default ter-seed | ✅ | Perusahaan B (belum pernah dibuka di HR): 8 tipe cuti, 95 common code, komponen payroll; tidak ada endpoint billing (404). |
| 6 | Buat akun karyawan dari HR → user di Jewelry dengan role `employee` → login ESS | ✅ | Karyawan + akun dibuat, password sementara dikembalikan, login Jewelry 200, HR role `employee`. |
| 7 | Ganti tema tenant di Jewelry → HR-BO ikut | ⚠️ Sebagian | Respons login/profile membawa `theme` (`green`) dan HR-BO memasangnya ke `data-theme`; penggantian tema & tampilan belum dicek di browser. |

## Regresi otomatis

- HR-API: `go build`, `go vet`, `go test ./internal/... ./cmd/... ./pkg/...` lulus.
- HR-BO: lint file yang diubah bersih; `nuxt typecheck` 57 error, semuanya error lama (baseline 69), tidak ada error baru. `nuxt build` penuh belum bisa dijalankan di mesin dev (kehabisan memori); CSS tema diverifikasi dengan compiler Tailwind.
- jewelry-be / jewelry-fe: diuji per fase (1–10) terhadap baseline test yang sudah gagal sebelumnya.

## Data uji yang dibuat

Di Main Company: org unit **E2E Department**, posisi **E2E Staff**, karyawan **E2E Employee** dengan akun Jewelry `e2e.employee.<timestamp>@example.com`. Boleh dihapus setelah uji.

## Belum tercakup

- Skenario `branch_admin` (butuh ≥2 branch) dan pengecekan visual di browser (login, SSO, pemilih company, tema).
- Superadmin lintas tenant Jewelry belum didukung.
- Filter role di approval policy belum menyaring (service API belum mengirim role user).
