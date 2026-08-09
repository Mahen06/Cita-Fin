# CitaFIN

Aplikasi pencatatan pengeluaran proyek dan pelacakan harga material untuk perusahaan konstruksi. Pengguna utama: tim finance. Dipakai terutama **dari HP**.

Masalah yang diselesaikan: pengeluaran selama ini dicatat borongan per nota di Excel, sehingga mencari harga satuan sebuah material atau membandingkan harga antar toko memakan 10–20 menit setiap kali ditanyakan.

---

## Tumpukan Teknologi

| Lapis | Pilihan |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase — PostgreSQL, Auth, Storage, RLS |
| Client | `@supabase/supabase-js` |
| Offline | IndexedDB via `idb` |
| PWA | `vite-plugin-pwa` |
| PDF | `jspdf` + `jspdf-autotable` |
| Deploy | Vercel |

---

## Aturan Kerja

1. **Kerjakan satu langkah pada satu waktu** sesuai urutan di `ROADMAP.md` Tahap 1. Berhenti di akhir setiap langkah untuk diuji sebelum lanjut.
2. **Jangan mengerjakan fitur di luar** `docs/SPEK-FITUR.md` Bagian 4. Bila terlihat ada peluang fitur tambahan, sebutkan sebagai catatan, jangan langsung dibuat.
3. **Tampilkan rencana perubahan berkas sebelum menulis**, terutama pada langkah yang menyentuh banyak berkas.
4. **Seluruh SQL disimpan sebagai berkas migrasi** di `supabase/migrations/`, diberi nomor urut. Jangan hanya dijalankan lewat editor Supabase.
5. Setelah mengubah skema, **perbarui tipe TypeScript** yang dihasilkan dari database.

---

## Prinsip Desain

- **Mobile-first mutlak.** Rancang untuk lebar 380px lebih dulu; desktop adalah versi melebar dari layout yang sama.
- Target sentuh minimal 44px.
- Tidak ada tabel yang menggulir horizontal di layar utama — gunakan kartu di layar sempit.
- Setiap layar wajib punya status memuat, status kosong, dan penanganan galat.
- Bahasa antarmuka: **Indonesia**. Istilah mengikuti kebiasaan finance — Nota, Proyek, Toko, Harga Satuan, Total Nota.

---

## Struktur Kode

Disusun per modul, bukan per jenis berkas. Ini disengaja: modul `pengeluaran` nantinya dipindahkan utuh ke aplikasi gabungan.

```
src/
├─ lib/             supabase client, auth, helper, format angka
├─ components/      komponen umum lintas modul
├─ modules/
│  └─ pengeluaran/  seluruh isi CitaFIN
│     ├─ pages/
│     ├─ components/
│     └─ hooks/
└─ App.tsx          routing + penjaga peran
```

**Jangan menaruh logika bisnis di dalam komponen.** Letakkan di hooks atau di `lib/`, agar bisa dipakai ulang modul lain nanti.

---

## Aturan Bisnis yang Tidak Bisa Ditawar

Ditegakkan di database, bukan hanya di antarmuka.

| # | Aturan |
|---|---|
| B1 | `kode_item` wajib berasal dari `master_item` — tidak ada input teks bebas untuk nama item |
| B2 | Kategori MATERIAL & ALAT wajib diinput per item, bukan borongan |
| B3 | Kategori OPERASIONAL & LAIN-LAIN boleh satu baris borongan |
| B4 | `total_nota − Σ subtotal` harus **nol** sebelum nota berstatus `final` |
| B5 | Ongkir, PPN, dan diskon adalah baris item tersendiri — tidak pernah dilebur ke harga satuan material |
| B6 | Satuan mengikuti `satuan_baku` item, ditampilkan tapi tidak bisa diubah saat input |
| B7 | Penambahan `master_item` hanya oleh peran `admin` |
| B8 | Perubahan `harga_satuan` pada nota final dicatat di `audit_harga`, tidak ditimpa diam-diam |
| B9 | Nota berstatus `draft` tidak muncul di laporan maupun riwayat harga |

---

## Aturan Penamaan Database

Empat tabel berikut **milik bersama**, bukan milik CitaFIN, karena modul logistik akan memakainya:

`profil` · `master_proyek` · `master_toko` · `master_item`

Konsekuensinya:

- **Jangan** menambahkan awalan `fin_`, `citafin_`, atau sejenisnya pada nama tabel mana pun
- **Jangan** menambahkan kolom yang hanya masuk akal bagi finance ke tabel master
- Tabel milik CitaFIN sendiri hanya `nota` dan `nota_detail`

---

## Keamanan

- `service_role key` **tidak pernah** masuk ke kode frontend, dalam bentuk apa pun
- Hanya `anon key` yang dipakai di klien; keamanan dijaga oleh RLS
- Setiap tabel baru wajib punya kebijakan RLS sebelum dipakai
- Uji RLS dengan akun peran lain — bukan diasumsikan aman karena menunya disembunyikan

---

## Definisi Selesai

Sebuah langkah dianggap selesai bila:

- [ ] Berfungsi di lebar 380px tanpa scroll horizontal
- [ ] Sudah diuji di HP asli, bukan hanya emulator peramban
- [ ] Ada status memuat, kosong, dan galat
- [ ] Validasi ada di klien **dan** di database
- [ ] RLS diuji dengan akun peran lain
- [ ] Tidak ada `console.error` tersisa
- [ ] Target waktu pada kriteria terima tercapai

---

## Di Luar Cakupan v1.0

Ditulis eksplisit agar tidak diam-diam masuk saat pengerjaan:

Jurnal umum, neraca, laba rugi, perpajakan · absensi & penggajian · borongan tenaga kerja dan termin mandor · integrasi otomatis ke RAB dan stok logistik *(rencana v1.1)* · peringatan realisasi melebihi RAB *(v1.1)* · persetujuan berjenjang · multi-mata uang.
