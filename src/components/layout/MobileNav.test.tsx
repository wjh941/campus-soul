import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import MobileNav from './MobileNav'
import { renderWithApp } from '../../test/AppTestHarness'

describe('MobileNav', () => {
  it('renders the five primary destinations', () => {
    renderWithApp(<MobileNav view="home" />)
    for (const label of ['发现', '查看我的匹配', '同频动态', '消息', '我的']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('marks the active view with aria-current', () => {
    renderWithApp(<MobileNav view="messages" />)
    expect(screen.getByRole('button', { name: '消息' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '发现' })).not.toHaveAttribute('aria-current')
  })

  it('navigates through the app go() helper', () => {
    const value = renderWithApp(<MobileNav view="home" />)
    fireEvent.click(screen.getByRole('button', { name: '查看我的匹配' }))
    expect(value.value.go).toHaveBeenCalledWith('matches')
  })
})
