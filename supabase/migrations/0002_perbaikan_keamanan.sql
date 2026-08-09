-- =====================================================================
-- CitaFIN — Perbaikan Keamanan atas 0001_init.sql
--
-- Tiga temuan, seluruhnya sudah dibuktikan bisa dieksploitasi di
-- database kosong sebelum berkas ini ditulis:
--
-- T1  View berjalan dengan izin pembuatnya, bukan izin pemanggil.
--     Akibatnya v_riwayat_harga membocorkan SELURUH riwayat harga
--     kepada siapa pun yang memegang anon key — dan anon key memang
--     ikut terkirim di dalam bundel JavaScript, jadi sifatnya publik.
--
-- T2  Penjaga peran di simpan_nota/ubah_nota gagal terbuka.
--     `peran_saya()` bernilai NULL bagi pengguna yang belum login,
--     dan `NULL not in (...)` menghasilkan NULL — bukan TRUE. Cabang
--     `raise exception` tidak pernah dijalankan. Terbukti: pemanggil
--     anonim berhasil membuat nota berstatus final.
--
-- T3  search_path pada fungsi SECURITY DEFINER tidak dikunci,
--     sehingga tabel `profil` dan `nota` bisa dibayangi objek lain.
-- =====================================================================

-- ---------------------------------------------------------------------
-- T1 — View mengikuti izin pemanggil (RLS ikut berlaku)
-- ---------------------------------------------------------------------
alter view v_riwayat_harga  set (security_invoker = on);
alter view v_harga_terakhir set (security_invoker = on);
alter view v_ringkas_harga  set (security_invoker = on);
alter view v_nota_ringkas   set (security_invoker = on);

-- ---------------------------------------------------------------------
-- T3 — Kunci search_path pada seluruh fungsi
-- `pg_temp` sengaja ditulis paling belakang: bila tidak disebut,
-- PostgreSQL menaruhnya paling depan dan tabel sementara milik penyerang
-- bisa membayangi tabel asli.
-- ---------------------------------------------------------------------
create or replace function peran_saya() returns peran_enum
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select peran from profil where id = auth.uid() and aktif = true
$$;

-- ---------------------------------------------------------------------
-- T2 — Penjaga peran ditulis ulang agar gagal tertutup
-- ---------------------------------------------------------------------
create or replace function simpan_nota(p_header jsonb, p_detail jsonb)
returns uuid
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_id    uuid;
  v_total numeric(15,2);
  v_peran peran_enum := peran_saya();
begin
  if v_peran is null or v_peran not in ('admin','finance','logistik') then
    raise exception 'Tidak memiliki hak input nota';
  end if;

  select coalesce(sum((x->>'qty')::numeric * (x->>'harga_satuan')::numeric), 0)
    into v_total
  from jsonb_array_elements(p_detail) x;

  if coalesce(p_header->>'status','draft') = 'final'
     and abs((p_header->>'total_nota')::numeric - v_total) > 0.01 then
    raise exception 'Selisih total nota: total % vs rincian %',
      (p_header->>'total_nota')::numeric, v_total;
  end if;

  insert into nota (tanggal, kode_proyek, kode_toko, no_nota_toko, metode_bayar,
                    total_nota, foto_url, catatan, status, diinput_oleh)
  values ((p_header->>'tanggal')::date,
          p_header->>'kode_proyek',
          p_header->>'kode_toko',
          p_header->>'no_nota_toko',
          coalesce(p_header->>'metode_bayar','Tunai'),
          (p_header->>'total_nota')::numeric,
          p_header->>'foto_url',
          p_header->>'catatan',
          coalesce(p_header->>'status','draft'),
          auth.uid())
  returning id_nota into v_id;

  insert into nota_detail (id_nota, kode_item, qty, harga_satuan, catatan, urutan)
  select v_id,
         x->>'kode_item',
         (x->>'qty')::numeric,
         (x->>'harga_satuan')::numeric,
         x->>'catatan',
         ord
  from jsonb_array_elements(p_detail) with ordinality as t(x, ord);

  return v_id;
end; $$;

create or replace function ubah_nota(p_id uuid, p_header jsonb, p_detail jsonb)
returns uuid
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_total numeric(15,2);
  v_peran peran_enum := peran_saya();
begin
  if v_peran is null or v_peran not in ('admin','finance') then
    raise exception 'Tidak memiliki hak ubah nota';
  end if;

  select coalesce(sum((x->>'qty')::numeric * (x->>'harga_satuan')::numeric), 0)
    into v_total
  from jsonb_array_elements(p_detail) x;

  if coalesce(p_header->>'status','draft') = 'final'
     and abs((p_header->>'total_nota')::numeric - v_total) > 0.01 then
    raise exception 'Selisih total nota: total % vs rincian %',
      (p_header->>'total_nota')::numeric, v_total;
  end if;

  update nota set
    tanggal      = (p_header->>'tanggal')::date,
    kode_proyek  = p_header->>'kode_proyek',
    kode_toko    = p_header->>'kode_toko',
    no_nota_toko = p_header->>'no_nota_toko',
    metode_bayar = coalesce(p_header->>'metode_bayar','Tunai'),
    total_nota   = (p_header->>'total_nota')::numeric,
    foto_url     = p_header->>'foto_url',
    catatan      = p_header->>'catatan',
    status       = coalesce(p_header->>'status','draft'),
    diubah_pada  = now()
  where id_nota = p_id;

  delete from nota_detail where id_nota = p_id;

  insert into nota_detail (id_nota, kode_item, qty, harga_satuan, catatan, urutan)
  select p_id, x->>'kode_item', (x->>'qty')::numeric,
         (x->>'harga_satuan')::numeric, x->>'catatan', ord
  from jsonb_array_elements(p_detail) with ordinality as t(x, ord);

  return p_id;
end; $$;

create or replace function cari_item(p_kata text, p_limit int default 20)
returns table (kode_item text, nama_baku text, kategori kategori_enum,
               satuan_baku text, skor real)
language sql stable
set search_path = public, extensions, pg_temp
as $$
  select i.kode_item, i.nama_baku, i.kategori, i.satuan_baku,
         similarity(i.nama_baku, p_kata) as skor
  from master_item i
  where i.aktif = true
    and (i.nama_baku ilike '%' || p_kata || '%'
         or similarity(i.nama_baku, p_kata) > 0.2)
  order by skor desc, i.nama_baku
  limit p_limit;
$$;

create or replace function catat_perubahan_harga()
returns trigger language plpgsql
set search_path = public, extensions, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and old.harga_satuan is distinct from new.harga_satuan then
    insert into audit_harga (id_detail, kode_item, harga_lama, harga_baru, diubah_oleh)
    values (old.id_detail, old.kode_item, old.harga_satuan, new.harga_satuan, auth.uid());
  end if;
  return new;
end; $$;

-- ---------------------------------------------------------------------
-- Cabut hak jalan bagi pengunjung yang belum login.
-- Penjaga di dalam fungsi kini sudah benar, tapi hak akses yang tidak
-- pernah diberikan selalu lebih aman daripada penjaga yang harus benar.
-- ---------------------------------------------------------------------
revoke execute on function simpan_nota(jsonb, jsonb)      from anon;
revoke execute on function ubah_nota(uuid, jsonb, jsonb)  from anon;
revoke execute on function peran_saya()                   from anon;
revoke execute on function cari_item(text, int)           from anon;
