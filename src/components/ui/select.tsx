import { ChevronDown } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

/*
  Sengaja memakai <select> bawaan peramban, bukan dropdown buatan.
  Di HP, pemilih asli muncul sebagai roda pilihan di bagian bawah layar —
  lebih mudah dipakai satu tangan dan tidak pernah keluar dari area layar.
*/
function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          'border-input flex h-11 w-full appearance-none rounded-md border bg-transparent px-3 py-1 pr-9 text-base shadow-xs outline-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        aria-hidden
      />
    </div>
  )
}

export { Select }
