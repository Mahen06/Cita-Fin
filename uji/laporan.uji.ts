import { susunLaporan, type NotaMentah } from '../src/lib/laporan.ts'

let lulus = 0
let gagal = 0

function cek(nama: string, benar: boolean, dapat?: unknown) {
  if (benar) {
    lulus++
    console.log(`  ok   ${nama}`)
  } else {
    gagal++
    console.log(`  GAGAL ${nama} → ${JSON.stringify(dapat)}`)
  }
}

const item = (
  kode: string,
  nama: string,
  kategori: string,
  satuan = 'sak',
) => ({ kode_item: kode, nama_baku: nama, kategori, satuan_baku: satuan })

/*
  Dua nota. Nota pertama memuat material, ongkir, dan operasional —
  bentuk nota yang sesungguhnya, bukan yang bersih-bersih saja.
  Angka sengaja dikirim sebagai teks, karena PostgREST mengembalikan
  numeric sebagai string.
*/
const mentah = [
  {
    id_nota: 'n1',
    tanggal: '2026-08-05',
    no_nota_toko: 'A-100',
    metode_bayar: 'Tunai',
    total_nota: '750000',
    master_toko: { nama_toko: 'Toko A', pkp: false },
    master_proyek: { kode_proyek: 'P1', nama_proyek: 'Proyek Satu' },
    nota_detail: [
      { qty: '10', harga_satuan: '60000', subtotal: '600000', urutan: 1, master_item: item('MTL-1', 'Semen', 'MATERIAL') },
      { qty: '1', harga_satuan: '50000', subtotal: '50000', urutan: 2, master_item: item('LNL-1', 'Ongkos Kirim', 'LAIN-LAIN', 'ls') },
      { qty: '1', harga_satuan: '100000', subtotal: '100000', urutan: 3, master_item: item('OPR-1', 'Operasional', 'OPERASIONAL', 'ls') },
    ],
  },
  {
    id_nota: 'n2',
    tanggal: '2026-08-01',
    no_nota_toko: null,
    metode_bayar: 'Transfer',
    total_nota: '200000',
    master_toko: { nama_toko: 'Toko B', pkp: true },
    master_proyek: { kode_proyek: 'P1', nama_proyek: 'Proyek Satu' },
    nota_detail: [
      { qty: '2', harga_satuan: '100000', subtotal: '200000', urutan: 1, master_item: item('ALT-1', 'Palu', 'ALAT', 'buah') },
    ],
  },
] as unknown as NotaMentah[]

console.log('\nsusunLaporan() tanpa penyaring')
const penuh = susunLaporan(mentah)
cek('dua nota masuk', penuh.jmlNota === 2, penuh.jmlNota)
cek('urut tanggal menaik', penuh.nota[0].id_nota === 'n2', penuh.nota.map((n) => n.id_nota))
cek('total 950.000', penuh.total === 950000, penuh.total)
cek('numeric berupa teks terbaca', penuh.nota[1].baris[0].subtotal === 600000)
cek('tidak ada yang tersaring', penuh.adaYangTersaring === false)
cek(
  'material 600.000',
  penuh.perKategori.find((k) => k.kategori === 'MATERIAL')?.total === 600000,
)
cek(
  'lain-lain 50.000',
  penuh.perKategori.find((k) => k.kategori === 'LAIN-LAIN')?.total === 50000,
)
cek(
  'keempat kategori terisi pada contoh ini',
  penuh.perKategori.length === 4,
  penuh.perKategori.map((k) => k.kategori),
)
cek('baris nota urut sesuai kolom urutan', penuh.nota[1].baris[0].kode_item === 'MTL-1')

console.log('\nsusunLaporan() disaring MATERIAL saja')
const material = susunLaporan(mentah, ['MATERIAL'])
cek('hanya nota yang punya material', material.jmlNota === 1, material.jmlNota)
cek('nota B gugur seluruhnya', material.nota[0].id_nota === 'n1')
cek('satu baris tersisa', material.nota[0].baris.length === 1)
cek('ditandai tersaring', material.nota[0].tersaring === true)
cek(
  'jumlah dihitung ulang dari baris, bukan total nota fisik',
  material.nota[0].jumlah === 600000,
  material.nota[0].jumlah,
)
cek('total nota fisik tetap tersimpan', material.nota[0].total_nota === 750000)
cek('total laporan 600.000 — ongkir tidak ikut', material.total === 600000, material.total)
cek('penanda tersaring menyala', material.adaYangTersaring === true)
cek(
  'kategori tanpa isi tidak muncul di ringkasan',
  material.perKategori.length === 1 &&
    material.perKategori[0].kategori === 'MATERIAL',
  material.perKategori.map((k) => k.kategori),
)

