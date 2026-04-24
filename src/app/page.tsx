'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function LoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    urlError === 'auth' ? 'Přihlášení selhalo. Zkus to prosím znovu.' : ''
  )

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
    <div className="relative bg-[#13131e] rounded-2xl border border-white/10 shadow-2xl px-6 py-8 sm:p-10 w-full max-w-sm">
      <div className="text-center mb-8">
        <span className="text-5xl" aria-hidden="true">🚴</span>
        <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">
          Cyklodeník
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Přihlas se magic linkem
        </p>
      </div>

      {sent ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-4" aria-hidden="true">📬</div>
          <p className="font-semibold text-white text-lg">Zkontroluj email</p>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Poslali jsme odkaz na{' '}
            <span className="text-slate-200 font-medium break-all">{email}</span>
          </p>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tvuj@email.cz"
              required
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="email"
              spellCheck={false}
              inputMode="email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-sm text-red-400 leading-relaxed"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full rounded-xl bg-blue-600 px-4 py-4 text-base font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-900/30 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Odesílám…
              </>
            ) : (
              'Poslat magic link'
            )}
          </button>
        </form>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a12] px-4 pb-safe pt-safe">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <Suspense fallback={
        <div className="relative bg-[#13131e] rounded-2xl border border-white/10 shadow-2xl px-6 py-8 w-full max-w-sm">
          <div className="text-center">
            <span className="text-5xl">🚴</span>
            <h1 className="mt-4 text-2xl font-bold text-white">Cyklodeník</h1>
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
