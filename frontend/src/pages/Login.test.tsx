import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

// Mock react-router navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock api
vi.mock('../api', () => ({
  API: { login: 'http://api/auth/login' },
  setToken: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn()
})

describe('Login', () => {
  it('renders sign in form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /agent panel/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows error when login fails', async () => {
    const user = userEvent.setup()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'agent@example.com')
    await user.type(screen.getByPlaceholderText(/••••••••/), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
  })

  it('navigates to dashboard when login succeeds', async () => {
    const user = userEvent.setup()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'fake-token',
        agent: { id: '1', email: 'a@b.com', name: 'A', status: 'ACTIVE' },
      }),
    })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'agent@example.com')
    await user.type(screen.getByPlaceholderText(/••••••••/), 'secret')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })
})
