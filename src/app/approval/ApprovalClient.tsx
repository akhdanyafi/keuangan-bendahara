'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import StatusBadge from '@/components/StatusBadge'
import type { SessionPayload } from '@/lib/auth'
import type { Pengajuan } from '@/types'
import { formatRupiah, formatDate, daysPending } from '@/types'
import { CheckSquare, Clock, X, CheckCircle, XCircle } from 'lucide-react'
import { formatDateTime } from '@/types'

/* ── inline detail modal untuk ketua yayasan ── */
function ApprovalDetailModal({ id, session, onClose, onRefresh }: {
  id: number; session: SessionPayload; onClose: () => void; onRefresh: () => void
}) {
  const [data, setData] = useState<Pengajuan | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/pengajuan/${id}`).then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [id])

  const doAction = async (url: string, body?: object) => {
    setActionLoading(true); setError('')
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    setActionLoading(false)
    if (res.ok) { onRefresh(); onClose() }
    else { const d = await res.json(); setError(d.error || 'Terjadi kesalahan') }
  }

  const pgId = `PGJ-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">{pgId}</span>
            {data && <StatusBadge status={data.status} />}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data ? null : (
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">{data.nama_barang}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{data.pengaju_nama} · {data.kategori_nama}</p>
            </div>

            {error && <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Tanggal Pengajuan</p>
                <p className="font-medium text-slate-700">
                  {formatDate(data.tanggal_pengajuan)}
                  {data.status === 'pending_approval' && (
                    <span className="text-orange-500 font-medium text-xs"> · {daysPending(data.tanggal_pengajuan)} hari menunggu</span>
                  )}
                </p>
              </div>
              <div><p className="text-xs text-slate-400 mb-0.5">Jumlah Barang</p><p className="font-medium text-slate-700">{data.items?.length ?? 1} jenis</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Vendor / Toko</p><p className="text-slate-700">{data.vendor || '—'}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Disubmit</p><p className="text-slate-700">{formatDateTime(data.submitted_at)}</p></div>
              <div className="col-span-2"><p className="text-xs text-slate-400 mb-0.5">Alasan Pembelian</p><p className="text-slate-700">{data.alasan}</p></div>
            </div>

            {data.items && data.items.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Rincian Barang</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs text-slate-500">
                        <th className="px-3 py-2 text-left font-semibold">Nama Barang</th>
                        <th className="px-3 py-2 text-center font-semibold w-14">Qty</th>
                        <th className="px-3 py-2 text-right font-semibold">Estimasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.items.map((it) => (
                        <tr key={it.id}>
                          <td className="px-3 py-2 text-slate-700">{it.nama_barang}</td>
                          <td className="px-3 py-2 text-center text-slate-500">{it.quantity}</td>
                          <td className="px-3 py-2 text-right text-slate-700">{formatRupiah(it.estimasi_harga)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-semibold mb-1">Total Estimasi Biaya</p>
              <p className="text-xl font-bold text-blue-600">{formatRupiah(data.estimasi_harga)}</p>
            </div>

            {data.status === 'pending_approval' && (
              !showReject ? (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => doAction(`/api/pengajuan/${id}/approve`)} disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl text-sm disabled:opacity-50">
                    <CheckCircle size={16} /> Setujui
                  </button>
                  <button onClick={() => setShowReject(true)} disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl text-sm">
                    <XCircle size={16} /> Tolak
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={2}
                    placeholder="Alasan penolakan (wajib diisi)..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowReject(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-sm font-medium">Batal</button>
                    <button onClick={() => doAction(`/api/pengajuan/${id}/reject`, { catatan_penolakan: rejectNote })}
                      disabled={actionLoading || !rejectNote}
                      className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                      Kirim Penolakan
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ApprovalClient({ session }: { session: SessionPayload }) {
  const [data, setData] = useState<Pengajuan[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending_approval' | ''>('pending_approval')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const fetchData = () => {
    setLoading(true)
    fetch(`/api/pengajuan${tab ? `?status=${tab}` : ''}`)
      .then(r => r.json()).then(res => setData(res.data || [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [tab]) // eslint-disable-line

  const pending = data.filter(p => p.status === 'pending_approval')

  return (
    <DashboardLayout title="Persetujuan Pengajuan" role={session.role} nama={session.nama}>
      {selectedId !== null && (
        <ApprovalDetailModal id={selectedId} session={session} onClose={() => setSelectedId(null)} onRefresh={fetchData} />
      )}

      <div className="space-y-4">
        {tab === 'pending_approval' && pending.length > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Clock size={16} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">Ada <span className="font-bold">{pending.length} pengajuan</span> menunggu persetujuan Anda</p>
          </div>
        )}

        <div className="flex gap-2">
          {(['pending_approval', ''] as const).map((t) => (
            <button key={String(t)} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {t === 'pending_approval' ? <><Clock size={14} /> Menunggu</> : <><CheckSquare size={14} /> Riwayat</>}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <CheckSquare size={32} className="mb-2" />
              <p className="text-sm text-slate-400">{tab ? 'Tidak ada pengajuan menunggu' : 'Belum ada riwayat'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Nama Barang</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 hidden sm:table-cell">Pengaju</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Estimasi</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">Tanggal</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-700">{p.nama_barang}</p>
                        <p className="text-xs text-slate-400 sm:hidden">{p.pengaju_nama}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden sm:table-cell">{p.pengaju_nama}</td>
                      <td className="px-5 py-3.5 text-sm text-right font-medium text-slate-700">{formatRupiah(p.estimasi_harga)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-3.5 text-sm text-slate-400 hidden md:table-cell">
                        {formatDate(p.tanggal_pengajuan)}
                        {p.status === 'pending_approval' && (
                          <p className="text-xs text-orange-500 font-medium mt-0.5">{daysPending(p.tanggal_pengajuan)} hari</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setSelectedId(p.id)} className="text-sm font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap">
                          Review →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
