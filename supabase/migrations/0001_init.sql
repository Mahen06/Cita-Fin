-- =====================================================================
-- CitaFIN — Migrasi Awal
-- Modul Pengeluaran & Harga Material
--
-- CATATAN ARSITEKTUR:
-- Tabel profil, master_proyek, master_toko, master_item dirancang
-- sebagai MILIK BERSAMA. Modul logistik akan memakainya langsung.
-- Jangan menambahkan awalan nama aplikasi pada tabel mana pun.
-- =====================================================================

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- 1. PERAN & PROFIL PENGGUNA
-- Seluruh peran didaftarkan sejak awal meskipun v1.0 hanya memakai
-- admin dan finance. Menambah peran setelah ada data selalu lebih mahal.
-- ---------------------------------------------------------------------
create type peran_enum as enum ('admin','finance','logistik','engineering','manajer');

create table profil (
  id      uuid primary key references auth.users(id) on delete cascade,
  nama    text not null,
  peran   peran_enum not null default 'engineering',
  aktif   boolean not null default true
);

create or replace function peran_saya() returns peran_enum
language sql stable security definer as $$
  select peran from profil where id = auth.uid() and aktif = true
$$;

-- ---------------------------------------------------------------------
-- 2. TABEL MASTER (MILIK BERSAMA)
-- ---------------------------------------------------------------------
create table master_proyek (
  kode_proyek text primary key,
  nama_proyek text not null,
  lokasi      text,
  status      text not null default 'Aktif'
              check (status in ('Aktif','Selesai','Pending'))
);

create table master_toko (
  kode_toko text primary key,
  nama_toko text not null,
  kota      text,
  pkp       boolean not null default false,
  kontak    text,
  termin    text,
  jenis     text not null default 'Toko Material'
            check (jenis in ('Toko Material','Vendor Jasa','Rental Alat','Lainnya')),
  aktif     boolean not null default true
);

create type kategori_enum as enum ('MATERIAL','ALAT','OPERASIONAL','LAIN-LAIN');

create table master_item (
  kode_item    text primary key,
  nama_baku    text not null unique,
  kategori     kategori_enum not null,
  sub_kategori text,
  satuan_baku  text not null,
  spesifikasi  text,
  aktif        boolean not null default true,
  dibuat_pada  timestamptz not null default now()
);

comment on column master_item.nama_baku is
  'Format wajib: Jenis + Merek + Spesifikasi + Ukuran. Contoh: Semen PCC Tiga Roda 50kg';

-- ---------------------------------------------------------------------
-- 3. TRANSAKSI (MILIK CITAFIN)
-- ---------------------------------------------------------------------
create table nota (
  id_nota      uuid primary key default gen_random_uuid(),
  tanggal      date not null,
  kode_proyek  text not null references master_proyek(kode_proyek),
  kode_toko    text not null references master_toko(kode_toko),
  no_nota_toko text,
  metode_bayar text not null default 'Tunai'
               check (metode_bayar in ('Tunai','Transfer','Tempo','Uang Muka Mandor')),
  total_nota   numeric(15,2) not null check (total_nota >= 0),
  status       text not null default 'draft' check (status in ('draft','final')),
  foto_url     text,
  catatan      text,
  diinput_oleh uuid references auth.users(id),
  diinput_pada timestamptz not null default now(),
  diubah_pada  timestamptz not null default now()
);

create table nota_detail (
  id_detail    uuid primary key default gen_random_uuid(),
  id_nota      uuid not null references nota(id_nota) on delete cascade,
  kode_item    text not null references master_item(kode_item),
  qty          numeric(15,3) not null check (qty > 0),
  harga_satuan numeric(15,2) not null check (harga_satuan >= 0),
  subtotal     numeric(15,2) generated always as (qty * harga_satuan) stored,
  catatan      text,
  urutan       int not null default 0
);

