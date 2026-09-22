import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// @testing-library/react auto-cleanup hooks into a global afterEach, which does
// not exist when vitest globals are off — register it explicitly.
afterEach(() => cleanup())

// jsdom lacks a few browser APIs the app touches during render.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
Element.prototype.scrollIntoView = () => {}
window.scrollTo = () => {}
