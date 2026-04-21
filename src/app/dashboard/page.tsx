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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚴</span>
          <h1 className="text-lg font-bold text-gray-900">KM Deník</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          Odhlásit
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Celkem letos</p>
          <p className="text-4xl font-bold text-blue-600">
            {totalKm.toFixed(1)} <span className="text-xl font-normal text-gray-400">km</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">{rides.length} výjezdů</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Přidat výjezd</h2>
          <form onSubmit={handleAddRide} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Datum</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kilometry</label>
                <input
                  type="number"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  placeholder="42.5"
                  min="0.1"
                  step="0.1"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Poznámka (volitelné)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Výjezd do hor, skvělé počasí…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Ukládám…' : 'Uložit výjezd'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Historie výjezdů</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Načítám…</p>
          ) : rides.length === 0 ? (
            <p className="text-sm text-gray-400">Zatím žádné výjezdy. Přidej první!</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rides.map((ride) => (
                <li key={ride.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(ride.date).toLocaleDateString('cs-CZ', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    {ride.notes && (
                      <p className="text-xs text-gray-400 mt-0.5">{ride.notes}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
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
