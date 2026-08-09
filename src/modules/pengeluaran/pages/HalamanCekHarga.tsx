import {
  ChevronRight,
  Loader2,
  Minus,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusKosong } from '@/components/StatusKosong'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatRupiah, formatTanggalPendek } from '@/lib/format'
import {
  ambilRiwayat,
  catatRiwayat,
  hapusRiwayat,
  type ItemRiwayat,
} from '@/lib/riwayatCari'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  PERIODE,
  useHargaItem,
  type HargaToko,
  type Periode,
} from '@/modules/pengeluaran/hooks/useCekHarga'

type HasilCari = {
  kode_item: string
  nama_baku: string
  satuan_baku: string
}

export function HalamanCekHarga() {
  const [kata, setKata] = useState('')
  const [hasil, setHasil] = useState<HasilCari[] | null>(null)
  const [mencari, setMencari] = useState(false)
  const [galatCari, setGalatCari] = useState<string | null>(null)

  const [terpilih, setTerpilih] = useState<ItemRiwayat | null>(null)
  const [periode, setPeriode] = useState<Periode>('6b')
  const [riwayat, setRiwayat] = useState<ItemRiwayat[]>(() => ambilRiwayat())

  const kolom = useRef<HTMLInputElement>(null)
  const { data, galat, muatUlang } = useHargaItem(
    terpilih?.kode_item ?? null,
    periode,
  )

  // Fokus otomatis saat layar terbuka (F1) — kriteria 15 detik dimulai
  // dari sini; satu ketukan yang tidak perlu sudah memakan waktu.
  useEffect(() => {
    kolom.current?.focus()
  }, [])

  // Pencarian fuzzy, jeda 250ms sesuai F1.
  useEffect(() => {
    const bersih = kata.trim()

    if (bersih.length < 2) {
      setHasil(null)
      setMencari(false)
      return
    }

    setMencari(true)
    const jeda = setTimeout(async () => {
      const { data: cari, error } = await supabase.rpc('cari_item', {
        p_kata: bersih,
        p_limit: 25,
      })

      if (error) {
        setGalatCari('Pencarian gagal. Periksa sambungan.')
        setHasil(null)
      } else {
        setGalatCari(null)
        setHasil((cari ?? []) as HasilCari[])
      }
      setMencari(false)
    }, 250)

    return () => clearTimeout(jeda)
  }, [kata])

  function pilih(item: ItemRiwayat) {
    setTerpilih(item)
    setRiwayat(catatRiwayat(item))
    setKata('')
    setHasil(null)
    kolom.current?.blur()
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          ref={kolom}
          type="search"
          className="h-12 pl-10 text-base"
          placeholder="Cari material… misal: semen"
          value={kata}
          onChange={(e) => setKata(e.target.value)}
          aria-label="Cari material"
        />
      </div>

      {/* ── Hasil pencarian menimpa isi layar selama mengetik ─────── */}
      {kata.trim().length >= 2 ? (
        galatCari ? (
          <StatusGalat pesan={galatCari} />
        ) : mencari && hasil === null ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
            <span className="text-muted-foreground text-sm">Mencari…</span>
          </div>
        ) : hasil && hasil.length === 0 ? (
          <StatusKosong
            ikon={Search}
            judul="Tidak ada item yang cocok"
            keterangan="Coba kata lain. Salah ketik biasanya tetap ketemu — kalau tetap kosong, item ini mungkin belum ada di master."
          />
        ) : (
          <ul className="space-y-1">
            {hasil?.map((item) => (
              <li key={item.kode_item}>
                <button
                  type="button"
                  onClick={() => pilih(item)}
                  className="hover:bg-accent flex min-h-14 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-words">
                      {item.nama_baku}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {item.kode_item}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {item.satuan_baku}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : terpilih ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-medium break-words">{terpilih.nama_baku}</h2>
              <p className="text-muted-foreground font-mono text-xs">
                {terpilih.kode_item} · per {terpilih.satuan_baku}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setTerpilih(null)
                kolom.current?.focus()
              }}
            >
              <X aria-hidden />
              <span className="sr-only">Tutup</span>
            </Button>
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

          {galat ? (
            <StatusGalat pesan={galat} onCobaLagi={() => void muatUlang()} />
          ) : data === null ? (
            <StatusMemuat pesan="Mengambil harga…" />
          ) : data.perToko.length === 0 ? (
            <StatusKosong
              ikon={Search}
              judul="Belum ada harga untuk item ini"
              keterangan="Harga muncul setelah ada nota final yang memuat item ini. Nota draft sengaja tidak dihitung."
            />
          ) : (
            <>
              {data.ringkasan ? (
                <Card className="gap-0 py-3">
                  <CardContent className="px-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <Ringkas
                        label="Terendah"
                        nilai={formatRupiah(data.ringkasan.terendah)}
                        tebal
                      />
                      <Ringkas
                        label="Tertinggi"
                        nilai={formatRupiah(data.ringkasan.tertinggi)}
                      />
                      <Ringkas
                        label="Rata-rata"
                        nilai={formatRupiah(data.ringkasan.rata2)}
                      />
                      <Ringkas
                        label="Jumlah toko"
                        nilai={String(data.ringkasan.jml_toko)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <ul className="space-y-2">
                {data.perToko.map((t, i) => (
                  <li key={t.kode_toko}>
                    <KartuHarga harga={t} termurah={i === 0} />
                  </li>
                ))}
              </ul>

              <p className="text-muted-foreground text-center text-xs text-balance">
                Urut dari termurah. Hanya nota berstatus final yang dihitung.
              </p>
            </>
          )}
        </>
      ) : (
        <>
          {riwayat.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-sm">
                  Pencarian terakhir
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    hapusRiwayat()
                    setRiwayat([])
                  }}
                >
                  Hapus
                </Button>
              </div>
              <ul className="space-y-1">
                {riwayat.map((item) => (
                  <li key={item.kode_item}>
                    <button
                      type="button"
                      onClick={() => pilih(item)}
                      className="hover:bg-accent flex min-h-12 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors"
                    >
                      <span className="min-w-0 text-sm break-words">
                        {item.nama_baku}
                      </span>
                      <ChevronRight
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <StatusKosong
              ikon={Search}
              judul="Ketik nama material"
              keterangan="Misalnya: semen, besi, cat. Salah ketik tidak masalah — pencarian tetap menemukan yang mirip."
            />
          )}
        </>
      )}
    </div>
  )
}

function Ringkas({
  label,
  nilai,
  tebal,
}: {
  label: string
  nilai: string
  tebal?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={cn(
          'text-sm break-words',
          tebal ? 'text-success font-semibold' : 'font-medium',
        )}
      >
        {nilai}
      </p>
    </div>
  )
}

function KartuHarga({
  harga,
  termurah,
}: {
  harga: HargaToko
  termurah: boolean
}) {
  return (
    <Link to={`/nota/${harga.id_nota}`} className="block">
      <Card
        className={cn(
          'hover:bg-accent gap-0 py-3 transition-colors',
          termurah && 'border-success/50',
        )}
      >
        <CardContent className="space-y-2 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium break-words">{harga.nama_toko}</p>
              <p className="text-muted-foreground text-xs">
                {formatTanggalPendek(harga.tanggal)} · {harga.nama_proyek}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  'font-semibold',
                  termurah && 'text-success',
                )}
              >
                {formatRupiah(harga.harga_satuan)}
              </p>
              <p className="text-muted-foreground text-xs">
                per {harga.satuan_baku}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {termurah ? <Badge variant="success">Termurah</Badge> : null}
            {harga.pkp ? <Badge variant="outline">PKP</Badge> : null}
            <PenandaTren harga={harga} />
            {harga.jml_pembelian > 1 ? (
              <Badge variant="outline">{harga.jml_pembelian}× beli</Badge>
            ) : null}
            <ChevronRight
              className="text-muted-foreground ml-auto size-4"
              aria-hidden
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

/** Naik / turun / tetap dibanding pembelian sebelumnya di toko yang sama. */
function PenandaTren({ harga }: { harga: HargaToko }) {
  if (harga.tren === null) return null

  if (harga.tren === 'tetap') {
    return (
      <Badge variant="secondary">
        <Minus aria-hidden />
        Tetap
      </Badge>
    )
  }

  const naik = harga.tren === 'naik'
  const lama = harga.harga_sebelumnya ?? 0
  const beda = lama > 0 ? Math.round(((harga.harga_satuan - lama) / lama) * 100) : 0

  return (
    <Badge variant={naik ? 'destructive' : 'success'}>
      {naik ? <TrendingUp aria-hidden /> : <TrendingDown aria-hidden />}
      {naik ? 'Naik' : 'Turun'} {Math.abs(beda)}%
    </Badge>
  )
}
