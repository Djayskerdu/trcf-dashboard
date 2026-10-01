'use client'

import { useMemo, useState } from 'react'
import { Flame, Gift, Check, Star } from 'lucide-react'
import { api } from '../lib/api'
import { ymd } from '../lib/tables'

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
const dayOf = (raw) => {
  const d = new Date(raw)
  return isNaN(d) ? '' : ymd(d)
}
const pretty = (day) => {
  const [y, m, d] = String(day).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Streak cards for first timers.
//   5 Fridays in a row -> reward        3 visits in total -> becomes a Regular Member (done by the server)
export default function Streaks({ streaks, attendance, onChanged }) {
  const [date, setDate] = useState(() => ymd(new Date()))
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('active')

  const presentOn = useMemo(() => {
    const set = new Set()
    ;(attendance || []).slice(1).forEach((r) => { if (dayOf(r[0]) === date) set.add(norm(r[1])) })
    return set
  }, [attendance, date])

  const list = (streaks || []).filter((s) => {
    if (filter === 'reward') return s.rewardEarned && !s.rewardClaimed
    if (filter === 'active') return !s.rewardClaimed || !s.isMember
    return true
  })

  const counts = {
    total: (streaks || []).length,
    promoted: (streaks || []).filter((s) => s.isMember).length,
    reward: (streaks || []).filter((s) => s.rewardEarned && !s.rewardClaimed).length,
  }

  const toggle = async (s) => {
    const next = !presentOn.has(norm(s.name))
    setBusy(s.name); setError(''); setNotice('')
    try {
      const res = await api('setPresent', { name: s.name, date, present: next })
      if (res.promoted) setNotice(`🎉 ${s.name} reached ${s.regularAt} visits and is now a Regular Member (${res.memberId}).`)
      await onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const reward = async (s) => {
    setBusy(s.name); setError(''); setNotice('')
    try {
      await api('claimReward', { name: s.name })
      setNotice(`Reward marked as given to ${s.name}.`)
      await onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="glass panel">
      <div className="panel-header">
        <div>
          <h3>First Timer Streaks</h3>
          <p className="attendance-count">
            Come back 5 Fridays in a row for the reward. On the 3rd visit they become a Regular Member automatically.
          </p>
        </div>
        <div className="date-input-group">
          <label>Check-in date</label>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
      </div>

      <div className="attendance-stats-row">
        <div className="event-stat-box green-stat"><span>First timers tracked</span><h3>{counts.total}</h3></div>
        <div className="event-stat-box"><span>Now Regular Members</span><h3>{counts.promoted}</h3></div>
        <div className="event-stat-box"><span>Rewards to give</span><h3>{counts.reward}</h3></div>
      </div>

      <div className="streak-filters">
        {[['active', 'In progress'], ['reward', 'Reward ready'], ['all', 'Everyone']].map(([k, label]) => (
          <button key={k} type="button" className={`rm-chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="form-ok" role="status">{notice}</div>}

      <div className="streak-list">
        {list.map((s) => {
          const here = presentOn.has(norm(s.name))
          const filled = Math.min(s.streak, s.goal)
          return (
            <div key={s.name} className="streak-card">
              <div className="streak-top">
                <div>
                  <b>{s.name}</b>
                  <span className="streak-sub">
                    First visit {pretty(s.first)}{s.leader ? ` · Follow-up: ${s.leader}` : ''}
                  </span>
                </div>
                <div className="streak-badges">
                  {s.isMember && <span className="streak-badge ok"><Star size={12} /> Regular</span>}
                  {s.rewardEarned && <span className="streak-badge gold"><Gift size={12} /> {s.rewardClaimed ? 'Reward given' : 'Reward ready'}</span>}
                </div>
              </div>

              <div className="streak-dots" aria-label={`${filled} of ${s.goal} Fridays in a row`}>
                {Array.from({ length: s.goal }).map((_, i) => (
                  <span key={i} className={i < filled ? 'dot on' : 'dot'}>{i < filled ? <Flame size={14} /> : i + 1}</span>
                ))}
              </div>

              <p className="streak-meta">
                <b>{s.streak}</b> in a row · <b>{s.visits}</b> visit{s.visits === 1 ? '' : 's'}
                {!s.isMember && s.visits < s.regularAt ? ` · ${s.regularAt - s.visits} more to become a Regular` : ''}
                {s.lastSeen ? ` · last seen ${pretty(s.lastSeen)}` : ''}
              </p>

              <div className="streak-actions">
                <button type="button" className={`reset-btn ${here ? 'is-on' : ''}`} disabled={busy === s.name} onClick={() => toggle(s)}>
                  {here ? <><Check size={14} /> Here on {pretty(date)} (undo)</> : `Check in · ${pretty(date)}`}
                </button>
                {s.rewardEarned && !s.rewardClaimed && (
                  <button type="button" className="reset-btn" disabled={busy === s.name} onClick={() => reward(s)}>
                    <Gift size={14} /> Give reward
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {!list.length && <p className="rm-empty">Nobody here yet. First timers entered on the First Timers tab show up automatically.</p>}
      </div>
    </div>
  )
}
