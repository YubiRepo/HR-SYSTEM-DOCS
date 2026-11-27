# Jaringan & IP: localhost, LAN, Docker, Publik

Catatan belajar tentang jenis-jenis alamat IP yang dipakai stack HR System (terutama staging), di layer mana masing-masing berada, dan kenapa subnet network Docker bisa **bentrok**.

Kasus nyatanya: `make staging-init` gagal dengan

```
Error response from daemon: Pool overlaps with other one on this address space
```

karena subnet `172.30.0.0/24` yang dipilih untuk `hr-staging-net` sudah dipakai network Docker lain di host yang sama. Subnetnya lalu dipindah ke `10.213.0.0/24`.

Lihat juga: [Trusted proxy & IP client](/architectures/trusted-proxy-client-ip) (bagaimana API mengetahui IP asli client).

---

## 1. Notasi dasar: IP, subnet, CIDR

- **Alamat IP (IPv4)**: 4 angka 0–255, misal `192.168.1.20`. Totalnya 32 bit.
- **Subnet**: sekumpulan IP yang berurutan, ditulis dengan **CIDR** `alamat/prefix`.
  `/prefix` = berapa bit awal yang **tetap**; sisanya bebas dipakai host.

| CIDR | Rentang | Jumlah alamat |
|---|---|---|
| `10.213.0.0/24` | `10.213.0.0` – `10.213.0.255` | 256 |
| `172.17.0.0/16` | `172.17.0.0` – `172.17.255.255` | 65.536 |
| `192.168.16.0/20` | `192.168.16.0` – `192.168.31.255` | 4.096 |
| `127.0.0.0/8` | `127.0.0.0` – `127.255.255.255` | 16 juta |

Dua subnet **overlap** (bentrok) jika rentangnya beririsan. Contoh: `172.30.0.0/24` overlap dengan `172.30.0.0/16`, dan juga dengan `172.16.0.0/12` (yang mencakup `172.16.x` s.d. `172.31.x`).

---

## 2. Jenis-jenis IP yang kita temui

