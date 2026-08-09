import type { ReactNode } from 'react'

import { TabBar } from '@/components/TabBar'
import type { Peran } from '@/lib/peran'

type Props = {
  judul: string
  keterangan?: string
  /** Bila diisi, tab bar bawah ikut ditampilkan sesuai peran. */
  peran?: Peran
  children: ReactNode
}

/**
 * Kerangka layar mobile-first.
 *
 * Lebar acuan 380px; di layar lebar isinya hanya melebar sampai batas baca,
 * bukan berubah jadi tata letak lain (CLAUDE.md — Prinsip Desain).
 */
export function AppShell({ judul, keterangan, peran, children }: Props) {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <header className="bg-primary text-primary-foreground area-aman-atas sticky top-0 z-10">
        <div className="mx-auto w-full max-w-screen-sm px-4 py-3">
          <h1 className="text-lg leading-tight font-semibold tracking-tight">
            {judul}
          </h1>
          {keterangan ? (
            <p className="text-primary-foreground/80 text-sm">{keterangan}</p>
          ) : null}
        </div>
      </header>

      {/*
        pb-24 memberi ruang untuk tab bar yang melayang di bawah, supaya
        isi terakhir tidak tertutup — termasuk di HP yang punya bilah gestur.
      */}
      <main
        className={
          peran
            ? 'mx-auto w-full max-w-screen-sm flex-1 px-4 py-4 pb-24'
            : 'mx-auto w-full max-w-screen-sm flex-1 px-4 py-4'
        }
      >
        {children}
      </main>

      {peran ? <TabBar peran={peran} /> : null}
    </div>
  )
}
