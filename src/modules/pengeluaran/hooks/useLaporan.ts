import { useCallback, useEffect, useState } from 'react'

import { susunLaporan, type Kategori, type Laporan, type NotaMentah } from '@/lib/laporan'
import { supabase } from '@/lib/supabase'

export type SaringanLaporan = {
  kodeProyek: string
  dari: string
  sampai: string
  kategori: Kategori[]
}

/**
 * Membaca nota final berikut seluruh rinciannya.
 *
 * Sengaja membaca `nota` langsung, bukan `v_riwayat_harga`. View itu
 * membuang baris berharga nol, dan laporan harus memuat seluruh isi nota
 * apa adanya — termasuk barang gratis dan baris bernilai nol.
 *
 * Aturan B9 ditegakkan lewat penyaring status di sini, dan RLS menentukan
 * nota mana yang boleh terbaca.
 */
export function useLaporan(saringan: SaringanLaporan | null) {
  const [data, setData] = useState<Laporan | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  const kunci = saringan
    ? [
        saringan.kodeProyek,
        saringan.dari,
        saringan.sampai,
        saringan.kategori.join('|'),
      ].join('::')
    : ''

  const muat = useCallback(async () => {
    if (!kunci) {
      setData(null)
      return
    }

    const [kodeProyek, dari, sampai, kategoriMentah] = kunci.split('::')
    const kategori = kategoriMentah ? (kategoriMentah.split('|') as Kategori[]) : []

    setGalat(null)

    let kueri = supabase
      .from('nota')
      .select(
        `id_nota, tanggal, no_nota_toko, metode_bayar, catatan, total_nota,
         master_toko(nama_toko, pkp),
         master_proyek(kode_proyek, nama_proyek),
         nota_detail(qty, harga_satuan, subtotal, urutan,
           master_item(kode_item, nama_baku, kategori, satuan_baku))`,
      )
      .eq('status', 'final')
      .gte('tanggal', dari)
      .lte('tanggal', sampai)
      .order('tanggal')
      .limit(1000)

    if (kodeProyek) kueri = kueri.eq('kode_proyek', kodeProyek)

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

    setData(susunLaporan((hasil ?? []) as unknown as NotaMentah[], kategori))
  }, [kunci])

  useEffect(() => {
    setData(null)
    void muat()
  }, [muat])

  return { data, galat, muatUlang: muat }
}
