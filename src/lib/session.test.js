import { describe, it, expect } from 'vitest'
import { createTimer, start, pause, settle, remaining } from './timer.js'
import {
  SESSION_KEY,
  SESSION_MAX_AGE_MS,
  serializeSession,
  restoreSession,
  shiftClock,
  saveSession,
  loadSession,
  worthSaving,
} from './session.js'

const S = 1000
const T0 = 1_800_000_000_000 // an arbitrary epoch ms
const MEALS = ['m-salmon-rice-broccoli', 'm-wings-potatoes']

function fakeStorage(seed) {
  const m = new Map(seed ? Object.entries(seed) : [])
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  }
}

const roundTrip = (state, savedAt, now, opts = {}) =>
  restoreSession(JSON.stringify(serializeSession(state, savedAt)), { now, mealIds: MEALS, ...opts })

describe('cook session — reload recovery', () => {
  it('a running timer resumes from true wall-clock elapsed time after a reload', () => {
    const timers = { g1: start(createTimer(480), T0) }
    const r = roundTrip({ timers }, T0 + 10 * S, T0 + 90 * S) // 90s of real time passed
    expect(r.status).toBe('ok')
    expect(r.restored).toEqual({ timers: 1, mealId: null })
    expect(r.timers.g1.running).toBe(true)
    expect(remaining(r.timers.g1, T0 + 90 * S)).toBe(390)
  })

  it('a paused timer keeps its frozen remaining time however long the app was closed', () => {
    const timers = { g1: pause(start(createTimer(480), T0), T0 + 20 * S) } // 460 left
    const r = roundTrip({ timers }, T0 + 20 * S, T0 + 3600 * S)
    expect(r.timers.g1.running).toBe(false)
    expect(remaining(r.timers.g1, T0 + 3600 * S)).toBe(460)
  })

  it('a timer that expired while the app was closed comes back running at 0 so the heartbeat settles it', () => {
    const timers = { g1: start(createTimer(60), T0) }
    const r = roundTrip({ timers }, T0, T0 + 600 * S)
    expect(remaining(r.timers.g1, T0 + 600 * S)).toBe(0)
    expect(settle(r.timers.g1, T0 + 600 * S).done).toBe(true)
  })

  it('a finished timer stays finished', () => {
    const timers = { g1: settle(start(createTimer(5), T0), T0 + 9 * S) }
    const r = roundTrip({ timers }, T0 + 9 * S, T0 + 20 * S)
    expect(r.timers.g1).toMatchObject({ done: true, running: false, remaining: 0 })
  })

  it('the meal runner resumes with its original start time', () => {
    const runningMeal = { mealId: MEALS[0], startedAt: T0 }
    const r = roundTrip({ runningMeal }, T0 + 5 * S, T0 + 600 * S)
    expect(r.runningMeal).toEqual(runningMeal)
    expect(r.restored.mealId).toBe(MEALS[0])
  })

  it('does not save idle full-duration timers, and clears the key when nothing is worth keeping', () => {
    const store = fakeStorage()
    const timers = { idle: createTimer(480), live: start(createTimer(480), T0) }
    expect(worthSaving(timers.idle)).toBe(false)
    saveSession({ timers }, T0, store)
    expect(Object.keys(JSON.parse(store.getItem(SESSION_KEY)).timers)).toEqual(['live'])
    saveSession({ timers: { idle: createTimer(480) }, runningMeal: null }, T0, store)
    expect(store.getItem(SESSION_KEY)).toBeNull()
    expect(loadSession(store)).toBeNull()
  })
})

