import {
  ArrowLeftRight,
  CheckCircle2,
  ChevronRight,
  Database,
  History,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { env } from '@/lib/env'
import {
  bolehKelolaToko,
  bolehLihatAudit,
  LABEL_PERAN,
  type Peran,
} from '@/lib/peran'
import { periksaSambungan, type HasilPeriksaSambungan } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useAuth } from '@/modules/pengeluaran/hooks/konteksAuth'

type Entri = {
  label: string
  keterangan: string
  ikon: LucideIcon
  /** Terisi bila layarnya sudah bisa dibuka. */
  ke?: string
  syarat?: (peran: Peran) => boolean
}

/** Isi menu mengikuti SPEK-FITUR Bagian 2. Sisanya menyusul per sesi. */
const ENTRI: Entri[] = [
  {
    label: 'Master Data',
    keterangan: 'Item · Toko · Proyek',
    ikon: Database,
    ke: '/master',
    syarat: bolehKelolaToko,
  },
  {
    label: 'Banding Toko',
    keterangan: 'Bandingkan 2–3 toko',
    ikon: ArrowLeftRight,
    ke: '/banding',
  },
  {
    label: 'Audit Harga',
    keterangan: 'Sesi 10',
    ikon: History,
    syarat: bolehLihatAudit,
  },
]

export function HalamanMenu() {
  const { profil, sesi, keluar } = useAuth()

  if (!profil) return null

  const tampil = ENTRI.filter((e) => !e.syarat || e.syarat(profil.peran))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Baris label="Nama" nilai={profil.nama} />
          <Baris label="Email" nilai={sesi?.user.email ?? '—'} />
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-sm">Peran</span>
            <Badge>{LABEL_PERAN[profil.peran]}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lainnya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {tampil.map(({ label, keterangan, ikon: Ikon, ke }) => {
            const isi = (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <Ikon
                    className={cn(
                      'size-5 shrink-0',
                      ke ? 'text-primary' : 'text-muted-foreground',
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn('text-sm', !ke && 'text-muted-foreground')}
                  >
                    {label}
                  </span>
                </div>
                {ke ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {keterangan}
                    </span>
                    <ChevronRight
                      className="text-muted-foreground size-4"
                      aria-hidden
                    />
                  </div>
                ) : (
                  <Badge variant="secondary">{keterangan}</Badge>
                )}
              </>
            )

            const kelas =
              'flex min-h-11 items-center justify-between gap-3 py-1'

            return ke ? (
              <Link key={label} to={ke} className={kelas}>
                {isi}
              </Link>
            ) : (
              <div key={label} className={kelas}>
                {isi}
              </div>
            )
          })}
          <p className="text-muted-foreground pt-2 text-xs text-balance">
            Menu di atas muncul sesuai peran Anda. Yang masih berlabel sesi
            akan aktif pada sesi pengerjaannya.
          </p>
        </CardContent>
      </Card>

      <KartuInfoAplikasi />

      <Button
        variant="outline"
        className="w-full"
        onClick={() => void keluar()}
      >
        <LogOut aria-hidden />
        Keluar
      </Button>
    </div>
  )
}

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className="min-w-0 text-right text-sm break-words">{nilai}</span>
    </div>
  )
}

/**
 * Kartu diagnosa. Sebelumnya berdiri sebagai layar tersendiri di Sesi 1.
 *
 * Tetap dipertahankan karena inilah satu-satunya cara memastikan dari HP
 * bahwa aplikasi menunjuk proyek Supabase yang benar dan menjalankan build
 * yang benar — dua hal yang tidak terlihat dari layar mana pun.
 */
function KartuInfoAplikasi() {
  const [hasil, setHasil] = useState<HasilPeriksaSambungan | null>(null)

  const periksa = useCallback(async () => {
    setHasil(null)
    setHasil(await periksaSambungan())
  }, [])

  useEffect(() => {
    void periksa()
  }, [periksa])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Info aplikasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Baris label="Versi" nilai={__VERSI_APLIKASI__} />
        <Baris label="Proyek Supabase" nilai={env.supabaseRef} />

        {hasil === null ? (
          <StatusMemuat pesan="Memeriksa sambungan…" className="py-4" />
        ) : hasil.status === 'gagal' ? (
          <StatusGalat
            judul="Supabase tidak terhubung"
            pesan={hasil.pesan}
            onCobaLagi={() => void periksa()}
          />
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-success size-5 shrink-0" aria-hidden />
            <span className="text-sm">
              Terhubung — balasan {hasil.lamaMs} md
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
