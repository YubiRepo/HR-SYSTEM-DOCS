# 02 · Monitoring

## 1. Dashboard Platform

Ringkasan lintas tenant untuk Yubiteck:

| Metrik | Contoh |
|---|---|
| **Tenant** | Total, aktif, trial, suspended, churn |
| **Pertumbuhan** | Tenant/karyawan baru per periode |
| **Pemakaian** | Karyawan aktif, cabang, storage per tenant |
| **Billing** | MRR/ARR, invoice tertunggak, konversi trial→bayar |
| **Kesehatan** | Uptime, error rate, latensi API |

Data bersumber dari Tenant, Billing, dan Entitlement (usage).

---

## 2. Health & Observability

- **Uptime & latensi** API per layanan/modul.
- **Error rate** & anomali (lonjakan 5xx, kegagalan login).
- **Job async** (payroll run, import) — status & kegagalan.
- **Alerting** ke tim Yubiteck saat melewati ambang.

> Metrik operasional bersifat agregat/aman — hindari menampilkan data pribadi karyawan di dashboard platform.

---

## 3. Peringatan Pemakaian

Dari data Entitlement (usage vs limit), tampilkan peringatan tenant yang **mendekati batas** (mis. `max_employees` > 90%) — peluang upsell & bantuan proaktif.

| Sinyal | Aksi |
|---|---|
| Mendekati limit | Notifikasi / tawarkan upgrade |
| Trial akan berakhir | Reminder konversi |
| Invoice tertunggak | Eskalasi ke billing |
