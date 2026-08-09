import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type Props = {
  pesan?: string
  className?: string
}

/** Status memuat baku. Wajib ada di setiap layar (CLAUDE.md). */
export function StatusMemuat({ pesan = 'Memuat…', className }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      <Loader2 className="text-primary size-6 animate-spin" aria-hidden />
      <p className="text-muted-foreground text-sm">{pesan}</p>
    </div>
  )
}
