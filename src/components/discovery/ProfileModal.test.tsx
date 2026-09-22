import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ProfileModal from './ProfileModal'
import type { Person } from '../../lib/demo'

const person: Person = {
  id: '1', userId: 'p1', name: '顾南乔', age: 20, school: '华东师范大学', major: '心理学',
  score: 89, distance: '5.1km', avatar: 'a.png', tags: ['INTJ'], quote: '真诚是永远的必杀技。',
  color: '#34b991', dimensions: [91, 88, 87], reasons: ['关系期待存在共同点'], verified: true,
}

const setup = () => {
  const onHeart = vi.fn(async () => {})
  const onReport = vi.fn(async () => {})
  const onBlock = vi.fn(async () => {})
  const onClose = vi.fn()
  render(<ProfileModal person={person} onHeart={onHeart} onReport={onReport} onBlock={onBlock} onClose={onClose} />)
  return { onHeart, onReport, onBlock, onClose }
}

describe('ProfileModal', () => {
  it('renders the candidate with verified badge and match analysis', () => {
    setup()
    expect(screen.getByText(/顾南乔/)).toBeInTheDocument()
    expect(screen.getByText('身份已认证')).toBeInTheDocument()
    expect(screen.getByText('为什么推荐 TA')).toBeInTheDocument()
    expect(screen.getByText('关系期待存在共同点')).toBeInTheDocument()
  })

  it('submits a report from the safety actions', async () => {
    const { onReport } = setup()
    fireEvent.click(screen.getByRole('button', { name: /举报/ }))
    await vi.waitFor(() => expect(onReport).toHaveBeenCalledOnce())
  })

  it('blocks the person from the safety actions', async () => {
    const { onBlock } = setup()
    fireEvent.click(screen.getByRole('button', { name: /屏蔽/ }))
    await vi.waitFor(() => expect(onBlock).toHaveBeenCalledOnce())
  })

  it('sends a heart and disables the button while sending', async () => {
    let resolveHeart: () => void = () => {}
    const onHeart = vi.fn(() => new Promise<void>(resolve => { resolveHeart = resolve }))
    render(<ProfileModal person={person} onHeart={onHeart} onReport={vi.fn()} onBlock={vi.fn()} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /发送心动/ }))
    expect(screen.getByRole('button', { name: /发送心动/ })).toBeDisabled()
    resolveHeart()
    await vi.waitFor(() => expect(onHeart).toHaveBeenCalledOnce())
  })

  it('closes via the close button and the 略过 action', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: '关闭资料' }))
    fireEvent.click(screen.getByRole('button', { name: /暂时略过/ }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
