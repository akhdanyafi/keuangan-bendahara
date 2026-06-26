import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'bendahara') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const rows = await query(
    'SELECT id, nama, email, role, aktif, created_at FROM users ORDER BY created_at DESC'
  )
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'bendahara') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { nama, email, password, role } = await req.json()
  if (!nama || !email || !password || !role) {
    return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
  }

  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email])
  if (existing) {
    return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)
  await queryOne('INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)', [nama, email, hash, role])
  return NextResponse.json({ ok: true }, { status: 201 })
}
