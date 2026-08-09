import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/AppShell'
import { PenjagaRute } from '@/components/PenjagaRute'
import { bolehInputNota } from '@/lib/peran'
import type { Peran } from '@/lib/peran'
import { useAuth } from '@/modules/pengeluaran/hooks/konteksAuth'
import { PenyediaAuth } from '@/modules/pengeluaran/hooks/useAuth'
import { HalamanCekHarga } from '@/modules/pengeluaran/pages/HalamanCekHarga'
import { HalamanInputNota } from '@/modules/pengeluaran/pages/HalamanInputNota'
import { HalamanLaporan } from '@/modules/pengeluaran/pages/HalamanLaporan'
import { HalamanMasuk } from '@/modules/pengeluaran/pages/HalamanMasuk'
import { HalamanMenu } from '@/modules/pengeluaran/pages/HalamanMenu'

export default function App() {
  return (
    <BrowserRouter>
      <PenyediaAuth>
        <Routes>
          <Route path="/masuk" element={<HalamanMasuk />} />

          <Route
            path="/"
            element={
              <Layar judul="Cek Harga" keterangan="Harga material lintas toko">
                <HalamanCekHarga />
              </Layar>
            }
          />

          <Route
            path="/nota/baru"
            element={
              <Layar judul="Input Nota" syarat={bolehInputNota}>
                <HalamanInputNota />
              </Layar>
            }
          />

          <Route
            path="/laporan"
            element={
              <Layar judul="Laporan" keterangan="Pengeluaran per proyek">
                <HalamanLaporan />
              </Layar>
            }
          />

          <Route
            path="/menu"
            element={
              <Layar judul="Menu">
                <HalamanMenu />
              </Layar>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PenyediaAuth>
    </BrowserRouter>
  )
}

/**
 * Satu layar terjaga: penjaga rute di luar, kerangka + tab bar di dalam.
 *
 * Kerangka sengaja dirender di dalam penjaga supaya tab bar tidak sempat
 * berkedip muncul saat sesi ternyata tidak ada.
 */
function Layar({
  judul,
  keterangan,
  syarat,
  children,
}: {
  judul: string
  keterangan?: string
  syarat?: (peran: Peran) => boolean
  children: ReactNode
}) {
  return (
    <PenjagaRute syarat={syarat}>
      <Kerangka judul={judul} keterangan={keterangan}>
        {children}
      </Kerangka>
    </PenjagaRute>
  )
}

function Kerangka({
  judul,
  keterangan,
  children,
}: {
  judul: string
  keterangan?: string
  children: ReactNode
}) {
  const { profil } = useAuth()

  return (
    <AppShell judul={judul} keterangan={keterangan} peran={profil?.peran}>
      {children}
    </AppShell>
  )
}
