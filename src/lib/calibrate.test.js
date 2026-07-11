import { describe, it, expect } from 'vitest'
import { calibrateSeconds } from './calibrate.js'

describe('calibrateSeconds', () => {
  it('is a no-op at 0%', () => {
    expect(calibrateSeconds(600, 0)).toBe(600)
  })

  it('shortens time when the unit runs hot (negative %)', () => {
    expect(calibrateSeconds(600, -15)).toBe(510)
  })

  it('lengthens time when the unit runs cold (positive %)', () => {
    expect(calibrateSeconds(600, 10)).toBe(660)
  })

  it('rounds to the nearest 5 seconds', () => {
    expect(calibrateSeconds(485, 10)).toBe(535) // 533.5 → 535
  })
})
