import type { Metadata } from 'next'
import './globals.css'
import { APP_NAME, APP_FULL_NAME } from '@/types'

export const metadata: Metadata = {
  title: `${APP_NAME} - ${APP_FULL_NAME}`,
  description: 'Sistem pengajuan dan approval anggaran Yayasan Yaspida',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full bg-gray-50">{children}</body>
    </html>
  )
}
