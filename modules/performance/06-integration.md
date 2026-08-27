# 06 · Integration

Performance memakai data Core HR dan (opsional) mengirim hasil ke Payroll untuk bonus kinerja.

---

## 1. Dengan Core HR

| Data | Guna |
|---|---|
| Karyawan & posisi | Subjek penilaian; template per level/jabatan |
| Reporting line | Menentukan reviewer (manajer menilai bawahan) |
| Cabang & tim | Scope review & sesi kalibrasi |
| Status karyawan | Hanya karyawan aktif ikut siklus |

Reviewer "manajer" diambil dari reporting line — tanpa hardcode. Bila atasan kosong, fallback ke HR (configurable).

---

## 2. Dengan Payroll (Bonus — Opsional)

Kaitan hasil rating → bonus bersifat **opsional** (bisa dinonaktifkan). Bila aktif:

```
review finalized (rating = 4)
   → mapping rating → bonus (aturan tenant)
        mis. rating 5 → 2× gaji, 4 → 1×, 3 → 0.5×, ≤2 → 0
   → kirim ke Payroll sebagai komponen BONUS_KINERJA
   → dibayar via payroll run (reguler / off-cycle)
```

- **Mapping rating→bonus** configurable per tenant.
- Nyambung ke komponen `BONUS_KINERJA` di Payroll (formula/fixed).
- Bila kaitan nonaktif, rating tetap dipakai untuk pengembangan/promosi tanpa efek gaji.

> Performance mengirim **hasil rating & usulan bonus**; perhitungan & pembayaran dilakukan Payroll.

---

## 3. Dengan Recruitment (opsional)

Data performa karyawan dapat menginformasikan:
- Evaluasi kualitas sumber rekrutmen (kandidat dari sumber X berkinerja baik?).
- Rekomendasi internal (karyawan berkinerja tinggi untuk posisi baru).

Bersifat analitik; tidak wajib.

---

## 4. Gerbang Entitlement & RBAC

```
request → Entitlement: tenant punya fitur "performance"?
        → RBAC: izin (performance:self/read/review/calibrate/config)?
        → scope: karyawan (self), manajer (team), HR (branch/tenant)
```
Performance sering berada di plan lebih tinggi (Pro/Enterprise). Bila tak berlangganan → `403 FEATURE_NOT_IN_PLAN`.

---

## 5. Dengan Notification (titik picu)

- Pembukaan siklus → ingatkan karyawan isi self-assessment.
- Deadline review mendekat → ingatkan manajer.
- Permintaan 360 feedback → ke responden.
- Hasil rating terbit → ke karyawan.

> Sampai modul Notification ada, titik-titik ini disiapkan sebagai event.

---

## 6. Ringkasan Aliran

```
Core HR (karyawan, reporting line)
      │
      ▼
 PERFORMANCE (goal → review → kalibrasi → rating)
      │ (opsional, bila aktif)
      ▼
 Payroll (BONUS_KINERJA) → dibayar via payroll run
```
