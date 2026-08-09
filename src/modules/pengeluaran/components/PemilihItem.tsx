import { Loader2, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import type { Kategori } from '@/modules/pengeluaran/hooks/useNota'

export type ItemTerpilih = {
  kode_item: string
  nama_baku: string
  kategori: Kategori
  satuan_baku: string
}

type Props = {
  onPilih: (item: ItemTerpilih) => void
  onTutup: () => void
}

/**
 * Pemilih item (aturan B1).
 *
 * Tidak ada jalan memasukkan nama item bebas dari sini — satu-satunya cara
 * memilih adalah dari `master_item`. Itu yang menjaga harga tetap bisa
 * dibandingkan antar toko.
 *
 * Memakai RPC `cari_item` yang toleran salah ketik, dengan jeda 250ms
 * sesuai F1 supaya tidak memanggil server tiap ketukan huruf.
 */
export function PemilihItem({ onPilih, onTutup }: Props) {
  const [kata, setKata] = useState('')
  const [hasil, setHasil] = useState<ItemTerpilih[] | null>(null)
  const [mencari, setMencari] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)
  const kolom = useRef<HTMLInputElement>(null)

  useEffect(() => {
    kolom.current?.focus()
  }, [])

  useEffect(() => {
    const bersih = kata.trim()

    if (bersih.length < 2) {
      setHasil(null)
      setMencari(false)
      return
    }

    setMencari(true)
    const jeda = setTimeout(async () => {
      const { data, error } = await supabase.rpc('cari_item', {
        p_kata: bersih,
        p_limit: 25,
      })

      if (error) {
        setGalat('Pencarian gagal. Periksa sambungan.')
        setHasil(null)
      } else {
        setGalat(null)
        setHasil((data ?? []) as ItemTerpilih[])
      }
      setMencari(false)
    }, 250)

    return () => clearTimeout(jeda)
  }, [kata])

  return (
    <div className="bg-background fixed inset-0 z-30 flex flex-col">
      <div className="area-aman-atas border-b">
        <div className="mx-auto flex w-full max-w-screen-sm items-center gap-2 px-4 py-3">
          <div className="relative flex-1">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              ref={kolom}
              type="search"
              className="pl-9"
              placeholder="Cari item…"
              value={kata}
              onChange={(e) => setKata(e.target.value)}
              aria-label="Cari item"
            />
          </div>
          <Button size="icon" variant="ghost" onClick={onTutup}>
            <X aria-hidden />
            <span className="sr-only">Tutup</span>
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-screen-sm flex-1 overflow-y-auto px-4 py-3">
        {galat ? (
          <p role="alert" className="text-destructive py-6 text-center text-sm">
            {galat}
          </p>
        ) : kata.trim().length < 2 ? (
          <p className="text-muted-foreground py-6 text-center text-sm text-balance">
            Ketik minimal dua huruf. Salah ketik tidak masalah — pencarian
            tetap menemukan yang mirip.
          </p>
        ) : mencari && hasil === null ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
            <span className="text-muted-foreground text-sm">Mencari…</span>
          </div>
        ) : hasil && hasil.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium">Tidak ada item yang cocok</p>
            <p className="text-muted-foreground mt-1 text-sm text-balance">
              Item harus ada di master lebih dulu. Minta admin menambahkannya
              lewat Menu → Master Data.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {hasil?.map((item) => (
              <li key={item.kode_item}>
                <button
                  type="button"
                  onClick={() => onPilih(item)}
                  className="hover:bg-accent flex min-h-14 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-words">
                      {item.nama_baku}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {item.kode_item}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {item.satuan_baku}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
