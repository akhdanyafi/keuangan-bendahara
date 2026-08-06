'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import type { SessionPayload } from '@/lib/auth'
import { formatRupiah } from '@/types'
import { Save, Wallet, Trash2, CheckCircle } from 'lucide-react'
import CurrencyInput from '@/components/CurrencyInput'

interface BudgetRow { id: number; nama: string; budget_id: number | null; budget: number; terpakai: number }

export default function BudgetClient({ session }: { session: SessionPayload }) {
  const now = new Date()
  const [data, setData] = useState<BudgetRow[]>([])
  const [tahun, setTahun] = useState(String(now.getFullYear()))
  const [editMap, setEditMap] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchData = () => {
    fetch(`/api/budget?tahun=${tahun}`)
      .then((r) => r.json())
      .then((rows: BudgetRow[]) => {
        setData(rows)
        const map: Record<number, string> = {}
        rows.forEach((r) => { map[r.id] = String(r.budget || '') })
        setEditMap(map)
      })
  }

  useEffect(() => { fetchData() }, [tahun]) // eslint-disable-line

  const handleSave = async (kategori_id: number) => {
    setSaving(kategori_id)
    const res = await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kategori_id, tahun: Number(tahun), jumlah: Number(editMap[kategori_id]) || 0 }),
    })
    setSaving(null)
    if (res.ok) { showToast('Anggaran berhasil disimpan'); fetchData() }
  }

  const handleDelete = async (row: BudgetRow) => {
    if (!row.budget_id) return
    if (!confirm(`Reset anggaran "${row.nama}" tahun ${tahun}?`)) return
    setDeletingId(row.id)
    await fetch(`/api/budget/${row.budget_id}`, { method: 'DELETE' })
    setDeletingId(null)
    showToast('Anggaran berhasil direset')
    fetchData()
  }

  const tahunOptions = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() + 1 - i))
  const totalBudget = data.reduce((s, r) => s + Number(r.budget || 0), 0)
  const totalTerpakai = data.reduce((s, r) => s + Number(r.terpakai || 0), 0)

  return (
    <DashboardLayout title="Kelola Anggaran" role={session.role} nama={session.nama}>
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-800 text-white text-sm rounded-xl shadow-lg">
          <CheckCircle size={14} className="text-green-400" /> {toast}
        </div>
      )}

      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Tahun Anggaran:</label>
          <select value={tahun} onChange={(e) => setTahun(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {tahunOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Anggaran', value: formatRupiah(totalBudget), color: 'text-slate-800', bg: 'bg-white' },
            { label: 'Terpakai', value: formatRupiah(totalTerpakai), color: 'text-blue-600', bg: 'bg-white' },
            { label: 'Sisa', value: formatRupiah(totalBudget - totalTerpakai), color: totalBudget - totalTerpakai < 0 ? 'text-red-600' : 'text-green-600', bg: 'bg-white' },
          ].map((c) => (
            <div key={c.label} className={`${c.bg} rounded-xl border border-slate-200 p-5`}>
              <p className="text-xs text-slate-400 mb-1">{c.label}</p>
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Grid per Kategori */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Wallet size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-700">Anggaran per Kategori — {tahun}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 divide-y divide-slate-50 md:divide-y-0">
            {data.map((row, idx) => {
              const persen = row.budget > 0 ? Math.min(100, Math.round((Number(row.terpakai) / Number(row.budget)) * 100)) : 0
              const barColor = persen >= 90 ? 'bg-red-500' : persen >= 70 ? 'bg-amber-500' : 'bg-blue-500'
              const sisa = Number(row.budget || 0) - Number(row.terpakai || 0)
              const borderClass = idx % 3 !== 2 ? 'xl:border-r xl:border-slate-100' : ''
              const borderMd = idx % 2 !== 1 ? 'md:border-r md:border-slate-100' : ''
              return (
                <div key={row.id} className={`p-5 ${borderClass} ${borderMd}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700">{row.nama}</span>
                    <span className={`text-xs font-semibold ${sisa < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      Sisa: {formatRupiah(sisa)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1">
                    <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${persen}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mb-4">
                    <span>Terpakai: {formatRupiah(Number(row.terpakai))}</span>
                    <span>{persen}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Rp</span>
                      <CurrencyInput
                        value={editMap[row.id] || ''}
                        onValueChange={(raw) => setEditMap(m => ({ ...m, [row.id]: raw }))}
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => handleSave(row.id)}
                      disabled={saving === row.id}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                      <Save size={13} /> {saving === row.id ? '...' : 'Simpan'}
                    </button>
                    {row.budget_id && (
                      <button
                        onClick={() => handleDelete(row)}
                        disabled={deletingId === row.id}
                        title="Reset anggaran"
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
