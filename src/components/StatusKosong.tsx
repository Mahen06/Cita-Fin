import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Props = {
  judul: string
  keterangan?: string
  ikon?: LucideIcon
  aksi?: ReactNode
  className?: string
}

/** Status kosong baku. Wajib ada di setiap layar (CLAUDE.md). */
export function StatusKosong({
  judul,
  keterangan,
  ikon: Ikon = Inbox,
  aksi,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      <Ikon className="text-muted-foreground size-8" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{judul}</p>
        {keterangan ? (
          <p className="text-muted-foreground text-sm text-balance">
            {keterangan}
          </p>
        ) : null}
      </div>
      {aksi}
    </div>
  )
}
