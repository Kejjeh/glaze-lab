// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import App from './App.jsx'
import { PANTRY } from './data/recipes.js'

beforeEach(() => localStorage.clear())
afterEach(cleanup)

const cardOf = (matcher) => screen.getByText(matcher).closest('article')

describe('Salmon Lab app', () => {
  it('swaps the card set when the cooking mode is toggled', () => {
    render(<App />)
    expect(screen.getByText(/Miso.+Maple Glaze/)).toBeTruthy() // air-fryer default
    fireEvent.click(screen.getByRole('tab', { name: /Rice-Cooker/i }))
    expect(screen.getByText('Salmon Furikake Bowl')).toBeTruthy()
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

  it('gates the same ingredient across both modes', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Pantry/i }))
    fireEvent.click(screen.getByLabelText('Salmon fillet'))
    expect(cardOf(/Miso.+Maple Glaze/).className).toContain('locked')
    fireEvent.click(screen.getByRole('tab', { name: /Rice-Cooker/i }))
    expect(cardOf('Salmon Furikake Bowl').className).toContain('locked')
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

  it('filters by dietary tag', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: /Rice-Cooker/i }))
    fireEvent.click(screen.getByRole('button', { name: 'vegan' }))
    expect(screen.getByText('Coconut Jasmine Rice')).toBeTruthy() // no animal products
    expect(screen.queryByText('Salmon Furikake Bowl')).toBeNull() // has salmon
  })

  it('resets the lane filter to All when switching modes', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spicy' }))
    expect(document.querySelector('.lane-chip.active').textContent).toBe('Spicy')
    fireEvent.click(screen.getByRole('tab', { name: /Rice-Cooker/i }))
    expect(document.querySelector('.lane-chip.active').textContent).toBe('All')
  })

  it('restores the saved pantry on mount', () => {
    localStorage.setItem('salmonlab.pantry.v1', JSON.stringify(['salmon']))
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
})
