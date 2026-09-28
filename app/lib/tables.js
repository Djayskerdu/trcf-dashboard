// Form definitions for every sheet that can be edited from the dashboard.
// Field order MUST match the sheet column order (and TABLES in Code.gs).
//   type:    'date' | 'number' | 'time' | 'email' (default text)
//   options: fixed dropdown
//   suggest: 'auto' = suggestions from values already in that column, 'leaders' = leader names + existing values
//   long:    textarea

export const TABLES = {
  attendance: {
    label: 'Attendance',
    key: 1,
    show: [0, 1],
    sortByDate: true,
    fields: [
      { name: 'Date', type: 'date', req: true, today: true },
      { name: 'Full Name', req: true },
    ],
    note: 'Tip: for a normal Friday, tick names on the Regular Members page instead.',
  },

  members: {
    label: 'Members',
    key: 1,
    show: [0, 1, 2, 3, 6],
    fields: [
      { name: 'Member ID', auto: true },
      { name: 'Full Name', req: true },
      { name: 'Age', type: 'number' },
      { name: 'Gender', options: ['Male', 'Female'] },
      { name: 'Contact' },
      { name: 'Email', type: 'email' },
      { name: 'LG Leader', suggest: 'leaders' },
      { name: 'QR Code', auto: true },
    ],
    note: 'Member ID and QR code are generated automatically.',
  },

  followup: {
    label: 'Follow Up',
    key: 1,
    show: [0, 1, 4, 6, 7],
    sortByDate: true,
    fields: [
      { name: 'Date', type: 'date', req: true, today: true },
      { name: 'Name', req: true },
      { name: 'Age', type: 'number' },
      { name: 'Gender', options: ['Male', 'Female'] },
      { name: 'Who Invited', suggest: 'leaders' },
      { name: 'Follow Up Date', type: 'date', today: true },
      { name: 'Method', suggest: 'auto', default: 'MANUAL' },
      { name: 'Status', options: ['PENDING', 'DONE'], default: 'PENDING' },
      { name: 'Email', type: 'email' },
      { name: 'Member ID' },
    ],
  },

  events: {
    label: 'Events',
    key: 1,
    show: [0, 1, 2, 3, 4, 5],
    sortByDate: true,
    fields: [
      { name: 'Date', type: 'date', req: true },
      { name: 'Event Name', req: true },
      { name: 'Location', suggest: 'auto' },
      { name: 'Time', type: 'time' },
      { name: 'Status', suggest: 'auto', default: 'UPCOMING' },
      { name: 'Event Type', options: ['WITH_PARTICIPANTS', 'DETAILS_ONLY'], default: 'WITH_PARTICIPANTS' },
    ],
  },

  leaders: {
    label: 'Leaders',
    key: 1,
    show: [0, 1, 2, 4],
    fields: [
      { name: 'Position', suggest: 'auto' },
      { name: 'Leader Name', req: true },
      { name: 'Members Count', type: 'number' },
      { name: 'Members List', long: true },
      { name: 'Contact' },
      { name: 'Closecell', long: true },
      { name: 'Under', long: true },
      { name: 'SUYNL', long: true },
      { name: 'Life Class', long: true },
      { name: 'SOL 1', long: true },
      { name: 'SOL 2', long: true },
      { name: 'SOL 3', long: true },
    ],
  },

  finance: {
    label: 'Finance',
    key: 1,
    show: [0, 1, 2, 3],
    sortByDate: true,
    fields: [
      { name: 'Date', type: 'date', req: true, today: true },
      { name: 'Giving', req: true, suggest: 'auto', default: 'Tithes and Offering' },
      { name: 'Amount', type: 'number', req: true },
      { name: 'Program', suggest: 'auto', default: 'Youth Jam' },
    ],
  },
}

/* ---------- helpers ---------- */

export const pad = (n) => String(n).padStart(2, '0')

export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "1:00 PM" | "13:00" | "13:00:00" -> "13:00" (for <input type=time>) */
export function to24(raw) {
  const m = String(raw || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i)
  if (!m) return ''
  let h = Number(m[1])
  const ap = m[3]?.toUpperCase()
  if (ap === 'PM' && h < 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return `${pad(h)}:${m[2]}`
}

/** Turn a raw sheet value into the string the form input expects. */
export function toFormValue(field, raw) {
  if (raw === null || raw === undefined || raw === '') return ''
  if (field.type === 'date') {
    const d = new Date(raw)
    return isNaN(d) ? '' : ymd(d)
  }
  if (field.type === 'time') return to24(raw)
  return String(raw).replace(/\r/g, '')
}

/** Turn a raw sheet value into display text for the table. */
export function toCell(field, raw) {
  if (raw === null || raw === undefined || raw === '') return '—'
  if (field.type === 'date') {
    const d = new Date(raw)
    return isNaN(d)
      ? String(raw)
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  return String(raw).replace(/\s*\n\s*/g, ' ')
}
