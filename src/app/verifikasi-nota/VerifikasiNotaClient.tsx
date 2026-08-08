'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/dashboard-layout'
import StatusBadge from '@/components/StatusBadge'
import type { SessionPayload } from '@/lib/auth'
import type { Pengajuan } from '@/types'
import { formatRupiah, formatDate } from '@/types'
import Image from 'next/image'
import { Shield, RefreshCw, ExternalLink, Receipt } from 'lucide-react'

export default function VerifikasiNotaClient({ session }: { session: SessionPayload }) {
  const router = useRouter()
  const [data, setData] = useState<Pengajuan[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [error, setError] = useState('')

  const fetchData = () => {
    setLoading(true)
    fetch('/api/pengajuan?status=nota_diverifikasi')
      .then((r) => r.json())
      .then((res) => setData(res.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const doVerifikasi = async (id: number, action: 'verifikasi' | 'minta_perbaikan') => {
    setActionLoading(id)
    setError('')
    const res = await fetch(`/api/pengajuan/${id}/verifikasi-nota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setActionLoading(null)
    if (res.ok) fetchData()
    else { const d = await res.json(); setError(d.error || 'Gagal') }
  }

  return (
    <DashboardLayout title="Verifikasi Nota" role={session.role} nama={session.nama}>
      <div className="space-y-4">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center h-48 text-slate-300">
            <Receipt size={32} className="mb-2" />
            <p className="text-sm text-slate-400">Tidak ada nota yang perlu diverifikasi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-semibold text-slate-800 text-sm">{p.nama_barang}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-slate-400">{p.pengaju_nama} &middot; {p.kategori_nama}</p>
                  </div>
                  <button onClick={() => router.push(`/pengajuan/${p.id}`)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0">
                    Detail <ExternalLink size={11} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Tanggal Pembelian</p>
                    <p className="font-medium text-slate-700">{formatDate(p.tanggal_pembelian)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Estimasi</p>
                    <p className="text-slate-600">{formatRupiah(p.estimasi_harga)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Realisasi</p>
                    <p className="font-bold text-blue-600">{formatRupiah(p.nominal_aktual)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Selisih</p>
                    {p.nominal_aktual != null && (
                      <p className={`font-medium text-sm ${p.nominal_aktual > p.estimasi_harga ? 'text-red-500' : 'text-green-600'}`}>
                        {p.nominal_aktual > p.estimasi_harga ? '+' : ''}{formatRupiah(p.nominal_aktual - p.estimasi_harga)}
                      </p>
                    )}
                  </div>
                  {p.catatan_nota && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 mb-0.5">Catatan Pengaju</p>
                      <p className="text-slate-600">{p.catatan_nota}</p>
                    </div>
                  )}
                </div>

                {p.foto_nota && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Foto Nota:</p>
                    <a href={p.foto_nota} target="_blank">
                      <Image src={p.foto_nota} alt="Nota" width={200} height={160}
                        className="rounded-lg border border-slate-200 object-cover cursor-pointer hover:opacity-90 transition-opacity max-w-full h-auto" />
                    </a>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button onClick={() => doVerifikasi(p.id, 'verifikasi')} disabled={actionLoading === p.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                    <Shield size={15} /> Verifikasi Nota
                  </button>
                  <button onClick={() => doVerifikasi(p.id, 'minta_perbaikan')} disabled={actionLoading === p.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                    <RefreshCw size={15} /> Minta Perbaikan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
