import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export type MetodeBayar = 'Tunai' | 'Transfer' | 'Tempo' | 'Uang Muka Mandor'

export const METODE_BAYAR: MetodeBayar[] = [
  'Tunai',
  'Transfer',
  'Tempo',
  'Uang Muka Mandor',
]

export type Kategori = Database['public']['Enums']['kategori_enum']

/** Satu baris pada form input nota. */
export type BarisNota = {
  /** Kunci lokal; bukan id database. Baris belum tersimpan saat diketik. */
  id: string
  kode_item: string
  nama_baku: string
  kategori: Kategori
  satuan_baku: string
  qty: string
  harga_satuan: string
  /** Harga terakhir item ini di toko terpilih, untuk peringatan simpangan. */
  harga_terakhir: number | null
}

export function barisKosong(): BarisNota {
  return {
    id: crypto.randomUUID(),
    kode_item: '',
    nama_baku: '',
    kategori: 'MATERIAL',
    satuan_baku: '',
    qty: '',
    harga_satuan: '',
    harga_terakhir: null,
  }
}

/**
 * Membaca angka yang diketik pengguna.
 * Titik dianggap pemisah ribuan, koma pemisah desimal — kebiasaan Indonesia.
 */
export function angka(teks: string): number {
  const bersih = teks.trim().replace(/\./g, '').replace(',', '.')
  const n = Number(bersih)
  return Number.isFinite(n) ? n : 0
}

export function subtotalBaris(b: BarisNota): number {
  return angka(b.qty) * angka(b.harga_satuan)
}

export function totalRincian(baris: BarisNota[]): number {
  return baris.reduce((jml, b) => jml + subtotalBaris(b), 0)
}

/**
 * Selisih antara total nota fisik dan jumlah rincian (aturan B4).
 * Nol berarti nota boleh difinalkan.
 */
export function hitungSelisih(totalNota: string, baris: BarisNota[]): number {
  return angka(totalNota) - totalRincian(baris)
}

/**
 * Toleransi 1 rupiah, sama dengan yang dipakai RPC `simpan_nota`.
 * Tanpa toleransi, pembulatan desimal membuat nota yang sebenarnya pas
 * ditolak server padahal layar menunjukkan selisih nol.
 */
export function selisihNol(selisih: number): boolean {
  return Math.abs(selisih) < 0.01
}

/** Baris dianggap siap bila item, qty, dan harga sudah terisi masuk akal. */
export function barisSiap(b: BarisNota): boolean {
  return Boolean(b.kode_item) && angka(b.qty) > 0 && angka(b.harga_satuan) >= 0
}

/**
 * Peringatan halus bila harga menyimpang lebih dari 20% dari pembelian
 * terakhir di toko yang sama (F2). Sengaja bukan blokir — harga material
 * memang bisa melonjak, dan yang tahu benar tidaknya adalah orang yang
 * memegang notanya.
 */
export function simpanganHarga(b: BarisNota): number | null {
  const terakhir = b.harga_terakhir
  const sekarang = angka(b.harga_satuan)

  if (!terakhir || terakhir <= 0 || sekarang <= 0) return null

  const beda = (sekarang - terakhir) / terakhir
  return Math.abs(beda) > 0.2 ? beda : null
}

/** Harga terakhir item tertentu di toko tertentu, dari `v_harga_terakhir`. */
export async function hargaTerakhir(
  kodeItem: string,
  kodeToko: string,
): Promise<number | null> {
  if (!kodeItem || !kodeToko) return null

  const { data, error } = await supabase
    .from('v_harga_terakhir')
    .select('harga_satuan')
    .eq('kode_item', kodeItem)
    .eq('kode_toko', kodeToko)
    .maybeSingle()

  if (error) return null
  return data?.harga_satuan ?? null
}

export type HeaderNota = {
  tanggal: string
  kode_proyek: string
  kode_toko: string
  no_nota_toko: string
  metode_bayar: MetodeBayar
  total_nota: string
  catatan: string
}

/**
 * Menyimpan nota lewat RPC `simpan_nota` — satu nota beserta seluruh
 * barisnya tersimpan sekaligus, atau tidak sama sekali.
 */
export async function simpanNota(
  header: HeaderNota,
  baris: BarisNota[],
  status: 'draft' | 'final',
): Promise<string> {
  const { data, error } = await supabase.rpc('simpan_nota', {
    p_header: {
      tanggal: header.tanggal,
      kode_proyek: header.kode_proyek,
      kode_toko: header.kode_toko,
      no_nota_toko: header.no_nota_toko.trim() || null,
      metode_bayar: header.metode_bayar,
      total_nota: angka(header.total_nota),
      catatan: header.catatan.trim() || null,
      status,
    },
    p_detail: baris.filter(barisSiap).map((b) => ({
      kode_item: b.kode_item,
      qty: angka(b.qty),
      harga_satuan: angka(b.harga_satuan),
    })),
  })

  if (error) throw new Error(terjemahkan(error.message))
  return data as unknown as string
}

function terjemahkan(pesan: string): string {
  const p = pesan.toLowerCase()

  if (p.includes('tidak memiliki hak')) {
    return 'Peran Anda tidak berhak menyimpan nota.'
  }
  if (p.includes('selisih total nota')) {
    return 'Total nota belum cocok dengan rincian. Perbaiki dulu sebelum menyimpan sebagai final.'
  }
  if (p.includes('violates foreign key') && p.includes('kode_item')) {
    return 'Ada item yang tidak ada di master item.'
  }
  if (p.includes('violates foreign key')) {
    return 'Proyek atau toko yang dipilih tidak ditemukan.'
  }
  if (p.includes('failed to fetch')) {
    return 'Tidak ada sambungan. Nota belum tersimpan — jangan tutup halaman ini.'
  }

  return pesan
}
