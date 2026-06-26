import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/login']

// Hanya untuk page (bukan API) — API mengurus otorisasinya sendiri per method
const ROLE_PAGES: Record<string, string[]> = {
  '/approval': ['kepala_sekolah'],
  '/pencairan': ['bendahara'],
  '/verifikasi-nota': ['bendahara'],
  '/laporan': ['bendahara', 'kepala_sekolah'],
  '/pengguna': ['bendahara'],
  '/budget': ['bendahara'],
  '/kategori': ['bendahara'],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const token = req.cookies.get('kb_session')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const session = await verifyToken(token)

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 })
    }
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('kb_session')
    return res
  }

  // Hanya cek role untuk page, bukan API
  if (!pathname.startsWith('/api/')) {
    for (const [path, roles] of Object.entries(ROLE_PAGES)) {
      if (pathname.startsWith(path)) {
        if (!roles.includes(session.role)) {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads).*)'],
}
