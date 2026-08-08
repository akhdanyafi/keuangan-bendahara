'use client'

import { useState } from 'react'
import { Landmark } from 'lucide-react'

interface Props {
  size?: number
  className?: string
}

// Menampilkan /public/logo.png jika sudah tersedia; selama file logo asli dari
// client belum dikirim, otomatis jatuh ke ikon placeholder (tanpa perlu ubah kode).
export default function Logo({ size = 36, className = '' }: Props) {
  const [failed, setFailed] = useState(false)

  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo.png"
        alt="Logo Yaspida"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={`object-contain rounded-lg shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={`bg-green-600 rounded-lg flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Landmark size={Math.round(size * 0.5)} className="text-white" />
    </div>
  )
}
