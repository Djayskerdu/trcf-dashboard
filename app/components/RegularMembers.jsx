'use client'

import { useMemo, useState } from 'react'
import { Check, UserPlus, Cake, Users, Phone, Mail, QrCode, CalendarCheck } from 'lucide-react'
import Modal from './Modal'
import { api } from '../lib/api'
import { ymd } from '../lib/tables'

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
const clean = (v) => {
  const s = String(v ?? '').trim()
  return s && s.toUpperCase() !== 'N/A' ? s : ''
}
const dayOf = (raw) => {
  const d = new Date(raw)
  return isNaN(d) ? '' : ymd(d)
}
const prettyDay = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function RegularMembers({ members, attendance, onChanged, search = '' }) {
  const [date, setDate] = useState(() => ymd(new Date()))
  const [override, setOverride] = useState({}) // name -> true/false while a save is in flight
  const [selected, setSelected] = useState(null) // member row
  const [walkIn, setWalkIn] = useState('')
  const [error, setError] = useState('')
  const [busyWalkIn, setBusyWalkIn] = useState(false)

  const list = useMemo(
    () =>
      (members || []).slice(1).filter((r) => String(r[1] || '').trim()).map((r) => ({
        id: r[0], name: String(r[1]).replace(/\s+/g, ' ').trim(), age: r[2], gender: String(r[3] || '').trim(),
        contact: clean(r[4]), email: clean(r[5]), leader: clean(r[6]), qr: r[7],
      })),
    [members]
  )
  const memberNames = useMemo(() => new Set(list.map((m) => norm(m.name))), [list])

  // name -> sorted list of every day they attended (attendance rows are Date | FullName)
  const history = useMemo(() => {
    const map = {}
    ;(attendance || []).slice(1).forEach((r) => {
      const k = dayOf(r[0])
      const n = norm(r[1])
      if (!k || !n) return
      ;(map[n] = map[n] || new Set()).add(k)
    })
    const out = {}
    Object.keys(map).forEach((n) => (out[n] = [...map[n]].sort().reverse()))
    return out
  }, [attendance])

  const presentToday = useMemo(() => {
    const set = new Set()
    ;(attendance || []).slice(1).forEach((r) => {
      if (dayOf(r[0]) === date) set.add(norm(r[1]))
    })
    return set
  }, [attendance, date])

  const isPresent = (name) => {
    const k = norm(name)
    return k in override ? override[k] : presentToday.has(k)
  }

  const walkIns = useMemo(() => {
    const names = new Map()
    ;(attendance || []).slice(1).forEach((r) => {
      if (dayOf(r[0]) === date && !memberNames.has(norm(r[1]))) names.set(norm(r[1]), String(r[1]).trim())
    })
    Object.keys(override).forEach((k) => {
      if (override[k] && !memberNames.has(k) && !names.has(k)) names.set(k, k)
    })
    return [...names.entries()].filter(([k]) => override[k] !== false).map(([, v]) => v)
  }, [attendance, date, memberNames, override])

  const toggle = async (name) => {
    const k = norm(name)
    const next = !isPresent(name)
    setError('')
    setOverride((o) => ({ ...o, [k]: next }))
    try {
      await api('setPresent', { name, date, present: next })
      await onChanged()
    } catch (err) {
      setError(`Couldn't save ${name}: ${err.message}`)
    } finally {
      setOverride((o) => {
        const { [k]: _drop, ...rest } = o
        return rest
      })
    }
  }

  const addWalkIn = async (e) => {
    e.preventDefault()
    const name = walkIn.replace(/\s+/g, ' ').trim()
    if (!name) return
    setBusyWalkIn(true)
    setError('')
    try {
      await api('setPresent', { name, date, present: true })
      setWalkIn('')
      await onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyWalkIn(false)
    }
  }

  const q = norm(search)
  const match = (m) => !q || norm(m.name).includes(q) || norm(m.leader).includes(q)
  const byName = (a, b) => a.name.localeCompare(b.name)
  const male = list.filter((m) => m.gender.toLowerCase() === 'male' && match(m)).sort(byName)
  const female = list.filter((m) => m.gender.toLowerCase() === 'female' && match(m)).sort(byName)
  const other = list.filter((m) => !['male', 'female'].includes(m.gender.toLowerCase()) && match(m)).sort(byName)

  const presentMembers = list.filter((m) => isPresent(m.name)).length
  const total = presentMembers + walkIns.length

  const Column = ({ title, items }) => (
    <div className="rm-col">
      <h4 className="rm-col-title">
        {title} <span>{items.filter((m) => isPresent(m.name)).length}/{items.length}</span>
      </h4>
      {items.map((m) => {
        const on = isPresent(m.name)
        return (
          <div key={m.id || m.name} className={`rm-row ${on ? 'on' : ''}`}>
            <button
              type="button"
              className="rm-check"
              role="checkbox"
              aria-checked={on}
              aria-label={`Mark ${m.name} ${on ? 'absent' : 'present'}`}
              onClick={() => toggle(m.name)}
            >
              {on && <Check size={16} strokeWidth={3} />}
            </button>
            <button type="button" className="rm-name" onClick={() => setSelected(m)}>
              {m.name}
            </button>
          </div>
        )
      })}
      {!items.length && <p className="rm-empty">No one here{q ? ' matches your search' : ''}.</p>}
    </div>
  )

  const sel = selected
  const selDays = sel ? history[norm(sel.name)] || [] : []

  return (
    <div className="glass panel">
      <div className="panel-header">
        <div>
          <h3>Regular Members</h3>
          <p className="attendance-count">
            Tick a name to mark them present. Tap a name to see their details.
          </p>
        </div>
        <div className="date-input-group">
          <label>Attendance date</label>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
      </div>

      <div className="attendance-stats-row">
        <div className="event-stat-box blue-stat">
          <span>Present · {prettyDay(date)}</span>
          <h3>{total}</h3>
        </div>
        <div className="event-stat-box green-stat">
          <span>Regulars / Not on list</span>
          <h3>{presentMembers} / {walkIns.length}</h3>
        </div>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="rm-grid">
        {Column({ title: 'Male', items: male })}
        {Column({ title: 'Female', items: female })}
      </div>
      {other.length > 0 && (
        <div className="rm-grid one">
          {Column({ title: 'Gender not set', items: other })}
        </div>
      )}

      <div className="rm-walkin">
        <h4 className="rm-col-title">Not on the list (new / first timers)</h4>
        <form onSubmit={addWalkIn} className="rm-walkin-form">
          <input
            placeholder="Type full name, then Add"
            value={walkIn}
            onChange={(e) => setWalkIn(e.target.value)}
          />
          <button className="reset-btn" disabled={busyWalkIn || !walkIn.trim()}>
            <UserPlus size={16} /> {busyWalkIn ? 'Adding…' : 'Add'}
          </button>
        </form>
        {walkIns.map((n) => (
          <div key={n} className="rm-row on">
            <button type="button" className="rm-check" role="checkbox" aria-checked="true" onClick={() => toggle(n)}>
              <Check size={16} strokeWidth={3} />
            </button>
            <span className="rm-name static">{n}</span>
          </div>
        ))}
      </div>

      {sel && (
        <Modal title={sel.name} onClose={() => setSelected(null)}>
          <div className="rm-detail">
            <div className="rm-detail-grid">
              <div><Cake size={15} /><span>Age</span><b>{sel.age || '—'}</b></div>
              <div><Users size={15} /><span>Gender</span><b>{sel.gender || '—'}</b></div>
              <div><Users size={15} /><span>LG Leader</span><b>{sel.leader || '—'}</b></div>
              <div><QrCode size={15} /><span>Member ID</span><b>{sel.id || '—'}</b></div>
              {sel.contact && <div><Phone size={15} /><span>Contact</span><b>{sel.contact}</b></div>}
              {sel.email && <div><Mail size={15} /><span>Email</span><b>{sel.email}</b></div>}
            </div>

            <div className="rm-detail-att">
              <h4><CalendarCheck size={15} /> Attendance</h4>
              <p>
                <b>{selDays.length}</b> Friday{selDays.length === 1 ? '' : 's'} attended
                {selDays.length ? ` · last seen ${prettyDay(selDays[0])}` : ''}
              </p>
              {selDays.length > 0 && (
                <div className="rm-dates">
                  {selDays.map((d) => <span key={d}>{prettyDay(d)}</span>)}
                </div>
              )}
            </div>

            <button
              className={`reset-btn rm-detail-btn ${isPresent(sel.name) ? 'is-on' : ''}`}
              onClick={() => toggle(sel.name)}
            >
              {isPresent(sel.name) ? `✓ Present on ${prettyDay(date)} (tap to undo)` : `Mark present · ${prettyDay(date)}`}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
