import { FileWarning } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusKosong } from '@/components/StatusKosong'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatAngka, formatRupiah, formatTanggal } from '@/lib/format'
import { supabase } from '@/lib/supabase'

type Nota = {
  id_nota: string
  tanggal: string
  no_nota_toko: string | null
  metode_bayar: string
  total_nota: number
  status: string
  catatan: string | null
  master_toko: { nama_toko: string; pkp: boolean } | null
  master_proyek: { nama_proyek: string } | null
}

type Detail = {
  id_detail: string
  qty: number
  harga_satuan: number
  subtotal: number | null
  urutan: number
  master_item: { nama_baku: string; satuan_baku: string } | null
}

export function HalamanDetailNota() {
  const { id } = useParams()
  const [nota, setNota] = useState<Nota | null>(null)
  const [detail, setDetail] = useState<Detail[] | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  const [kosong, setKosong] = useState(false)

  useEffect(() => {
    if (!id) return
    let hidup = true

    Promise.all([
      supabase
        .from('nota')
        .select(
          '*, master_toko(nama_toko, pkp), master_proyek(nama_proyek)',
        )
        .eq('id_nota', id)
        .maybeSingle(),
      supabase
        .from('nota_detail')
        .select('*, master_item(nama_baku, satuan_baku)')
        .eq('id_nota', id)
        .order('urutan'),
    ]).then(([hNota, hDetail]) => {
      if (!hidup) return

      if (hNota.error || hDetail.error) {
        setGalat(
          (hNota.error ?? hDetail.error)?.message ?? 'Nota gagal dibaca.',
        )
        return
      }

      if (!hNota.data) {
        setKosong(true)
        return
      }

      setNota(hNota.data as unknown as Nota)
      setDetail(hDetail.data as unknown as Detail[])
    })

    return () => {
      hidup = false
    }
  }, [id])

  if (galat) {
    return (
      <StatusGalat pesan={galat} onCobaLagi={() => window.location.reload()} />
    )
  }

  if (kosong) {
    return (
      <StatusKosong
        ikon={FileWarning}
        judul="Nota tidak ditemukan"
        keterangan="Nota ini mungkin sudah dihapus, atau peran Anda tidak berhak membacanya."
      />
    )
  }

  if (!nota || !detail) return <StatusMemuat pesan="Memuat nota…" />

  const jmlRincian = detail.reduce((a, d) => a + Number(d.subtotal ?? 0), 0)
  const selisih = Number(nota.total_nota) - jmlRincian

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-4">
        <CardContent className="space-y-2 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium break-words">
                {nota.master_toko?.nama_toko ?? '—'}
              </p>
              <p className="text-muted-foreground text-sm">
                {formatTanggal(nota.tanggal)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant={nota.status === 'final' ? 'success' : 'secondary'}>
                {nota.status === 'final' ? 'Final' : 'Draft'}
              </Badge>
              {nota.master_toko?.pkp ? (
                <Badge variant="outline">PKP</Badge>
              ) : null}
            </div>
          </div>

          <Baris label="Proyek" nilai={nota.master_proyek?.nama_proyek ?? '—'} />
          <Baris label="Nomor nota" nilai={nota.no_nota_toko ?? '—'} />
          <Baris label="Metode bayar" nilai={nota.metode_bayar} />
          {nota.catatan ? (
            <Baris label="Catatan" nilai={nota.catatan} />
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          Rincian ({detail.length} baris)
        </p>

        {detail.map((d) => (
          <Card key={d.id_detail} className="gap-0 py-3">
            <CardContent className="px-4">
              <p className="text-sm font-medium break-words">
                {d.master_item?.nama_baku ?? '—'}
              </p>
              <div className="text-muted-foreground mt-1 flex items-center justify-between gap-2 text-xs">
                <span>
                  {formatAngka(Number(d.qty))} {d.master_item?.satuan_baku} ×{' '}
                  {formatRupiah(Number(d.harga_satuan))}
                </span>
                <span className="text-foreground font-medium">
                  {formatRupiah(Number(d.subtotal ?? 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="gap-0 py-4">
        <CardContent className="space-y-2 px-4">
          <Baris label="Jumlah rincian" nilai={formatRupiah(jmlRincian)} />
          <Baris label="Total nota" nilai={formatRupiah(Number(nota.total_nota))} />
          <div className="flex items-center justify-between gap-2 border-t pt-2">
            <span className="text-sm font-medium">Selisih</span>
            <span
              className={
                Math.abs(selisih) < 0.01
                  ? 'text-success text-sm font-semibold'
                  : 'text-destructive text-sm font-semibold'
              }
            >
              {formatRupiah(selisih)}
            </span>
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-xs text-balance">
        Foto nota asli menyusul pada Sesi 9.
      </p>
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
