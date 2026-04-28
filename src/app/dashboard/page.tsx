'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const [deleteError, setDeleteError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [yearlyGoal, setYearlyGoal] = useState(500)

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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedGoal = window.localStorage.getItem('cyklodenik-yearly-goal')
      if (storedGoal) {
        const parsedGoal = Number(storedGoal)
        if (Number.isFinite(parsedGoal) && parsedGoal > 0) {
          setYearlyGoal(parsedGoal)
        }
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

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

  async function handleDeleteRide(ride: Ride) {
    if (!userId || deletingId) return

    const formattedDate = formatRideDate(ride.date)
    const confirmed = window.confirm(
      `Smazat výjezd ${formattedDate} (${Number(ride.km).toFixed(1)} km)?`
    )
    if (!confirmed) return

    setDeletingId(ride.id)
    setDeleteError('')

    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('id', ride.id)
      .eq('user_id', userId)

    if (error) {
      setDeleteError(error.message)
    } else {
      setRides((currentRides) =>
        currentRides.filter((currentRide) => currentRide.id !== ride.id)
      )
    }

    setDeletingId(null)
  }

  function handleYearlyGoalChange(value: string) {
    const parsedGoal = Number(value)
    if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) return

    setYearlyGoal(parsedGoal)
    window.localStorage.setItem('cyklodenik-yearly-goal', String(parsedGoal))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  function parseRideDate(dateValue: string) {
    return new Date(`${dateValue}T12:00:00`)
  }

  function formatRideDate(dateValue: string) {
    return parseRideDate(dateValue).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const currentYear = new Date().getFullYear()

  const yearlyRides = useMemo(
    () =>
      rides.filter(
        (ride) => parseRideDate(ride.date).getFullYear() === currentYear
      ),
    [rides, currentYear]
  )

  const yearlyKm = yearlyRides.reduce((sum, ride) => sum + Number(ride.km), 0)
  const goalProgress = Math.min((yearlyKm / yearlyGoal) * 100, 100)

  const longestRide = rides.reduce<Ride | null>(
    (bestRide, ride) =>
      !bestRide || Number(ride.km) > Number(bestRide.km) ? ride : bestRide,
    null
  )

  const monthlyTotals = useMemo(() => {
    const totals = Array.from({ length: 12 }, (_, monthIndex) => ({
      monthIndex,
      label: new Date(currentYear, monthIndex, 1).toLocaleDateString('cs-CZ', {
        month: 'short',
      }),
      km: 0,
    }))

    yearlyRides.forEach((ride) => {
      const rideDate = parseRideDate(ride.date)
      totals[rideDate.getMonth()].km += Number(ride.km)
    })

    return totals
  }, [yearlyRides, currentYear])

  const maxMonthlyKm = Math.max(...monthlyTotals.map((month) => month.km), 1)

  const bestMonth = monthlyTotals.reduce((bestMonthSoFar, month) =>
    month.km > bestMonthSoFar.km ? month : bestMonthSoFar
  )

  const averageRideKm = yearlyRides.length > 0 ? yearlyKm / yearlyRides.length : 0

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
            Najeto letos
          </p>
          <div className="flex items-end gap-2">
            <p className="text-5xl font-bold text-white leading-none tabular-nums">
              {yearlyKm.toFixed(1)}
            </p>
            <span className="text-2xl font-light text-slate-400 mb-0.5">
              km
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2.5">
            <span className="text-slate-200 font-semibold">{yearlyRides.length}</span>
            {' '}
            {yearlyRides.length === 1 ? 'výjezd' : yearlyRides.length >= 2 && yearlyRides.length <= 4 ? 'výjezdy' : 'výjezdů'}
            {' v roce '}
            {currentYear}
          </p>
        </section>

        {/* Osobní rekordy */}
        <section
          aria-labelledby="records-heading"
          className="bg-[#13131e] rounded-2xl border border-white/10 px-5 py-5"
        >
          <h2
            id="records-heading"
            className="text-base font-semibold text-white mb-4"
          >
            Osobní rekordy
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                Nejdelší jízda
              </p>
              <p className="mt-2 text-xl font-bold text-blue-400 tabular-nums">
                {longestRide ? Number(longestRide.km).toFixed(1) : '0.0'}
              </p>
              <p className="text-xs text-slate-500">km</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                Nej měsíc
              </p>
              <p className="mt-2 text-xl font-bold text-emerald-400 tabular-nums">
                {bestMonth.km.toFixed(1)}
              </p>
              <p className="text-xs text-slate-500">{bestMonth.label}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                Průměr
              </p>
              <p className="mt-2 text-xl font-bold text-violet-400 tabular-nums">
                {averageRideKm.toFixed(1)}
              </p>
              <p className="text-xs text-slate-500">km / jízda</p>
            </div>
          </div>
        </section>

        {/* Roční cíl */}
        <section
          aria-labelledby="goal-heading"
          className="bg-[#13131e] rounded-2xl border border-white/10 px-5 py-5"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2
                id="goal-heading"
                className="text-base font-semibold text-white"
              >
                Roční cíl
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {goalProgress.toFixed(0)} % splněno
              </p>
            </div>
            <label className="w-28">
              <span className="sr-only">Roční cíl v kilometrech</span>
              <input
                type="number"
                min="1"
                step="50"
                value={yearlyGoal}
                onChange={(e) => handleYearlyGoalChange(e.target.value)}
                inputMode="numeric"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-base text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {yearlyKm.toFixed(1)} km z cíle {yearlyGoal.toFixed(0)} km
          </p>
        </section>

        {/* Graf po měsících */}
        <section
          aria-labelledby="chart-heading"
          className="bg-[#13131e] rounded-2xl border border-white/10 px-5 py-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="chart-heading"
              className="text-base font-semibold text-white"
            >
              Kilometry po měsících
            </h2>
            <span className="text-xs text-slate-500">{currentYear}</span>
          </div>
          <div className="h-40 flex items-end gap-1.5">
            {monthlyTotals.map((month) => {
              const height = month.km > 0 ? Math.max((month.km / maxMonthlyKm) * 100, 8) : 2

              return (
                <div
                  key={month.monthIndex}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-2"
                >
                  <div className="w-full h-28 flex items-end">
                    <div
                      title={`${month.label}: ${month.km.toFixed(1)} km`}
                      className="w-full rounded-t-md bg-blue-500/80 min-h-0"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase">
                    {month.label.replace('.', '')}
                  </span>
                </div>
              )
            })}
          </div>
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
          {deleteError && (
            <p role="alert" className="text-sm text-red-400 leading-relaxed mb-3">
              {deleteError}
            </p>
          )}
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
                      {formatRideDate(ride.date)}
                    </p>
                    {ride.notes && (
                      <p className="text-xs text-slate-500 mt-1 leading-snug truncate">
                        {ride.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-bold text-blue-400 tabular-nums">
                      {Number(ride.km).toFixed(1)} km
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRide(ride)}
                      disabled={deletingId === ride.id}
                      className="rounded-lg px-2.5 py-2 text-xs font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25 disabled:opacity-40 transition-colors"
                      aria-label={`Smazat výjezd ${formatRideDate(ride.date)}`}
                    >
                      {deletingId === ride.id ? 'Mažu…' : 'Smazat'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
