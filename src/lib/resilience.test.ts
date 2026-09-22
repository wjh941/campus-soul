import { describe, expect, it, vi } from 'vitest'
import { friendlyError, retry, safeStorage, TimeoutError, withTimeout } from './resilience'

describe('friendlyError', () => {
  it('maps TimeoutError to its own message', () => {
    expect(friendlyError(new TimeoutError('匹配数据加载超时，请稍后重试'))).toBe('匹配数据加载超时，请稍后重试')
  })
  it('maps network TypeErrors to a friendly network hint', () => {
    expect(friendlyError(new TypeError('fetch failed'))).toBe('网络连接不稳定，请检查网络后重试')
  })
  it('passes through normal Error messages', () => {
    expect(friendlyError(new Error('动态已删除'))).toBe('动态已删除')
  })
  it('falls back for unknown throwables', () => {
    expect(friendlyError(42)).toBe('操作失败，请稍后重试')
    expect(friendlyError(null, '举报失败')).toBe('举报失败')
  })
})

describe('withTimeout', () => {
  it('resolves when the task finishes in time', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok')
  })
  it('rejects with TimeoutError and custom message when too slow', async () => {
    vi.useFakeTimers()
    const slow = new Promise<never>(() => {})
    const result = withTimeout(slow, 10, '登录状态读取超时')
    vi.advanceTimersByTime(20)
    await expect(result).rejects.toThrow('登录状态读取超时')
    vi.useRealTimers()
  })
})

describe('retry', () => {
  it('returns the first successful attempt', async () => {
    const run = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('fine')
    await expect(retry(run, 3)).resolves.toBe('fine')
    expect(run).toHaveBeenCalledTimes(2)
  })
  it('throws the last error after exhausting attempts', async () => {
    const run = vi.fn().mockRejectedValue(new Error('always fails'))
    await expect(retry(run, 2, 1)).rejects.toThrow('always fails')
    expect(run).toHaveBeenCalledTimes(2)
  })
})

describe('safeStorage', () => {
  it('round-trips values through localStorage', () => {
    safeStorage.set('test-key', 'v1')
    expect(safeStorage.get('test-key')).toBe('v1')
    safeStorage.remove('test-key')
    expect(safeStorage.get('test-key')).toBeNull()
  })
})
