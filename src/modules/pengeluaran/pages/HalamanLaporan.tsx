import { Download, FileText, Loader2, Share2, Table2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusKosong } from '@/components/StatusKosong'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { formatRupiah, formatTanggalPendek } from '@/lib/format'
import { KATEGORI, type Kategori } from '@/lib/laporan'
import { cn } from '@/lib/utils'
import { useLaporan } from '@/modules/pengeluaran/hooks/useLaporan'
import { useDaftarProyek } from '@/modules/pengeluaran/hooks/useMasterProyek'

function awalBulanIni(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-01`
}

function hariIni(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function HalamanLaporan() {
  const { data: proyek, galat: galatProyek } = useDaftarProyek('')

  const [kodeProyek, setKodeProyek] = useState('')
  const [dari, setDari] = useState(awalBulanIni)
  const [sampai, setSampai] = useState(hariIni)
  const [kategori, setKategori] = useState<Kategori[]>([])
  const [denganToko, setDenganToko] = useState(true)
  const [sibuk, setSibuk] = useState<'pdf' | 'csv' | 'rinci' | null>(null)
  const [kabar, setKabar] = useState<string | null>(null)

  const saringan = useMemo(
    () => ({ kodeProyek, dari, sampai, kategori }),
    [kodeProyek, dari, sampai, kategori],
  )

  const { data, galat, muatUlang } = useLaporan(saringan)

  const namaProyek =
    proyek?.find((p) => p.kode_proyek === kodeProyek)?.nama_proyek ??
    'Semua proyek'

  async function ekspor(jenis: 'pdf' | 'csv' | 'rinci') {
    if (!data || sibuk) return

    setSibuk(jenis)
    setKabar(null)

    try {
      /*
        jspdf berukuran besar dan hanya dipakai di sini. Dimuat saat
        tombol ditekan supaya tidak ikut terunduh setiap kali aplikasi
        dibuka — beda 140 kB terpampat pada jaringan seluler.
      */
      const { bagikanAtauUnduh, buatCsvRekap, buatCsvRinci, buatPdf } =
        await import('@/lib/ekspor')

      const tanda = `${namaProyek.replace(/\W+/g, '-')}_${dari}_${sampai}`

      const berkas =
        jenis === 'pdf'
          ? {
              blob: buatPdf(data, {
                dari,
                sampai,
                kategori: kategori.length ? kategori.join(', ') : '',
                denganToko,
              }),
              nama: `Laporan_${tanda}.pdf`,
            }
          : jenis === 'csv'
            ? { blob: buatCsvRekap(data), nama: `Laporan_${tanda}.csv` }
            : { blob: buatCsvRinci(data), nama: `Rincian_${tanda}.csv` }

      const hasil = await bagikanAtauUnduh(
        berkas.blob,
        berkas.nama,
        `Laporan Pengeluaran ${namaProyek}`,
      )

      setKabar(
        hasil === 'dibagikan'
          ? 'Berkas dikirim ke lembar berbagi.'
          : 'Berkas diunduh ke HP Anda.',
      )
    } catch {
      setKabar('Berkas gagal dibuat. Coba lagi.')
    } finally {
      setSibuk(null)
    }
  }

  if (galatProyek) {
    return (
      <StatusGalat
        pesan={galatProyek}
        onCobaLagi={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-4">
        <CardContent className="space-y-3 px-4">
          <div className="space-y-2">
            <Label htmlFor="proyek">Proyek</Label>
            <Select
              id="proyek"
              value={kodeProyek}
              onChange={(e) => setKodeProyek(e.target.value)}
            >
              <option value="">Semua proyek</option>
              {proyek?.map((p) => (
                <option key={p.kode_proyek} value={p.kode_proyek}>
                  {p.nama_proyek}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="dari">Dari</Label>
              <Input
                id="dari"
                type="date"
                value={dari}
                onChange={(e) => setDari(e.target.value)}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="sampai">Sampai</Label>
              <Input
                id="sampai"
                type="date"
                value={sampai}
                onChange={(e) => setSampai(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <div className="flex flex-wrap gap-1.5">
              {KATEGORI.map((k) => {
                const aktif = kategori.includes(k)
                return (
                  <Button
                    key={k}
                    size="sm"
                    variant={aktif ? 'default' : 'outline'}
                    onClick={() =>
                      setKategori((s) =>
                        aktif ? s.filter((x) => x !== k) : [...s, k],
                      )
                    }
                  >
                    {k}
                  </Button>
                )
              })}
            </div>
            {kategori.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Tidak ada yang dipilih berarti semua kategori ikut.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {galat ? (
        <StatusGalat pesan={galat} onCobaLagi={() => void muatUlang()} />
      ) : data === null ? (
        <StatusMemuat pesan="Menyusun laporan…" />
      ) : data.jmlNota === 0 ? (
        <StatusKosong
          ikon={FileText}
          judul="Tidak ada nota pada periode ini"
          keterangan="Hanya nota berstatus final yang masuk laporan. Nota draft sengaja tidak dihitung."
        />
      ) : (
        <>
          <Card className="gap-0 py-4">
            <CardContent className="space-y-2 px-4">
              {data.perKategori.map((k) => (
                <div
                  key={k.kategori}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-muted-foreground text-sm">
                    {k.kategori}
                  </span>
                  <span className="text-sm font-medium">
                    {formatRupiah(k.total)}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between gap-2 border-t pt-2">
                <span className="font-medium">Total</span>
                <span className="text-lg font-semibold">
                  {formatRupiah(data.total)}
                </span>
              </div>

              <p className="text-muted-foreground text-xs">
                {data.jmlNota} nota · {namaProyek}
              </p>
            </CardContent>
          </Card>

          {data.adaYangTersaring ? (
            <p className="border-warning/40 bg-warning/10 rounded-md border px-3 py-2 text-xs text-balance">
              Penyaring kategori sedang aktif, jadi sebagian baris nota tidak
              ikut terhitung. Jumlah yang ditampilkan adalah jumlah baris yang
              lolos saring, bukan total pada nota fisik.
            </p>
          ) : null}

          <div className="space-y-2">
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-5 shrink-0"
                checked={denganToko}
                onChange={(e) => setDenganToko(e.target.checked)}
              />
              <span className="text-balance">
                Sertakan kolom Toko/Vendor di berkas cetak
              </span>
            </label>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => void ekspor('csv')}
                disabled={sibuk !== null}
              >
                {sibuk === 'csv' ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Download aria-hidden />
                )}
                CSV rekap
              </Button>
              <Button
                className="flex-1"
                onClick={() => void ekspor('pdf')}
                disabled={sibuk !== null}
              >
                {sibuk === 'pdf' ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Share2 aria-hidden />
                )}
                PDF
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => void ekspor('rinci')}
              disabled={sibuk !== null}
            >
              {sibuk === 'rinci' ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Table2 aria-hidden />
              )}
              CSV rinci per item
            </Button>
          </div>

          {kabar ? (
            <p className="text-muted-foreground text-center text-xs">{kabar}</p>
          ) : null}

          {/* Tampilan layar mengikuti bentuk cetak: blok per proyek. */}
          {data.perProyek.map((proyek) => (
            <div key={proyek.kode_proyek} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 border-b pb-1">
                <h2 className="min-w-0 font-medium break-words">
                  {proyek.nama_proyek}
                </h2>
                <span className="shrink-0 text-sm font-semibold">
                  {formatRupiah(proyek.total)}
                </span>
              </div>

              <ul className="space-y-2">
                {proyek.nota.map((nota, i) => (
                  <li key={nota.id_nota}>
                    <Card className="gap-0 py-3">
                      <CardContent className="space-y-2 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm break-words">
                              <span className="text-muted-foreground">
                                {i + 1}.{' '}
                              </span>
                              {nota.uraian}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {formatTanggalPendek(nota.tanggal)} ·{' '}
                              {nota.nama_toko}
                              {nota.no_nota_toko ? ` · ${nota.no_nota_toko}` : ''}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-semibold">
                              {formatRupiah(nota.jumlah)}
                            </p>
                            {nota.pkp ? (
                              <Badge variant="outline" className="mt-1">
                                PKP
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                        <details className="text-xs">
                          <summary className="text-muted-foreground min-h-8 cursor-pointer list-none py-1">
                            Rincian {nota.baris.length} item
                          </summary>
                          <ul className="mt-1 space-y-1 border-t pt-2">
                            {nota.baris.map((b, j) => (
                              <li
                                key={`${b.kode_item}-${j}`}
                                className="flex items-start justify-between gap-2"
                              >
                                <span className="min-w-0 break-words">
                                  {b.nama_baku}
                                  <span className="text-muted-foreground">
                                    {' '}
                                    · {b.qty} {b.satuan_baku} ×{' '}
                                    {formatRupiah(b.harga_satuan)}
                                  </span>
                                </span>
                                <span className="shrink-0 font-medium">
                                  {formatRupiah(b.subtotal)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>

                        {nota.tersaring ? (
                          <p className="text-muted-foreground text-xs">
                            Sebagian baris nota ini tidak ikut karena penyaring
                            kategori. Total nota fisik{' '}
                            {formatRupiah(nota.total_nota)}.
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p
            className={cn(
              'text-muted-foreground text-center text-xs text-balance',
            )}
          >
            Hanya nota berstatus final yang masuk laporan.
          </p>
        </>
      )}
    </div>
  )
}
