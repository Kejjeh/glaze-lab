// Cook-session persistence: the running/paused/finished cook timers and the
// live meal runner survive a reload, a killed PWA tab, or a phone restart.
//
// Everything here is pure and takes an explicit `now` so recovery is
// deterministic and testable. The stored shape is validated field by field:
// a corrupt entry is dropped, corrupt JSON yields a `corrupt` status (the UI
// tells the cook their saved session was cleared), and a session older than
// `maxAgeMs` is treated as stale rather than resumed days later.
import { remaining as timerRemaining } from './timer.js'

export const SESSION_KEY = 'glazelab.session.v1'
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000
// A saved-at stamp this far in the future means the system clock was set back
// while the app was closed; anything under it is ordinary skew.
const FUTURE_TOLERANCE_MS = 5 * 1000

const defaultStore = () => (typeof localStorage !== 'undefined' ? localStorage : null)
const isFiniteNum = (n) => typeof n === 'number' && Number.isFinite(n)
const isNonNegInt = (n) => isFiniteNum(n) && n >= 0 && Number.isInteger(n)

// Only timers with state worth keeping are saved: idle, full-duration timers
// are re-derived from the recipe on the next render.
export function worthSaving(t) {
  return t.running || t.done || t.remaining !== t.duration
}

export function serializeSession({ timers = {}, runningMeal = null }, now) {
  const out = {}
  for (const [id, t] of Object.entries(timers)) {
    if (!worthSaving(t)) continue
    out[id] = {
      duration: t.duration,
      running: !!t.running,
      done: !!t.done,
      remaining: t.remaining,
      endsAt: t.running ? t.endsAt : null,
    }
  }
  return {
    v: 1,
    savedAt: now,
    timers: out,
    meal: runningMeal ? { mealId: runningMeal.mealId, startedAt: runningMeal.startedAt } : null,
  }
}

// Validate one stored timer; returns a clean timer or null if it is unusable.
function sanitizeTimer(raw, now, delta = 0) {
  if (!raw || typeof raw !== 'object') return null
  const { duration } = raw
  if (!isNonNegInt(duration)) return null
  if (raw.done) return { duration, running: false, done: true, remaining: 0, endsAt: null }
  if (raw.running) {
    if (!isFiniteNum(raw.endsAt)) return null
    // A clock set back while closed can leave endsAt further out than the
    // whole cook; never show more time than the recipe asked for.
    const endsAt = Math.min(raw.endsAt + delta, now + duration * 1000)
    const t = { duration, running: true, done: false, remaining: duration, endsAt }
    return { ...t, remaining: timerRemaining(t, now) }
  }
  if (!isNonNegInt(raw.remaining) || raw.remaining > duration) return null
  return { duration, running: false, done: false, remaining: raw.remaining, endsAt: null }
}

// Shift every wall-clock anchor by deltaMs (negative when the clock went
// backwards). Remaining time and elapsed progress are preserved exactly.
export function shiftClock({ timers = {}, runningMeal = null }, deltaMs) {
  const shifted = {}
  for (const [id, t] of Object.entries(timers)) {
    shifted[id] = t.running && t.endsAt != null ? { ...t, endsAt: t.endsAt + deltaMs } : t
  }
  return {
    timers: shifted,
    runningMeal: runningMeal
      ? { ...runningMeal, startedAt: runningMeal.startedAt + deltaMs }
      : null,
  }
}

// raw: the parsed stored value (or the JSON string), or null when nothing saved.
// Returns { timers, runningMeal, status, restored } where status is one of
// 'none' | 'ok' | 'corrupt' | 'stale' and restored counts what came back.
export function restoreSession(
  raw,
  { now, mealIds = [], dishIds = null, maxAgeMs = SESSION_MAX_AGE_MS },
) {
  const empty = (status) => ({
    timers: {},
    runningMeal: null,
    status,
    restored: { timers: 0, mealId: null },
  })
  if (raw == null) return empty('none')
  let data = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      return empty('corrupt')
    }
  }
  if (!data || typeof data !== 'object' || data.v !== 1 || !isFiniteNum(data.savedAt)) {
    return empty('corrupt')
  }
  if (now - data.savedAt > maxAgeMs) return empty('stale')

  // The clock moved backwards while the app was closed (the save stamp is in
  // the future): treat the gap as zero elapsed time rather than freezing every
  // countdown for the difference.
  const delta = data.savedAt > now + FUTURE_TOLERANCE_MS ? now - data.savedAt : 0
  const session = { timers: {}, runningMeal: null }
  const timers = data.timers && typeof data.timers === 'object' ? data.timers : {}
  const known = dishIds ? new Set(dishIds) : null
  for (const [id, rawT] of Object.entries(timers)) {
    if (known && !known.has(id)) continue
    const t = sanitizeTimer(rawT, now, delta)
    if (t) session.timers[id] = t
  }
  const m = data.meal
  if (m && typeof m === 'object' && mealIds.includes(m.mealId) && isFiniteNum(m.startedAt)) {
    session.runningMeal = { mealId: m.mealId, startedAt: Math.min(now, m.startedAt + delta) }
  }
  const nTimers = Object.keys(session.timers).length
  const mealId = session.runningMeal?.mealId ?? null
  const status = nTimers || mealId ? 'ok' : data.timers || data.meal ? 'none' : 'corrupt'
  return {
    ...session,
    status: status === 'corrupt' ? 'none' : status,
    restored: { timers: nTimers, mealId },
  }
}

export function saveSession(state, now, store = defaultStore()) {
  if (!store) return
  try {
    const s = serializeSession(state, now)
    if (Object.keys(s.timers).length === 0 && !s.meal) store.removeItem(SESSION_KEY)
    else store.setItem(SESSION_KEY, JSON.stringify(s))
  } catch {
    /* quota / private mode — the live session still works, it just won't survive a reload */
  }
}

export function loadSession(store = defaultStore()) {
  if (!store) return null
  try {
    return store.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function clearSession(store = defaultStore()) {
  try {
    store?.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}
