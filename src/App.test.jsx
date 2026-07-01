// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import App from './App.jsx'

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
})
