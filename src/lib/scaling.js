// Batch scaling: multiply ingredient amounts by a batch factor.

// Round to 3 decimals, then let Number drop trailing zeros (0.3, not 0.300).
export function scaleAmount(amount, factor) {
  return Number((amount * factor).toFixed(3))
}

export function scaleIngredients(ingredients, factor) {
  return ingredients.map((ing) => ({
    ...ing,
    amount: scaleAmount(ing.amount, factor),
  }))
}

// Render an amount the way a cook reads it: ¾ tbsp, 1½ cups, 2.
const FRACTIONS = {
  0.25: '¼',
  0.5: '½',
  0.75: '¾',
  0.33: '⅓',
  0.34: '⅓',
  0.66: '⅔',
  0.67: '⅔',
}

export function formatAmount(n) {
  const whole = Math.floor(n)
  const frac = Number((n - whole).toFixed(2))
  const glyph = FRACTIONS[frac]
  if (glyph) return whole ? `${whole}${glyph}` : glyph
  return String(Number(n.toFixed(2)))
}
