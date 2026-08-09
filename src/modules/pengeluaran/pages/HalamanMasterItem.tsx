import { Package, Plus, Upload } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusKosong } from '@/components/StatusKosong'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { bolehKelolaItem } from '@/lib/peran'
import { useAuth } from '@/modules/pengeluaran/hooks/konteksAuth'
import {
  ubahAktifItem,
  useDaftarItem,
} from '@/modules/pengeluaran/hooks/useMasterItem'

export function HalamanMasterItem() {
  const { profil } = useAuth()
  const [kata, setKata] = useState('')
  const [hanyaAktif, setHanyaAktif] = useState(true)
  const [galatUbah, setGalatUbah] = useState<string | null>(null)

  const { data, galat, muatUlang } = useDaftarItem({ kata, hanyaAktif })
  const bolehUbah = profil ? bolehKelolaItem(profil.peran) : false

  async function alihkanAktif(kode: string, aktif: boolean) {
    setGalatUbah(null)
    try {
      await ubahAktifItem(kode, aktif)
      await muatUlang()
    } catch (e) {
      setGalatUbah(e instanceof Error ? e.message : 'Gagal mengubah item.')
    }
  }

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Cari nama atau kode item…"
        value={kata}
        onChange={(e) => setKata(e.target.value)}
        aria-label="Cari item"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={hanyaAktif ? 'default' : 'outline'}
          size="sm"
          onClick={() => setHanyaAktif((v) => !v)}
        >
          {hanyaAktif ? 'Hanya aktif' : 'Semua item'}
        </Button>

        {bolehUbah ? (
          <>
            <Button size="sm" variant="outline" asChild>
              <Link to="/master/item/impor">
                <Upload aria-hidden />
                Impor CSV
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/master/item/baru">
                <Plus aria-hidden />
                Tambah
              </Link>
            </Button>
          </>
        ) : null}
      </div>

      {galatUbah ? <StatusGalat pesan={galatUbah} /> : null}

      {galat ? (
        <StatusGalat pesan={galat} onCobaLagi={() => void muatUlang()} />
      ) : data === null ? (
        <StatusMemuat pesan="Memuat item…" />
      ) : data.length === 0 ? (
        <StatusKosong
          ikon={Package}
          judul={kata ? 'Tidak ada item yang cocok' : 'Master item masih kosong'}
          keterangan={
            kata
              ? 'Coba kata kunci lain, atau matikan saringan "Hanya aktif".'
              : 'Isi lewat Impor CSV untuk pengisian awal, atau tambah satu per satu.'
          }
        />
      ) : (
        <ul className="space-y-2">
          {data.map((item) => (
            <li key={item.kode_item}>
              <Card className="gap-0 py-3">
                <CardContent className="space-y-2 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">
                        {item.nama_baku}
                      </p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {item.kode_item}
                      </p>
                    </div>
                    {!item.aktif ? (
                      <Badge variant="secondary">Nonaktif</Badge>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">{item.kategori}</Badge>
                    <Badge variant="outline">{item.satuan_baku}</Badge>
                    {item.sub_kategori ? (
                      <Badge variant="outline">{item.sub_kategori}</Badge>
                    ) : null}
                  </div>

                  {bolehUbah ? (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/master/item/${encodeURIComponent(item.kode_item)}`}>
                          Ubah
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void alihkanAktif(item.kode_item, !item.aktif)
                        }
                      >
                        {item.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {data && data.length > 0 ? (
        <p className="text-muted-foreground text-center text-xs">
          {data.length} item ditampilkan
        </p>
      ) : null}
    </div>
  )
}
