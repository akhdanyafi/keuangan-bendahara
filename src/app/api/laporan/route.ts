import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['bendahara', 'ketua_yayasan'].includes(session.role)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const bulan = searchParams.get('bulan')
  const tahun = searchParams.get('tahun')
  const kategori_id = searchParams.get('kategori_id')
  const exportXlsx = searchParams.get('export') === 'xlsx'

  const conditions = ["p.status = 'selesai'"]
  const values: unknown[] = []

  if (tahun) {
    conditions.push('YEAR(p.selesai_at) = ?')
    values.push(tahun)
  }
  if (bulan) {
    conditions.push('MONTH(p.selesai_at) = ?')
    values.push(bulan)
  }
  if (kategori_id) {
    conditions.push('p.kategori_id = ?')
    values.push(kategori_id)
  }

  const where = `WHERE ${conditions.join(' AND ')}`

  const rows = await query(
    `SELECT
       p.id,
       u.nama AS pengaju,
       k.nama AS kategori,
       p.nama_barang,
       p.estimasi_harga,
       p.nominal_aktual,
       p.tanggal_pengajuan,
       p.selesai_at AS tanggal_selesai
     FROM pengajuan p
     JOIN users u ON p.pengaju_id = u.id
     JOIN kategori k ON p.kategori_id = k.id
     ${where}
     ORDER BY p.selesai_at DESC`,
    values
  )

  if (exportXlsx) {
    const ws = XLSX.utils.json_to_sheet(
      (rows as Record<string, unknown>[]).map((r) => ({
        'No': r.id,
        'Pengaju': r.pengaju,
        'Kategori': r.kategori,
        'Nama Barang': r.nama_barang,
        'Estimasi (Rp)': r.estimasi_harga,
        'Realisasi (Rp)': r.nominal_aktual,
        'Tanggal Pengajuan': r.tanggal_pengajuan,
        'Tanggal Selesai': r.tanggal_selesai,
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="laporan-pengeluaran.xlsx"`,
      },
    })
  }

  return NextResponse.json({ data: rows })
}
