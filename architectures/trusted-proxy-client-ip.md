# Trusted Proxy & IP Client

Catatan belajar: bagaimana API mengetahui IP asli client, kenapa header `X-Forwarded-For` bisa dipalsukan, dan apa fungsi env `TRUSTED_PROXIES`. Fitur yang bergantung pada IP client:

- [Absen via web (IP publik kantor)](/modules/attendance/15-web-clock-office-ip)
- Rate limit per IP (`middleware.RateLimitByIP`)
- Audit IP (login, `attendance_records.in_client_ip` / `out_client_ip`)

---

## 1. Dari mana API tahu IP client

### 1.1 Tanpa proxy

```
Browser (203.0.113.7) ──TCP──► API
```

API membaca IP dari koneksi TCP (`RemoteAddr`). Nilai ini **tidak bisa dipalsukan** oleh client, karena jawaban server harus sampai ke IP tersebut.

### 1.2 Dengan reverse proxy (kondisi production)

```
Browser (203.0.113.7) ──TCP──► Nginx (172.18.0.5) ──TCP──► API
```

- `RemoteAddr` di API = `172.18.0.5` (IP Nginx), bukan IP browser.
- Supaya IP asli tidak hilang, Nginx menambahkan header:
  ```
  X-Forwarded-For: 203.0.113.7
  ```
- API (`gin.Context.ClientIP()`) membaca header itu untuk mendapatkan IP asli.

Konfigurasi Nginx yang benar:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

`$proxy_add_x_forwarded_for` = isi `X-Forwarded-For` dari client (kalau ada) + `, ` + IP yang Nginx lihat dari koneksi TCP. Nginx **menambahkan** di kanan, tidak mengganti.

---

## 2. Masalahnya

`X-Forwarded-For` adalah header HTTP biasa. Client bisa mengirimnya sendiri:

```bash
curl -H "X-Forwarded-For: 203.0.113.7" https://api.example.com/api/v1/attendance/clock-in ...
```

Setelah lewat Nginx, header yang sampai di API:

```
X-Forwarded-For: 203.0.113.7, 36.80.1.1
                 └ ditulis client  └ ditambahkan Nginx (IP asli dari TCP)
```

Pertanyaannya: API harus memakai entri yang mana? Jawabannya ditentukan oleh `TRUSTED_PROXIES`.

---

## 3. Cara Gin memilih IP

Gin membaca `X-Forwarded-For` **hanya jika** `RemoteAddr` termasuk trusted proxy. Header dibaca **dari kanan ke kiri**: setiap IP yang trusted dilewati, dan Gin **berhenti di IP pertama yang tidak trusted**. IP itulah IP client.

| `TRUSTED_PROXIES` | Yang dianggap trusted | Hasil untuk `203.0.113.7, 36.80.1.1` |
|---|---|---|
| **Kosong** (default Gin) | Semua IP | Tidak ada titik berhenti, sehingga yang dipakai **entri paling kiri**: `203.0.113.7` ❌ palsu |
| **Diisi IP Nginx** | Hanya Nginx | Berhenti di `36.80.1.1` ✅ asli |

Kalau koneksi ke API **bukan** dari trusted proxy (misalnya seseorang menembak port API langsung), header diabaikan dan `RemoteAddr` dipakai.

---

## 4. Contoh kasus

Daftar IP kantor di attendance rule: `203.0.113.7`.

### 4.1 Karyawan buka ESS dari rumah (IP `36.80.1.1`)
Browser tidak bisa mengatur `X-Forwarded-For` (forbidden header), jadi header yang sampai di API: `36.80.1.1`.

| `TRUSTED_PROXIES` | `ClientIP` | Absen web |
|---|---|---|
| Kosong | `36.80.1.1` | Ditolak ✅ |
| Terisi | `36.80.1.1` | Ditolak ✅ |

### 4.2 Karyawan buka ESS di kantor (IP `203.0.113.7`)

| `TRUSTED_PROXIES` | `ClientIP` | Absen web |
|---|---|---|
| Kosong | `203.0.113.7` | Diterima ✅ |
| Terisi | `203.0.113.7` | Diterima ✅ |

