import { CheckCircle2, Loader2, Plus, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusKosong } from '@/components/StatusKosong'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { formatRupiah } from '@/lib/format'
import { hanyaBolehDraft } from '@/lib/peran'
import { cn } from '@/lib/utils'
import { useAuth } from '@/modules/pengeluaran/hooks/konteksAuth'
import { useDaftarProyek } from '@/modules/pengeluaran/hooks/useMasterProyek'
import { useDaftarToko } from '@/modules/pengeluaran/hooks/useMasterToko'
import {
  barisKosong,
  barisSiap,
  hargaTerakhir,
  hitungSelisih,
  METODE_BAYAR,
  selisihNol,
  simpanNota,
  totalRincian,
  type BarisNota,
  type HeaderNota,
  type MetodeBayar,
} from '@/modules/pengeluaran/hooks/useNota'
import {
  PemilihItem,
  type ItemTerpilih,
} from '@/modules/pengeluaran/components/PemilihItem'
import { BarisNotaItem } from '@/modules/pengeluaran/components/BarisNotaItem'

function hariIni(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function HalamanInputNota() {
  const { profil } = useAuth()
  const navigasi = useNavigate()

  const { data: proyek, galat: galatProyek } = useDaftarProyek('')
  const { data: toko, galat: galatToko } = useDaftarToko('')

  const [header, setHeader] = useState<HeaderNota>({
    tanggal: hariIni(),
    kode_proyek: '',
    kode_toko: '',
    no_nota_toko: '',
    metode_bayar: 'Tunai',
    total_nota: '',
    catatan: '',
  })

  const [baris, setBaris] = useState<BarisNota[]>([barisKosong()])
  const [pilihUntuk, setPilihUntuk] = useState<string | null>(null)
  const [mengirim, setMengirim] = useState<'draft' | 'final' | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  const [sukses, setSukses] = useState<string | null>(null)

  // Proyek dan toko diisi otomatis bila hanya ada satu pilihan —
  // menghemat dua ketukan pada nota yang harus selesai dalam 90 detik.
  useEffect(() => {
    if (proyek?.length === 1 && !header.kode_proyek) {
      setHeader((h) => ({ ...h, kode_proyek: proyek[0].kode_proyek }))
    }
  }, [proyek, header.kode_proyek])

  useEffect(() => {
    if (toko?.length === 1 && !header.kode_toko) {
      setHeader((h) => ({ ...h, kode_toko: toko[0].kode_toko }))
    }
  }, [toko, header.kode_toko])

  /*
    Saat toko berganti, harga terakhir tiap baris ikut berganti — harga
    item yang sama di toko berbeda tidak ada hubungannya. Harga yang sudah
    diketik pengguna tidak ditimpa; hanya kolom yang masih kosong yang
    diisikan dari pembelian terakhir.
  */
  useEffect(() => {
    if (!header.kode_toko) return

    let hidup = true

    Promise.all(
      baris.map(async (b) =>
        b.kode_item ? await hargaTerakhir(b.kode_item, header.kode_toko) : null,
      ),
    ).then((harga) => {
      if (!hidup) return

      setBaris((sekarang) =>
        sekarang.map((b, i) => {
          const terakhir = harga[i] ?? null
          return {
            ...b,
            harga_terakhir: terakhir,
            harga_satuan:
              b.harga_satuan === '' && terakhir !== null
                ? String(terakhir)
                : b.harga_satuan,
          }
        }),
      )
    })

    return () => {
      hidup = false
    }
    // Sengaja hanya bergantung pada toko. Menambahkan `baris` sebagai
    // ketergantungan membuat efek ini berjalan tiap ketukan huruf, dan
    // setiap kali menimpa harga yang sedang diketik pengguna.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [header.kode_toko])

  const rincian = totalRincian(baris)
  const selisih = hitungSelisih(header.total_nota, baris)
  const pas = selisihNol(selisih)
  const adaBaris = baris.some(barisSiap)
  const wajibTerisi = Boolean(header.kode_proyek && header.kode_toko)
  const totalDiisi = header.total_nota.trim() !== ''

  const hanyaDraft = profil ? hanyaBolehDraft(profil.peran) : true
  const bisaFinal = wajibTerisi && adaBaris && totalDiisi && pas && !hanyaDraft
  const bisaDraft = wajibTerisi && adaBaris

  async function kirim(status: 'draft' | 'final') {
    if (mengirim) return

    setGalat(null)
    setMengirim(status)

    try {
      const id = await simpanNota(header, baris, status)
      setSukses(id)
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Nota gagal disimpan.')
    } finally {
      setMengirim(null)
    }
  }

  function ulangi() {
    setHeader({
      ...header,
      no_nota_toko: '',
      total_nota: '',
      catatan: '',
    })
    setBaris([barisKosong()])
    setSukses(null)
  }

  if (galatProyek || galatToko) {
    return (
      <StatusGalat
        pesan={galatProyek ?? galatToko ?? ''}
        onCobaLagi={() => window.location.reload()}
      />
    )
  }

  if (proyek === null || toko === null) {
    return <StatusMemuat pesan="Memuat proyek dan toko…" />
  }

  if (proyek.length === 0 || toko.length === 0) {
    return (
      <StatusKosong
        ikon={TriangleAlert}
        judul="Master data belum lengkap"
        keterangan={
          proyek.length === 0 && toko.length === 0
            ? 'Belum ada proyek maupun toko. Isi lewat Menu → Master Data sebelum menginput nota.'
            : proyek.length === 0
              ? 'Belum ada proyek. Isi lewat Menu → Master Data.'
              : 'Belum ada toko. Isi lewat Menu → Master Data.'
        }
      />
    )
  }

  if (sukses) {
    return (
      <div className="space-y-4">
        <div className="border-success/40 bg-success/10 flex items-start gap-3 rounded-xl border px-4 py-4">
          <CheckCircle2
            className="text-success mt-0.5 size-5 shrink-0"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-medium">Nota tersimpan</p>
            <p className="text-muted-foreground font-mono text-xs break-all">
              {sukses}
            </p>
          </div>
        </div>

        <Button className="w-full" onClick={ulangi}>
          Input nota berikutnya
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigasi('/')}
        >
          Selesai
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pilihUntuk ? (
        <PemilihItem
          onTutup={() => setPilihUntuk(null)}
          onPilih={async (item: ItemTerpilih) => {
            const terakhir = await hargaTerakhir(
              item.kode_item,
              header.kode_toko,
            )

            setBaris((sekarang) =>
              sekarang.map((b) =>
                b.id === pilihUntuk
                  ? {
                      ...b,
                      kode_item: item.kode_item,
                      nama_baku: item.nama_baku,
                      kategori: item.kategori,
                      satuan_baku: item.satuan_baku,
                      harga_terakhir: terakhir,
                      harga_satuan:
                        b.harga_satuan === '' && terakhir !== null
                          ? String(terakhir)
                          : b.harga_satuan,
                    }
                  : b,
              ),
            )
            setPilihUntuk(null)
          }}
        />
      ) : null}

      {/* ── Header nota ─────────────────────────────────────────── */}
      <Card className="gap-0 py-4">
        <CardContent className="space-y-3 px-4">
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input
              id="tanggal"
              type="date"
              value={header.tanggal}
              onChange={(e) =>
                setHeader({ ...header, tanggal: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proyek">Proyek</Label>
            <Select
              id="proyek"
              value={header.kode_proyek}
              onChange={(e) =>
                setHeader({ ...header, kode_proyek: e.target.value })
              }
            >
              <option value="">— pilih proyek —</option>
              {proyek.map((p) => (
                <option key={p.kode_proyek} value={p.kode_proyek}>
                  {p.nama_proyek}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toko">Toko</Label>
            <Select
              id="toko"
              value={header.kode_toko}
              onChange={(e) =>
                setHeader({ ...header, kode_toko: e.target.value })
              }
            >
              <option value="">— pilih toko —</option>
              {toko.map((t) => (
                <option key={t.kode_toko} value={t.kode_toko}>
                  {t.nama_toko}
                  {t.pkp ? ' (PKP)' : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="no_nota">Nomor nota toko</Label>
            <Input
              id="no_nota"
              value={header.no_nota_toko}
              onChange={(e) =>
                setHeader({ ...header, no_nota_toko: e.target.value })
              }
              placeholder="Opsional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metode">Metode bayar</Label>
            <Select
              id="metode"
              value={header.metode_bayar}
              onChange={(e) =>
                setHeader({
                  ...header,
                  metode_bayar: e.target.value as MetodeBayar,
                })
              }
            >
              {METODE_BAYAR.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Baris item ──────────────────────────────────────────── */}
      <div className="space-y-2">
        {baris.map((b, i) => (
          <BarisNotaItem
            key={b.id}
            baris={b}
            nomor={i + 1}
            onPilihItem={() => setPilihUntuk(b.id)}
            onUbah={(baru) =>
              setBaris((s) => s.map((x) => (x.id === baru.id ? baru : x)))
            }
            onHapus={() =>
              setBaris((s) =>
                s.length === 1 ? [barisKosong()] : s.filter((x) => x.id !== b.id),
              )
            }
          />
        ))}
      </div>

      {/* Selalu terlihat di layar sempit, sesuai F2. */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setBaris((s) => [...s, barisKosong()])}
      >
        <Plus aria-hidden />
        Tambah baris
      </Button>

      <p className="text-muted-foreground text-xs text-balance">
        Ongkir, PPN, dan diskon diinput sebagai baris tersendiri — jangan
        dilebur ke harga satuan material, supaya harga tetap bisa
        dibandingkan antar toko.
      </p>

      {/* ── Penutup: total dan selisih ──────────────────────────── */}
      <Card className="gap-0 py-4">
        <CardContent className="space-y-3 px-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-sm">
              Jumlah rincian
            </span>
            <span className="font-medium">{formatRupiah(rincian)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_nota">Total nota dari nota fisik</Label>
            <Input
              id="total_nota"
              inputMode="numeric"
              value={header.total_nota}
              onChange={(e) =>
                setHeader({ ...header, total_nota: e.target.value })
              }
              placeholder="0"
            />
          </div>

          {/* Indikator selisih — aturan B4 */}
          <div
            className={cn(
              'flex items-center justify-between gap-2 rounded-md px-3 py-2.5',
              !totalDiisi
                ? 'bg-muted'
                : pas
                  ? 'bg-success/15'
                  : 'bg-destructive/10',
            )}
          >
            <span className="text-sm font-medium">Selisih</span>
            <span
              className={cn(
                'text-sm font-semibold',
                totalDiisi && (pas ? 'text-success' : 'text-destructive'),
              )}
            >
              {totalDiisi ? formatRupiah(selisih) : '—'}
            </span>
          </div>

          {totalDiisi && !pas ? (
            <p className="text-muted-foreground text-xs text-balance">
              Selisih harus nol sebelum nota bisa disimpan sebagai final.
              Sementara ini hanya bisa disimpan sebagai draft — dan draft
              tidak muncul di Cek Harga maupun Laporan.
            </p>
          ) : null}

          {hanyaDraft ? (
            <p className="text-muted-foreground text-xs text-balance">
              Peran Anda hanya bisa menyimpan draft. Finalisasi dilakukan
              finance atau admin.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {galat ? <StatusGalat pesan={galat} /> : null}

      <div className="flex gap-2 pb-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => void kirim('draft')}
          disabled={!bisaDraft || mengirim !== null}
        >
          {mengirim === 'draft' ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Menyimpan…
            </>
          ) : (
            'Simpan Draft'
          )}
        </Button>

        <Button
          className="flex-1"
          onClick={() => void kirim('final')}
          disabled={!bisaFinal || mengirim !== null}
        >
          {mengirim === 'final' ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Menyimpan…
            </>
          ) : (
            'Simpan Final'
          )}
        </Button>
      </div>
    </div>
  )
}
