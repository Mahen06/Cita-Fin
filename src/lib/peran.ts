import type { Database } from '@/lib/database.types'

export type Peran = Database['public']['Enums']['peran_enum']

/**
 * Matriks hak akses, disalin dari `docs/SPEK-FITUR.md` Bagian 1.
 *
 * Ini satu-satunya sumber kebenaran soal peran di sisi klien. Jangan
 * menuliskan pemeriksaan peran langsung di dalam komponen — kalau matriks
 * ini berubah, yang berubah cukup satu berkas.
 *
 * Perlu diingat: seluruh fungsi di sini hanya mengatur APA YANG TERLIHAT.
 * Penegakan yang sesungguhnya ada di RLS dan di RPC `simpan_nota`.
 * Menyembunyikan menu bukan pengamanan.
 */

export const LABEL_PERAN: Record<Peran, string> = {
  admin: 'Admin',
  finance: 'Finance',
  logistik: 'Logistik',
  engineering: 'Engineering',
  manajer: 'Manajer',
}

/** Semua peran boleh melihat harga — ini alasan aplikasi dibangun. */
export function bolehLihatHarga(_peran: Peran): boolean {
  return true
}

/** Semua peran boleh membaca laporan. */
export function bolehLihatLaporan(_peran: Peran): boolean {
  return true
}

/** Input nota: admin & finance penuh, logistik hanya draft. */
export function bolehInputNota(peran: Peran): boolean {
  return peran === 'admin' || peran === 'finance' || peran === 'logistik'
}

/** Hanya logistik yang dibatasi sampai status draft saja. */
export function hanyaBolehDraft(peran: Peran): boolean {
  return peran === 'logistik'
}

/** Penambahan dan perubahan master item hanya oleh admin (aturan B7). */
export function bolehKelolaItem(peran: Peran): boolean {
  return peran === 'admin'
}

/** Master toko boleh dikelola admin dan finance. */
export function bolehKelolaToko(peran: Peran): boolean {
  return peran === 'admin' || peran === 'finance'
}

/** Riwayat audit harga hanya untuk admin dan manajer (F8). */
export function bolehLihatAudit(peran: Peran): boolean {
  return peran === 'admin' || peran === 'manajer'
}
