import type { Session } from '@supabase/supabase-js'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { ambilProfil, keluar as keluarAuth, type Profil } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import {
  KonteksAuth,
  type KeadaanAuth,
} from '@/modules/pengeluaran/hooks/konteksAuth'

export function PenyediaAuth({ children }: { children: ReactNode }) {
  const [memuat, setMemuat] = useState(true)
  const [sesi, setSesi] = useState<Session | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  const bacaProfil = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfil(null)
      setGalat(null)
      return
    }

    try {
      setProfil(await ambilProfil(s))
      setGalat(null)
    } catch {
      setProfil(null)
      setGalat('Profil pengguna tidak bisa dibaca dari server.')
    }
  }, [])

  useEffect(() => {
    let hidup = true

    /*
      onAuthStateChange langsung memancarkan sesi yang tersimpan di
      penyimpanan lokal saat pertama dipasang, jadi tidak perlu memanggil
      getSession() terpisah — pemanggilan ganda membuat layar berkedip.
    */
    const { data } = supabase.auth.onAuthStateChange((_peristiwa, sesiBaru) => {
      if (!hidup) return

      setSesi(sesiBaru)
      void bacaProfil(sesiBaru).finally(() => {
        if (hidup) setMemuat(false)
      })
    })

    return () => {
      hidup = false
      data.subscription.unsubscribe()
    }
  }, [bacaProfil])

  const nilai = useMemo<KeadaanAuth>(
    () => ({
      memuat,
      sesi,
      profil,
      galat,
      keluar: async () => {
        await keluarAuth()
      },
      muatUlangProfil: () => bacaProfil(sesi),
    }),
    [memuat, sesi, profil, galat, bacaProfil],
  )

  return <KonteksAuth value={nilai}>{children}</KonteksAuth>
}
