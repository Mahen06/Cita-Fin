import { CheckCircle2, Loader2, Upload } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { StatusGalat } from '@/components/StatusGalat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { bacaBerkas, bacaCsvBertajuk } from '@/lib/csv'
import { imporItem, KATEGORI } from '@/modules/pengeluaran/hooks/useMasterItem'

const KOLOM_WAJIB = ['kode_item', 'nama_baku', 'kategori', 'satuan_baku']

type BarisPratinjau = Record<string, string> & { __masalah?: string }

export function HalamanImporItem() {
  const navigasi = useNavigate()

  const [baris, setBaris] = useState<BarisPratinjau[] | null>(null)
  const [namaBerkas, setNamaBerkas] = useState('')
  const [galat, setGalat] = useState<string | null>(null)
  const [mengirim, setMengirim] = useState(false)
  const [hasil, setHasil] = useState<{ baru: number; diperbarui: number } | null>(
    null,
  )

  async function pilihBerkas(berkas: File) {
    setGalat(null)
    setHasil(null)
    setNamaBerkas(berkas.name)

    try {
      const { tajuk, baris: mentah } = bacaCsvBertajuk(await bacaBerkas(berkas))

      const kurang = KOLOM_WAJIB.filter((k) => !tajuk.includes(k))
      if (kurang.length > 0) {
        setBaris(null)
        setGalat(
          `Kolom wajib belum ada di berkas: ${kurang.join(', ')}. Baris pertama CSV harus berisi nama kolom.`,
        )
        return
      }

      if (mentah.length === 0) {
        setBaris(null)
        setGalat('Berkas tidak berisi baris data, hanya tajuk kolom.')
        return
      }

      setBaris(mentah.map(periksaBaris))
    } catch (e) {
      setBaris(null)
      setGalat(e instanceof Error ? e.message : 'Berkas tidak bisa dibaca.')
    }
  }

  async function simpan() {
    if (!baris || mengirim) return

    setGalat(null)
    setMengirim(true)

    try {
      setHasil(
        await imporItem(
          baris.map((b) => ({
            kode_item: b.kode_item,
            nama_baku: b.nama_baku,
            kategori: b.kategori.toUpperCase(),
            sub_kategori: b.sub_kategori ?? '',
            satuan_baku: b.satuan_baku,
            spesifikasi: b.spesifikasi ?? '',
            aktif: bacaAktif(b.aktif),
          })),
        ),
      )
      setBaris(null)
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Impor gagal.')
    } finally {
      setMengirim(false)
    }
  }

  const bermasalah = baris?.filter((b) => b.__masalah) ?? []

  if (hasil) {
    return (
      <div className="space-y-4">
        <div className="border-success/40 bg-success/10 flex items-start gap-3 rounded-xl border px-4 py-4">
          <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Impor selesai</p>
            <p className="text-muted-foreground text-sm">
              {hasil.baru} item baru ditambahkan, {hasil.diperbarui} item
              diperbarui.
            </p>
          </div>
        </div>
        <Button className="w-full" onClick={() => navigasi('/master/item')}>
          Lihat master item
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-balance">
          Pilih berkas CSV. Baris pertama harus berisi nama kolom:{' '}
          <span className="font-mono text-xs">
            kode_item, nama_baku, kategori, sub_kategori, satuan_baku,
            spesifikasi, aktif
          </span>
        </p>

        <label className="border-input hover:bg-accent flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors">
          <Upload className="text-muted-foreground size-6" aria-hidden />
          <span className="text-sm font-medium">
            {namaBerkas || 'Ketuk untuk memilih berkas CSV'}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void pilihBerkas(f)
            }}
          />
        </label>
      </div>

      {galat ? <StatusGalat pesan={galat} /> : null}

      {baris ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{baris.length} baris terbaca</Badge>
            {bermasalah.length > 0 ? (
              <Badge variant="destructive">
                {bermasalah.length} baris bermasalah
              </Badge>
            ) : (
              <Badge variant="success">Semua baris siap</Badge>
            )}
          </div>

          {bermasalah.length > 0 ? (
            <StatusGalat
              judul="Perbaiki dulu di berkas CSV"
              pesan="Impor tidak bisa dijalankan selama masih ada baris bermasalah. Seluruh baris disimpan sekaligus, atau tidak sama sekali."
              rincian={bermasalah
                .slice(0, 8)
                .map((b) => `${b.kode_item || '(kode kosong)'} — ${b.__masalah}`)}
            />
          ) : null}

          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Pratinjau 10 baris pertama:
            </p>
            {baris.slice(0, 10).map((b, i) => (
              <Card key={`${b.kode_item}-${i}`} className="gap-0 py-3">
                <CardContent className="px-4">
                  <p className="text-sm font-medium break-words">
                    {b.nama_baku || '(nama kosong)'}
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {b.kode_item} · {b.kategori} · {b.satuan_baku}
                  </p>
                  {b.__masalah ? (
                    <p className="text-destructive mt-1 text-xs">{b.__masalah}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setBaris(null)
                setNamaBerkas('')
              }}
            >
              Batal
            </Button>
            <Button
              className="flex-1"
              onClick={() => void simpan()}
              disabled={mengirim || bermasalah.length > 0}
            >
              {mengirim ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Menyimpan…
                </>
              ) : (
                `Simpan ${baris.length} item`
              )}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}

/** Pemeriksaan di klien; database memeriksa ulang lewat RPC `impor_master_item`. */
function periksaBaris(b: Record<string, string>): BarisPratinjau {
  const masalah: string[] = []

  if (!b.kode_item) masalah.push('kode_item kosong')
  if (!b.nama_baku) masalah.push('nama_baku kosong')
  if (!b.satuan_baku) masalah.push('satuan_baku kosong')

  const kategori = (b.kategori ?? '').toUpperCase()
  if (!kategori) {
    masalah.push('kategori kosong')
  } else if (!(KATEGORI as string[]).includes(kategori)) {
    masalah.push(`kategori "${b.kategori}" tidak dikenal`)
  }

  return masalah.length > 0 ? { ...b, __masalah: masalah.join(', ') } : b
}

function bacaAktif(nilai: string | undefined): boolean {
  if (nilai === undefined || nilai.trim() === '') return true
  return !['false', '0', 'tidak', 'no'].includes(nilai.trim().toLowerCase())
}
