// Export a meal plan as an .ics calendar — one short timed event per step, so
// your phone reminds you "add the broccoli" at the right moment.
const APP = { 'air-fryer': 'Air-fryer', 'rice-cooker': 'Rice-cooker', prep: 'Prep' }
const fmt = (ms) =>
  new Date(ms)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
const esc = (s) =>
  String(s)
    .replace(/([,;\\])/g, '\\$1')
    .replace(/\n/g, '\\n')

export function mealToICS(meal, startMs) {
  const stamp = fmt(startMs)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Glaze Lab//Meal Plan//EN',
    'CALSCALE:GREGORIAN',
  ]
  meal.steps.forEach((step, i) => {
    const at = startMs + step.atMinute * 60000
    lines.push(
      'BEGIN:VEVENT',
      `UID:${meal.id}-${i}@glaze-lab`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmt(at)}`,
      `DTEND:${fmt(at + 60000)}`,
      `SUMMARY:${esc(`${APP[step.appliance] ?? step.appliance} · ${step.text}`)}`,
      `DESCRIPTION:${esc(meal.name)}`,
      'END:VEVENT',
    )
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