create table audit_harga (
  id          bigserial primary key,
  id_detail   uuid,
  kode_item   text,
  harga_lama  numeric(15,2),
  harga_baru  numeric(15,2),
  diubah_oleh uuid references auth.users(id),
  diubah_pada timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. INDEKS
-- idx_item_nama_trgm adalah kunci agar pencarian di layar Cek Harga
-- tetap instan saat master item bertambah besar.
-- ---------------------------------------------------------------------
create index idx_detail_item    on nota_detail(kode_item);
create index idx_detail_nota    on nota_detail(id_nota);
create index idx_nota_tanggal   on nota(tanggal desc);
create index idx_nota_proyek    on nota(kode_proyek);
create index idx_nota_toko      on nota(kode_toko);
create index idx_nota_status    on nota(status);
create index idx_item_nama_trgm on master_item using gin (nama_baku gin_trgm_ops);

-- ---------------------------------------------------------------------
-- 5. VIEW
-- ---------------------------------------------------------------------

-- Sumber semua pertanyaan harga. Hanya nota final (aturan B9).
create view v_riwayat_harga as
select d.id_detail, d.kode_item, i.nama_baku, i.kategori, i.sub_kategori,
       i.satuan_baku, d.qty, d.harga_satuan,
       n.tanggal, n.kode_toko, t.nama_toko, t.pkp,
       n.kode_proyek, p.nama_proyek, n.id_nota, n.no_nota_toko, n.foto_url
from nota_detail d
join nota          n on n.id_nota     = d.id_nota
join master_item   i on i.kode_item   = d.kode_item
join master_toko   t on t.kode_toko   = n.kode_toko
join master_proyek p on p.kode_proyek = n.kode_proyek
where n.status = 'final' and d.harga_satuan > 0;

-- Harga terakhir tiap item di tiap toko. Dipakai untuk nilai awal input.
create view v_harga_terakhir as
select distinct on (kode_item, kode_toko)
       kode_item, nama_baku, satuan_baku, kode_toko, nama_toko,
       harga_satuan, tanggal
from v_riwayat_harga
order by kode_item, kode_toko, tanggal desc;

-- Ringkasan lintas toko. Dipakai di kepala layar Cek Harga.
create view v_ringkas_harga as
select kode_item, nama_baku, satuan_baku,
       count(distinct kode_toko) as jml_toko,
       min(harga_satuan)         as harga_terendah,
       max(harga_satuan)         as harga_tertinggi,
       round(avg(harga_satuan))  as harga_rata2,
       max(tanggal)              as pembelian_terakhir
from v_riwayat_harga
group by kode_item, nama_baku, satuan_baku;

-- Validasi selisih (aturan B4).
create view v_nota_ringkas as
select n.id_nota, n.tanggal, n.kode_proyek, n.kode_toko, n.no_nota_toko,
       n.metode_bayar, n.total_nota, n.status, n.foto_url, n.diinput_oleh,
       coalesce(sum(d.subtotal), 0)                  as total_detail,
       n.total_nota - coalesce(sum(d.subtotal), 0)   as selisih,
       count(d.id_detail)                            as jml_baris
from nota n
left join nota_detail d on d.id_nota = n.id_nota
group by n.id_nota;

-- ---------------------------------------------------------------------
-- 6. RPC — SIMPAN & UBAH NOTA SECARA ATOMIK
-- Satu nota beserta seluruh barisnya tersimpan sekaligus, atau tidak
-- sama sekali. Ini juga tempat aturan B4 ditegakkan di sisi server.
-- ---------------------------------------------------------------------
create or replace function simpan_nota(p_header jsonb, p_detail jsonb)
returns uuid
language plpgsql security definer as $$
declare
  v_id    uuid;
  v_total numeric(15,2);
begin
  if peran_saya() not in ('admin','finance','logistik') then
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
language plpgsql security definer as $$
declare
  v_total numeric(15,2);
begin
  if peran_saya() not in ('admin','finance') then
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

-- Pencarian item untuk layar Cek Harga (fuzzy, toleran salah ketik).
create or replace function cari_item(p_kata text, p_limit int default 20)
returns table (kode_item text, nama_baku text, kategori kategori_enum,
               satuan_baku text, skor real)
language sql stable as $$
  select i.kode_item, i.nama_baku, i.kategori, i.satuan_baku,
         similarity(i.nama_baku, p_kata) as skor
  from master_item i
  where i.aktif = true
    and (i.nama_baku ilike '%' || p_kata || '%'
         or similarity(i.nama_baku, p_kata) > 0.2)
  order by skor desc, i.nama_baku
  limit p_limit;
$$;

-- ---------------------------------------------------------------------
-- 7. TRIGGER AUDIT HARGA (aturan B8)
-- ---------------------------------------------------------------------
create or replace function catat_perubahan_harga()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.harga_satuan is distinct from new.harga_satuan then
    insert into audit_harga (id_detail, kode_item, harga_lama, harga_baru, diubah_oleh)
    values (old.id_detail, old.kode_item, old.harga_satuan, new.harga_satuan, auth.uid());
  end if;
  return new;
end; $$;

create trigger trg_audit_harga
  after update on nota_detail
  for each row execute function catat_perubahan_harga();

-- ---------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table profil        enable row level security;
alter table master_proyek enable row level security;
alter table master_toko   enable row level security;
alter table master_item   enable row level security;
alter table nota          enable row level security;
alter table nota_detail   enable row level security;
alter table audit_harga   enable row level security;

-- Profil: semua yang login boleh baca, hanya admin boleh ubah
create policy profil_baca  on profil for select using (auth.uid() is not null);
create policy profil_kelola on profil for all
  using (peran_saya() = 'admin') with check (peran_saya() = 'admin');

-- Master: semua boleh baca, hanya admin boleh tulis (aturan B7)
create policy proyek_baca   on master_proyek for select using (auth.uid() is not null);
create policy proyek_kelola on master_proyek for all
  using (peran_saya() = 'admin') with check (peran_saya() = 'admin');

create policy toko_baca   on master_toko for select using (auth.uid() is not null);
create policy toko_kelola on master_toko for all
  using (peran_saya() in ('admin','finance'))
  with check (peran_saya() in ('admin','finance'));

create policy item_baca   on master_item for select using (auth.uid() is not null);
create policy item_kelola on master_item for all
  using (peran_saya() = 'admin') with check (peran_saya() = 'admin');

-- Nota: semua peran boleh baca; input terbatas
create policy nota_baca on nota for select using (auth.uid() is not null);

create policy nota_tulis on nota for insert
  with check (peran_saya() in ('admin','finance','logistik'));

create policy nota_ubah on nota for update
  using (
    peran_saya() in ('admin','finance')
    or (peran_saya() = 'logistik' and diinput_oleh = auth.uid() and status = 'draft')
  );

create policy nota_hapus on nota for delete
  using (peran_saya() = 'admin' or (peran_saya() = 'finance' and status = 'draft'));

-- Detail mengikuti hak nota induknya
create policy detail_baca on nota_detail for select using (auth.uid() is not null);

create policy detail_tulis on nota_detail for insert
  with check (peran_saya() in ('admin','finance','logistik'));

create policy detail_ubah on nota_detail for update
  using (peran_saya() in ('admin','finance'));

create policy detail_hapus on nota_detail for delete
  using (peran_saya() in ('admin','finance'));

-- Audit: hanya admin & manajer
create policy audit_baca on audit_harga for select
  using (peran_saya() in ('admin','manajer'));

-- ---------------------------------------------------------------------
-- 9. DATA AWAL — ITEM WAJIB UNTUK ATURAN B5
-- Ongkir, PPN, dan diskon harus menjadi baris tersendiri agar harga
-- satuan material tetap bersih dan bisa dibandingkan antar toko.
-- ---------------------------------------------------------------------
insert into master_item (kode_item, nama_baku, kategori, sub_kategori, satuan_baku) values
  ('LNL-001', 'Ongkos Kirim',        'LAIN-LAIN', 'Biaya Nota', 'ls'),
  ('LNL-002', 'PPN',                 'LAIN-LAIN', 'Biaya Nota', 'ls'),
  ('LNL-003', 'Diskon Nota',         'LAIN-LAIN', 'Biaya Nota', 'ls'),
  ('OPR-001', 'Operasional Borongan','OPERASIONAL','Umum',       'ls'),
  ('LNL-999', 'Lain-lain Borongan',  'LAIN-LAIN', 'Umum',        'ls');
