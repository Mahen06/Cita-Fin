import { Trash2, TrendingDown, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatRupiah } from '@/lib/format'
import {
  simpanganHarga,
  subtotalBaris,
  type BarisNota,
} from '@/modules/pengeluaran/hooks/useNota'

type Props = {
  baris: BarisNota
  nomor: number
  onUbah: (baris: BarisNota) => void
  onHapus: () => void
  onPilihItem: () => void
}

export function BarisNotaItem({
  baris,
  nomor,
  onUbah,
  onHapus,
  onPilihItem,
}: Props) {
  const simpangan = simpanganHarga(baris)

  return (
    <Card className="gap-0 py-3">
      <CardContent className="space-y-3 px-3">
        <div className="flex items-start gap-2">
          <span className="text-muted-foreground w-5 shrink-0 pt-2.5 text-sm">
            {nomor}.
          </span>

          <div className="min-w-0 flex-1">
            {/*
              Satu-satunya jalan mengisi item adalah lewat pemilih (B1).
              Tidak ada kolom teks bebas untuk nama item di sini.
            */}
            <button
              type="button"
              onClick={onPilihItem}
              className="border-input hover:bg-accent flex min-h-11 w-full items-center rounded-md border px-3 py-2 text-left transition-colors"
            >
              {baris.kode_item ? (
                <span className="min-w-0">
                  <span className="block text-sm font-medium break-words">
                    {baris.nama_baku}
                  </span>
                  <span className="text-muted-foreground block font-mono text-xs">
                    {baris.kode_item}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">
                  Ketuk untuk memilih item…
                </span>
              )}
            </button>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onHapus}
            className="shrink-0"
          >
            <Trash2 className="text-destructive" aria-hidden />
            <span className="sr-only">Hapus baris {nomor}</span>
          </Button>
        </div>

        <div className="flex gap-2 pl-7">
          <div className="min-w-0 flex-1">
            <label
              className="text-muted-foreground mb-1 block text-xs"
              htmlFor={`qty-${baris.id}`}
            >
              Jumlah
            </label>
            <div className="flex items-center gap-2">
              <Input
                id={`qty-${baris.id}`}
                inputMode="decimal"
                value={baris.qty}
                onChange={(e) => onUbah({ ...baris, qty: e.target.value })}
                placeholder="0"
              />
              {/* Satuan mengikuti master dan terkunci (aturan B6). */}
              <Badge variant="secondary" className="shrink-0">
                {baris.satuan_baku || '—'}
              </Badge>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <label
              className="text-muted-foreground mb-1 block text-xs"
              htmlFor={`harga-${baris.id}`}
            >
              Harga satuan
            </label>
            <Input
              id={`harga-${baris.id}`}
              inputMode="numeric"
              value={baris.harga_satuan}
              onChange={(e) =>
                onUbah({ ...baris, harga_satuan: e.target.value })
              }
              placeholder="0"
            />
          </div>
        </div>

        {simpangan !== null ? (
          <p className="text-warning-foreground bg-warning/15 ml-7 flex items-start gap-2 rounded-md px-2 py-1.5 text-xs">
            {simpangan > 0 ? (
              <TrendingUp className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            ) : (
              <TrendingDown className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            )}
            <span className="text-balance">
              {simpangan > 0 ? 'Naik' : 'Turun'}{' '}
              {Math.abs(Math.round(simpangan * 100))}% dari pembelian terakhir
              di toko ini ({formatRupiah(baris.harga_terakhir)}). Periksa lagi
              bila menurut Anda ini keliru.
            </span>
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2 pl-7">
          <span className="text-muted-foreground text-xs">Subtotal</span>
          <span className="text-sm font-medium">
            {formatRupiah(subtotalBaris(baris))}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
