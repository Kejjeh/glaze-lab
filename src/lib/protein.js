// The protein axis. A "build" is a protein-agnostic recipe (a glaze, a rice
// base). applyProtein renders it with a chosen protein: the protein leads the
// ingredient list, and for air-fryer builds the cook time comes from the
// protein (salmon ≠ chicken thigh). Pantry gating then works on the protein for
// free, because the protein is now just another ingredient.
// For proteins with doneness `levels` (steak, salmon), swap in the chosen
// level's cook time + target internal temp. Falls back to the default level
// (or the first) for a missing id; a no-op for proteins without levels.
export function withDoneness(protein, levelId) {
  if (!protein.levels) return protein
  const level =
    protein.levels.find((l) => l.id === levelId) ??
    protein.levels.find((l) => l.default) ??
    protein.levels[0]
  return { ...protein, cookSeconds: level.cookSeconds, doneness: level.doneness }
}

export function applyProtein(build, protein) {
  const proteinIngredient = { item: protein.id, amount: protein.amount, unit: protein.unit }
  const airFryer = build.mode === 'air-fryer'
  return {
    ...build,
    // Air-fryer cook temp/time/doneness come from the protein (researched per
    // protein); rice-cooker builds keep whatever they defined.
    cookSeconds: airFryer ? protein.cookSeconds : build.cookSeconds,
    tempF: airFryer ? protein.tempF : build.tempF,
    doneness: airFryer ? protein.doneness : build.doneness,
    tip: airFryer ? protein.tip : build.tip,
    ingredients: [proteinIngredient, ...build.ingredients],
  }
}
