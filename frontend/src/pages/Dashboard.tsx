import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API, fetchAuth, clearToken } from '../api'

type DashboardData = {
  totalUsers: number
  totalCommissionEarned: number
  pendingCommission: number
  withdrawableBalance: number
  last7DaysEarnings: { date: string; amount: number }[]
}
type User = { id: string; email: string; name: string; status: string; createdAt: string }
type Withdrawal = { id: string; amount: number; status: string; createdAt: string }
type CommissionEntry = { date: string; totalAmount: number; count: number }

export default function Dashboard() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [usersLimit] = useState(10)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [commissionHistory, setCommissionHistory] = useState<CommissionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [addUserName, setAddUserName] = useState('')
  const [addUserEmail, setAddUserEmail] = useState('')
  const [addUserSubmitting, setAddUserSubmitting] = useState(false)

  const loadDashboard = async () => {
    const res = await fetchAuth(API.dashboard)
    if (!res.ok) throw new Error('Failed to load dashboard')
    const data = await res.json()
    setDashboard(data)
  }

  const loadUsers = async () => {
    const res = await fetchAuth(`${API.users}?page=${usersPage}&limit=${usersLimit}`)
    if (!res.ok) throw new Error('Failed to load users')
    const data = await res.json()
    setUsers(data.users)
    setTotalUsers(data.total)
  }

  const loadWithdrawals = async () => {
    const res = await fetchAuth(API.withdrawals)
    if (!res.ok) throw new Error('Failed to load withdrawals')
    const data = await res.json()
    setWithdrawals(data.withdrawals || [])
  }

  const loadCommissionHistory = async () => {
    const res = await fetchAuth(API.commissionHistory())
    if (!res.ok) throw new Error('Failed to load commission history')
    const data = await res.json()
    setCommissionHistory(data.history || [])
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError('')
      try {
        await Promise.all([loadDashboard(), loadWithdrawals(), loadCommissionHistory()])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [usersPage])

  const handleLogout = () => {
    clearToken()
    navigate('/login', { replace: true })
  }

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(withdrawAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount')
      return
    }
    setWithdrawSubmitting(true)
    setError('')
    try {
      const res = await fetchAuth(API.withdrawals, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || data.message || 'Request failed')
        return
      }
      setWithdrawAmount('')
      await Promise.all([loadDashboard(), loadWithdrawals()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setWithdrawSubmitting(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addUserName.trim() || !addUserEmail.trim()) return
    setAddUserSubmitting(true)
    setError('')
    try {
      const res = await fetchAuth(API.users, {
        method: 'POST',
        body: JSON.stringify({ name: addUserName.trim(), email: addUserEmail.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || data.message || 'Create failed')
        return
      }
      setAddUserOpen(false)
      setAddUserName('')
      setAddUserEmail('')
      await Promise.all([loadDashboard(), loadUsers()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setAddUserSubmitting(false)
    }
  }

  const handleBlockUnblock = async (userId: string, block: boolean) => {
    const url = block ? API.userBlock(userId) : API.userUnblock(userId)
    const res = await fetchAuth(url, { method: 'PATCH' })
    if (!res.ok) return
    await loadUsers()
  }

  const handleExportCsv = async () => {
    const res = await fetchAuth(API.commissionHistory({ format: 'csv' }))
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'commission-history.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const earnings = dashboard?.last7DaysEarnings ?? []
  const maxEarnings = Math.max(...earnings.map((e) => e.amount), 1)
  const chartHeight = 140
  const barWidth = 36
  const gap = 12

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-card">
        <h1 className="text-lg font-semibold text-slate-900">Agent Dashboard</h1>
        <nav className="flex gap-2 items-center">
          <button type="button" onClick={() => navigate('/settings')} className="btn-ghost">
            Settings
          </button>
          <button type="button" onClick={handleLogout} className="btn-ghost text-slate-600">
            Logout
          </button>
        </nav>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-medium">
              Dismiss
            </button>
          </div>
        )}

        {/* KPI cards */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 hover:shadow-cardHover transition-shadow">
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{dashboard?.totalUsers ?? 0}</p>
            </div>
            <div className="card p-5 hover:shadow-cardHover transition-shadow">
              <p className="text-sm font-medium text-slate-500">Revenue Earned</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">${(dashboard?.totalCommissionEarned ?? 0).toFixed(2)}</p>
            </div>
            <div className="card p-5 hover:shadow-cardHover transition-shadow">
              <p className="text-sm font-medium text-slate-500">Pending Commission</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">${(dashboard?.pendingCommission ?? 0).toFixed(2)}</p>
            </div>
            <div className="card p-5 hover:shadow-cardHover transition-shadow border-primary-200 bg-primary-50/30">
              <p className="text-sm font-medium text-primary-700">Withdrawable Balance</p>
              <p className="mt-1 text-2xl font-bold text-primary-700">${(dashboard?.withdrawableBalance ?? 0).toFixed(2)}</p>
            </div>
          </div>
        </section>

        {/* Last 7 days earnings */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Last 7 Days Earnings</h2>
          <div className="card p-6">
            {earnings.length === 0 ? (
              <p className="text-sm text-slate-500">No earnings in the last 7 days.</p>
            ) : (
              <div className="flex items-end gap-3" style={{ minHeight: chartHeight + 32 }}>
                {earnings.map((e, i) => (
                  <div key={e.date} className="flex flex-col items-center flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-600 mb-1">${e.amount.toFixed(0)}</span>
                    <div
                      className="w-full rounded-t bg-primary-500 hover:bg-primary-600 transition-colors"
                      style={{
                        height: Math.max(8, (e.amount / maxEarnings) * chartHeight),
                        minWidth: barWidth,
                      }}
                    />
                    <span className="text-xs text-slate-500 mt-2 truncate w-full text-center">{e.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Users */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Users</h2>
            <button type="button" onClick={() => setAddUserOpen(true)} className="btn-primary text-sm py-1.5">
              Add User
            </button>
          </div>
          {addUserOpen && (
            <div className="fixed inset-0 z-10 flex items-center justify-center p-4 bg-slate-900/50" onClick={() => setAddUserOpen(false)}>
              <div className="card p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Add User</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                    <input
                      value={addUserName}
                      onChange={(e) => setAddUserName(e.target.value)}
                      className="input-field"
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={addUserEmail}
                      onChange={(e) => setAddUserEmail(e.target.value)}
                      className="input-field"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={addUserSubmitting} className="btn-primary flex-1">
                      {addUserSubmitting ? 'Adding...' : 'Add User'}
                    </button>
                    <button type="button" onClick={() => setAddUserOpen(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="p-4 font-semibold text-slate-700">Email</th>
                    <th className="p-4 font-semibold text-slate-700">Name</th>
                    <th className="p-4 font-semibold text-slate-700">Status</th>
                    <th className="p-4 font-semibold text-slate-700">Created</th>
                    <th className="p-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-slate-800 font-medium">{u.email}</td>
                      <td className="p-4 text-slate-800">{u.name}</td>
                      <td className="p-4">
                        <span className={u.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}>{u.status}</span>
                      </td>
                      <td className="p-4 text-slate-500">{u.createdAt?.slice(0, 10)}</td>
                      <td className="p-4">
                        {u.status === 'ACTIVE' ? (
                          <button type="button" onClick={() => handleBlockUnblock(u.id, true)} className="text-red-600 hover:text-red-700 text-sm font-medium">
                            Block
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleBlockUnblock(u.id, false)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                            Unblock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalUsers > usersLimit && (
              <div className="p-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
                <span className="text-sm text-slate-500">
                  Page {usersPage} of {Math.ceil(totalUsers / usersLimit)}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={usersPage <= 1}
                    onClick={() => setUsersPage((p) => p - 1)}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={usersPage >= Math.ceil(totalUsers / usersLimit)}
                    onClick={() => setUsersPage((p) => p + 1)}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Commission history + CSV */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Commission History</h2>
            <button type="button" onClick={handleExportCsv} className="btn-secondary text-sm py-1.5">
              Export CSV
            </button>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="p-4 font-semibold text-slate-700">Date</th>
                    <th className="p-4 font-semibold text-slate-700">Total Amount</th>
                    <th className="p-4 font-semibold text-slate-700">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionHistory.map((r) => (
                    <tr key={r.date} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-slate-800 font-medium">{r.date}</td>
                      <td className="p-4 text-slate-800">${r.totalAmount.toFixed(2)}</td>
                      <td className="p-4 text-slate-500">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {commissionHistory.length === 0 && (
              <p className="p-6 text-sm text-slate-500">No commission history.</p>
            )}
          </div>
        </section>

        {/* Withdrawals */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Withdrawals</h2>
          <form onSubmit={handleRequestWithdrawal} className="flex flex-wrap gap-3 items-end mb-6">
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="input-field w-32"
              />
            </div>
            <button type="submit" disabled={withdrawSubmitting} className="btn-primary">
              {withdrawSubmitting ? 'Requesting...' : 'Request Withdrawal'}
            </button>
          </form>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="p-4 font-semibold text-slate-700">Amount</th>
                    <th className="p-4 font-semibold text-slate-700">Status</th>
                    <th className="p-4 font-semibold text-slate-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-slate-800 font-medium">${Number(w.amount).toFixed(2)}</td>
                      <td className="p-4">
                        <span
                          className={
                            w.status === 'APPROVED' ? 'badge-success' : w.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                          }
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{w.createdAt?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {withdrawals.length === 0 && <p className="p-6 text-sm text-slate-500">No withdrawals.</p>}
          </div>
        </section>
      </main>
    </div>
  )
}
