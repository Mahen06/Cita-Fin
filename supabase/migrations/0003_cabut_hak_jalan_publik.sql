-- =====================================================================
-- CitaFIN — Cabut hak jalan fungsi dari peran PUBLIC
--
-- Koreksi atas 0002. Di sana hak jalan dicabut dari `anon`, dan itu
-- tidak berpengaruh sama sekali: PostgreSQL memberikan EXECUTE kepada
-- peran PUBLIC secara otomatis saat fungsi dibuat, dan `anon` mewarisi
-- dari PUBLIC. ACL-nya terbaca `=X/postgres` — tanda hak milik PUBLIC.
--
-- Mencabut dari `anon` tidak menghapus hak yang tidak pernah dimiliki
-- `anon` secara langsung. Yang harus dicabut adalah hak PUBLIC-nya.
--
-- Sesudah berkas ini, satu-satunya jalan masuk adalah peran
-- `authenticated` dan `service_role`.
-- =====================================================================

revoke execute on function simpan_nota(jsonb, jsonb)     from public;
revoke execute on function ubah_nota(uuid, jsonb, jsonb) from public;
revoke execute on function peran_saya()                  from public;
revoke execute on function cari_item(text, int)          from public;

grant execute on function simpan_nota(jsonb, jsonb)     to authenticated;
grant execute on function ubah_nota(uuid, jsonb, jsonb) to authenticated;
grant execute on function peran_saya()                  to authenticated;
grant execute on function cari_item(text, int)          to authenticated;

-- Fungsi trigger tidak pernah dipanggil lewat API, hanya oleh mesin
-- trigger di dalam database.
revoke execute on function catat_perubahan_harga() from public;

-- ---------------------------------------------------------------------
-- Catatan: pg_trgm sengaja dibiarkan di skema `public`.
--
-- Pemeriksa Supabase menandainya sebagai WARN kebersihan penamaan, bukan
-- lubang akses. Memindahkannya berarti memindahkan kelas operator
-- gin_trgm_ops yang menopang idx_item_nama_trgm — indeks yang menjaga
-- pencarian di layar Cek Harga tetap instan. Risiko memindahkan lebih
-- besar daripada manfaatnya, dan search_path seluruh fungsi sudah
-- dikunci di 0002 sehingga pembayangan nama tidak bisa terjadi.
-- ---------------------------------------------------------------------
