import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'bendahara') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { id } = await params
  const { nama, aktif } = await req.json()

  const row = await queryOne('SELECT id FROM kategori WHERE id = ?', [id])
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  await queryOne('UPDATE kategori SET nama = ?, aktif = ? WHERE id = ?', [nama, aktif, id])
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'bendahara') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { id } = await params

  // Cek apakah kategori digunakan oleh pengajuan
  const used = await queryOne<{ total: number }>(
    'SELECT COUNT(*) as total FROM pengajuan WHERE kategori_id = ?',
    [id]
  )

  if (used && used.total > 0) {
    // Nonaktifkan saja agar data historis tetap valid
    await queryOne('UPDATE kategori SET aktif = 0 WHERE id = ?', [id])
    return NextResponse.json({ ok: true, soft: true, message: 'Kategori memiliki data terkait, dinonaktifkan' })
  }

  // Hapus budget terkait dulu, lalu hapus kategori
  await queryOne('DELETE FROM budget WHERE kategori_id = ?', [id])
  await queryOne('DELETE FROM kategori WHERE id = ?', [id])
  return NextResponse.json({ ok: true, soft: false, message: 'Kategori berhasil dihapus' })
}
