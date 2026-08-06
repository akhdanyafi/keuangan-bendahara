import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const DEV_FALLBACK_SECRET = 'keuangan-bendahara-secret-key-2026'
const COOKIE_NAME = 'kb_session'

let cachedSecret: Uint8Array | null = null

// Sengaja dihitung lazy (bukan di top-level module) supaya `next build` tidak ikut gagal
// hanya karena JWT_SECRET belum ada di environment saat build (umum kalau secret baru
// di-inject saat container/runtime jalan, bukan saat image di-build). Pengecekan production
// baru berjalan saat token benar-benar mau di-sign/verify, yaitu saat request masuk.
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret

  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      // Secret default ada di source code publik — kalau ini dipakai di production, siapa pun
      // bisa memalsukan token sesi (termasuk sesi bendahara/ketua yayasan). Gagalkan request
      // daripada diam-diam jalan dengan secret yang bocor.
      throw new Error(
        'JWT_SECRET belum diset. Wajib diisi di production — set environment variable JWT_SECRET ' +
        'dengan nilai acak & panjang (mis. `openssl rand -base64 48`) sebelum deploy.'
      )
    }
    console.warn('[auth] JWT_SECRET belum diset, memakai secret default untuk development. Jangan pakai ini di production.')
  }

  cachedSecret = new TextEncoder().encode(process.env.JWT_SECRET || DEV_FALLBACK_SECRET)
  return cachedSecret
}

export interface SessionPayload {
  userId: number
  email: string
  nama: string
  role: 'ketua_yayasan' | 'bendahara' | 'komponen_sekolah' | 'karyawan_yayasan'
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  // getSecret() dipanggil di luar try/catch: kalau JWT_SECRET belum diset di production,
  // error itu harus tetap terlihat (500), bukan malah tertelan jadi "sesi tidak valid".
  const secret = getSecret()
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export { COOKIE_NAME }
