import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Onboarding from './Onboarding'

const fillStep1 = () => {
  fireEvent.change(screen.getByLabelText(/你的昵称/), { target: { value: '小满' } })
  fireEvent.change(screen.getByLabelText(/所在学校/), { target: { value: '同济大学' } })
}

describe('Onboarding 同频画像引导', () => {
  it('requires nickname and school before leaving step 1', () => {
    render(<Onboarding onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /继续/ }))
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    fillStep1()
    fireEvent.click(screen.getByRole('button', { name: /继续/ }))
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('walks through traits and frequency to the summary step', () => {
    render(<Onboarding onClose={() => {}} />)
    fillStep1()
    fireEvent.click(screen.getByRole('button', { name: /继续/ }))
    expect(screen.getByText(/你更看重什么？/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '真诚' }))
    fireEvent.click(screen.getByRole('button', { name: '幽默' }))
    fireEvent.click(screen.getByRole('button', { name: /继续/ }))
    expect(screen.getByText(/你的同频画像已生成/)).toBeInTheDocument()
    expect(screen.getByText('成长型关系')).toBeInTheDocument()
  })

  it('hands the selected traits and frequency to onSave at the end', async () => {
    const onSave = vi.fn(async () => {})
    const onClose = vi.fn()
    render(<Onboarding onClose={onClose} onSave={onSave} />)
    fillStep1()
    fireEvent.click(screen.getByRole('button', { name: /继续/ }))
    // 真诚/有边界感 start preselected; pick two more so all four are on.
    fireEvent.click(screen.getByRole('button', { name: '幽默' }))
    fireEvent.click(screen.getByRole('button', { name: '保持好奇' }))
    fireEvent.click(screen.getByRole('button', { name: /继续/ }))
    fireEvent.click(screen.getByRole('button', { name: /查看我的匹配/ }))
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith(
      ['真诚', '有边界感', '幽默', '保持好奇'],
      expect.any(Number),
      expect.objectContaining({ nickname: '小满', school: '同济大学' }),
    ))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('prefills from an existing profile', () => {
    render(<Onboarding onClose={() => {}} initial={{ nickname: '老朋友', school: '复旦大学' }} />)
    expect(screen.getByLabelText(/你的昵称/)).toHaveValue('老朋友')
    expect(screen.getByLabelText(/所在学校/)).toHaveValue('复旦大学')
  })
})
