import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  API_BASE,
  API,
  getToken,
  setToken,
  clearToken,
  fetchAuth,
} from './api'

describe('api', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('API_BASE', () => {
    it('defaults to localhost:3000/api when VITE_API_URL is not set', () => {
      expect(API_BASE).toBe('http://localhost:3000/api')
    })
  })

  describe('getToken / setToken / clearToken', () => {
    it('returns null when no token', () => {
      expect(getToken()).toBeNull()
    })
    it('stores and returns token', () => {
      setToken('abc')
      expect(getToken()).toBe('abc')
    })
    it('clears token', () => {
      setToken('abc')
      clearToken()
      expect(getToken()).toBeNull()
    })
  })

  describe('API', () => {
    it('login points to auth/login', () => {
      expect(API.login).toBe(`${API_BASE}/auth/login`)
    })
    it('dashboard points to agents/dashboard', () => {
      expect(API.dashboard).toBe(`${API_BASE}/agents/dashboard`)
    })
    it('user(id) returns users/:id', () => {
      expect(API.user('id-1')).toBe(`${API_BASE}/users/id-1`)
    })
    it('userBlock(id) returns users/:id/block', () => {
      expect(API.userBlock('id-1')).toBe(`${API_BASE}/users/id-1/block`)
    })
    it('userUnblock(id) returns users/:id/unblock', () => {
      expect(API.userUnblock('id-1')).toBe(`${API_BASE}/users/id-1/unblock`)
    })
    it('commissionHistory() returns history URL with optional params', () => {
      expect(API.commissionHistory()).toBe(`${API_BASE}/commissions/history`)
      expect(API.commissionHistory({ startDate: '2024-01-01' })).toBe(
        `${API_BASE}/commissions/history?startDate=2024-01-01`
      )
      expect(API.commissionHistory({ format: 'csv' })).toBe(
        `${API_BASE}/commissions/history?format=csv`
      )
    })
  })

  describe('fetchAuth', () => {
    it('adds Authorization header when token exists', async () => {
      setToken('my-token')
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response())

      await fetchAuth('https://api.example.com/me')

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.example.com/me',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      )
      const call = fetchSpy.mock.calls[0]
      const headers = call[1]?.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer my-token')
      expect(headers.get('Content-Type')).toBe('application/json')
      fetchSpy.mockRestore()
    })
    it('does not add Authorization when no token', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response())

      await fetchAuth('https://api.example.com/me')

      const call = fetchSpy.mock.calls[0]
      const headers = call[1]?.headers as Headers
      expect(headers.get('Authorization')).toBeNull()
      fetchSpy.mockRestore()
    })
  })
})
