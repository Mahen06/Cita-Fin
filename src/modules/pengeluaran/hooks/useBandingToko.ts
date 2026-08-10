import { useCallback, useEffect, useState } from 'react'

import {
  batasTanggal,
  susunBanding,
  type HasilBanding,
  type Periode,
} from '@/lib/hargaAgregat'
import { supabase } from '@/lib/supabase'

export {
  susunBanding,
  type BarisBanding,
  type HasilBanding,
  type SelToko,
} from '@/lib/hargaAgregat'

export function useBandingToko(kodeToko: string[], periode: Periode) {
  const [data, setData] = useState<HasilBanding | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  // Dijadikan string supaya larik baru dengan isi sama tidak memicu
  // pemuatan ulang pada setiap render.
  const kunci = kodeToko.join(',')

  const muat = useCallback(async () => {
    const daftar = kunci ? kunci.split(',') : []

    if (daftar.length < 2) {
      setData(null)
      setGalat(null)
      return
    }

    setGalat(null)

    let kueri = supabase
      .from('v_riwayat_harga')
      .select('*')
      .in('kode_toko', daftar)
      .order('tanggal', { ascending: false })
      .limit(2000)

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

    setData(susunBanding(hasil ?? [], daftar))
  }, [kunci, periode])

  useEffect(() => {
    setData(null)
    void muat()
  }, [muat])

  return { data, galat, muatUlang: muat }
}
