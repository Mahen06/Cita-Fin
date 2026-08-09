import { Boxes, Plus, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusKosong } from '@/components/StatusKosong'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { bolehKelolaItem } from '@/lib/peran'
import { useAuth } from '@/modules/pengeluaran/hooks/konteksAuth'
import {
  simpanProyek,
  STATUS_PROYEK,
  useDaftarProyek,
} from '@/modules/pengeluaran/hooks/useMasterProyek'

type Isian = {
  kode_proyek: string
  nama_proyek: string
  lokasi: string
  status: string
}

const KOSONG: Isian = {
  kode_proyek: '',
  nama_proyek: '',
  lokasi: '',
  status: 'Aktif',
}

export function HalamanMasterProyek() {
  const { profil } = useAuth()
  const [kata, setKata] = useState('')
  const [isian, setIsian] = useState<Isian | null>(null)
  const [galatSimpan, setGalatSimpan] = useState<string | null>(null)
  const [mengirim, setMengirim] = useState(false)

  const { data, galat, muatUlang } = useDaftarProyek(kata)

  // Master proyek memakai kebijakan yang sama dengan master item: admin saja.
  const bolehUbah = profil ? bolehKelolaItem(profil.peran) : false
  const mengubah = Boolean(
    isian && data?.some((p) => p.kode_proyek === isian.kode_proyek),
  )

  async function simpan() {
    if (!isian || mengirim) return

    setGalatSimpan(null)
    setMengirim(true)

    try {
      await simpanProyek({
        kode_proyek: isian.kode_proyek.trim(),
        nama_proyek: isian.nama_proyek.trim(),
        lokasi: isian.lokasi.trim() || null,
        status: isian.status,
      })
      setIsian(null)
      await muatUlang()
    } catch (e) {
      setGalatSimpan(e instanceof Error ? e.message : 'Gagal menyimpan proyek.')
    } finally {
      setMengirim(false)
    }
  }

  if (isian) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">
            {mengubah ? 'Ubah proyek' : 'Tambah proyek'}
          </h2>
          <Button size="icon" variant="ghost" onClick={() => setIsian(null)}>
            <X aria-hidden />
            <span className="sr-only">Tutup</span>
          </Button>
        </div>

        <Kolom label="Kode proyek" id="kode_proyek">
          <Input
            id="kode_proyek"
            value={isian.kode_proyek}
            onChange={(e) => setIsian({ ...isian, kode_proyek: e.target.value })}
            disabled={mengubah}
            placeholder="PRJ-001"
            autoCapitalize="characters"
          />
        </Kolom>

        <Kolom label="Nama proyek" id="nama_proyek">
          <Input
            id="nama_proyek"
            value={isian.nama_proyek}
            onChange={(e) => setIsian({ ...isian, nama_proyek: e.target.value })}
            placeholder="DR-HOUSE"
          />
        </Kolom>

        <Kolom label="Lokasi" id="lokasi">
          <Input
            id="lokasi"
            value={isian.lokasi}
            onChange={(e) => setIsian({ ...isian, lokasi: e.target.value })}
          />
        </Kolom>

        <Kolom label="Status" id="status">
          <Select
            id="status"
            value={isian.status}
            onChange={(e) => setIsian({ ...isian, status: e.target.value })}
          >
            {STATUS_PROYEK.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Kolom>

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
              mengirim || !isian.kode_proyek.trim() || !isian.nama_proyek.trim()
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
        placeholder="Cari nama atau kode proyek…"
        value={kata}
        onChange={(e) => setKata(e.target.value)}
        aria-label="Cari proyek"
      />

      {bolehUbah ? (
        <Button size="sm" onClick={() => setIsian(KOSONG)}>
          <Plus aria-hidden />
          Tambah proyek
        </Button>
      ) : null}

      {galat ? (
        <StatusGalat pesan={galat} onCobaLagi={() => void muatUlang()} />
      ) : data === null ? (
        <StatusMemuat pesan="Memuat proyek…" />
      ) : data.length === 0 ? (
        <StatusKosong
          ikon={Boxes}
          judul={
            kata ? 'Tidak ada proyek yang cocok' : 'Master proyek masih kosong'
          }
          keterangan={
            kata
              ? 'Coba kata kunci lain.'
              : 'Tambahkan proyek yang sedang berjalan agar nota bisa dibebankan.'
          }
        />
      ) : (
        <ul className="space-y-2">
          {data.map((proyek) => (
            <li key={proyek.kode_proyek}>
              <Card className="gap-0 py-3">
                <CardContent className="space-y-2 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">
                        {proyek.nama_proyek}
                      </p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {proyek.kode_proyek}
                        {proyek.lokasi ? ` · ${proyek.lokasi}` : ''}
                      </p>
                    </div>
                    <Badge
                      variant={proyek.status === 'Aktif' ? 'success' : 'secondary'}
                    >
                      {proyek.status}
                    </Badge>
                  </div>

                  {bolehUbah ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setIsian({
                          kode_proyek: proyek.kode_proyek,
                          nama_proyek: proyek.nama_proyek,
                          lokasi: proyek.lokasi ?? '',
                          status: proyek.status,
                        })
                      }
                    >
                      Ubah
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Kolom({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