```
                         INTERNET (IP publik)
                                │
                   ┌────────────┴────────────┐
                   │  Cloudflare edge         │  104.x / 172.64.x … (IP publik Cloudflare)
                   └────────────┬────────────┘
                                │ tunnel (koneksi KELUAR dari server)
┌───────────────────────────────┼──────────────────────────────────────────┐
│ SERVER / HOST                 │                                          │
│  eno1   192.168.1.x  (LAN kantor/datacenter, IP privat)                  │
│  lo     127.0.0.1    (localhost — hanya host itu sendiri)                │
│                               │                                          │
│  ┌─ docker network hr-staging-net 10.213.0.0/24 (bridge, IP privat) ──┐  │
│  │  cloudflared 10.213.0.x ──► nginx 10.213.0.x ──► app / backoffice / │  │
│  │                                                 seaweedfs           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌─ docker network hr-system-api_hr-system-net 172.x (stack dev) ─────┐  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

| Jenis | Contoh | Bisa diakses dari | Keterangan |
|---|---|---|---|
| **Loopback / localhost** | `127.0.0.1`, `::1` | **Hanya mesin itu sendiri** | Tidak pernah keluar ke kabel jaringan. Setiap container juga punya `127.0.0.1` **sendiri** — `localhost` di dalam container ≠ `localhost` host. |
| **IP privat LAN** | `192.168.1.20` (`eno1`) | Perangkat di jaringan lokal yang sama | Diberi router/DHCP. Tidak bisa di-route di internet (RFC 1918). |
| **IP privat Docker** | `172.17.0.2`, `10.213.0.5` | Container lain di **network Docker yang sama**, dan host | Dibuat Docker untuk tiap network bridge. Hanya ada di dalam host. |
| **IP publik** | `203.0.113.7`, IP Cloudflare | Seluruh internet | Unik secara global. Server kita **tidak** perlu IP publik karena memakai Cloudflare Tunnel. |
| **IP publik kantor (NAT)** | IP yang terlihat di "what is my ip" | — | Banyak perangkat LAN keluar ke internet lewat satu IP publik router. Inilah yang dicek fitur absen web (IP kantor). |

Rentang IP privat (RFC 1918) — boleh dipakai siapa saja, asal tidak bentrok **di dalam satu mesin/jaringan**:

- `10.0.0.0/8`
- `172.16.0.0/12` (`172.16.x` – `172.31.x`)
- `192.168.0.0/16`

### Kenapa "0.0.0.0" berbeda?

`0.0.0.0` bukan alamat tujuan, tapi artinya "**semua interface**" saat sebuah server *listen*.
Nuxt di container listen di `HOST=0.0.0.0` supaya bisa dihubungi dari container lain; kalau listen di `127.0.0.1` saja, hanya proses di container itu yang bisa mengaksesnya.

### Port publish Docker: `5432:5432` vs `127.0.0.1:35432:5432`

| Penulisan di compose | Siapa yang bisa akses |
|---|---|
| `"5432:5432"` | Semua interface host → siapa pun yang bisa menjangkau IP host (LAN, bahkan internet kalau IP host publik) |
| `"127.0.0.1:35432:5432"` | Hanya dari host itu sendiri (atau lewat SSH tunnel) — ini yang dipakai staging untuk Postgres & RabbitMQ UI |
| (tidak ada `ports:`) | Hanya container di network Docker yang sama — app, nginx, seaweedfs di staging |

---

## 3. Subnet Docker ada di layer mana?

Model TCP/IP disederhanakan:

| Layer | Isi | Di stack kita |
|---|---|---|
| 7 Aplikasi | HTTP, Host header, `X-Forwarded-For` | nginx memilih vhost dari `Host`, API membaca `X-Forwarded-For` |
| 4 Transport | TCP/UDP, **port** | `app:8080`, `nginx:80`, `postgres:5432` |
| **3 Network** | **IP & routing, subnet** | **`hr-staging-net` = `10.213.0.0/24`** |
| 2 Data link | Ethernet, MAC, **bridge** | interface `br-xxxx` yang dibuat Docker |

Saat `docker network create --subnet 10.213.0.0/24 hr-staging-net`, Docker:

1. Membuat **bridge Linux** (layer 2), misal `br-1a2b3c` — semacam switch virtual.
2. Memberi bridge itu IP gateway `10.213.0.1` dan menambah **route** di tabel routing host (layer 3):
   ```
   10.213.0.0/24 dev br-1a2b3c
   ```
3. Memberi tiap container yang join IP dari subnet itu (`10.213.0.2`, `.3`, …).
4. Menyediakan DNS internal (`127.0.0.11`) supaya nama service (`nginx`, `app`) bisa di-resolve ke IP-nya.

Lihat semua route di host:

```bash
ip -4 route
# 172.17.0.0/16 dev docker0
# 172.18.0.0/16 dev br-2d31577bf113
# ...
# 192.168.1.0/24 dev eno1
```

---

## 4. Kenapa bisa bentrok?

Tabel routing host harus **tidak ambigu**: untuk setiap IP tujuan, kernel harus tahu lewat interface mana paketnya dikirim. Kalau dua network memakai rentang yang beririsan, paket ke `172.30.0.5` tidak jelas harus ke bridge yang mana. Karena itu Docker **menolak** membuat network yang subnetnya overlap dengan network lain yang sudah ia kelola:

```
Pool overlaps with other one on this address space
```

Penyebab yang umum:

1. **Docker memberi subnet otomatis** untuk setiap network yang dibuat tanpa `--subnet` (setiap project compose punya network sendiri). Pool bawaannya adalah `172.17.0.0/16` s.d. `172.31.0.0/16`, lalu `192.168.x.0/20`. Setelah banyak project compose dibuat, rentang 172.x cepat habis terpakai — dan `172.30.x` ikut terambil oleh salah satunya.
2. Network yang terambil **tidak selalu terlihat** di `ip route` (misal network yang belum pernah dipakai container), tapi tetap tercatat di Docker.
3. Bentrok juga bisa terjadi dengan **jaringan di luar Docker**: LAN kantor, VPN (misal VPN memakai `10.0.0.0/8`), atau jaringan cloud. Docker tidak selalu mendeteksi ini; gejalanya host tiba-tiba tidak bisa menjangkau alamat VPN/LAN tertentu.

Cara mengecek subnet yang sudah dipakai Docker:

```bash
docker network inspect $(docker network ls -q) \
  -f '{{.Name}}: {{range .IPAM.Config}}{{.Subnet}} {{end}}'
