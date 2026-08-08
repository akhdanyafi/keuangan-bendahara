'use client'

import { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import StatusBadge from '@/components/StatusBadge'
import type { SessionPayload } from '@/lib/auth'
import type { Kategori, Pengajuan, StatusPengajuan } from '@/types'
import { formatRupiah, formatDate, formatDateTime, daysPending, SUBMITTER_ROLES } from '@/types'
import {
  Plus, Filter, FileText, Search, Trash2, X, Upload,
  CheckCircle, XCircle, Banknote, Shield, RefreshCw, Send, Save,
} from 'lucide-react'
import Image from 'next/image'
import CurrencyInput from '@/components/CurrencyInput'

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Menunggu Approval' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'menunggu_nota', label: 'Menunggu Nota' },
  { value: 'nota_diverifikasi', label: 'Nota Diverifikasi' },
  { value: 'selesai', label: 'Selesai' },
]

const WORKFLOW_STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'pending_approval', label: 'Approval' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'dana_dicairkan', label: 'Dana Cair' },
  { key: 'menunggu_nota', label: 'Tunggu Nota' },
  { key: 'nota_diverifikasi', label: 'Nota OK' },
  { key: 'selesai', label: 'Selesai' },
]

const STEP_ORDER = WORKFLOW_STEPS.map((s) => s.key)

function getStepIndex(status: string) {
  const idx = STEP_ORDER.indexOf(status)
  return idx === -1 ? 0 : idx
}

/* ─────────────── FORM MODAL ─────────────── */
interface ItemInput { nama_barang: string; quantity: string; estimasi_harga: string }
const EMPTY_ITEM: ItemInput = { nama_barang: '', quantity: '1', estimasi_harga: '' }

