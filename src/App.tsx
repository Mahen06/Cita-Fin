import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/AppShell'
import { HalamanStatus } from '@/modules/pengeluaran/pages/HalamanStatus'

/**
 * Routing dan penjaga peran.
 *
 * Sesi 1 baru punya satu rute. Peta navigasi empat tab (Cek Harga · Input ·
 * Laporan · Menu) menyusul setelah peran pengguna tersedia di Sesi 3.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppShell judul="CitaFIN" keterangan="Pengeluaran proyek & harga material">
        <Routes>
          <Route path="/" element={<HalamanStatus />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
