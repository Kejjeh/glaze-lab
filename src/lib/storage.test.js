import { describe, it, expect } from 'vitest'
import { STORAGE_KEY, loadOwned, saveOwned, loadArray, loadNumber } from './storage.js'

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

describe('corruption-safe readers', () => {
  it('loadArray returns the array, or the fallback for non-arrays and bad JSON', () => {
    expect(loadArray('k', [], { store: fakeStorage({ k: '["a","b"]' }) })).toEqual(['a', 'b'])
    expect(loadArray('k', [], { store: fakeStorage({ k: '5' }) })).toEqual([])
    expect(loadArray('k', [], { store: fakeStorage({ k: '{"a":1}' }) })).toEqual([])
    expect(loadArray('k', [], { store: fakeStorage({ k: '{bad' }) })).toEqual([])
    expect(loadArray('k', [], { store: fakeStorage() })).toEqual([])
  })

  it('loadArray drops entries the item validator rejects', () => {
    const store = fakeStorage({ k: '[{"id":"x","name":"ok"},{"id":"y"},7,null]' })
    const isItem = (g) => g && typeof g.id === 'string' && typeof g.name === 'string'
    expect(loadArray('k', [], { store, isItem })).toEqual([{ id: 'x', name: 'ok' }])
  })

  it('loadNumber returns finite numbers only', () => {
    expect(loadNumber('k', 0, fakeStorage({ k: '15' }))).toBe(15)
    expect(loadNumber('k', 0, fakeStorage({ k: '-8' }))).toBe(-8)
    expect(loadNumber('k', 0, fakeStorage({ k: 'abc' }))).toBe(0)
    expect(loadNumber('k', 0, fakeStorage({ k: 'Infinity' }))).toBe(0)
    expect(loadNumber('k', 0, fakeStorage({ k: '' }))).toBe(0)
    expect(loadNumber('k', 0, fakeStorage())).toBe(0)
  })
})
