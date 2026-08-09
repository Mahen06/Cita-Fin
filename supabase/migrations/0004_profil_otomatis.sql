-- =====================================================================
-- CitaFIN — Profil dibuat otomatis untuk setiap pengguna baru
--
-- Tanpa ini, pengguna yang baru didaftarkan lewat dashboard Supabase
-- tidak punya baris di `profil`. Akibatnya `peran_saya()` bernilai NULL
-- dan seluruh kebijakan RLS menolaknya — pengguna berhasil login tetapi
-- tidak bisa melakukan apa pun, tanpa keterangan yang jelas.
--
-- Peran awal sengaja `engineering`, peran dengan hak paling kecil pada
-- SPEK-FITUR Bagian 1: hanya bisa membaca. Menaikkan peran adalah
-- tindakan sadar oleh admin, bukan sesuatu yang terjadi diam-diam.
-- =====================================================================

create or replace function tangani_pengguna_baru()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profil (id, nama, peran)
  values (
    new.id,
    -- Nama diambil dari metadata bila diisi saat pendaftaran,
    -- kalau tidak ada dipakai bagian depan alamat email.
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'nama'), ''),
      split_part(new.email, '@', 1)
    ),
    'engineering'
  )
  on conflict (id) do nothing;

  return new;
end $$;

create trigger trg_pengguna_baru
  after insert on auth.users
  for each row execute function tangani_pengguna_baru();

revoke execute on function tangani_pengguna_baru() from public;
