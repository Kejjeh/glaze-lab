import { describe, it, expect } from 'vitest'
import { orderedSteps, elapsedLabel } from './meals.js'

describe('orderedSteps', () => {
  it('sorts a meal’s steps by their start minute (stable)', () => {
    const meal = {
      steps: [
        { atMinute: 30, appliance: 'rice-cooker', text: 'add broccoli' },
        { atMinute: 0, appliance: 'rice-cooker', text: 'start rice' },
        { atMinute: 0, appliance: 'air-fryer', text: 'preheat' },
        { atMinute: 31, appliance: 'air-fryer', text: 'air-fry salmon' },
      ],
    }
    expect(orderedSteps(meal).map((s) => s.text)).toEqual([
      'start rice',
      'preheat', // same minute as "start rice" → original order preserved
      'add broccoli',
      'air-fry salmon',
    ])
  })
})

describe('elapsedLabel', () => {
  it('labels the start and sub-hour offsets in minutes', () => {
    expect(elapsedLabel(0)).toBe('start')
    expect(elapsedLabel(30)).toBe('30 min')
  })

  it('labels hour-plus offsets as h/m', () => {
    expect(elapsedLabel(90)).toBe('1h 30m')
    expect(elapsedLabel(420)).toBe('7h')
  })
})
