-- =====================================================================
-- CitaFIN — Dukungan layar Master Data (F5)
--
-- Dua RPC:
--   cari_item_mirip   deteksi duplikat saat menambah item baru
--   impor_master_item pengisian awal dari CSV, atomik
-- =====================================================================

-- ---------------------------------------------------------------------
-- Deteksi duplikat (F5, ambang similarity > 0.4)
--
-- Berbeda dari `cari_item`, fungsi ini SENGAJA tidak menyaring `aktif`.
-- Item yang sudah dinonaktifkan tetap menempati `kode_item` dan
-- `nama_baku` — menambahkan kembarannya justru menciptakan dua sumber
-- kebenaran, persis yang hendak dicegah aplikasi ini.
-- ---------------------------------------------------------------------
create or replace function cari_item_mirip(p_nama text, p_batas real default 0.4)
returns table (kode_item text, nama_baku text,
               kategori kategori_enum, satuan_baku text,
               aktif boolean, skor real)
language sql stable
set search_path = public, extensions, pg_temp
as $$
  select i.kode_item, i.nama_baku, i.kategori, i.satuan_baku, i.aktif,
         similarity(i.nama_baku, p_nama) as skor
  from master_item i
  where similarity(i.nama_baku, p_nama) > p_batas
  order by skor desc, i.nama_baku
  limit 10;
$$;

-- ---------------------------------------------------------------------
-- Impor massal master item
--
-- Atomik: seluruh baris tersimpan, atau tidak ada satu pun. Impor
-- setengah jalan meninggalkan master item yang tidak jelas isinya, dan
-- tidak ada cara mudah mengetahui baris mana yang terlanjur masuk.
--
-- Aturan B7 ditegakkan di sini juga, bukan hanya lewat RLS, supaya
-- pesan penolakannya jelas dan bukan sekadar "nol baris terpengaruh".
-- ---------------------------------------------------------------------
create or replace function impor_master_item(p_baris jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_peran peran_enum := peran_saya();
  v_baru  int := 0;
  v_ubah  int := 0;
begin
  if v_peran is null or v_peran <> 'admin' then
    raise exception 'Hanya admin yang boleh menambah atau mengubah master item';
  end if;

  if jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
    raise exception 'Tidak ada baris untuk diimpor';
  end if;

  with masukan as (
    select
      nullif(trim(x->>'kode_item'), '')                  as kode_item,
      nullif(trim(x->>'nama_baku'), '')                  as nama_baku,
      nullif(trim(x->>'kategori'), '')                   as kategori,
      nullif(trim(x->>'sub_kategori'), '')               as sub_kategori,
      nullif(trim(x->>'satuan_baku'), '')                as satuan_baku,
      nullif(trim(x->>'spesifikasi'), '')                as spesifikasi,
      coalesce((x->>'aktif')::boolean, true)             as aktif
    from jsonb_array_elements(p_baris) x
  ),
  tersimpan as (
    insert into master_item as m
      (kode_item, nama_baku, kategori, sub_kategori, satuan_baku, spesifikasi, aktif)
    select kode_item, nama_baku, kategori::kategori_enum,
           sub_kategori, satuan_baku, spesifikasi, aktif
    from masukan
    on conflict (kode_item) do update set
      nama_baku    = excluded.nama_baku,
      kategori     = excluded.kategori,
      sub_kategori = excluded.sub_kategori,
      satuan_baku  = excluded.satuan_baku,
      spesifikasi  = excluded.spesifikasi,
      aktif        = excluded.aktif
    returning (xmax = 0) as baris_baru
  )
  select count(*) filter (where baris_baru),
         count(*) filter (where not baris_baru)
    into v_baru, v_ubah
  from tersimpan;

  return jsonb_build_object('baru', v_baru, 'diperbarui', v_ubah);

exception
  when unique_violation then
    raise exception 'Ada nama item yang sama persis dengan item lain. Setiap nama_baku harus unik.';
  when not_null_violation then
    raise exception 'Ada baris dengan kolom wajib yang kosong: kode_item, nama_baku, kategori, dan satuan_baku harus terisi.';
  when invalid_text_representation then
    raise exception 'Kategori harus salah satu dari MATERIAL, ALAT, OPERASIONAL, atau LAIN-LAIN.';
end $$;

revoke execute on function cari_item_mirip(text, real)  from public;
revoke execute on function impor_master_item(jsonb)     from public;

grant execute on function cari_item_mirip(text, real)   to authenticated;
grant execute on function impor_master_item(jsonb)      to authenticated;
