# Data Awal

Folder untuk berkas CSV pengisian awal master data (Langkah 0a–0c di
`ROADMAP.md`). Diimpor lewat layar Master Data pada **Sesi 4**.

| Berkas | Isi | Target |
|---|---|---|
| `master_item_template.csv` | Kode item, nama, satuan baku, kategori | 120–150 baris |
| `master_toko.csv` | Nama toko, alamat, status PKP | 10–20 baris |
| `master_proyek.csv` | Kode proyek, nama proyek | proyek aktif |

`master_item_template.csv` sudah tersedia dengan 30 baris contoh. Kolomnya
sudah cocok dengan tabel `master_item` hasil migrasi `0001_init.sql`:
`kode_item, nama_baku, kategori, sub_kategori, satuan_baku, spesifikasi, aktif`.

Perlu diisi sampai **120–150 baris** sebelum Sesi 4. Kategori harus salah satu
dari `MATERIAL`, `ALAT`, `OPERASIONAL`, `LAIN-LAIN`, dan `nama_baku` mengikuti
format Jenis + Merek + Spesifikasi + Ukuran — misalnya
`Semen PCC Tiga Roda 50kg`. Nama yang tidak seragam membuat harga antar toko
tidak bisa dibandingkan, dan itu justru alasan aplikasi ini dibangun.

Penyusunan daftar item adalah pekerjaan manusia dan dikerjakan **paralel**
dengan Sesi 1–3, bukan setelahnya.
