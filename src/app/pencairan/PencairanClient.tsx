'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/dashboard-layout'
import StatusBadge from '@/components/StatusBadge'
import type { SessionPayload } from '@/lib/auth'
import type { Pengajuan } from '@/types'
import { formatRupiah, formatDate, formatDateTime } from '@/types'
import { Banknote, ExternalLink, CheckCircle2 } from 'lucide-react'

export default function PencairanClient({ session }: { session: SessionPayload }) {
  const router = useRouter()
  const [data, setData] = useState<Pengajuan[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [catatan, setCatatan] = useState<Record<number, string>>({})
  const [showCatatan, setShowCatatan] = useState<number | null>(null)
  const [error, setError] = useState('')

  const fetchData = () => {
    setLoading(true)
    fetch('/api/pengajuan?status=approved')
      .then((r) => r.json())
      .then((res) => setData(res.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleCairkan = async (id: number) => {
    setActionLoading(id)
    setError('')
    const res = await fetch(`/api/pengajuan/${id}/cairkan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catatan_pencairan: catatan[id] || null }),
    })
    setActionLoading(null)
    if (res.ok) { setShowCatatan(null); fetchData() }
    else { const d = await res.json(); setError(d.error || 'Gagal') }
  }

  return (
    <DashboardLayout title="Pencairan Dana" role={session.role} nama={session.nama}>
      <div className="space-y-4">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
        )}

        {!loading && data.length > 0 && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <Banknote size={16} className="text-green-500 shrink-0" />
            <p className="text-sm text-green-700 font-medium">
              Ada <span className="font-bold">{data.length} pengajuan</span> yang siap dicairkan dananya
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <CheckCircle2 size={32} className="mb-2" />
              <p className="text-sm text-slate-400">Tidak ada pengajuan yang perlu dicairkan</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.map((p) => (
                <div key={p.id} className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800 text-sm">{p.nama_barang}</span>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-xs text-slate-400">
                        {p.pengaju_nama} &middot; {p.kategori_nama} &middot; {formatDate(p.tanggal_pengajuan)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{p.alasan}</p>
                      {p.approved_at && (
                        <p className="text-xs text-green-600 mt-1">
                          Disetujui {formatDateTime(p.approved_at)}{p.approved_by_nama ? ` oleh ${p.approved_by_nama}` : ''}
                        </p>
                      )}
                    </div>
                    {/* Di mobile nominal & tombol detail sejajar; di desktop bertumpuk rata kanan */}
                    <div className="shrink-0 w-full sm:w-auto flex items-center justify-between gap-3 sm:block sm:text-right">
                      <p className="text-lg font-bold text-slate-800">{formatRupiah(p.estimasi_harga)}</p>
                      <button onClick={() => router.push(`/pengajuan/${p.id}`)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:underline shrink-0 sm:mt-1 sm:ml-auto">
                        Detail <ExternalLink size={11} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    {showCatatan === p.id ? (
                      <div className="space-y-2">
                        <textarea value={catatan[p.id] || ''}
                          onChange={(e) => setCatatan((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Catatan pencairan (opsional)" rows={2}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                        <div className="flex gap-2">
                          <button onClick={() => setShowCatatan(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium">Batal</button>
                          <button onClick={() => handleCairkan(p.id)} disabled={actionLoading === p.id}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                            <Banknote size={14} /> {actionLoading === p.id ? 'Memproses...' : 'Cairkan Dana'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowCatatan(p.id)}
                        className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2.5 rounded-lg text-sm transition-colors border border-green-100">
                        <Banknote size={15} /> Tandai Dana Dicairkan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
