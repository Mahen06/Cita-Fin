import { useCallback, useEffect, useState } from 'react'

import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type BarisRiwayat = Database['public']['Views']['v_riwayat_harga']['Row']

export type Periode = '3b' | '6b' | '1t' | 'semua'

export const PERIODE: { nilai: Periode; label: string }[] = [
  { nilai: '3b', label: '3 bulan' },
  { nilai: '6b', label: '6 bulan' },
  { nilai: '1t', label: '1 tahun' },
  { nilai: 'semua', label: 'Semua' },
]

/** Tanggal batas bawah untuk periode terpilih, atau null bila "semua". */
export function batasTanggal(periode: Periode): string | null {
  if (periode === 'semua') return null

  const d = new Date()
  if (periode === '3b') d.setMonth(d.getMonth() - 3)
  if (periode === '6b') d.setMonth(d.getMonth() - 6)
  if (periode === '1t') d.setFullYear(d.getFullYear() - 1)

  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export type Tren = 'naik' | 'turun' | 'tetap' | null

/** Harga terakhir sebuah item di satu toko, beserti trennya. */
export type HargaToko = {
  kode_toko: string
  nama_toko: string
  pkp: boolean
  harga_satuan: number
  satuan_baku: string
  tanggal: string
  nama_proyek: string
  id_nota: string
  no_nota_toko: string | null
  /** Dibanding pembelian sebelumnya di toko yang sama. */
  tren: Tren
  harga_sebelumnya: number | null
  /** Jumlah pembelian item ini di toko tersebut dalam periode terpilih. */
  jml_pembelian: number
}

export type Ringkasan = {
  jml_toko: number
  terendah: number
  tertinggi: number
  rata2: number
  pembelian_terakhir: string
}

export type HasilCekHarga = {
  perToko: HargaToko[]
  ringkasan: Ringkasan | null
}

/**
 * Meringkas riwayat harga mentah menjadi satu kartu per toko.
 *
 * Ringkasan dihitung dari baris yang sama dengan yang ditampilkan, bukan
 * dari `v_ringkas_harga`. View itu tidak mengenal penyaring periode, dan
 * angka terendah/tertinggi dari seluruh riwayat akan bertentangan dengan
 * kartu yang tampak di bawahnya saat periode dipersempit.
 */
export function ringkas(baris: BarisRiwayat[]): HasilCekHarga {
  if (baris.length === 0) return { perToko: [], ringkasan: null }

  const perTokoMap = new Map<string, BarisRiwayat[]>()

  for (const b of baris) {
    if (!b.kode_toko) continue
    const daftar = perTokoMap.get(b.kode_toko) ?? []
    daftar.push(b)
    perTokoMap.set(b.kode_toko, daftar)
  }

  const perToko: HargaToko[] = []

  for (const [kode, daftar] of perTokoMap) {
    // Terbaru lebih dulu; tanggal sama diurutkan tetap oleh urutan asal.
    const urut = [...daftar].sort((a, b) =>
      String(b.tanggal).localeCompare(String(a.tanggal)),
    )

    const terbaru = urut[0]
    const sebelumnya = urut[1] ?? null

    const harga = Number(terbaru.harga_satuan ?? 0)
    const hargaLama = sebelumnya ? Number(sebelumnya.harga_satuan ?? 0) : null

    let tren: Tren = null
    if (hargaLama !== null && hargaLama > 0) {
      if (harga > hargaLama) tren = 'naik'
      else if (harga < hargaLama) tren = 'turun'
      else tren = 'tetap'
    }

    perToko.push({
      kode_toko: kode,
      nama_toko: terbaru.nama_toko ?? kode,
      pkp: Boolean(terbaru.pkp),
      harga_satuan: harga,
      satuan_baku: terbaru.satuan_baku ?? '',
      tanggal: String(terbaru.tanggal ?? ''),
      nama_proyek: terbaru.nama_proyek ?? '—',
      id_nota: String(terbaru.id_nota ?? ''),
      no_nota_toko: terbaru.no_nota_toko,
      tren,
      harga_sebelumnya: hargaLama,
      jml_pembelian: urut.length,
    })
  }

  // Urut termurah lebih dulu — inti dari layar ini.
  perToko.sort((a, b) => a.harga_satuan - b.harga_satuan)

  const semuaHarga = perToko.map((t) => t.harga_satuan)
  const tanggalTerakhir = perToko
    .map((t) => t.tanggal)
    .sort((a, b) => b.localeCompare(a))[0]

  return {
    perToko,
    ringkasan: {
      jml_toko: perToko.length,
      terendah: Math.min(...semuaHarga),
      tertinggi: Math.max(...semuaHarga),
      rata2: Math.round(
        semuaHarga.reduce((a, b) => a + b, 0) / semuaHarga.length,
      ),
      pembelian_terakhir: tanggalTerakhir,
    },
  }
}

/**
 * Membaca riwayat harga satu item.
 *
 * Hanya nota final yang terbaca — `v_riwayat_harga` sudah menyaringnya
 * di database (aturan B9), bukan di sini.
 */
export function useHargaItem(kodeItem: string | null, periode: Periode) {
  const [data, setData] = useState<HasilCekHarga | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  const muat = useCallback(async () => {
    if (!kodeItem) {
      setData(null)
      setGalat(null)
      return
    }

    setGalat(null)

    let kueri = supabase
      .from('v_riwayat_harga')
      .select('*')
      .eq('kode_item', kodeItem)
      .order('tanggal', { ascending: false })
      .limit(500)

    const batas = batasTanggal(periode)
    if (batas) kueri = kueri.gte('tanggal', batas)

    const { data: hasil, error } = await kueri

    if (error) {
      setData(null)
      setGalat(
        error.message.toLowerCase().includes('failed to fetch')
          ? 'Tidak ada sambungan. Periksa sinyal HP Anda.'
          : error.message,
      )
      return
    }

    setData(ringkas(hasil ?? []))
  }, [kodeItem, periode])

  useEffect(() => {
    setData(null)
    void muat()
  }, [muat])

  return { data, galat, muatUlang: muat }
}
