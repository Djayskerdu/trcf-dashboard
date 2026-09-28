'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '../lib/api'

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const res = await api('login', { username, password })
      onLogin({ token: res.token, user: res.user })
    } catch (err) {
      setError(err.message)
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card glass" onSubmit={submit}>
        <img src="/Add a heading.png" alt="TRCF Youth Jam" className="login-logo" />

        <h1>Welcome back</h1>
        <p className="login-sub">Log in to the TRCF Youth Jam Database</p>

        <label className="field">
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            autoFocus
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <div className="password-row">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {error && <div className="form-error" role="alert">{error}</div>}

        <button className="reset-btn login-btn" type="submit" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>

        <p className="login-hint">Forgot your password? Ask a Youth Jam leader to reset it.</p>
      </form>
    </main>
  )
}
