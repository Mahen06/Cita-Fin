# Migrasi Database

Seluruh SQL disimpan di folder ini sebagai berkas bernomor urut
(`0001_init.sql`, `0002_….sql`, dan seterusnya). Jangan menjalankan SQL
lewat editor Supabase tanpa menyimpannya di sini — skema yang hanya ada di
dashboard tidak bisa ditelusuri maupun diulang.

## Status

Folder ini masih kosong. `0001_init.sql` dijalankan pada **Sesi 2**
(lihat `ROADMAP.md` — Tahap 1, urutan pengerjaan).

Berkas `0001_init.sql` yang disebut di `ROADMAP.md` tidak ikut terkirim
bersama paket dokumen. Sebelum Sesi 2 dimulai, letakkan berkas itu di sini —
atau minta skema disusun ulang dari `docs/SPEK-FITUR.md` dan aturan bisnis
B1–B9 di `CLAUDE.md`.

## Setelah skema berubah

Perbarui tipe TypeScript (CLAUDE.md butir 5):

```bash
npx supabase gen types typescript \
  --project-id cwsspzmdfwstqgfpstdv > src/lib/database.types.ts
```
