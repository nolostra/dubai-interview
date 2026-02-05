import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { getToken } from './api'
import App from './App'

vi.mock('./pages/Login', () => ({ default: () => <div>Login Page</div> }))
vi.mock('./pages/ForgotPassword', () => ({ default: () => <div>Forgot Password Page</div> }))
vi.mock('./pages/Dashboard', () => ({ default: () => <div>Dashboard Page</div> }))
vi.mock('./pages/Settings', () => ({ default: () => <div>Settings Page</div> }))
vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, getToken: vi.fn() }
})

describe('App', () => {
  beforeEach(() => {
    vi.mocked(getToken).mockReturnValue(null)
  })

  it('shows Login when no token and path is /', () => {
    vi.mocked(getToken).mockReturnValue(null)
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/login page/i)).toBeInTheDocument()
  })

  it('shows Dashboard when token exists and path is /', () => {
    vi.mocked(getToken).mockReturnValue('fake-token')
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/dashboard page/i)).toBeInTheDocument()
  })

  it('shows Login at /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/login page/i)).toBeInTheDocument()
  })

  it('shows Forgot Password at /forgot-password', () => {
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/forgot password page/i)).toBeInTheDocument()
  })

  it('redirects to login when no token and path is /settings', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/login page/i)).toBeInTheDocument()
  })

  it('shows Settings when token exists and path is /settings', () => {
    vi.mocked(getToken).mockReturnValue('fake-token')
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/settings page/i)).toBeInTheDocument()
  })
})
