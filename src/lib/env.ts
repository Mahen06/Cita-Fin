/**
 * Pembacaan variabel lingkungan.
 *
 * Hanya `anon key` yang boleh ada di sini. `service_role key` tidak pernah
 * masuk ke kode frontend dalam bentuk apa pun — keamanan dijaga oleh RLS.
 *
 * Nilai pengganti sengaja dipakai bila env kosong supaya aplikasi tetap
 * bisa dirender dan menampilkan layar galat yang jelas, bukan layar putih.
 */

const URL_PENGGANTI = 'https://konfigurasi-belum-diisi.invalid'
const KUNCI_PENGGANTI = 'konfigurasi-belum-diisi'

function bersihkan(nilai: string | undefined): string {
  return (nilai ?? '').trim()
}

const urlMentah = bersihkan(import.meta.env.VITE_SUPABASE_URL)
const anonKeyMentah = bersihkan(import.meta.env.VITE_SUPABASE_ANON_KEY)

function periksa(): string[] {
  const masalah: string[] = []

  if (!urlMentah) {
    masalah.push('VITE_SUPABASE_URL belum diisi.')
  } else if (!/^https:\/\/[^\s]+$/.test(urlMentah)) {
    masalah.push('VITE_SUPABASE_URL harus berupa URL https yang lengkap.')
  }

  if (!anonKeyMentah) {
    masalah.push('VITE_SUPABASE_ANON_KEY belum diisi.')
  }

  return masalah
}

/** Daftar masalah konfigurasi. Kosong berarti konfigurasi siap dipakai. */
export const galatEnv: readonly string[] = periksa()

/** Benar bila seluruh variabel lingkungan yang wajib sudah terisi. */
export const envSiap = galatEnv.length === 0

/**
 * Ref proyek Supabase, diambil dari sub-domain URL.
 * Bukan rahasia — ikut terkirim di setiap permintaan ke Supabase.
 * Ditampilkan di layar status supaya ketahuan bila aplikasi ternyata
 * masih menunjuk proyek yang salah setelah variabel lingkungan diganti.
 */
function bacaRef(url: string): string {
  const cocok = /^https:\/\/([^.]+)\./.exec(url)
  return cocok?.[1] ?? '(tidak terbaca)'
}

export const env = {
  supabaseUrl: envSiap ? urlMentah : URL_PENGGANTI,
  supabaseAnonKey: envSiap ? anonKeyMentah : KUNCI_PENGGANTI,
  supabaseRef: envSiap ? bacaRef(urlMentah) : '(belum diatur)',
  mode: import.meta.env.MODE,
  produksi: import.meta.env.PROD,
} as const
