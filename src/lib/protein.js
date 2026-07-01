// The protein axis. A "build" is a protein-agnostic recipe (a glaze, a rice
// base). applyProtein renders it with a chosen protein: the protein leads the
// ingredient list, and for air-fryer builds the cook time comes from the
// protein (salmon ≠ chicken thigh). Pantry gating then works on the protein for
// free, because the protein is now just another ingredient.
export function applyProtein(build, protein) {
  const proteinIngredient = { item: protein.id, amount: protein.amount, unit: protein.unit }
  const cookSeconds = build.mode === 'air-fryer' ? protein.cookSeconds : build.cookSeconds
  return {
    ...build,
    cookSeconds,
    ingredients: [proteinIngredient, ...build.ingredients],
  }
}
