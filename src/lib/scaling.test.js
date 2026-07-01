import { describe, it, expect } from 'vitest'
import { scaleAmount, scaleIngredients, formatAmount } from './scaling.js'

describe('batch scaling', () => {
  it('multiplies an amount by the batch factor', () => {
    expect(scaleAmount(2, 3)).toBe(6)
  })

  it('rounds away binary-float noise to a clean cooking amount', () => {
    expect(scaleAmount(0.1, 3)).toBe(0.3)
    expect(scaleAmount(1, 1.5)).toBe(1.5)
  })

  it('scales every ingredient amount while preserving item and unit', () => {
    const ingredients = [
      { item: 'miso', amount: 2, unit: 'tbsp' },
      { item: 'honey', amount: 1, unit: 'tbsp' },
    ]
    expect(scaleIngredients(ingredients, 2)).toEqual([
      { item: 'miso', amount: 4, unit: 'tbsp' },
      { item: 'honey', amount: 2, unit: 'tbsp' },
    ])
  })
})

describe('amount formatting', () => {
  it('renders common cooking fractions as glyphs', () => {
    expect(formatAmount(0.5)).toBe('½')
    expect(formatAmount(0.25)).toBe('¼')
    expect(formatAmount(0.75)).toBe('¾')
    expect(formatAmount(0.33)).toBe('⅓')
    expect(formatAmount(1.5)).toBe('1½')
    expect(formatAmount(1.75)).toBe('1¾')
  })

  it('renders whole numbers plainly', () => {
    expect(formatAmount(2)).toBe('2')
    expect(formatAmount(10)).toBe('10')
  })
})
