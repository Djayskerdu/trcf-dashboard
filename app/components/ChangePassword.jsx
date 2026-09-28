'use client'

import { useState } from 'react'
import Modal from './Modal'
import { api, loadSession, saveSession } from '../lib/api'

export default function ChangePassword({ onClose, onDone }) {
  const [oldPassword, setOld] = useState('')
  const [newPassword, setNew] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirm) return setError("New passwords don't match")
    setBusy(true)
    setError('')
    try {
      const res = await api('changePassword', { oldPassword, newPassword })
      // the old token is invalid now; swap in the fresh one
      const session = { ...loadSession(), token: res.token }
      saveSession(session)
      onDone(session)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Change password" onClose={() => !busy && onClose()}>
      <form className="form-grid one" onSubmit={submit}>
        <label className="field">
          <span>Current password</span>
          <input type="password" value={oldPassword} onChange={(e) => setOld(e.target.value)} autoComplete="current-password" required />
        </label>
        <label className="field">
          <span>New password (min 8 characters)</span>
          <input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} autoComplete="new-password" minLength={8} required />
        </label>
        <label className="field">
          <span>Confirm new password</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" minLength={8} required />
        </label>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="reset-btn" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
        </div>
      </form>
    </Modal>
  )
}
