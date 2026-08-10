import { ringkas, susunBanding, batasTanggal } from '../src/lib/hargaAgregat.ts'

let lulus = 0, gagal = 0
function cek(nama: string, benar: boolean, dapat?: unknown) {
  if (benar) { lulus++; console.log(`  ok   ${nama}`) }
  else { gagal++; console.log(`  GAGAL ${nama} → ${JSON.stringify(dapat)}`) }
}

const b = (o: Record<string, unknown>) => o as never

// ── ringkas ────────────────────────────────────────────────────────
console.log('\nringkas()')
const r = ringkas([
  b({ kode_toko:'A', nama_toko:'Toko A', pkp:false, harga_satuan:72000, tanggal:'2026-08-01', satuan_baku:'sak', id_nota:'n1', nama_proyek:'P' }),
  b({ kode_toko:'B', nama_toko:'Toko B', pkp:true,  harga_satuan:63000, tanggal:'2026-07-15', satuan_baku:'sak', id_nota:'n2', nama_proyek:'P' }),
  b({ kode_toko:'A', nama_toko:'Toko A', pkp:false, harga_satuan:65000, tanggal:'2026-05-01', satuan_baku:'sak', id_nota:'n3', nama_proyek:'P' }),
])
cek('urut termurah dulu', r.perToko[0].kode_toko === 'B', r.perToko.map(t=>t.kode_toko))
cek('toko A pakai harga TERBARU, bukan termurah', r.perToko[1].harga_satuan === 72000, r.perToko[1].harga_satuan)
cek('tren A naik', r.perToko[1].tren === 'naik', r.perToko[1].tren)
cek('harga sebelumnya A = 65000', r.perToko[1].harga_sebelumnya === 65000)
cek('tren B null (baru sekali beli)', r.perToko[0].tren === null)
cek('jumlah toko 2', r.ringkasan!.jml_toko === 2)
cek('terendah 63000', r.ringkasan!.terendah === 63000)
cek('tertinggi 72000', r.ringkasan!.tertinggi === 72000)
cek('rata2 dari harga terkini tiap toko = 67500', r.ringkasan!.rata2 === 67500, r.ringkasan!.rata2)
cek('jml pembelian A = 2', r.perToko[1].jml_pembelian === 2)

// urutan masukan acak — hasil harus sama
const rAcak = ringkas([
  b({ kode_toko:'A', harga_satuan:65000, tanggal:'2026-05-01' }),
  b({ kode_toko:'A', harga_satuan:72000, tanggal:'2026-08-01' }),
])
cek('tahan urutan masukan acak', rAcak.perToko[0].harga_satuan === 72000 && rAcak.perToko[0].tren === 'naik',
  [rAcak.perToko[0].harga_satuan, rAcak.perToko[0].tren])

cek('harga sama → tren tetap', ringkas([
  b({ kode_toko:'A', harga_satuan:50000, tanggal:'2026-08-01' }),
  b({ kode_toko:'A', harga_satuan:50000, tanggal:'2026-07-01' }),
]).perToko[0].tren === 'tetap')

cek('kosong → ringkasan null', ringkas([]).ringkasan === null)

// ── susunBanding ───────────────────────────────────────────────────
console.log('\nsusunBanding()')
const sb = susunBanding([
  // semen ada di ketiga toko
  b({ kode_item:'S', nama_baku:'Semen', satuan_baku:'sak', kode_toko:'A', harga_satuan:70000, tanggal:'2026-08-01', id_nota:'x' }),
  b({ kode_item:'S', nama_baku:'Semen', satuan_baku:'sak', kode_toko:'B', harga_satuan:63000, tanggal:'2026-07-15', id_nota:'x' }),
  b({ kode_item:'S', nama_baku:'Semen', satuan_baku:'sak', kode_toko:'C', harga_satuan:66000, tanggal:'2026-07-20', id_nota:'x' }),
  // harga lama toko A — harus diabaikan
  b({ kode_item:'S', nama_baku:'Semen', satuan_baku:'sak', kode_toko:'A', harga_satuan:60000, tanggal:'2026-01-01', id_nota:'x' }),
  // besi hanya di A dan B → tidak beririsan bila C ikut dipilih
  b({ kode_item:'BS', nama_baku:'Besi', satuan_baku:'btg', kode_toko:'A', harga_satuan:120000, tanggal:'2026-08-01', id_nota:'x' }),
  b({ kode_item:'BS', nama_baku:'Besi', satuan_baku:'btg', kode_toko:'B', harga_satuan:110000, tanggal:'2026-08-01', id_nota:'x' }),
], ['A','B','C'])

