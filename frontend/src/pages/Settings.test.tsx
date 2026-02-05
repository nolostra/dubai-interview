import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Settings from './Settings'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import { getToken, fetchAuth } from '../api'

vi.mock('../api', () => ({
  API: {
    profile: 'http://api/profile',
    profileUpdate: 'http://api/profile',
    changePassword: 'http://api/change-password',
  },
  fetchAuth: vi.fn(),
  getToken: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getToken).mockReturnValue('fake-token')
  vi.mocked(fetchAuth).mockResolvedValue({
    ok: true,
    json: async () => ({ agent: { name: 'Agent Name' } }),
  } as Response)
})

describe('Settings', () => {
  it('renders Settings heading and change password form', async () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )
    expect(await screen.findByRole('heading', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument()
  })

  it('renders update profile form', async () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )
    expect(await screen.findByRole('heading', { name: /update profile/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument()
  })

  it('shows validation error when new password is too short', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )
    await screen.findByRole('heading', { name: /settings/i })
    await user.type(screen.getByLabelText(/current password/i), 'current')
    await user.type(screen.getByLabelText(/new password/i), '12345')
    await user.click(screen.getByRole('button', { name: /change password/i }))
    expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument()
  })

  it('navigates to login when no token', () => {
    vi.mocked(getToken).mockReturnValue(null)
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })
})
