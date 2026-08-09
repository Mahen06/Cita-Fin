import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { StatusMemuat } from '@/components/StatusMemuat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { masuk } from '@/lib/auth'
import { useAuth } from '@/modules/pengeluaran/hooks/konteksAuth'

export function HalamanMasuk() {
  const { memuat, sesi } = useAuth()
  const lokasi = useLocation()

  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [mengirim, setMengirim] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)

  if (memuat) {
    return <StatusMemuat pesan="Memeriksa sesi…" />
  }

  if (sesi) {
    const dari = (lokasi.state as { dari?: string } | null)?.dari
    return <Navigate to={dari ?? '/'} replace />
  }

  async function kirim(e: FormEvent) {
    e.preventDefault()
    if (mengirim) return

    setGalat(null)
    setMengirim(true)

    const hasil = await masuk(email, sandi)

    if (!hasil.ok) {
      setGalat(hasil.pesan)
      setMengirim(false)
      return
    }

    // Sengaja tidak mematikan `mengirim`: begitu sesi masuk, komponen ini
    // langsung digantikan pengalihan di atas. Mematikannya lebih dulu
    // membuat tombol berkedip aktif sesaat.
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">CitaFIN</h1>
          <p className="text-muted-foreground mt-1 text-sm text-balance">
            Pengeluaran proyek dan harga material
          </p>
        </div>

        <form onSubmit={kirim} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              // Fokus otomatis hanya di sini, bukan di layar lain: ini
              // satu-satunya hal yang bisa dilakukan pengguna di layar ini.
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={mengirim}
              aria-invalid={galat ? true : undefined}
              placeholder="nama@perusahaan.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sandi">Kata sandi</Label>
            <Input
              id="sandi"
              type="password"
              autoComplete="current-password"
              required
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              disabled={mengirim}
              aria-invalid={galat ? true : undefined}
            />
          </div>

          {galat ? (
            <p
              role="alert"
              className="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm"
            >
              {galat}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={mengirim || !email || !sandi}
          >
            {mengirim ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Masuk…
              </>
            ) : (
              'Masuk'
            )}
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-sm text-balance">
          Belum punya akun? Akun dibuatkan oleh admin, tidak bisa mendaftar
          sendiri.
        </p>
      </div>
    </div>
  )
}
