// Live meal runner: given a meal and seconds elapsed since Start, tag each step
// done/now/upcoming, and report the next step + countdown. The UI drives this
// off the same heartbeat as the cook timers.
import { orderedSteps } from './meals.js'

export function runnerState(meal, elapsedSeconds) {
  const steps = orderedSteps(meal).map((step) => ({ ...step, at: step.atMinute * 60 }))
  let currentIndex = -1
  let nextIndex = -1
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].at <= elapsedSeconds) currentIndex = i
    else {
      nextIndex = i
      break
    }
  }
  const lastAt = steps.length ? steps[steps.length - 1].at : 0
  const complete = elapsedSeconds >= lastAt
  const withStatus = steps.map((step, i) => ({
    ...step,
    status: i < currentIndex ? 'done' : i === currentIndex ? 'now' : 'upcoming',
  }))
  if (complete) withStatus.forEach((s) => (s.status = 'done'))
  return {
    steps: withStatus,
    currentIndex,
    nextIndex,
    secondsToNext: nextIndex >= 0 ? steps[nextIndex].at - elapsedSeconds : 0,
    complete,
  }
}
