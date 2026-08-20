# HR System Documentation

Dokumentasi bisnis, arsitektur, kontrak API, dan modul untuk HR Management System berbasis SaaS multi-tenant.

## Cakupan

- Business Requirements Document dan model bisnis HRMS
- Arsitektur sistem, tenancy, serta standar respons API
- Authentication dan client applications
- Role-Based Access Control
- Platform tenant, billing, entitlement, dan admin console
- Mockup backoffice HR

## Menjalankan Dokumentasi

Persyaratan: Node.js dan npm.

```bash
npm install
npm run docs:dev
```

VitePress akan menampilkan alamat lokal yang dapat dibuka dari browser, biasanya `http://localhost:5173`.

Untuk memverifikasi production build:

```bash
npm run docs:build
```

## Struktur Dokumentasi

| Lokasi | Isi |
|---|---|
| [`business/`](./business/) | BRD dan model bisnis HRMS |
| [`architectures/`](./architectures/) | Arsitektur modul, tenancy, dan API response |
| [`modules/auth/`](./modules/auth/) | Authentication, token, client, keamanan, dan konfigurasi |
| [`modules/rbac/`](./modules/rbac/) | Role, permission, scope, dan evaluasi akses |
| [`modules/platform/tenant/`](./modules/platform/tenant/) | Provisioning serta lifecycle tenant |
| [`modules/platform/billing/`](./modules/platform/billing/) | Plan, subscription, invoice, dan billing |
| [`modules/platform/entitlement/`](./modules/platform/entitlement/) | Feature dan limit evaluation |
| [`modules/platform/admin-console/`](./modules/platform/admin-console/) | Monitoring dan operasi platform |

## Mockup UI

### Backoffice HR

Mockup interaktif untuk HR Manager dan Payroll Officer tersedia di [`backoffice-ui-mockup/`](./backoffice-ui-mockup/).

```bash
cd backoffice-ui-mockup
python3 -m http.server 4174
```

Buka `http://localhost:4174`. Mockup mencakup dashboard HR, direktori karyawan, approval cuti, ringkasan payroll, dan form tambah karyawan.

Mockup berdiri sendiri dan tidak menjadi bagian dari build VitePress.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run docs:dev` | Menjalankan VitePress development server |
| `npm run docs:build` | Membuat production build dokumentasi |
| `npm run docs:preview` | Menampilkan hasil production build secara lokal |
