import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Composer from './Composer'

const bigImage = () => new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.png', { type: 'image/png' })
const okImage = () => new File([new ArrayBuffer(1024)], 'small.png', { type: 'image/png' })

const findFileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement

describe('Composer', () => {
  it('starts with an empty textarea and a disabled submit button', () => {
    render(<Composer onPost={vi.fn()} authenticated avatar="me.png" onClose={() => {}} />)
    const textarea = screen.getByPlaceholderText('此刻，你想和大家分享什么？') as HTMLTextAreaElement
    expect(textarea.value).toBe('')
    expect(screen.getByRole('button', { name: /发布/ })).toBeDisabled()
  })

  it('restores a saved draft on mount', () => {
    localStorage.setItem('tongpin-post-draft', '未发布的草稿')
    render(<Composer onPost={vi.fn()} authenticated avatar="me.png" onClose={() => {}} />)
    expect((screen.getByPlaceholderText('此刻，你想和大家分享什么？') as HTMLTextAreaElement).value).toBe('未发布的草稿')
    localStorage.removeItem('tongpin-post-draft')
  })

  it('persists the draft while typing and reports the draft status', () => {
    render(<Composer onPost={vi.fn()} authenticated avatar="me.png" onClose={() => {}} />)
    const textarea = screen.getByPlaceholderText('此刻，你想和大家分享什么？')
    fireEvent.change(textarea, { target: { value: '今天真开心' } })
    expect(localStorage.getItem('tongpin-post-draft')).toBe('今天真开心')
    expect(screen.getByText('草稿已自动保存')).toBeInTheDocument()
  })

  it('rejects images over 5 MB', () => {
    render(<Composer onPost={vi.fn()} authenticated avatar="me.png" onClose={() => {}} />)
    fireEvent.change(findFileInput(), { target: { files: [bigImage()] } })
    expect(screen.getByText('动态图片不能超过 5 MB')).toBeInTheDocument()
  })

  it('rejects unsupported image types', () => {
    render(<Composer onPost={vi.fn()} authenticated avatar="me.png" onClose={() => {}} />)
    fireEvent.change(findFileInput(), { target: { files: [new File([new ArrayBuffer(8)], 'x.bmp', { type: 'image/bmp' })] } })
    expect(screen.getByText('仅支持 JPG、PNG、WebP 或 GIF')).toBeInTheDocument()
  })

  it('publishes the trimmed text with the selected image and clears the draft', async () => {
    const onPost = vi.fn(async () => {})
    render(<Composer onPost={onPost} authenticated avatar="me.png" onClose={() => {}} />)
    const textarea = screen.getByPlaceholderText('此刻，你想和大家分享什么？')
    fireEvent.change(textarea, { target: { value: '  分享此刻  ' } })
    fireEvent.change(findFileInput(), { target: { files: [okImage()] } })
    fireEvent.click(screen.getByRole('button', { name: /发布/ }))
    await vi.waitFor(() => expect(onPost).toHaveBeenCalledWith('分享此刻', expect.any(File)))
    await vi.waitFor(() => expect((textarea as HTMLTextAreaElement).value).toBe(''))
    await vi.waitFor(() => expect(localStorage.getItem('tongpin-post-draft')).toBeNull())
  })

  it('keeps the draft when publishing fails', async () => {
    const onPost = vi.fn(async () => { throw new Error('发布失败') })
    render(<Composer onPost={onPost} authenticated avatar="me.png" onClose={() => {}} />)
    const textarea = screen.getByPlaceholderText('此刻，你想和大家分享什么？')
    fireEvent.change(textarea, { target: { value: '会失败的内容' } })
    fireEvent.click(screen.getByRole('button', { name: /发布/ }))
    await vi.waitFor(() => expect(screen.getByText(/发布失败/)).toBeInTheDocument())
    expect(localStorage.getItem('tongpin-post-draft')).toBe('会失败的内容')
  })
})
