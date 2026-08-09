/**
 * Pemformatan angka dan tanggal untuk seluruh modul.
 *
 * Diletakkan di `lib/` karena modul logistik akan memakai fungsi yang sama
 * setelah penggabungan di Tahap 3 — jangan menyalinnya ke dalam komponen.
 */

const LOKAL = 'id-ID'

const rupiah = new Intl.NumberFormat(LOKAL, {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const angka = new Intl.NumberFormat(LOKAL, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const tanggalPanjang = new Intl.DateTimeFormat(LOKAL, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const tanggalPendek = new Intl.DateTimeFormat(LOKAL, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** `1250000` → `Rp 1.250.000`. Nilai kosong menjadi tanda hubung. */
export function formatRupiah(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined || Number.isNaN(nilai)) return '—'
  return rupiah.format(nilai).replace(/ /g, ' ')
}

/** `1250.5` → `1.250,5`. Dipakai untuk kuantitas, bukan uang. */
export function formatAngka(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined || Number.isNaN(nilai)) return '—'
  return angka.format(nilai)
}

/** `2026-08-09` → `9 Agustus 2026`. */
export function formatTanggal(nilai: string | Date | null | undefined): string {
  const d = keDate(nilai)
  return d ? tanggalPanjang.format(d) : '—'
}

/** `2026-08-09` → `09/08/2026`. Dipakai di kartu yang sempit. */
export function formatTanggalPendek(
  nilai: string | Date | null | undefined,
): string {
  const d = keDate(nilai)
  return d ? tanggalPendek.format(d) : '—'
}

/**
 * Membaca angka yang diketik pengguna dengan gaya Indonesia.
 * `"1.250.000"` dan `"1250000"` sama-sama menjadi `1250000`.
 * Mengembalikan `null` bila tidak bisa dibaca sebagai angka.
 */
export function bacaAngka(masukan: string): number | null {
  const bersih = masukan.trim().replace(/\s/g, '').replace(/\./g, '')
  if (!bersih) return null

  const hasil = Number(bersih.replace(',', '.'))
  return Number.isFinite(hasil) ? hasil : null
}

function keDate(nilai: string | Date | null | undefined): Date | null {
  if (!nilai) return null
  const d = nilai instanceof Date ? nilai : new Date(nilai)
  return Number.isNaN(d.getTime()) ? null : d
}
