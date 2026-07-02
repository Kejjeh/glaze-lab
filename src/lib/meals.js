// Meal timing plans: a meal is a set of time-stamped steps across the two
// appliances. These helpers order the timeline and label offsets for display.

// Stable sort by start minute (steps may be authored per-appliance, out of order).
export function orderedSteps(meal) {
  return meal.steps
    .map((step, i) => ({ step, i }))
    .sort((a, b) => a.step.atMinute - b.step.atMinute || a.i - b.i)
    .map(({ step }) => step)
}

// 0 → "start", 30 → "30 min", 90 → "1h 30m", 420 → "7h".
export function elapsedLabel(minutes) {
  if (minutes === 0) return 'start'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
