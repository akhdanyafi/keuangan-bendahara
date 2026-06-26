import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query('SELECT * FROM kategori ORDER BY nama')
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'bendahara') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { nama } = await req.json()
  if (!nama?.trim()) return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })

  const existing = await queryOne('SELECT id FROM kategori WHERE nama = ?', [nama.trim()])
  if (existing) return NextResponse.json({ error: 'Kategori sudah ada' }, { status: 400 })

  await queryOne('INSERT INTO kategori (nama) VALUES (?)', [nama.trim()])
  return NextResponse.json({ ok: true }, { status: 201 })
}
