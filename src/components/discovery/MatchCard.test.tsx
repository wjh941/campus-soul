import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import MatchCard from './MatchCard'
import type { Person } from '../../lib/demo'

const person: Person = {
  id: '1', userId: 'p1', name: '林知夏', age: 21, school: '同济大学', major: '建筑学',
  score: 92, distance: '1.2km', avatar: 'a.png', tags: ['INFJ', '胶片摄影'],
  quote: '想和有趣的人，把普通日子过成限定版。', color: '#ff715b',
  dimensions: [98, 94, 91], reasons: ['兴趣方向彼此呼应'], verified: false,
}

describe('MatchCard', () => {
  it('renders identity, school line and score badge', () => {
    render(<MatchCard person={person} onOpen={() => {}} />)
    expect(screen.getByText(/林知夏/)).toBeInTheDocument()
    expect(screen.getByText('同济大学 · 建筑学')).toBeInTheDocument()
    expect(screen.getByText('高契合')).toBeInTheDocument()
    expect(screen.getByText('“想和有趣的人，把普通日子过成限定版。”')).toBeInTheDocument()
    expect(screen.getByText('INFJ')).toBeInTheDocument()
  })
  it('labels low scores as 匹配线索', () => {
    render(<MatchCard person={{ ...person, score: 60 }} onOpen={() => {}} />)
    expect(screen.getByText('匹配线索')).toBeInTheDocument()
  })
  it('disables the heart for demo profiles', () => {
    render(<MatchCard person={person} onOpen={() => {}} demo />)
    const heart = screen.getByRole('button', { name: '演示资料，登录后可发送心动' })
    expect(heart).toBeDisabled()
  })
  it('sends a heart for real candidates', async () => {
    const onHeart = vi.fn(async () => {})
    render(<MatchCard person={person} onOpen={() => {}} onHeart={onHeart} />)
    fireEvent.click(screen.getByRole('button', { name: '向林知夏发送心动' }))
    await vi.waitFor(() => expect(onHeart).toHaveBeenCalledOnce())
  })
  it('opens the insight panel via the analysis link', () => {
    const onInsight = vi.fn()
    render(<MatchCard person={person} onOpen={() => {}} onInsight={onInsight} />)
    fireEvent.click(screen.getByRole('button', { name: /查看匹配分析/ }))
    expect(onInsight).toHaveBeenCalledOnce()
  })
  it('opens the profile on keyboard activation', () => {
    const onOpen = vi.fn()
    render(<MatchCard person={person} onOpen={onOpen} />)
    const card = screen.getByRole('button', { name: /查看林知夏的资料/ })
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(onOpen).toHaveBeenCalledOnce()
  })
})
