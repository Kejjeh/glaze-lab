import { describe, it, expect } from 'vitest'
import { applyProtein } from './protein.js'

const build = {
  id: 'g-x',
  name: 'Test Glaze',
  mode: 'air-fryer',
  lane: 'Umami',
  usesProtein: true,
  ingredients: [{ item: 'miso', amount: 2, unit: 'tbsp' }],
  steps: ['Glaze and cook.'],
}
const salmon = {
  id: 'salmon',
  amount: 2,
  unit: 'fillets',
  cookSeconds: 540,
  tempF: 400,
  doneness: '125–130°F',
}
const chicken = {
  id: 'chickenthigh',
  amount: 2,
  unit: 'thighs',
  cookSeconds: 1020,
  tempF: 380,
  doneness: '175°F',
  tip: 'Skin-side down first',
}

describe('applyProtein', () => {
  it('prepends the chosen protein as the first ingredient', () => {
    const dish = applyProtein(build, salmon)
    expect(dish.ingredients[0]).toEqual({ item: 'salmon', amount: 2, unit: 'fillets' })
    expect(dish.ingredients.slice(1)).toEqual(build.ingredients)
  })

  it('takes its cook time from the protein for air-fryer builds', () => {
    expect(applyProtein(build, salmon).cookSeconds).toBe(540)
    expect(applyProtein(build, chicken).cookSeconds).toBe(1020)
  })

  it('keeps the build name, lane and steps intact', () => {
    const dish = applyProtein(build, chicken)
    expect(dish.name).toBe('Test Glaze')
    expect(dish.lane).toBe('Umami')
    expect(dish.steps).toEqual(build.steps)
  })

  it('carries the air-fryer temperature, doneness target and prep tip onto the dish', () => {
    const dish = applyProtein(build, chicken)
    expect(dish.tempF).toBe(380)
    expect(dish.doneness).toBe('175°F')
    expect(dish.tip).toBe('Skin-side down first')
  })

  it('does not give rice-cooker builds a cook timer, temp, or doneness', () => {
    const riceBuild = { ...build, mode: 'rice-cooker', cookSeconds: undefined }
    const dish = applyProtein(riceBuild, salmon)
    expect(dish.cookSeconds).toBeUndefined()
    expect(dish.tempF).toBeUndefined()
    expect(dish.doneness).toBeUndefined()
  })
})
