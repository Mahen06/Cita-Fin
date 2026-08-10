/**
 * Penyusunan laporan pengeluaran per proyek — murni, tanpa jaringan.
 *
 * Dipisahkan dari hook supaya bisa diuji berdiri sendiri: angka di
 * laporan ini yang dikirim ke pemilik proyek, dan salah sedikit pun
 * baru ketahuan setelah sampai di tangan orang lain.
 */

import type { Database } from '@/lib/database.types'
// Relatif, bukan alias `@/`: berkas ini dijalankan apa adanya oleh
// `npm run uji` di luar Vite, dan Node tidak mengenal alias itu.
import { formatAngka } from './format.ts'

/**
 * Nama yang dicetak di kepala laporan.
 * Diletakkan di sini supaya berubah cukup di satu tempat.
 */
export const NAMA_PERUSAHAAN = 'PT CITA PRASADA ARCHITEC'

export type Kategori = Database['public']['Enums']['kategori_enum']

export const KATEGORI: Kategori[] = [
  'MATERIAL',
  'ALAT',
  'OPERASIONAL',
  'LAIN-LAIN',
]

/** Bentuk mentah satu nota beserta rinciannya, apa adanya dari database. */
export type NotaMentah = {
  id_nota: string
  tanggal: string
  no_nota_toko: string | null
  metode_bayar: string
  catatan?: string | null
  total_nota: number | string
  master_toko: { nama_toko: string; pkp: boolean } | null
  master_proyek: { kode_proyek: string; nama_proyek: string } | null
  nota_detail: {
    qty: number | string
    harga_satuan: number | string
    subtotal: number | string | null
    urutan: number
    master_item: {
      kode_item: string
      nama_baku: string
      kategori: Kategori
      satuan_baku: string
    } | null
  }[]
}

export type BarisLaporan = {
  kode_item: string
  nama_baku: string
  kategori: Kategori
  satuan_baku: string
  qty: number
  harga_satuan: number
  subtotal: number
}

export type NotaLaporan = {
  id_nota: string
  tanggal: string
  kode_proyek: string
  nama_proyek: string
  nama_toko: string
  pkp: boolean
  no_nota_toko: string | null
  metode_bayar: string
  /** Teks kolom Keterangan pada laporan cetak. */
  uraian: string
  /** Benar bila uraian disusun otomatis, bukan diketik finance. */
  uraianOtomatis: boolean
  /** Total pada nota fisik. */
  total_nota: number
  /** Jumlah baris yang lolos penyaring kategori. */
  jumlah: number
  /** Benar bila sebagian baris tersaring keluar oleh penyaring kategori. */
  tersaring: boolean
  baris: BarisLaporan[]
}

/** Satu blok proyek pada laporan cetak. */
export type ProyekLaporan = {
  kode_proyek: string
  nama_proyek: string
  nota: NotaLaporan[]
  total: number
}

export type Laporan = {
  nota: NotaLaporan[]
  /** Nota yang sama, dikelompokkan per proyek — bentuk laporan cetak. */
  perProyek: ProyekLaporan[]
  perKategori: { kategori: Kategori; total: number; jmlBaris: number }[]
  total: number
  jmlNota: number
  /** Benar bila ada nota yang barisnya tidak seluruhnya ikut terhitung. */
  adaYangTersaring: boolean
}

/**
 * Teks kolom Keterangan untuk satu nota.
 *
 * Kalau finance mengisi Catatan, itu yang dipakai apa adanya — merekalah
 * yang tahu kata kerja yang tepat: "Pembelian", "Pembayaran", "Pembagian".
 * Kalau kosong, disusun otomatis dari daftar item beserta jumlah dan
 * satuannya, mengikuti kebiasaan laporan lama:
 *
 *   "Batu Andesit 15x30 1.320 Lembar, Semen PCC Tiga Roda 50kg 10 sak"
 */
export function uraianNota(
  catatan: string | null | undefined,
  baris: BarisLaporan[],
): { teks: string; otomatis: boolean } {
  const ditulis = (catatan ?? '').trim()
  if (ditulis) return { teks: ditulis, otomatis: false }

  const teks = baris
    .map((b) => `${b.nama_baku} ${formatAngka(b.qty)} ${b.satuan_baku}`.trim())
    .join(', ')

  return { teks: teks || '—', otomatis: true }
}

