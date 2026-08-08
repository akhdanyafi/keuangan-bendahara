'use client'

import { useEffect, useState } from 'react'
import { Bell, ChevronRight } from 'lucide-react'
import { ROLE_LABEL, type Role } from '@/types'

interface Props {
  title: string
  role: Role
  nama: string
}

export default function Header({ title, role, nama }: Props) {
  const [notifList, setNotifList] = useState<{ id: number; pesan: string; dibaca: number; nama_barang: string }[]>([])
  const [open, setOpen] = useState(false)
  const unread = notifList.filter((n) => !n.dibaca).length

  const initials = nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    fetch('/api/notifikasi')
      .then((r) => r.json())
      .then(setNotifList)
      .catch(() => {})
  }, [])

  const toggleNotif = async () => {
    setOpen(!open)
    if (!open && unread > 0) {
      await fetch('/api/notifikasi', { method: 'PATCH' })
      setNotifList((prev) => prev.map((n) => ({ ...n, dibaca: 1 })))
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 h-14 flex items-center justify-between shrink-0 pl-14 lg:pl-6">
      {/* Breadcrumb — induk disembunyikan di mobile supaya judul tidak pecah 2 baris */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        <span className="hidden sm:inline text-slate-400 shrink-0">Yayasan Yaspida</span>
        <ChevronRight size={14} className="hidden sm:inline text-slate-300 shrink-0" />
        <span className="font-semibold text-slate-700 truncate">{title}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Notifikasi */}
        <div className="relative">
          <button
            onClick={toggleNotif}
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <Bell size={18} className="text-slate-500" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-80 sm:max-w-none bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Notifikasi</span>
                {unread === 0 && <span className="text-xs text-slate-400">Semua dibaca</span>}
              </div>
              {notifList.length === 0 ? (
                <div className="px-4 py-8 text-sm text-slate-400 text-center">
                  <Bell size={24} className="mx-auto mb-2 opacity-30" />
                  Tidak ada notifikasi
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifList.map((n) => (
                    <li
                      key={n.id}
                      className={`px-4 py-3 text-sm ${!n.dibaca ? 'bg-blue-50' : ''}`}
                    >
                      <p className="text-xs text-slate-400 mb-0.5 font-medium">{n.nama_barang}</p>
                      <p className={!n.dibaca ? 'text-slate-700 font-medium' : 'text-slate-500'}>{n.pesan}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* User — label role disembunyikan di mobile, avatar tetap tampil */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <span className="hidden md:inline text-sm font-medium text-slate-700 truncate">{ROLE_LABEL[role]}</span>
        </div>
      </div>
    </header>
  )
}
