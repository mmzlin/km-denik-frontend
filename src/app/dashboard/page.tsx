'use client'

import { useCallback, useEffect, useState } from 'react'
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

  const loadRides = useCallback(async (uid: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rides')
      .select('id, date, km, notes')
      .eq('user_id', uid)
      .order('date', { ascending: false })

    if (!error) {
      setRides((data as Ride[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      if (!data.user) {
        router.replace('/')
        return
      }
      setUserId(data.user.id)
      loadRides(data.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (!active) return
        if (event === 'SIGNED_OUT') {
          router.replace('/')
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [router, loadRides])

  async function handleAddRide(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    // Český desetinný oddělovač "," → "." pro parseFloat
    const normalizedKm = km.replace(',', '.')
    const kmNumber = parseFloat(normalizedKm)

    if (!isFinite(kmNumber) || kmNumber <= 0) {
      setSaveError('Zadej platný počet kilometrů (např. 42.5)')
      return
    }

    setSaving(true)
    setSaveError('')

    const { error } = await supabase.from('rides').insert({
      user_id: userId,
      date,
      km: kmNumber,
      notes: notes.trim() || null,
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

  // text-base = 16px (nutné proti iOS auto-zoom)
  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/10 blur-[140px]" />
      </div>

      <header className="header-safe relative border-b border-white/10 bg-[#0d0d18]/90 backdrop-blur-md px-5 pb-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-xl" aria-hidden="true">🚴</span>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Cyklodeník
          </h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-slate-400 hover:text-white active:text-slate-300 transition-colors py-2 px-3 -mr-3 rounded-lg"
        >
          Odhlásit
        </button>
      </header>

      <main className="relative flex-1 max-w-2xl w-full mx-auto px-4 py-5 space-y-4 pb-safe">

        {/* Statistika */}
        <section
          aria-labelledby="stats-heading"
          className="bg-[#13131e] rounded-2xl border border-white/10 px-5 py-5"
        >
          <p
            id="stats-heading"
            className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3"
          >
            Najeto celkem
          </p>
          <div className="flex items-end gap-2">
            <p className="text-5xl font-bold text-white leading-none tabular-nums">
              {totalKm.toFixed(1)}
            </p>
            <span className="text-2xl font-light text-slate-400 mb-0.5">
              km
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2.5">
            <span className="text-slate-200 font-semibold">{rides.length}</span>
            {' '}
            {rides.length === 1 ? 'výjezd' : rides.length >= 2 && rides.length <= 4 ? 'výjezdy' : 'výjezdů'}
            {' celkem'}
          </p>
        </section>

        {/* Formulář */}
        <section
          aria-labelledby="add-heading"
          className="bg-[#13131e] rounded-2xl border border-white/10 px-5 py-5"
        >
          <h2
            id="add-heading"
            className="text-base font-semibold text-white mb-4"
          >
            Přidat výjezd
          </h2>
          <form onSubmit={handleAddRide} className="space-y-3" noValidate>
            <div className="form-fields">
              <div>
                <label
                  htmlFor="ride-date"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2"
                >
                  Datum
                </label>
                <input
                  id="ride-date"
                  name="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="ride-km"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2"
                >
                  Kilometry
                </label>
                <input
                  id="ride-km"
                  name="km"
                  type="text"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  placeholder="42.5"
                  required
                  inputMode="decimal"
                  pattern="[0-9]+([\.,][0-9]+)?"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="ride-notes"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2"
              >
                Poznámka
              </label>
              <input
                id="ride-notes"
                name="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Výjezd do hor, skvělé počasí…"
                autoCapitalize="sentences"
                autoCorrect="on"
                maxLength={200}
                className={inputClass}
              />
            </div>
            {saveError && (
              <p role="alert" className="text-sm text-red-400 leading-relaxed">
                {saveError}
              </p>
            )}
            <button
              type="submit"
              disabled={saving || !km}
              className="w-full rounded-xl bg-blue-600 px-4 py-4 text-base font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-900/30 mt-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ukládám…
                </>
              ) : (
                'Uložit výjezd'
              )}
            </button>
          </form>
        </section>

        {/* Historie */}
        <section
          aria-labelledby="history-heading"
          className="bg-[#13131e] rounded-2xl border border-white/10 px-5 py-5"
        >
          <h2
            id="history-heading"
            className="text-base font-semibold text-white mb-4"
          >
            Historie výjezdů
          </h2>
          {loading ? (
            <div className="py-8 text-center" aria-label="Načítám">
              <div className="inline-block w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : rides.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              Zatím žádné výjezdy. Přidej první!
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {rides.map((ride) => (
                <li
                  key={ride.id}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100 leading-snug">
                      {new Date(ride.date).toLocaleDateString('cs-CZ', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
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
        </section>
      </main>
    </div>
  )
}
