import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import PostCard from './PostCard'
import type { SocialPost } from '../../lib/social'

const post: SocialPost = {
  id: 'p1', authorId: 'author-1', name: '林知夏', avatar: 'a.png', school: '同济大学', time: '18分钟前',
  text: '在武康路拐进一条没走过的小巷', tags: ['城市漫游'], likes: 128, liked: false,
  comments: [{ id: 1, name: '陈予安', avatar: 'b.png', text: '求店名！' }],
}

const mine: SocialPost = { ...post, authorId: 'u1' }
const theirs: SocialPost = { ...post, authorId: 'author-2' }

describe('PostCard', () => {
  it('renders author, text, tags and like count', () => {
    render(<PostCard post={post} onLike={() => {}} onComment={() => {}} userAvatar="me.png" />)
    expect(screen.getByText('林知夏')).toBeInTheDocument()
    expect(screen.getByText('在武康路拐进一条没走过的小巷')).toBeInTheDocument()
    expect(screen.getByText('#城市漫游')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '点赞' })).toHaveTextContent('128')
  })
  it('toggles the like state optimistically', () => {
    const onLike = vi.fn()
    render(<PostCard post={post} onLike={onLike} onComment={() => {}} userAvatar="me.png" />)
    fireEvent.click(screen.getByRole('button', { name: '点赞' }))
    expect(onLike).toHaveBeenCalledOnce()
  })
  it('submits a comment and clears the input', async () => {
    const onComment = vi.fn(async () => {})
    render(<PostCard post={post} onLike={() => {}} onComment={onComment} userAvatar="me.png" />)
    const input = screen.getByPlaceholderText('友善地说点什么…') as HTMLInputElement
    fireEvent.change(input, { target: { value: '求店名！周末也想去' } })
    const send = input.closest('.comment-input')!.querySelector('button')!
    fireEvent.click(send)
    await vi.waitFor(() => expect(onComment).toHaveBeenCalledWith('求店名！周末也想去'))
    await vi.waitFor(() => expect(input.value).toBe(''))
  })
  it('does not send empty comments', () => {
    const onComment = vi.fn()
    render(<PostCard post={post} onLike={() => {}} onComment={onComment} userAvatar="me.png" />)
    const send = document.querySelector('.comment-input button') as HTMLButtonElement
    expect(send).toBeDisabled()
    fireEvent.click(send)
    expect(onComment).not.toHaveBeenCalled()
  })
  it('shows 举报 for other people\'s posts and 删除 for your own', () => {
    const { rerender } = render(
      <PostCard post={theirs} onLike={() => {}} onComment={() => {}} onReport={() => {}} userAvatar="me.png" />,
    )
    expect(screen.getByRole('button', { name: /举报/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '删除' })).toBeNull()
    rerender(<PostCard post={mine} onLike={() => {}} onComment={() => {}} onDelete={() => {}} userAvatar="me.png" />)
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /举报/ })).toBeNull()
  })
})
