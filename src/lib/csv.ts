/**
 * Pembaca CSV kecil untuk impor master data.
 *
 * Ditulis sendiri, tanpa pustaka luar: berkas yang dibaca hanya CSV
 * ekspor Excel milik sendiri, dan menambah dependensi berarti menambah
 * ukuran bundel yang harus diunduh HP di jaringan seluler.
 *
 * Menangani hal-hal yang benar-benar muncul pada ekspor Excel:
 * tanda kutip ganda, koma di dalam kutip, kutip berlipat (""), akhir
 * baris CRLF, dan BOM di awal berkas.
 */

/** Memecah teks CSV menjadi larik baris berisi larik sel. */
export function uraikanCsv(teks: string): string[][] {
  // Excel menaruh BOM di depan berkas UTF-8; kalau dibiarkan ia menempel
  // pada nama kolom pertama dan pemetaan tajuk gagal tanpa penjelasan.
  const isi = teks.replace(/^﻿/, '')

  const baris: string[][] = []
  let sel: string[] = []
  let nilai = ''
  let dalamKutip = false

  for (let i = 0; i < isi.length; i++) {
    const c = isi[i]

    if (dalamKutip) {
      if (c === '"') {
        if (isi[i + 1] === '"') {
          nilai += '"'
          i++
        } else {
          dalamKutip = false
        }
      } else {
        nilai += c
      }
      continue
    }

    if (c === '"') {
      dalamKutip = true
    } else if (c === ',') {
      sel.push(nilai)
      nilai = ''
    } else if (c === '\n' || c === '\r') {
      // CRLF dihitung satu akhir baris, bukan dua.
      if (c === '\r' && isi[i + 1] === '\n') i++
      sel.push(nilai)
      baris.push(sel)
      sel = []
      nilai = ''
    } else {
      nilai += c
    }
  }

  // Baris terakhir tanpa akhir baris tetap ikut terbaca.
  if (nilai !== '' || sel.length > 0) {
    sel.push(nilai)
    baris.push(sel)
  }

  return baris.filter((b) => b.some((s) => s.trim() !== ''))
}

export type HasilBaca = {
  tajuk: string[]
  baris: Record<string, string>[]
}

/**
 * Membaca CSV bertajuk menjadi larik objek.
 * Nama kolom dinormalkan: dipangkas dan dijadikan huruf kecil.
 */
export function bacaCsvBertajuk(teks: string): HasilBaca {
  const mentah = uraikanCsv(teks)

  if (mentah.length === 0) {
    return { tajuk: [], baris: [] }
  }

  const tajuk = mentah[0].map((h) => h.trim().toLowerCase())

  const baris = mentah.slice(1).map((sel) => {
    const objek: Record<string, string> = {}
    tajuk.forEach((nama, i) => {
      objek[nama] = (sel[i] ?? '').trim()
    })
    return objek
  })

  return { tajuk, baris }
}

/** Membaca berkas yang dipilih pengguna sebagai teks UTF-8. */
export function bacaBerkas(berkas: File): Promise<string> {
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader()
    pembaca.onload = () => selesai(String(pembaca.result ?? ''))
    pembaca.onerror = () => gagal(new Error('Berkas tidak bisa dibaca.'))
    pembaca.readAsText(berkas, 'utf-8')
  })
}
