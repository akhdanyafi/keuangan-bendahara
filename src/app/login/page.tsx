'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { APP_NAME } from '@/types'
import Logo from '@/components/Logo'

const DEMO_ACCOUNTS = [
  { email: 'andi.bendahara@yaspida.id', role: 'Bendahara' },
  { email: 'lani.melani@yaspida.id', role: 'Ketua Yayasan' },
  { email: 'karyawan1@yaspida.id', role: 'Karyawan Yayasan' },
  { email: 'komponen1@yaspida.id', role: 'Komponen Sekolah' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || 'Email atau password salah')
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* ── Left Panel ── */}
      <div className="order-2 lg:order-1 flex-1 flex flex-col justify-center px-6 sm:px-10 py-10 lg:py-12 max-w-[520px] mx-auto lg:mx-0 w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 lg:mb-12">
          <Logo size={52} />
          <span className="text-2xl font-bold text-slate-800 tracking-tight">{APP_NAME}</span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1.5">Selamat Datang</h1>
          <p className="text-sm text-slate-400">Masukkan detail akun Anda untuk melanjutkan</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">!</span>
            </div>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@yaspida.id"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              {email && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>Masuk <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-400 font-medium">Atau masuk sebagai</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Demo Accounts */}
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => { setEmail(acc.email); setPassword('password123') }}
              className="flex flex-col items-center gap-1.5 py-3 px-2 border border-slate-200 hover:border-green-300 hover:bg-green-50 rounded-xl transition-all group"
            >
              <div className="w-8 h-8 bg-slate-100 group-hover:bg-green-100 rounded-full flex items-center justify-center transition-colors">
                <span className="text-xs font-bold text-slate-500 group-hover:text-green-600 transition-colors">
                  {acc.role.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 group-hover:text-green-600 text-center leading-tight transition-colors">
                {acc.role}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-300 text-center mt-4">
          Password demo: <code className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">password123</code>
        </p>
      </div>

      {/* ── Right Panel (branding) — stacked on top for mobile, side panel from lg up ── */}
      <div className="order-1 lg:order-2 flex flex-1 lg:min-h-screen bg-gradient-to-br from-[#e3f5e8] via-[#c9ecd3] to-[#a9ddba] relative overflow-hidden items-center justify-center py-10 px-6 lg:py-0">
        {/* Background circles */}
        <div className="absolute top-[-60px] right-[-60px] w-[220px] h-[220px] lg:w-[400px] lg:h-[400px] lg:top-[-80px] lg:right-[-80px] rounded-full bg-green-200/40" />
        <div className="absolute bottom-[-40px] left-[-40px] w-[160px] h-[160px] lg:w-[300px] lg:h-[300px] lg:bottom-[-60px] lg:left-[-60px] rounded-full bg-green-300/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] lg:w-[600px] lg:h-[600px] rounded-full bg-white/10" />

        {/* Yayasan Logos */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo-img/logo yaspida smi.png"
              alt="Logo Yaspida"
              className="w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 object-contain drop-shadow-2xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo-img/kampus prestasi 02.png"
              alt="Logo Kampus Prestasi"
              className="w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 object-contain drop-shadow-xl -mt-8 lg:-mt-14"
            />
          </div>

          {/* Text below illustration */}
          <div className="mt-2 lg:mt-4 text-center">
            <h2 className="text-xl lg:text-2xl font-bold text-green-900 mb-2">Sistem Keuangan SIKAYA</h2>
            <p className="text-sm text-green-700/70 max-w-xs leading-relaxed">
              Sistem pengelolaan anggaran Yayasan Yaspida yang aman, transparan, dan mudah digunakan.
            </p>
          </div>

          
        </div>
      </div>
    </div>
  )
}
