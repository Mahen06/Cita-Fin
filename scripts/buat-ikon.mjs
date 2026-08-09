/**
 * Membuat ikon PWA dari `public/favicon.svg`.
 *
 * Dijalankan otomatis lewat npm script `prebuild`, jadi ikon di layar HP
 * tidak pernah tertinggal versi lama saat lambangnya diubah.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const sumber = readFileSync('public/favicon.svg')

/*
  Varian maskable: lambang diperkecil ke dalam zona aman 80% agar tidak
  terpotong saat Android memangkas ikon menjadi lingkaran.
*/
const maskable = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0f766e"/>
  <g transform="translate(102.4 102.4) scale(0.6)">
    <path d="M186 150h150v46h-104v58h94v46h-94v112h-46z" fill="#ffffff"/>
    <rect x="352" y="150" width="34" height="262" rx="17" fill="#5eead4"/>
  </g>
</svg>`)

const daftar = [
  ['public/icon-192.png', sumber, 192],
  ['public/icon-512.png', sumber, 512],
  ['public/apple-touch-icon.png', sumber, 180],
  ['public/icon-maskable-512.png', maskable, 512],
]

for (const [keluaran, svg, ukuran] of daftar) {
  const isi = await sharp(svg, { density: 512 })
    .resize(ukuran, ukuran)
    .png()
    .toBuffer()

  writeFileSync(keluaran, isi)
  console.log(`${keluaran} — ${ukuran}px, ${isi.length} bita`)
}
