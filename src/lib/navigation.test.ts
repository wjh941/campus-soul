import { describe, expect, it } from 'vitest'
import { mobileNav, navGroups, pathFor, viewFromPath, viewTitle } from './navigation'

describe('pathFor', () => {
  it('maps home to /', () => {
    expect(pathFor('home')).toBe('/')
  })
  it('maps other views to their slug', () => {
    expect(pathFor('matches')).toBe('/matches')
    expect(pathFor('messages')).toBe('/messages')
  })
})

describe('viewFromPath', () => {
  it('parses a route path into a view key', () => {
    expect(viewFromPath('/matches')).toBe('matches')
    expect(viewFromPath('/messages')).toBe('messages')
  })
  it('falls back to home for / and unknown paths', () => {
    expect(viewFromPath('/')).toBe('home')
    expect(viewFromPath('/does-not-exist')).toBe('home')
    expect(viewFromPath('')).toBe('home')
  })
})

describe('viewTitle', () => {
  it('greets a logged-in user by nickname on home', () => {
    expect(viewTitle('home', '小满')).toBe('你好，小满')
  })
  it('uses the generic welcome for guests', () => {
    expect(viewTitle('home')).toBe('欢迎来到同频')
  })
  it('maps every nav item to a title', () => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.id !== 'home') expect(viewTitle(item.id)).not.toBe('')
      }
    }
  })
})

describe('nav config', () => {
  it('mobile nav contains the five primary destinations', () => {
    expect(mobileNav.map(item => item.id)).toEqual(['home', 'matches', 'moments', 'messages', 'profile'])
  })
})
