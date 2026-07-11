import { describe, it, expect } from 'vitest'
import { mealToICS } from './ics.js'

const meal = {
  id: 'm-x',
  name: 'Test Meal',
  totalMinutes: 40,
  steps: [
    { atMinute: 0, appliance: 'rice-cooker', text: 'start rice' },
    { atMinute: 31, appliance: 'air-fryer', text: 'air-fry salmon' },
  ],
}
const start = Date.UTC(2026, 6, 2, 18, 0, 0) // 2026-07-02 18:00:00 UTC

describe('mealToICS', () => {
  it('wraps the plan in a VCALENDAR', () => {
    const ics = mealToICS(meal, start)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('emits one timed VEVENT per step at the right offset', () => {
    const ics = mealToICS(meal, start)
    expect((ics.match(/BEGIN:VEVENT/g) || []).length).toBe(2)
    expect(ics).toContain('DTSTART:20260702T180000Z') // minute 0
    expect(ics).toContain('DTSTART:20260702T183100Z') // minute 31
    expect(ics).toContain('start rice')
  })
})
