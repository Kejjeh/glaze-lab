// Pure countdown state machine for the per-card cook timer.
// The UI holds a timer object and calls tick() on a 1s interval.

export function createTimer(duration) {
  return { duration, remaining: duration, running: false, done: false }
}

export function start(t) {
  return { ...t, running: true }
}

export function pause(t) {
  return { ...t, running: false }
}

export function reset(t) {
  return createTimer(t.duration)
}

export function tick(t) {
  if (!t.running) return t
  const remaining = Math.max(0, t.remaining - 1)
  const done = remaining === 0
  return { ...t, remaining, done, running: !done }
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
