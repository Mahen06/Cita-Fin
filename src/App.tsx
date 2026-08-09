import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/AppShell'
import { PenjagaRute } from '@/components/PenjagaRute'
import { bolehInputNota, bolehKelolaItem, bolehKelolaToko } from '@/lib/peran'
import type { Peran } from '@/lib/peran'
import { useAuth } from '@/modules/pengeluaran/hooks/konteksAuth'
import { PenyediaAuth } from '@/modules/pengeluaran/hooks/useAuth'
import { HalamanCekHarga } from '@/modules/pengeluaran/pages/HalamanCekHarga'
import { HalamanDetailNota } from '@/modules/pengeluaran/pages/HalamanDetailNota'
import { HalamanFormItem } from '@/modules/pengeluaran/pages/HalamanFormItem'
import { HalamanImporItem } from '@/modules/pengeluaran/pages/HalamanImporItem'
import { HalamanInputNota } from '@/modules/pengeluaran/pages/HalamanInputNota'
import { HalamanLaporan } from '@/modules/pengeluaran/pages/HalamanLaporan'
import { HalamanMasterData } from '@/modules/pengeluaran/pages/HalamanMasterData'
import { HalamanMasterItem } from '@/modules/pengeluaran/pages/HalamanMasterItem'
import { HalamanMasterProyek } from '@/modules/pengeluaran/pages/HalamanMasterProyek'
import { HalamanMasterToko } from '@/modules/pengeluaran/pages/HalamanMasterToko'
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

          {/*
            Rute statis "/nota/baru" di atas menang atas "/nota/:id" —
            React Router mendahulukan segmen tetap. Detail nota bisa
            dibuka semua peran; RLS yang menentukan apa yang terbaca.
          */}
          <Route
            path="/nota/:id"
            element={
              <Layar judul="Detail Nota">
                <HalamanDetailNota />
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

          {/*
            Master Data. Penjaga di sini mencerminkan RLS, bukan
            menggantikannya: master item dan proyek hanya admin (B7),
            master toko boleh admin dan finance.
          */}
          <Route
            path="/master"
            element={
              <Layar judul="Master Data" syarat={bolehKelolaToko}>
                <HalamanMasterData />
              </Layar>
            }
          />

          <Route
            path="/master/item"
            element={
              <Layar judul="Master Item" syarat={bolehKelolaToko}>
                <HalamanMasterItem />
              </Layar>
            }
          />

          <Route
            path="/master/item/impor"
            element={
              <Layar judul="Impor Item" syarat={bolehKelolaItem}>
                <HalamanImporItem />
              </Layar>
            }
          />

          <Route
            path="/master/item/baru"
            element={
              <Layar judul="Tambah Item" syarat={bolehKelolaItem}>
                <HalamanFormItem />
              </Layar>
            }
          />

          <Route
            path="/master/item/:kode"
            element={
              <Layar judul="Ubah Item" syarat={bolehKelolaItem}>
                <HalamanFormItem />
              </Layar>
            }
          />

          <Route
            path="/master/toko"
            element={
              <Layar judul="Master Toko" syarat={bolehKelolaToko}>
                <HalamanMasterToko />
              </Layar>
            }
          />

          <Route
            path="/master/proyek"
            element={
              <Layar judul="Master Proyek" syarat={bolehKelolaToko}>
                <HalamanMasterProyek />
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
