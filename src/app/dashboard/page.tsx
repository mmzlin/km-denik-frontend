'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Ride = {
  id: string
  date: string
  km: number
  notes: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [km, setKm] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/')
        return
      }
      setUserId(data.user.id)
      loadRides(data.user.id)
    })

    // Poslouchá změny session (např. po návratu z magic linku)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id)
        loadRides(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        router.replace('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  async function loadRides(uid: string) {
    setLoading(true)
    const { data } = await supabase
      .from('rides')
      .select('id, date, km, notes')
      .eq('user_id', uid)
      .order('date', { ascending: false })
    setRides((data as Ride[]) ?? [])
    setLoading(false)
  }

  async function handleAddRide(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setSaveError('')

    const { error } = await supabase.from('rides').insert({
      user_id: userId,
      date,
      km: parseFloat(km),
      notes: notes || null,
    })

    if (error) {
      setSaveError(error.message)
    } else {
      setKm('')
      setNotes('')
      loadRides(userId)
    }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const totalKm = rides.reduce((s, r) => s + Number(r.km), 0)

  // text-base (16px) je povinné — zabraňuje iOS auto-zoom při focusu
  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      {/* záření v pozadí */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/8 blur-[140px]" />
      </div>

      {/* Header — odsazen od Dynamic Island / notche */}
      <header className="header-safe relative border-b border-white/8 bg-[#0d0d18]/90 backdrop-blur-md px-5 pb-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🚴</span>
          <h1 className="text-lg font-bold text-white tracking-tight">KM Deník</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-400 hover:text-white active:text-slate-300 transition-colors py-2 px-3 -mr-3 rounded-lg"
        >
          Odhlásit
        </button>
      </header>

      <main className="relative flex-1 max-w-2xl w-full mx-auto px-4 py-5 space-y-4 pb-safe">

        {/* Statistika */}
        <div className="bg-[#13131e] rounded-2xl border border-white/10 px-5 py-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Celkem letos</p>
          <div className="flex items-end gap-2">
            <p className="text-5xl font-bold text-white leading-none tabular-nums">
              {totalKm.toFixed(1)}
            </p>
            <span className="text-2xl font-light text-slate-400 mb-0.5">km</span>
          </div>
          <p className="text-sm text-slate-500 mt-2.5">
            <span className="text-slate-200 font-semibold">{rides.length}</span>
            {' '}výjezdů celkem
          </p>
        </div>

        {/* Formulář */}
        <div className="bg-[#13131e] rounded-2xl border border-white/10 px-5 py-5">
          <h2 className="text-base font-semibold text-white mb-4">Přidat výjezd</h2>
          <form onSubmit={handleAddRide} className="space-y-3">
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Kilometry
                </label>
                <input
                  type="number"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  placeholder="42.5"
                  min="0.1"
                  step="0.1"
                  required
                  inputMode="decimal"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Poznámka
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Výjezd do hor, skvělé počasí…"
                autoCapitalize="sentences"
                autoCorrect="on"
                className={inputClass}
              />
            </div>
            {saveError && (
              <p className="text-sm text-red-400 leading-relaxed">{saveError}</p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 px-4 py-4 text-base font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 transition-colors shadow-lg shadow-blue-900/30 mt-1"
            >
              {saving ? 'Ukládám…' : 'Uložit výjezd'}
            </button>
          </form>
        </div>

        {/* Historie */}
        <div className="bg-[#13131e] rounded-2xl border border-white/10 px-5 py-5">
          <h2 className="text-base font-semibold text-white mb-4">Historie výjezdů</h2>
          {loading ? (
            <div className="py-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : rides.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              Zatím žádné výjezdy. Přidej první!
            </p>
          ) : (
            <ul className="divide-y divide-white/6">
              {rides.map((ride) => (
                <li key={ride.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100 leading-snug">
                      {new Date(ride.date).toLocaleDateString('cs-CZ', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    {ride.notes && (
                      <p className="text-xs text-slate-500 mt-1 leading-snug truncate">
                        {ride.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-base font-bold text-blue-400 tabular-nums shrink-0">
                    {Number(ride.km).toFixed(1)} km
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
