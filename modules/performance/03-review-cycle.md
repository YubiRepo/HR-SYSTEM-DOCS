# 03 · Review Cycle

Bagaimana penilaian dijalankan: dari membuka siklus, mengumpulkan penilaian (self/manager/360), hingga kalibrasi & rating akhir.

---

## 1. Review Cycle (Siklus Penilaian)

Periode penilaian resmi.
```
Cycle "Penilaian Q1 2026"
  ├── periode     : Jan–Mar 2026
  ├── framework   : KPI + kompetensi
  ├── tahapan     : self → manager → calibration
  ├── window      : 1–14 Apr 2026 (masa pengisian)
  └── status      : draft / open / in_review / calibration / closed
```
Configurable: kuartalan, semester, tahunan, atau probation review.

---

## 2. Tahapan Penilaian

### 2.1 Self-Assessment
Karyawan menilai diri terhadap goal & kompetensi.
```
karyawan: isi pencapaian tiap goal + skor kompetensi + komentar
```
Menumbuhkan refleksi & jadi bahan diskusi dengan manajer.

### 2.2 Manager Review
Atasan (reporting line Core HR) menilai bawahan.
```
manajer: skor tiap goal/kompetensi + feedback + usulan rating
```
Bisa melihat self-assessment sebagai referensi (configurable: sebelum/sesudah menilai).

### 2.3 360 Feedback (opsional)
Masukan dari banyak sisi untuk pandangan menyeluruh.
```
kandidat feedback: atasan + 2–3 rekan + bawahan (bila ada)
  → pertanyaan configurable (skala + naratif)
  → bisa anonim (configurable) untuk kejujuran
```
Nilai 360 melengkapi (bukan menggantikan) manager review.

---

## 3. Kalibrasi (Calibration)

Masalah: penilai berbeda punya standar berbeda (ada yang "murah nilai", ada yang "pelit"). Kalibrasi menormalkan skor lintas tim agar adil.

```
sebelum: Tim A rata-rata 4.5, Tim B rata-rata 3.2 (padahal kinerja mirip)
   → sesi kalibrasi (HR + para manajer)
   → sesuaikan agar sebanding lintas tim
sesudah: distribusi lebih adil
```

- **Distribusi** — sebagian perusahaan pakai target distribusi (mis. bell curve) — opsional & kontroversial; configurable.
- **Transparansi** — penyesuaian tercatat (audit), alasan didokumentasikan.

> Kalibrasi opsional tetapi disarankan untuk perusahaan menengah–besar agar rating konsisten.

---

## 4. Rating Akhir

Setelah semua tahap + kalibrasi:
```
rating akhir = f(skor goal × bobot, skor kompetensi, penyesuaian kalibrasi)
```
Skala rating configurable, mis.:
| Rating | Arti |
|---|---|
| 5 | Outstanding |
| 4 | Exceeds |
| 3 | Meets |
| 2 | Below |
| 1 | Needs improvement |

Hasil dibagikan ke karyawan (1-on-1 dengan manajer) + tindak lanjut.

---

## 5. Tindak Lanjut

| Tindak lanjut | Keterangan |
|---|---|
| **Pengembangan** | Rencana pelatihan/development (PDP) |
| **Bonus** | Rating → bonus kinerja (Payroll, opsional — lihat `06-integration.md`) |
| **Promosi/mutasi** | Usulan ke Core HR |
| **PIP** | Performance Improvement Plan untuk rating rendah |

---

## 6. Lifecycle Siklus

```
DRAFT → OPEN (isi self) → IN_REVIEW (manager/360) → CALIBRATION → CLOSED
```
Setelah `closed`, hasil dikunci (auditable). Perbaikan lewat siklus berikutnya / adjustment tercatat.

---

## 7. Scope & Privasi

- Karyawan lihat hasil sendiri; manajer lihat timnya; HR lintas (scope RBAC).
- 360 feedback bisa anonim; data penilaian sensitif — akses ketat.
