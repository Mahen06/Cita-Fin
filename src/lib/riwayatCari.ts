/**
 * Riwayat pencarian terakhir, disimpan lokal di HP (F1).
 *
 * Tujuannya memangkas waktu: pertanyaan harga cenderung berulang pada
 * material yang itu-itu juga, dan mengetuk riwayat jauh lebih cepat
 * daripada mengetik ulang di layar sempit.
 *
 * Sengaja memakai localStorage, bukan tabel: ini kebiasaan satu perangkat,
 * bukan data perusahaan, dan tidak perlu ikut ke server.
 */

const KUNCI = 'citafin.riwayat-cari'
const BATAS = 8

export type ItemRiwayat = {
  kode_item: string
  nama_baku: string
  satuan_baku: string
}

export function ambilRiwayat(): ItemRiwayat[] {
  try {
    const mentah = localStorage.getItem(KUNCI)
    if (!mentah) return []

    const isi: unknown = JSON.parse(mentah)
    if (!Array.isArray(isi)) return []

    return isi.filter(
      (x): x is ItemRiwayat =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as ItemRiwayat).kode_item === 'string' &&
        typeof (x as ItemRiwayat).nama_baku === 'string',
    )
  } catch {
    // Penyimpanan lokal bisa penuh atau dimatikan peramban. Riwayat
    // hanyalah kenyamanan — kegagalannya tidak boleh merusak layar.
    return []
  }
}

export function catatRiwayat(item: ItemRiwayat): ItemRiwayat[] {
  const baru = [
    item,
    ...ambilRiwayat().filter((x) => x.kode_item !== item.kode_item),
  ].slice(0, BATAS)

  try {
    localStorage.setItem(KUNCI, JSON.stringify(baru))
  } catch {
    /* diabaikan dengan sengaja */
  }

  return baru
}

export function hapusRiwayat(): void {
  try {
    localStorage.removeItem(KUNCI)
  } catch {
    /* diabaikan dengan sengaja */
  }
}