describe('cook session — corruption and staleness', () => {
  it('reports nothing to restore when the key is absent', () => {
    expect(restoreSession(null, { now: T0 }).status).toBe('none')
  })

  it('reports corrupt (never throws) on bad JSON, wrong shape, or wrong version', () => {
    for (const raw of ['{not json', '5', '[]', 'null', '{"v":2,"savedAt":1}', '{"v":1}']) {
      const r = restoreSession(raw, { now: T0, mealIds: MEALS })
      expect(r.status, raw).toBe('corrupt')
      expect(r.timers).toEqual({})
      expect(r.runningMeal).toBeNull()
    }
  })

  it('drops individual broken timers but keeps the good ones', () => {
    const raw = {
      v: 1,
      savedAt: T0,
      timers: {
        ok: { duration: 60, running: false, done: false, remaining: 30, endsAt: null },
        nanDuration: { duration: NaN, running: false, done: false, remaining: 0 },
        noEnd: { duration: 60, running: true, done: false, remaining: 60, endsAt: 'soon' },
        overRemaining: { duration: 60, running: false, done: false, remaining: 999 },
        notObject: 7,
      },
      meal: null,
    }
    const r = restoreSession(raw, { now: T0 + S, mealIds: MEALS })
    expect(Object.keys(r.timers)).toEqual(['ok'])
    expect(r.status).toBe('ok')
  })

  it('drops timers for dishes that no longer exist and meals with unknown ids', () => {
    const raw = {
      v: 1,
      savedAt: T0,
      timers: { gone: { duration: 60, running: false, done: false, remaining: 30, endsAt: null } },
      meal: { mealId: 'm-deleted', startedAt: T0 },
    }
    const r = restoreSession(raw, { now: T0, mealIds: MEALS, dishIds: ['g1'] })
    expect(r.timers).toEqual({})
    expect(r.runningMeal).toBeNull()
    expect(r.status).toBe('none')
  })

  it('treats a session older than the max age as stale instead of resuming it', () => {
    const state = { timers: { g1: pause(start(createTimer(480), T0), T0 + S) } }
    const r = roundTrip(state, T0, T0 + SESSION_MAX_AGE_MS + S)
    expect(r.status).toBe('stale')
    expect(r.timers).toEqual({})
  })
})

describe('cook session — system clock changes', () => {
  it('remaining never exceeds the recipe duration when the clock is set backwards', () => {
    const t = start(createTimer(480), T0)
    expect(remaining(t, T0 - 3600 * S)).toBe(480)
  })

  it('shiftClock preserves remaining time and meal progress exactly', () => {
    const state = {
      timers: {
        g1: start(createTimer(480), T0),
        p: pause(start(createTimer(60), T0), T0 + 10 * S),
      },
      runningMeal: { mealId: MEALS[0], startedAt: T0 },
    }
    const back = -3600 * S // the clock jumped back an hour at T0+30s
    const shifted = shiftClock(state, back)
    const nowAfter = T0 + 30 * S + back
    expect(remaining(shifted.timers.g1, nowAfter)).toBe(450)
    expect(shifted.timers.p).toBe(state.timers.p) // paused timers untouched
    expect((nowAfter - shifted.runningMeal.startedAt) / S).toBe(30)
  })

  it('a session saved "in the future" (clock set back while closed) resumes as if no time passed', () => {
    const savedAt = T0 + 3600 * S
    const state = {
      timers: { g1: start(createTimer(480), savedAt - 100 * S) }, // 380 left when saved
      runningMeal: { mealId: MEALS[0], startedAt: savedAt - 100 * S },
    }
    const r = roundTrip(state, savedAt, T0)
    expect(r.status).toBe('ok')
    expect(remaining(r.timers.g1, T0)).toBe(380)
    expect((T0 - r.runningMeal.startedAt) / S).toBe(100)
  })

  it('clamps a running timer whose end is impossibly far out, and a meal start in the future', () => {
    const raw = {
      v: 1,
      savedAt: T0,
      timers: {
        g1: { duration: 480, running: true, done: false, remaining: 480, endsAt: T0 + 9999 * S },
      },
      meal: { mealId: MEALS[0], startedAt: T0 + 3 * S },
    }
    const r = restoreSession(raw, { now: T0, mealIds: MEALS })
    expect(remaining(r.timers.g1, T0)).toBe(480)
    expect(r.runningMeal.startedAt).toBe(T0)
  })
})
