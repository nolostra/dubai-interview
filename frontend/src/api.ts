// Backend API base URL
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  localStorage.setItem('token', token)
}

export function clearToken(): void {
  localStorage.removeItem('token')
}

export async function fetchAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')
  return fetch(url, { ...options, headers })
}

export const API = {
  login: `${API_BASE}/auth/login`,
  forgotPassword: `${API_BASE}/auth/forgot-password`,
  me: `${API_BASE}/auth/me`,
  changePassword: `${API_BASE}/auth/change-password`,
  dashboard: `${API_BASE}/agents/dashboard`,
  profile: `${API_BASE}/agents/profile`,
  profileUpdate: `${API_BASE}/agents/profile`,
  users: `${API_BASE}/users`,
  user: (id: string) => `${API_BASE}/users/${id}`,
  userBlock: (id: string) => `${API_BASE}/users/${id}/block`,
  userUnblock: (id: string) => `${API_BASE}/users/${id}/unblock`,
  commissions: `${API_BASE}/commissions`,
  commissionHistory: (params?: { startDate?: string; endDate?: string; format?: string }) => {
    const p = new URLSearchParams()
    if (params?.startDate) p.set('startDate', params.startDate)
    if (params?.endDate) p.set('endDate', params.endDate)
    if (params?.format) p.set('format', params.format)
    const q = p.toString()
    return `${API_BASE}/commissions/history${q ? `?${q}` : ''}`
  },
  withdrawals: `${API_BASE}/withdrawals`,
} as const
