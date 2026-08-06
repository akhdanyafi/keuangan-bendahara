import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { SUBMITTER_ROLES } from '@/types'
import { validateUploadFile } from '@/lib/upload'

const PENGAJUAN_SELECT = `
  SELECT
    p.*,
    u.nama AS pengaju_nama,
    k.nama AS kategori_nama,
    ua.nama AS approved_by_nama,
    ud.nama AS dicairkan_by_nama,
    uv.nama AS nota_verified_by_nama
  FROM pengajuan p
  JOIN users u ON p.pengaju_id = u.id
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
  const pageParam = Number(searchParams.get('page'))
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1
  const limit = 20
  const offset = (page - 1) * limit

  const conditions: string[] = []
  const values: unknown[] = []

  if (SUBMITTER_ROLES.includes(session.role)) {
    conditions.push('p.pengaju_id = ?')
    values.push(session.userId)
  }

  if (status) {
    conditions.push('p.status = ?')
    values.push(status)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  // LIMIT/OFFSET dikirim inline (bukan bind param) karena mysql2 prepared statement
  // (pool.execute) menolak placeholder di klausa LIMIT/OFFSET pada MySQL 8 (ER_WRONG_ARGUMENTS).
  // Aman karena limit tetap dan page sudah divalidasi sebagai integer positif di atas.
  const rows = await query(
    `${PENGAJUAN_SELECT} ${where} ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    values
  )

  const [countRow] = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM pengajuan p ${where}`,
    values
  )

  return NextResponse.json({ data: rows, total: countRow.total, page, limit })
}

interface PengajuanItemInput {
  nama_barang: string
  quantity: number
  estimasi_harga: number
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!SUBMITTER_ROLES.includes(session.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const formData = await req.formData()

  const kategori_id = formData.get('kategori_id') as string
  const alasan = formData.get('alasan') as string
  const vendor = formData.get('vendor') as string | null
  const lampiranFile = formData.get('lampiran_penawaran') as File | null
  const action = formData.get('action') as string

  let items: PengajuanItemInput[] = []
  try {
    items = JSON.parse(String(formData.get('items') || '[]'))
  } catch {
    return NextResponse.json({ error: 'Data barang tidak valid' }, { status: 400 })
  }

  if (!kategori_id || !alasan) {
    return NextResponse.json({ error: 'Field wajib belum diisi' }, { status: 400 })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Minimal 1 barang harus diisi' }, { status: 400 })
  }
  for (const it of items) {
    if (!it.nama_barang?.trim() || !(Number(it.quantity) > 0) || !(Number(it.estimasi_harga) >= 0)) {
      return NextResponse.json({ error: 'Data barang belum lengkap atau tidak valid' }, { status: 400 })
    }
  }

  let lampiran_penawaran: string | null = null
  if (lampiranFile && lampiranFile.size > 0) {
    const uploadError = validateUploadFile(lampiranFile, 'dokumen')
    if (uploadError) return NextResponse.json({ error: uploadError }, { status: 400 })

    const ext = lampiranFile.name.split('.').pop()!.toLowerCase()
    const filename = `${randomUUID()}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await writeFile(join(uploadDir, filename), Buffer.from(await lampiranFile.arrayBuffer()))
    lampiran_penawaran = `/uploads/${filename}`
  }

  const status = action === 'submit' ? 'pending_approval' : 'draft'
  const submitted_at = action === 'submit' ? new Date() : null
  const tanggal_pengajuan = new Date().toISOString().split('T')[0]

  // nama_barang/quantity/estimasi_harga di header adalah ringkasan (judul gabungan,
  // total qty, total estimasi) dari barang-barang di pengajuan_item.
  const totalQty = items.reduce((s, it) => s + Number(it.quantity), 0)
  const totalHarga = items.reduce((s, it) => s + Number(it.estimasi_harga), 0)
  const judul = items.length === 1 ? items[0].nama_barang : `${items[0].nama_barang} +${items.length - 1} barang lainnya`

  // pool.execute() (prepared statement) mengembalikan ResultSetHeader langsung, bukan array baris —
  // ambil insertId dari hasil query() apa adanya (bukan lewat queryOne yang mengasumsikan rows[0]).
  const insertResult = await query<{ insertId: number }>(
    `INSERT INTO pengajuan
     (pengaju_id, nama_barang, quantity, kategori_id, alasan, estimasi_harga, vendor, lampiran_penawaran, status, tanggal_pengajuan, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [session.userId, judul, totalQty, kategori_id, alasan, totalHarga, vendor || null, lampiran_penawaran, status, tanggal_pengajuan, submitted_at]
  )
  const pengajuanId = (insertResult as unknown as { insertId: number }).insertId

  const itemPlaceholders = items.map(() => '(?, ?, ?, ?)').join(', ')
  const itemValues = items.flatMap((it) => [pengajuanId, it.nama_barang, it.quantity, it.estimasi_harga])
  await query(
    `INSERT INTO pengajuan_item (pengajuan_id, nama_barang, quantity, estimasi_harga) VALUES ${itemPlaceholders}`,
    itemValues
  )

  return NextResponse.json({ id: pengajuanId }, { status: 201 })
}
