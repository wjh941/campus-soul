import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { MatchPerson, ProfileBundle } from '../lib/profiles'
import type { Person } from '../lib/demo'
import type { SocialPost } from '../lib/social'
import type { ViewKey } from '../lib/navigation'

export type InsightPerson = MatchPerson & { analysis?: Record<string, number>; topics?: string[] }

export type AppContextValue = {
  // auth
  session: Session | null
  authReady: boolean
  authError: boolean
  retryAuth: () => void
  dismissAuthError: () => void
  requireUser: () => Session['user'] | null
  signOut: () => Promise<void>
  showAuth: boolean
  setShowAuth: (open: boolean) => void
  // profile & matches
  profileBundle: ProfileBundle | undefined
  profile: ProfileBundle['profile'] | undefined
  userAvatar: string
  syncProfileAndMatches: (userId: string) => Promise<void>
  matchPeople: Person[]
  matchesLoading: boolean
  dataMode: 'demo' | 'real' | 'unavailable'
  // social feed
  posts: SocialPost[]
  addPost: (text: string, image?: File) => Promise<void>
  like: (id: string | number) => Promise<void>
  comment: (id: string | number, text: string) => Promise<void>
  removePost: (id: string | number) => Promise<void>
  flagPost: (id: string | number) => Promise<void>
  // ui
  notify: (text: string) => void
  toast: string
  theme: 'light' | 'dark'
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>
  online: boolean
  guestAgeConfirmed: boolean
  setGuestAgeConfirmed: (confirmed: boolean) => void
  unreadNotifications: boolean
  setUnreadNotifications: (unread: boolean) => void
  // overlays
  selectedPerson: Person | null
  setSelectedPerson: React.Dispatch<React.SetStateAction<Person | null>>
  insightPerson: InsightPerson | null
  setInsightPerson: React.Dispatch<React.SetStateAction<InsightPerson | null>>
  showOnboarding: boolean
  setShowOnboarding: (open: boolean) => void
  showLegal: boolean
  setShowLegal: (open: boolean) => void
  showComposer: boolean
  setShowComposer: React.Dispatch<React.SetStateAction<boolean>>
  heartPerson: (person: Person) => Promise<void>
  safetyPerson: (person: Person, action: 'report' | 'block') => Promise<void>
  // nearby discovery
  locationEnabled: boolean
  locationUpdatedAt: string | null
  locating: boolean
  discoveryRadius: number
  nearbyPeople: MatchPerson[]
  locateAndDiscover: () => void
  turnOffLocation: () => Promise<void>
  updateRadius: (value: number) => void
  // navigation
  go: (target: ViewKey, matchId?: string) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used within AppProvider')
  return value
}
