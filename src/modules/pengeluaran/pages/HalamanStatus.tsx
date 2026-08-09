import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, CircleDashed, Smartphone, WifiOff } from 'lucide-react'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { env, envSiap, galatEnv } from '@/lib/env'
import { periksaSambungan, type HasilPeriksaSambungan } from '@/lib/supabase'

type Keadaan =
  | { fase: 'memuat' }
  | { fase: 'selesai'; hasil: HasilPeriksaSambungan }

/**
 * Layar sementara Sesi 1.
 *
 * Tugasnya hanya membuktikan tiga hal dari HP: build terpasang, variabel
 * lingkungan terbaca, dan Supabase benar-benar bisa dihubungi lewat jaringan
 * seluler. Layar ini diganti oleh Cek Harga pada Sesi 6.
 */
export function HalamanStatus() {
  const [keadaan, setKeadaan] = useState<Keadaan>({ fase: 'memuat' })
  const [daring, setDaring] = useState(navigator.onLine)

  const jalankanPemeriksaan = useCallback(async () => {
    setKeadaan({ fase: 'memuat' })
    setKeadaan({ fase: 'selesai', hasil: await periksaSambungan() })
  }, [])

  useEffect(() => {
    if (!envSiap) return
    void jalankanPemeriksaan()
  }, [jalankanPemeriksaan])

  useEffect(() => {
    const perbarui = () => setDaring(navigator.onLine)
    window.addEventListener('online', perbarui)
    window.addEventListener('offline', perbarui)
    return () => {
      window.removeEventListener('online', perbarui)
      window.removeEventListener('offline', perbarui)
    }
  }, [])

  if (!envSiap) {
    return (
      <StatusGalat
        judul="Konfigurasi belum lengkap"
        pesan="Aplikasi belum tahu harus menghubungi Supabase yang mana. Isi variabel lingkungan berikut, lalu deploy ulang."
        rincian={galatEnv}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sambungan Supabase</CardTitle>
        </CardHeader>
        <CardContent>
          {keadaan.fase === 'memuat' ? (
            <StatusMemuat pesan="Menghubungi Supabase…" className="py-6" />
          ) : keadaan.hasil.status === 'gagal' ? (
            <StatusGalat
              judul="Supabase tidak terhubung"
              pesan={keadaan.hasil.pesan}
              onCobaLagi={() => void jalankanPemeriksaan()}
            />
          ) : (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">Terhubung</p>
                <p className="text-muted-foreground text-sm">
                  Balasan diterima dalam {keadaan.hasil.lamaMs} md.
                </p>
                <p className="text-muted-foreground mt-1 font-mono text-xs break-all">
                  {env.supabaseRef}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kesiapan perangkat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <BarisStatus
            ikon={daring ? Smartphone : WifiOff}
            judul="Jaringan"
            nilai={daring ? 'Daring' : 'Luring'}
            nada={daring ? 'success' : 'warning'}
          />
          <BarisStatus
            ikon={CircleDashed}
            judul="Terpasang di layar HP"
            nilai={terpasangSebagaiAplikasi() ? 'Sudah' : 'Belum'}
            nada={terpasangSebagaiAplikasi() ? 'success' : 'secondary'}
          />
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-sm text-balance">
        Untuk memasang: buka menu peramban di HP, pilih{' '}
        <b className="text-foreground">Tambahkan ke Layar Utama</b>. Ikon CitaFIN
        akan muncul seperti aplikasi biasa.
      </p>
    </div>
  )
}

function BarisStatus({
  ikon: Ikon,
  judul,
  nilai,
  nada,
}: {
  ikon: typeof Smartphone
  judul: string
  nilai: string
  nada: 'success' | 'warning' | 'secondary'
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Ikon className="text-muted-foreground size-5 shrink-0" aria-hidden />
        <span className="text-sm">{judul}</span>
      </div>
      <Badge variant={nada}>{nilai}</Badge>
    </div>
  )
}

/** Benar bila aplikasi dibuka dari ikon di layar HP, bukan dari peramban. */
function terpasangSebagaiAplikasi(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
}
