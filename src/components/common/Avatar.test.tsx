import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Avatar from './Avatar'

describe('Avatar', () => {
  it('renders the image with the given size', () => {
    render(<Avatar src="a.png" size={48} />)
    const img = screen.getByRole('img', { name: '头像' })
    expect(img).toHaveAttribute('src', 'a.png')
    expect(img.closest('.avatar-wrap')).toHaveStyle({ width: '48px', height: '48px' })
  })
  it('falls back to an icon when the image fails to load', () => {
    render(<Avatar src="broken.png" />)
    fireEvent.error(screen.getByRole('img', { name: '头像' }))
    expect(screen.queryByRole('img', { name: '头像' })).toBeNull()
    expect(document.querySelector('.avatar-fallback')).toBeInTheDocument()
  })
  it('shows the online dot when requested', () => {
    const { container } = render(<Avatar src="a.png" online />)
    expect(container.querySelector('.online')).toBeInTheDocument()
  })
})
