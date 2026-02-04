import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(API.forgotPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || data.message || 'Request failed')
        return
      }
      setMessage(data.message ?? 'If an account exists, you will receive instructions.')
    } catch {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Forgot Password</h1>
        <p className="text-sm text-slate-500 mb-6">Enter your email. (Dummy flow: no email is sent.)</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          )}
          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
            {submitting ? 'Sending...' : 'Submit'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}
