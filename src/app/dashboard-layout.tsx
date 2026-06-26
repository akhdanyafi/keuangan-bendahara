'use client'

import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import type { Role } from '@/types'

interface Props {
  children: React.ReactNode
  title: string
  role: Role
  nama: string
}

export default function DashboardLayout({ children, title, role, nama }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={role} nama={nama} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header title={title} role={role} nama={nama} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
