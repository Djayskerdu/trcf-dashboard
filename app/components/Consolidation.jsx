'use client'

import { useMemo, useState } from 'react'
import { UserPlus, Phone, Pencil, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Modal from './Modal'
import { api } from '../lib/api'
import { ymd } from '../lib/tables'
import { CONSO_MANAGERS } from '../lib/access'

const STATUSES = ['PENDING', 'CONTACTED', 'DONE']
const LATE_DAYS = 3 // a first timer still PENDING after this many days is flagged

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
  if (!key) return '—'
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const daysSince = (key) => {
  if (!key) return 0
  const [y, m, d] = key.split('-').map(Number)
  const then = new Date(y, m - 1, d)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((now - then) / 86400000))
}
// Sheet stores 9305920971 (leading 0 lost) -> 09305920971
const phoneOf = (raw) => {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length === 10 && digits.startsWith('9') ? '0' + digits : digits
}

const EMPTY = { name: '', age: '', gender: '', invited: '', leader: '', markPresent: true }

export default function Consolidation({ me, members, leaders, consolidation, refs, attendance, onChanged }) {
  const isManager = CONSO_MANAGERS.includes(me.role)
  const canDelete = isManager

  const [date, setDate] = useState(() => ymd(new Date()))
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [edit, setEdit] = useState(null) // entry being edited
  const [editError, setEditError] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const leaderList = useMemo(() => {
    const seen = new Map()
    ;(leaders || []).slice(1).forEach((r) => {
      const n = String(r[1] ?? '').replace(/\s+/g, ' ').trim()
      if (n && !seen.has(norm(n))) seen.set(norm(n), { name: n, contact: phoneOf(r[4]), position: clean(r[0]) })
    })
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [leaders])
  const leaderByName = useMemo(() => Object.fromEntries(leaderList.map((l) => [norm(l.name), l])), [leaderList])

  const inviterNames = useMemo(() => {
    const set = new Map()
    ;(members || []).slice(1).forEach((r) => { const n = clean(r[1]); if (n) set.set(norm(n), n) })
    leaderList.forEach((l) => set.set(norm(l.name), l.name))
    return [...set.values()].sort((a, b) => a.localeCompare(b))
  }, [members, leaderList])

  // rows[0] is the header; refs[i] is "Consolidation:rowNumber" for row i
  const entries = useMemo(
    () =>
      (consolidation || []).slice(1).map((r, i) => ({
        ref: refs?.consolidation?.[i + 1] || '',
        day: dayOf(r[0]),
        name: String(r[1] ?? '').trim(),
        age: r[2] === '' || r[2] == null ? '' : String(r[2]),
        gender: String(r[3] ?? '').trim(),
        invited: clean(r[4]),
        leader: String(r[5] ?? '').trim(),
        status: STATUSES.includes(String(r[6] ?? '').toUpperCase()) ? String(r[6]).toUpperCase() : 'PENDING',
        notes: String(r[7] ?? '').trim(),
        by: String(r[8] ?? '').trim(),
      })).filter((e) => e.name),
    [consolidation, refs]
  )

  const todays = entries.filter((e) => e.day === date)
  const pending = entries.filter((e) => e.status === 'PENDING')
  const late = pending.filter((e) => daysSince(e.day) >= LATE_DAYS)

  // Leader board: every assigned leader with their first timers
  const board = useMemo(() => {
    const map = new Map()
    entries.forEach((e) => {
      if (statusFilter !== 'ALL' && e.status !== statusFilter) return
      const k = norm(e.leader) || '—'
      if (!map.has(k)) map.set(k, { name: e.leader || 'Unassigned', items: [] })
      map.get(k).items.push(e)
    })
    return [...map.values()]
      .map((g) => ({
        ...g,
        info: leaderByName[norm(g.name)],
        open: g.items.filter((e) => e.status !== 'DONE').length,
        late: g.items.filter((e) => e.status === 'PENDING' && daysSince(e.day) >= LATE_DAYS).length,
        items: g.items.sort((a, b) => (b.day > a.day ? 1 : b.day < a.day ? -1 : a.name.localeCompare(b.name))),
      }))
      .sort((a, b) => b.late - a.late || b.open - a.open || a.name.localeCompare(b.name))
  }, [entries, statusFilter, leaderByName])

  const toValues = (e) => [e.day, e.name, e.age, e.gender, e.invited, e.leader, e.status, e.notes, '', '']

  const add = async (ev) => {
    ev.preventDefault()
    const name = form.name.replace(/\s+/g, ' ').trim()
    if (!name) return
    if (!form.leader) { setError('Choose the leader who will follow up.'); return }
    if (entries.some((e) => norm(e.name) === norm(name) && e.day === date)) {
      setError(`${name} is already listed for ${prettyDay(date)}.`)
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
        try { await api('setPresent', { name, date, present: true }) } catch (err) { extra = ` (saved, but attendance failed: ${err.message})` }
      }
      setNotice(`${name} assigned to ${form.leader}.${extra}`)
      setForm({ ...EMPTY, leader: form.leader, markPresent: form.markPresent }) // keep leader: same leader often gets several
      await onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async (ev) => {
    ev.preventDefault()
    setBusy(true)
    setEditError('')
    try {
      await api('update', { table: 'consolidation', ref: edit.ref, expect: edit.original, values: toValues(edit) })
      setEdit(null)
      await onChanged()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Remove ${edit.name} from Consolidation?`)) return
    setBusy(true)
    setEditError('')
    try {
      await api('delete', { table: 'consolidation', ref: edit.ref, expect: edit.original })
      setEdit(null)
      await onChanged()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const quickStatus = async (e, status) => {
    setError('')
    try {
      await api('update', { table: 'consolidation', ref: e.ref, expect: e.name, values: toValues({ ...e, status }) })
      await onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  const canEditRow = (e) => isManager || norm(e.by) === norm(me.username)
  const openEdit = (e) => { setEditError(''); setEdit({ ...e, original: e.name }) }

  const entryRow = (e, showLeader) => (
    <div key={e.ref || e.name} className={`conso-row ${e.status === 'DONE' ? 'done' : ''} ${e.status === 'PENDING' && daysSince(e.day) >= LATE_DAYS ? 'late' : ''}`}>
      <div className="conso-main">
        <strong>{e.name}</strong>
        <span className="conso-meta">
          {[e.age && `${e.age} yrs`, e.gender, e.invited && `invited by ${e.invited}`, prettyDay(e.day)].filter(Boolean).join(' · ')}
          {showLeader && ` · → ${e.leader}`}
        </span>
        {e.notes && <span className="conso-note">{e.notes}</span>}
      </div>
      {isManager ? (
        <select
          className="inline-select"
          value={e.status}
          aria-label={`Status for ${e.name}`}
          onChange={(ev) => quickStatus(e, ev.target.value)}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ) : (
        <span className={`status-badge status-${e.status === 'DONE' ? 'completed' : e.status === 'PENDING' ? 'pending' : 'default'}`}>{e.status}</span>
      )}
      {canEditRow(e) && (
        <button type="button" className="icon-btn" onClick={() => openEdit(e)} aria-label={`Edit ${e.name}`}>
          <Pencil size={15} />
        </button>
      )}
    </div>
  )

  return (
    <div className="glass panel">
      <div className="panel-header">
        <div>
          <h3>Consolidation</h3>
          <p className="attendance-count">
            {isManager
              ? 'Every first timer and the leader assigned to follow them up. Change the status as leaders report back.'
              : 'Type each first timer, then choose the leader who will follow them up.'}
          </p>
        </div>
        <div className="date-input-group">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
      </div>

      <div className="attendance-stats-row">
        <div className="event-stat-box blue-stat">
          <span>Assigned on {prettyDay(date)}</span>
          <h3>{todays.length}</h3>
        </div>
        <div className="event-stat-box green-stat">
          <span>Still pending</span>
          <h3>{pending.length}</h3>
        </div>
        <div className={`event-stat-box ${late.length ? 'red-stat' : 'green-stat'}`}>
          <span>Pending {LATE_DAYS}+ days</span>
          <h3>{late.length}</h3>
        </div>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="form-ok" role="status">{notice}</div>}

      {/* ---------- Entry form ---------- */}
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
          <input list="conso-inviters" value={form.invited} onChange={(e) => setForm({ ...form, invited: e.target.value })} />
          <datalist id="conso-inviters">{inviterNames.map((n) => <option key={n} value={n} />)}</datalist>
        </label>
        <label className="field">
          <span>Leader to follow up <em className="req">*</em></span>
          <select value={form.leader} onChange={(e) => setForm({ ...form, leader: e.target.value })} required>
            <option value="">Choose a leader…</option>
            {leaderList.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
          </select>
        </label>
        <label className="conso-check">
          <input type="checkbox" checked={form.markPresent} onChange={(e) => setForm({ ...form, markPresent: e.target.checked })} />
          Also mark present in Attendance
        </label>
        <button className="reset-btn conso-submit" disabled={busy || !form.name.trim() || !form.leader}>
          <UserPlus size={16} /> {busy ? 'Saving…' : 'Assign first timer'}
        </button>
      </form>

      {/* ---------- Conso Staff: today's list ---------- */}
      {!isManager && (
        <div className="conso-list">
          <h4>Assigned on {prettyDay(date)} ({todays.length})</h4>
          {todays.map((e) => entryRow(e, true))}
          {!todays.length && <p className="rm-empty">Nobody assigned for this date yet.</p>}
        </div>
      )}

      {/* ---------- Conso Head: board per leader ---------- */}
      {isManager && (
        <div className="conso-list">
          <div className="conso-filter">
            <h4>Follow-up by leader</h4>
            <div className="conso-chips">
              {['ALL', ...STATUSES].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`rm-chip ${statusFilter === s ? 'is-on' : ''}`}
                  aria-pressed={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'ALL' ? 'All' : s[0] + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {board.map((g) => (
            <section key={g.name} className="conso-leader">
              <header>
                <div>
                  <h5>{g.name}</h5>
                  <span className="conso-meta">{g.info?.position || 'Leader'}</span>
                </div>
                <div className="conso-leader-side">
                  {g.late > 0 && <span className="rm-flag"><AlertTriangle size={12} /> {g.late} waiting {LATE_DAYS}+ days</span>}
                  {g.open === 0 && <span className="conso-allgood"><CheckCircle2 size={14} /> All done</span>}
                  {g.open > 0 && <span className="conso-count">{g.open} open</span>}
                  {g.info?.contact && (
                    <a className="rm-chip" href={`tel:${g.info.contact}`}><Phone size={12} /> {g.info.contact}</a>
                  )}
                </div>
              </header>
              {g.items.map((e) => entryRow(e, false))}
            </section>
          ))}
          {!board.length && <p className="rm-empty">No first timers{statusFilter !== 'ALL' ? ` marked ${statusFilter.toLowerCase()}` : ' assigned yet'}.</p>}
        </div>
      )}

      {/* ---------- Edit modal ---------- */}
      {edit && (
        <Modal title={`Edit ${edit.original}`} onClose={() => setEdit(null)}>
          <form onSubmit={saveEdit} className="form-grid">
            <label className="field"><span>Full name</span>
              <input value={edit.name} required onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </label>
            <label className="field"><span>Age</span>
              <input type="number" min="1" max="99" value={edit.age} onChange={(e) => setEdit({ ...edit, age: e.target.value })} />
            </label>
            <label className="field"><span>Gender</span>
              <select value={edit.gender} onChange={(e) => setEdit({ ...edit, gender: e.target.value })}>
                <option value="">—</option><option>Male</option><option>Female</option>
              </select>
            </label>
            <label className="field"><span>Who invited</span>
              <input list="conso-inviters" value={edit.invited} onChange={(e) => setEdit({ ...edit, invited: e.target.value })} />
            </label>
            <label className="field"><span>Leader to follow up</span>
              <select value={edit.leader} required onChange={(e) => setEdit({ ...edit, leader: e.target.value })}>
                {!leaderByName[norm(edit.leader)] && edit.leader && <option value={edit.leader}>{edit.leader}</option>}
                {leaderList.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>
            </label>
            {isManager && (
              <>
                <label className="field"><span>Status</span>
                  <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label className="field"><span>Notes</span>
                  <textarea rows={3} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
                </label>
              </>
            )}
            {editError && <div className="form-error" role="alert">{editError}</div>}
            <div className="form-actions">
              {canDelete && (
                <button type="button" className="btn-ghost" onClick={remove} disabled={busy}>
                  <Trash2 size={15} /> Remove
                </button>
              )}
              <button className="reset-btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
