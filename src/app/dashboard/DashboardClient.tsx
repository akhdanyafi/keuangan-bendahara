'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import type { SessionPayload } from '@/lib/auth'
import type { StatusPengajuan } from '@/types'
import { formatRupiah, STATUS_LABEL, STATUS_COLOR, SUBMITTER_ROLES, daysPending } from '@/types'
import {
  TrendingUp, BarChart3, Clock, AlertTriangle,
  FileText, ShoppingBag, Zap, Award, Package, HelpCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

interface DashboardData {
  cards: {
    totalBulanIni: number
    totalTahunIni: number
    pendingApproval: number
    menungguNota: number
  }
  grafikBulanan: { bulan: string; total: number }[]
  grafikKategori: { kategori: string; total: number }[]
  budgetKategori: { nama: string; budget: number; terpakai: number }[]
  aktivitasTerbaru: {
    id: number
    nama_barang: string
    estimasi_harga: number
    nominal_aktual: number | null
    status: StatusPengajuan
    pengaju_nama: string
    kategori_nama: string
    tanggal_pengajuan: string
  }[]
  pengajuSummary: {
    totalDisetujui: number
    totalNominalDisetujui: number
    pendingSaya: { id: number; nama_barang: string; kategori_nama: string; estimasi_harga: number; tanggal_pengajuan: string }[]
  } | null
}

const DONUT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const KATEGORI_ICON: Record<string, React.ReactNode> = {
  'Alat Tulis Kantor': <FileText size={16} />,
  'Aset dan Pembangunan': <ShoppingBag size={16} />,
  'Acara Event': <Award size={16} />,
  'Transportasi': <Zap size={16} />,
  'Lainnya': <Package size={16} />,
}

const KATEGORI_COLOR: Record<string, string> = {
  'Alat Tulis Kantor': 'bg-blue-100 text-blue-600',
  'Aset dan Pembangunan': 'bg-amber-100 text-amber-600',
  'Acara Event': 'bg-purple-100 text-purple-600',
  'Transportasi': 'bg-green-100 text-green-600',
  'Lainnya': 'bg-slate-100 text-slate-600',
}

function formatJuta(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`
  return String(v)
}

function ActivityList({ items }: { items: DashboardData['aktivitasTerbaru'] }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-300">
        <FileText size={28} className="mb-2" />
        <p className="text-xs">Belum ada aktivitas</p>
      </div>
    )
  }
  return (
    <ul className="divide-y divide-slate-50">
      {items.map((a) => {
        const iconClass = KATEGORI_COLOR[a.kategori_nama] || 'bg-slate-100 text-slate-600'
        const icon = KATEGORI_ICON[a.kategori_nama] || <HelpCircle size={16} />
        return (
          <li key={a.id} className="flex items-center gap-3 py-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{a.nama_barang}</p>
              <p className="text-xs text-slate-400">
                {a.pengaju_nama} · {new Date(a.tanggal_pengajuan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-slate-700">{formatRupiah(a.nominal_aktual ?? a.estimasi_harga)}</p>
              <span className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[a.status]}`}>
                {STATUS_LABEL[a.status]}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ── Dashboard Pengaju (Komponen Sekolah & Karyawan Yayasan) ── */
interface SubmitterPengajuan {
  id: number; nama_barang: string; kategori_nama: string
  estimasi_harga: number; status: StatusPengajuan; tanggal_pengajuan: string
  approved_by_nama: string | null
}

interface SubmitterData {
  pendingApproval: SubmitterPengajuan[]
  menungguNota: SubmitterPengajuan[]
  aktivitas: SubmitterPengajuan[]
  totalDisetujui: number
  totalNominalDisetujui: number
  budgetKategori: { nama: string; budget: number; terpakai: number }[]
}

function BudgetKategoriList({ budgetKategori }: { budgetKategori: { nama: string; budget: number; terpakai: number }[] }) {
  return (
    <ul className="space-y-4">
      {budgetKategori.map((b) => {
        const persen = b.budget > 0 ? Math.min(100, Math.round((Number(b.terpakai) / Number(b.budget)) * 100)) : 0
        const bar = persen >= 90 ? 'bg-red-500' : persen >= 70 ? 'bg-amber-500' : 'bg-blue-500'
        const sisa = Number(b.budget) - Number(b.terpakai)
        return (
          <li key={b.nama}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600 font-medium truncate max-w-[140px]">{b.nama}</span>
              <span className="text-slate-400 shrink-0">{persen}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${persen}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-400">Sisa {formatRupiah(sisa)}</span>
              <span className="text-xs text-slate-300">/ {formatRupiah(Number(b.budget))}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function SubmitterSection({
  title, sub, icon, iconBg, items, emptyText, href, showDaysPending,
}: {
  title: string; sub: string; icon: React.ReactNode; iconBg: string
  items: SubmitterPengajuan[]; emptyText: string; href: string; showDaysPending?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        </div>
        <a href={href} className="text-xs text-blue-600 hover:underline font-medium shrink-0">Semua →</a>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-300">
            <FileText size={22} className="mb-1.5" />
            <p className="text-xs text-slate-400 text-center px-4">{emptyText}</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {items.map((p) => (
              <a key={p.id} href={href}
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/80 transition-colors block">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${KATEGORI_COLOR[p.kategori_nama] || 'bg-slate-100 text-slate-600'}`}>
                  {KATEGORI_ICON[p.kategori_nama] || <HelpCircle size={13} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{p.nama_barang}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {showDaysPending && <span className="text-orange-500 font-medium"> · {daysPending(p.tanggal_pengajuan)} hari menunggu</span>}
                  </p>
                  {p.approved_by_nama && (
                    <p className="text-xs text-green-600 mt-0.5">Disetujui {p.approved_by_nama}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-slate-700">{formatRupiah(p.estimasi_harga)}</p>
                  <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLOR[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
              </a>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SubmitterDashboard({ data }: { data: SubmitterData }) {
  const sections = [
    {
      title: 'Menunggu Approval', sub: `${data.pendingApproval.length} pengajuan`,
      icon: <Clock size={16} className="text-orange-500" />, iconBg: 'bg-orange-50',
      items: data.pendingApproval, emptyText: 'Tidak ada yang menunggu approval', href: '/pengajuan',
      showDaysPending: true,
    },
    {
      title: 'Menunggu Nota', sub: `${data.menungguNota.length} pengajuan`,
      icon: <AlertTriangle size={16} className="text-amber-500" />, iconBg: 'bg-amber-50',
      items: data.menungguNota, emptyText: 'Tidak ada yang perlu upload nota', href: '/pengajuan',
    },
    {
      title: 'Aktivitas Terbaru', sub: 'Semua pengajuan Anda',
      icon: <FileText size={16} className="text-blue-500" />, iconBg: 'bg-blue-50',
      items: data.aktivitas, emptyText: 'Belum ada aktivitas', href: '/pengajuan',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Ringkasan pengajuan disetujui */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Total Pengajuan Disetujui</p>
          <p className="text-xl font-bold text-green-600 mb-1">{data.totalDisetujui} pengajuan</p>
          <p className="text-xs text-slate-400">Total nilai {formatRupiah(data.totalNominalDisetujui)}</p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50 shrink-0">
          <Award size={20} className="text-green-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((s) => <SubmitterSection key={s.title} {...s} />)}
      </div>

      {data.budgetKategori.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Sisa Anggaran per Kategori</h3>
          <BudgetKategoriList budgetKategori={data.budgetKategori} />
        </div>
      )}
    </div>
  )
}

/* ── Full Dashboard (Ketua Yayasan & Bendahara) ── */
function FullDashboard({ data }: { data: DashboardData }) {
  const cards = [
    { label: 'Pengeluaran Bulan Ini', value: formatRupiah(data.cards.totalBulanIni), sub: 'Total realisasi bulan berjalan', icon: <TrendingUp size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pengeluaran Tahun Ini', value: formatRupiah(data.cards.totalTahunIni), sub: `Tahun ${new Date().getFullYear()}`, icon: <BarChart3 size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Menunggu Approval', value: `${data.cards.pendingApproval} pengajuan`, sub: 'Perlu tindak lanjut segera', icon: <Clock size={20} />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Menunggu Nota', value: `${data.cards.menungguNota} pengajuan`, sub: 'Dana sudah dicairkan', icon: <AlertTriangle size={20} />, color: 'text-orange-500', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-5">
      {/* 4 Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">{c.label}</p>
              <p className={`text-xl font-bold ${c.color} mb-1`}>{c.value}</p>
              <p className="text-xs text-slate-400">{c.sub}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg} shrink-0`}>
              <span className={c.color}>{c.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Pengeluaran Bulanan {new Date().getFullYear()}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total realisasi yang sudah diverifikasi</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.grafikBulanan} barSize={28} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatJuta} />
              <Tooltip formatter={(v) => [formatRupiah(Number(v)), 'Realisasi']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Distribusi Kategori</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tahun {new Date().getFullYear()}</p>
          </div>
          {data.grafikKategori.some((g) => g.total > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={data.grafikKategori} dataKey="total" nameKey="kategori" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={2}>
                    {data.grafikKategori.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [formatRupiah(Number(v)), '']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1.5 mt-2">
                {data.grafikKategori.map((g, i) => (
                  <li key={g.kategori} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-slate-600 truncate max-w-[100px]">{g.kategori.split('(')[0].trim()}</span>
                    </div>
                    <span className="font-medium text-slate-700 shrink-0">{formatRupiah(g.total)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-300">
              <BarChart3 size={28} className="mb-2" /><p className="text-xs">Belum ada data</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Aktivitas Terbaru</h3>
          <ActivityList items={data.aktivitasTerbaru} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Realisasi Anggaran</h3>
          <BudgetKategoriList budgetKategori={data.budgetKategori} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardClient({ session }: { session: SessionPayload }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [submitterData, setSubmitterData] = useState<SubmitterData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (SUBMITTER_ROLES.includes(session.role)) {
      Promise.all([
        fetch('/api/pengajuan?status=pending_approval').then(r => r.json()),
        fetch('/api/pengajuan?status=menunggu_nota').then(r => r.json()),
        fetch('/api/pengajuan').then(r => r.json()),
        fetch('/api/dashboard').then(r => r.json()),
      ]).then(([pa, mn, all, dash]: [{ data: SubmitterPengajuan[] }, { data: SubmitterPengajuan[] }, { data: SubmitterPengajuan[] }, DashboardData]) => {
        setSubmitterData({
          pendingApproval: pa.data || [],
          menungguNota: mn.data || [],
          aktivitas: (all.data || []).slice(0, 10),
          totalDisetujui: dash.pengajuSummary?.totalDisetujui ?? 0,
          totalNominalDisetujui: dash.pengajuSummary?.totalNominalDisetujui ?? 0,
          budgetKategori: dash.budgetKategori ?? [],
        })
      }).finally(() => setLoading(false))
    } else {
      fetch('/api/dashboard').then(r => r.json()).then(setData).finally(() => setLoading(false))
    }
  }, [session.role])

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" role={session.role} nama={session.nama}>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Memuat dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard" role={session.role} nama={session.nama}>
      {SUBMITTER_ROLES.includes(session.role) && submitterData
        ? <SubmitterDashboard data={submitterData} />
        : data ? <FullDashboard data={data} /> : null
      }
    </DashboardLayout>
  )
}
