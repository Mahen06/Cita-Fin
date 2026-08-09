# CitaFIN — Roadmap Tiga Tahap

**CitaFIN** adalah aplikasi pencatatan pengeluaran proyek dan pelacakan harga material. Berdiri sendiri, mobile-first, dibangun lebih dulu untuk tim finance.

| Tahap | Fokus | Durasi | Selesai bila |
|---|---|---|---|
| **1. Bangun & Deploy** | Pengerjaan di Claude Code sampai aplikasi live | 3–4 minggu | Finance bisa login dari HP dan menginput nota sungguhan |
| **2. Uji & Evaluasi** | Pemakaian nyata + perbaikan bertahap bersama finance | 2–4 minggu | Dua minggu berturut-turut tanpa temuan berat |
| **3. Integrasi** | Penggabungan dengan modul logistik yang sudah ada | 2–3 minggu | Satu login, satu basis data, dua modul |

---

## Keputusan Arsitektur yang Menentukan Tahap 3

> Ini bagian terpenting dari seluruh dokumen. Tahap 3 bisa memakan tiga hari atau tiga bulan — dan yang menentukan bukan pekerjaan di Tahap 3, melainkan keputusan yang diambil **sebelum baris kode pertama ditulis**.

Empat keputusan berikut wajib dipegang sejak Tahap 1:

### K1 — Satu proyek Supabase, sejak awal

CitaFIN dan modul logistik nantinya **berbagi satu database yang sama**. Jangan membuat proyek Supabase terpisah lalu berencana menggabungkan datanya belakangan — migrasi antar-proyek berarti memindahkan pengguna, ulang seluruh Auth, dan memetakan ulang relasi.

Aplikasinya boleh berdiri sendiri. Databasenya tidak perlu.

> **Penyimpangan tercatat — 9 Agustus 2026, Sesi 2.**
>
> K1 dilepas secara sadar. Saat migrasi hendak dijalankan, proyek Supabase
> yang ada ternyata sudah berisi modul logistik beserta datanya:
> `master_barang` 248 baris, `master_vendor` 22, `master_lokasi` 11 proyek,
> `profiles` 4 pengguna, `harga_vendor` 212 baris harga. Keempat "tabel milik
> bersama" pada K2 sudah ada lebih dulu dengan nama berbeda.
>
> Tersedia tiga jalan: memakai tabel yang sudah ada, membuat tabel kembar di
> database yang sama, atau memisahkan proyek Supabase. **Pilihan yang diambil
> adalah memisahkan proyek** — CitaFIN kini memakai proyek `CitaFIN`
> (`wwrzgewfkvxqcwaguivv`), sedangkan modul logistik tetap di proyek lamanya.
>
> Konsekuensi yang harus diingat saat menyusun Tahap 3: penggabungan nanti
> bukan lagi pekerjaan antarmuka semata seperti dijanjikan di bagian pembuka
> dokumen ini. Tahap 3 akan mencakup pemindahan pengguna, pengulangan seluruh
> Auth, dan pemetaan ulang relasi antar dua database — persis pekerjaan yang
> K1 ditulis untuk dihindari. Rekonsiliasi master item tetap harus dikerjakan,
> hanya berpindah tempat.

### K2 — Tabel master dirancang sebagai milik bersama

Empat tabel ini bukan milik CitaFIN, melainkan milik perusahaan:

`profil` · `master_proyek` · `master_toko` · `master_item`

Konsekuensinya: penamaan kolomnya netral, tidak boleh ada kolom yang hanya masuk akal bagi finance, dan modul logistik nanti membacanya langsung tanpa duplikasi.

Tabel milik CitaFIN sendiri hanya dua: `nota` dan `nota_detail`.

### K3 — Peran lengkap sejak hari pertama

`peran_enum` sudah memuat `admin`, `finance`, `logistik`, `engineering`, `manajer` sejak migrasi pertama, meskipun di Tahap 1 hanya finance dan admin yang dipakai. Menambah peran ke sistem yang sudah berisi data selalu lebih mahal daripada menyiapkannya sejak awal.

### K4 — Kode disusun per modul, bukan per jenis berkas

```
src/
├─ lib/            ← supabase client, auth, util (nanti dipakai bersama)
├─ components/     ← komponen umum (nanti dipakai bersama)
├─ modules/
│  └─ pengeluaran/ ← SELURUH isi CitaFIN ada di sini
└─ App.tsx         ← routing
```

Dengan struktur ini, Tahap 3 berarti menyalin satu folder `modules/pengeluaran/` ke dalam kerangka gabungan — bukan membedah aplikasi.

### Yang justru harus dihindari

