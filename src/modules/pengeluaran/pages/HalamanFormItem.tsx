import { AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import {
  cariItemMirip,
  KATEGORI,
  simpanItem,
  type Item,
  type ItemMirip,
  type Kategori,
} from '@/modules/pengeluaran/hooks/useMasterItem'

type Isian = {
  kode_item: string
  nama_baku: string
  kategori: Kategori
  sub_kategori: string
  satuan_baku: string
  spesifikasi: string
  aktif: boolean
}

const KOSONG: Isian = {
  kode_item: '',
  nama_baku: '',
  kategori: 'MATERIAL',
  sub_kategori: '',
  satuan_baku: '',
  spesifikasi: '',
  aktif: true,
}

export function HalamanFormItem() {
  const { kode } = useParams()
  const navigasi = useNavigate()
  const mengubah = Boolean(kode)

  const [isian, setIsian] = useState<Isian>(KOSONG)
  const [memuat, setMemuat] = useState(mengubah)
  const [mengirim, setMengirim] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)

  const [mirip, setMirip] = useState<ItemMirip[]>([])
  const [sadarDuplikat, setSadarDuplikat] = useState(false)

  // Memuat item yang sedang diubah
  useEffect(() => {
    if (!kode) return

    let hidup = true
    setMemuat(true)

    supabase
      .from('master_item')
      .select('*')
      .eq('kode_item', kode)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!hidup) return

        if (error || !data) {
          setGalat(error?.message ?? 'Item tidak ditemukan.')
        } else {
          const d = data as Item
          setIsian({
            kode_item: d.kode_item,
            nama_baku: d.nama_baku,
            kategori: d.kategori,
            sub_kategori: d.sub_kategori ?? '',
            satuan_baku: d.satuan_baku,
            spesifikasi: d.spesifikasi ?? '',
            aktif: d.aktif,
          })
        }
        setMemuat(false)
      })

    return () => {
      hidup = false
    }
  }, [kode])

  /*
    Deteksi duplikat (F5) — hanya saat menambah item baru.
    Saat mengubah item, kemiripan dengan dirinya sendiri bukan masalah.
    Ditunda 400ms supaya tidak memanggil server tiap ketukan huruf.
  */
  useEffect(() => {
    if (mengubah) return

    const nama = isian.nama_baku.trim()
    if (nama.length < 3) {
      setMirip([])
      return
    }

    const jeda = setTimeout(() => {
      cariItemMirip(nama)
        .then(setMirip)
        .catch(() => setMirip([]))
    }, 400)

    return () => clearTimeout(jeda)
  }, [isian.nama_baku, mengubah])

  const adaDuplikat = mirip.length > 0
  const terkunci = adaDuplikat && !sadarDuplikat

  async function kirim(e: FormEvent) {
    e.preventDefault()
    if (mengirim || terkunci) return

    setGalat(null)
    setMengirim(true)

    try {
      await simpanItem({
        kode_item: isian.kode_item.trim(),
        nama_baku: isian.nama_baku.trim(),
        kategori: isian.kategori,
        sub_kategori: isian.sub_kategori.trim() || null,
        satuan_baku: isian.satuan_baku.trim(),
        spesifikasi: isian.spesifikasi.trim() || null,
        aktif: isian.aktif,
      })
      navigasi('/master/item', { replace: true })
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal menyimpan item.')
      setMengirim(false)
    }
  }

  if (memuat) return <StatusMemuat pesan="Memuat item…" />

  const bisaSimpan =
    isian.kode_item.trim() &&
    isian.nama_baku.trim() &&
    isian.satuan_baku.trim() &&
    !mengirim &&
    !terkunci

  return (
    <form onSubmit={kirim} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="kode_item">Kode item</Label>
        <Input
          id="kode_item"
          value={isian.kode_item}
          onChange={(e) => setIsian({ ...isian, kode_item: e.target.value })}
          disabled={mengubah}
          placeholder="MTL-001"
          autoCapitalize="characters"
          required
        />
        {mengubah ? (
          <p className="text-muted-foreground text-xs">
            Kode tidak bisa diubah — nota lama merujuk kode ini.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_baku">Nama baku</Label>
        <Input
          id="nama_baku"
          value={isian.nama_baku}
          onChange={(e) => {
            setIsian({ ...isian, nama_baku: e.target.value })
            setSadarDuplikat(false)
          }}
          placeholder="Semen PCC Tiga Roda 50kg"
          required
        />
        <p className="text-muted-foreground text-xs text-balance">
          Format: Jenis + Merek + Spesifikasi + Ukuran. Nama yang seragam
          adalah syarat harga bisa dibandingkan antar toko.
        </p>
      </div>

      {adaDuplikat ? (
        <div className="border-warning/40 bg-warning/10 space-y-3 rounded-xl border px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="text-warning mt-0.5 size-5 shrink-0"
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium">Ada item mirip yang sudah ada</p>
              <p className="text-muted-foreground text-sm text-balance">
                Menambahkan kembarannya membuat harga terpecah dua dan tidak
                bisa dibandingkan. Pastikan ini benar-benar barang berbeda.
              </p>
            </div>
          </div>

          <ul className="space-y-2">
            {mirip.map((m) => (
              <li key={m.kode_item} className="text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words">{m.nama_baku}</p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {m.kode_item} · {m.satuan_baku}
                      {m.aktif ? '' : ' · nonaktif'}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {Math.round(m.skor * 100)}% mirip
                  </Badge>
                </div>
              </li>
            ))}
          </ul>

          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-5 shrink-0"
              checked={sadarDuplikat}
              onChange={(e) => setSadarDuplikat(e.target.checked)}
            />
            <span className="text-balance">
              Saya sudah memeriksa, ini barang yang berbeda.
            </span>
          </label>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="kategori">Kategori</Label>
        <Select
          id="kategori"
          value={isian.kategori}
          onChange={(e) =>
            setIsian({ ...isian, kategori: e.target.value as Kategori })
          }
        >
          {KATEGORI.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Select>
        <p className="text-muted-foreground text-xs text-balance">
          MATERIAL dan ALAT wajib diinput per item di nota. OPERASIONAL dan
          LAIN-LAIN boleh borongan satu baris.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="satuan_baku">Satuan baku</Label>
        <Input
          id="satuan_baku"
          value={isian.satuan_baku}
          onChange={(e) => setIsian({ ...isian, satuan_baku: e.target.value })}
          placeholder="sak"
          required
        />
        <p className="text-muted-foreground text-xs">
          Satuan ini terkunci saat input nota dan tidak bisa diubah di sana.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sub_kategori">Sub kategori</Label>
        <Input
          id="sub_kategori"
          value={isian.sub_kategori}
          onChange={(e) => setIsian({ ...isian, sub_kategori: e.target.value })}
          placeholder="Semen"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="spesifikasi">Spesifikasi</Label>
        <Input
          id="spesifikasi"
          value={isian.spesifikasi}
          onChange={(e) => setIsian({ ...isian, spesifikasi: e.target.value })}
          placeholder="PCC 50kg"
        />
      </div>

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-5 shrink-0"
          checked={isian.aktif}
          onChange={(e) => setIsian({ ...isian, aktif: e.target.checked })}
        />
        Item aktif
      </label>

      {galat ? <StatusGalat pesan={galat} /> : null}

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => navigasi(-1)}
        >
          Batal
        </Button>
        <Button type="submit" className="flex-1" disabled={!bisaSimpan}>
          {mengirim ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Menyimpan…
            </>
          ) : (
            'Simpan'
          )}
        </Button>
      </div>
    </form>
  )
}
