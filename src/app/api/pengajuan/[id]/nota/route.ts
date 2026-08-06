import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { SUBMITTER_ROLES } from '@/types'
import { validateUploadFile } from '@/lib/upload'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!SUBMITTER_ROLES.includes(session.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { id } = await params
  const row = await queryOne<{ status: string; pengaju_id: number }>('SELECT status, pengaju_id FROM pengajuan WHERE id = ?', [id])
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  if (row.pengaju_id !== session.userId) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  if (row.status !== 'menunggu_nota') {
    return NextResponse.json({ error: 'Status tidak valid untuk upload nota' }, { status: 400 })
  }

  const formData = await req.formData()
  const nominal_aktual = formData.get('nominal_aktual') as string
  const tanggal_pembelian = formData.get('tanggal_pembelian') as string
  const catatan_nota = formData.get('catatan_nota') as string | null
  const fotoFile = formData.get('foto_nota') as File | null

  if (!nominal_aktual || !tanggal_pembelian || !fotoFile) {
    return NextResponse.json({ error: 'Field wajib belum diisi' }, { status: 400 })
  }
  if (!(Number(nominal_aktual) >= 0)) {
    return NextResponse.json({ error: 'Nominal aktual tidak valid' }, { status: 400 })
  }

  const uploadError = validateUploadFile(fotoFile, 'foto')
  if (uploadError) return NextResponse.json({ error: uploadError }, { status: 400 })

  const ext = fotoFile.name.split('.').pop()!.toLowerCase()
  const filename = `nota-${randomUUID()}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await writeFile(join(uploadDir, filename), Buffer.from(await fotoFile.arrayBuffer()))
  const foto_nota = `/uploads/${filename}`

  await queryOne(
    `UPDATE pengajuan SET
     status = 'nota_diverifikasi',
     nominal_aktual = ?,
     foto_nota = ?,
     tanggal_pembelian = ?,
     catatan_nota = ?,
     nota_uploaded_at = NOW()
     WHERE id = ?`,
    [nominal_aktual, foto_nota, tanggal_pembelian, catatan_nota || null, id]
  )

  return NextResponse.json({ ok: true })
}
