import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/database.types'
import { env } from '@/lib/env'

/**
 * Klien Supabase tunggal untuk seluruh aplikasi.
 *
 * Sesi sengaja dibuat bertahan lama dan diperbarui otomatis (F6): tim finance
 * memakai aplikasi ini dari HP, memaksa login ulang tiap hari akan membuat
 * mereka kembali ke Excel.
 */
export const supabase = createClient<Database>(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'citafin.auth',
    },
    global: {
      headers: { 'x-client-info': 'citafin-web' },
    },
  },
)

/** Hasil pemeriksaan sambungan ke Supabase. */
export type HasilPeriksaSambungan =
  | { status: 'terhubung'; lamaMs: number }
  | { status: 'gagal'; pesan: string; lamaMs: number }

/**
 * Memastikan endpoint Supabase benar-benar bisa dihubungi dari perangkat ini.
 *
 * Dipakai layar status Sesi 1. Sengaja memanggil endpoint kesehatan lewat
 * jaringan, bukan `auth.getSession()` — yang terakhir hanya membaca
 * penyimpanan lokal dan akan melaporkan "terhubung" meski HP sedang luring.
 *
 * Belum ada tabel yang bisa diperiksa: skema baru dijalankan pada Sesi 2.
 */
export async function periksaSambungan(): Promise<HasilPeriksaSambungan> {
  const mulai = performance.now()
  const lama = () => Math.round(performance.now() - mulai)

  if (!navigator.onLine) {
    return {
      status: 'gagal',
      pesan: 'HP sedang tidak terhubung ke internet.',
      lamaMs: lama(),
    }
  }

  try {
    const tanggapan = await fetch(`${env.supabaseUrl}/auth/v1/health`, {
      headers: { apikey: env.supabaseAnonKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })

    if (!tanggapan.ok) {
      return {
        status: 'gagal',
        pesan: `Supabase membalas dengan kode ${tanggapan.status}. Periksa URL dan anon key.`,
        lamaMs: lama(),
      }
    }

    return { status: 'terhubung', lamaMs: lama() }
  } catch (galat) {
    const habisWaktu = galat instanceof Error && galat.name === 'TimeoutError'

    return {
      status: 'gagal',
      pesan: habisWaktu
        ? 'Supabase tidak membalas dalam 10 detik. Sinyal mungkin terlalu lemah.'
        : 'Supabase tidak dapat dihubungi dari perangkat ini.',
      lamaMs: lama(),
    }
  }
}
