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

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* záření v pozadí */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/8 blur-[140px]" />
      </div>

      <header className="relative border-b border-white/8 bg-[#0d0d18]/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🚴</span>
          <h1 className="text-lg font-bold text-white tracking-tight">KM Deník</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Odhlásit
        </button>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Statistika */}
        <div className="bg-[#13131e] rounded-2xl border border-white/10 p-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">Celkem letos</p>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-bold text-white leading-none">
              {totalKm.toFixed(1)}
            </p>
            <span className="text-xl font-normal text-slate-400 mb-1">km</span>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            <span className="text-slate-300 font-medium">{rides.length}</span> výjezdů celkem
          </p>
        </div>

        {/* Formulář */}
        <div className="bg-[#13131e] rounded-2xl border border-white/10 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Přidat výjezd</h2>
          <form onSubmit={handleAddRide} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Datum</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Kilometry</label>
                <input
                  type="number"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  placeholder="42.5"
                  min="0.1"
                  step="0.1"
                  required
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Poznámka (volitelné)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Výjezd do hor, skvělé počasí…"
                className={inputClass}
              />
            </div>
            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40 transition-colors shadow-lg shadow-blue-900/30"
            >
              {saving ? 'Ukládám…' : 'Uložit výjezd'}
            </button>
          </form>
        </div>

        {/* Historie */}
        <div className="bg-[#13131e] rounded-2xl border border-white/10 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Historie výjezdů</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Načítám…</p>
          ) : rides.length === 0 ? (
            <p className="text-sm text-slate-500">Zatím žádné výjezdy. Přidej první!</p>
          ) : (
            <ul className="divide-y divide-white/6">
              {rides.map((ride) => (
                <li key={ride.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {new Date(ride.date).toLocaleDateString('cs-CZ', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    {ride.notes && (
                      <p className="text-xs text-slate-500 mt-0.5">{ride.notes}</p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-blue-400 tabular-nums">
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
