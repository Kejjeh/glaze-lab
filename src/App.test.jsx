// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import App from './App.jsx'
import { PANTRY } from './data/recipes.js'

beforeEach(() => localStorage.clear())
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

  it('offers beef and pork on the protein picker', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Steak' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pork chop' })).toBeTruthy()
  })
})
