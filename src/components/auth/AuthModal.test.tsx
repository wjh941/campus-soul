import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthModal from './AuthModal'

const { auth } = vi.hoisted(() => ({
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
}))

vi.mock('../../lib/supabase', () => ({
  supabase: { auth },
  isSupabaseConfigured: true,
}))

const openRegister = async () => {
  render(<AuthModal onClose={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /立即注册/ }))
  expect(await screen.findByText('创建同频账号')).toBeInTheDocument()
}

beforeEach(() => {
  auth.signInWithPassword.mockReset()
  auth.signUp.mockReset()
  auth.resetPasswordForEmail.mockReset()
})

describe('AuthModal 登录/注册流程', () => {
  it('renders the login form by default with a privacy promise', () => {
    render(<AuthModal onClose={() => {}} />)
    expect(screen.getByText('欢迎回来')).toBeInTheDocument()
    expect(screen.getByText(/你的邮箱不会公开展示/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/昵称/)).toBeNull()
  })

  it('switching to register reveals nickname and school fields', async () => {
    await openRegister()
    expect(screen.getByLabelText(/昵称/)).toBeInTheDocument()
    expect(screen.getByLabelText(/学校/)).toBeInTheDocument()
  })

  it('registers with nickname, school, email and password', async () => {
    const user = userEvent.setup()
    await openRegister()
    auth.signUp.mockResolvedValue({ data: { session: { user: { id: 'u9' } } }, error: null })
    await user.type(screen.getByLabelText(/昵称/), '小满')
    await user.type(screen.getByLabelText(/学校/), '同济大学')
    await user.type(screen.getByLabelText(/邮箱/), 'xm@tongji.edu.cn')
    await user.type(screen.getByLabelText(/密码/), 'secret9')
    fireEvent.click(screen.getByRole('button', { name: /注册账号/ }))
    await vi.waitFor(() => expect(auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'xm@tongji.edu.cn',
      password: 'secret9',
      options: expect.objectContaining({ data: { nickname: '小满', school: '同济大学' } }),
    })))
  })

  it('asks unverified users to check their inbox instead of logging them in', async () => {
    const user = userEvent.setup()
    await openRegister()
    auth.signUp.mockResolvedValue({ data: { session: null, user: null }, error: null })
    await user.type(screen.getByLabelText(/昵称/), '小满')
    await user.type(screen.getByLabelText(/学校/), '同济大学')
    await user.type(screen.getByLabelText(/邮箱/), 'xm@tongji.edu.cn')
    await user.type(screen.getByLabelText(/密码/), 'secret9')
    fireEvent.click(screen.getByRole('button', { name: /注册账号/ }))
    expect(await screen.findByText(/需要先完成邮箱验证/)).toBeInTheDocument()
  })

  it('translates "user already registered" into a friendly hint on login', async () => {
    const user = userEvent.setup()
    render(<AuthModal onClose={() => {}} />)
    auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'User already registered' } })
    await user.type(screen.getByLabelText(/邮箱/), 'taken@tongji.edu.cn')
    await user.type(screen.getByLabelText(/密码/), 'secret9')
    fireEvent.click(screen.getByRole('button', { name: '登录' }))
    expect(await screen.findByText(/这个邮箱已经注册过，请切换到“登录”。/)).toBeInTheDocument()
  })

  it('closes from the header close button', () => {
    const onClose = vi.fn()
    render(<AuthModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: '关闭登录窗口' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
