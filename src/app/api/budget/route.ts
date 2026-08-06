import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tahun = searchParams.get('tahun') || new Date().getFullYear().toString()

  const rows = await query(
    `SELECT k.id, k.nama,
     b.id as budget_id,
     COALESCE(b.jumlah, 0) as budget,
     COALESCE(SUM(CASE WHEN p.status = 'selesai' AND YEAR(p.selesai_at) = ? THEN p.nominal_aktual ELSE 0 END), 0) as terpakai
     FROM kategori k
     LEFT JOIN budget b ON b.kategori_id = k.id AND b.tahun = ?
     LEFT JOIN pengajuan p ON p.kategori_id = k.id
     WHERE k.aktif = 1
     GROUP BY k.id, k.nama, b.id, b.jumlah`,
    [tahun, tahun]
  )

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'bendahara') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { kategori_id, tahun, jumlah } = await req.json()

  if (!kategori_id || !tahun || !(Number(jumlah) >= 0)) {
    return NextResponse.json({ error: 'Data anggaran tidak valid' }, { status: 400 })
  }

  await queryOne(
    `INSERT INTO budget (kategori_id, tahun, jumlah) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE jumlah = ?`,
    [kategori_id, tahun, jumlah, jumlah]
  )

  return NextResponse.json({ ok: true })
}
