# CitaFIN — Spesifikasi Fitur v1.0

Dokumen acuan saat pengerjaan di Claude Code. Aturan bisnis dan prinsip desain ada di `CLAUDE.md`; skema database ada di `supabase/migrations/0001_init.sql`.

---

## 1. Peran & Hak Akses

| Peran | Cek Harga | Banding Toko | Laporan | Input Nota | Master Item | Audit |
|---|---|---|---|---|---|---|
| **admin** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **finance** | ✓ | ✓ | ✓ | ✓ | baca | — |
| **logistik** | ✓ | ✓ | ✓ | draft saja | baca | — |
| **engineering** | ✓ | ✓ | ✓ | — | baca | — |
| **manajer** | ✓ | ✓ | ✓ | — | baca | ✓ |

Di Tahap 1 hanya `admin` dan `finance` yang benar-benar dipakai. Sisanya tetap dibuat agar Tahap 3 tidak perlu mengubah struktur.

---

## 2. Peta Navigasi Mobile

Tab bar bawah, empat item:

| Tab | Rute | Catatan |
|---|---|---|
| **Cek Harga** | `/` | **Halaman pembuka** — ini alasan aplikasi dibangun |
| **Input** | `/nota/baru` | Disembunyikan bagi peran tanpa hak input |
| **Laporan** | `/laporan` | |
| **Menu** | `/menu` | Banding Toko, Master Data, Audit, Profil, Keluar |

---

## 3. Alur Utama

```
Buka aplikasi
   └─ Cek Harga (langsung fokus ke kotak pencarian)
        └─ ketik "semen" → pilih item
             └─ daftar harga per toko, urut termurah
                  └─ ketuk kartu → detail nota + foto nota asal

Input Nota
   └─ Header: tanggal · proyek · toko · no. nota · metode bayar
        └─ Baris item: cari item → qty → harga (terisi harga terakhir)
             └─ ulangi
                  └─ Total nota dari nota fisik → indikator selisih
                       └─ selisih nol → Simpan Final
                       └─ selisih ≠ nol → hanya Simpan Draft
```

---

## 4. Daftar Fitur

### F1 — Cek Harga · **WAJIB**

- Kotak pencarian besar, fokus otomatis saat halaman terbuka
- Pencarian fuzzy lewat RPC `cari_item`, hasil muncul saat mengetik (debounce 250ms)
- Pilih item → kartu harga per toko, **urut termurah**
- Isi tiap kartu: nama toko · harga satuan · satuan · tanggal · nama proyek · penanda PKP
- Penanda tren: naik / turun / tetap dibanding pembelian sebelumnya di toko yang sama
- Baris ringkasan dari `v_ringkas_harga`: terendah · tertinggi · rata-rata · jumlah toko
- Filter periode: 3 bulan / 6 bulan / 1 tahun / semua
- Ketuk kartu → detail nota asal + foto nota
- Riwayat pencarian terakhir tersimpan lokal untuk akses cepat

> **Kriteria terima:** dari membuka aplikasi sampai melihat harga sebuah material di semua toko **kurang dari 15 detik**, di HP, dengan satu tangan.

---

### F2 — Input Nota · **WAJIB**

**Header**
- Tanggal (default hari ini) · proyek · toko · nomor nota toko · metode bayar
- Toko dan proyek dari dropdown pencarian, bukan daftar panjang

**Baris item**
- Cari item dari `master_item` (B1) — tidak ada input teks bebas
- Satuan terisi otomatis dari `satuan_baku`, ditampilkan tapi terkunci (B6)
- **Harga satuan terisi otomatis** dari `v_harga_terakhir` untuk item+toko tersebut, bisa diubah
- Bila harga baru menyimpang > 20% dari harga terakhir, tampilkan peringatan halus — bukan blokir
- Subtotal terhitung otomatis
- Geser untuk menghapus baris
- Tombol tambah baris selalu terlihat di layar sempit

**Penutup**
- Input `total_nota` dari nota fisik
- **Indikator selisih real-time** (B4): nol → hijau, Simpan Final aktif; ≠ nol → merah, hanya Simpan Draft
- Ambil foto nota dari kamera, kompresi klien ke lebar maks 1280px sebelum unggah
- Tombol **Duplikat Nota Terakhir** untuk belanja rutin ke toko yang sama
- Simpan lewat RPC `simpan_nota` (atomik)

> **Kriteria terima:** nota berisi 8 item selesai diinput dari HP dalam **kurang dari 90 detik**, sekali simpan.

---

### F3 — Banding Toko · **WAJIB**

