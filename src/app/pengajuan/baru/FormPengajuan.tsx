'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/dashboard-layout'
import type { SessionPayload } from '@/lib/auth'
import type { Kategori } from '@/types'
import { Save, Send, ArrowLeft } from 'lucide-react'

export default function FormPengajuan({ session }: { session: SessionPayload }) {
  const router = useRouter()
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/kategori').then((r) => r.json()).then(setKategoriList)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, action: 'draft' | 'submit') => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('action', action)
    const res = await fetch('/api/pengajuan', { method: 'POST', body: fd })
    setLoading(false)
    if (res.ok) {
      const { id } = await res.json()
      router.push(`/pengajuan/${id}`)
    } else {
      const d = await res.json()
      setError(d.error || 'Gagal menyimpan pengajuan')
    }
  }

  return (
    <DashboardLayout title="Buat Pengajuan" role={session.role} nama={session.nama}>
      <div className="max-w-2xl">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors">
          <ArrowLeft size={15} /> Kembali
        </button>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Form Pengajuan Pembelian</h2>
            <p className="text-xs text-slate-400 mt-0.5">Isi semua field yang bertanda * dengan lengkap</p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, 'submit')} className="p-6 space-y-5">
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nama Barang / Kebutuhan <span className="text-red-500">*</span>
                </label>
                <input
                  name="nama_barang"
                  required
                  placeholder="Contoh: Proyektor Epson EB-X41"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  name="kategori_id"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {kategoriList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Estimasi Harga (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  name="estimasi_harga"
                  type="number"
                  required
                  min="0"
                  step="1000"
                  placeholder="5000000"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Alasan Pembelian <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="alasan"
                  required
                  rows={3}
                  placeholder="Jelaskan mengapa barang ini dibutuhkan..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Vendor / Toko</label>
                <input
                  name="vendor"
                  placeholder="Nama toko (opsional)"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lampiran (PDF/Gambar)</label>
                <input
                  name="lampiran_penawaran"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={(e) => {
                  const form = (e.target as HTMLButtonElement).closest('form') as HTMLFormElement
                  handleSubmit({ currentTarget: form, preventDefault: () => {} } as React.FormEvent<HTMLFormElement>, 'draft')
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Save size={15} /> Simpan Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Send size={15} />
                {loading ? 'Memproses...' : 'Submit Pengajuan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
