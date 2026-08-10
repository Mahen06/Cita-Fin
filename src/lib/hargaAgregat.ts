/**
 * Perhitungan agregat harga — murni, tanpa menyentuh jaringan.
 *
 * Diletakkan di `lib/` dan bukan di dalam hook supaya bisa diuji berdiri
 * sendiri. Dua fungsi di sini adalah bagian paling mudah salah di seluruh
 * aplikasi: keduanya menentukan angka yang dipakai orang untuk memutuskan
 * belanja di toko mana.
 */

import type { Database } from '@/lib/database.types'

export type BarisRiwayat = Database['public']['Views']['v_riwayat_harga']['Row']

// ─────────────────────────────────────────────────────────────────────
// Periode
// ─────────────────────────────────────────────────────────────────────

export type Periode = '3b' | '6b' | '1t' | 'semua'

export const PERIODE: { nilai: Periode; label: string }[] = [
  { nilai: '3b', label: '3 bulan' },
  { nilai: '6b', label: '6 bulan' },
  { nilai: '1t', label: '1 tahun' },
  { nilai: 'semua', label: 'Semua' },
]

/** Tanggal batas bawah untuk periode terpilih, atau null bila "semua". */
export function batasTanggal(periode: Periode, sekarang = new Date()): string | null {
  if (periode === 'semua') return null

  const d = new Date(sekarang)
  if (periode === '3b') d.setMonth(d.getMonth() - 3)
  if (periode === '6b') d.setMonth(d.getMonth() - 6)
  if (periode === '1t') d.setFullYear(d.getFullYear() - 1)

  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ─────────────────────────────────────────────────────────────────────
// Cek Harga — satu item, banyak toko
// ─────────────────────────────────────────────────────────────────────

export type Tren = 'naik' | 'turun' | 'tetap' | null

export type HargaToko = {
  kode_toko: string
  nama_toko: string
  pkp: boolean
  harga_satuan: number
  satuan_baku: string
  tanggal: string
  nama_proyek: string
  id_nota: string
  no_nota_toko: string | null
  /** Dibanding pembelian sebelumnya di toko yang sama. */
  tren: Tren
  harga_sebelumnya: number | null
  /** Jumlah pembelian item ini di toko tersebut dalam periode terpilih. */
  jml_pembelian: number
}

export type Ringkasan = {
  jml_toko: number
  terendah: number
  tertinggi: number
  rata2: number
  pembelian_terakhir: string
}

export type HasilCekHarga = {
  perToko: HargaToko[]
  ringkasan: Ringkasan | null
}

/**
 * Meringkas riwayat harga mentah menjadi satu kartu per toko.
 *
 * Ringkasan dihitung dari baris yang sama dengan yang ditampilkan, bukan
 * dari `v_ringkas_harga`. View itu tidak mengenal penyaring periode, dan
 * angka terendah/tertinggi dari seluruh riwayat akan bertentangan dengan
 * kartu yang tampak persis di bawahnya saat periode dipersempit.
 */
export function ringkas(baris: BarisRiwayat[]): HasilCekHarga {
  if (baris.length === 0) return { perToko: [], ringkasan: null }

  const perTokoMap = new Map<string, BarisRiwayat[]>()

  for (const b of baris) {
    if (!b.kode_toko) continue
    const daftar = perTokoMap.get(b.kode_toko) ?? []
    daftar.push(b)
    perTokoMap.set(b.kode_toko, daftar)
  }

  const perToko: HargaToko[] = []

  for (const [kode, daftar] of perTokoMap) {
    const urut = [...daftar].sort((a, b) =>
      String(b.tanggal).localeCompare(String(a.tanggal)),
    )

    const terbaru = urut[0]
    const sebelumnya = urut[1] ?? null

    const harga = Number(terbaru.harga_satuan ?? 0)
    const hargaLama = sebelumnya ? Number(sebelumnya.harga_satuan ?? 0) : null

    let tren: Tren = null
    if (hargaLama !== null && hargaLama > 0) {
      if (harga > hargaLama) tren = 'naik'
      else if (harga < hargaLama) tren = 'turun'
      else tren = 'tetap'
    }

    perToko.push({
      kode_toko: kode,
      nama_toko: terbaru.nama_toko ?? kode,
      pkp: Boolean(terbaru.pkp),
      harga_satuan: harga,
      satuan_baku: terbaru.satuan_baku ?? '',
      tanggal: String(terbaru.tanggal ?? ''),
      nama_proyek: terbaru.nama_proyek ?? '—',
      id_nota: String(terbaru.id_nota ?? ''),
      no_nota_toko: terbaru.no_nota_toko,
      tren,
      harga_sebelumnya: hargaLama,
      jml_pembelian: urut.length,
    })
  }

  // Urut termurah lebih dulu — inti dari layar Cek Harga.
  perToko.sort((a, b) => a.harga_satuan - b.harga_satuan)

  const semuaHarga = perToko.map((t) => t.harga_satuan)
  const tanggalTerakhir = perToko
    .map((t) => t.tanggal)
    .sort((a, b) => b.localeCompare(a))[0]

  return {
    perToko,
    ringkasan: {
      jml_toko: perToko.length,
      terendah: Math.min(...semuaHarga),
      tertinggi: Math.max(...semuaHarga),
      rata2: Math.round(
        semuaHarga.reduce((a, b) => a + b, 0) / semuaHarga.length,
      ),
      pembelian_terakhir: tanggalTerakhir,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────
// Banding Toko — banyak item, beberapa toko
// ─────────────────────────────────────────────────────────────────────

export type SelToko = {
  kode_toko: string
  harga_satuan: number
  tanggal: string
  id_nota: string
  /** Selisih rupiah terhadap harga termurah di baris ini. */
  selisih: number
  /** Selisih persen terhadap harga termurah di baris ini. */
  selisihPersen: number
  termurah: boolean
}

export type BarisBanding = {
  kode_item: string
  nama_baku: string
  satuan_baku: string
  /** Kunci: kode_toko. Selalu berisi seluruh toko terpilih. */
  perToko: Map<string, SelToko>
  hargaTermurah: number
  hargaTertinggi: number
  /** Rentang harga antar toko, dalam persen terhadap yang termurah. */
  rentangPersen: number
}

export type HasilBanding = {
  baris: BarisBanding[]
  /** Item yang hanya ada di sebagian toko, jadi tidak bisa dibandingkan. */
  jmlTidakBeririsan: number
}

/**
 * Menyusun perbandingan harga antar toko.
 *
 * Hanya item yang ada di SELURUH toko terpilih yang masuk. Item yang cuma
 * dibeli di satu toko bukan bahan perbandingan, dan menampilkannya hanya
 * membuat daftar penuh baris yang tidak menjawab apa pun.
 *
 * Tidak bergantung pada urutan masukan. Kueri memang mengurutkan tanggal
 * menurun, tetapi menggantungkan pilihan "harga terbaru" pada urutan itu
 * berarti mengubah `order()` di kemudian hari akan diam-diam menampilkan
 * harga lama — salah tanpa satu pun galat.
 */
export function susunBanding(
  baris: BarisRiwayat[],
  kodeToko: string[],
): HasilBanding {
  const perItem = new Map<string, Map<string, BarisRiwayat>>()

  for (const b of baris) {
    if (!b.kode_item || !b.kode_toko) continue

    const perToko = perItem.get(b.kode_item) ?? new Map<string, BarisRiwayat>()
    const ada = perToko.get(b.kode_toko)

    if (!ada || String(b.tanggal ?? '') > String(ada.tanggal ?? '')) {
      perToko.set(b.kode_toko, b)
    }

    perItem.set(b.kode_item, perToko)
  }

  const hasil: BarisBanding[] = []
  let tidakBeririsan = 0

  for (const [kodeItem, perToko] of perItem) {
    if (!kodeToko.every((k) => perToko.has(k))) {
      tidakBeririsan++
      continue
    }

    const contoh = perToko.get(kodeToko[0])!
    const harga = kodeToko.map((k) => Number(perToko.get(k)!.harga_satuan ?? 0))
    const termurah = Math.min(...harga)
    const tertinggi = Math.max(...harga)

    const sel = new Map<string, SelToko>()

    for (const k of kodeToko) {
      const b = perToko.get(k)!
      const h = Number(b.harga_satuan ?? 0)

      sel.set(k, {
        kode_toko: k,
        harga_satuan: h,
        tanggal: String(b.tanggal ?? ''),
        id_nota: String(b.id_nota ?? ''),
        selisih: h - termurah,
        selisihPersen: termurah > 0 ? ((h - termurah) / termurah) * 100 : 0,
        termurah: h === termurah,
      })
    }

    hasil.push({
      kode_item: kodeItem,
      nama_baku: contoh.nama_baku ?? kodeItem,
      satuan_baku: contoh.satuan_baku ?? '',
      perToko: sel,
      hargaTermurah: termurah,
      hargaTertinggi: tertinggi,
      rentangPersen:
        termurah > 0 ? ((tertinggi - termurah) / termurah) * 100 : 0,
    })
  }

  // Selisih terbesar lebih dulu — di situlah uang paling banyak bisa dihemat.
  hasil.sort((a, b) => b.rentangPersen - a.rentangPersen)

  return { baris: hasil, jmlTidakBeririsan: tidakBeririsan }
}
