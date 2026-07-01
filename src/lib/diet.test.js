import { describe, it, expect } from 'vitest'
import { dietTags, matchesDiet } from './diet.js'

const dish = (...items) => ({ ingredients: items.map((item) => ({ item })) })

describe('dietTags (derived from ingredients)', () => {
  it('tags a fish dish pescatarian only', () => {
    expect(dietTags(dish('salmon', 'miso'))).toEqual(['pescatarian'])
  })

  it('tags a plant-only, gluten-free dish with the full stack', () => {
    expect(dietTags(dish('tofu', 'garlic'))).toEqual([
      'pescatarian',
      'vegetarian',
      'vegan',
      'gluten-free',
    ])
  })

  it('lets egg/dairy be vegetarian but not vegan; soy sauce removes gluten-free', () => {
    expect(dietTags(dish('egg', 'rice', 'soy'))).toEqual(['pescatarian', 'vegetarian'])
  })

  it('never tags a chicken dish pescatarian/vegetarian/vegan', () => {
    expect(dietTags(dish('chickenthigh', 'stock'))).toEqual(['gluten-free'])
  })
})

describe('matchesDiet', () => {
  it('passes every dish for the "all" filter', () => {
    expect(matchesDiet(dish('chicken'), 'all')).toBe(true)
  })

  it('matches when the dish carries the requested tag', () => {
    expect(matchesDiet(dish('tofu'), 'vegan')).toBe(true)
    expect(matchesDiet(dish('salmon'), 'vegan')).toBe(false)
  })
})
