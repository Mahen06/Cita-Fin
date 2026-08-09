# CitaFIN

Aplikasi pencatatan pengeluaran proyek dan pelacakan harga material untuk
perusahaan konstruksi. Dipakai terutama **dari HP** oleh tim finance.

Panduan kerja ada di [`CLAUDE.md`](./CLAUDE.md), urutan pengerjaan di
[`ROADMAP.md`](./ROADMAP.md), spesifikasi fitur di
[`docs/SPEK-FITUR.md`](./docs/SPEK-FITUR.md).

## Menjalankan di komputer

```bash
npm install
cp .env.example .env    # lalu isi nilainya
npm run dev
```

Aplikasi terbuka di `http://localhost:5173`.

Untuk mengujinya dari HP di jaringan Wi-Fi yang sama:

```bash
npm run dev -- --host
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Periksa tipe lalu bangun ke `dist/` |
| `npm run preview` | Menjalankan hasil build (service worker ikut aktif) |
| `npm run lint` | Pemeriksaan kode |

Service worker sengaja **dimatikan saat `npm run dev`** supaya perubahan
tidak tertahan cache. Uji perilaku PWA lewat `npm run build && npm run preview`.

## Variabel lingkungan

| Nama | Isi |
|---|---|
| `VITE_SUPABASE_URL` | URL proyek Supabase |
| `VITE_SUPABASE_ANON_KEY` | `anon` / publishable key |

`service_role key` tidak pernah dipakai di frontend. Keamanan data dijaga
oleh RLS di database.

Di Vercel, kedua variabel ini diisi pada **Project Settings → Environment
Variables** untuk lingkungan Production dan Preview. Vite menyisipkan
nilainya saat build, jadi setiap perubahan variabel perlu deploy ulang.

## Struktur

Disusun per modul, bukan per jenis berkas (K4 di `ROADMAP.md`) agar folder
`modules/pengeluaran/` bisa dipindahkan utuh ke aplikasi gabungan di Tahap 3.

```
src/
├─ lib/             klien Supabase, env, format angka — dipakai bersama
├─ components/      komponen umum lintas modul
└─ modules/
   └─ pengeluaran/  seluruh isi CitaFIN
```

Logika bisnis tidak diletakkan di dalam komponen, melainkan di `hooks/`
atau `lib/`.

## Deploy

Deploy dari branch produksi ke Vercel. Pastikan kedua variabel lingkungan
sudah terisi sebelum build pertama, jika tidak aplikasi akan terbuka pada
layar "Konfigurasi belum lengkap".
