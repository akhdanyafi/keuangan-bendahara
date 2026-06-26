import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const tahun = now.getFullYear()
  const bulan = now.getMonth() + 1

  const [totalBulanIni, totalTahunIni, pendingApproval, menungguNota] = await Promise.all([
    queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(nominal_aktual), 0) as total FROM pengajuan
       WHERE status = 'selesai' AND YEAR(selesai_at) = ? AND MONTH(selesai_at) = ?`,
      [tahun, bulan]
    ),
    queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(nominal_aktual), 0) as total FROM pengajuan
       WHERE status = 'selesai' AND YEAR(selesai_at) = ?`,
      [tahun]
    ),
    queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM pengajuan WHERE status = 'pending_approval'`
    ),
    queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM pengajuan WHERE status IN ('menunggu_nota', 'nota_diverifikasi')`
    ),
  ])

  const grafikBulanan = await query<{ bulan: number; total: number }>(
    `SELECT MONTH(selesai_at) as bulan, COALESCE(SUM(nominal_aktual), 0) as total
     FROM pengajuan WHERE status = 'selesai' AND YEAR(selesai_at) = ?
     GROUP BY MONTH(selesai_at) ORDER BY bulan`,
    [tahun]
  )

  const grafikKategori = await query<{ kategori: string; total: number }>(
    `SELECT k.nama as kategori, COALESCE(SUM(p.nominal_aktual), 0) as total
     FROM pengajuan p
     JOIN kategori k ON p.kategori_id = k.id
     WHERE p.status = 'selesai' AND YEAR(p.selesai_at) = ?
     GROUP BY k.id, k.nama`,
    [tahun]
  )

  const budgetKategori = await query(
    `SELECT k.nama,
     COALESCE(b.jumlah, 0) as budget,
     COALESCE(SUM(CASE WHEN p.status = 'selesai' AND YEAR(p.selesai_at) = ? THEN p.nominal_aktual ELSE 0 END), 0) as terpakai
     FROM kategori k
     LEFT JOIN budget b ON b.kategori_id = k.id AND b.tahun = ?
     LEFT JOIN pengajuan p ON p.kategori_id = k.id
     WHERE k.aktif = 1
     GROUP BY k.id, k.nama, b.jumlah`,
    [tahun, tahun]
  )

  const aktivitasTerbaru = await query(
    `SELECT p.id, p.nama_barang, p.estimasi_harga, p.nominal_aktual, p.status,
            p.created_at, p.tanggal_pengajuan,
            u.nama AS guru_nama, k.nama AS kategori_nama
     FROM pengajuan p
     JOIN users u ON p.guru_id = u.id
     JOIN kategori k ON p.kategori_id = k.id
     ORDER BY p.updated_at DESC LIMIT 8`
  )

  const bulanLabels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']
  const grafikBulananFull = bulanLabels.map((label, i) => {
    const found = grafikBulanan.find((g) => g.bulan === i + 1)
    return { bulan: label, total: found ? Number(found.total) : 0 }
  })

  return NextResponse.json({
    cards: {
      totalBulanIni: Number(totalBulanIni?.total || 0),
      totalTahunIni: Number(totalTahunIni?.total || 0),
      pendingApproval: Number(pendingApproval?.total || 0),
      menungguNota: Number(menungguNota?.total || 0),
    },
    grafikBulanan: grafikBulananFull,
    grafikKategori: grafikKategori.map((g) => ({ ...g, total: Number(g.total) })),
    budgetKategori,
    aktivitasTerbaru,
  })
}
