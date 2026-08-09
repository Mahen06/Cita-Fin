import { Search } from 'lucide-react'

import { StatusKosong } from '@/components/StatusKosong'

/**
 * Kerangka layar Cek Harga (F1).
 *
 * Isinya dikerjakan pada Sesi 6: kotak pencarian berfokus otomatis, RPC
 * `cari_item` dengan debounce 250ms, kartu harga per toko urut termurah,
 * dan baris ringkasan dari `v_ringkas_harga`.
 */
export function HalamanCekHarga() {
  return (
    <StatusKosong
      ikon={Search}
      judul="Cek Harga belum tersedia"
      keterangan="Layar ini dikerjakan pada Sesi 6. Master item perlu terisi lebih dulu di Sesi 4."
    />
  )
}
