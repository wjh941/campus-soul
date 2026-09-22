import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AppContext } from '../context/AppContext'
import type { AppContextValue } from '../context/AppContext'
import type { Person } from '../lib/demo'

/** A minimal fake session, shaped like a Supabase Session for component props. */
export const fakeSession = { user: { id: 'u1', user_metadata: { nickname: '测试用户' } } } as never

export const demoPerson = {
  id: 1, userId: 'p1', name: '林知夏', age: 21, school: '同济大学', major: '建筑学',
  score: 92, distance: '1.2km', avatar: 'a.png', tags: ['INFJ'], quote: 'quote',
  color: '#ff715b', dimensions: [90, 80, 70], reasons: ['兴趣相近'], verified: false,
} satisfies Person

/** Fresh AppContextValue with vi.fn() actions; override any slice per test. */
export function createAppValue(overrides: Partial<AppContextValue> = {}): AppContextValue {
  const notify = vi.fn()
  return {
    session: null, authReady: true, authError: false,
    retryAuth: vi.fn(), dismissAuthError: vi.fn(),
    requireUser: vi.fn(() => null), signOut: vi.fn(async () => {}),
    showAuth: false, setShowAuth: vi.fn(),
    profileBundle: undefined, profile: undefined,
    userAvatar: 'https://example.com/avatar.png',
    syncProfileAndMatches: vi.fn(async () => {}),
    matchPeople: [], matchesLoading: false, dataMode: 'demo',
    posts: [], addPost: vi.fn(async () => {}), like: vi.fn(async () => {}), comment: vi.fn(async () => {}),
    removePost: vi.fn(async () => {}), flagPost: vi.fn(async () => {}),
    notify, toast: '', theme: 'light', setTheme: vi.fn(), online: true,
    guestAgeConfirmed: true, setGuestAgeConfirmed: vi.fn(),
    unreadNotifications: false, setUnreadNotifications: vi.fn(),
    selectedPerson: null, setSelectedPerson: vi.fn(),
    insightPerson: null, setInsightPerson: vi.fn(),
    showOnboarding: false, setShowOnboarding: vi.fn(),
    showLegal: false, setShowLegal: vi.fn(),
    showComposer: false, setShowComposer: vi.fn(),
    heartPerson: vi.fn(async () => {}),
    safetyPerson: vi.fn(async () => {}),
    locationEnabled: false, locationUpdatedAt: null, locating: false,
    discoveryRadius: 50, nearbyPeople: [],
    locateAndDiscover: vi.fn(), turnOffLocation: vi.fn(async () => {}), updateRadius: vi.fn(),
    go: vi.fn(),
    ...overrides,
  }
}

export function renderWithApp(
  ui: ReactElement,
  { value = createAppValue(), route = '/' }: { value?: AppContextValue; route?: string } = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AppContext.Provider value={value}>{children}</AppContext.Provider>
      </MemoryRouter>
    )
  }
  return { value, ...render(ui, { wrapper: Wrapper }) }
}
