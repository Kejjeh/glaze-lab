// Pantry persistence to localStorage (or any injected getItem/setItem store).
export const STORAGE_KEY = 'salmonlab.pantry.v1'

const defaultStore = () => (typeof localStorage !== 'undefined' ? localStorage : null)

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
