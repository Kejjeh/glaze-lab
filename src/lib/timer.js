// Wall-clock countdown for the per-card cook timer.
//
// A running timer stores the epoch ms when it will end; remaining time is
// DERIVED from the current time. This means it can never drift, even if the
// browser froze the tab (backgrounded app, throttled interval) — when we come
// back, remaining reflects true elapsed wall-clock time. All functions take an
// explicit `now` (ms) so the module stays pure and testable.

export function createTimer(duration) {
  return { duration, running: false, done: false, remaining: duration, endsAt: null }
}

export function remaining(t, now) {
  if (t.running) return Math.max(0, Math.ceil((t.endsAt - now) / 1000))
  return t.remaining
}

export function start(t, now) {
  if (t.done) return t
  return { ...t, running: true, endsAt: now + t.remaining * 1000 }
}

export function pause(t, now) {
  if (!t.running) return t
  return { ...t, running: false, remaining: remaining(t, now), endsAt: null }
}

export function reset(t) {
  return createTimer(t.duration)
}

// Heartbeat helper: flip a running timer to done once its end time passes.
export function settle(t, now) {
  if (t.running && now >= t.endsAt) {
    return { ...t, running: false, done: true, remaining: 0, endsAt: null }
  }
  return t
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
