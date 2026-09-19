// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import App from './App.jsx'
import { PANTRY } from './data/recipes.js'
import { SESSION_KEY } from './lib/session.js'

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ''
})
afterEach(cleanup)

const cardOf = (matcher) => screen.getByText(matcher).closest('article')

describe('Glaze Lab app', () => {
  it('swaps the card set when the cooking mode is toggled', () => {
    render(<App />)
    expect(screen.getByText(/Miso.+Maple Glaze/)).toBeTruthy() // air-fryer default
    fireEvent.click(screen.getByRole('tab', { name: /Rice-Cooker/i }))
    expect(screen.getByText('Furikake Rice Bowl')).toBeTruthy()
    expect(screen.queryByText(/Miso.+Maple Glaze/)).toBeNull()
  })

  it('greys a dish and shows a needs ribbon when its pantry item is unchecked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Pantry/i }))
    fireEvent.click(screen.getByLabelText('White miso'))
    const card = cardOf(/Miso.+Maple Glaze/)
    expect(card.className).toContain('locked')
    expect(card.textContent).toContain('needs:')
    expect(card.textContent).toContain('White miso')
  })

  it('rescales ingredient amounts with the batch selector', () => {
    render(<App />)
    expect(cardOf(/Miso.+Maple Glaze/).textContent).toContain('2 tbsp') // miso at 1×
    fireEvent.click(screen.getByRole('button', { name: '2×' }))
    expect(cardOf(/Miso.+Maple Glaze/).textContent).toContain('4 tbsp') // miso at 2×
  })

  it('hides locked dishes when "Hide locked" is on', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Pantry/i }))
    fireEvent.click(screen.getByLabelText('White miso')) // locks Miso–Maple + Miso–Furikake
    fireEvent.click(screen.getByLabelText('Hide locked'))
    expect(screen.queryByText(/Miso.+Maple Glaze/)).toBeNull()
    expect(screen.getByText(/Honey.+Sriracha/)).toBeTruthy() // still makeable
  })

  it('filters dishes by search query', () => {
    render(<App />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'honey' } })
    expect(screen.getByText(/Honey.+Sriracha/)).toBeTruthy()
    expect(screen.queryByText(/Miso.+Maple Glaze/)).toBeNull()
  })

  it('filters by dietary tag, reflecting the chosen protein', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: /Rice-Cooker/i }))
    fireEvent.click(screen.getByRole('button', { name: 'vegan' }))
    expect(screen.getByText('Coconut Jasmine Rice')).toBeTruthy() // fixed, no animal products
    expect(screen.queryByText('Furikake Rice Bowl')).toBeNull() // salmon by default → pescatarian
  })

  it('resets the lane filter to All when switching modes', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spicy' }))
    expect(document.querySelector('.lane-chip.active').textContent).toBe('Spicy')
    fireEvent.click(screen.getByRole('tab', { name: /Rice-Cooker/i }))
    expect(document.querySelector('.lane-chip.active').textContent).toBe('All')
  })

  it('restores the saved pantry on mount', () => {
    localStorage.setItem('glazelab.pantry.v1', JSON.stringify(['salmon']))
    render(<App />)
    expect(screen.getByRole('button', { name: /Pantry/i }).textContent).toContain(
      `1/${PANTRY.length}`,
    )
  })

  it('closes the pantry drawer on Escape', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Pantry/i }))
    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('suggests what to buy and builds a shopping list when items are missing', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Pantry/i }))
    fireEvent.click(screen.getByLabelText('White miso')) // needed by 2 glaze builds
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toContain('Almost there')
    expect(dialog.textContent).toContain('unlocks 2 dishes')
    expect(dialog.textContent).toContain('Shopping list')
  })

  // ---- protein axis ----

  it('injects the protein plus its researched temp, time and target internal', () => {
    render(<App />)
    const card = () => cardOf(/Miso.+Maple Glaze/)
    expect(card().textContent).toContain('Salmon') // default protein
    expect(card().textContent).toContain('400°F') // salmon air-fryer temp
    expect(card().textContent).toContain('8:00') // salmon = 480s
    expect(card().textContent).toContain('130°F') // salmon target internal
    fireEvent.click(screen.getByRole('button', { name: 'Chicken thigh' }))
    expect(card().textContent).toContain('Chicken thigh')
    expect(card().textContent).toContain('380°F') // chicken thigh temp
    expect(card().textContent).toContain('24:00') // chicken thigh = 1440s
    expect(card().textContent).toContain('165°F') // chicken safe internal
  })

  it('adjusts cook time and target internal via the doneness control', () => {
    render(<App />) // default protein = salmon (has doneness levels)
    const card = () => cardOf(/Miso.+Maple Glaze/)
    expect(card().textContent).toContain('8:00') // salmon medium
    expect(card().textContent).toContain('130°F')
    fireEvent.click(screen.getByRole('button', { name: 'Well' }))
    expect(card().textContent).toContain('10:00') // salmon well = 600s
    expect(card().textContent).toContain('145°F')
  })

  it('gates every protein-using dish when the chosen protein is unchecked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Pantry/i }))
    fireEvent.click(screen.getByLabelText('Salmon')) // out of the default protein
    expect(cardOf(/Miso.+Maple Glaze/).className).toContain('locked') // every glaze
    fireEvent.click(screen.getByRole('tab', { name: /Rice-Cooker/i }))
    expect(cardOf('Furikake Rice Bowl').className).toContain('locked') // swappable bowl
    expect(cardOf('Coconut Jasmine Rice').className).not.toContain('locked') // fixed, no protein
  })

  it('remembers the chosen protein across a remount', () => {
    localStorage.setItem('glazelab.protein.v1', 'tofu')
    render(<App />)
    expect(cardOf(/Miso.+Maple Glaze/).textContent).toContain('Firm tofu')
  })

  it('shows coordinated meal plans with an ordered timeline in Meals mode', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: /Meals/i }))
    const card = cardOf('Salmon, Rice & Steamed Broccoli')
    expect(card.textContent).toContain('start') // first step label
    expect(card.textContent).toContain('Air-Fryer') // appliance badge
    expect(card.textContent).toContain('Rice-Cooker')
    // dish-only controls are hidden in Meals mode
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(screen.queryByText('Protein')).toBeNull()
  })

  it('shows air-fryer and steamed sides in Sides mode', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: /Sides/i }))
    const fries = cardOf('Air-Fryer Fries')
    expect(fries.textContent).toContain('400°F') // air-fryer side temp
    expect(fries.textContent).toContain('13:00') // 780s
    expect(cardOf('Steamed Green Beans').textContent).toContain('Steam') // COSORI function
    expect(screen.queryByText('Protein')).toBeNull() // picker hidden for sides
  })

  it('offers beef and pork on the protein picker', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Steak' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pork chop' })).toBeTruthy()
  })

  // ---- personalize / share / runner ----

  it('favorites a dish and filters to favorites only', () => {
    render(<App />)
    fireEvent.click(cardOf(/Miso.+Maple Glaze/).querySelector('.fav'))
    fireEvent.click(screen.getByLabelText('★ Favorites'))
    expect(screen.getByText(/Miso.+Maple Glaze/)).toBeTruthy()
    expect(screen.queryByText(/Honey.+Sriracha/)).toBeNull() // not favorited → hidden
  })

  it('shifts air-fryer times when the unit is calibrated', () => {
    render(<App />)
    expect(cardOf(/Miso.+Maple Glaze/).textContent).toContain('8:00') // salmon, no calibration
    fireEvent.click(screen.getByRole('button', { name: /Pantry/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Runs cold' })) // +15%
    expect(cardOf(/Miso.+Maple Glaze/).textContent).toContain('9:10') // 480 → 552 → 550s
  })

  it('adds a custom glaze that shows with a custom tag', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Add your own glaze/i }))
    fireEvent.change(screen.getByPlaceholderText(/Hoisin/i), { target: { value: 'My Test Glaze' } })
    fireEvent.click(screen.getByLabelText('Honey'))
    fireEvent.click(screen.getByRole('button', { name: 'Save glaze' }))
    const card = cardOf('My Test Glaze')
    expect(card.textContent).toContain('custom')
  })

  it('starts a meal plan and shows the live countdown', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: /Meals/i }))
    const card = cardOf('Salmon, Rice & Steamed Broccoli')
    fireEvent.click(
      [...card.querySelectorAll('button')].find((b) => b.textContent === 'Start plan'),
    )
    const running = cardOf('Salmon, Rice & Steamed Broccoli')
    expect(running.textContent).toContain('Next in')
    expect([...running.querySelectorAll('button')].some((b) => b.textContent === 'Stop')).toBe(true)
  })

  it('encodes the current view into the URL on Share', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(window.location.hash).toContain('protein=salmon')
  })

  it('restores view state from the URL hash', () => {
    window.location.hash = '#mode=meals'
    render(<App />)
    expect(document.querySelector('.mode.active').textContent).toContain('Meals')
  })

  // ---- cook-session recovery (reload / remount) ----

  const saveSessionFixture = (session) =>
    localStorage.setItem(SESSION_KEY, JSON.stringify({ v: 1, savedAt: Date.now(), ...session }))

  it('resumes a running meal plan after a remount, in Meals mode, with real elapsed time', () => {
    const startedAt = Date.now() - 31 * 60 * 1000 // 31 minutes into the salmon plate
    saveSessionFixture({ timers: {}, meal: { mealId: 'm-salmon-rice-broccoli', startedAt } })
    render(<App />)
    expect(document.querySelector('.mode.active').textContent).toContain('Meals')
    const card = screen
      .getByRole('heading', { name: 'Salmon, Rice & Steamed Broccoli' })
      .closest('article')
    expect(card.className).toContain('running')
    expect(card.textContent).toContain('Next in 9:0') // plate step at 40 min → ~9:00 left
    expect(card.textContent).toContain('Air-fry salmon') // step 31 min is "now"
    const status = screen.getByRole('status')
    expect(status.textContent).toContain('Resumed your cook')
    expect(status.textContent).toContain('Salmon, Rice & Steamed Broccoli')
  })

  it('resumes running and paused timers after a remount and can clear the whole cook', () => {
    const now = Date.now()
    saveSessionFixture({
      timers: {
        'g-miso-maple': {
          duration: 480,
          running: true,
          done: false,
          remaining: 480,
          endsAt: now + 300 * 1000,
        },
        'g-honey-sriracha': {
          duration: 480,
          running: false,
          done: false,
          remaining: 123,
          endsAt: null,
        },
      },
      meal: null,
    })
    render(<App />)
    expect(cardOf(/Miso.+Maple Glaze/).textContent).toContain('5:00')
    expect(cardOf(/Miso.+Maple Glaze/).querySelector('.timer').className).toContain('running')
    expect(cardOf(/Honey.+Sriracha/).textContent).toContain('2:03')
    expect(screen.getByRole('status').textContent).toContain('2 timers')
    fireEvent.click(screen.getByRole('button', { name: 'Clear cook' }))
    expect(screen.queryByRole('status')).toBeNull()
    expect(cardOf(/Miso.+Maple Glaze/).textContent).toContain('8:00')
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('persists the cook session when a timer starts and when a meal starts', () => {
    render(<App />)
    fireEvent.click(
      [...cardOf(/Miso.+Maple Glaze/).querySelectorAll('button')].find(
        (b) => b.textContent === 'Start',
      ),
    )
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY))
    expect(saved.v).toBe(1)
    expect(saved.timers['g-miso-maple'].running).toBe(true)
    fireEvent.click(screen.getByRole('tab', { name: /Meals/i }))
    const card = cardOf('Salmon, Rice & Steamed Broccoli')
    fireEvent.click(
      [...card.querySelectorAll('button')].find((b) => b.textContent === 'Start plan'),
    )
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)).meal.mealId).toBe('m-salmon-rice-broccoli')
  })

  it('shows a clear error and still renders when the saved session is corrupt', () => {
    localStorage.setItem(SESSION_KEY, '{definitely not json')
    render(<App />)
    expect(screen.getByRole('alert').textContent).toContain("couldn't be read")
    expect(screen.getByText(/Miso.+Maple Glaze/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('survives corrupt favorites, custom glazes and calibration values', () => {
    localStorage.setItem('glazelab.favs.v1', '5')
    localStorage.setItem('glazelab.custom.v1', '[{"id":"x"},{"broken":true}]')
    localStorage.setItem('glazelab.calib.v1', 'abc')
    render(<App />)
    expect(screen.getByText(/Miso.+Maple Glaze/)).toBeTruthy()
    expect(cardOf(/Miso.+Maple Glaze/).textContent).toContain('8:00') // not NaN:NaN
    expect(screen.queryByText('custom')).toBeNull()
  })

  it('a reset timer follows a later protein change', () => {
    render(<App />)
    const buttons = () => [...cardOf(/Miso.+Maple Glaze/).querySelectorAll('button')]
    fireEvent.click(buttons().find((b) => b.textContent === 'Start'))
    fireEvent.click(buttons().find((b) => b.textContent === 'Reset'))
    fireEvent.click(screen.getByRole('button', { name: 'Chicken thigh' }))
    expect(cardOf(/Miso.+Maple Glaze/).textContent).toContain('24:00')
  })
})