| Godaan | Akibat di Tahap 3 |
|---|---|
| Nama tabel berawalan `fin_` atau `citafin_` | Harus ganti nama tabel saat integrasi, seluruh query ikut berubah |
| Proyek Supabase terpisah | Migrasi pengguna & data, pekerjaan berminggu-minggu |
| Logika bisnis ditulis langsung di komponen | Tidak bisa dipakai ulang modul lain |
| Master item disalin dari spreadsheet logistik | Dua sumber kebenaran, harga tidak bisa dibandingkan |

---

## Tahap 1 — Bangun & Deploy *(3–4 minggu)*

Dikerjakan di Claude Code. Berkas panduan dan migrasi sudah tersedia di paket ini.

### Sebelum koding dimulai

| # | Pekerjaan | Catatan |
|---|---|---|
| 0a | Susun **Master Item 120–150 baris** dari nota 3 bulan terakhir | Template CSV tersedia di `data/` |
| 0b | Susun **Master Toko** 10–20 baris | Tandai mana yang PKP |
| 0c | Daftar proyek aktif | Kode + nama |
| 0d | Buat proyek Supabase & akun Vercel | Simpan kredensial dengan benar |

Langkah 0a adalah pekerjaan manusia yang tidak bisa dipercepat oleh AI, dan aplikasi tanpa master item yang rapi hanya akan menghasilkan data yang tidak bisa dibandingkan. Kerjakan paralel dengan Minggu 1 koding, jangan setelahnya.

### Urutan pengerjaan

| Sesi | Isi | Bisa diuji sebagai |
|---|---|---|
| 1 | Inisialisasi proyek, Tailwind, PWA, klien Supabase, deploy kosong ke Vercel | URL live terbuka di HP |
| 2 | Jalankan migrasi `0001_init.sql`, verifikasi tabel & view | Query manual mengembalikan struktur benar |
| 3 | Auth + tabel profil + penjaga rute + menu per peran | Empat akun uji login, menu berbeda |
| 4 | Master Data + impor CSV + deteksi duplikat | Master item terisi penuh |
| 5 | **Input Nota** — form, baris dinamis, indikator selisih, RPC atomik | 10 nota lama diinput ulang dari HP |
| 6 | **Cek Harga** | Harga satu material lintas toko < 15 detik |
| 7 | **Banding Toko** | Dua toko terbanding dalam satu layar |
| 8 | **Laporan + ekspor PDF** | PDF setara laporan Excel lama |
| 9 | Foto nota: kompresi klien + Supabase Storage | Foto terunggah dari kamera di jaringan seluler |
| 10 | PWA, draft offline (IndexedDB), audit harga | Input mode pesawat tersinkron saat online |

**Aturan sesi:** satu sesi = satu langkah, berhenti untuk diuji di HP asli sebelum lanjut. Menumpuk tiga langkah dalam satu sesi adalah cara tercepat menghasilkan aplikasi yang sulit ditelusuri saat rusak.

### Gerbang menuju Tahap 2

- [ ] Aplikasi live dan terpasang sebagai ikon di HP finance
- [ ] Seluruh daftar uji di `docs/SPEK-FITUR.md` Bagian 7 lulus
- [ ] Master item terisi minimal 120 item aktif
- [ ] Akun finance, admin, dan satu akun uji manajer sudah dibuat

---

## Tahap 2 — Uji & Evaluasi Bersama Finance *(2–4 minggu)*

Tujuannya bukan mencari bug, melainkan menemukan **kenyataan lapangan yang tidak terlihat dari meja perancangan**: nota tulis tangan tanpa rincian, pembelian mandor pakai uang muka, item yang ternyata tidak ada di master, toko yang menuliskan satuan berbeda.

### Aturan main

| Aturan | Alasan |
|---|---|
| **Satu proyek dulu**, bukan semua proyek sekaligus | Kalau ada yang salah, kerusakan datanya terbatas |
| **Excel lama tetap jalan paralel** selama 2 minggu pertama | Jaring pengaman; hentikan setelah data terbukti cocok |
| **Evaluasi harian 10 menit** di minggu pertama, lalu mingguan | Keluhan yang tidak ditanyakan tidak akan disampaikan sendiri |
| **Perbaikan dikelompokkan**, bukan satu per satu | Deploy tiap jam membuat finance kehilangan kepercayaan pada aplikasi |

### Klasifikasi temuan

| Tingkat | Definisi | Tindakan |
|---|---|---|
| **Berat** | Data salah tersimpan, tidak bisa input, tidak bisa login | Perbaiki hari itu juga |
| **Sedang** | Bisa dikerjakan tapi memutar, memperlambat > 30 detik | Kumpulkan, deploy mingguan |
| **Ringan** | Tampilan, kata-kata, urutan menu | Kumpulkan, deploy saat ada perbaikan lain |
| **Permintaan baru** | Fitur di luar cakupan v1.0 | **Catat, jangan kerjakan** — tinjau setelah Tahap 3 |

