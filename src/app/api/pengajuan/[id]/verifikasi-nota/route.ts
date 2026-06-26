import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'bendahara') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { id } = await params
  const { action } = await req.json()

  const row = await queryOne<{ status: string; guru_id: number }>('SELECT status, guru_id FROM pengajuan WHERE id = ?', [id])
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  if (row.status !== 'nota_diverifikasi') {
    return NextResponse.json({ error: 'Nota belum diupload' }, { status: 400 })
  }

  if (action === 'verifikasi') {
    await queryOne(
      `UPDATE pengajuan SET status = 'selesai', nota_verified_at = NOW(), nota_verified_by = ?, selesai_at = NOW() WHERE id = ?`,
      [session.userId, id]
    )
    await queryOne(
      `INSERT INTO notifikasi (user_id, pengajuan_id, pesan) VALUES (?, ?, ?)`,
      [row.guru_id, id, 'Nota pembelian Anda telah diverifikasi. Transaksi selesai.']
    )
  } else if (action === 'minta_perbaikan') {
    await queryOne(
      `UPDATE pengajuan SET status = 'menunggu_nota', foto_nota = NULL, nominal_aktual = NULL, tanggal_pembelian = NULL, nota_uploaded_at = NULL WHERE id = ?`,
      [id]
    )
    await queryOne(
      `INSERT INTO notifikasi (user_id, pengajuan_id, pesan) VALUES (?, ?, ?)`,
      [row.guru_id, id, 'Nota Anda perlu diperbaiki. Silakan upload ulang nota pembelian.']
    )
  } else {
    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
