import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API, fetchAuth, getToken } from '../api'

export default function Settings() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [name, setName] = useState('')
  const [changePwSubmitting, setChangePwSubmitting] = useState(false)
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetchAuth(API.profile)
      if (!res.ok) return
      const data = await res.json()
      if (data.agent?.name) setName(data.agent.name)
    }
    loadProfile()
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      setError('Current password required; new password at least 6 characters')
      return
    }
    setChangePwSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetchAuth(API.changePassword, {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || data.message || 'Failed')
        return
      }
      setMessage('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setChangePwSubmitting(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setProfileSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetchAuth(API.profileUpdate, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || data.message || 'Failed')
        return
      }
      setMessage('Profile updated.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setProfileSubmitting(false)
    }
  }

  if (!getToken()) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex justify-between items-center shadow-card">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h1>
        <button type="button" onClick={() => navigate('/')} className="btn-ghost">
          Back to Dashboard
        </button>
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {message}
          </div>
        )}

        <section className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password (min 6)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                minLength={6}
                required
              />
            </div>
            <button type="submit" disabled={changePwSubmitting} className="btn-primary">
              {changePwSubmitting ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Update Profile</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <button type="submit" disabled={profileSubmitting} className="btn-primary">
              {profileSubmitting ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
