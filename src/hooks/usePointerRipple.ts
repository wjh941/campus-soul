import { useEffect } from 'react'

/** Global material ripple: marks the pressed interactive element with ripple CSS vars. */
export function usePointerRipple() {
  useEffect(() => {
    const press = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('button:not(:disabled),[role="button"]:not([aria-disabled="true"])')
      if (!target) return
      const rect = target.getBoundingClientRect()
      target.style.setProperty('--ripple-x', `${event.clientX - rect.left}px`)
      target.style.setProperty('--ripple-y', `${event.clientY - rect.top}px`)
      target.classList.remove('ripple-active')
      window.requestAnimationFrame(() => target.classList.add('ripple-active'))
      window.setTimeout(() => target.classList.remove('ripple-active'), 360)
    }
    document.addEventListener('pointerdown', press, { passive: true })
    return () => document.removeEventListener('pointerdown', press)
  }, [])
}
