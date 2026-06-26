import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Keuangan Bendahara - Sistem Pengeluaran Sekolah',
  description: 'Sistem pengajuan dan approval pengeluaran sekolah',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full bg-gray-50">{children}</body>
    </html>
  )
}
