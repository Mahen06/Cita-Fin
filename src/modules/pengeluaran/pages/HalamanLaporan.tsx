import { FileText } from 'lucide-react'

import { StatusKosong } from '@/components/StatusKosong'

/**
 * Kerangka layar Laporan Pengeluaran per Proyek (F4).
 *
 * Isinya dikerjakan pada Sesi 8: penyaring proyek dan rentang tanggal,
 * pengelompokan ulang per nota agar tampilan cetak sama dengan laporan
 * Excel lama, serta ekspor PDF dan CSV. Hanya nota final (aturan B9).
 */
export function HalamanLaporan() {
  return (
    <StatusKosong
      ikon={FileText}
      judul="Laporan belum tersedia"
      keterangan="Layar ini dikerjakan pada Sesi 8, setelah ada nota sungguhan yang bisa dilaporkan."
    />
  )
}
