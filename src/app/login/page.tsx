'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, School, ArrowRight } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { email: 'bendahara@sekolah.id', role: 'Bendahara' },
  { email: 'kepala@sekolah.id', role: 'Kepala Sekolah' },
  { email: 'guru1@sekolah.id', role: 'Guru' },
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
    <div className="min-h-screen flex bg-white">
      {/* ── Left Panel ── */}
      <div className="flex-1 flex flex-col justify-center px-10 py-12 max-w-[520px] mx-auto lg:mx-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <School size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">SIMAS Keuangan</span>
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
                placeholder="email@sekolah.id"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 mt-2"
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
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => { setEmail(acc.email); setPassword('password123') }}
              className="flex flex-col items-center gap-1.5 py-3 px-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all group"
            >
              <div className="w-8 h-8 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
                <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                  {acc.role.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 group-hover:text-blue-600 text-center leading-tight transition-colors">
                {acc.role}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-300 text-center mt-4">
          Password demo: <code className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">password123</code>
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#ddeeff] via-[#c8e2ff] to-[#b8d4f5] relative overflow-hidden items-center justify-center">
        {/* Background circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-blue-200/40" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-blue-300/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/10" />

        {/* Safe/Vault Illustration */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            {/* Safe body */}
            <div className="w-52 h-52 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl shadow-2xl flex items-center justify-center relative"
              style={{ transform: 'perspective(600px) rotateY(-12deg) rotateX(8deg)' }}>

              {/* Safe door details */}
              <div className="absolute inset-4 border-2 border-blue-300/40 rounded-2xl" />

              {/* Lock dial */}
              <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full shadow-inner flex items-center justify-center border-4 border-blue-200/60">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full shadow flex items-center justify-center">
                  {/* Dial marks */}
                  <div className="relative w-8 h-8">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                      <div key={deg} className="absolute w-0.5 h-2 bg-slate-400 rounded-full"
                        style={{ top: '50%', left: '50%', transformOrigin: '0 14px',
                          transform: `translateX(-50%) rotate(${deg}deg)` }} />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-slate-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Handle */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 w-3 h-10 bg-blue-200 rounded-full shadow" />

              {/* Hinges */}
              <div className="absolute left-4 top-8 w-3 h-5 bg-blue-300/60 rounded-sm" />
              <div className="absolute left-4 bottom-8 w-3 h-5 bg-blue-300/60 rounded-sm" />
            </div>

            {/* Shadow */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-40 h-6 bg-blue-900/15 rounded-full blur-xl" />
          </div>

          {/* Text below illustration */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Keuangan Transparan</h2>
            <p className="text-sm text-blue-700/70 max-w-xs leading-relaxed">
              Sistem pengelolaan keuangan sekolah yang aman, transparan, dan mudah digunakan.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-xs">
            {['Pengajuan Digital', 'Approval Cepat', 'Laporan Real-time', 'Aman & Terenkripsi'].map((f) => (
              <span key={f} className="px-3 py-1.5 bg-white/60 backdrop-blur-sm text-blue-800 text-xs font-medium rounded-full border border-white/80 shadow-sm">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
