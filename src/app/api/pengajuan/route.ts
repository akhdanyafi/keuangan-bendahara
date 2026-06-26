import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

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
`

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = 20
  const offset = (page - 1) * limit

  const conditions: string[] = []
  const values: unknown[] = []

  if (session.role === 'guru') {
    conditions.push('p.guru_id = ?')
    values.push(session.userId)
  }

  if (status) {
    conditions.push('p.status = ?')
    values.push(status)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const rows = await query(
    `${PENGAJUAN_SELECT} ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  )

  const [countRow] = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM pengajuan p ${where}`,
    values
  )

  return NextResponse.json({ data: rows, total: countRow.total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'guru') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const formData = await req.formData()

  const nama_barang = formData.get('nama_barang') as string
  const quantity = Number(formData.get('quantity') || 1)
  const kategori_id = formData.get('kategori_id') as string
  const alasan = formData.get('alasan') as string
  const estimasi_harga = formData.get('estimasi_harga') as string
  const vendor = formData.get('vendor') as string | null
  const lampiranFile = formData.get('lampiran_penawaran') as File | null
  const action = formData.get('action') as string

  if (!nama_barang || !kategori_id || !alasan || !estimasi_harga) {
    return NextResponse.json({ error: 'Field wajib belum diisi' }, { status: 400 })
  }

  let lampiran_penawaran: string | null = null
  if (lampiranFile && lampiranFile.size > 0) {
    const ext = lampiranFile.name.split('.').pop()
    const filename = `${randomUUID()}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await writeFile(join(uploadDir, filename), Buffer.from(await lampiranFile.arrayBuffer()))
    lampiran_penawaran = `/uploads/${filename}`
  }

  const status = action === 'submit' ? 'pending_approval' : 'draft'
  const submitted_at = action === 'submit' ? new Date() : null
  const tanggal_pengajuan = new Date().toISOString().split('T')[0]

  const result = await queryOne<{ insertId: number }>(
    `INSERT INTO pengajuan
     (guru_id, nama_barang, quantity, kategori_id, alasan, estimasi_harga, vendor, lampiran_penawaran, status, tanggal_pengajuan, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [session.userId, nama_barang, quantity, kategori_id, alasan, estimasi_harga, vendor || null, lampiran_penawaran, status, tanggal_pengajuan, submitted_at]
  )

  return NextResponse.json({ id: (result as unknown as { insertId: number }).insertId }, { status: 201 })
}
