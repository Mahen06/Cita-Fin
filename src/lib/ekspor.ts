import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import { formatRupiah, formatTanggal, formatTanggalPendek } from '@/lib/format'
import type { Laporan } from '@/lib/laporan'

export type Judul = {
  namaProyek: string
  dari: string
  sampai: string
  kategori: string
}

/**
 * Menyusun PDF laporan pengeluaran.
 *
 * Dikelompokkan per nota, bukan per item: laporan Excel lama berbentuk
 * begitu dan penerimanya mengenali bentuk itu (F4).
 */
export function buatPdf(laporan: Laporan, judul: Judul): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const lebar = doc.internal.pageSize.getWidth()

  doc.setFontSize(14)
  doc.text('LAPORAN PENGELUARAN PROYEK', lebar / 2, 40, { align: 'center' })

  doc.setFontSize(10)
  doc.text(judul.namaProyek, lebar / 2, 58, { align: 'center' })
  doc.text(
    `${formatTanggal(judul.dari)} — ${formatTanggal(judul.sampai)}`,
    lebar / 2,
    72,
    { align: 'center' },
  )
  if (judul.kategori) {
    doc.text(`Kategori: ${judul.kategori}`, lebar / 2, 86, { align: 'center' })
  }

  // Ringkasan per kategori
  autoTable(doc, {
    startY: judul.kategori ? 100 : 88,
    head: [['Kategori', 'Jumlah']],
    body: laporan.perKategori.map((k) => [k.kategori, formatRupiah(k.total)]),
    foot: [['TOTAL', formatRupiah(laporan.total)]],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [15, 118, 110] },
    footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 40, right: 40 },
  })

  // Rincian per nota
  const badan: (string | number)[][] = []

  for (const nota of laporan.nota) {
    badan.push([
      {
        content: `${formatTanggalPendek(nota.tanggal)}  ·  ${nota.nama_toko}${
          nota.pkp ? ' (PKP)' : ''
        }${nota.no_nota_toko ? `  ·  No. ${nota.no_nota_toko}` : ''}  ·  ${nota.metode_bayar}`,
        colSpan: 5,
        styles: { fontStyle: 'bold', fillColor: [245, 245, 245] },
      } as unknown as string,
    ])

    for (const b of nota.baris) {
      badan.push([
        b.nama_baku,
        `${b.qty} ${b.satuan_baku}`,
        formatRupiah(b.harga_satuan),
        b.kategori,
        formatRupiah(b.subtotal),
      ])
    }

    badan.push([
      {
        content: nota.tersaring ? 'Jumlah baris tersaring' : 'Total nota',
        colSpan: 4,
        styles: { halign: 'right', fontStyle: 'bold' },
      } as unknown as string,
      {
        content: formatRupiah(nota.jumlah),
        styles: { halign: 'right', fontStyle: 'bold' },
      } as unknown as string,
    ])
  }

  // `lastAutoTable` disisipkan jspdf-autotable ke objek dokumen saat
  // berjalan, jadi harus dibaca lewat penegasan tipe.
  const akhirTabelPertama = (
    doc as unknown as { lastAutoTable: { finalY: number } }
  ).lastAutoTable.finalY

  autoTable(doc, {
    startY: akhirTabelPertama + 20,
    head: [['Item', 'Qty', 'Harga Satuan', 'Kategori', 'Subtotal']],
    body: badan,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 118, 110] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      4: { halign: 'right' },
    },
    margin: { left: 40, right: 40 },
  })

  const jmlHalaman = doc.getNumberOfPages()
  for (let i = 1; i <= jmlHalaman; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Halaman ${i} dari ${jmlHalaman}  ·  ${laporan.jmlNota} nota  ·  dicetak ${formatTanggal(new Date())}`,
      lebar / 2,
      doc.internal.pageSize.getHeight() - 24,
      { align: 'center' },
    )
  }

  return doc.output('blob')
}

/** CSV rata, satu baris per item — untuk dibuka kembali di Excel. */
export function buatCsv(laporan: Laporan): Blob {
  const kolom = [
    'tanggal',
    'toko',
    'pkp',
    'no_nota',
    'metode_bayar',
    'kode_item',
    'nama_item',
    'kategori',
    'qty',
    'satuan',
    'harga_satuan',
    'subtotal',
  ]

  const baris = laporan.nota.flatMap((nota) =>
    nota.baris.map((b) => [
      nota.tanggal,
      nota.nama_toko,
      nota.pkp ? 'YA' : 'TIDAK',
      nota.no_nota_toko ?? '',
      nota.metode_bayar,
      b.kode_item,
      b.nama_baku,
      b.kategori,
      String(b.qty),
      b.satuan_baku,
      String(b.harga_satuan),
      String(b.subtotal),
    ]),
  )

  const isi = [kolom, ...baris]
    .map((r) => r.map(kutip).join(','))
    .join('\r\n')

  // BOM supaya Excel membaca huruf beraksen dengan benar.
  return new Blob(['﻿' + isi], { type: 'text/csv;charset=utf-8' })
}

function kutip(nilai: string): string {
  return /[",\r\n]/.test(nilai) ? `"${nilai.replace(/"/g, '""')}"` : nilai
}

/**
 * Membagikan berkas lewat lembar berbagi bawaan HP bila tersedia,
 * kalau tidak jatuh ke unduhan biasa.
 *
 * Berbagi langsung ke WhatsApp adalah cara laporan ini benar-benar
 * dikirim di lapangan (F4) — mengunduh lalu mencarinya di berkas
 * adalah tiga langkah tambahan yang mudah gagal.
 */
export async function bagikanAtauUnduh(
  blob: Blob,
  namaBerkas: string,
  judul: string,
): Promise<'dibagikan' | 'diunduh'> {
  const berkas = new File([blob], namaBerkas, { type: blob.type })

  if (
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [berkas] })
  ) {
    try {
      await navigator.share({ files: [berkas], title: judul })
      return 'dibagikan'
    } catch (e) {
      // Pengguna membatalkan lembar berbagi — bukan galat, dan tidak
      // boleh berubah jadi unduhan yang tidak diminta.
      if (e instanceof DOMException && e.name === 'AbortError') {
        return 'dibagikan'
      }
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = namaBerkas
  a.click()
  URL.revokeObjectURL(url)

  return 'diunduh'
}
