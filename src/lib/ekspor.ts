import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import { formatTanggal } from './format.ts'
import { NAMA_PERUSAHAAN, type Laporan, type ProyekLaporan } from './laporan.ts'

export type Judul = {
  dari: string
  sampai: string
  kategori: string
  /** Tampilkan kolom Toko/Vendor di antara Keterangan dan Harga. */
  denganToko: boolean
}

const HIJAU: [number, number, number] = [15, 118, 110]
const ABU: [number, number, number] = [240, 240, 240]

/** `1250000` → `1,250,000`. Mengikuti gaya angka pada laporan lama. */
function angkaLaporan(nilai: number): string {
  const bulat = Math.round(nilai)
  const tanda = bulat < 0 ? '-' : ''
  return (
    tanda +
    Math.abs(bulat)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  )
}

/**
 * Menyusun PDF laporan pengeluaran.
 *
 * Bentuknya mengikuti laporan Excel lama: satu blok per proyek, dua blok
 * berdampingan dalam satu baris, satu baris tabel per nota, dan total di
 * kaki tiap blok. Penerima laporan mengenali bentuk ini — itulah kriteria
 * terima F4, bukan kelengkapan datanya.
 *
 * Rincian per item tetap ada di database dan di layar; laporan ini
 * meringkasnya, tidak menggantikannya.
 */
