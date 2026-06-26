import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'bendahara') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const catatan_pencairan = body.catatan_pencairan || null

  const row = await queryOne<{ status: string; guru_id: number }>('SELECT status, guru_id FROM pengajuan WHERE id = ?', [id])
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  if (row.status !== 'approved') {
    return NextResponse.json({ error: 'Pengajuan belum disetujui' }, { status: 400 })
  }

  await queryOne(
    `UPDATE pengajuan SET status = 'menunggu_nota', dicairkan_at = NOW(), dicairkan_by = ?, catatan_pencairan = ? WHERE id = ?`,
    [session.userId, catatan_pencairan, id]
  )

  await queryOne(
    `INSERT INTO notifikasi (user_id, pengajuan_id, pesan) VALUES (?, ?, ?)`,
    [row.guru_id, id, 'Dana pengajuan Anda telah dicairkan. Silakan upload nota setelah pembelian.']
  )

  return NextResponse.json({ ok: true })
}
