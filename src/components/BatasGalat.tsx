import { Component, type ErrorInfo, type ReactNode } from 'react'

import { StatusGalat } from '@/components/StatusGalat'

type Props = { children: ReactNode }
type State = { galat: Error | null }

/**
 * Penangkap galat render terakhir.
 *
 * Tanpa ini, satu galat render membuat layar HP jadi putih polos tanpa
 * keterangan apa pun — kondisi yang paling sulit dilaporkan tim finance.
 */
export class BatasGalat extends Component<Props, State> {
  state: State = { galat: null }

  static getDerivedStateFromError(galat: Error): State {
    return { galat }
  }

  componentDidCatch(galat: Error, info: ErrorInfo) {
    // Pelaporan galat ke layanan luar belum termasuk cakupan v1.0.
    // Untuk sekarang cukup terlihat di konsol peramban saat penelusuran.
    if (!import.meta.env.PROD) {
      console.warn('Galat render tertangkap:', galat, info.componentStack)
    }
  }

  render() {
    if (this.state.galat) {
      return (
        <div className="mx-auto w-full max-w-screen-sm p-4">
          <StatusGalat
            judul="Aplikasi berhenti tak terduga"
            pesan={this.state.galat.message}
            onCobaLagi={() => window.location.reload()}
          />
        </div>
      )
    }

    return this.props.children
  }
}
