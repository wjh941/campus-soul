import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import GuestAgeGate from './GuestAgeGate'
import GuestActivation from './GuestActivation'

describe('GuestAgeGate', () => {
  it('renders the 18+ confirmation dialog', () => {
    render(<GuestAgeGate onAccept={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/先确认你已满 18 周岁/)).toBeInTheDocument()
  })
  it('persists confirmation and continues on accept', () => {
    // The storage write itself lives in the app shell's onAccept handler.
    const onAccept = vi.fn(() => { localStorage.setItem('tongpin-guest-age-confirmed', 'yes') })
    localStorage.removeItem('tongpin-guest-age-confirmed')
    render(<GuestAgeGate onAccept={onAccept} />)
    fireEvent.click(screen.getByRole('button', { name: /我已满 18 周岁，继续浏览/ }))
    expect(localStorage.getItem('tongpin-guest-age-confirmed')).toBe('yes')
    expect(onAccept).toHaveBeenCalledOnce()
    localStorage.removeItem('tongpin-guest-age-confirmed')
  })
})

describe('GuestActivation', () => {
  it('introduces the 3-minute onboarding and safety promises', () => {
    render(<GuestActivation onExplore={() => {}} onAuth={() => {}} />)
    expect(screen.getByText(/先用 3 道题/)).toBeInTheDocument()
    expect(screen.getByText('仅面向 18+ 用户')).toBeInTheDocument()
    expect(screen.getByText('不公开邮箱')).toBeInTheDocument()
  })
  it('routes the two calls to action', () => {
    const onExplore = vi.fn()
    const onAuth = vi.fn()
    render(<GuestActivation onExplore={onExplore} onAuth={onAuth} />)
    fireEvent.click(screen.getByRole('button', { name: /开始 3 分钟自测/ }))
    fireEvent.click(screen.getByRole('button', { name: /已有账号，直接登录/ }))
    expect(onExplore).toHaveBeenCalledOnce()
    expect(onAuth).toHaveBeenCalledOnce()
  })
})