### 4.3 Orang iseng dari rumah, curl dengan header palsu
Header di API: `203.0.113.7, 36.80.1.1`

| `TRUSTED_PROXIES` | `ClientIP` | Absen web |
|---|---|---|
| **Kosong** | `203.0.113.7` | **Diterima ❌ jebol** |
| **Terisi** | `36.80.1.1` | Ditolak ✅ |

**Kesimpulan:** untuk pemakaian normal, kosong dan terisi memberi hasil yang sama. Perbedaannya hanya muncul pada orang yang sengaja memalsukan header, dan justru itu yang ingin dicegah.

---

## 5. Mengisi `TRUSTED_PROXIES`

Isinya: **IP atau subnet yang menjadi `RemoteAddr` di API ketika request datang lewat proxy**, yaitu hop terakhir sebelum API. Bukan IP client, bukan IP kantor, dan bukan server frontend (kecuali frontend memang meneruskan request ke API, lihat §6).

| Setup | Nilai |
|---|---|
| Nginx dan API di host yang sama (tanpa Docker) | `127.0.0.1` |
| Nginx dan API di Docker network yang sama | Subnet network itu, misalnya `172.18.0.0/16` (`docker network inspect <network>`) |
| Nginx di host, API di container (port di-publish) | Gateway bridge Docker, biasanya `172.17.0.1` |
| Load balancer cloud | CIDR subnet load balancer / VPC, misalnya `10.0.0.0/16` |
| API langsung ke internet tanpa proxy | `127.0.0.1` (efeknya: header dari luar tidak pernah dipercaya) |

Lebih dari satu dipisah koma: `TRUSTED_PROXIES=127.0.0.1,172.18.0.0/16`.

**Jangan** mengisi `0.0.0.0/0` atau rentang yang mencakup IP client, karena efeknya sama dengan kosong.

---

## 6. Posisi frontend (Nuxt)

Backoffice/ESS memanggil API **langsung dari browser** (`NUXT_PUBLIC_API_BASE_URL`, tanpa BFF proxy):

```
Browser ──► Nginx (depan API) ──► API
Browser ──► Nginx (depan Nuxt) ──► Nuxt   ← hanya menyajikan halaman
```

Server Nuxt **tidak berada di jalur request** ke API, jadi tidak perlu dimasukkan ke `TRUSTED_PROXIES`.

Kalau suatu saat request ke API dibuat lewat server Nuxt (BFF):

```
Browser ──► Nuxt server ──► API
```

maka:
1. IP server Nuxt (seperti terlihat oleh API) **wajib** masuk `TRUSTED_PROXIES`.
2. Nuxt **wajib** meneruskan IP browser dengan cara menambahkan, bukan meneruskan header client apa adanya:
   ```ts
   const xff = [getRequestHeader(event, 'x-forwarded-for'), getRequestIP(event)].filter(Boolean).join(', ')
   ```
   Kalau di depan Nuxt juga ada Nginx, rantainya menjadi `client, nginx-nuxt, nuxt`, dan IP Nginx-Nuxt ikut masuk `TRUSTED_PROXIES`.

---

## 7. Checklist verifikasi

1. Nginx memakai `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`.
2. Bila memakai modul `real_ip` (misalnya untuk Cloudflare), `set_real_ip_from` hanya berisi rentang IP Cloudflare/LB, **bukan** `0.0.0.0/0`.
3. Port API tidak terbuka ke internet dan hanya bisa diakses lewat Nginx.
4. `GET /api/v1/attendance/rules/client-ip` (tombol *Use my current IP*) mengembalikan IP publik yang sama dengan `curl ifconfig.me`. Kalau yang muncul `172.x`, `10.x`, atau `127.0.0.1`, IP proxy belum masuk `TRUSTED_PROXIES`.
5. Request yang sama dengan `-H "X-Forwarded-For: 1.2.3.4"` **tidak** mengembalikan `1.2.3.4`.
6. Log startup API tidak menampilkan warning `TRUSTED_PROXIES is empty` (muncul bila env bukan `development`).
