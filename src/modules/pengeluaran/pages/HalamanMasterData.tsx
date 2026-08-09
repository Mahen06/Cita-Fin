import { Boxes, ChevronRight, Package, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusGalat } from '@/components/StatusGalat'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { hitungItem } from '@/modules/pengeluaran/hooks/useMasterItem'
import { hitungProyek } from '@/modules/pengeluaran/hooks/useMasterProyek'
import { hitungToko } from '@/modules/pengeluaran/hooks/useMasterToko'

type Jumlah = { item: number; toko: number; proyek: number }

export function HalamanMasterData() {
  const [jumlah, setJumlah] = useState<Jumlah | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  useEffect(() => {
    let hidup = true

    Promise.all([hitungItem(), hitungToko(), hitungProyek()])
      .then(([item, toko, proyek]) => {
        if (hidup) setJumlah({ item, toko, proyek })
      })
      .catch((e: unknown) => {
        if (hidup) {
          setGalat(e instanceof Error ? e.message : 'Gagal membaca jumlah data.')
        }
      })

    return () => {
      hidup = false
    }
  }, [])

  if (galat) {
    return (
      <StatusGalat
        pesan={galat}
        onCobaLagi={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="space-y-3">
      <Pintasan
        ke="/master/item"
        ikon={Package}
        judul="Master Item"
        jumlah={jumlah?.item}
        keterangan="Sumber semua nama barang. Target 120–150 item aktif."
      />
      <Pintasan
        ke="/master/toko"
        ikon={Store}
        judul="Master Toko"
        jumlah={jumlah?.toko}
        keterangan="Toko dan vendor, beserta penanda PKP."
      />
      <Pintasan
        ke="/master/proyek"
        ikon={Boxes}
        judul="Master Proyek"
        jumlah={jumlah?.proyek}
        keterangan="Proyek yang bisa dibebani pengeluaran."
      />
    </div>
  )
}

function Pintasan({
  ke,
  ikon: Ikon,
  judul,
  jumlah,
  keterangan,
}: {
  ke: string
  ikon: typeof Package
  judul: string
  jumlah: number | undefined
  keterangan: string
}) {
  return (
    <Link to={ke} className="block">
      <Card className="hover:bg-accent gap-0 py-4 transition-colors">
        <CardContent className="flex items-center gap-3 px-4">
          <Ikon className="text-primary size-5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{judul}</span>
              <Badge variant="secondary">
                {jumlah === undefined ? '…' : `${jumlah} baris`}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm text-balance">
              {keterangan}
            </p>
          </div>
          <ChevronRight
            className="text-muted-foreground size-5 shrink-0"
            aria-hidden
          />
        </CardContent>
      </Card>
    </Link>
  )
}
