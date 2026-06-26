import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'

const PENGAJUAN_SELECT = `
  SELECT
    p.*,
    u.nama AS guru_nama,
    k.nama AS kategori_nama,
    ua.nama AS approved_by_nama,
    ud.nama AS dicairkan_by_nama,
    uv.nama AS nota_verified_by_nama
  FROM pengajuan p
  JOIN users u ON p.guru_id = u.id
  JOIN kategori k ON p.kategori_id = k.id
  LEFT JOIN users ua ON p.approved_by = ua.id
  LEFT JOIN users ud ON p.dicairkan_by = ud.id
  LEFT JOIN users uv ON p.nota_verified_by = uv.id
  WHERE p.id = ?
`

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const row = await queryOne(PENGAJUAN_SELECT, [id])
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  return NextResponse.json(row)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const row = await queryOne<{ guru_id: number; status: string }>('SELECT guru_id, status FROM pengajuan WHERE id = ?', [id])
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  const DELETABLE_STATUSES = ['draft', 'rejected']
  if (!DELETABLE_STATUSES.includes(row.status)) {
    return NextResponse.json({ error: 'Hanya pengajuan berstatus Draft atau Ditolak yang dapat dihapus' }, { status: 400 })
  }

  // Guru hanya bisa hapus miliknya sendiri; bendahara bisa hapus semua yang deletable
  if (session.role === 'guru' && row.guru_id !== session.userId) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  await queryOne('DELETE FROM notifikasi WHERE pengajuan_id = ?', [id])
  await queryOne('DELETE FROM pengajuan WHERE id = ?', [id])
  return NextResponse.json({ ok: true })
}
