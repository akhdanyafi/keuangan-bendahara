import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query(
    `SELECT n.*, p.nama_barang FROM notifikasi n
     JOIN pengajuan p ON n.pengajuan_id = p.id
     WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 20`,
    [session.userId]
  )
  return NextResponse.json(rows)
}

export async function PATCH() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await queryOne('UPDATE notifikasi SET dibaca = 1 WHERE user_id = ?', [session.userId])
  return NextResponse.json({ ok: true })
}
