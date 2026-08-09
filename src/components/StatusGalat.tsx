import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  judul?: string
  pesan: string
  rincian?: readonly string[]
  onCobaLagi?: () => void
  aksi?: ReactNode
  className?: string
}

/** Penanganan galat baku. Wajib ada di setiap layar (CLAUDE.md). */
export function StatusGalat({
  judul = 'Terjadi kesalahan',
  pesan,
  rincian,
  onCobaLagi,
  aksi,
  className,
}: Props) {
  return (
    <div
      role="alert"
      className={cn(
        'border-destructive/30 bg-destructive/5 flex flex-col items-center gap-3 rounded-xl border px-5 py-8 text-center',
        className,
      )}
    >
      <AlertTriangle className="text-destructive size-8" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{judul}</p>
        <p className="text-muted-foreground text-sm text-balance">{pesan}</p>
      </div>

      {rincian && rincian.length > 0 ? (
        <ul className="text-muted-foreground w-full space-y-1 text-left text-sm">
          {rincian.map((baris) => (
            <li key={baris} className="flex gap-2">
              <span aria-hidden>•</span>
              <span className="break-words">{baris}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {onCobaLagi ? (
        <Button variant="outline" onClick={onCobaLagi}>
          Coba lagi
        </Button>
      ) : null}
      {aksi}
    </div>
  )
}
