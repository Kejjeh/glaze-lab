import { describe, it, expect } from 'vitest'
import { MEALS } from './meals.js'

const APPLIANCES = new Set(['air-fryer', 'rice-cooker', 'prep'])

describe('meal data integrity', () => {
  it('provides several coordinated meal plans with unique ids', () => {
    expect(MEALS.length).toBeGreaterThanOrEqual(6)
    const ids = MEALS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every meal a name, blurb, serves, a positive total time, and steps', () => {
    for (const m of MEALS) {
      expect(typeof m.name === 'string' && m.name.length > 0, `${m.id} name`).toBe(true)
      expect(typeof m.blurb === 'string' && m.blurb.length > 0, `${m.id} blurb`).toBe(true)
      expect(typeof m.serves, `${m.id} serves`).toBe('string')
      expect(Number.isFinite(m.totalMinutes) && m.totalMinutes > 0, `${m.id} total`).toBe(true)
      expect(m.steps.length, `${m.id} steps`).toBeGreaterThan(0)
    }
  })

  it('gives every step a valid minute, a known appliance, and text', () => {
    for (const m of MEALS) {
      for (const s of m.steps) {
        expect(Number.isFinite(s.atMinute) && s.atMinute >= 0, `${m.id} atMinute`).toBe(true)
        expect(APPLIANCES.has(s.appliance), `${m.id} appliance "${s.appliance}"`).toBe(true)
        expect(typeof s.text === 'string' && s.text.length > 0, `${m.id} text`).toBe(true)
      }
    }
  })

  it('uses both appliances across the meal set', () => {
    const used = new Set(MEALS.flatMap((m) => m.steps.map((s) => s.appliance)))
    expect(used.has('air-fryer')).toBe(true)
    expect(used.has('rice-cooker')).toBe(true)
  })
})
