import { describe, it, expect } from 'vitest'
import { GLAZE, RICE, PANTRY, STAPLES } from './recipes.js'

const pantryIds = new Set(PANTRY.map((p) => p.id))
const allowed = new Set([...pantryIds, ...STAPLES])
const dishes = [...GLAZE, ...RICE]

describe('recipe data integrity', () => {
  it('has 10 air-fryer glaze builds and 24 rice-cooker dishes', () => {
    expect(GLAZE).toHaveLength(10)
    expect(RICE).toHaveLength(24)
  })

  it('gives every dish a unique id', () => {
    const ids = dishes.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('tags every dish with its correct mode', () => {
    expect(GLAZE.every((d) => d.mode === 'air-fryer')).toBe(true)
    expect(RICE.every((d) => d.mode === 'rice-cooker')).toBe(true)
  })

  it('references only known pantry items or staples in ingredients', () => {
    for (const d of dishes) {
      for (const ing of d.ingredients) {
        expect(allowed.has(ing.item), `${d.id} uses unknown item "${ing.item}"`).toBe(true)
      }
    }
  })

  it('gives every air-fryer glaze build a positive cook timer', () => {
    expect(GLAZE.every((d) => Number.isInteger(d.cookSeconds) && d.cookSeconds > 0)).toBe(true)
  })

  it('gives every dish a name, lane, an ingredient, and a step', () => {
    for (const d of dishes) {
      expect(typeof d.name, `${d.id} name`).toBe('string')
      expect(d.name.length, `${d.id} name length`).toBeGreaterThan(0)
      expect(typeof d.lane, `${d.id} lane`).toBe('string')
      expect(d.ingredients.length, `${d.id} ingredients`).toBeGreaterThan(0)
      expect(d.steps.length, `${d.id} steps`).toBeGreaterThan(0)
    }
  })

  it('gives every ingredient an item, amount, and unit', () => {
    for (const d of dishes) {
      for (const ing of d.ingredients) {
        expect(typeof ing.item, `${d.id} item`).toBe('string')
        expect(typeof ing.amount, `${d.id} amount`).toBe('number')
        expect(typeof ing.unit, `${d.id} unit`).toBe('string')
      }
    }
  })
})
