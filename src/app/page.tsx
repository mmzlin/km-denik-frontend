'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a12] px-4 pb-safe">
      {/* záření v pozadí */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative bg-[#13131e] rounded-2xl border border-white/10 shadow-2xl px-6 py-8 sm:p-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🚴</span>
          <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">KM Deník</h1>
          <p className="mt-1.5 text-sm text-slate-400">Přihlas se magic linkem</p>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">📬</div>
            <p className="font-semibold text-white text-lg">Zkontroluj email</p>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Poslali jsme odkaz na{' '}
              <span className="text-slate-200 font-medium break-all">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tvuj@email.cz"
                required
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
                inputMode="email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 leading-relaxed">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-4 text-base font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 transition-colors shadow-lg shadow-blue-900/30 mt-2"
            >
              {loading ? 'Odesílám…' : 'Poslat magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
