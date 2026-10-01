'use client'

import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Printer } from 'lucide-react'
import Modal from './Modal'
import Pager from './Pager'
import { api } from '../lib/api'
import { TABLES, ymd, toFormValue } from '../lib/tables'

const cfg = TABLES.expenses
const peso = (n) =>
  '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const toNum = (v) => Number(String(v ?? '').replace(/[^0-9.\-]/g, '')) || 0
const dayOf = (raw) => {
  const d = new Date(raw)
  return isNaN(d) ? '' : ymd(d)
}
const prettyDay = (raw) => {
  const d = new Date(raw)
  return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const isGiving = (g) => /tithe|offering/i.test(String(g || ''))

/**
 * Expenses paid out of Tithes & Offering.
 * Sheet columns: Date | Expense / Purpose | Category | Amount | Purchased By | Payment Method | Notes
 */
export default function Expenses({ expenses, finance, leaders, members, refs, onChanged }) {
  const rows = useMemo(() => {
    const list = (expenses || []).slice(1)
    const rr = (refs?.expenses || []).slice(1)
    return list
      .map((r, i) => ({ r, ref: rr[i], day: dayOf(r[0]), amount: toNum(r[3]), i }))
      .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : b.i - a.i))
  }, [expenses, refs])

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [cat, setCat] = useState('ALL')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const categories = useMemo(() => {
    const set = new Set()
    rows.forEach((x) => String(x.r[2] || '').trim() && set.add(String(x.r[2]).trim()))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [rows])

  const inRange = (day) => (!from || day >= from) && (!to || day <= to)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      (x) =>
        inRange(x.day) &&
        (cat === 'ALL' || String(x.r[2] || '').trim() === cat) &&
        (!q || x.r.some((c) => String(c ?? '').toLowerCase().includes(q)))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, from, to, cat, query])

  const totalSpent = filtered.reduce((s, x) => s + x.amount, 0)

  // Giving for the same date range, so Balance = what came in - what went out
  const totalGiving = useMemo(
    () =>
      (finance || []).reduce((s, f) => {
        const day = dayOf(f.date)
        return day && isGiving(f.giving) && inRange(day) ? s + toNum(f.amount) : s
      }, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finance, from, to]
  )
  const balance = totalGiving - totalSpent

  const byCategory = useMemo(() => {
    const m = {}
    filtered.forEach((x) => {
      const k = String(x.r[2] || '').trim() || 'Uncategorized'
      m[k] = (m[k] || 0) + x.amount
    })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [filtered])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize)

  const suggestions = useMemo(() => {
    const names = new Set()
    ;(leaders || []).slice(1).forEach((l) => l[1] && names.add(String(l[1]).trim()))
    rows.forEach((x) => String(x.r[4] || '').trim() && names.add(String(x.r[4]).trim()))
    const cats = new Set([...(cfg.fields[2].defaults || []), ...categories])
    return {
      people: [...names].sort((a, b) => a.localeCompare(b)),
      cats: [...cats].sort((a, b) => a.localeCompare(b)),
    }
  }, [leaders, rows, categories])

  const flash = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3500)
  }

  const openAdd = () => {
    setError('')
    setForm({
      mode: 'add',
      values: cfg.fields.map((f) => (f.default ? f.default : f.today ? ymd(new Date()) : '')),
    })
  }

  const openEdit = (x) => {
    setError('')
    setForm({
      mode: 'edit',
      ref: x.ref,
      expect: x.r[cfg.key],
      values: cfg.fields.map((f, i) => toFormValue(f, x.r[i])),
    })
  }

  const setValue = (i, v) =>
    setForm((f) => ({ ...f, values: f.values.map((old, idx) => (idx === i ? v : old)) }))

  const save = async (e) => {
    e.preventDefault()
    if (!(Number(form.values[3]) > 0)) return setError('Amount must be more than 0')
    setBusy(true)
    setError('')
    try {
      if (form.mode === 'add') await api('add', { table: 'expenses', values: form.values })
      else
        await api('update', {
          table: 'expenses',
          ref: form.ref,
          expect: String(form.expect ?? ''),
          values: form.values,
        })
      setForm(null)
      flash(form.mode === 'add' ? '✅ Expense recorded' : '✅ Updated')
      await onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    setBusy(true)
    setError('')
    try {
      await api('delete', { table: 'expenses', ref: del.ref, expect: String(del.expect ?? '') })
      setDel(null)
      flash('🗑️ Deleted')
      await onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const topMax = byCategory.length ? byCategory[0][1] : 0

  return (
    <div className="finance-wrapper finance-print">
      <div className="stats-grid">
        <div className="stat-card blue">
          <div>
            <p>Tithes &amp; Offering</p>
            <h2>{peso(totalGiving)}</h2>
          </div>
        </div>
        <div className="stat-card orange">
          <div>
            <p>Total Expenses</p>
            <h2>{peso(totalSpent)}</h2>
          </div>
        </div>
        <div className={`stat-card ${balance < 0 ? 'red' : 'green'}`}>
          <div>
            <p>Balance Left</p>
            <h2>{peso(balance)}</h2>
          </div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="glass panel" style={{ marginTop: 16 }}>
          <h3>Where the money went</h3>
          <div className="exp-cats">
            {byCategory.map(([name, amt]) => (
              <div className="exp-cat" key={name}>
                <div className="exp-cat-top">
                  <span>{name}</span>
                  <b>{peso(amt)}</b>
                </div>
                <div className="exp-cat-track">
                  <div className="exp-cat-fill" style={{ width: `${Math.max(3, (amt / topMax) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass panel finance-panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <div>
            <h3>Expense Records</h3>
            <p className="attendance-count">
              {filtered.length} record{filtered.length === 1 ? '' : 's'} · everything bought for the Youth Jam
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }} className="no-print">
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} aria-label="From date" />
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} aria-label="To date" />
            <button className="finance-reset-btn" onClick={() => { setFrom(''); setTo(''); setCat('ALL'); setQuery(''); setPage(1) }}>
              Reset
            </button>
            <button className="finance-reset-btn" onClick={() => window.print()}>
              <Printer size={14} style={{ verticalAlign: '-2px' }} /> Print
            </button>
            <button className="reset-btn" onClick={openAdd}>
              <Plus size={16} /> Add Expense
            </button>
          </div>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 12px' }}>
          <input
            placeholder="Search expenses…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            style={{ flex: '1 1 200px', minWidth: 0 }}
          />
          <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(1) }} aria-label="Category">
            <option value="ALL">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {notice && <div className="toast">{notice}</div>}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Expense / Purpose</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Purchased By</th>
                <th>Payment</th>
                <th>Notes</th>
                <th className="col-actions no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((x) => (
                <tr key={x.ref}>
                  <td>{prettyDay(x.r[0])}</td>
                  <td>{x.r[1] || '—'}</td>
                  <td>{x.r[2] || '—'}</td>
                  <td><b>{peso(x.amount)}</b></td>
                  <td>{x.r[4] || '—'}</td>
                  <td>{x.r[5] || '—'}</td>
                  <td>{String(x.r[6] || '—').replace(/\s*\n\s*/g, ' ')}</td>
                  <td className="col-actions no-print">
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => openEdit(x)} aria-label="Edit">
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => { setError(''); setDel({ ref: x.ref, expect: x.r[cfg.key], label: String(x.r[1] || 'this expense') }) }}
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={8} className="empty-state" style={{ textAlign: 'center', opacity: 0.6 }}>
                    No expenses recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="no-print">
          <Pager total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
        </div>
      </div>

      {form && (
        <Modal wide title={`${form.mode === 'add' ? 'Add' : 'Edit'} Expense`} onClose={() => !busy && setForm(null)}>
          <form onSubmit={save} className="form-grid">
            {cfg.fields.map((f, i) => {
              const v = form.values[i]
              const listId = i === 2 ? 'exp-cats-list' : i === 4 ? 'exp-people-list' : undefined
              return (
                <label key={i} className={`field ${f.long ? 'span-2' : ''}`}>
                  <span>
                    {f.name}
                    {f.req && <b className="req"> *</b>}
                  </span>
                  {f.options ? (
                    <select value={v} onChange={(e) => setValue(i, e.target.value)}>
                      {f.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                      {v && !f.options.includes(v) && <option value={v}>{v}</option>}
                    </select>
                  ) : f.long ? (
                    <textarea rows={3} value={v} onChange={(e) => setValue(i, e.target.value)} placeholder="Receipt no., store, anything worth remembering" />
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : f.type || 'text'}
                      step={f.type === 'number' ? '0.01' : undefined}
                      min={f.type === 'number' ? '0' : undefined}
                      inputMode={f.type === 'number' ? 'decimal' : undefined}
                      list={listId}
                      required={f.req}
                      value={v}
                      onChange={(e) => setValue(i, e.target.value)}
                      placeholder={i === 1 ? 'e.g. Prizes for the games night' : undefined}
                    />
                  )}
                </label>
              )
            })}
            <datalist id="exp-cats-list">
              {suggestions.cats.map((c) => <option key={c} value={c} />)}
            </datalist>
            <datalist id="exp-people-list">
              {suggestions.people.map((c) => <option key={c} value={c} />)}
            </datalist>

            {error && <div className="form-error span-2" role="alert">{error}</div>}
            <div className="form-actions span-2">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="reset-btn" disabled={busy}>
                {busy ? 'Saving…' : form.mode === 'add' ? 'Save Expense' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {del && (
        <Modal title="Delete expense?" onClose={() => !busy && setDel(null)}>
          <p style={{ lineHeight: 1.5 }}>
            <b>{del.label}</b> will be permanently removed from Expenses. This can't be undone.
          </p>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions" style={{ marginTop: 18 }}>
            <button className="btn-ghost" onClick={() => setDel(null)} disabled={busy}>Cancel</button>
            <button className="reset-btn btn-danger" onClick={confirmDelete} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
