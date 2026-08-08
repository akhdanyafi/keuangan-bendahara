'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import type { SessionPayload } from '@/lib/auth'
import { formatRupiah, formatDate } from '@/types'
import { Download, Filter, FileSpreadsheet } from 'lucide-react'

interface LaporanRow {
  id: number; pengaju: string; kategori: string; nama_barang: string
  estimasi_harga: number; nominal_aktual: number
  tanggal_pengajuan: string; tanggal_selesai: string
}

const BULAN = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default function LaporanClient({ session }: { session: SessionPayload }) {
  const now = new Date()
  const [data, setData] = useState<LaporanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [bulan, setBulan] = useState('')
  const [tahun, setTahun] = useState(String(now.getFullYear()))
  const [kategoriId, setKategoriId] = useState('')
  const [kategoriList, setKategoriList] = useState<{id:number;nama:string}[]>([])

  useEffect(() => {
    fetch('/api/kategori').then((r) => r.json()).then(setKategoriList)
  }, [])

  useEffect(() => {
    setLoading(true)
    const q = new URLSearchParams()
    if (bulan) q.set('bulan', bulan)
    if (tahun) q.set('tahun', tahun)
    if (kategoriId) q.set('kategori_id', kategoriId)
    fetch(`/api/laporan?${q}`)
      .then((r) => r.json())
      .then((res) => setData(res.data || []))
      .finally(() => setLoading(false))
  }, [bulan, tahun, kategoriId])

  const totalRealisasi = data.reduce((s, r) => s + Number(r.nominal_aktual || 0), 0)
  const totalEstimasi = data.reduce((s, r) => s + Number(r.estimasi_harga || 0), 0)
  const selisih = totalRealisasi - totalEstimasi

  const handleExport = () => {
    const q = new URLSearchParams()
    if (bulan) q.set('bulan', bulan)
    if (tahun) q.set('tahun', tahun)
    if (kategoriId) q.set('kategori_id', kategoriId)
    q.set('export', 'xlsx')
    window.open(`/api/laporan?${q}`, '_blank')
  }

  const tahunOptions = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i))

  return (
    <DashboardLayout title="Laporan Pengeluaran" role={session.role} nama={session.nama}>
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 text-slate-400 mr-1">
              <Filter size={15} />
              <span className="text-xs font-semibold text-slate-500">Filter</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tahun</label>
              <select value={tahun} onChange={(e) => setTahun(e.target.value)}
                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                {tahunOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Bulan</label>
              <select value={bulan} onChange={(e) => setBulan(e.target.value)}
                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Semua Bulan</option>
                {BULAN.slice(1).map((b, i) => <option key={i+1} value={i+1}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
              <select value={kategoriId} onChange={(e) => setKategoriId(e.target.value)}
                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Semua Kategori</option>
                {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            {session.role === 'bendahara' && (
              <button onClick={handleExport}
                className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                <Download size={15} /> Export Excel
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Transaksi', value: String(data.length), color: 'text-slate-800' },
            { label: 'Total Estimasi', value: formatRupiah(totalEstimasi), color: 'text-slate-700' },
            { label: 'Total Realisasi', value: formatRupiah(totalRealisasi), color: 'text-green-600' },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <FileSpreadsheet size={32} className="mb-2" />
              <p className="text-sm text-slate-400">Tidak ada data laporan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* min-w wajib: tanpa ini tabel malah menyusut & teks kolom pecah, bukan scroll */}
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 w-8">No</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Nama Barang</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Pengaju</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Kategori</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Estimasi</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Realisasi</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Tgl Selesai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((row, i) => {
                    const diff = Number(row.nominal_aktual || 0) - Number(row.estimasi_harga || 0)
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-slate-300">{i + 1}</td>
                        <td className="px-5 py-3.5 text-sm font-medium text-slate-700">{row.nama_barang}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{row.pengaju}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{row.kategori}</td>
                        <td className="px-5 py-3.5 text-sm text-right text-slate-500">{formatRupiah(row.estimasi_harga)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-semibold text-slate-700">{formatRupiah(row.nominal_aktual)}</span>
                          {diff !== 0 && (
                            <span className={`ml-1.5 text-xs font-medium ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              ({diff > 0 ? '+' : ''}{formatRupiah(diff)})
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-400">{formatDate(row.tanggal_selesai)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-slate-500">Total</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-slate-600">{formatRupiah(totalEstimasi)}</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-green-600">
                      {formatRupiah(totalRealisasi)}
                      {selisih !== 0 && (
                        <span className={`ml-1.5 text-xs ${selisih > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          ({selisih > 0 ? '+' : ''}{formatRupiah(selisih)})
                        </span>
                      )}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
