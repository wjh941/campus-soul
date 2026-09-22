import { describe, expect, it } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import Matches from './Matches'
import { createAppValue, fakeSession, renderWithApp } from '../test/AppTestHarness'
import type { MatchPerson } from '../lib/profiles'

const candidate = (over: Partial<MatchPerson>): MatchPerson => ({
  id: 'x', userId: 'u-x', name: '候选人', age: 21, school: '同济大学', major: '设计',
  score: 90, distance: '2km', avatar: 'a.png', tags: ['ENFP'], quote: 'q', color: '#333',
  dimensions: [80, 80, 80], reasons: ['兴趣'], verified: false, ...over,
})

describe('Matches 匹配推荐列表', () => {
  it('shows the radar summary with the candidate count for signed-in users', () => {
    renderWithApp(<Matches />, {
      value: createAppValue({
        session: fakeSession,
        matchPeople: [candidate({ id: '1', name: '林知夏', score: 92 }), candidate({ id: '2', name: '陈予安', score: 74 })],
      }),
    })
    expect(screen.getByText('匹配雷达已更新')).toBeInTheDocument()
    expect(screen.getByText(/当前找到 2 位候选人/)).toBeInTheDocument()
    expect(screen.getByText('林知夏')).toBeInTheDocument()
    expect(screen.getByText('陈予安')).toBeInTheDocument()
  })

  it('explains the preview state to guests', () => {
    renderWithApp(<Matches />, { value: createAppValue({ matchPeople: [candidate({ id: '1' })] }) })
    expect(screen.getByText('匹配功能预览')).toBeInTheDocument()
    expect(screen.getByText('登录并完善画像后，将根据真实资料生成推荐')).toBeInTheDocument()
  })

  it('filters 高契合度 to candidates scoring 80+', () => {
    renderWithApp(<Matches />, {
      value: createAppValue({
        session: fakeSession,
        matchPeople: [candidate({ id: '1', name: '高分', score: 92 }), candidate({ id: '2', name: '低分', score: 61 })],
      }),
    })
    fireEvent.click(screen.getByRole('button', { name: '高契合度' }))
    expect(screen.getByText('高分')).toBeInTheDocument()
    expect(screen.queryByText('低分')).toBeNull()
  })

  it('filters 同校用户 against the viewer profile', () => {
    renderWithApp(<Matches />, {
      value: createAppValue({
        session: fakeSession,
        profile: { nickname: '我', school: '同济大学' } as never,
        matchPeople: [
          candidate({ id: '1', name: '同校的', school: '同济大学' }),
          candidate({ id: '2', name: '外校的', school: '复旦大学' }),
        ],
      }),
    })
    fireEvent.click(screen.getByRole('button', { name: '同校用户' }))
    expect(screen.getByText('同校的')).toBeInTheDocument()
    expect(screen.queryByText('外校的')).toBeNull()
  })

  it('renders a skeleton grid while matches are loading', () => {
    renderWithApp(<Matches />, { value: createAppValue({ session: fakeSession, matchesLoading: true, matchPeople: [] }) })
    expect(document.querySelectorAll('.match-skeleton').length).toBe(3)
  })

  it('offers next actions when a filter has no candidates', () => {
    renderWithApp(<Matches />, { value: createAppValue({ session: fakeSession, matchPeople: [] }) })
    const empty = screen.getByText('这一组暂时没有合适的候选人')
    const actions = within(empty.closest('.match-empty') as HTMLElement)
    expect(actions.getByRole('button', { name: '调整匹配偏好' })).toBeInTheDocument()
    expect(actions.getByRole('button', { name: '做一次自我探索' })).toBeInTheDocument()
  })
})