function FormModal({ onClose, onSuccess }: {
  session?: SessionPayload
  onClose: () => void
  onSuccess: () => void
}) {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [items, setItems] = useState<ItemInput[]>([{ ...EMPTY_ITEM }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/kategori').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setKategoriList(d.filter((k: Kategori) => k.aktif))
    })
  }, [])

  const updateItem = (i: number, field: keyof ItemInput, value: string) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)))
  }
  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }])
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))

  const totalEstimasi = items.reduce((s, it) => s + (Number(it.estimasi_harga) || 0), 0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, action: 'draft' | 'submit') => {
    e.preventDefault()
    setError('')

    const cleanItems = items
      .map((it) => ({ nama_barang: it.nama_barang.trim(), quantity: Number(it.quantity) || 1, estimasi_harga: Number(it.estimasi_harga) || 0 }))
      .filter((it) => it.nama_barang)

    if (cleanItems.length === 0) {
      setError('Minimal 1 barang harus diisi')
      return
    }

    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('action', action)
    fd.set('items', JSON.stringify(cleanItems))
    const res = await fetch('/api/pengajuan', { method: 'POST', body: fd })
    setLoading(false)
    if (res.ok) { onSuccess(); onClose() }
    else { const d = await res.json(); setError(d.error || 'Gagal menyimpan') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-5 bg-blue-600 rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Buat Pengajuan Baru</h2>
            <p className="text-blue-200 text-xs mt-0.5">Isi form berikut dengan lengkap dan jujur</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors mt-0.5">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <form id="form-pengajuan" onSubmit={(e) => handleSubmit(e, 'submit')} className="p-4 sm:p-6 space-y-4">
            {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">KATEGORI *</label>
              <select name="kategori_id" required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Pilih --</option>
                {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">DAFTAR BARANG *</label>
              <div className="space-y-2">
                {/* Di mobile nama barang mengambil satu baris penuh, qty/harga/hapus turun ke baris kedua */}
                {items.map((it, i) => (
                  <div key={i} className="flex flex-wrap items-start gap-2">
                    <input value={it.nama_barang} onChange={(e) => updateItem(i, 'nama_barang', e.target.value)}
                      placeholder="Contoh: Proyektor Epson EB-E20"
                      className="w-full sm:flex-1 sm:w-auto min-w-0 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input value={it.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                      type="number" min="1" placeholder="Qty" title="Jumlah"
                      className="w-16 shrink-0 px-2 py-2.5 border border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <CurrencyInput value={it.estimasi_harga} onValueChange={(raw) => updateItem(i, 'estimasi_harga', raw)}
                      placeholder="Rp"
                      className="flex-1 min-w-0 sm:flex-none sm:w-32 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                      className="shrink-0 w-9 h-[42px] flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem}
                className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                <Plus size={14} /> Tambah Barang
              </button>
              {totalEstimasi > 0 && (
                <p className="text-right text-xs text-slate-500 mt-2">
                  Total estimasi: <span className="font-semibold text-slate-700">{formatRupiah(totalEstimasi)}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">ALASAN PEMBELIAN *</label>
              <textarea name="alasan" required rows={3}
                placeholder="Jelaskan kebutuhan, kondisi saat ini, dan urgensi pembelian..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">VENDOR / TOKO (OPSIONAL)</label>
              <input name="vendor" placeholder="Contoh: Toko Elektronik Maju"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">LAMPIRAN PENAWARAN (OPSIONAL)</label>
              <label className="flex items-center gap-2 px-3.5 py-2.5 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Upload size={14} className="text-slate-400" />
                <span className="text-sm text-slate-400">Lampirkan file penawaran harga (PDF/gambar)</span>
                <input name="lampiran_penawaran" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 shrink-0">
          <button type="button" disabled={loading}
            onClick={() => {
              const form = document.getElementById('form-pengajuan') as HTMLFormElement
              handleSubmit({ currentTarget: form, preventDefault: () => {} } as React.FormEvent<HTMLFormElement>, 'draft')
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl text-sm transition-colors disabled:opacity-50">
            <Save size={14} /> Simpan sebagai Draft
          </button>
          <button type="submit" form="form-pengajuan" disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
            <Send size={14} /> {loading ? 'Memproses...' : 'Submit Sekarang'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── DETAIL MODAL ─────────────── */
function DetailModal({ id, session, onClose, onRefresh }: {
  id: number
  session: SessionPayload
  onClose: () => void
  onRefresh: () => void
}) {
  const [data, setData] = useState<Pengajuan | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showUploadNota, setShowUploadNota] = useState(false)
  const [activeTab, setActiveTab] = useState<'detail' | 'riwayat'>('detail')
  const [error, setError] = useState('')

  const fetchData = useCallback(() => {
    setLoading(true)
    fetch(`/api/pengajuan/${id}`).then((r) => r.json()).then(setData).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const doAction = async (url: string, body?: object) => {
    setActionLoading(true); setError('')
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    setActionLoading(false)
    if (res.ok) { fetchData(); onRefresh() }
    else { const d = await res.json(); setError(d.error || 'Terjadi kesalahan') }
  }

  const handleUploadNota = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setActionLoading(true); setError('')
    const res = await fetch(`/api/pengajuan/${id}/nota`, { method: 'POST', body: new FormData(e.currentTarget) })
    setActionLoading(false)
    if (res.ok) { setShowUploadNota(false); fetchData(); onRefresh() }
    else { const d = await res.json(); setError(d.error || 'Gagal upload nota') }
  }

  const currentStep = data ? getStepIndex(data.status) : 0
  const pgId = `PGJ-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">{pgId}</span>
            {data && <StatusBadge status={data.status as StatusPengajuan} />}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-slate-400 text-sm">Data tidak ditemukan</div>
        ) : (
          <>
            {/* Sub-header */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-100 shrink-0">
              <h2 className="font-bold text-slate-800 text-base">{data.nama_barang}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{data.pengaju_nama} · <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px] font-medium">{data.kategori_nama}</span></p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-3 pb-0 border-b border-slate-100 shrink-0">
              {(['detail', 'riwayat'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-400 hover:text-slate-600'}`}>
                  {tab === 'detail' ? 'Detail & Aksi' : 'Riwayat'}
                </button>
              ))}
            </div>

            {/* Workflow stepper */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 shrink-0 overflow-x-auto">
              <div className="flex items-center gap-0 min-w-max">
                {WORKFLOW_STEPS.map((step, i) => {
                  const done = i < currentStep
                  const active = i === currentStep
                  const isRejected = data.status === 'rejected' && i === 1
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                          isRejected ? 'bg-red-500 border-red-500'
                            : done ? 'bg-blue-600 border-blue-600'
                            : active ? 'bg-white border-blue-600'
                            : 'bg-white border-slate-200'
                        }`}>
                          {(done || isRejected) && <div className="w-2 h-2 bg-white rounded-full" />}
                          {active && !isRejected && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                        </div>
                        <span className={`text-[10px] font-medium whitespace-nowrap ${
                          isRejected ? 'text-red-500' : done || active ? 'text-blue-600' : 'text-slate-300'
                        }`}>{step.label}</span>
                      </div>
                      {i < WORKFLOW_STEPS.length - 1 && (
                        <div className={`w-10 h-px mb-4 ${done ? 'bg-blue-600' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4">
              {error && <div className="mb-3 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>}

              {activeTab === 'detail' && (
                <div className="space-y-4">
                  {/* Info grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div><p className="text-xs text-slate-400 mb-0.5">TANGGAL PENGAJUAN</p><p className="font-medium text-slate-700">{formatDate(data.tanggal_pengajuan)}</p></div>
                    <div><p className="text-xs text-slate-400 mb-0.5">DIAJUKAN OLEH</p><p className="font-medium text-slate-700">{data.pengaju_nama}</p></div>
                    <div><p className="text-xs text-slate-400 mb-0.5">VENDOR / TOKO</p><p className="text-slate-700">{data.vendor || '—'}</p></div>
                    <div><p className="text-xs text-slate-400 mb-0.5">JUMLAH BARANG</p><p className="text-slate-700">{data.items?.length ?? 1} jenis</p></div>
                    <div className="sm:col-span-2"><p className="text-xs text-slate-400 mb-0.5">ALASAN PEMBELIAN</p><p className="text-slate-700">{data.alasan}</p></div>
                    {data.lampiran_penawaran && (
                      <div className="sm:col-span-2"><p className="text-xs text-slate-400 mb-0.5">LAMPIRAN</p>
                        <a href={data.lampiran_penawaran} target="_blank" className="text-blue-600 hover:underline text-sm font-medium">Lihat Lampiran →</a>
                      </div>
                    )}
                  </div>

                  {/* Rincian barang */}
                  {data.items && data.items.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1.5">RINCIAN BARANG</p>
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

                  {/* Cost cards */}
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs text-blue-400 font-semibold mb-1">Estimasi Biaya</p>
                      <p className="text-xl font-bold text-blue-600">{formatRupiah(data.estimasi_harga)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 font-semibold mb-1">Realisasi Aktual</p>
                      {data.nominal_aktual
                        ? <p className="text-xl font-bold text-slate-700">{formatRupiah(data.nominal_aktual)}</p>
                        : <p className="text-sm text-slate-300 mt-1">Belum ada</p>
                      }
                    </div>
                  </div>

                  {/* Nota preview */}
                  {data.foto_nota && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Bukti Nota:</p>
                      <div className="flex items-start gap-4">
                        <a href={data.foto_nota} target="_blank">
                          <Image src={data.foto_nota} alt="Nota" width={100} height={100} className="rounded-lg border border-slate-200 object-cover" />
                        </a>
                        <div className="text-sm space-y-1">
                          <p className="text-slate-600">Tgl: {formatDate(data.tanggal_pembelian)}</p>
                          <p className="font-semibold text-slate-800">{formatRupiah(data.nominal_aktual)}</p>
                          {data.catatan_nota && <p className="text-slate-500 text-xs">{data.catatan_nota}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action area */}
                  <div className="pt-2 space-y-3">
                    {/* Ketua Yayasan */}
                    {session.role === 'ketua_yayasan' && data.status === 'pending_approval' && (
                      !showRejectForm ? (
                        <div className="flex gap-3">
                          <button onClick={() => doAction(`/api/pengajuan/${id}/approve`)} disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl text-sm disabled:opacity-50">
                            <CheckCircle size={16} /> Setujui
                          </button>
                          <button onClick={() => setShowRejectForm(true)} disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl text-sm">
                            <XCircle size={16} /> Tolak
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={2}
                            placeholder="Alasan penolakan..."
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                          <div className="flex gap-2">
                            <button onClick={() => setShowRejectForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-sm font-medium">Batal</button>
                            <button onClick={() => doAction(`/api/pengajuan/${id}/reject`, { catatan_penolakan: rejectNote })}
                              disabled={actionLoading || !rejectNote}
                              className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                              Kirim Penolakan
                            </button>
                          </div>
                        </div>
                      )
                    )}

                    {/* Bendahara — Cairkan */}
                    {session.role === 'bendahara' && data.status === 'approved' && (
                      <button onClick={() => doAction(`/api/pengajuan/${id}/cairkan`)} disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm disabled:opacity-50">
                        <Banknote size={16} /> Tandai Dana Dicairkan
                      </button>
                    )}

                    {/* Bendahara — Verifikasi */}
                    {session.role === 'bendahara' && data.status === 'nota_diverifikasi' && (
                      <div className="flex gap-3">
                        <button onClick={() => doAction(`/api/pengajuan/${id}/verifikasi-nota`, { action: 'verifikasi' })} disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-xl text-sm disabled:opacity-50">
                          <Shield size={15} /> Verifikasi Nota
                        </button>
                        <button onClick={() => doAction(`/api/pengajuan/${id}/verifikasi-nota`, { action: 'minta_perbaikan' })} disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 rounded-xl text-sm disabled:opacity-50">
                          <RefreshCw size={15} /> Minta Perbaikan
                        </button>
                      </div>
                    )}

                    {/* Pengaju — Upload Nota */}
                    {SUBMITTER_ROLES.includes(session.role) && data.status === 'menunggu_nota' && (
                      !showUploadNota ? (
                        <button onClick={() => setShowUploadNota(true)}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm">
                          <Upload size={15} /> Upload Nota
                        </button>
                      ) : (
                        <form onSubmit={handleUploadNota} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal Aktual *</label>
                              <CurrencyInput name="nominal_aktual" required
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Beli *</label>
                              <input name="tanggal_pembelian" type="date" required
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Foto Nota *</label>
                            <input name="foto_nota" type="file" accept="image/*,.pdf" required
                              className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600" />
                          </div>
                          <textarea name="catatan_nota" rows={2} placeholder="Catatan (opsional)"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setShowUploadNota(false)}
                              className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-sm font-medium">Batal</button>
                            <button type="submit" disabled={actionLoading}
                              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                              <Upload size={14} /> {actionLoading ? 'Upload...' : 'Upload Nota'}
                            </button>
                          </div>
                        </form>
                      )
                    )}

                    {/* Pengaju — Draft actions */}
                    {SUBMITTER_ROLES.includes(session.role) && data.status === 'draft' && (
                      <div className="flex gap-3">
                        <button onClick={async () => {
                          setActionLoading(true)
                          const fd = new FormData(); fd.set('action', 'submit')
                          // just re-submit via approve route doesn't exist, redirect instead
                          const res = await fetch(`/api/pengajuan/${id}`, { method: 'PATCH' }).catch(() => null)
                          setActionLoading(false)
                          if (res?.ok) { fetchData(); onRefresh() }
                        }} disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-2.5 rounded-xl text-sm disabled:opacity-50">
                          <Send size={14} /> Submit Pengajuan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'riwayat' && (
                <ol className="relative border-l border-slate-200 space-y-4 ml-2 mt-2">
                  {[
                    { label: 'Dibuat', time: data.created_at, show: true },
                    { label: 'Disubmit', time: data.submitted_at, show: !!data.submitted_at },
                    { label: data.catatan_penolakan ? 'Ditolak' : 'Disetujui', time: data.approved_at, show: !!data.approved_at, sub: data.catatan_penolakan || (data.approved_by_nama ? `oleh ${data.approved_by_nama}` : ''), err: !!data.catatan_penolakan },
                    { label: 'Dana Dicairkan', time: data.dicairkan_at, show: !!data.dicairkan_at, sub: data.dicairkan_by_nama ? `oleh ${data.dicairkan_by_nama}` : '' },
                    { label: 'Nota Diupload', time: data.nota_uploaded_at, show: !!data.nota_uploaded_at },
                    { label: 'Selesai', time: data.selesai_at, show: !!data.selesai_at, sub: data.nota_verified_by_nama ? `diverifikasi oleh ${data.nota_verified_by_nama}` : '' },
                  ].filter((s) => s.show).map((s, i) => (
                    <li key={i} className="pl-5">
                      <div className={`absolute -left-1 w-2.5 h-2.5 rounded-full border-2 border-white ${s.err ? 'bg-red-500' : 'bg-blue-600'}`} style={{ top: i * 56 + 4 }} />
                      <p className={`text-sm font-medium ${s.err ? 'text-red-600' : 'text-slate-700'}`}>{s.label}</p>
                      {s.time && <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(s.time)}</p>}
                      {s.sub && <p className={`text-xs mt-0.5 ${s.err ? 'text-red-500' : 'text-slate-400'}`}>{s.sub}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─────────────── MAIN LIST ─────────────── */
export default function PengajuanList({ session }: { session: SessionPayload }) {
  const [data, setData] = useState<Pengajuan[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    const q = status ? `?status=${status}` : ''
    fetch(`/api/pengajuan${q}`)
      .then((r) => r.json())
      .then((res) => setData(res.data || []))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (p: Pengajuan) => {
    if (!confirm(`Hapus pengajuan "${p.nama_barang}"?`)) return
    setDeletingId(p.id)
    await fetch(`/api/pengajuan/${p.id}`, { method: 'DELETE' })
    setDeletingId(null)
    fetchData()
  }

  const filtered = search
    ? data.filter((p) => p.nama_barang.toLowerCase().includes(search.toLowerCase()) || p.pengaju_nama?.toLowerCase().includes(search.toLowerCase()))
    : data

  const title = SUBMITTER_ROLES.includes(session.role) ? 'Pengajuan Saya' : 'Semua Pengajuan'

  return (
    <DashboardLayout title={title} role={session.role} nama={session.nama}>
      {/* Modals */}
      {showForm && SUBMITTER_ROLES.includes(session.role) && (
        <FormModal session={session} onClose={() => setShowForm(false)} onSuccess={fetchData} />
      )}
      {selectedId !== null && (
        <DetailModal id={selectedId} session={session} onClose={() => setSelectedId(null)} onRefresh={fetchData} />
      )}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:flex-1 sm:w-auto sm:min-w-[180px] sm:max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari disini.."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {SUBMITTER_ROLES.includes(session.role) && (
            <button onClick={() => setShowForm(true)}
              className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Plus size={16} /> Buat Pengajuan
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <FileText size={32} className="mb-2" />
              <p className="text-sm text-slate-400">{search ? 'Tidak ada hasil pencarian' : 'Belum ada pengajuan'}</p>
              {SUBMITTER_ROLES.includes(session.role) && !search && (
                <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-blue-600 hover:underline font-medium">
                  Buat pengajuan pertama
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-slate-500">Nama Barang</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-slate-500 hidden sm:table-cell">Kategori</th>
                    {!SUBMITTER_ROLES.includes(session.role) && <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">Pengaju</th>}
                    <th className="px-3 sm:px-5 py-3 text-center text-xs font-semibold text-slate-500 hidden sm:table-cell">Qty</th>
                    <th className="px-3 sm:px-5 py-3 text-right text-xs font-semibold text-slate-500">Estimasi</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">Tgl Pengajuan</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                    {!SUBMITTER_ROLES.includes(session.role) && <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">Disetujui Oleh</th>}
                    <th className="px-3 sm:px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 sm:px-5 py-3.5">
                        <span className="text-sm font-medium text-slate-700">{p.nama_barang}</span>
                        <p className="text-xs text-slate-400 sm:hidden mt-0.5">{p.kategori_nama}</p>
                      </td>
                      <td className="px-3 sm:px-5 py-3.5 text-sm text-slate-500 hidden sm:table-cell">{p.kategori_nama}</td>
                      {!SUBMITTER_ROLES.includes(session.role) && <td className="px-3 sm:px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{p.pengaju_nama}</td>}
                      <td className="px-3 sm:px-5 py-3.5 text-sm text-center text-slate-500 hidden sm:table-cell">{p.quantity ?? 1}</td>
                      <td className="px-3 sm:px-5 py-3.5 text-sm text-right font-medium text-slate-700">{formatRupiah(p.estimasi_harga)}</td>
                      <td className="px-3 sm:px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">
                        {formatDate(p.tanggal_pengajuan)}
                        {p.status === 'pending_approval' && (
                          <p className="text-xs text-orange-500 font-medium mt-0.5">{daysPending(p.tanggal_pengajuan)} hari menunggu</p>
                        )}
                      </td>
                      <td className="px-3 sm:px-5 py-3.5"><StatusBadge status={p.status as StatusPengajuan} /></td>
                      {!SUBMITTER_ROLES.includes(session.role) && (
                        <td className="px-3 sm:px-5 py-3.5 hidden lg:table-cell">
                          {p.approved_by_nama
                            ? <span className="text-xs text-green-600 font-medium">{p.approved_by_nama}</span>
                            : <span className="text-xs text-slate-300">—</span>
                          }
                        </td>
                      )}
                      <td className="px-3 sm:px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedId(p.id)} className="text-sm font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap">
                            Detail →
                          </button>
                          {(p.status === 'draft' || p.status === 'rejected') && (
                            <button onClick={() => handleDelete(p)} disabled={deletingId === p.id}
                              className="text-red-400 hover:text-red-600 disabled:opacity-40">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
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
