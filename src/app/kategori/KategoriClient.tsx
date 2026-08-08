'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import type { SessionPayload } from '@/lib/auth'
import { Plus, Pencil, Trash2, Tag, Check, X } from 'lucide-react'

interface Kategori { id: number; nama: string; aktif: number }

export default function KategoriClient({ session }: { session: SessionPayload }) {
  const [data, setData] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Kategori | null>(null)
  const [namaInput, setNamaInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchData = () => {
    setLoading(true)
    fetch('/api/kategori')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => { setEditItem(null); setNamaInput(''); setError(''); setShowForm(true) }
  const openEdit = (k: Kategori) => { setEditItem(k); setNamaInput(k.nama); setError(''); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!namaInput.trim()) return
    setSaving(true); setError('')

    let res: Response
    if (editItem) {
      res = await fetch(`/api/kategori/${editItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: namaInput.trim(), aktif: editItem.aktif }),
      })
    } else {
      res = await fetch('/api/kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: namaInput.trim() }),
      })
    }

    setSaving(false)
    if (res.ok) {
      setShowForm(false)
      showToast(editItem ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan')
      fetchData()
    } else {
      const d = await res.json()
      setError(d.error || 'Terjadi kesalahan')
    }
  }

  const handleToggleAktif = async (k: Kategori) => {
    await fetch(`/api/kategori/${k.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: k.nama, aktif: k.aktif ? 0 : 1 }),
    })
    showToast(k.aktif ? 'Kategori dinonaktifkan' : 'Kategori diaktifkan')
    fetchData()
  }

  const handleDelete = async (k: Kategori) => {
    if (!confirm(`Hapus kategori "${k.nama}"?\n\nJika kategori ini digunakan pada pengajuan, kategori akan dinonaktifkan saja.`)) return
    setDeletingId(k.id)
    const res = await fetch(`/api/kategori/${k.id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) {
      const d = await res.json()
      showToast(d.message || 'Berhasil')
      fetchData()
    } else {
      const d = await res.json()
      showToast(d.error || 'Gagal menghapus')
    }
  }

  const aktifList = data.filter((k) => k.aktif)
  const nonaktifList = data.filter((k) => !k.aktif)

  return (
    <DashboardLayout title="Kategori Pengeluaran" role={session.role} nama={session.nama}>
      <div className="space-y-4">
        {/* Toast */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-slate-800 text-white text-sm rounded-xl shadow-lg flex items-center gap-2">
            <Check size={14} className="text-green-400" /> {toast}
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Tambah Kategori
          </button>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{editItem ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Kategori *</label>
                  <input
                    value={namaInput}
                    onChange={(e) => setNamaInput(e.target.value)}
                    required
                    autoFocus
                    placeholder="Contoh: Sarana Prasarana"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium">
                    Batal
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                    {saving ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Aktif */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Tag size={15} className="text-green-600" />
            <h3 className="text-sm font-semibold text-slate-700">Kategori Aktif</h3>
            <span className="ml-2 text-xs font-medium bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
              {aktifList.length}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : aktifList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-300">
              <Tag size={28} className="mb-2" />
              <p className="text-sm text-slate-400">Belum ada kategori</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x-0">
              {aktifList.map((k) => (
                <div key={k.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <Tag size={14} className="text-green-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{k.nama}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(k)}
                      className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition-colors">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => handleToggleAktif(k)}
                      className="flex items-center gap-1 text-xs font-medium text-amber-500 hover:text-amber-700 px-2 py-1 rounded hover:bg-amber-50 transition-colors">
                      <X size={12} /> Nonaktif
                    </button>
                    <button onClick={() => handleDelete(k)} disabled={deletingId === k.id}
                      className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50">
                      <Trash2 size={12} /> {deletingId === k.id ? '...' : 'Hapus'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nonaktif */}
        {nonaktifList.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Tag size={15} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-500">Kategori Nonaktif</h3>
              <span className="ml-auto text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {nonaktifList.length}
              </span>
            </div>
            <ul className="divide-y divide-slate-50">
              {nonaktifList.map((k) => (
                <li key={k.id} className="flex items-center justify-between px-5 py-3.5 opacity-60 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Tag size={14} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">{k.nama}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleAktif(k)}
                      className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition-colors">
                      <Check size={12} /> Aktifkan
                    </button>
                    <button onClick={() => handleDelete(k)} disabled={deletingId === k.id}
                      className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50">
                      <Trash2 size={12} /> {deletingId === k.id ? '...' : 'Hapus'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
