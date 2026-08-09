import type { Session } from '@supabase/supabase-js'

import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type Profil = Database['public']['Tables']['profil']['Row']

/**
 * Menerjemahkan pesan galat Supabase Auth ke bahasa Indonesia.
 *
 * Pesan asli berbahasa Inggris dan bernada teknis. Tim finance tidak
 * seharusnya menebak arti "Invalid login credentials" saat sedang
 * terburu-buru di lokasi proyek.
 */
export function pesanGalatAuth(pesan: string): string {
  const p = pesan.toLowerCase()

  if (p.includes('invalid login credentials')) {
    return 'Email atau kata sandi salah.'
  }
  if (p.includes('email not confirmed')) {
    return 'Email ini belum dikonfirmasi. Hubungi admin.'
  }
  if (p.includes('too many requests') || p.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
  }
  if (p.includes('failed to fetch') || p.includes('network')) {
    return 'Tidak ada sambungan. Periksa sinyal HP Anda.'
  }

  return 'Tidak bisa masuk. Coba lagi, atau hubungi admin bila tetap gagal.'
}

export type HasilMasuk = { ok: true } | { ok: false; pesan: string }

export async function masuk(
  email: string,
  sandi: string,
): Promise<HasilMasuk> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: sandi,
  })

  return error ? { ok: false, pesan: pesanGalatAuth(error.message) } : { ok: true }
}

export async function keluar(): Promise<void> {
  await supabase.auth.signOut()
}

/**
 * Mengambil baris profil milik pengguna yang sedang login.
 *
 * Mengembalikan `null` bila barisnya belum ada. Sejak migrasi 0004 hal itu
 * tidak seharusnya terjadi, tetapi akun yang dibuat sebelum trigger itu
 * dipasang bisa saja tertinggal — dan pengguna tanpa profil ditolak seluruh
 * kebijakan RLS, jadi keadaan ini harus terlihat, bukan disembunyikan.
 */
export async function ambilProfil(sesi: Session): Promise<Profil | null> {
  const { data, error } = await supabase
    .from('profil')
    .select('*')
    .eq('id', sesi.user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}
