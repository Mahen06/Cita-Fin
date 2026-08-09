import type { ReactNode } from 'react'

type Props = {
  judul: string
  keterangan?: string
  children: ReactNode
}

/**
 * Kerangka layar mobile-first.
 *
 * Lebar acuan 380px; di layar lebar isinya hanya melebar sampai batas baca,
 * bukan berubah jadi tata letak lain (CLAUDE.md — Prinsip Desain).
 *
 * Tab bar bawah empat menu belum dipasang di sini: menu bergantung pada peran
 * pengguna, dan peran baru tersedia setelah Sesi 3 (Auth + tabel profil).
 */
export function AppShell({ judul, keterangan, children }: Props) {
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

      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 py-4">
        {children}
      </main>

      <footer className="area-aman-bawah mx-auto w-full max-w-screen-sm px-4 pb-4">
        <p className="text-muted-foreground text-center text-xs">
          CitaFIN · versi {__VERSI_APLIKASI__}
        </p>
      </footer>
    </div>
  )
}
