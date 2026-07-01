import { describe, it, expect } from 'vitest'
import { createTimer, start, tick, formatTime, pause, reset } from './timer.js'

describe('cook timer', () => {
  it('counts down one second per tick while running', () => {
    let t = start(createTimer(3))
    t = tick(t)
    expect(t.remaining).toBe(2)
  })

  it('does not count down until it has been started', () => {
    const t = createTimer(3) // created but not started
    expect(tick(t).remaining).toBe(3)
  })

  it('marks itself done and stops running when it reaches zero', () => {
    let t = start(createTimer(1))
    t = tick(t) // 1 -> 0
    expect(t.remaining).toBe(0)
    expect(t.done).toBe(true)
    expect(t.running).toBe(false)
  })

  it('never counts below zero, even with extra ticks after finishing', () => {
    let t = start(createTimer(1))
    t = tick(tick(t)) // reaches 0, then an extra stray tick
    expect(t.remaining).toBe(0)
  })

  it('formats remaining seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(600)).toBe('10:00')
  })

  it('pauses a running timer without losing remaining time', () => {
    let t = tick(start(createTimer(5))) // running, remaining 4
    t = pause(t)
    expect(t.running).toBe(false)
    expect(t.remaining).toBe(4)
  })

  it('resets back to the full duration, stopped and not done', () => {
    let t = tick(start(createTimer(5))) // remaining 4
    t = reset(t)
    expect(t.remaining).toBe(5)
    expect(t.running).toBe(false)
    expect(t.done).toBe(false)
  })
})
