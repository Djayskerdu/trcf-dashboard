'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import Modal from './Modal'
import Pager from './Pager'
import { api } from '../lib/api'
import { ROLE_WRITE } from '../lib/access'
import { TABLES, ymd, toFormValue, toCell } from '../lib/tables'

/** Normalise every table to { rows: [[...cells]], refs: [...] } (header removed). */
function getRows(key, data, refs) {
  if (key === 'finance') {
    const list = data.finance || []
    return {
      rows: list.map((f) => [f.date, f.giving, f.amount, f.program]),
      refs: list.map((f) => f.ref),
    }
  }
  const arr = data[key] || []
  return { rows: arr.slice(1), refs: (refs[key] || []).slice(1) }
}

export default function ManageData({ data, refs, role, onChanged, search = '' }) {
  const write = ROLE_WRITE[role] || { tables: [], ops: [] }
  const tableKeys = write.tables

  const [tab, setTab] = useState(tableKeys[0])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [form, setForm] = useState(null) // { mode:'add'|'edit', ref, expect, values }
  const [del, setDel] = useState(null) // { ref, expect, label }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const cfg = TABLES[tab]
  const canAdd = write.ops.includes('add')
  const canEdit = write.ops.includes('update')
  const canDelete = write.ops.includes('delete')

  const { rows, refs: rowRefs } = useMemo(() => getRows(tab, data, refs), [tab, data, refs])

  // distinct existing values per column, used for the type-ahead suggestions
  const suggestions = useMemo(() => {
    const out = {}
    cfg.fields.forEach((f, i) => {
      if (!f.suggest) return
      const set = new Set()
      rows.forEach((r) => {
        const v = String(r[i] ?? '').trim()
        if (v && v !== 'N/A') set.add(v)
      })
      if (f.suggest === 'leaders') {
        ;(data.leaders || []).slice(1).forEach((l) => l[1] && set.add(String(l[1]).trim()))
        ;(data.members || []).slice(1).forEach((m) => m[6] && m[6] !== 'N/A' && set.add(String(m[6]).trim()))
      }
      out[i] = [...set].sort((a, b) => a.localeCompare(b)).slice(0, 200)
    })
    return out
  }, [cfg, rows, data.leaders, data.members])

  const visible = useMemo(() => {
    let list = rows.map((r, i) => ({ r, ref: rowRefs[i] }))
    if (cfg.sortByDate) {
      list = list
        .map((x, i) => ({ ...x, t: new Date(x.r[0]).getTime() || 0, i }))
        .sort((a, b) => b.t - a.t || b.i - a.i)
    } else {
      list = list.reverse()
    }
    ;[query, search].forEach((term) => {
      const q = term.trim().toLowerCase()
      if (q) list = list.filter((x) => x.r.some((c) => String(c ?? '').toLowerCase().includes(q)))
    })
    return list
  }, [rows, rowRefs, cfg, query, search])

  // keep the page valid when the list shrinks (search, delete) and reset on top-bar search
  const pages = Math.max(1, Math.ceil(visible.length / pageSize))
  const current = Math.min(page, pages)
  const pageRows = visible.slice((current - 1) * pageSize, current * pageSize)

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const flash = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3500)
  }

  const openAdd = () => {
    const values = cfg.fields.map((f) => {
      if (f.default) return f.default
      if (f.today) return ymd(new Date())
      return ''
    })
    setError('')
    setForm({ mode: 'add', values })
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
    const problem = cfg.validate?.(form.values)
    if (problem) return setError(problem)

    setBusy(true)
    setError('')
    try {
      if (form.mode === 'add') {
        await api('add', { table: tab, values: form.values })
      } else {
        await api('update', { table: tab, ref: form.ref, expect: String(form.expect ?? ''), values: form.values })
      }
      setForm(null)
      flash(form.mode === 'add' ? '✅ Saved' : '✅ Updated')
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
      await api('delete', { table: tab, ref: del.ref, expect: String(del.expect ?? '') })
      setDel(null)
      flash('🗑️ Deleted')
      await onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const switchTab = (k) => {
    setTab(k)
    setQuery('')
    setPage(1)
  }

  return (
    <div className="glass panel">
      <div className="panel-header">
        <div>
          <h3>Manage Data</h3>
          <p className="attendance-count">
            Add, edit or remove records here — changes are saved straight to the database.
          </p>
        </div>
      </div>

      {tableKeys.length > 1 && (
        <div className="chip-row">
          {tableKeys.map((k) => (
            <button
              key={k}
              className={`chip ${tab === k ? 'active' : ''}`}
              onClick={() => switchTab(k)}
            >
              {TABLES[k].label}
            </button>
          ))}
        </div>
      )}

      <div className="manage-toolbar">
        <div className="search-box manage-search">
          <Search size={16} />
          <input
            placeholder={`Search ${cfg.label}…`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
          />
        </div>

        {canAdd && (
          <button className="reset-btn manage-add" onClick={openAdd}>
            <Plus size={16} /> Add {cfg.label === 'Leaders' ? 'Leader' : 'Record'}
          </button>
        )}
      </div>

      {notice && <div className="toast">{notice}</div>}

      <p className="attendance-count" style={{ margin: '4px 0 10px' }}>
        {visible.length} record{visible.length === 1 ? '' : 's'}
      </p>

      <div className="table-wrapper manage-table">
        <table className="compact">
          <thead>
            <tr>
              {cfg.show.map((i) => (
                <th key={i}>{cfg.fields[i].name}</th>
              ))}
              {(canEdit || canDelete) && <th className="col-actions">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((x) => (
              <tr key={x.ref}>
                {cfg.show.map((i) => (
                  <td key={i} className="cell-clip">
                    {toCell(cfg.fields[i], x.r[i])}
                  </td>
                ))}
                {(canEdit || canDelete) && (
                  <td className="col-actions">
                    <div className="row-actions">
                      {canEdit && (
                        <button className="icon-btn" onClick={() => openEdit(x)} aria-label="Edit">
                          <Pencil size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="icon-btn danger"
                          onClick={() => {
                            setError('')
                            setDel({ ref: x.ref, expect: x.r[cfg.key], label: String(x.r[cfg.key] || 'this record') })
                          }}
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={cfg.show.length + 1} style={{ textAlign: 'center', opacity: 0.6 }}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pager
        total={visible.length}
        page={current}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={setPageSize}
      />

      {/* ADD / EDIT */}
      {form && (
        <Modal
          wide
          title={`${form.mode === 'add' ? 'Add' : 'Edit'} — ${cfg.label}`}
          onClose={() => !busy && setForm(null)}
        >
          <form onSubmit={save} className="form-grid">
            {cfg.fields.map((f, i) => {
              if (f.auto && form.mode === 'add') return null
              const v = form.values[i]
              const id = `f-${tab}-${i}`
              return (
                <label key={i} className={`field ${f.long ? 'span-2' : ''}`}>
                  <span>
                    {f.name}
                    {f.req && <b className="req"> *</b>}
                  </span>

                  {f.options ? (
                    <select value={v} onChange={(e) => setValue(i, e.target.value)}>
                      {!f.default && <option value="">—</option>}
                      {f.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                      {v && !f.options.includes(v) && <option value={v}>{v}</option>}
                    </select>
                  ) : f.long ? (
                    <textarea rows={3} value={v} onChange={(e) => setValue(i, e.target.value)} />
                  ) : (
                    <>
                      <input
                        type={f.type === 'email' ? 'email' : f.type === 'number' ? 'number' : f.type || 'text'}
                        step={f.type === 'number' ? 'any' : undefined}
                        list={f.suggest ? `${id}-list` : undefined}
                        value={v}
                        readOnly={f.auto}
                        required={f.req}
                        onChange={(e) => setValue(i, e.target.value)}
                      />
                      {f.suggest && (
                        <datalist id={`${id}-list`}>
                          {(suggestions[i] || []).map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      )}
                    </>
                  )}
                </label>
              )
            })}

            {cfg.note && <p className="form-note span-2">{cfg.note}</p>}
            {error && <div className="form-error span-2" role="alert">{error}</div>}

            <div className="form-actions span-2">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="reset-btn" disabled={busy}>
                {busy ? 'Saving…' : form.mode === 'add' ? 'Save' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE */}
      {del && (
        <Modal title="Delete record?" onClose={() => !busy && setDel(null)}>
          <p style={{ lineHeight: 1.5 }}>
            <b>{del.label}</b> will be permanently removed from {cfg.label}. This can't be undone.
          </p>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions" style={{ marginTop: 18 }}>
            <button className="btn-ghost" onClick={() => setDel(null)} disabled={busy}>
              Cancel
            </button>
            <button className="reset-btn btn-danger" onClick={confirmDelete} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
