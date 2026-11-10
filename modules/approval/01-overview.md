# 01 · Overview

## 1. Dua lapis

```
KONFIGURASI (admin)                               RUNTIME (per dokumen)
approval_policies ─< approval_policy_steps        approval_requests ─< approval_request_steps
(per document_type,  (urutan + cara menentukan    (1 per pengajuan)    (snapshot approver per step)
 opsional per subtype) approver)                                        └─ approval_actions (audit)
```

- **Policy** = dokumen apa (`document_type`, mis. `leave_request`) butuh step apa saja. Bisa dipersempit ke satu **subtype** (`subtype_ref`, untuk leave = `leave_type_id`). Policy subtype mengalahkan policy default (`subtype_ref` kosong).
- **Request** = satu dokumen yang sedang/pernah dirutekan. Approver setiap step **di-resolve saat submit** dan disimpan sebagai `approver_user_id`. Perubahan policy atau reporting line setelah submit **tidak** mengubah dokumen yang sudah berjalan.

## 2. Tipe step

| `approver_type` | Approver | Field |
|---|---|---|
| `direct_manager` | Atasan ke-N dari karyawan acuan, via reporting line Core HR (`manager_id` → kepala unit → kepala unit induk; lihat [core-hr/02-org-structure.md](../core-hr/02-org-structure.md) §4.2) | `manager_level` (1–10), `manager_of` |
| `user` | User tertentu yang dipilih admin | `approver_user_id`; `role_id_hint` hanya filter di UI |

`manager_of` menentukan karyawan acuan:

| Nilai | Acuan | Kapan dipakai |
|---|---|---|
| `subject` (default) | Pemilik dokumen (mis. karyawan yang cuti) | Dokumen milik karyawan. HR yang menginput **atas nama** karyawan tidak mengubah approver. |
| `submitter` | User yang menekan submit | Dokumen internal tanpa pemilik (memo HR, payroll run). Akun pengaju harus terhubung ke data karyawan. |

## 3. Bila approver tidak ditemukan (`on_unresolved`)

Terjadi bila atasan tidak ada, atasan tidak punya akun login, atau karyawan acuan tidak ada.

| Nilai | Efek |
|---|---|
| `any_approver` (default) | Step tetap menunggu dan boleh diputuskan siapa saja yang punya permission approve modul pemilik (leave: `leave:approve`), kecuali pemilik dokumen dan pengaju. Sama dengan perilaku flow lama untuk karyawan tanpa atasan. |
| `fallback_user` | Dialihkan ke `fallback_user_id`. |
| `skip` | Step dilewati. Bila semua step terlewati, dokumen langsung disetujui. |

## 4. Document type terdaftar

| Key | Pemilik | Subject? | Subtype |
|---|---|---|---|
| `leave_request` | Leave | Ya | `leave_type` |

Consumer baru menambahkan entri di registry (`approval/domain/constant`). Dokumen tanpa subject hanya boleh memakai `manager_of = submitter`.

## 5. Policy default

Setiap tenant mendapat policy default `leave_request`: **1 step, atasan langsung pemilik dokumen, `any_approver` bila tidak ditemukan**. Dibuat saat provisioning tenant (seeder leave) dan oleh backfill `20261110090000_route_leave_approvals_for_tenant` untuk tenant lama. Tanpa policy aktif sama sekali, dokumen langsung disetujui.
