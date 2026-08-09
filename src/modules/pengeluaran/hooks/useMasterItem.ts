import { useCallback, useEffect, useState } from 'react'

import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type Item = Database['public']['Tables']['master_item']['Row']
export type ItemBaru = Database['public']['Tables']['master_item']['Insert']
export type Kategori = Database['public']['Enums']['kategori_enum']

export const KATEGORI: Kategori[] = [
  'MATERIAL',
  'ALAT',
  'OPERASIONAL',
  'LAIN-LAIN',
]

/** Item mirip yang sudah ada, hasil RPC `cari_item_mirip`. */
export type ItemMirip = {
  kode_item: string
  nama_baku: string
  kategori: Kategori
  satuan_baku: string
  aktif: boolean
  skor: number
}

type Saringan = {
  kata: string
  hanyaAktif: boolean
}

export function useDaftarItem({ kata, hanyaAktif }: Saringan) {
  const [data, setData] = useState<Item[] | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  const muat = useCallback(async () => {
    setGalat(null)

    let kueri = supabase
      .from('master_item')
      .select('*')
      .order('kode_item')
      .limit(500)

    if (hanyaAktif) kueri = kueri.eq('aktif', true)

    const bersih = kata.trim()
    if (bersih) {
      // Pencarian sederhana di sini; pencarian toleran salah ketik
      // memakai RPC `cari_item` dan dipakai di layar Cek Harga.
      kueri = kueri.or(`nama_baku.ilike.%${bersih}%,kode_item.ilike.%${bersih}%`)
    }

    const { data: hasil, error } = await kueri

    if (error) {
      setData(null)
      setGalat(error.message)
      return
    }

    setData(hasil)
  }, [kata, hanyaAktif])

  useEffect(() => {
    setData(null)
    void muat()
  }, [muat])

  return { data, galat, muatUlang: muat }
}

/**
 * Mencari item yang mirip dengan nama yang sedang diketik (F5).
 *
 * Ambang 0.4 mengikuti spesifikasi. Item nonaktif ikut diperiksa —
 * duplikat dari item yang sudah dimatikan tetap duplikat.
 */
export async function cariItemMirip(nama: string): Promise<ItemMirip[]> {
  const bersih = nama.trim()
  if (bersih.length < 3) return []

  const { data, error } = await supabase.rpc('cari_item_mirip', {
    p_nama: bersih,
  })

  if (error) throw new Error(error.message)
  return (data ?? []) as ItemMirip[]
}

export async function simpanItem(item: ItemBaru): Promise<void> {
  const { error } = await supabase.from('master_item').upsert(item)
  if (error) throw new Error(terjemahkan(error.message))
}

/**
 * Item tidak pernah dihapus, hanya dinonaktifkan (F5).
 * Menghapusnya akan memutus nota lama yang merujuk item tersebut.
 */
export async function ubahAktifItem(
  kodeItem: string,
  aktif: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('master_item')
    .update({ aktif })
    .eq('kode_item', kodeItem)

  if (error) throw new Error(terjemahkan(error.message))
}

export async function hitungItem(): Promise<number> {
  const { count, error } = await supabase
    .from('master_item')
    .select('kode_item', { count: 'exact', head: true })

  if (error) throw new Error(error.message)
  return count ?? 0
}

/** Satu baris CSV yang siap dikirim ke RPC impor. */
export type BarisImpor = {
  kode_item: string
  nama_baku: string
  kategori: string
  sub_kategori: string
  satuan_baku: string
  spesifikasi: string
  aktif: boolean
}

/** Mengimpor banyak baris sekaligus lewat RPC atomik. */
export async function imporItem(
  baris: BarisImpor[],
): Promise<{ baru: number; diperbarui: number }> {
  const { data, error } = await supabase.rpc('impor_master_item', {
    p_baris: baris,
  })

  if (error) throw new Error(terjemahkan(error.message))
  return data as unknown as { baru: number; diperbarui: number }
}

function terjemahkan(pesan: string): string {
  const p = pesan.toLowerCase()

  if (p.includes('row-level security') || p.includes('permission denied')) {
    return 'Peran Anda tidak berhak mengubah master item. Hanya admin yang bisa.'
  }
  if (p.includes('duplicate key') && p.includes('nama_baku')) {
    return 'Nama item ini sudah dipakai item lain. Setiap nama harus unik.'
  }
  if (p.includes('duplicate key')) {
    return 'Kode item ini sudah ada.'
  }
  if (p.includes('failed to fetch')) {
    return 'Tidak ada sambungan. Periksa sinyal HP Anda.'
  }

  return pesan
}
