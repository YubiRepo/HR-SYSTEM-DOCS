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
| Timeline | `GET /leave/requests/{id}/approval`: `leave:read`/`leave:approve`, pemilik cuti, atau approver request itu (assigned/pernah memutuskan). |
| Inbox | Leave mendaftarkan *summarizer* (jenis, tanggal, hari, alasan, lampiran + path approve/reject/timeline). |

`approval_flows`, `approval_steps`, dan `leave_request_approvals` milik leave **tidak dipakai lagi** untuk routing (tabel tidak dihapus; `leave_request_approvals` masih diisi sebagai log lama).
