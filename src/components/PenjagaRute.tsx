import { ShieldOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { StatusGalat } from '@/components/StatusGalat'
import { StatusKosong } from '@/components/StatusKosong'
import { StatusMemuat } from '@/components/StatusMemuat'
import { Button } from '@/components/ui/button'
import type { Peran } from '@/lib/peran'
import { useAuth } from '@/modules/pengeluaran/hooks/konteksAuth'

type Props = {
  children: ReactNode
  /**
   * Bila diisi, peran pengguna harus lolos pemeriksaan ini.
   * Kosong berarti cukup sudah login.
   */
  syarat?: (peran: Peran) => boolean
}

/**
 * Penjaga rute.
 *
 * Ini lapisan kenyamanan, bukan lapisan keamanan: yang sesungguhnya
 * menahan adalah RLS di database. Penjaga ini hanya mencegah pengguna
 * tersesat ke layar yang datanya pasti akan ditolak server.
 */
export function PenjagaRute({ children, syarat }: Props) {
  const { memuat, sesi, profil, galat, keluar } = useAuth()
  const lokasi = useLocation()

  if (memuat) {
    return <StatusMemuat pesan="Memeriksa sesi…" />
  }

  if (!sesi) {
    // `state` dipakai agar setelah masuk pengguna kembali ke layar yang dituju.
    return <Navigate to="/masuk" replace state={{ dari: lokasi.pathname }} />
  }

  if (galat) {
    return (
      <StatusGalat
        judul="Profil tidak terbaca"
        pesan={galat}
        onCobaLagi={() => window.location.reload()}
      />
    )
  }

  if (!profil) {
    return (
      <StatusKosong
        ikon={ShieldOff}
        judul="Akun belum punya profil"
        keterangan="Akun Anda sudah terdaftar tetapi belum diberi peran, sehingga belum bisa mengakses data. Hubungi admin."
        aksi={
          <Button variant="outline" onClick={() => void keluar()}>
            Keluar
          </Button>
        }
      />
    )
  }

  if (!profil.aktif) {
    return (
      <StatusKosong
        ikon={ShieldOff}
        judul="Akun dinonaktifkan"
        keterangan="Akun ini sudah tidak aktif. Hubungi admin bila menurut Anda ini keliru."
        aksi={
          <Button variant="outline" onClick={() => void keluar()}>
            Keluar
          </Button>
        }
      />
    )
  }

  if (syarat && !syarat(profil.peran)) {
    return (
      <StatusKosong
        ikon={ShieldOff}
        judul="Tidak punya akses"
        keterangan="Peran Anda tidak memiliki hak untuk membuka halaman ini."
      />
    )
  }

  return children
}
