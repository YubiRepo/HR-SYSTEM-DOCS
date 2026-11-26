# 03 · Aturan Runtime

Submit, Decide, dan Cancel dipanggil modul pemilik **di dalam transaksinya sendiri**, sehingga perubahan dokumen dan approval-nya commit bersama.

| Aksi | Aturan |
|---|---|
| **Submit** | Pilih policy aktif (subtype → default). Resolve approver tiap step. Simpan request + step (step pertama yang tidak di-skip menjadi `pending`, sisanya `waiting`) + action `submit`. Dokumen yang masih punya request `pending` ditolak (`APPROVAL_INVALID_STATE`). |
| Tanpa policy aktif / semua step di-skip | Request langsung `approved`; modul pemilik menerima `final_approved` dan memfinalisasi dokumen saat itu juga. |
| **Skip otomatis** | Step di-skip bila approver-nya (1) user milik pemilik dokumen, (2) pengaju, atau (3) sama dengan approver step aktif sebelumnya. |
| **Approve** | Hanya approver step `pending`. Step `any_approver`: siapa saja yang lolos permission approve modul pemilik, kecuali pemilik dokumen dan pengaju. Row request di-lock. Step → `approved`; step `waiting` berikutnya → `pending` (outcome `advanced`), atau request → `approved` (outcome `final_approved`). |
| **Reject** | Step dan request → `rejected` (outcome `rejected`). Step sisanya tetap `waiting`. |
| **Cancel** | Request `pending` → `cancelled`. Siapa yang boleh membatalkan ditentukan modul pemilik. Dokumen tanpa request aktif: no-op. |
| Bukan approver | `NOT_CURRENT_APPROVER` (409). |
| Request sudah selesai | `APPROVAL_INVALID_STATE` (409). |
| Dokumen belum dirutekan | `APPROVAL_REQUEST_NOT_FOUND` (409) — jalankan backfill. |

## Integrasi Leave

| Leave | Engine |
|---|---|
| Submit cuti | `Submit` dengan `subject = employee_id`, `subtype = leave_type_id`. `final_approved` → saldo langsung terpakai + ledger `used`. |
| Approve/Reject (route **tanpa permission**; hanya approver step aktif) | `Decide` — `any_approver` hanya bila pemanggil punya `leave:approve`. `final_approved` → konsumsi saldo + ledger; `rejected` → lepas reservasi; `advanced` → `leave_requests.current_step` disinkronkan. |
| Cancel (pemilik atau `leave:config`) | `Cancel` dalam transaksi yang sama dengan pelepasan reservasi. |
| List | Tiap item pending membawa `approval_routed`, `current_approver_user_id`, `can_decide` (untuk pemanggil). |
| Timeline | `GET /leave/requests/{id}/approval`: `leave:read`/`leave:approve` (dalam branch scope), pemilik cuti, atau approver menurut `CanView`. |
| Inbox & tampilan approver | Leave mendaftarkan *document provider*: ringkasan (jenis, tanggal, hari, alasan, lampiran + path approve/reject/timeline) dan detail (status, tanggal diajukan, saldo per tanggal mulai, lampiran). |

## Integrasi Payroll Run

| Payroll | Engine |
|---|---|
| Submit run (`/runs/{id}/submit`) | `Submit` tanpa subject, `subtype = branch`; hanya bila ada policy `payroll_run`. |
| Approve/Reject (route tanpa permission) | `Decide`; step `any_approver` butuh `payroll:approve`. |
| `GET /runs/{id}`, `/runs/{id}/approval` | `payroll:read` (dalam branch scope) atau approver menurut `CanView`. |
| Inbox & tampilan approver | Ringkasan run + detail (rincian total, catatan penolakan terakhir), `detail_path` ke halaman run. |

`approval_flows`, `approval_steps`, dan `leave_request_approvals` milik leave **tidak dipakai lagi** untuk routing (tabel tidak dihapus; `leave_request_approvals` masih diisi sebagai log lama).

## Integrasi Attendance (lembur & koreksi)

| Attendance | Engine |
|---|---|
| Submit lembur / koreksi | Bila ada policy (`HasPolicy`): `Submit` dengan `subject = employee`, tanpa subtype, satu transaksi dengan penyimpanan dokumen (+ claim hari untuk lembur). `final_approved` → langsung disetujui (koreksi langsung diterapkan). Tanpa policy: tidak dirutekan. |
| Approve/Reject (route tanpa permission) | Dokumen dirutekan → `Decide`; `any_approver` hanya bila pemanggil punya `attendance:approve` dalam scope. Tidak dirutekan → wajib `attendance:approve` (satu langkah). |
| Lembur step antara | `approved_end_at` disimpan sebagai batas window (`LimitWindow`); step terakhir memakai/mempersingkat batas itu. |
| Cancel lembur | `Cancel` di transaksi yang sama. |
| Timeline | `GET /attendance/overtime/{id}/approval`, `/attendance/corrections/{id}/approval`. |
| Inbox & tampilan approver | Provider attendance: ringkasan + detail (status, waktu pengajuan, absensi hari itu; batas window dari step sebelumnya). |
