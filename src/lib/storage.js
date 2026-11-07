// Pantry persistence to localStorage (or any injected getItem/setItem store),
// plus corruption-safe readers for the other versioned keys. A bad or
// hand-edited value must never take the app down: it falls back instead.
export const STORAGE_KEY = 'glazelab.pantry.v1'

const defaultStore = () => (typeof localStorage !== 'undefined' ? localStorage : null)

// Read a JSON array; non-arrays and bad JSON give `fallback`. When `isItem`
// is given, entries it rejects are dropped so one broken item can't poison
// the rest.
export function loadArray(key, fallback = [], { store = defaultStore(), isItem = null } = {}) {
  if (!store) return fallback
  try {
    const parsed = JSON.parse(store.getItem(key))
    if (!Array.isArray(parsed)) return fallback
    return isItem ? parsed.filter((x) => isItem(x)) : parsed
  } catch {
    return fallback
  }
}

// Read a finite number; anything else (missing, "abc", NaN) gives `fallback`.
export function loadNumber(key, fallback, store = defaultStore()) {
  if (!store) return fallback
  try {
    const raw = store.getItem(key)
    if (raw == null || raw === '') return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  } catch {
    return fallback
  }
}

export function saveOwned(owned, store = defaultStore()) {
  if (!store) return
  store.setItem(STORAGE_KEY, JSON.stringify(owned))
}

export function loadOwned(store = defaultStore()) {
  if (!store) return null
  const raw = store.getItem(STORAGE_KEY)
  if (raw == null) return null
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}
