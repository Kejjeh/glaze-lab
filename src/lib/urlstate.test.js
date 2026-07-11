import { describe, it, expect } from 'vitest'
import { encodeState, decodeState } from './urlstate.js'

describe('url state', () => {
  it('encodes only the meaningful (truthy, non-"all") keys', () => {
    const s = encodeState({
      mode: 'sides',
      protein: 'salmon',
      doneness: '',
      diet: 'all',
      lane: 'Veg',
    })
    const params = new URLSearchParams(s)
    expect(params.get('mode')).toBe('sides')
    expect(params.get('protein')).toBe('salmon')
    expect(params.get('lane')).toBe('Veg')
    expect(params.has('doneness')).toBe(false) // empty
    expect(params.has('diet')).toBe(false) // "all" default
  })

  it('decodes back into a plain object', () => {
    expect(decodeState('mode=sides&diet=vegan')).toEqual({ mode: 'sides', diet: 'vegan' })
  })

  it('round-trips', () => {
    const state = { mode: 'air-fryer', protein: 'steak', doneness: 'well' }
    expect(decodeState(encodeState(state))).toEqual(state)
  })

  it('tolerates a leading ? or # and empty input', () => {
    expect(decodeState('#mode=meals')).toEqual({ mode: 'meals' })
    expect(decodeState('')).toEqual({})
  })
})
