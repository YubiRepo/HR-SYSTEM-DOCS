# Approval Module

Engine approval **berjenjang dan generik** lintas modul. Modul pemilik dokumen (Leave sebagai consumer pertama) merutekan dokumennya ke engine; engine menentukan siapa yang harus menyetujui, berurutan, dan mencatat setiap keputusan. Status dokumen dan efek bisnisnya (saldo cuti, dll.) tetap dipegang modul pemilik.

| | |
|---|---|
| **Modul** | Approval |
| **Versi** | 1.0 (Fase 1) |
| **Dependensi** | Core HR (reporting line, data karyawan), Auth (nama akun) |
| **Consumer** | Leave (Fase 1). Berikutnya: lembur, koreksi absensi, mutasi, payroll run |
| **Rencana** | [plans/2026-11-05-approval-berjenjang.md](../../plans/2026-11-05-approval-berjenjang.md) |

## Dokumen

| File | Isi |
|---|---|
| [01-overview.md](01-overview.md) | Konsep: policy, step, resolusi approver |
| [02-data-model.md](02-data-model.md) | Tabel konfigurasi & runtime |
| [03-runtime-rules.md](03-runtime-rules.md) | Submit, approve/reject, cancel, aturan skip |
| [04-api-contract.md](04-api-contract.md) | Endpoint & contract antar modul |
