'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/dashboard-layout'
import StatusBadge from '@/components/StatusBadge'
import type { SessionPayload } from '@/lib/auth'
import type { Pengajuan, StatusPengajuan } from '@/types'
import { formatRupiah, formatDate, formatDateTime, daysPending, SUBMITTER_ROLES } from '@/types'
import Image from 'next/image'
import CurrencyInput from '@/components/CurrencyInput'
import { ArrowLeft, CheckCircle, XCircle, Banknote, Shield, RefreshCw, Upload, Trash2, Send } from 'lucide-react'

export default function PengajuanDetail({ id, session }: { id: string; session: SessionPayload }) {
  const router = useRouter()
  const [data, setData] = useState<Pengajuan | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showUploadNota, setShowUploadNota] = useState(false)
  const [error, setError] = useState('')

  const fetchData = () => {
    setLoading(true)
    fetch(`/api/pengajuan/${id}`).then((r) => r.json()).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [id]) // eslint-disable-line

  const doAction = async (url: string, body?: object) => {
    setActionLoading(true)
    setError('')
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    setActionLoading(false)
    if (res.ok) fetchData()
    else { const d = await res.json(); setError(d.error || 'Terjadi kesalahan') }
  }

  const handleUploadNota = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setActionLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch(`/api/pengajuan/${id}/nota`, { method: 'POST', body: fd })
    setActionLoading(false)
    if (res.ok) { setShowUploadNota(false); fetchData() }
    else { const d = await res.json(); setError(d.error || 'Gagal upload nota') }
  }

  if (loading) {
    return (
      <DashboardLayout title="Detail Pengajuan" role={session.role} nama={session.nama}>
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!data) return (
    <DashboardLayout title="Detail Pengajuan" role={session.role} nama={session.nama}>
      <p className="text-slate-400 text-sm">Pengajuan tidak ditemukan.</p>
    </DashboardLayout>
  )

  const timelineSteps = [
    { label: 'Dibuat', time: data.created_at, done: true },
    { label: 'Disubmit', time: data.submitted_at, done: !!data.submitted_at },
    {
      label: data.catatan_penolakan ? 'Ditolak' : 'Disetujui',
      time: data.approved_at,
      done: !!data.approved_at,
      sub: data.catatan_penolakan ? `Alasan: ${data.catatan_penolakan}` : data.approved_by_nama ? `oleh ${data.approved_by_nama}` : undefined,
      error: !!data.catatan_penolakan,
    },
    { label: 'Dana Dicairkan', time: data.dicairkan_at, done: !!data.dicairkan_at, sub: data.dicairkan_by_nama ? `oleh ${data.dicairkan_by_nama}` : undefined },
    { label: 'Nota Diupload', time: data.nota_uploaded_at, done: !!data.nota_uploaded_at },
    { label: 'Selesai', time: data.selesai_at, done: !!data.selesai_at },
  ]

  return (
    <DashboardLayout title="Detail Pengajuan" role={session.role} nama={session.nama}>
      <div className="max-w-2xl space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={15} /> Kembali
        </button>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
        )}

        {/* Info Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">{data.nama_barang}</h3>
              <p className="text-sm text-slate-400 mt-0.5">{data.kategori_nama}</p>
            </div>
            <StatusBadge status={data.status as StatusPengajuan} />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Pengaju</p>
              <p className="font-medium text-slate-700">{data.pengaju_nama}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Tanggal Pengajuan</p>
              <p className="text-slate-700">
                {formatDate(data.tanggal_pengajuan)}
                {data.status === 'pending_approval' && (
                  <span className="text-orange-500 font-medium"> · {daysPending(data.tanggal_pengajuan)} hari menunggu</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Estimasi Harga</p>
              <p className="font-semibold text-slate-800">{formatRupiah(data.estimasi_harga)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Vendor / Toko</p>
              <p className="text-slate-700">{data.vendor || '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400 mb-0.5">Alasan</p>
              <p className="text-slate-700">{data.alasan}</p>
            </div>
            {data.lampiran_penawaran && (
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-0.5">Lampiran</p>
                <a href={data.lampiran_penawaran} target="_blank" className="text-blue-600 hover:underline text-sm font-medium">Lihat Lampiran →</a>
              </div>
            )}
          </div>

          {/* Rincian barang */}
          {data.items && data.items.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-400 mb-1.5">Rincian Barang</p>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
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
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Riwayat Status</h4>
          <ol className="space-y-0">
            {timelineSteps.filter((s) => s.done || s.label === timelineSteps.find(x => !x.done)?.label).map((step, i) => (
              <li key={i} className="flex gap-3 pb-4 last:pb-0 relative">
                {i < timelineSteps.filter((s) => s.done || s.label === timelineSteps.find(x => !x.done)?.label).length - 1 && (
                  <div className="absolute left-[10px] top-5 bottom-0 w-px bg-slate-100" />
                )}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 z-10 ${
                  step.done
                    ? step.error ? 'bg-red-500 border-red-500' : 'bg-blue-600 border-blue-600'
                    : 'bg-white border-slate-300'
                }`}>
                  {step.done && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${step.done ? step.error ? 'text-red-600' : 'text-slate-700' : 'text-slate-300'}`}>{step.label}</p>
                  {step.time && <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(step.time)}</p>}
                  {step.sub && <p className={`text-xs mt-0.5 ${step.error ? 'text-red-500' : 'text-slate-400'}`}>{step.sub}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Nota */}
        {data.foto_nota && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Bukti Nota Pembelian</h4>
            <div className="space-y-2 text-sm mb-3">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-slate-400">Tanggal Pembelian</p>
                  <p className="font-medium text-slate-700 mt-0.5">{formatDate(data.tanggal_pembelian)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Nominal Aktual</p>
                  <p className="font-semibold text-blue-600 mt-0.5">{formatRupiah(data.nominal_aktual)}</p>
                </div>
              </div>
              {data.catatan_nota && (
                <div>
                  <p className="text-xs text-slate-400">Catatan</p>
                  <p className="text-slate-600 mt-0.5">{data.catatan_nota}</p>
                </div>
              )}
            </div>
            <a href={data.foto_nota} target="_blank" className="inline-block">
              <Image src={data.foto_nota} alt="Nota" width={180} height={160} className="rounded-lg border border-slate-200 object-cover hover:opacity-90 transition-opacity" />
            </a>
          </div>
        )}

        {/* Actions */}
        {/* Ketua Yayasan - Approve/Reject */}
        {session.role === 'ketua_yayasan' && data.status === 'pending_approval' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Tindakan Persetujuan</h4>
            {!showRejectForm ? (
              <div className="flex gap-3">
                <button onClick={() => doAction(`/api/pengajuan/${id}/approve`)} disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                  <CheckCircle size={16} /> Setujui
                </button>
                <button onClick={() => setShowRejectForm(true)} disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                  <XCircle size={16} /> Tolak
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Tuliskan alasan penolakan..." rows={3}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                <div className="flex gap-3">
                  <button onClick={() => setShowRejectForm(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg text-sm">Batal</button>
                  <button onClick={() => doAction(`/api/pengajuan/${id}/reject`, { catatan_penolakan: rejectNote })}
                    disabled={actionLoading || !rejectNote}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg text-sm disabled:opacity-50">
                    Kirim Penolakan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bendahara - Cairkan */}
        {session.role === 'bendahara' && data.status === 'approved' && (
          <button onClick={() => doAction(`/api/pengajuan/${id}/cairkan`)} disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            <Banknote size={16} /> Tandai Dana Dicairkan
          </button>
        )}

        {/* Bendahara - Verifikasi Nota */}
        {session.role === 'bendahara' && data.status === 'nota_diverifikasi' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Verifikasi Nota</h4>
            <div className="flex gap-3">
              <button onClick={() => doAction(`/api/pengajuan/${id}/verifikasi-nota`, { action: 'verifikasi' })} disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-50">
                <Shield size={16} /> Verifikasi Nota
              </button>
              <button onClick={() => doAction(`/api/pengajuan/${id}/verifikasi-nota`, { action: 'minta_perbaikan' })} disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-50">
                <RefreshCw size={16} /> Minta Perbaikan
              </button>
            </div>
          </div>
        )}

        {/* Pengaju - Upload Nota */}
        {SUBMITTER_ROLES.includes(session.role) && data.status === 'menunggu_nota' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Upload Nota Pembelian</h4>
            {!showUploadNota ? (
              <button onClick={() => setShowUploadNota(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm">
                <Upload size={16} /> Upload Nota
              </button>
            ) : (
              <form onSubmit={handleUploadNota} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal Aktual (Rp) *</label>
                  <CurrencyInput name="nominal_aktual" required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Pembelian *</label>
                  <input name="tanggal_pembelian" type="date" required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Foto Nota *</label>
                  <input name="foto_nota" type="file" accept="image/*,.pdf" required
                    className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan</label>
                  <textarea name="catatan_nota" rows={2} placeholder="Opsional"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowUploadNota(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium">Batal</button>
                  <button type="submit" disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                    <Upload size={14} /> {actionLoading ? 'Mengupload...' : 'Upload'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Pengaju - Submit/Hapus Draft */}
        {SUBMITTER_ROLES.includes(session.role) && data.status === 'draft' && (
          <div className="flex gap-3">
            <button onClick={async () => {
              setActionLoading(true)
              const res = await fetch(`/api/pengajuan/${id}`, { method: 'PATCH' }).catch(() => null)
              setActionLoading(false)
              if (res?.ok) fetchData()
            }} disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-50">
              <Send size={15} /> Submit Pengajuan
            </button>
            <button onClick={async () => {
              if (!confirm('Hapus pengajuan ini?')) return
              const res = await fetch(`/api/pengajuan/${id}`, { method: 'DELETE' })
              if (res.ok) router.push('/pengajuan')
            }}
              className="px-4 flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-lg text-sm">
              <Trash2 size={15} /> Hapus
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

