import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ForgotPassword from './ForgotPassword'

vi.mock('../api', () => ({
  API: { forgotPassword: 'http://api/forgot-password' },
}))

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn()
})

describe('ForgotPassword', () => {
  it('renders heading and email form', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
  })

  it('shows success message when submit succeeds', async () => {
    const user = userEvent.setup()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'If an account exists, you will receive instructions.' }),
    })
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    )
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'agent@example.com')
    await user.click(screen.getByRole('button', { name: /submit/i }))
    expect(await screen.findByText(/if an account exists/i)).toBeInTheDocument()
  })

  it('shows error when submit fails', async () => {
    const user = userEvent.setup()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Request failed' }),
    })
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    )
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'agent@example.com')
    await user.click(screen.getByRole('button', { name: /submit/i }))
    expect(await screen.findByText(/request failed/i)).toBeInTheDocument()
  })

  it('shows network error on fetch throw', async () => {
    const user = userEvent.setup()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    )
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'agent@example.com')
    await user.click(screen.getByRole('button', { name: /submit/i }))
    expect(await screen.findByText(/network error/i)).toBeInTheDocument()
  })
})