cek('hanya 1 item beririsan', sb.baris.length === 1, sb.baris.map(x=>x.kode_item))
cek('besi terhitung tidak beririsan', sb.jmlTidakBeririsan === 1, sb.jmlTidakBeririsan)
const s = sb.baris[0]
cek('toko A pakai 70000, bukan 60000 yang lama', s.perToko.get('A')!.harga_satuan === 70000, s.perToko.get('A')!.harga_satuan)
cek('B ditandai termurah', s.perToko.get('B')!.termurah === true)
cek('A selisih 7000 dari termurah', s.perToko.get('A')!.selisih === 7000)
cek('A selisih ~11%', Math.round(s.perToko.get('A')!.selisihPersen) === 11, s.perToko.get('A')!.selisihPersen)
cek('rentang ~11%', Math.round(s.rentangPersen) === 11)

const sb2 = susunBanding([
  b({ kode_item:'BS', nama_baku:'Besi', kode_toko:'A', harga_satuan:120000, tanggal:'2026-08-01' }),
  b({ kode_item:'BS', nama_baku:'Besi', kode_toko:'B', harga_satuan:110000, tanggal:'2026-08-01' }),
], ['A','B'])
cek('besi beririsan bila hanya A dan B dipilih', sb2.baris.length === 1)

// urut selisih terbesar dulu
const sb3 = susunBanding([
  b({ kode_item:'X', nama_baku:'X', kode_toko:'A', harga_satuan:100, tanggal:'2026-08-01' }),
  b({ kode_item:'X', nama_baku:'X', kode_toko:'B', harga_satuan:101, tanggal:'2026-08-01' }),
  b({ kode_item:'Y', nama_baku:'Y', kode_toko:'A', harga_satuan:100, tanggal:'2026-08-01' }),
  b({ kode_item:'Y', nama_baku:'Y', kode_toko:'B', harga_satuan:200, tanggal:'2026-08-01' }),
], ['A','B'])
cek('urut selisih terbesar dulu', sb3.baris[0].kode_item === 'Y', sb3.baris.map(x=>x.kode_item))

// ── batasTanggal ───────────────────────────────────────────────────
console.log('\nbatasTanggal()')
const acuan = new Date('2026-08-10T00:00:00')
cek('3 bulan', batasTanggal('3b', acuan) === '2026-05-10', batasTanggal('3b', acuan))
cek('1 tahun', batasTanggal('1t', acuan) === '2025-08-10', batasTanggal('1t', acuan))
cek('semua → null', batasTanggal('semua', acuan) === null)


// urutan masukan sengaja dibalik: harga lama datang lebih dulu
console.log('\nsusunBanding() tahan urutan')
const sbAcak = susunBanding([
  b({ kode_item:'S', nama_baku:'Semen', kode_toko:'A', harga_satuan:60000, tanggal:'2026-01-01' }),
  b({ kode_item:'S', nama_baku:'Semen', kode_toko:'A', harga_satuan:70000, tanggal:'2026-08-01' }),
  b({ kode_item:'S', nama_baku:'Semen', kode_toko:'B', harga_satuan:63000, tanggal:'2026-07-15' }),
], ['A','B'])
cek('pakai 70000 walau 60000 datang duluan', sbAcak.baris[0].perToko.get('A')!.harga_satuan === 70000, sbAcak.baris[0].perToko.get('A')!.harga_satuan)
cek('B tetap termurah', sbAcak.baris[0].perToko.get('B')!.termurah === true)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal > 0 ? 1 : 0)
