import { useCallback, useEffect, useState } from 'react'

import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type Proyek = Database['public']['Tables']['master_proyek']['Row']
export type ProyekBaru = Database['public']['Tables']['master_proyek']['Insert']

/** Nilai `status` mengikuti batasan check di migrasi 0001. */
export const STATUS_PROYEK = ['Aktif', 'Selesai', 'Pending'] as const

export function useDaftarProyek(kata: string) {
  const [data, setData] = useState<Proyek[] | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  const muat = useCallback(async () => {
    setGalat(null)

    let kueri = supabase.from('master_proyek').select('*').order('kode_proyek')

    const bersih = kata.trim()
    if (bersih) {
      kueri = kueri.or(
        `nama_proyek.ilike.%${bersih}%,kode_proyek.ilike.%${bersih}%`,
      )
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

export async function simpanProyek(proyek: ProyekBaru): Promise<void> {
  const { error } = await supabase.from('master_proyek').upsert(proyek)
  if (error) throw new Error(terjemahkan(error.message))
}

export async function hitungProyek(): Promise<number> {
  const { count, error } = await supabase
    .from('master_proyek')
    .select('kode_proyek', { count: 'exact', head: true })

  if (error) throw new Error(error.message)
  return count ?? 0
}

function terjemahkan(pesan: string): string {
  const p = pesan.toLowerCase()

  if (p.includes('row-level security') || p.includes('permission denied')) {
    return 'Peran Anda tidak berhak mengubah master proyek. Hanya admin yang bisa.'
  }
  if (p.includes('duplicate key')) {
    return 'Kode proyek ini sudah ada.'
  }
  if (p.includes('failed to fetch')) {
    return 'Tidak ada sambungan. Periksa sinyal HP Anda.'
  }

  return pesan
}
