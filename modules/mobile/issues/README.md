<!-- 📁 modules/mobile/issues/README.md -->
# Issues Backend dari Mobile

Kekurangan / ketidaksesuaian API yang ditemukan saat integrasi aplikasi mobile, dipisah per modul.

> **Untuk tim backend:** setelah issue dikerjakan, ubah kolom **Status** dan isi **Catatan BE** (endpoint / PR / keputusan). Mobile akan menyesuaikan setelah status `Done`.

**Status:** `Open` belum dikerjakan · `Perlu dicek` belum pasti bug atau memang desain · `Perlu keputusan` butuh keputusan produk · `In progress` · `Done` · `Won't fix`

**Prioritas:** `P1` memblokir fitur mobile · `P2` fitur jalan tapi kurang / ada workaround · `P3` perbaikan kecil

| Modul | Jumlah | Issue |
|---|---|---|
| [Attendance](./attendance.md) | 9 | ATT-1 … ATT-9 |
| [Core HR](./core-hr.md) | 4 | CORE-1 … CORE-4 |
| [Auth](./auth.md) | 3 | AUTH-1 … AUTH-3 |
| [Approval](./approval.md) | 2 | APR-1 … APR-2 |
| [Payroll](./payroll.md) | 1 | PAY-1 |
| [Platform](./platform.md) | 2 | PLAT-1 … PLAT-2 |

> Cakupan: hanya endpoint yang ada di dokumentasi API. Fitur app yang memakai endpoint di luar dokumentasi diperbaiki di sisi app, bukan dicatat sebagai issue backend.
