'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import type { SessionPayload } from '@/lib/auth'
import type { User, Role } from '@/types'
import { UserPlus, Pencil, Users, Trash2 } from 'lucide-react'

const ROLE_LABEL: Record<Role, string> = {
  guru: 'Guru',
  kepala_sekolah: 'Kepala Sekolah',
  bendahara: 'Bendahara',
}

const ROLE_BADGE: Record<Role, string> = {
  guru: 'bg-blue-100 text-blue-700',
  kepala_sekolah: 'bg-purple-100 text-purple-700',
  bendahara: 'bg-green-100 text-green-700',
}

interface FormState {
  id?: number; nama: string; email: string; password: string; role: Role; aktif: number
}
const EMPTY: FormState = { nama: '', email: '', password: '', role: 'guru', aktif: 1 }

export default function PenggunaClient({ session }: { session: SessionPayload }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const fetchUsers = () => {
    setLoading(true)
    fetch('/api/pengguna').then((r) => r.json()).then(setUsers).finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const openAdd = () => { setForm(EMPTY); setError(''); setShowForm(true) }
  const openEdit = (u: User) => { setForm({ id: u.id, nama: u.nama, email: u.email, password: '', role: u.role, aktif: u.aktif }); setError(''); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    const url = form.id ? `/api/pengguna/${form.id}` : '/api/pengguna'
    const method = form.id ? 'PATCH' : 'POST'
    const body: Record<string, unknown> = { nama: form.nama, email: form.email, role: form.role, aktif: form.aktif }
    if (form.password) body.password = form.password
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (res.ok) { setShowForm(false); fetchUsers() }
    else { const d = await res.json(); setError(d.error || 'Terjadi kesalahan') }
  }

  const toggleAktif = async (u: User) => {
    await fetch(`/api/pengguna/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: u.nama, email: u.email, role: u.role, aktif: u.aktif ? 0 : 1 }),
    })
    showToast(u.aktif ? 'Akun dinonaktifkan' : 'Akun diaktifkan')
    fetchUsers()
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Hapus pengguna "${u.nama}"?\n\nJika pengguna memiliki data pengajuan, akun akan dinonaktifkan saja.`)) return
    setDeletingId(u.id)
    const res = await fetch(`/api/pengguna/${u.id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) {
      const d = await res.json()
      showToast(d.message || 'Berhasil')
      fetchUsers()
    } else {
      const d = await res.json()
      showToast(d.error || 'Gagal menghapus')
    }
  }

  return (
    <DashboardLayout title="Manajemen Pengguna" role={session.role} nama={session.nama}>
      <div className="space-y-4">
        {toast && (
          <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-slate-800 text-white text-sm rounded-xl shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center shrink-0">
              <svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M1 3.5L3 5.5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            {toast}
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <UserPlus size={16} /> Tambah Pengguna
          </button>
        </div>

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{form.id ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap *</label>
                  <input value={form.nama} onChange={(e) => setForm(f => ({...f, nama: e.target.value}))} required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm(f => ({...f, email: e.target.value}))} required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Password {form.id ? <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span> : '*'}
                  </label>
                  <input type="password" value={form.password} onChange={(e) => setForm(f => ({...f, password: e.target.value}))}
                    required={!form.id} placeholder={form.id ? '••••••••' : ''}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role *</label>
                  <select value={form.role} onChange={(e) => setForm(f => ({...f, role: e.target.value as Role}))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="guru">Guru</option>
                    <option value="kepala_sekolah">Kepala Sekolah</option>
                    <option value="bendahara">Bendahara</option>
                  </select>
                </div>
                {form.id && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.aktif === 1} onChange={(e) => setForm(f => ({...f, aktif: e.target.checked ? 1 : 0}))}
                      className="w-4 h-4 accent-blue-600 rounded" />
                    <span className="text-sm text-slate-700">Akun Aktif</span>
                  </label>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium">Batal</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <Users size={32} className="mb-2" />
              <p className="text-sm text-slate-400">Belum ada pengguna</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Nama</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${!u.aktif ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {u.nama.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{u.nama}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[u.role]}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.aktif ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(u)}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                          <Pencil size={12} /> Edit
                        </button>
                        {u.id !== session.userId && (
                          <>
                            <button onClick={() => toggleAktif(u)}
                              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${u.aktif ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50' : 'text-green-600 hover:text-green-800 hover:bg-green-50'}`}>
                              {u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button onClick={() => handleDelete(u)} disabled={deletingId === u.id}
                              className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40">
                              <Trash2 size={12} /> {deletingId === u.id ? '...' : 'Hapus'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
