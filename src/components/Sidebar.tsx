'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, FileText, CheckSquare, Banknote,
  Receipt, BarChart3, Wallet, Users, Tag, Menu, X,
} from 'lucide-react'
import { ROLE_LABEL, SUBMITTER_ROLES, APP_NAME, type Role } from '@/types'
import Logo from './Logo'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['ketua_yayasan', 'bendahara', 'komponen_sekolah', 'karyawan_yayasan'] },
  { href: '/pengajuan', label: 'Pengajuan Saya', icon: <FileText size={18} />, roles: SUBMITTER_ROLES },
  { href: '/pengajuan', label: 'Semua Pengajuan', icon: <FileText size={18} />, roles: ['ketua_yayasan', 'bendahara'] },
  { href: '/approval', label: 'Persetujuan', icon: <CheckSquare size={18} />, roles: ['ketua_yayasan'] },
  { href: '/pencairan', label: 'Pencairan Dana', icon: <Banknote size={18} />, roles: ['bendahara'] },
  { href: '/verifikasi-nota', label: 'Verifikasi Nota', icon: <Receipt size={18} />, roles: ['bendahara'] },
  { href: '/laporan', label: 'Laporan', icon: <BarChart3 size={18} />, roles: ['bendahara', 'ketua_yayasan'] },
  { href: '/budget', label: 'Anggaran', icon: <Wallet size={18} />, roles: ['bendahara'] },
  { href: '/kategori', label: 'Kategori', icon: <Tag size={18} />, roles: ['bendahara'] },
  { href: '/pengguna', label: 'Pengguna', icon: <Users size={18} />, roles: ['bendahara'] },
]

interface Props { role: Role; nama: string }

function SidebarContent({ role, nama, onClose }: Props & { onClose?: () => void }) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))
  const initials = nama.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-green-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={48} />
          <div>
            <p className="text-lg font-bold text-white leading-tight">{APP_NAME}</p>
            <p className="text-xs text-green-300 leading-tight mt-0.5">Yayasan Yaspida</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-green-300 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-xs font-semibold text-green-400 uppercase tracking-wider px-2 mb-2">Menu</p>
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <li key={item.href + item.label}>
                <Link href={item.href} onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-green-600 text-white' : 'text-green-300 hover:bg-green-800 hover:text-white'}`}>
                  <span className={active ? 'text-white' : 'text-green-400'}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-green-800">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">{initials}</div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{nama}</p>
            <p className="text-xs text-green-300">{ROLE_LABEL[role]}</p>
          </div>
        </div>
        <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login' }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-300 hover:text-white hover:bg-green-800 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Keluar
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ role, nama }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger button — visible only on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-9 h-9 bg-green-900 rounded-lg flex items-center justify-center text-white shadow-lg"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-green-900 h-full flex flex-col z-10">
            <SidebarContent role={role} nama={nama} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar — hidden on small screens */}
      <aside className="hidden lg:flex w-60 bg-green-900 flex-col min-h-screen shrink-0">
        <SidebarContent role={role} nama={nama} />
      </aside>
    </>
  )
}
