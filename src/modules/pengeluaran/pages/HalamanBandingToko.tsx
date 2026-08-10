import { ArrowLeftRight, Store } from 'lucide-react'
import { useState } from 'react'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusKosong } from '@/components/StatusKosong'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatRupiah, formatTanggalPendek } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useBandingToko,
  type BarisBanding,
} from '@/modules/pengeluaran/hooks/useBandingToko'
import { PERIODE, type Periode } from '@/modules/pengeluaran/hooks/useCekHarga'
import {
  useDaftarToko,
  type Toko,
} from '@/modules/pengeluaran/hooks/useMasterToko'

const MAKS_TOKO = 3

export function HalamanBandingToko() {
  const { data: toko, galat: galatToko } = useDaftarToko('')
  const [terpilih, setTerpilih] = useState<string[]>([])
  const [periode, setPeriode] = useState<Periode>('6b')

  const { data, galat, muatUlang } = useBandingToko(terpilih, periode)

  function alihkan(kode: string) {
    setTerpilih((s) =>
      s.includes(kode)
        ? s.filter((k) => k !== kode)
        : s.length >= MAKS_TOKO
          ? s
          : [...s, kode],
    )
  }

  if (galatToko) {
    return (
      <StatusGalat
        pesan={galatToko}
        onCobaLagi={() => window.location.reload()}
      />
    )
  }

  if (toko === null) return <StatusMemuat pesan="Memuat toko…" />

  if (toko.length < 2) {
    return (
      <StatusKosong
        ikon={Store}
        judul="Perlu minimal dua toko"
        keterangan="Banding Toko baru berguna kalau ada setidaknya dua toko. Tambahkan lewat Menu → Master Data."
      />
    )
  }

  const tokoTerpilih = toko.filter((t) => terpilih.includes(t.kode_toko))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium">Pilih toko</span>
          <span className="text-muted-foreground text-xs">
            {terpilih.length}/{MAKS_TOKO} terpilih
          </span>
        </div>

        <ul className="space-y-1">
          {toko.map((t) => {
            const aktif = terpilih.includes(t.kode_toko)
            const penuh = terpilih.length >= MAKS_TOKO && !aktif

            return (
              <li key={t.kode_toko}>
                <button
                  type="button"
                  onClick={() => alihkan(t.kode_toko)}
                  disabled={penuh}
                  className={cn(
                    'flex min-h-12 w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors',
                    aktif
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-accent border-input',
                    penuh && 'opacity-40',
                  )}
                >
                  <span className="min-w-0 text-sm break-words">
                    {t.nama_toko}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {t.pkp ? <Badge variant="outline">PKP</Badge> : null}
                    {aktif ? <Badge>Dipilih</Badge> : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PERIODE.map((p) => (
          <Button
            key={p.nilai}
            size="sm"
            variant={periode === p.nilai ? 'default' : 'outline'}
            onClick={() => setPeriode(p.nilai)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {tokoTerpilih.some((t) => t.pkp) &&
      tokoTerpilih.some((t) => !t.pkp) ? (
        <p className="border-warning/40 bg-warning/10 rounded-md border px-3 py-2 text-xs text-balance">
          Toko yang dibandingkan bercampur PKP dan non-PKP. Harga PKP sudah
          termasuk PPN, jadi perbandingannya tidak setara apel dengan apel.
        </p>
      ) : null}

      {terpilih.length < 2 ? (
        <StatusKosong
          ikon={ArrowLeftRight}
          judul="Pilih minimal dua toko"
          keterangan="Setelah dua toko dipilih, item yang pernah dibeli di keduanya akan dibandingkan di sini."
        />
      ) : galat ? (
        <StatusGalat pesan={galat} onCobaLagi={() => void muatUlang()} />
      ) : data === null ? (
        <StatusMemuat pesan="Membandingkan harga…" />
      ) : data.baris.length === 0 ? (
        <StatusKosong
          ikon={ArrowLeftRight}
          judul="Tidak ada item yang beririsan"
          keterangan={
            data.jmlTidakBeririsan > 0
              ? `Ada ${data.jmlTidakBeririsan} item yang hanya dibeli di sebagian toko terpilih, jadi belum bisa dibandingkan. Coba perlebar periodenya.`
              : 'Belum ada nota final di toko-toko ini pada periode terpilih.'
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{data.baris.length} item beririsan</Badge>
            {data.jmlTidakBeririsan > 0 ? (
              <Badge variant="secondary">
                {data.jmlTidakBeririsan} item tidak beririsan
              </Badge>
            ) : null}
          </div>

          {/* Layar sempit: kartu per item */}
          <ul className="space-y-2 sm:hidden">
            {data.baris.map((b) => (
              <li key={b.kode_item}>
                <KartuBanding baris={b} toko={tokoTerpilih} />
              </li>
            ))}
          </ul>

          {/* Layar lebar: matriks item × toko */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Item</th>
                    {tokoTerpilih.map((t) => (
                      <th
                        key={t.kode_toko}
                        className="p-3 text-right font-medium whitespace-nowrap"
                      >
                        {t.nama_toko}
                        {t.pkp ? ' (PKP)' : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.baris.map((b) => (
                    <tr key={b.kode_item} className="border-t">
                      <td className="p-3">
                        <span className="block">{b.nama_baku}</span>
                        <span className="text-muted-foreground text-xs">
                          per {b.satuan_baku}
                        </span>
                      </td>
                      {tokoTerpilih.map((t) => {
                        const sel = b.perToko.get(t.kode_toko)!
                        return (
                          <td
                            key={t.kode_toko}
                            className="p-3 text-right whitespace-nowrap"
                          >
                            <span
                              className={cn(
                                'block',
                                sel.termurah
                                  ? 'text-success font-semibold'
                                  : 'font-medium',
                              )}
                            >
                              {formatRupiah(sel.harga_satuan)}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {sel.termurah
                                ? 'termurah'
                                : `+${formatRupiah(sel.selisih)} · +${Math.round(sel.selisihPersen)}%`}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-muted-foreground text-center text-xs text-balance">
            Urut dari selisih terbesar. Hanya nota final yang dihitung, dan
            harga yang dipakai adalah pembelian terakhir di tiap toko.
          </p>
        </>
      )}
    </div>
  )
}

function KartuBanding({
  baris,
  toko,
}: {
  baris: BarisBanding
  toko: Toko[]
}) {
  return (
    <Card className="gap-0 py-3">
      <CardContent className="space-y-2 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium break-words">{baris.nama_baku}</p>
            <p className="text-muted-foreground text-xs">
              per {baris.satuan_baku}
            </p>
          </div>
          {baris.rentangPersen >= 1 ? (
            <Badge variant="warning" className="shrink-0">
              beda {Math.round(baris.rentangPersen)}%
            </Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0">
              setara
            </Badge>
          )}
        </div>

        <ul className="space-y-1">
          {toko.map((t) => {
            const sel = baris.perToko.get(t.kode_toko)!

            return (
              <li
                key={t.kode_toko}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-muted-foreground min-w-0 truncate text-sm">
                  {t.nama_toko}
                </span>
                <span className="shrink-0 text-right">
                  <span
                    className={cn(
                      'block text-sm',
                      sel.termurah ? 'text-success font-semibold' : 'font-medium',
                    )}
                  >
                    {formatRupiah(sel.harga_satuan)}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {sel.termurah
                      ? `termurah · ${formatTanggalPendek(sel.tanggal)}`
                      : `+${formatRupiah(sel.selisih)} · +${Math.round(sel.selisihPersen)}%`}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