Formulir evaluasi dan pertanyaan yang perlu ditanyakan ke finance ada di `docs/EVALUASI-FINANCE.md`.

### Gerbang menuju Tahap 3

Empat syarat, diperiksa bersama-sama:

| # | Syarat | Ambang |
|---|---|---|
| 1 | Dua minggu berturut-turut tanpa temuan **berat** | Wajib |
| 2 | Nota MATERIAL & ALAT terinput per item | ≥ 90% |
| 3 | Waktu menjawab pertanyaan harga | < 2 menit |
| 4 | Finance memilih aplikasi ini dibanding Excel, tanpa diminta | Wajib |

> Syarat keempat terdengar tidak formal, tapi justru paling menentukan. Kalau finance masih diam-diam kembali ke Excel, menggabungkan aplikasi ini dengan modul logistik hanya akan memperbesar masalah yang belum selesai.

Jika syarat belum terpenuhi, **perpanjang Tahap 2** — jangan lanjut ke Tahap 3.

---

## Tahap 3 — Integrasi dengan Modul Logistik *(2–3 minggu)*

Karena K1–K4 dijalankan, ini menjadi pekerjaan penggabungan antarmuka, bukan penggabungan data.

### Bentuk akhir

Satu aplikasi, satu login, dua modul:

```
Aplikasi (nama gabungan ditentukan nanti)
├─ Modul Pengeluaran  ← dari CitaFIN
│  └─ Input Nota · Cek Harga · Banding Toko · Laporan
├─ Modul Logistik     ← dari aplikasi yang sudah ada
│  └─ Stok Material · Stok Alat · Mutasi · Vendor
└─ Master bersama
   └─ Proyek · Item · Toko/Vendor · Pengguna & Peran
```

### Urutan kerja

| # | Pekerjaan | Titik rawan |
|---|---|---|
| 1 | **Rekonsiliasi master item** — satukan daftar material finance dengan daftar logistik | Pekerjaan tersulit di seluruh Tahap 3. Dua tim hampir pasti menamai barang yang sama dengan cara berbeda |
| 2 | Samakan `master_toko` dengan daftar vendor logistik | Vendor jasa vs toko material perlu dibedakan lewat kolom, bukan tabel terpisah |
| 3 | Migrasikan tabel logistik ke database yang sama | Beri kolom relasi ke `master_item.kode_item` |
| 4 | Satukan kerangka aplikasi: salin `modules/pengeluaran/` ke kerangka gabungan | Sudah disiapkan lewat K4 |
| 5 | Perluas RLS untuk peran logistik | Sudah disiapkan lewat K3 |
| 6 | **Sambungkan alur nota → stok** | Nota material masuk otomatis menambah stok di proyek terkait |
| 7 | Uji silang peran | Finance tidak bisa mengubah stok; logistik tidak bisa mengubah harga historis |

### Nilai yang baru muncul setelah digabung

Hal-hal ini tidak mungkin ada selama dua aplikasi terpisah:

- Nota pembelian material otomatis menambah stok di lokasi proyek — logistik berhenti mencatat ulang
- Harga satuan aktual mengalir ke penyusunan RAB proyek berikutnya
- Nilai persediaan terhitung dari harga beli sesungguhnya, bukan taksiran
- Selisih antara barang dibeli dan barang diterima menjadi terlihat

### Yang tetap ditunda ke v1.2

Peringatan realisasi melampaui RAB · persetujuan berjenjang · borongan tenaga kerja & termin mandor · jurnal akuntansi.

---

## Ringkasan Waktu

| Minggu | Kegiatan |
|---|---|
| 1 | Master item & toko (paralel) · Sesi koding 1–3 |
| 2 | Sesi koding 4–6 |
| 3 | Sesi koding 7–9 |
| 4 | Sesi koding 10 · pelatihan finance · **deploy** |
| 5–6 | Tahap 2: uji satu proyek, evaluasi harian, Excel paralel |
| 7–8 | Tahap 2: seluruh proyek, evaluasi mingguan, hentikan Excel |
| 9 | **Evaluasi gerbang** |
| 10–12 | Tahap 3: integrasi |

---

## Isi Paket Ini

| Berkas | Fungsi |
|---|---|
| `ROADMAP.md` | Dokumen ini |
| `CLAUDE.md` | Diletakkan di akar repositori — panduan tetap untuk Claude Code |
| `supabase/migrations/0001_init.sql` | Skema lengkap, siap dijalankan |
| `docs/SPEK-FITUR.md` | Spesifikasi fitur & kriteria terima |
| `docs/EVALUASI-FINANCE.md` | Alat bantu Tahap 2 |
| `docs/RENCANA-INTEGRASI.md` | Rincian teknis Tahap 3 |
| `data/master_item_template.csv` | Template pengisian Langkah 0a |
