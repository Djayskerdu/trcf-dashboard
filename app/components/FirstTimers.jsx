'use client'

import { useMemo, useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { api } from '../lib/api'
import { ymd } from '../lib/tables'

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
const dayOf = (raw) => {
  const d = new Date(raw)
  return isNaN(d) ? '' : ymd(d)
}

// Consolidation Team only. Typing a name here writes a Date | FullName row to Attendance.
export default function FirstTimers({ members, attendance, onChanged }) {
  const [date, setDate] = useState(() => ymd(new Date()))
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const memberNames = useMemo(
    () => new Set((members || []).slice(1).map((r) => norm(r[1])).filter(Boolean)),
    [members]
  )

  const today = useMemo(() => {
    const seen = new Map()
    ;(attendance || []).slice(1).forEach((r) => {
      const n = norm(r[1])
      if (n && dayOf(r[0]) === date && !memberNames.has(n)) seen.set(n, String(r[1]).replace(/\s+/g, ' ').trim())
    })
    return [...seen.values()].sort((a, b) => a.localeCompare(b))
  }, [attendance, date, memberNames])

  const run = async (n, present) => {
    setBusy(true)
    setError('')
    try {
      await api('setPresent', { name: n, date, present })
      await onChanged()
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const add = async (e) => {
    e.preventDefault()
    const n = name.replace(/\s+/g, ' ').trim()
    if (!n) return
    if (memberNames.has(norm(n))) {
      setError(`${n} is already a regular member. Tick them on the Regular Members page instead.`)
      return
    }
    if (await run(n, true)) setName('')
  }

  return (
    <div className="glass panel">
      <div className="panel-header">
        <div>
          <h3>First Timers</h3>
          <p className="attendance-count">Type the full name of each first timer, then Add. They appear in Attendance right away.</p>
        </div>
        <div className="date-input-group">
          <label>Attendance date</label>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
      </div>

      <div className="attendance-stats-row">
        <div className="event-stat-box green-stat">
          <span>First timers on {date}</span>
          <h3>{today.length}</h3>
        </div>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="rm-walkin">
        <form onSubmit={add} className="rm-walkin-form">
          <input placeholder="Type full name, then Add" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="reset-btn" disabled={busy || !name.trim()}>
            <UserPlus size={16} /> {busy ? 'Adding…' : 'Add'}
          </button>
        </form>
        {today.map((n) => (
          <div key={n} className="rm-row on">
            <span className="rm-name static">{n}</span>
            <button type="button" className="rm-chip" disabled={busy} onClick={() => run(n, false)} aria-label={`Remove ${n}`}>
              <X size={12} /> Remove
            </button>
          </div>
        ))}
        {!today.length && <p className="rm-empty">No first timers recorded for this date yet.</p>}
      </div>
    </div>
  )
}
