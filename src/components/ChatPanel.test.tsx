import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatPanel from './ChatPanel'
import type { Conversation } from '../lib/messaging'

const handlers = vi.hoisted(() => ({
  fetchConversations: vi.fn(),
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
  markConversationRead: vi.fn(),
  subscribeToMessages: vi.fn(() => null),
  endMatch: vi.fn(),
  deleteMyMessage: vi.fn(),
}))

vi.mock('../lib/messaging', () => handlers)
vi.mock('../lib/supabase', () => ({ supabase: null, isSupabaseConfigured: false }))
vi.mock('../lib/profiles', () => ({ blockUser: vi.fn(), reportUser: vi.fn() }))

const conversation: Conversation = {
  id: 'm1', partnerId: 'p9', name: '林知夏', school: '同济大学', avatar: 'a.png',
  lastMessage: '今晚一起去livehouse吗', lastAt: new Date().toISOString(), unread: 2,
}

const session = { user: { id: 'u1' } } as never

beforeEach(() => {
  Object.values(handlers).forEach(fn => { if (vi.isMockFunction(fn)) fn.mockReset() })
  handlers.subscribeToMessages.mockReturnValue(null)
  handlers.markConversationRead.mockResolvedValue(undefined)
  handlers.sendMessage.mockResolvedValue(undefined)
  localStorage.removeItem('tongpin-chat-drafts')
})

describe('ChatPanel 聊天消息', () => {
  it('asks guests to log in before chatting', async () => {
    const onRequireAuth = vi.fn()
    render(<ChatPanel session={null} onRequireAuth={onRequireAuth} initialMatchId={undefined} />)
    fireEvent.click(screen.getByRole('button', { name: /登录同频/ }))
    expect(onRequireAuth).toHaveBeenCalledOnce()
    expect(handlers.fetchConversations).not.toHaveBeenCalled()
  })

  it('loads the conversation list for a signed-in user', async () => {
    handlers.fetchConversations.mockResolvedValue([conversation])
    render(<ChatPanel session={session} onRequireAuth={() => {}} initialMatchId={undefined} />)
    expect(await screen.findByText('林知夏')).toBeInTheDocument()
    expect(await screen.findByText('今晚一起去livehouse吗')).toBeInTheDocument()
    expect(handlers.fetchConversations).toHaveBeenCalledWith('u1')
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows the empty state before the first mutual heart', async () => {
    handlers.fetchConversations.mockResolvedValue([])
    render(<ChatPanel session={session} onRequireAuth={() => {}} initialMatchId={undefined} />)
    expect(await screen.findByText('等待第一次双向心动')).toBeInTheDocument()
  })

  it('sends a typed message with the sender id and trimmed content', async () => {
    handlers.fetchConversations.mockResolvedValue([conversation])
    handlers.fetchMessages.mockResolvedValue([])
    const user = userEvent.setup()
    render(<ChatPanel session={session} onRequireAuth={() => {}} initialMatchId="m1" />)
    await screen.findByText('今晚一起去livehouse吗')
    fireEvent.click(screen.getByRole('button', { name: /林知夏/ }))
    const composer = await screen.findByLabelText('输入消息')
    await user.type(composer, '  好呀，几点碰面？')
    fireEvent.keyDown(composer, { key: 'Enter' })
    await waitFor(() => expect(handlers.sendMessage).toHaveBeenCalledWith('m1', 'u1', '好呀，几点碰面？'))
    await waitFor(() => expect((composer as HTMLTextAreaElement).value).toBe(''))
  })

  it('restores the draft when sending fails', async () => {
    handlers.fetchConversations.mockResolvedValue([conversation])
    handlers.fetchMessages.mockResolvedValue([])
    handlers.sendMessage.mockRejectedValue(new Error('网络断开'))
    const user = userEvent.setup()
    render(<ChatPanel session={session} onRequireAuth={() => {}} initialMatchId="m1" />)
    await screen.findByText('今晚一起去livehouse吗')
    fireEvent.click(screen.getByRole('button', { name: /林知夏/ }))
    const composer = await screen.findByLabelText('输入消息')
    await user.type(composer, '这条会失败')
    fireEvent.keyDown(composer, { key: 'Enter' })
    await waitFor(() => expect(handlers.sendMessage).toHaveBeenCalledWith('m1', 'u1', '这条会失败'))
    // The failed message must stay in the textarea (and the draft storage) so the user can retry.
    await waitFor(() => expect((composer as HTMLTextAreaElement).value).toBe('这条会失败'))
    expect(JSON.parse(localStorage.getItem('tongpin-chat-drafts') ?? '{}').m1).toBe('这条会失败')
  })
  it('exposes report and block controls inside a conversation', async () => {
    handlers.fetchConversations.mockResolvedValue([conversation])
    handlers.fetchMessages.mockResolvedValue([])
    render(<ChatPanel session={session} onRequireAuth={() => {}} initialMatchId="m1" />)
    await screen.findByText('今晚一起去livehouse吗')
    fireEvent.click(screen.getByRole('button', { name: /林知夏/ }))
    expect(await screen.findByRole('button', { name: /举报/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /屏蔽/ })).toBeInTheDocument()
  })
})
