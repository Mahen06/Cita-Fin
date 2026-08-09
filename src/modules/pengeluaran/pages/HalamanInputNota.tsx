import { PlusCircle } from 'lucide-react'

import { StatusKosong } from '@/components/StatusKosong'

/**
 * Kerangka layar Input Nota (F2).
 *
 * Isinya dikerjakan pada Sesi 5: header nota, baris item dinamis dengan
 * harga terisi dari `v_harga_terakhir`, indikator selisih real-time
 * (aturan B4), dan penyimpanan atomik lewat RPC `simpan_nota`.
 */
export function HalamanInputNota() {
  return (
    <StatusKosong
      ikon={PlusCircle}
      judul="Input Nota belum tersedia"
      keterangan="Layar ini dikerjakan pada Sesi 5, setelah master proyek, toko, dan item terisi di Sesi 4."
    />
  )
}