export function buatPdf(laporan: Laporan, judul: Judul): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const lebarHalaman = doc.internal.pageSize.getWidth()
  const tinggiHalaman = doc.internal.pageSize.getHeight()

  const tepi = 28
  const jarak = 14
  const lebarBlok = (lebarHalaman - tepi * 2 - jarak) / 2

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(
    `${NAMA_PERUSAHAAN} ${labelPeriode(judul.dari, judul.sampai)}`,
    tepi,
    36,
  )

  if (judul.kategori) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Kategori: ${judul.kategori}`, tepi, 50)
  }

  let y = judul.kategori ? 62 : 50

  // Rekap seluruh proyek — permintaan "bisa langsung direkap semuanya".
  if (laporan.perProyek.length > 1) {
    autoTable(doc, {
      startY: y,
      head: [['Rekap Proyek', 'Total']],
      body: laporan.perProyek.map((p) => [
        p.nama_proyek,
        angkaLaporan(p.total),
      ]),
      foot: [['TOTAL SELURUH PROYEK', angkaLaporan(laporan.total)]],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, lineColor: [180, 180, 180] },
      headStyles: { fillColor: HIJAU, fontSize: 8 },
      footStyles: { fillColor: ABU, textColor: 20, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right', cellWidth: 90 } },
      margin: { left: tepi, right: tepi },
    })

    y = akhirTabel(doc) + 18
  }

  // Blok proyek, dua per baris.
  for (let i = 0; i < laporan.perProyek.length; i += 2) {
    const kiri = laporan.perProyek[i]
    const kanan = laporan.perProyek[i + 1]

    // Pindah halaman bila sisa ruang tidak cukup untuk kepala blok.
    if (y > tinggiHalaman - 120) {
      doc.addPage()
      y = 40
    }

    const yKiri = gambarBlok(doc, kiri, y, tepi, lebarBlok, judul.denganToko)
    const yKanan = kanan
      ? gambarBlok(
          doc,
          kanan,
          y,
          tepi + lebarBlok + jarak,
          lebarBlok,
          judul.denganToko,
        )
      : y

    y = Math.max(yKiri, yKanan) + 18
  }

  const jml = doc.getNumberOfPages()
  for (let i = 1; i <= jml; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(
      `Halaman ${i} dari ${jml}  ·  ${laporan.jmlNota} nota  ·  dicetak ${formatTanggal(new Date())}`,
      lebarHalaman / 2,
      tinggiHalaman - 18,
      { align: 'center' },
    )
  }

  return doc.output('blob')
}

/** Menggambar satu blok proyek, mengembalikan posisi Y setelah blok. */
function gambarBlok(
  doc: jsPDF,
  proyek: ProyekLaporan,
  y: number,
  x: number,
  lebar: number,
  denganToko: boolean,
): number {
  const kepala = denganToko
    ? ['No', 'Keterangan', 'Toko', 'Harga']
    : ['No', 'Keterangan', 'Harga']

  const isi = proyek.nota.map((n, i) =>
    denganToko
      ? [String(i + 1), n.uraian, n.nama_toko, angkaLaporan(n.jumlah)]
      : [String(i + 1), n.uraian, angkaLaporan(n.jumlah)],
  )

  const kolomHarga = denganToko ? 3 : 2

  autoTable(doc, {
    startY: y,
    // Nama proyek jadi kepala blok, seperti pada laporan lama.
    head: [
      [
        {
          content: proyek.nama_proyek,
          colSpan: kepala.length,
          styles: {
            halign: 'center',
            fillColor: ABU,
            textColor: 20,
            fontStyle: 'bold',
          },
        },
      ],
      kepala,
    ] as never,
    body: isi,
    foot: [
      [
        {
          content: 'Total',
          colSpan: kepala.length - 1,
          styles: { halign: 'center', fontStyle: 'bold' },
        },
        {
          content: angkaLaporan(proyek.total),
          styles: { halign: 'right', fontStyle: 'bold' },
        },
      ],
    ] as never,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 3,
      lineColor: [150, 150, 150],
      lineWidth: 0.4,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: { fillColor: ABU, textColor: 20, fontStyle: 'bold' },
    footStyles: { fillColor: [255, 255, 255], textColor: 20 },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      [kolomHarga]: { cellWidth: 58, halign: 'right' },
      ...(denganToko ? { 2: { cellWidth: 62 } } : {}),
    },
    margin: { left: x },
    tableWidth: lebar,
  })

  return akhirTabel(doc)
}

/** `lastAutoTable` disisipkan jspdf-autotable ke dokumen saat berjalan. */
function akhirTabel(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY
}

function labelPeriode(dari: string, sampai: string): string {
  return dari === sampai
    ? formatTanggal(dari).toUpperCase()
    : `${formatTanggal(dari).toUpperCase()} — ${formatTanggal(sampai).toUpperCase()}`
}

/**
 * CSV rekap: satu baris per nota, mengikuti bentuk laporan cetak.
 * Inilah yang dibuka penerima laporan di Excel.
 */
export function buatCsvRekap(laporan: Laporan): Blob {
  const baris = laporan.perProyek.flatMap((p) => [
    ...p.nota.map((n, i) => [
      p.nama_proyek,
      String(i + 1),
      n.tanggal,
      n.uraian,
      n.nama_toko,
      String(Math.round(n.jumlah)),
    ]),
    [p.nama_proyek, '', '', 'Total', '', String(Math.round(p.total))],
  ])

  return csv(
    ['proyek', 'no', 'tanggal', 'keterangan', 'toko', 'harga'],
    baris,
  )
}

/**
 * CSV rinci: satu baris per item.
 *
 * Sengaja tetap disediakan. Rincian per material inilah yang menghidupkan
 * Cek Harga dan Banding Toko, dan yang membuat pertanyaan harga bisa
 * dijawab — laporan rekap tidak menggantikannya.
 */
export function buatCsvRinci(laporan: Laporan): Blob {
  const baris = laporan.nota.flatMap((nota) =>
    nota.baris.map((b) => [
      nota.nama_proyek,
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

  return csv(
    [
      'proyek',
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
    ],
    baris,
  )
}

function csv(kolom: string[], baris: string[][]): Blob {
  const isi = [kolom, ...baris].map((r) => r.map(kutip).join(',')).join('\r\n')
  // BOM supaya Excel membaca huruf beraksen dengan benar.
  return new Blob(['﻿' + isi], { type: 'text/csv;charset=utf-8' })
}

function kutip(nilai: string): string {
  return /[",\r\n]/.test(nilai) ? `"${nilai.replace(/"/g, '""')}"` : nilai
}

/**
 * Membagikan berkas lewat lembar berbagi bawaan HP bila tersedia,
 * kalau tidak jatuh ke unduhan biasa.
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
