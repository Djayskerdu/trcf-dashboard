'use client'

import { useMemo, useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { api } from '../lib/api'
import { ymd } from '../lib/tables'
import { CONSO_MANAGERS } from '../lib/access'

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
const clean = (v) => {
  const s = String(v ?? '').trim()
  return s && s.toUpperCase() !== 'N/A' ? s : ''
}
const dayOf = (raw) => {
  const d = new Date(raw)
  return isNaN(d) ? '' : ymd(d)
}

const EMPTY = { name: '', age: '', gender: '', invited: '', leader: '', markPresent: true }

// Consolidation Team. Typing a first timer here:
//   1. adds a row to Consolidation (name, age, gender, who invited, leader assigned to follow up)
//   2. optionally writes a Date | FullName row to Attendance
export default function FirstTimers({ me, members, leaders, attendance, consolidation, refs, onChanged }) {
  const [date, setDate] = useState(() => ymd(new Date()))
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const canDelete = CONSO_MANAGERS.includes(me?.role)

  const memberNames = useMemo(
    () => new Set((members || []).slice(1).map((r) => norm(r[1])).filter(Boolean)),
    [members]
  )

  const leaderList = useMemo(() => {
    const seen = new Map()
    ;(leaders || []).slice(1).forEach((r) => {
      const n = String(r[1] ?? '').replace(/\s+/g, ' ').trim()
      if (n && !seen.has(norm(n))) seen.set(norm(n), n)
    })
    return [...seen.values()].sort((a, b) => a.localeCompare(b))
  }, [leaders])

  const inviterNames = useMemo(() => {
    const set = new Map()
    ;(members || []).slice(1).forEach((r) => { const n = clean(r[1]); if (n) set.set(norm(n), n) })
    leaderList.forEach((n) => set.set(norm(n), n))
    return [...set.values()].sort((a, b) => a.localeCompare(b))
  }, [members, leaderList])

  // Consolidation rows for the selected date, keyed by name
  const assigned = useMemo(() => {
    const map = new Map()
    ;(consolidation || []).slice(1).forEach((r, i) => {
      if (dayOf(r[0]) === date && norm(r[1])) {
        map.set(norm(r[1]), { leader: String(r[5] ?? '').trim(), ref: refs?.consolidation?.[i + 1] || '', name: String(r[1]).trim() })
      }
    })
    return map
  }, [consolidation, refs, date])

  // Everyone who is a first timer on this date: typed here (Consolidation) or already in Attendance
  const today = useMemo(() => {
    const seen = new Map()
    ;(attendance || []).slice(1).forEach((r) => {
      const n = norm(r[1])
      if (n && dayOf(r[0]) === date && !memberNames.has(n)) seen.set(n, String(r[1]).replace(/\s+/g, ' ').trim())
    })
    assigned.forEach((a, n) => { if (!seen.has(n)) seen.set(n, a.name) })
    return [...seen.values()].sort((a, b) => a.localeCompare(b))
  }, [attendance, assigned, memberNames, date])

  const remove = async (n) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await api('setPresent', { name: n, date, present: false })
      const a = assigned.get(norm(n))
      if (a && canDelete && a.ref) await api('delete', { table: 'consolidation', ref: a.ref, expect: a.name })
      await onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const add = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const name = form.name.replace(/\s+/g, ' ').trim()
    if (!name) return
    if (memberNames.has(norm(name))) {
      setError(`${name} is already a regular member. Tick them on the Regular Members page instead.`)
      return
    }
    if (!form.leader) {
      setError('Choose the leader who will follow up.')
      return
    }
    if (assigned.has(norm(name))) {
      setError(`${name} is already listed for this date.`)
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await api('add', {
        table: 'consolidation',
        values: [date, name, form.age, form.gender, form.invited.trim(), form.leader, 'PENDING', '', '', ''],
      })
      let extra = ''
      if (form.markPresent) {
        try {
          await api('setPresent', { name, date, present: true })
        } catch (err) {
          extra = ` (saved, but attendance failed: ${err.message})`
        }
      }
      setNotice(`${name} assigned to ${form.leader}.${extra}`)
      setForm({ ...EMPTY, leader: form.leader, markPresent: form.markPresent }) // same leader often gets several
      await onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass panel">
      <div className="panel-header">
        <div>
          <h3>First Timers</h3>
          <p className="attendance-count">Type each first timer’s details and choose the leader who will follow them up, then Add.</p>
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
      {notice && <div className="form-ok" role="status">{notice}</div>}

      <form onSubmit={add} className="conso-form">
        <label className="field">
          <span>Full name <em className="req">*</em></span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="field">
          <span>Age</span>
          <input type="number" min="1" max="99" inputMode="numeric" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        </label>
        <label className="field">
          <span>Gender</span>
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">—</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </label>
        <label className="field">
          <span>Who invited</span>
          <input list="ft-inviters" value={form.invited} onChange={(e) => setForm({ ...form, invited: e.target.value })} />
          <datalist id="ft-inviters">{inviterNames.map((n) => <option key={n} value={n} />)}</datalist>
        </label>
        <label className="field">
          <span>Leader to follow up <em className="req">*</em></span>
          <select value={form.leader} onChange={(e) => setForm({ ...form, leader: e.target.value })} required>
            <option value="">Choose a leader…</option>
            {leaderList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="conso-check">
          <input type="checkbox" checked={form.markPresent} onChange={(e) => setForm({ ...form, markPresent: e.target.checked })} />
          Also mark present in Attendance
        </label>
        <button className="reset-btn conso-submit" disabled={busy || !form.name.trim() || !form.leader}>
          <UserPlus size={16} /> {busy ? 'Adding…' : 'Add'}
        </button>
      </form>

      <div className="rm-walkin">
        {today.map((n) => {
          const a = assigned.get(norm(n))
          return (
            <div key={n} className="rm-row on">
              <span className="rm-name static">{n}{a?.leader ? ` → ${a.leader}` : ''}</span>
              {(canDelete || !a) && (
                <button type="button" className="rm-chip" disabled={busy} onClick={() => remove(n)} aria-label={`Remove ${n}`}>
                  <X size={12} /> Remove
                </button>
              )}
            </div>
          )
        })}
        {!today.length && <p className="rm-empty">No first timers recorded for this date yet.</p>}
      </div>
    </div>
  )
}
