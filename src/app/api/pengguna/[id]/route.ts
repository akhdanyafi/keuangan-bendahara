import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { ALL_ROLES } from '@/types'

// DELETE: hapus permanen jika tidak punya data terkait, nonaktifkan jika punya


export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'bendahara') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { id } = await params
  const { nama, email, password, role, aktif } = await req.json()

  if (!nama || !email || !role) {
    return NextResponse.json({ error: 'Nama, email, dan role wajib diisi' }, { status: 400 })
  }
  if (!ALL_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
  }

  const user = await queryOne<{ id: number }>('SELECT id FROM users WHERE id = ?', [id])
  if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  if (password) {
    const hash = await bcrypt.hash(password, 10)
    await queryOne(
      'UPDATE users SET nama = ?, email = ?, password = ?, role = ?, aktif = ? WHERE id = ?',
      [nama, email, hash, role, aktif, id]
    )
  } else {
    await queryOne(
      'UPDATE users SET nama = ?, email = ?, role = ?, aktif = ? WHERE id = ?',
      [nama, email, role, aktif, id]
    )
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'bendahara') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { id } = await params
  if (Number(id) === session.userId) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })
  }

  const user = await queryOne<{ id: number }>('SELECT id FROM users WHERE id = ?', [id])
  if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  // Cek apakah user memiliki data terkait
  const related = await queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM pengajuan
     WHERE pengaju_id = ? OR approved_by = ? OR dicairkan_by = ? OR nota_verified_by = ?`,
    [id, id, id, id]
  )

  if (related && related.total > 0) {
    // Ada data terkait — nonaktifkan saja (soft delete)
    await queryOne('UPDATE users SET aktif = 0 WHERE id = ?', [id])
    return NextResponse.json({ ok: true, soft: true, message: 'Pengguna memiliki data pengajuan, akun dinonaktifkan' })
  }

  // Tidak ada data terkait — hapus permanen
  await queryOne('DELETE FROM notifikasi WHERE user_id = ?', [id])
  await queryOne('DELETE FROM users WHERE id = ?', [id])
  return NextResponse.json({ ok: true, soft: false, message: 'Pengguna berhasil dihapus permanen' })
}