- Pilih 2–3 toko + periode
- Tampil hanya item yang **beririsan** di antara toko terpilih
- Layar sempit: kartu per item, harga tiap toko di dalamnya, termurah ditandai
- Layar lebar: matriks item × toko
- Kolom selisih rupiah dan persentase terhadap harga termurah
- Penanda status PKP sebagai pengingat basis perbandingan

---

### F4 — Laporan Pengeluaran per Proyek · **WAJIB**

- Filter: proyek · rentang tanggal · kategori
- Data **dikelompokkan ulang per nota**, sehingga tampilan cetak identik dengan laporan Excel lama
- Ringkasan atas: total per kategori dan total keseluruhan
- Ekspor PDF (`jspdf-autotable`) dan CSV
- Tombol bagikan langsung dari HP ke WhatsApp/email
- Hanya nota berstatus `final` (B9)

> **Kriteria terima:** penerima laporan tidak menyadari ada perubahan sistem di belakangnya.

---

### F5 — Master Data · **WAJIB (item)**

- CRUD `master_item`, `master_toko`, `master_proyek`
- Tambah/ubah item hanya untuk `admin` (B7)
- **Deteksi duplikat:** saat menambah item baru, tampilkan item mirip yang sudah ada (`similarity > 0.4`) beserta konfirmasi eksplisit
- Item tidak pernah dihapus, hanya dinonaktifkan
- Impor massal dari CSV untuk pengisian awal, dengan pratinjau sebelum simpan

---

### F6 — Autentikasi & Peran · **WAJIB**

- Login email + password via Supabase Auth
- Tabel `profil` menyimpan peran; menu menyesuaikan
- Sesi bertahan lama — jangan paksa login ulang tiap hari di HP
- Halaman kelola pengguna untuk `admin`

---

### F7 — PWA & Draft Offline · **PENTING**

- `manifest.json` + service worker, bisa dipasang sebagai ikon di layar HP
- Nota tanpa sinyal disimpan sebagai draft lokal di IndexedDB
- Indikator jumlah draft belum tersinkron, sinkron otomatis saat online
- Master item di-cache agar Cek Harga tetap berguna dengan data terakhir

---

### F8 — Audit Harga · **PENTING**

- Trigger `trg_audit_harga` sudah ada di migrasi
- Halaman riwayat perubahan harga, hanya untuk `admin` dan `manajer`

---

## 5. Di Luar Cakupan v1.0

Jurnal umum, neraca, laba rugi, perpajakan · absensi & penggajian · borongan tenaga kerja dan termin mandor · integrasi otomatis ke RAB dan stok logistik *(v1.1)* · peringatan realisasi melebihi RAB *(v1.1)* · persetujuan berjenjang · multi-mata uang.

---

## 6. Definisi Selesai per Langkah

- [ ] Berfungsi di lebar 380px tanpa scroll horizontal
- [ ] Diuji di HP asli, bukan hanya emulator peramban
- [ ] Ada status memuat, kosong, dan galat
- [ ] Validasi di klien **dan** di database
- [ ] RLS diuji dengan akun peran lain
- [ ] Tidak ada `console.error` tersisa
- [ ] Target waktu pada kriteria terima tercapai

---

## 7. Daftar Uji Sebelum Cutoff

| # | Skenario | Hasil yang benar |
|---|---|---|
| 1 | Input nota, total tidak cocok | Merah, Simpan Final terkunci |
| 2 | Input nota 8 item | Selesai < 90 detik, tersimpan sekali |
| 3 | Nota draft | Tidak muncul di Cek Harga maupun Laporan |
| 4 | Tambah item mirip yang sudah ada | Peringatan duplikat muncul |
| 5 | Akun `engineering` mencoba input nota | Ditolak RLS, bukan sekadar menu disembunyikan |
| 6 | Akun `finance` mencoba tambah master item | Ditolak RLS |
| 7 | Cek Harga item dengan 5 toko | Urut termurah, tanggal benar |
| 8 | Ongkir 50.000 dalam satu nota | Tidak mempengaruhi harga satuan material di Cek Harga |
| 9 | PDF laporan proyek | Format setara laporan Excel lama |
| 10 | Input dalam mode pesawat | Tersimpan sebagai draft lokal, tersinkron saat online |
| 11 | Ubah harga pada nota final | Tercatat di `audit_harga` |
| 12 | Pencarian "smen" (salah ketik) | Semen tetap muncul lewat pencarian fuzzy |
| 13 | Foto nota 4MB dari kamera | Terkompresi lalu terunggah di jaringan seluler |
| 14 | Nota dengan item satuan sak | Satuan terkunci, tidak bisa diubah jadi kg |
