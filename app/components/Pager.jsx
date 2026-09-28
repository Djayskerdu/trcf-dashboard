'use client'

export default function Pager({ total, page, pageSize, onPage, onPageSize, sizes = [15, 25, 50, 100] }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize

  return (
    <div className="pager no-print">
      <div className="pager-info">
        {total === 0
          ? 'No records'
          : `Showing ${start + 1}–${Math.min(start + pageSize, total)} of ${total}`}
      </div>

      <div className="pager-controls">
        <label className="pager-size">
          <span>Rows</span>
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
            {sizes.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <button className="pager-btn" disabled={current === 1} onClick={() => onPage(1)} aria-label="First page">«</button>
        <button className="pager-btn" disabled={current === 1} onClick={() => onPage(current - 1)} aria-label="Previous page">‹</button>
        <span className="pager-page">Page {current} / {pages}</span>
        <button className="pager-btn" disabled={current === pages} onClick={() => onPage(current + 1)} aria-label="Next page">›</button>
        <button className="pager-btn" disabled={current === pages} onClick={() => onPage(pages)} aria-label="Last page">»</button>
      </div>
    </div>
  )
}
