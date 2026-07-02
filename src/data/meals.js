// Meal timing plans — coordinated start-to-plate sequences that run the COSORI
// rice cooker and the Innsky air fryer together. Times/temps are from the
// appliance research; `atMinute` is minutes from the start of the meal.
export const MEALS = [
  {
    id: 'm-salmon-rice-broccoli',
    name: 'Salmon, Rice & Steamed Broccoli',
    serves: 'Serves 2',
    totalMinutes: 40,
    blurb: 'The house weeknight plate — rice and broccoli in the COSORI, salmon in the Innsky.',
    steps: [
      { atMinute: 0, appliance: 'rice-cooker', text: 'Start 1 cup white rice (1:1¼, ~40 min).' },
      {
        atMinute: 30,
        appliance: 'rice-cooker',
        text: 'Open the lid and set the steam basket with broccoli on top of the rice.',
      },
      {
        atMinute: 31,
        appliance: 'air-fryer',
        text: 'Air-fry salmon at 400°F for ~8 min (to 125–130°F).',
      },
      { atMinute: 40, appliance: 'prep', text: 'Plate as the rice beeps.' },
    ],
  },
  {
    id: 'm-chicken-quinoa-carrots',
    name: 'Crispy Chicken, Quinoa & Roasted Carrots',
    serves: 'Serves 2',
    totalMinutes: 50,
    blurb: 'Brined breast stays juicy; carrots and quinoa cook while it crisps.',
    steps: [
      { atMinute: 0, appliance: 'rice-cooker', text: 'Start quinoa on Grains (1:1¼, ~45 min).' },
      {
        atMinute: 5,
        appliance: 'air-fryer',
        text: 'Preheat, then roast carrots at 380°F ~10 min; remove and hold.',
      },
      {
        atMinute: 34,
        appliance: 'air-fryer',
        text: 'Air-fry brined chicken breast at 375°F to 165°F (pull 160°F).',
      },
      { atMinute: 50, appliance: 'prep', text: 'Quinoa holds on Keep Warm; plate together.' },
    ],
  },
  {
    id: 'm-wings-potatoes',
    name: 'Wings & Baby Potatoes',
    serves: 'Serves 2–3',
    totalMinutes: 45,
    blurb: 'One basket, two batches — potatoes first, then wings while they hold.',
    steps: [
      {
        atMinute: 0,
        appliance: 'air-fryer',
        text: 'Air-fry baby potatoes at 400°F ~20 min; hold warm.',
      },
      { atMinute: 0, appliance: 'rice-cooker', text: 'Optional: steam a green veg alongside.' },
      {
        atMinute: 20,
        appliance: 'air-fryer',
        text: 'Air-fry wings at 400°F ~22 min to 175–185°F (½ tsp baking powder/lb for crisp skin).',
      },
      { atMinute: 45, appliance: 'prep', text: 'Toss wings in sauce; plate with the potatoes.' },
    ],
  },
  {
    id: 'm-pulled-pork',
    name: 'Pulled Pork Dinner',
    serves: 'Serves 4–6',
    totalMinutes: 420,
    blurb: 'Make-ahead: the COSORI does the low-and-slow, the Innsky crisps a side at the end.',
    steps: [
      {
        atMinute: 0,
        appliance: 'rice-cooker',
        text: 'Dry-rub pork and Slow Cook 6–8 hr (no added water).',
      },
      {
        atMinute: 380,
        appliance: 'rice-cooker',
        text: 'Pull the pork; cook rice in the pot or a second vessel.',
      },
      {
        atMinute: 380,
        appliance: 'air-fryer',
        text: 'Air-fry fries or a slaw-friendly veg at 400°F.',
      },
      { atMinute: 420, appliance: 'prep', text: 'Shred pork, add BBQ, plate.' },
    ],
  },
  {
    id: 'm-porkchops-rice-greenbeans',
    name: 'Pork Chops, Rice & Green Beans',
    serves: 'Serves 2',
    totalMinutes: 45,
    blurb: 'Rice and green beans steam together while the chops crisp.',
    steps: [
      { atMinute: 0, appliance: 'rice-cooker', text: 'Start white rice (1:1¼).' },
      { atMinute: 30, appliance: 'rice-cooker', text: 'Add the steam basket with green beans.' },
      {
        atMinute: 32,
        appliance: 'air-fryer',
        text: 'Air-fry chops at 400°F ~13 min to 140°F (carryover to 145°F).',
      },
      { atMinute: 45, appliance: 'prep', text: 'Rest chops 3 min while the rice finishes; plate.' },
    ],
  },
  {
    id: 'm-shrimp-farro-cauliflower',
    name: 'Shrimp, Farro Bowl & Roasted Cauliflower',
    serves: 'Serves 2',
    totalMinutes: 75,
    blurb: 'Farro leads the timing; shrimp goes in last for 6 quick minutes.',
    steps: [
      { atMinute: 0, appliance: 'rice-cooker', text: 'Start farro on Grains (1:1¼, ~70 min).' },
      { atMinute: 55, appliance: 'air-fryer', text: 'Roast cauliflower at 400°F ~12 min; hold.' },
      {
        atMinute: 69,
        appliance: 'air-fryer',
        text: 'Air-fry shrimp at 400°F ~6 min (opaque & pearly).',
      },
      { atMinute: 75, appliance: 'prep', text: 'Assemble bowls over the farro.' },
    ],
  },
]
