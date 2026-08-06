const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5MB

const ALLOWED: Record<string, { ext: string[]; mime: string[] }> = {
  dokumen: {
    ext: ['pdf', 'jpg', 'jpeg', 'png'],
    mime: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  foto: {
    ext: ['jpg', 'jpeg', 'png', 'pdf'],
    mime: ['image/jpeg', 'image/png', 'application/pdf'],
  },
}

export type UploadKind = keyof typeof ALLOWED

/** Validasi ekstensi, MIME type (dari browser, sekadar lapisan tambahan), dan ukuran file upload. */
export function validateUploadFile(file: File, kind: UploadKind): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `Ukuran file maksimal ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB`
  }

  const rules = ALLOWED[kind]
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!rules.ext.includes(ext)) {
    return `Tipe file tidak didukung. Gunakan: ${rules.ext.join(', ')}`
  }
  if (file.type && !rules.mime.includes(file.type)) {
    return `Tipe file tidak didukung. Gunakan: ${rules.ext.join(', ')}`
  }

  return null
}
