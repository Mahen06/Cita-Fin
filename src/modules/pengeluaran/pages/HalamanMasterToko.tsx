import { Plus, Store, X } from 'lucide-react'
import { useState } from 'react'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusKosong } from '@/components/StatusKosong'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { bolehKelolaToko } from '@/lib/peran'
import { useAuth } from '@/modules/pengeluaran/hooks/konteksAuth'
import {
  JENIS_TOKO,
  simpanToko,
  useDaftarToko,
  type Toko,
} from '@/modules/pengeluaran/hooks/useMasterToko'

type Isian = {
  kode_toko: string
  nama_toko: string
  kota: string
  pkp: boolean
  kontak: string
  termin: string
  jenis: string
  aktif: boolean
}

const KOSONG: Isian = {
  kode_toko: '',
  nama_toko: '',
  kota: '',
  pkp: false,
  kontak: '',
  termin: '',
  jenis: 'Toko Material',
  aktif: true,
}

export function HalamanMasterToko() {
  const { profil } = useAuth()
  const [kata, setKata] = useState('')
  const [isian, setIsian] = useState<Isian | null>(null)
  const [galatSimpan, setGalatSimpan] = useState<string | null>(null)
  const [mengirim, setMengirim] = useState(false)

  const { data, galat, muatUlang } = useDaftarToko(kata)
  const bolehUbah = profil ? bolehKelolaToko(profil.peran) : false
  const mengubah = Boolean(isian && data?.some((t) => t.kode_toko === isian.kode_toko))

  async function simpan() {
    if (!isian || mengirim) return

    setGalatSimpan(null)
    setMengirim(true)

    try {
      await simpanToko({
        kode_toko: isian.kode_toko.trim(),
        nama_toko: isian.nama_toko.trim(),
        kota: isian.kota.trim() || null,
        pkp: isian.pkp,
        kontak: isian.kontak.trim() || null,
        termin: isian.termin.trim() || null,
        jenis: isian.jenis,
        aktif: isian.aktif,
      })
      setIsian(null)
      await muatUlang()
    } catch (e) {
      setGalatSimpan(e instanceof Error ? e.message : 'Gagal menyimpan toko.')
    } finally {
      setMengirim(false)
    }
  }

  if (isian) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">
            {mengubah ? 'Ubah toko' : 'Tambah toko'}
          </h2>
          <Button size="icon" variant="ghost" onClick={() => setIsian(null)}>
            <X aria-hidden />
            <span className="sr-only">Tutup</span>
          </Button>
        </div>

        <Kolom label="Kode toko" id="kode_toko">
          <Input
            id="kode_toko"
            value={isian.kode_toko}
            onChange={(e) => setIsian({ ...isian, kode_toko: e.target.value })}
            disabled={mengubah}
            placeholder="TK-001"
            autoCapitalize="characters"
          />
        </Kolom>

        <Kolom label="Nama toko" id="nama_toko">
          <Input
            id="nama_toko"
            value={isian.nama_toko}
            onChange={(e) => setIsian({ ...isian, nama_toko: e.target.value })}
            placeholder="TB Sumber Rejeki"
          />
        </Kolom>

        <Kolom label="Jenis" id="jenis">
          <Select
            id="jenis"
            value={isian.jenis}
            onChange={(e) => setIsian({ ...isian, jenis: e.target.value })}
          >
            {JENIS_TOKO.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </Select>
        </Kolom>

        <Kolom label="Kota" id="kota">
          <Input
            id="kota"
            value={isian.kota}
            onChange={(e) => setIsian({ ...isian, kota: e.target.value })}
          />
        </Kolom>

        <Kolom label="Kontak" id="kontak">
          <Input
            id="kontak"
            inputMode="tel"
            value={isian.kontak}
            onChange={(e) => setIsian({ ...isian, kontak: e.target.value })}
          />
        </Kolom>

        <Kolom label="Termin" id="termin">
          <Input
            id="termin"
            value={isian.termin}
            onChange={(e) => setIsian({ ...isian, termin: e.target.value })}
            placeholder="Tunai / 30 hari"
          />
        </Kolom>

        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5 shrink-0"
            checked={isian.pkp}
            onChange={(e) => setIsian({ ...isian, pkp: e.target.checked })}
          />
          <span className="text-balance">
            Toko PKP — harganya sudah termasuk PPN
          </span>
        </label>

        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5 shrink-0"
            checked={isian.aktif}
            onChange={(e) => setIsian({ ...isian, aktif: e.target.checked })}
          />
          Toko aktif
        </label>

        {galatSimpan ? <StatusGalat pesan={galatSimpan} /> : null}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setIsian(null)}
          >
            Batal
          </Button>
          <Button
            className="flex-1"
            onClick={() => void simpan()}
            disabled={
              mengirim || !isian.kode_toko.trim() || !isian.nama_toko.trim()
            }
          >
            {mengirim ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Cari nama atau kode toko…"
        value={kata}
        onChange={(e) => setKata(e.target.value)}
        aria-label="Cari toko"
      />

      {bolehUbah ? (
        <Button size="sm" onClick={() => setIsian(KOSONG)}>
          <Plus aria-hidden />
          Tambah toko
        </Button>
      ) : null}

      {galat ? (
        <StatusGalat pesan={galat} onCobaLagi={() => void muatUlang()} />
      ) : data === null ? (
        <StatusMemuat pesan="Memuat toko…" />
      ) : data.length === 0 ? (
        <StatusKosong
          ikon={Store}
          judul={kata ? 'Tidak ada toko yang cocok' : 'Master toko masih kosong'}
          keterangan={
            kata ? 'Coba kata kunci lain.' : 'Tambahkan toko tempat belanja rutin.'
          }
        />
      ) : (
        <ul className="space-y-2">
          {data.map((toko) => (
            <li key={toko.kode_toko}>
              <KartuToko
                toko={toko}
                bolehUbah={bolehUbah}
                onUbah={() =>
                  setIsian({
                    kode_toko: toko.kode_toko,
                    nama_toko: toko.nama_toko,
                    kota: toko.kota ?? '',
                    pkp: toko.pkp,
                    kontak: toko.kontak ?? '',
                    termin: toko.termin ?? '',
                    jenis: toko.jenis,
                    aktif: toko.aktif,
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function KartuToko({
  toko,
  bolehUbah,
  onUbah,
}: {
  toko: Toko
  bolehUbah: boolean
  onUbah: () => void
}) {
  return (
    <Card className="gap-0 py-3">
      <CardContent className="space-y-2 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium break-words">{toko.nama_toko}</p>
            <p className="text-muted-foreground font-mono text-xs">
              {toko.kode_toko}
              {toko.kota ? ` · ${toko.kota}` : ''}
            </p>
          </div>
          {toko.pkp ? <Badge>PKP</Badge> : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{toko.jenis}</Badge>
          {toko.termin ? <Badge variant="outline">{toko.termin}</Badge> : null}
          {!toko.aktif ? <Badge variant="secondary">Nonaktif</Badge> : null}
        </div>

        {bolehUbah ? (
          <Button size="sm" variant="outline" onClick={onUbah}>
            Ubah
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Kolom({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
