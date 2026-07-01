import { describe, it, expect } from 'vitest'
import { missingIngredients, isAvailable } from './pantry.js'

const misoGlaze = {
  id: 'miso-glaze',
  ingredients: [
    { item: 'miso', amount: 2, unit: 'tbsp' },
    { item: 'salmon', amount: 1, unit: 'fillet' },
    { item: 'salt', amount: 1, unit: 'pinch' }, // staple: not pantry-tracked
  ],
}
const pantry = ['miso', 'salmon', 'honey'] // the toggleable ingredient list

describe('pantry gating', () => {
  it('reports the tracked ingredients the cook does not own as missing', () => {
    const owned = new Set(['salmon']) // has salmon, is out of miso
    expect(missingIngredients(misoGlaze, owned, pantry)).toEqual(['miso'])
  })

  it('is unavailable while any tracked ingredient is missing', () => {
    const owned = new Set(['salmon'])
    expect(isAvailable(misoGlaze, owned, pantry)).toBe(false)
  })

  it('is available once every tracked ingredient is owned', () => {
    const owned = new Set(['salmon', 'miso']) // salt is a staple, not required
    expect(isAvailable(misoGlaze, owned, pantry)).toBe(true)
  })
})
