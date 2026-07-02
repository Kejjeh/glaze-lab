import { describe, it, expect } from 'vitest'
import { GLAZE, RICE, PANTRY, STAPLES, PROTEINS } from './recipes.js'

const pantryIds = new Set(PANTRY.map((p) => p.id))
const allowed = new Set([...pantryIds, ...STAPLES])
const dishes = [...GLAZE, ...RICE]

describe('recipe data integrity', () => {
  it('has 10 air-fryer glaze builds and 27 rice-cooker dishes', () => {
    expect(GLAZE).toHaveLength(10)
    expect(RICE).toHaveLength(27)
  })

  it('gives every rice-cooker dish a COSORI function (cooker)', () => {
    for (const d of RICE) {
      expect(typeof d.cooker === 'string' && d.cooker.length > 0, `${d.id} cooker`).toBe(true)
    }
  })

  it('gives every dish a unique id', () => {
    const ids = dishes.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('tags every dish with its correct mode', () => {
    expect(GLAZE.every((d) => d.mode === 'air-fryer')).toBe(true)
    expect(RICE.every((d) => d.mode === 'rice-cooker')).toBe(true)
  })

  it('references only known pantry items or staples in base ingredients', () => {
    for (const d of dishes) {
      for (const ing of d.ingredients) {
        expect(allowed.has(ing.item), `${d.id} uses unknown item "${ing.item}"`).toBe(true)
      }
    }
  })

  it('makes every air-fryer glaze protein-swappable (so it gets a cook timer)', () => {
    expect(GLAZE.every((d) => d.usesProtein === true)).toBe(true)
  })

  it('leaves the protein out of a build base — it is injected at render', () => {
    const proteinIds = new Set(PROTEINS.map((p) => p.id))
    for (const d of dishes) {
      for (const ing of d.ingredients) {
        expect(proteinIds.has(ing.item), `${d.id} hard-codes protein "${ing.item}"`).toBe(false)
      }
    }
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

describe('proteins', () => {
  it('offers salmon plus at least three other proteins', () => {
    expect(PROTEINS.length).toBeGreaterThanOrEqual(4)
    expect(PROTEINS.some((p) => p.id === 'salmon')).toBe(true)
  })

  it('makes every protein a real pantry item with researched air-fryer cook data', () => {
    for (const p of PROTEINS) {
      expect(pantryIds.has(p.id), `${p.id} not in pantry`).toBe(true)
      expect(Number.isInteger(p.cookSeconds) && p.cookSeconds > 0, `${p.id} cookSeconds`).toBe(true)
      expect(Number.isInteger(p.tempF) && p.tempF >= 180 && p.tempF <= 400, `${p.id} tempF`).toBe(
        true,
      )
      expect(typeof p.doneness === 'string' && p.doneness.length > 0, `${p.id} doneness`).toBe(true)
      expect(typeof p.tip === 'string' && p.tip.length > 0, `${p.id} tip`).toBe(true)
      expect(typeof p.amount, `${p.id} amount`).toBe('number')
      expect(typeof p.unit, `${p.id} unit`).toBe('string')
    }
  })

  it('has some protein-swappable rice bowls and some fixed veg/plain ones', () => {
    expect(RICE.some((d) => d.usesProtein === true)).toBe(true)
    expect(RICE.some((d) => !d.usesProtein)).toBe(true)
  })
})
