import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'kepala_sekolah') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { id } = await params
  const { catatan_penolakan } = await req.json()

  if (!catatan_penolakan) {
    return NextResponse.json({ error: 'Catatan penolakan wajib diisi' }, { status: 400 })
  }

  const row = await queryOne<{ status: string; guru_id: number }>('SELECT status, guru_id FROM pengajuan WHERE id = ?', [id])
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  if (row.status !== 'pending_approval') {
    return NextResponse.json({ error: 'Status tidak valid untuk ditolak' }, { status: 400 })
  }

  await queryOne(
    `UPDATE pengajuan SET status = 'rejected', approved_at = NOW(), approved_by = ?, catatan_penolakan = ? WHERE id = ?`,
    [session.userId, catatan_penolakan, id]
  )

  await queryOne(
    `INSERT INTO notifikasi (user_id, pengajuan_id, pesan) VALUES (?, ?, ?)`,
    [row.guru_id, id, `Pengajuan Anda ditolak. Alasan: ${catatan_penolakan}`]
  )

  return NextResponse.json({ ok: true })
}