function n(x: number | string | null | undefined): number {
  const v = typeof x === 'string' ? Number(x) : (x ?? 0)
  return Number.isFinite(v) ? v : 0
}

/**
 * Mengelompokkan ulang data per nota (F4).
 *
 * Pengelompokan per nota disengaja: laporan Excel lama disusun per nota,
 * dan penerima laporan mengenali bentuk itu. Menyajikannya per item akan
 * langsung terasa sebagai "sistem baru".
 *
 * Saat penyaring kategori aktif, jumlah nota dihitung ulang dari baris
 * yang lolos saja — bukan dari `total_nota` di nota fisik. Kalau tidak,
 * laporan "hanya MATERIAL" akan memuat ongkir dan PPN di totalnya.
 */
export function susunLaporan(
  mentah: NotaMentah[],
  kategori: Kategori[] = [],
): Laporan {
  const saring = kategori.length > 0 && kategori.length < KATEGORI.length
  const nota: NotaLaporan[] = []

  for (const m of mentah) {
    const semua = m.nota_detail ?? []

    const baris: BarisLaporan[] = semua
      .filter((d) => {
        if (!d.master_item) return false
        return !saring || kategori.includes(d.master_item.kategori)
      })
      .sort((a, b) => a.urutan - b.urutan)
      .map((d) => ({
        kode_item: d.master_item!.kode_item,
        nama_baku: d.master_item!.nama_baku,
        kategori: d.master_item!.kategori,
        satuan_baku: d.master_item!.satuan_baku,
        qty: n(d.qty),
        harga_satuan: n(d.harga_satuan),
        subtotal: n(d.subtotal ?? n(d.qty) * n(d.harga_satuan)),
      }))

    // Nota yang seluruh barisnya tersaring keluar tidak perlu ditampilkan.
    if (baris.length === 0) continue

    const jumlahBaris = baris.reduce((a, b) => a + b.subtotal, 0)
    const tersaring = baris.length !== semua.length
    const uraian = uraianNota(m.catatan, baris)

    nota.push({
      id_nota: m.id_nota,
      tanggal: m.tanggal,
      kode_proyek: m.master_proyek?.kode_proyek ?? '—',
      nama_proyek: m.master_proyek?.nama_proyek ?? 'Tanpa proyek',
      nama_toko: m.master_toko?.nama_toko ?? '—',
      pkp: Boolean(m.master_toko?.pkp),
      no_nota_toko: m.no_nota_toko,
      metode_bayar: m.metode_bayar,
      uraian: uraian.teks,
      uraianOtomatis: uraian.otomatis,
      total_nota: n(m.total_nota),
      jumlah: tersaring ? jumlahBaris : n(m.total_nota),
      tersaring,
      baris,
    })
  }

  nota.sort((a, b) => a.tanggal.localeCompare(b.tanggal))

  // Blok per proyek — bentuk yang dipakai laporan cetak.
  const petaProyek = new Map<string, ProyekLaporan>()

  for (const x of nota) {
    const ada = petaProyek.get(x.kode_proyek)

    if (ada) {
      ada.nota.push(x)
      ada.total += x.jumlah
    } else {
      petaProyek.set(x.kode_proyek, {
        kode_proyek: x.kode_proyek,
        nama_proyek: x.nama_proyek,
        nota: [x],
        total: x.jumlah,
      })
    }
  }

  const perProyek = [...petaProyek.values()].sort((a, b) =>
    a.nama_proyek.localeCompare(b.nama_proyek, 'id'),
  )

  const perKategori = KATEGORI.map((k) => {
    const baris = nota.flatMap((x) => x.baris).filter((b) => b.kategori === k)
    return {
      kategori: k,
      total: baris.reduce((a, b) => a + b.subtotal, 0),
      jmlBaris: baris.length,
    }
  }).filter((x) => x.jmlBaris > 0)

  return {
    nota,
    perProyek,
    perKategori,
    total: nota.reduce((a, x) => a + x.jumlah, 0),
    jmlNota: nota.length,
    adaYangTersaring: nota.some((x) => x.tersaring),
  }
}
