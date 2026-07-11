// Per-unit calibration. Air-fryer set temps drift and every basket differs, so
// the user can tell the app "mine runs hot" (negative %) or "cold" (positive %)
// and every cook time shifts to match. Rounded to a tidy 5 seconds.
export function calibrateSeconds(seconds, pct) {
  return Math.round((seconds * (1 + pct / 100)) / 5) * 5
}
