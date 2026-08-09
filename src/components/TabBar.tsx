import { FileText, Menu, PlusCircle, Search } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { bolehInputNota, type Peran } from '@/lib/peran'
import { cn } from '@/lib/utils'

type Tab = {
  ke: string
  label: string
  ikon: typeof Search
  /** Kosong berarti tab selalu tampil. */
  syarat?: (peran: Peran) => boolean
}

/** Urutan mengikuti peta navigasi di SPEK-FITUR Bagian 2. */
const TAB: Tab[] = [
  { ke: '/', label: 'Cek Harga', ikon: Search },
  { ke: '/nota/baru', label: 'Input', ikon: PlusCircle, syarat: bolehInputNota },
  { ke: '/laporan', label: 'Laporan', ikon: FileText },
  { ke: '/menu', label: 'Menu', ikon: Menu },
]

/**
 * Tab bar bawah.
 *
 * Tab yang tidak berhak disembunyikan agar layar tidak penuh menu buntu —
 * tetapi rutenya tetap dijaga `PenjagaRute`, karena menyembunyikan tombol
 * bukan pengamanan.
 */
export function TabBar({ peran }: { peran: Peran }) {
  const tampil = TAB.filter((t) => !t.syarat || t.syarat(peran))

  return (
    <nav
      aria-label="Navigasi utama"
      className="bg-background area-aman-bawah fixed inset-x-0 bottom-0 z-20 border-t"
    >
      <ul
        className="mx-auto grid w-full max-w-screen-sm"
        style={{ gridTemplateColumns: `repeat(${tampil.length}, minmax(0, 1fr))` }}
      >
        {tampil.map(({ ke, label, ikon: Ikon }) => (
          <li key={ke}>
            <NavLink
              to={ke}
              // `end` hanya untuk "/" supaya tab Cek Harga tidak ikut aktif
              // saat rute lain sedang terbuka.
              end={ke === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-xs transition-colors',
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Ikon
                    className={cn('size-5', isActive && 'stroke-[2.5]')}
                    aria-hidden
                  />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
