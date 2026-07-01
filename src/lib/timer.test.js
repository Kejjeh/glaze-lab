import { describe, it, expect } from 'vitest'
import { createTimer, start, pause, reset, remaining, settle, formatTime } from './timer.js'

const S = 1000 // ms per second

describe('cook timer (wall-clock)', () => {
  it('starts stopped, not done, showing the full duration', () => {
    const t = createTimer(540)
    expect(t.running).toBe(false)
    expect(t.done).toBe(false)
    expect(remaining(t, 0)).toBe(540)
  })

  it('counts down by real elapsed time while running — no drift', () => {
    const t = start(createTimer(60), 10 * S)
    expect(remaining(t, 10 * S)).toBe(60)
    expect(remaining(t, 13 * S)).toBe(57) // 3s of wall clock later
    // Even if the tab was frozen for a while, it reflects true elapsed time.
    expect(remaining(t, 40 * S)).toBe(30)
  })

  it('never reports below zero', () => {
    const t = start(createTimer(5), 0)
    expect(remaining(t, 999 * S)).toBe(0)
  })

  it('settles to done once the end time passes, and stops running', () => {
    const t = start(createTimer(5), 0)
    expect(settle(t, 2 * S).done).toBe(false)
    const finished = settle(t, 5 * S)
    expect(finished.done).toBe(true)
    expect(finished.running).toBe(false)
    expect(remaining(finished, 9 * S)).toBe(0)
  })

  it('freezes remaining time when paused', () => {
    const t = start(createTimer(60), 0)
    const paused = pause(t, 20 * S) // 20s elapsed → 40 left
    expect(paused.running).toBe(false)
    expect(remaining(paused, 999 * S)).toBe(40) // clock is frozen
  })

  it('resumes from the frozen time when started again', () => {
    const paused = pause(start(createTimer(60), 0), 20 * S) // 40 left
    const resumed = start(paused, 100 * S) // restart the clock at t=100s
    expect(remaining(resumed, 100 * S)).toBe(40)
    expect(remaining(resumed, 110 * S)).toBe(30)
  })

  it('resets back to the full duration, stopped and not done', () => {
    const t = settle(start(createTimer(5), 0), 9 * S) // finished
    const fresh = reset(t)
    expect(remaining(fresh, 0)).toBe(5)
    expect(fresh.running).toBe(false)
    expect(fresh.done).toBe(false)
  })

  it('formats remaining seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(600)).toBe('10:00')
  })
})
