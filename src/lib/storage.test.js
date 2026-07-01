import { describe, it, expect } from 'vitest'
import { STORAGE_KEY, loadOwned, saveOwned } from './storage.js'

function fakeStorage(seed) {
  const m = new Map(seed ? Object.entries(seed) : [])
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  }
}

describe('pantry persistence', () => {
  it('round-trips the owned set across a save and load', () => {
    const s = fakeStorage()
    saveOwned(['miso', 'honey'], s)
    expect(loadOwned(s)).toEqual(['miso', 'honey'])
  })

  it('writes under the versioned storage key', () => {
    const s = fakeStorage()
    saveOwned(['miso'], s)
    expect(s._map.has(STORAGE_KEY)).toBe(true)
  })

  it('returns null when nothing has been saved yet', () => {
    expect(loadOwned(fakeStorage())).toBeNull()
  })

  it('returns null instead of throwing on corrupt JSON', () => {
    const s = fakeStorage({ [STORAGE_KEY]: '{not valid json' })
    expect(loadOwned(s)).toBeNull()
  })

  it('returns null when the stored value is not an array', () => {
    const s = fakeStorage({ [STORAGE_KEY]: '{"miso":true}' })
    expect(loadOwned(s)).toBeNull()
  })
})
