import { describe, it, expect } from 'vitest'
import { runnerState } from './runner.js'

const meal = {
  totalMinutes: 40,
  steps: [
    { atMinute: 0, appliance: 'rice-cooker', text: 'start rice' },
    { atMinute: 30, appliance: 'rice-cooker', text: 'add broccoli' },
    { atMinute: 31, appliance: 'air-fryer', text: 'air-fry salmon' },
    { atMinute: 40, appliance: 'prep', text: 'plate' },
  ],
}

describe('runnerState', () => {
  it('at the start, the first step is now and the next is upcoming', () => {
    const s = runnerState(meal, 0)
    expect(s.currentIndex).toBe(0)
    expect(s.nextIndex).toBe(1)
    expect(s.secondsToNext).toBe(30 * 60)
    expect(s.complete).toBe(false)
    expect(s.steps[0].status).toBe('now')
    expect(s.steps[1].status).toBe('upcoming')
  })

  it('advances the current step and counts down to the next as time passes', () => {
    const s = runnerState(meal, 30 * 60 + 5) // 5s past the 30-min step
    expect(s.currentIndex).toBe(1)
    expect(s.nextIndex).toBe(2) // salmon at 31 min
    expect(s.secondsToNext).toBe(55)
    expect(s.steps[0].status).toBe('done')
    expect(s.steps[1].status).toBe('now')
  })

  it('is complete once the last step time passes', () => {
    const s = runnerState(meal, 41 * 60)
    expect(s.complete).toBe(true)
    expect(s.nextIndex).toBe(-1)
    expect(s.secondsToNext).toBe(0)
    expect(s.steps.every((x) => x.status === 'done')).toBe(true)
  })
})
