import { useCallback, useEffect, useState } from 'react'

import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type Toko = Database['public']['Tables']['master_toko']['Row']
export type TokoBaru = Database['public']['Tables']['master_toko']['Insert']

/** Nilai `jenis` mengikuti batasan check di migrasi 0001. */
export const JENIS_TOKO = [
  'Toko Material',
  'Vendor Jasa',
  'Rental Alat',
  'Lainnya',
] as const

export function useDaftarToko(kata: string) {
  const [data, setData] = useState<Toko[] | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  const muat = useCallback(async () => {
    setGalat(null)

    let kueri = supabase.from('master_toko').select('*').order('nama_toko')

    const bersih = kata.trim()
    if (bersih) {
      kueri = kueri.or(`nama_toko.ilike.%${bersih}%,kode_toko.ilike.%${bersih}%`)
    }

    const { data: hasil, error } = await kueri

    if (error) {
      setData(null)
      setGalat(error.message)
      return
    }

    setData(hasil)
  }, [kata])

  useEffect(() => {
    setData(null)
    void muat()
  }, [muat])

  return { data, galat, muatUlang: muat }
}

export async function simpanToko(toko: TokoBaru): Promise<void> {
  const { error } = await supabase.from('master_toko').upsert(toko)
  if (error) throw new Error(terjemahkan(error.message))
}

export async function hitungToko(): Promise<number> {
  const { count, error } = await supabase
    .from('master_toko')
    .select('kode_toko', { count: 'exact', head: true })

  if (error) throw new Error(error.message)
  return count ?? 0
}

function terjemahkan(pesan: string): string {
  const p = pesan.toLowerCase()

  if (p.includes('row-level security') || p.includes('permission denied')) {
    return 'Peran Anda tidak berhak mengubah master toko.'
  }
  if (p.includes('duplicate key')) {
    return 'Kode toko ini sudah ada.'
  }
  if (p.includes('failed to fetch')) {
    return 'Tidak ada sambungan. Periksa sinyal HP Anda.'
  }

  return pesan
}
