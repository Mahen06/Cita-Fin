# Migrasi Database

Seluruh SQL disimpan di folder ini sebagai berkas bernomor urut. Jangan
menjalankan SQL lewat editor Supabase tanpa menyimpannya di sini — skema
yang hanya ada di dashboard tidak bisa ditelusuri maupun diulang.

Proyek Supabase: `wwrzgewfkvxqcwaguivv` (CitaFIN, region ap-southeast-1).

## Urutan

| Berkas | Isi |
|---|---|
| `0001_init.sql` | Skema lengkap: 7 tabel, 4 view, 3 RPC, trigger audit, RLS, 5 item bawaan untuk aturan B5 |
| `0002_perbaikan_keamanan.sql` | Menutup tiga lubang yang terbukti bisa dieksploitasi pada 0001 |
| `0003_cabut_hak_jalan_publik.sql` | Koreksi atas 0002 — hak jalan fungsi dicabut dari `PUBLIC`, bukan dari `anon` |

## Setelah skema berubah

Perbarui tipe TypeScript (CLAUDE.md butir 5):

```bash
npx supabase gen types typescript \
  --project-id wwrzgewfkvxqcwaguivv > src/lib/database.types.ts
```

## Yang masih harus dikerjakan di sesi berikutnya

- **Aturan B4 di tingkat tabel.** `simpan_nota` dan `ubah_nota` sudah
  menolak nota `final` yang selisihnya bukan nol, tetapi tabel `nota`
  sendiri belum. Pengguna dengan peran `finance` masih bisa menembus
  aturan itu lewat `POST /rest/v1/nota` langsung, tanpa melewati RPC.
  Perlu constraint trigger saat Sesi 5 (Input Nota) dikerjakan.
