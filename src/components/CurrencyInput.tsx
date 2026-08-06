'use client'

import { useState } from 'react'

function formatRibuan(digits: string): string {
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

interface Props {
  /** Native form field name — kalau diisi, value mentah (tanpa titik) dikirim lewat hidden input agar tetap terbaca oleh FormData */
  name?: string
  /** Mode controlled: nilai mentah (tanpa titik) */
  value?: string
  onValueChange?: (raw: string) => void
  /** Mode uncontrolled */
  defaultValue?: string | number
  required?: boolean
  placeholder?: string
  className?: string
  id?: string
}

export default function CurrencyInput({
  name, value, onValueChange, defaultValue, required, placeholder, className, id,
}: Props) {
  const isControlled = value !== undefined
  const [internal, setInternal] = useState(() => String(defaultValue ?? '').replace(/\D/g, ''))
  const raw = isControlled ? (value ?? '').replace(/\D/g, '') : internal

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    if (isControlled) onValueChange?.(digits)
    else setInternal(digits)
  }

  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        id={id}
        value={formatRibuan(raw)}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        className={className}
      />
      {name && <input type="hidden" name={name} value={raw} />}
    </>
  )
}
