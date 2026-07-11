// Share the current view via a URL hash. Encodes the meaningful selections;
// "all" and empty values are dropped so shared links stay short.
export function encodeState(state) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(state)) {
    if (value && value !== 'all') params.set(key, value)
  }
  return params.toString()
}

export function decodeState(str) {
  const cleaned = String(str || '').replace(/^[?#]/, '')
  const out = {}
  for (const [key, value] of new URLSearchParams(cleaned)) out[key] = value
  return out
}
