import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { queryOne } from '@/lib/db'
import { signToken, COOKIE_NAME } from '@/lib/auth'
import type { User } from '@/types'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
  }

  const user = await queryOne<User & { password: string }>(
    'SELECT * FROM users WHERE email = ? AND aktif = 1',
    [email]
  )

  if (!user) {
    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    nama: user.nama,
    role: user.role,
  })

  const res = NextResponse.json({
    user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
  })

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  return res
}
