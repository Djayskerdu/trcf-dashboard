'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Cake, Users, Phone, Mail, QrCode, CalendarCheck, AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Pager from './Pager'
import { api } from '../lib/api'
import { ymd } from '../lib/tables'

// A regular who misses this many Youth Jams in a row gets flagged for follow-up.
const ABSENT_LIMIT = 3

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
  const [showFollowUps, setShowFollowUps] = useState(false) // collapsed by default so the page stays calm
  const [local, setLocal] = useState({}) // "date|name" -> true/false: ticks shown instantly, before the server confirms
  const [selected, setSelected] = useState(null) // member row
  const [error, setError] = useState('')
  const [status, setStatus] = useState('idle') // idle | pending | saving | saved
  const [onlyFollowUp, setOnlyFollowUp] = useState(false)
  const [tab, setTab] = useState('Male')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  // Ticks are collected for a moment and sent as ONE request (one sheet read, one write).
  const queueRef = useRef({})
  const timerRef = useRef(null)
  const chainRef = useRef(Promise.resolve())
  const pendingRef = useRef(0)
  const onChangedRef = useRef(onChanged)
  useEffect(() => { onChangedRef.current = onChanged }, [onChanged])

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
    const k = `${date}|${norm(name)}`
    return k in local ? local[k] : presentToday.has(norm(name))
  }

  // First timers are typed in by the Consolidation Team (First Timers tab); here we only count them.
  const firstTimers = useMemo(() => {
    const names = new Set()
    ;(attendance || []).slice(1).forEach((r) => {
      if (dayOf(r[0]) === date && norm(r[1]) && !memberNames.has(norm(r[1]))) names.add(norm(r[1]))
    })
    return names.size
  }, [attendance, date, memberNames])

  // Youth Jam days = days that have at least one attendance row, before the selected date.
  const serviceDays = useMemo(() => {
    const days = new Set()
    ;(attendance || []).slice(1).forEach((r) => {
      const k = dayOf(r[0])
      if (k && k < date) days.add(k)
    })
    return [...days].sort().reverse() // newest first
  }, [attendance, date])

  // name -> how many of the latest Youth Jams in a row they missed
  const missed = useMemo(() => {
    const out = {}
    list.forEach((m) => {
      const k = norm(m.name)
      const came = new Set(history[k] || [])
      let n = 0
      for (const d of serviceDays) {
        if (came.has(d)) break
        n++
      }
      out[k] = n
    })
    return out
  }, [list, history, serviceDays])

  const missedOf = (name) => missed[norm(name)] || 0
  const needsFollowUp = (m) => !isPresent(m.name) && missedOf(m.name) >= ABSENT_LIMIT

  const keyOf = (name) => `${date}|${norm(name)}`

  const flush = useCallback(() => {
    clearTimeout(timerRef.current)
    const items = Object.values(queueRef.current)
    queueRef.current = {}
    if (!items.length) return
    pendingRef.current += 1
    setStatus('saving')

    // batches run one after another so ticks always land in the order they were made
    chainRef.current = chainRef.current.then(async () => {
      try {
        const changes = items.map(({ name, date: day, present }) => ({ name, date: day, present }))
        try {
          await api('setPresentBatch', { changes })
        } catch (err) {
          // backend not updated yet -> fall back to one request per name
          if (!/unknown action/i.test(err.message)) throw err
          for (const c of changes) await api('setPresent', c)
        }
      } catch (err) {
        setError(`Couldn't save: ${err.message}`)
        setLocal((l) => {
          const n = { ...l }
          items.forEach((i) => delete n[i.key])
          return n
        })
      }
      pendingRef.current -= 1
      if (pendingRef.current > 0) return
      try { await onChangedRef.current() } catch {}
      if (pendingRef.current === 0 && !Object.keys(queueRef.current).length) {
        setLocal({}) // the refreshed data now matches what was ticked
        setStatus('saved')
      }
    })
  }, [])

  // never lose ticks: send what is waiting if the page is hidden or closed
  useEffect(() => {
    const hide = () => { if (document.hidden) flush() }
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  const toggle = (name) => {
    const k = keyOf(name)
    const next = !isPresent(name)
    setError('')
    setLocal((l) => ({ ...l, [k]: next }))
    queueRef.current[k] = { key: k, name, date, present: next }
    setStatus('pending')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flush, 500)
  }

  const changeDate = (value) => {
    if (!value) return
    flush() // save ticks for the old date first
    setDate(value)
  }

  const q = norm(search)
  const match = (m) =>
    (!q || norm(m.name).includes(q) || norm(m.leader).includes(q)) && (!onlyFollowUp || needsFollowUp(m))
  const byName = (a, b) => a.name.localeCompare(b.name)
  const male = list.filter((m) => m.gender.toLowerCase() === 'male' && match(m)).sort(byName)
  const female = list.filter((m) => m.gender.toLowerCase() === 'female' && match(m)).sort(byName)
  const other = list.filter((m) => !['male', 'female'].includes(m.gender.toLowerCase()) && match(m)).sort(byName)

  const presentMembers = list.filter((m) => isPresent(m.name)).length
  const total = presentMembers + firstTimers
  const followUps = list
    .filter(needsFollowUp)
    .sort((a, b) => missedOf(b.name) - missedOf(a.name) || a.name.localeCompare(b.name))
  const lastSeenOf = (name) => (history[norm(name)] || []).find((d) => d < date) || ''

  const hasOther = list.some((m) => !['male', 'female'].includes(m.gender.toLowerCase()))
  const activeTab = tab === 'Other' && !hasOther ? 'Male' : tab
  const tabs = [
    { id: 'Male', label: 'Male', all: list.filter((m) => m.gender.toLowerCase() === 'male'), shown: male },
    { id: 'Female', label: 'Female', all: list.filter((m) => m.gender.toLowerCase() === 'female'), shown: female },
    ...(hasOther
      ? [{ id: 'Other', label: 'Not set', all: list.filter((m) => !['male', 'female'].includes(m.gender.toLowerCase())), shown: other }]
      : []),
  ]
  const current = tabs.find((t) => t.id === activeTab) || tabs[0]
  const pages = Math.max(1, Math.ceil(current.shown.length / pageSize))
  const safePage = Math.min(page, pages)
  const pageRows = current.shown.slice((safePage - 1) * pageSize, safePage * pageSize)

  // back to page 1 whenever the list changes
  const listKey = `${tab}|${q}|${onlyFollowUp}|${pageSize}`
  const [prevKey, setPrevKey] = useState(listKey)
  if (prevKey !== listKey) {
    setPrevKey(listKey)
    setPage(1)
  }

  const sel = selected
  const selDays = sel ? history[norm(sel.name)] || [] : []

  return (
    <div className="glass panel">
      <div className="panel-header">
        <div>
          <h3>Regular Members</h3>
          <p className="attendance-count">
            Tick a name to mark them present. A small amber dot means 3 or more Youth Jams missed in a row.
          </p>
        </div>
        <div className="date-input-group">
          <label>Attendance date</label>
          <input type="date" value={date} onChange={(e) => changeDate(e.target.value)} />
        </div>
      </div>

      <div className="rm-seg" role="tablist" aria-label="Show members by gender">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === activeTab}
            className={`rm-seg-btn ${t.id === activeTab ? 'is-on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.label}</span>
            <small>{t.all.filter((m) => isPresent(m.name)).length}/{t.all.length}</small>
          </button>
        ))}
      </div>

      <div className="attendance-stats-row">
        <div className="event-stat-box blue-stat">
          <span>Present · {prettyDay(date)}</span>
          <h3>{total}</h3>
        </div>
        <div className="event-stat-box green-stat">
          <span>Regulars / First timers</span>
          <h3>{presentMembers} / {firstTimers}</h3>
        </div>
        <div className="event-stat-box">
          <span>Need follow-up · {ABSENT_LIMIT}+ missed in a row</span>
          <h3>{followUps.length}</h3>
        </div>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}
      <p className={`rm-status ${status}`} aria-live="polite">
        {status === 'pending' || status === 'saving' ? 'Saving…' : status === 'saved' ? '✓ All changes saved' : ''}
      </p>

      <div className="rm-list rm-paged">
        {pageRows.map((m) => {
          const on = isPresent(m.name)
          const flagged = needsFollowUp(m)
          return (
            <div key={m.id || m.name} className={`rm-row ${on ? 'on' : ''} ${flagged ? 'alert' : ''}`}>
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
              {flagged && (
                <span className="rm-dot" title={`Missed the last ${missedOf(m.name)} Youth Jams in a row`} aria-label={`Missed ${missedOf(m.name)} in a row`} />
              )}
            </div>
          )
        })}
      </div>
      {!current.shown.length && (
        <p className="rm-empty">{onlyFollowUp ? 'No one needs follow-up here.' : `No one here${q ? ' matches your search' : ''}.`}</p>
      )}

      <Pager
        total={current.shown.length}
        page={safePage}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={setPageSize}
        sizes={[10, 15, 25, 50]}
      />

      <div className="rm-followup">
        <div className="rm-followup-head">
          <h4><AlertTriangle size={15} /> Needs follow-up ({followUps.length})</h4>
          <button
            type="button"
            className={`rm-chip ${onlyFollowUp ? 'is-on' : ''}`}
            aria-pressed={onlyFollowUp}
            onClick={() => setOnlyFollowUp((v) => !v)}
          >
            {onlyFollowUp ? 'Showing only these' : 'Filter list'}
          </button>
          <button type="button" className="rm-chip" aria-expanded={showFollowUps} onClick={() => setShowFollowUps((v) => !v)}>
            {showFollowUps ? 'Hide' : 'View'}
          </button>
        </div>
        {!showFollowUps ? null : serviceDays.length < ABSENT_LIMIT ? (
          <p className="rm-empty">
            Follow-up alerts start once {ABSENT_LIMIT} Youth Jams are recorded before {prettyDay(date)}
            {' '}({serviceDays.length} so far).
          </p>
        ) : followUps.length ? (
          <div className="rm-followup-list">
            {followUps.map((m) => (
              <button type="button" key={m.id || m.name} className="rm-followup-item" onClick={() => setSelected(m)}>
                <b>{m.name}</b>
                <span>
                  {missedOf(m.name)} in a row · {lastSeenOf(m.name) ? `last seen ${prettyDay(lastSeenOf(m.name))}` : 'never seen'}
                  {m.leader ? ` · LG: ${m.leader}` : ''}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="rm-empty">Everyone has been around recently. 🎉</p>
        )}
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

            {needsFollowUp(sel) && (
              <div className="rm-detail-alert">
                <AlertTriangle size={16} />
                <span>
                  Missed the last <b>{missedOf(sel.name)}</b> Youth Jams in a row. Time to reach out
                  {sel.leader ? <> — LG leader: <b>{sel.leader}</b></> : ''}.
                </span>
              </div>
            )}

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
