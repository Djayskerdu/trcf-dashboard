'use client'

import { useCallback, useEffect, useState } from 'react'
import { UserPlus, KeyRound, BellRing, Smartphone } from 'lucide-react'
import Modal from './Modal'
import { api } from '../lib/api'

const ROLE_HELP = {
  leader: 'Full access, manages accounts',
  admin: 'Manage all data, no account control',
  staff: 'View + add attendance only',
  conso_head: 'Follows up the leaders of first timers',
  conso_staff: 'Types first timers + assigns a leader',
}

export default function AccountsPanel({ me }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [create, setCreate] = useState(null)
  const [reset, setReset] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [selected, setSelected] = useState([])
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState(null) // { ok, text }

  const load = useCallback(async () => {
    try {
      const res = await api('listAccounts')
      setAccounts(res.accounts || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const run = async (fn) => {
    setBusy(true)
    setFormError('')
    try {
      await fn()
      await load()
      return true
    } catch (err) {
      setFormError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const patch = async (username, changes) => {
    setError('')
    try {
      await api('updateAccount', { username, ...changes })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const notifiable = accounts.filter((a) => a.status === 'active' && a.devices > 0)
  const allSelected = notifiable.length > 0 && notifiable.every((a) => selected.includes(a.username))

  const toggle = (username) =>
    setSelected((cur) => (cur.includes(username) ? cur.filter((u) => u !== username) : [...cur, username]))

  const sendReminder = async () => {
    if (!selected.length || sending) return
    setSending(true)
    setNotice(null)
    try {
      const res = await api('notify', { usernames: selected })
      const skipped = res.skipped?.length ? ` · ${res.skipped.length} had no device` : ''
      setNotice({ ok: true, text: `Reminder sent to ${res.accounts} account(s) on ${res.sent} device(s)${skipped}` })
      setSelected([])
    } catch (err) {
      setNotice({ ok: false, text: err.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="glass panel accounts-panel" style={{ marginBottom: 24 }}>
      <div className="panel-header">
        <div>
          <h3>Accounts</h3>
          <p className="attendance-count">
            Who can log in — and who gets reminders. Tick accounts, then send a notification.
          </p>
        </div>
        <button
          className="reset-btn manage-add"
          onClick={() => {
            setFormError('')
            setCreate({ username: '', name: '', role: 'staff', password: '' })
          }}
        >
          <UserPlus size={16} /> New account
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}
      {notice && (
        <div className={notice.ok ? 'form-ok' : 'form-error'} role="status">{notice.text}</div>
      )}

      <div className="table-wrapper">
        <table className="compact">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  aria-label="Select all accounts that can receive notifications"
                  checked={allSelected}
                  disabled={!notifiable.length}
                  onChange={() => setSelected(allSelected ? [] : notifiable.map((a) => a.username))}
                />
              </th>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Notifications</th>
              <th>Last login</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ textAlign: 'center', opacity: 0.6 }}>Loading…</td></tr>
            )}
            {accounts.map((a) => {
              const isMe = a.username === me.username
              return (
                <tr key={a.username} className={selected.includes(a.username) ? 'row-selected' : ''}>
                  <td className="col-check">
                    <input
                      type="checkbox"
                      aria-label={`Select ${a.name}`}
                      checked={selected.includes(a.username)}
                      disabled={a.status !== 'active' || !a.devices}
                      title={a.devices ? '' : 'No device registered yet'}
                      onChange={() => toggle(a.username)}
                    />
                  </td>
                  <td>{a.name}{isMe && <span className="badge">you</span>}</td>
                  <td>{a.username}</td>
                  <td>
                    <select
                      className="inline-select"
                      value={a.role}
                      disabled={isMe}
                      title={ROLE_HELP[a.role]}
                      onChange={(e) => patch(a.username, { role: e.target.value })}
                    >
                      {Object.keys(ROLE_HELP).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      {a.role === 'consolidation' && <option value="consolidation">consolidation (old — same as conso_staff)</option>}
                    </select>
                  </td>
                  <td>
                    <span className={`status-pill ${a.status === 'active' ? 'ok' : 'off'}`}>{a.status}</span>
                  </td>
                  <td>
                    {a.devices > 0 ? (
                      <span className="device-pill on">
                        <Smartphone size={13} /> {a.devices} device{a.devices > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="device-pill off" title="Ask them to log in on the installed app and allow notifications">
                        No device
                      </span>
                    )}
                  </td>
                  <td>
                    {a.lastLogin
                      ? new Date(a.lastLogin).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Never'}
                  </td>
                  <td className="col-actions">
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        title="Reset password"
                        onClick={() => {
                          setFormError('')
                          setReset({ username: a.username, name: a.name, password: '' })
                        }}
                      >
                        <KeyRound size={16} />
                      </button>
                      {!isMe && (
                        <button
                          className="btn-ghost small"
                          onClick={() =>
                            patch(a.username, { status: a.status === 'active' ? 'disabled' : 'active' })
                          }
                        >
                          {a.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="send-bar">
        <span>
          {selected.length
            ? `${selected.length} selected`
            : notifiable.length
              ? 'Select accounts to remind'
              : 'No account has a registered device yet'}
        </span>
        <button className="reset-btn" onClick={sendReminder} disabled={!selected.length || sending}>
          <BellRing size={16} /> {sending ? 'Sending…' : 'Send reminder'}
        </button>
      </div>

      {create && (
        <Modal title="New account" onClose={() => !busy && setCreate(null)}>
          <form
            className="form-grid one"
            onSubmit={async (e) => {
              e.preventDefault()
              const ok = await run(() => api('createAccount', create))
              if (ok) setCreate(null)
            }}
          >
            <label className="field">
              <span>Full name</span>
              <input value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} required />
            </label>
            <label className="field">
              <span>Username</span>
              <input
                value={create.username}
                autoCapitalize="none"
                onChange={(e) => setCreate({ ...create, username: e.target.value.toLowerCase() })}
                required
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select value={create.role} onChange={(e) => setCreate({ ...create, role: e.target.value })}>
                {Object.entries(ROLE_HELP).map(([r, h]) => (
                  <option key={r} value={r}>{r} — {h}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Temporary password (min 8 characters)</span>
              <input
                type="text"
                value={create.password}
                onChange={(e) => setCreate({ ...create, password: e.target.value })}
                minLength={8}
                required
              />
            </label>
            {formError && <div className="form-error">{formError}</div>}
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setCreate(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="reset-btn" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
            </div>
          </form>
        </Modal>
      )}

      {reset && (
        <Modal title={`Reset password — ${reset.name}`} onClose={() => !busy && setReset(null)}>
          <form
            className="form-grid one"
            onSubmit={async (e) => {
              e.preventDefault()
              const ok = await run(() => api('updateAccount', { username: reset.username, password: reset.password }))
              if (ok) setReset(null)
            }}
          >
            <label className="field">
              <span>New password (min 8 characters)</span>
              <input
                type="text"
                value={reset.password}
                onChange={(e) => setReset({ ...reset, password: e.target.value })}
                minLength={8}
                required
                autoFocus
              />
            </label>
            {formError && <div className="form-error">{formError}</div>}
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setReset(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="reset-btn" disabled={busy}>{busy ? 'Saving…' : 'Reset password'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
