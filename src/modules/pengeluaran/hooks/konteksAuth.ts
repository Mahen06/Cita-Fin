import type { Session } from '@supabase/supabase-js'
import { createContext, use } from 'react'

import type { Profil } from '@/lib/auth'

export type KeadaanAuth = {
  /** Benar selama sesi dan profil belum selesai dibaca. */
  memuat: boolean
  sesi: Session | null
  profil: Profil | null
  /** Terisi bila profil gagal dibaca — bukan bila pengguna belum login. */
  galat: string | null
  keluar: () => Promise<void>
  muatUlangProfil: () => Promise<void>
}

export const KonteksAuth = createContext<KeadaanAuth | null>(null)

export function useAuth(): KeadaanAuth {
  const konteks = use(KonteksAuth)

  if (!konteks) {
    throw new Error('useAuth harus dipakai di dalam <PenyediaAuth>')
  }

  return konteks
}