```

Solusi yang dipakai: pilih subnet di rentang yang **tidak dipakai pool otomatis Docker** dan kecil kemungkinan dipakai LAN/VPN → `10.213.0.0/24`. Kalau masih bentrok, ganti saja ke subnet kosong lain.

> Kenapa staging butuh subnet **tetap**, bukan otomatis? Karena IP-nya disebut di konfigurasi: nginx hanya mempercayai header `CF-Connecting-IP` dari subnet ini (`set_real_ip_from`), dan API hanya mempercayai `X-Forwarded-For` dari subnet ini (`TRUSTED_PROXIES`). Kalau subnet berubah tiap kali network dibuat ulang, konfigurasi itu akan salah.

---

## 5. Perjalanan satu request di staging

```
Browser karyawan (IP publik kantor 203.0.113.7)
   │ HTTPS ke staging-api-hr.yubicom.co.id
   ▼
Cloudflare edge (TLS selesai di sini) — menambah header CF-Connecting-IP: 203.0.113.7
   │ lewat tunnel yang sudah dibuka cloudflared dari dalam server (koneksi keluar,
   │ jadi server tidak perlu IP publik / port terbuka)
   ▼
cloudflared  10.213.0.a   ── HTTP ke nginx:80 ─►
nginx        10.213.0.b   realip: percaya CF-Connecting-IP karena datang dari 10.213.0.0/24
                          → $remote_addr = 203.0.113.7, kirim X-Forwarded-For: 203.0.113.7
   ▼
app (API)    10.213.0.c   TRUSTED_PROXIES=10.213.0.0/24 → percaya XFF dari nginx
                          → ClientIP() = 203.0.113.7 → dicocokkan dengan IP kantor
```

Yang ada di setiap titik:

| Titik | IP sumber yang terlihat di koneksi TCP | IP client "asli" diketahui dari |
|---|---|---|
| Cloudflare edge | `203.0.113.7` (publik) | koneksi TCP langsung |
| nginx | IP container cloudflared (`10.213.0.a`) | header `CF-Connecting-IP` |
| app | IP container nginx (`10.213.0.b`) | header `X-Forwarded-For` |

---

## 6. Ringkasan cepat

- **localhost (`127.0.0.1`)**: hanya mesin/container itu sendiri. Di dalam container, `localhost` adalah container itu, **bukan** host.
- **IP LAN (`192.168.x`)**: jaringan lokal fisik server.
- **IP Docker (`172.x`, `10.213.x`)**: jaringan virtual di dalam host, antar-container. Diatur Docker lewat bridge + route (layer 2/3).
- **IP publik**: alamat di internet. Server staging tidak memerlukannya — Cloudflare Tunnel membuat koneksi keluar.
- **Bentrok subnet** = dua network memakai rentang IP yang beririsan di host yang sama, sehingga routing menjadi ambigu. Solusinya pilih rentang lain yang kosong dan samakan `STAGING_NETWORK_SUBNET` + `TRUSTED_PROXIES` di `.env.staging`.