console.log('\nsusunLaporan() disaring MATERIAL + ALAT')
const dua = susunLaporan(mentah, ['MATERIAL', 'ALAT'])
cek('dua nota masuk', dua.jmlNota === 2)
cek('total 800.000', dua.total === 800000, dua.total)
cek(
  'nota B tidak ditandai tersaring karena seluruh barisnya lolos',
  dua.nota[0].tersaring === false,
)

console.log('\nsusunLaporan() hal-hal pinggiran')
cek('masukan kosong aman', susunLaporan([]).jmlNota === 0)
cek(
  'seluruh kategori dipilih sama dengan tanpa penyaring',
  susunLaporan(mentah, ['MATERIAL', 'ALAT', 'OPERASIONAL', 'LAIN-LAIN']).total === 950000,
)

const tanpaItem = susunLaporan([
  {
    ...mentah[1],
    nota_detail: [
      { qty: '1', harga_satuan: '1', subtotal: '1', urutan: 1, master_item: null },
    ],
  },
] as unknown as NotaMentah[])
cek('baris tanpa master item diabaikan', tanpaItem.jmlNota === 0, tanpaItem.jmlNota)


console.log('\nuraianNota() & pengelompokan proyek')
cek(
  'uraian otomatis dari daftar item',
  penuh.nota[1].uraian === 'Semen 10 sak, Ongkos Kirim 1 ls, Operasional 1 ls',
  penuh.nota[1].uraian,
)
cek('ditandai otomatis', penuh.nota[1].uraianOtomatis === true)
const ribuan = susunLaporan([
  {
    ...mentah[1],
    nota_detail: [
      { qty: '1320', harga_satuan: '10000', subtotal: '13200000', urutan: 1,
        master_item: item('MTL-9', 'Batu Andesit 15x30', 'MATERIAL', 'Lembar') },
    ],
  },
] as unknown as NotaMentah[]).nota[0].uraian
cek('qty ribuan diformat gaya Indonesia',
  ribuan === 'Batu Andesit 15x30 1.320 Lembar', ribuan)

const denganCatatan = susunLaporan([
  { ...mentah[0], catatan: 'Pembelian Nat Sika Tile Grout Sand Gray 1Kg 5 Biji' },
] as unknown as NotaMentah[])
cek('catatan finance menang atas uraian otomatis',
  denganCatatan.nota[0].uraian === 'Pembelian Nat Sika Tile Grout Sand Gray 1Kg 5 Biji')
cek('ditandai bukan otomatis', denganCatatan.nota[0].uraianOtomatis === false)
cek('catatan berisi spasi saja tetap dianggap kosong',
  susunLaporan([{ ...mentah[0], catatan: '   ' }] as unknown as NotaMentah[])
    .nota[0].uraianOtomatis === true)

const duaProyek = susunLaporan([
  mentah[0],
  { ...mentah[1], master_proyek: { kode_proyek: 'P2', nama_proyek: 'AV-House' } },
] as unknown as NotaMentah[])
cek('dua blok proyek', duaProyek.perProyek.length === 2,
  duaProyek.perProyek.map((p) => p.nama_proyek))
cek('blok urut menurut nama proyek', duaProyek.perProyek[0].nama_proyek === 'AV-House')
cek('total blok AV-House 200.000', duaProyek.perProyek[0].total === 200000)
cek('total blok Proyek Satu 750.000', duaProyek.perProyek[1].total === 750000)
cek('jumlah total seluruh blok sama dengan total laporan',
  duaProyek.perProyek.reduce((a, p) => a + p.total, 0) === duaProyek.total)
cek('satu proyek tetap menghasilkan satu blok', penuh.perProyek.length === 1)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal > 0 ? 1 : 0)
