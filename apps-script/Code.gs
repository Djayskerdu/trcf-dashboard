/**
 * TRCF Youth Jam — Backend (Google Apps Script)
 * ------------------------------------------------------------------
 * Deploy as: Web app  |  Execute as: Me  |  Who has access: Anyone
 * (Access is enforced by the login system below, not by Google.)
 *
 * ONE-TIME SETUP (see SETUP.md):
 *   1. Paste this file over your old script.
 *   2. Run setupFirstLeader() once (edit the username/password inside first).
 *   3. Project Settings -> Script properties -> add ONESIGNAL_API_KEY
 *      (only needed for push reminders).
 *   4. Deploy -> Manage deployments -> Edit -> New version -> Deploy.
 */

/* =========================================
   CONFIG
========================================= */

const CFG = {
  SESSION_DAYS: 7,
  MAX_FAILS: 5,          // wrong passwords before temporary lock
  LOCK_MINUTES: 10,
  HASH_ROUNDS: 100,
  MIN_PASSWORD: 8,
  ONESIGNAL_APP_ID: 'cbb7fa9d-bdb7-4c90-ad23-8afffe745bbb',
  WELCOME_TEMPLATE_URL:
    'https://drive.google.com/uc?export=download&id=14e8R8jk_32mqNe780Dl_vcN0kBx0Ssk_',
}

// Column layout of every sheet the dashboard can write to.
// Order MUST match the sheet columns.
const TABLES = {
  attendance: {
    sheet: 'Attendance', key: 1, cols: [
      { name: 'Date', type: 'date', req: true },
      { name: 'FullName', req: true },
    ],
  },
  members: {
    sheet: 'Members', key: 1, cols: [
      { name: 'MemberID', auto: true },
      { name: 'FullName', req: true },
      { name: 'Age', type: 'number' },
      { name: 'Gender' },
      { name: 'Contact' },
      { name: 'Email' },
      { name: 'LGLeader' },
      { name: 'QRCode', auto: true },
    ],
  },
  followup: {
    sheet: 'FollowUp', key: 1, cols: [
      { name: 'Date', type: 'date', req: true },
      { name: 'Name', req: true },
      { name: 'Age', type: 'number' },
      { name: 'Gender' },
      { name: 'Who Invited' },
      { name: 'FollowUpDate', type: 'date' },
      { name: 'Method' },
      { name: 'Status' },
      { name: 'Email' },
      { name: 'MemberID' },
    ],
  },
  events: {
    sheet: 'Events', key: 1, cols: [
      { name: 'Date', type: 'date', req: true },
      { name: 'EventName', req: true },
      { name: 'Location' },
      { name: 'Time', type: 'time' },
      { name: 'Status' },
      { name: 'EventType' },
    ],
  },
  leaders: {
    sheet: 'Leaders', key: 1, cols: [
      { name: 'Position' },
      { name: 'Leader Name', req: true },
      { name: 'Members Count', type: 'number' },
      { name: 'Members List' },
      { name: 'Contact' },
      { name: 'CLOSECELL' },
      { name: 'UNDER' },
      { name: 'SUYNL' },
      { name: 'LIFECLASS' },
      { name: 'SOL1' },
      { name: 'SOL2' },
      { name: 'SOL3' },
    ],
  },
  finance: {
    sheet: 'Finance', key: 1, cols: [
      { name: 'Date', type: 'date', req: true },
      { name: 'Giving', req: true },
      { name: 'Amount', type: 'number', req: true },
      { name: 'Program' },
    ],
  },
  // Money spent out of Tithes & Offering (materials, prizes, food...). Sheet is created on first use.
  expenses: {
    sheet: 'Expenses', key: 1, cols: [
      { name: 'Date', type: 'date', req: true },
      { name: 'Expense / Purpose', req: true },
      { name: 'Category' },
      { name: 'Amount', type: 'number', req: true },
      { name: 'Purchased By' },
      { name: 'Payment Method' },
      { name: 'Notes' },
    ],
  },
  // First timers handed to a leader for follow-up. EnteredBy / UpdatedOn are filled by the server.
  consolidation: {
    sheet: 'Consolidation', key: 1, cols: [
      { name: 'Date', type: 'date', req: true },
      { name: 'Name', req: true },
      { name: 'Age', type: 'number' },
      { name: 'Gender' },
      { name: 'Who Invited' },
      { name: 'AssignedLeader', req: true },
      { name: 'Status' },
      { name: 'Notes' },
      { name: 'EnteredBy', auto: true },
      { name: 'UpdatedOn', auto: true },
    ],
  },
}

const CONSO_STATUSES = ['PENDING', 'CONTACTED', 'DONE']

// What each role may read / write. Keep in sync with app/lib/access.js
const ROLES = {
  leader: {
    read: ['attendance', 'members', 'followup', 'events', 'leaders', 'finance', 'expenses', 'ygl', 'history', 'consolidation'],
    write: ['attendance', 'members', 'followup', 'events', 'leaders', 'finance', 'expenses', 'consolidation'],
    ops: ['add', 'update', 'delete'],
    manageAccounts: true, notify: true, mail: true, checkin: true, firstTimer: true,
  },
  admin: {
    read: ['attendance', 'members', 'followup', 'events', 'leaders', 'finance', 'expenses', 'ygl', 'consolidation'],
    write: ['attendance', 'members', 'followup', 'events', 'leaders', 'finance', 'expenses', 'consolidation'],
    ops: ['add', 'update', 'delete'],
    mail: true, checkin: true, firstTimer: true,
  },
  // Staff: view only (Homepage, Attendance, Leaders, Events). Cannot check anyone in.
  staff: {
    read: ['attendance', 'members', 'events', 'leaders', 'ygl'],
    write: [],
    ops: [],
  },
  // Attendance Staff: ticks Regular Members present (Homepage, Attendance, Regular Members).
  attendance_staff: {
    read: ['attendance', 'members', 'events', 'leaders', 'ygl'],
    write: ['attendance'],
    ops: ['add'],
    checkin: true,
  },
  // Conso Head: follows up the leaders who were assigned first timers.
  // Full control of the Consolidation sheet; read-only everywhere else.
  conso_head: {
    read: ['attendance', 'members', 'events', 'leaders', 'ygl', 'consolidation'],
    write: ['consolidation'],
    ops: ['add', 'update', 'delete'],
    checkin: true, firstTimer: true,
  },
  // Conso Staff: types the first timers (name, age, gender, who invited) and picks the leader
  // assigned to follow up. May add, and fix typos on rows they entered - nothing else.
  conso_staff: {
    read: ['attendance', 'members', 'events', 'leaders', 'ygl', 'consolidation'],
    write: ['consolidation'],
    ops: [],
    tableOps: { consolidation: ['add', 'update'] },
    checkin: true, firstTimer: true,
  },
}
// Old accounts created with the single "consolidation" role keep working as Conso Staff.
ROLES.consolidation = ROLES.conso_staff

/* =========================================
   ENTRY POINTS
========================================= */

function doGet() {
  // No data is ever served on GET any more.
  return json_({ success: true, service: 'TRCF Youth Jam API', auth: 'required' })
}

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}')
    const action = String(req.action || '')

    if (action === 'login') return json_(login_(req))

    const auth = authenticate_(req.token)
    if (!auth.ok) return json_({ success: false, code: 'AUTH', error: auth.error })
    const user = auth.user

    switch (action) {
      case 'getData':        return json_(getData_(user))
      case 'add':            return json_(writeRow_(user, 'add', req))
      case 'update':         return json_(writeRow_(user, 'update', req))
      case 'delete':         return json_(writeRow_(user, 'delete', req))
      case 'scan':           return json_(scan_(user, req))
      case 'setPresent':     return json_(setPresent_(user, req))
      case 'sendWelcomeQR':  return json_(sendWelcomeQR_(user, req))
      case 'notify':         return json_(notify_(user, req))
      case 'saveDevice':     return json_(saveDevice_(user, req))
      case 'changePassword': return json_(changePassword_(user, req))
      case 'listAccounts':   return json_(listAccounts_(user))
      case 'createAccount':  return json_(createAccount_(user, req))
      case 'updateAccount':  return json_(updateAccount_(user, req))
      default:               return json_({ success: false, error: 'Unknown action' })
    }
  } catch (err) {
    return json_({ success: false, error: String(err && err.message ? err.message : err) })
  }
}

/* =========================================
   AUTH: ACCOUNTS, PASSWORDS, TOKENS
========================================= */

const ACC_HEADERS = ['Username', 'Name', 'Role', 'Status', 'Salt', 'Hash', 'Created', 'LastLogin']

function accountsSheet_(createIfMissing) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sh = ss.getSheetByName('Accounts')
  if (!sh && createIfMissing) {
    sh = ss.insertSheet('Accounts')
    sh.getRange(1, 1, 1, ACC_HEADERS.length).setValues([ACC_HEADERS]).setFontWeight('bold')
    sh.setFrozenRows(1)
  }
  return sh
}

function readAccounts_() {
  const sh = accountsSheet_(false)
  if (!sh) return []
  const v = sh.getDataRange().getValues()
  const out = []
  for (let i = 1; i < v.length; i++) {
    if (!v[i][0]) continue
    out.push({
      row: i + 1,
      username: String(v[i][0]).trim().toLowerCase(),
      name: String(v[i][1] || ''),
      role: String(v[i][2] || '').trim().toLowerCase(),
      status: String(v[i][3] || '').trim().toLowerCase(),
      salt: String(v[i][4] || ''),
      hash: String(v[i][5] || ''),
      created: v[i][6],
      lastLogin: v[i][7],
    })
  }
  return out
}

function findAccount_(username) {
  const u = String(username || '').trim().toLowerCase()
  return readAccounts_().filter(a => a.username === u)[0] || null
}

function hashPassword_(password, salt) {
  let h = salt + ':' + password
  for (let i = 0; i < CFG.HASH_ROUNDS; i++) {
    h = toHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + salt))
  }
  return h
}

function toHex_(bytes) {
  return bytes.map(b => ((b < 0 ? b + 256 : b)).toString(16).padStart(2, '0')).join('')
}

function safeEq_(a, b) {
  a = String(a); b = String(b)
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

function sessionSecret_() {
  const p = PropertiesService.getScriptProperties()
  let s = p.getProperty('SESSION_SECRET')
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()
    p.setProperty('SESSION_SECRET', s)
  }
  return s
}

function b64u_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '')
}

function unb64u_(str) {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : ''
  return Utilities.base64DecodeWebSafe(str + pad)
}

function makeToken_(acct) {
  const payload = b64u_(Utilities.newBlob(JSON.stringify({
    u: acct.username,
    pv: acct.hash.slice(0, 10),               // changes when password changes -> old tokens die
    e: Date.now() + CFG.SESSION_DAYS * 86400000,
  })).getBytes())
  const sig = b64u_(Utilities.computeHmacSha256Signature(payload, sessionSecret_()))
  return payload + '.' + sig
}

function authenticate_(token) {
  try {
    const parts = String(token || '').split('.')
    if (parts.length !== 2) return { ok: false, error: 'Please log in' }
    const expected = b64u_(Utilities.computeHmacSha256Signature(parts[0], sessionSecret_()))
    if (!safeEq_(expected, parts[1])) return { ok: false, error: 'Please log in' }
    const p = JSON.parse(Utilities.newBlob(unb64u_(parts[0])).getDataAsString())
    if (!p.e || Date.now() > p.e) return { ok: false, error: 'Session expired. Please log in again.' }
    const acct = findAccount_(p.u)
    if (!acct || acct.status !== 'active' || !ROLES[acct.role]) return { ok: false, error: 'Account disabled' }
    if (acct.hash.slice(0, 10) !== p.pv) return { ok: false, error: 'Password changed. Please log in again.' }
    return { ok: true, user: acct }
  } catch (err) {
    return { ok: false, error: 'Please log in' }
  }
}

function publicUser_(a) {
  return { username: a.username, name: a.name, role: a.role }
}

function login_(req) {
  const username = String(req.username || '').trim().toLowerCase()
  const password = String(req.password || '')
  if (!username || !password) return { success: false, error: 'Enter your username and password' }

  const cache = CacheService.getScriptCache()
  const failKey = 'fail_' + username
  const fails = Number(cache.get(failKey) || 0)
  if (fails >= CFG.MAX_FAILS) {
    return { success: false, error: 'Too many attempts. Try again in ' + CFG.LOCK_MINUTES + ' minutes.' }
  }

  const acct = findAccount_(username)
  // hash even when the account is missing so timing doesn't reveal valid usernames
  const computed = hashPassword_(password, acct ? acct.salt : 'x')
  const valid = acct && acct.status === 'active' && ROLES[acct.role] && safeEq_(computed, acct.hash)

  if (!valid) {
    cache.put(failKey, String(fails + 1), CFG.LOCK_MINUTES * 60)
    return { success: false, error: 'Invalid username or password' }
  }

  cache.remove(failKey)
  accountsSheet_(false).getRange(acct.row, 8).setValue(new Date())
  return { success: true, token: makeToken_(acct), user: publicUser_(acct) }
}

function validPassword_(pw) {
  if (String(pw || '').length < CFG.MIN_PASSWORD) {
    throw new Error('Password must be at least ' + CFG.MIN_PASSWORD + ' characters')
  }
}

function changePassword_(user, req) {
  validPassword_(req.newPassword)
  if (!safeEq_(hashPassword_(String(req.oldPassword || ''), user.salt), user.hash)) {
    return { success: false, error: 'Current password is incorrect' }
  }
  const salt = Utilities.getUuid()
  const sh = accountsSheet_(false)
  sh.getRange(user.row, 5, 1, 2).setValues([[salt, hashPassword_(String(req.newPassword), salt)]])
  log_(user, 'EDIT', 'Accounts', 'Changed own password')
  const fresh = findAccount_(user.username)
  return { success: true, token: makeToken_(fresh) }
}

/* ---------- Account management (leader only) ---------- */

function requireLeader_(user) {
  if (!ROLES[user.role].manageAccounts) throw new Error('Not allowed')
}

function listAccounts_(user) {
  requireLeader_(user)
  const devices = devicesByAccount_()
  return {
    success: true,
    accounts: readAccounts_().map(a => ({
      username: a.username, name: a.name, role: a.role, status: a.status,
      created: a.created, lastLogin: a.lastLogin,
      devices: (devices[a.username] || []).length,
    })),
  }
}

/**
 * Users sheet = one row per registered push device:
 *   A Name | B Gender | C Role | D OneSignalId | E Status | F Device | G Browser | H Date | I Username
 * Column I (Username) is written by saveDevice_. Older rows without it are matched
 * to an account by name ("Jay Abraham (TABLET)" -> "Jay Abraham").
 */
function devicesByAccount_() {
  const rows = rawSheet_(SpreadsheetApp.getActiveSpreadsheet(), 'Users').slice(1)
  const accounts = readAccounts_()
  const byName = {}
  accounts.forEach(a => { byName[a.name.trim().toLowerCase()] = a.username })
  const out = {}
  rows.forEach(r => {
    const id = String(r[3] || '').trim()
    if (!id || String(r[4] || '').trim().toLowerCase() === 'disabled') return
    let u = String(r[8] || '').trim().toLowerCase()
    if (!u) u = byName[String(r[0] || '').replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase()] || ''
    if (!u) return
    ;(out[u] = out[u] || []).push(id)
  })
  return out
}

function createAccount_(user, req) {
  requireLeader_(user)
  const username = String(req.username || '').trim().toLowerCase()
  const name = String(req.name || '').trim()
  const role = String(req.role || '').trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new Error('Username: 3-30 letters/numbers (. _ - allowed)')
  if (!name) throw new Error('Name is required')
  if (!ROLES[role]) throw new Error('Invalid role')
  validPassword_(req.password)

  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    if (findAccount_(username)) throw new Error('That username already exists')
    const salt = Utilities.getUuid()
    accountsSheet_(true).appendRow([
      username, safeText_(name), role, 'active', salt, hashPassword_(String(req.password), salt), new Date(), '',
    ])
  } finally { lock.releaseLock() }
  log_(user, 'ADD', 'Accounts', 'Created account ' + username + ' (' + role + ')')
  return { success: true }
}

function updateAccount_(user, req) {
  requireLeader_(user)
  const target = findAccount_(req.username)
  if (!target) throw new Error('Account not found')
  const sh = accountsSheet_(false)
  const changes = []

  if (req.role !== undefined || req.status !== undefined) {
    const role = req.role !== undefined ? String(req.role).toLowerCase() : target.role
    const status = req.status !== undefined ? String(req.status).toLowerCase() : target.status
    if (!ROLES[role]) throw new Error('Invalid role')
    if (status !== 'active' && status !== 'disabled') throw new Error('Invalid status')
    if (target.username === user.username && (role !== 'leader' || status !== 'active')) {
      throw new Error("You can't demote or disable your own account")
    }
    sh.getRange(target.row, 3, 1, 2).setValues([[role, status]])
    changes.push('role=' + role + ', status=' + status)
  }
  if (req.password) {
    validPassword_(req.password)
    const salt = Utilities.getUuid()
    sh.getRange(target.row, 5, 1, 2).setValues([[salt, hashPassword_(String(req.password), salt)]])
    changes.push('password reset')
  }
  log_(user, 'EDIT', 'Accounts', 'Updated ' + target.username + ': ' + changes.join('; '))
  return { success: true }
}

/* ---------- Run these from the Apps Script editor ---------- */

/** Edit the three constants, run once, then change the password in the dashboard. */
function setupFirstLeader() {
  const USERNAME = 'jay'
  const NAME = 'Jay Abraham'
  const PASSWORD = 'ChangeMe-2026'

  if (findAccount_(USERNAME)) { Logger.log('Account already exists: ' + USERNAME); return }
  const salt = Utilities.getUuid()
  accountsSheet_(true).appendRow([
    USERNAME, NAME, 'leader', 'active', salt, hashPassword_(PASSWORD, salt), new Date(), '',
  ])
  Logger.log('Created leader account "' + USERNAME + '". Log in and change the password.')
}

/** Emergency password reset from the editor. */
function resetPasswordFromEditor() {
  const USERNAME = 'jay'
  const NEW_PASSWORD = 'ChangeMe-2026'
  const a = findAccount_(USERNAME)
  if (!a) { Logger.log('No such account'); return }
  const salt = Utilities.getUuid()
  accountsSheet_(false).getRange(a.row, 5, 1, 2).setValues([[salt, hashPassword_(NEW_PASSWORD, salt)]])
  Logger.log('Password reset for ' + USERNAME)
}

/* =========================================
   READ
========================================= */

function getData_(user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const can = ROLES[user.role].read
  const has = k => can.indexOf(k) > -1
  const refs = {}
  const out = { success: true, user: publicUser_(user), refs: refs }

  if (has('attendance')) {
    const a = readAttendance_(ss)
    out.attendance = a.rows; refs.attendance = a.refs
  }
  ;['members', 'followup', 'events', 'leaders', 'consolidation'].forEach(k => {
    if (!has(k)) return
    const t = readTable_(ss.getSheetByName(TABLES[k].sheet), TABLES[k], k === 'events')
    if (k === 'members' && ['staff', 'attendance_staff', 'conso_head', 'conso_staff', 'consolidation'].indexOf(user.role) > -1) {
      t.rows.forEach((r, i) => { if (i > 0) { r[4] = ''; r[5] = '' } })   // no contact / email for the attendance and consolidation teams
    }
    out[k] = t.rows; refs[k] = t.refs
  })
  if (has('finance')) {
    const t = readTable_(ss.getSheetByName('Finance'), TABLES.finance, false)
    out.finance = t.rows.slice(1).map((r, i) => ({
      date: r[0], giving: r[1], amount: r[2], program: r[3], ref: t.refs[i + 1],
    }))
  }
  if (has('ygl'))     out.youthgetloud = rawSheet_(ss, 'YOUTH-GET-LOUD 2026')
  if (has('history')) out.history = rawSheet_(ss, 'HISTORY_LOG')
  return out
}

function rawSheet_(ss, name) {
  const sh = ss.getSheetByName(name)
  return sh ? sh.getDataRange().getValues() : []
}

/** Returns {rows, refs}. Row 0 is the header. refs[i] = "Sheet:rowNumber". Blank rows are skipped. */
function readTable_(sh, t, timeAsDisplay) {
  if (!sh) return { rows: [], refs: [] }
  const width = t.cols.length
  const lastRow = sh.getLastRow()
  if (lastRow < 1) return { rows: [], refs: [] }
  const range = sh.getRange(1, 1, lastRow, width)
  const values = range.getValues()
  const display = timeAsDisplay ? range.getDisplayValues() : null
  const rows = [], refs = []
  for (let i = 0; i < values.length; i++) {
    const r = values[i]
    if (i > 0 && r.every(c => c === '' || c === null)) continue
    if (display) {
      t.cols.forEach((c, ci) => { if (c.type === 'time' && i > 0) r[ci] = normTime_(display[i][ci]) })
    }
    rows.push(r)
    refs.push(i === 0 ? null : sh.getName() + ':' + (i + 1))
  }
  return { rows: rows, refs: refs }
}

function readAttendance_(ss) {
  // Only the live Attendance sheet. Old backups (Backup_* / Archive_*) use the old 9-column layout and are ignored.
  return readTable_(ss.getSheetByName('Attendance'), TABLES.attendance, false)
}

/** "13:00:00" | "1:00 PM" -> "1:00 PM" */
function normTime_(s) {
  const m = String(s || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i)
  if (!m) return String(s || '')
  let h = Number(m[1]); const min = m[2]
  const ap = m[3] ? m[3].toUpperCase() : (h >= 12 ? 'PM' : 'AM')
  if (m[3] && ap === 'PM' && h < 12) h += 12
  if (m[3] && ap === 'AM' && h === 12) h = 0
  const h12 = h % 12 === 0 ? 12 : h % 12
  return h12 + ':' + min + ' ' + (h >= 12 ? 'PM' : 'AM')
}

/* =========================================
   WRITE (add / update / delete)
========================================= */

function safeText_(s) {
  // Stops "=IMPORTXML(...)" style formula injection from form input
  s = String(s)
  return /^[=+\-@]/.test(s) && isNaN(Number(s)) ? "'" + s : s
}

function cleanValues_(t, values) {
  if (!Array.isArray(values) || values.length !== t.cols.length) throw new Error('Invalid form data')
  return values.map((v, i) => {
    const c = t.cols[i]
    const s = v === null || v === undefined ? '' : String(v).trim()
    if (s.length > 3000) throw new Error(c.name + ' is too long')
    if (c.auto) return ''
    if (!s) {
      if (c.req) throw new Error(c.name + ' is required')
      return ''
    }
    if (c.type === 'date') {
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (!m) throw new Error(c.name + ': invalid date')
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    }
    if (c.type === 'number') {
      const n = Number(s)
      if (!isFinite(n)) throw new Error(c.name + ' must be a number')
      return n
    }
    if (c.type === 'time') {
      const m = s.match(/^(\d{1,2}):(\d{2})$/)
      if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw new Error(c.name + ': invalid time')
      return (Number(m[1]) * 60 + Number(m[2])) / 1440
    }
    return safeText_(s)
  })
}

function parseRef_(ref) {
  const i = String(ref || '').lastIndexOf(':')
  if (i < 1) throw new Error('Bad row reference')
  const row = Number(String(ref).slice(i + 1))
  if (!row || row < 2) throw new Error('Bad row reference')
  return { sheet: String(ref).slice(0, i), row: row }
}

function styleSpecialCells_(sh, t, row) {
  if (t.sheet === 'Consolidation') sh.getRange(row, 10).setNumberFormat('mmm d, yyyy h:mm AM/PM')
  t.cols.forEach((c, i) => {
    if (c.type === 'time') sh.getRange(row, i + 1).setNumberFormat('h:mm AM/PM')
    if (c.type === 'date') sh.getRange(row, i + 1).setNumberFormat('mmmm d, yyyy')
  })
}

function writeRow_(user, op, req) {
  const table = String(req.table || '')
  const t = TABLES[table]
  const role = ROLES[user.role]
  const ops = (role.tableOps && role.tableOps[table]) || role.ops
  if (!t || role.write.indexOf(table) < 0 || ops.indexOf(op) < 0) throw new Error('Not allowed')

  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const lock = LockService.getScriptLock()
  lock.waitLock(15000)
  try {
    let sh, row, detail

    if (op === 'add') {
      const vals = cleanValues_(t, req.values)
      sh = (table === 'consolidation' || table === 'expenses') ? ensureSheet_(ss, t) : ss.getSheetByName(t.sheet)
      if (!sh) throw new Error(t.sheet + ' sheet not found')
      let extra = ''
      if (table === 'members') {
        const id = generateMemberId_(ss)
        vals[0] = id; vals[7] = 'QR-' + id
        extra = id
      }
      if (table === 'consolidation') {
        if (!sh) sh = ensureConsoSheet_(ss)
        finishConso_(vals, user, null)
      }
      sh.appendRow(vals)
      row = sh.getLastRow()
      styleSpecialCells_(sh, t, row)
      detail = 'Added ' + t.sheet + ' Row ' + row + ': ' + String(vals[t.key]) + (extra ? ' (' + extra + ')' : '')
      log_(user, 'ADD', t.sheet, detail)
      return { success: true, ref: t.sheet + ':' + row }
    }

    const p = parseRef_(req.ref)
    const okSheet = p.sheet === t.sheet
    if (!okSheet) throw new Error('Not allowed')
    sh = ss.getSheetByName(p.sheet)
    if (!sh || p.row > sh.getLastRow()) throw new Error('Row no longer exists. Refresh and try again.')
    const current = sh.getRange(p.row, 1, 1, t.cols.length).getValues()[0]
    if (String(current[t.key]).trim() !== String(req.expect === undefined ? '' : req.expect).trim()) {
      throw new Error('This row was changed by someone else. Refresh and try again.')
    }

    if (op === 'update') {
      const vals = cleanValues_(t, req.values)
      if (table === 'members') { vals[0] = current[0]; vals[7] = current[7] }
      if (table === 'consolidation') {
        if (user.role !== 'conso_head' && user.role !== 'leader' && user.role !== 'admin') {
          // Conso Staff: only their own rows, and never the follow-up status / notes
          if (String(current[8]).trim().toLowerCase() !== user.username) throw new Error('You can only edit first timers you entered')
          vals[6] = current[6]; vals[7] = current[7]
        }
        finishConso_(vals, user, current)
      }
      let extra = ''
      sh.getRange(p.row, 1, 1, t.cols.length).setValues([vals])
      styleSpecialCells_(sh, t, p.row)
      log_(user, 'EDIT', t.sheet, 'Edited ' + t.sheet + ' Row ' + p.row + ': ' + String(vals[t.key]) + (extra ? ' (' + extra + ')' : ''))
      return { success: true }
    }

    // delete
    sh.deleteRow(p.row)
    log_(user, 'DELETE', t.sheet, 'Deleted ' + t.sheet + ' Row ' + p.row + ': ' + String(current[t.key]))
    return { success: true }
  } finally {
    lock.releaseLock()
  }
}

/** Consolidation / Expenses sheets are created on first use so no manual setup is needed. */
function ensureConsoSheet_(ss) { return ensureSheet_(ss, TABLES.consolidation) }

function ensureSheet_(ss, t) {
  let sh = ss.getSheetByName(t.sheet)
  if (!sh) {
    sh = ss.insertSheet(t.sheet)
    sh.getRange(1, 1, 1, t.cols.length).setValues([t.cols.map(c => c.name)]).setFontWeight('bold')
    sh.setFrozenRows(1)
  }
  return sh
}

/** Fills the server-owned columns and normalises Status. `current` = existing row on update, null on add. */
function finishConso_(vals, user, current) {
  const status = String(vals[6] || 'PENDING').toUpperCase()
  if (CONSO_STATUSES.indexOf(status) < 0) throw new Error('Status must be PENDING, CONTACTED or DONE')
  vals[6] = status
  vals[8] = current ? current[8] : user.username
  vals[9] = new Date()
}

function log_(user, action, sheetName, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sh = ss.getSheetByName('HISTORY_LOG')
  if (!sh) {
    sh = ss.insertSheet('HISTORY_LOG')
    sh.appendRow(['Timestamp', 'User Email', 'Action', 'Sheet', 'Details'])
  }
  sh.appendRow([new Date().toISOString(), user.username + ' (' + user.name + ')', action, sheetName, details])
}

/* =========================================
   FIRST-TIMER AUTOMATION
   (Members + FollowUp rows) — shared by the
   dashboard forms and the sheet's onEdit.
========================================= */

/** vals = attendance row (already cleaned). Returns the member id or ''. */
function firstTimerHook_(ss, vals) {
  const firstTimer = String(vals[5] || '').trim().toLowerCase().replace(/\s/g, '')
  if (firstTimer !== 'yes') return ''
  const email = String(vals[6] || '').trim().toLowerCase()
  if (!email || email.indexOf('@') < 0) throw new Error('Email is required for first timers (needed for the QR pass)')
  return ensureMemberAndFollowUp_(ss, {
    fullName: String(vals[2] || '').trim(), age: vals[3], gender: vals[4],
    email: email, contact: vals[7], lgLeader: vals[8],
  })
}

function ensureMemberAndFollowUp_(ss, p) {
  const membersSheet = ss.getSheetByName('Members')
  const followupSheet = ss.getSheetByName('FollowUp')
  const members = membersSheet.getDataRange().getValues()
  const follow = followupSheet.getDataRange().getValues()

  let memberId = ''
  const existing = members.filter(r => String(r[5] || '').trim().toLowerCase() === p.email)[0]
  if (existing) {
    memberId = existing[0]
  } else {
    memberId = generateMemberId_(ss)
    membersSheet.appendRow([
      memberId, p.fullName, p.age, p.gender, p.contact || 'N/A', p.email, p.lgLeader || 'N/A', 'QR-' + memberId,
    ])
  }

  const already = follow.some(r => String(r[8] || '').trim().toLowerCase() === p.email)
  if (!already) {
    const today = new Date()
    followupSheet.appendRow([
      today, p.fullName, p.age, p.gender, p.lgLeader || 'N/A', today, 'MANUAL', 'PENDING', p.email, memberId,
    ])
  }
  return memberId
}

function generateMemberId_(ss) {
  const data = ss.getSheetByName('Members').getDataRange().getValues()
  let max = 0
  for (let i = 1; i < data.length; i++) {
    const id = data[i][0]
    if (id && String(id).indexOf('TRCF-') === 0) {
      const n = parseInt(String(id).split('-')[1], 10)
      if (!isNaN(n)) max = Math.max(max, n)
    }
  }
  return 'TRCF-' + String(max + 1).padStart(4, '0')
}

/* =========================================
   REGULAR MEMBERS CHECK-IN
   Ticking a name adds a "Date | FullName" row to Attendance;
   unticking removes it again. One row per person per day.
========================================= */

function setPresent_(user, req) {
  if (!ROLES[user.role].checkin) throw new Error('Not allowed')
  const name = String(req.name || '').replace(/\s+/g, ' ').trim()
  if (!name) throw new Error('Name is required')
  if (name.length > 120) throw new Error('Name is too long')
  const m = String(req.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) throw new Error('Invalid date')
  const day = m[0]
  const present = req.present === true

  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sh = ss.getSheetByName('Attendance')
  if (!sh) throw new Error('Attendance sheet not found')
  const tz = Session.getScriptTimeZone()

  const lock = LockService.getScriptLock()
  lock.waitLock(15000)
  try {
    // Only names that are on the Members sheet can be ticked by everyone.
    // Any other name is a First Timer, which only the Consolidation Team (and leaders) may add or remove.
    const isMember = ss.getSheetByName('Members').getDataRange().getValues().slice(1)
      .some(r => String(r[1]).replace(/\s+/g, ' ').trim().toLowerCase() === name.toLowerCase())
    if (!isMember && !ROLES[user.role].firstTimer) {
      throw new Error('Only the Consolidation Team can add first timers')
    }

    const last = sh.getLastRow()
    const vals = last > 1 ? sh.getRange(2, 1, last - 1, 2).getValues() : []
    const hits = []
    vals.forEach((r, i) => {
      if (!r[0] || String(r[1]).replace(/\s+/g, ' ').trim().toLowerCase() !== name.toLowerCase()) return
      const d = new Date(r[0])
      if (!isNaN(d) && Utilities.formatDate(d, tz, 'yyyy-MM-dd') === day) hits.push(i + 2)
    })

    if (present) {
      if (hits.length) return { success: true, present: true, duplicate: true }
      sh.appendRow([new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])), safeText_(name)])
      sh.getRange(sh.getLastRow(), 1).setNumberFormat('mmmm d, yyyy')
      log_(user, 'ADD', 'Attendance', (isMember ? 'Check-in: ' : 'First timer: ') + name + ' (' + day + ')')
      return { success: true, present: true }
    }

    hits.sort((a, b) => b - a).forEach(row => sh.deleteRow(row))
    if (hits.length) log_(user, 'DELETE', 'Attendance', 'Un-checked: ' + name + ' (' + day + ')')
    return { success: true, present: false }
  } finally {
    lock.releaseLock()
  }
}

/**
 * ONE-TIME SETUP for the new attendance system. Run from the Apps Script editor.
 *   - Attendance sheet header becomes  Date | FullName  (old columns C:I removed)
 *   - Adds the Regular Members below to the Members sheet (skips names already there)
 * Safe to run twice.
 */
function setupRegularMembers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const att = ss.getSheetByName('Attendance')
  if (att) {
    if (att.getLastRow() > 1 && String(att.getRange(1, 3).getValue()).toLowerCase() === 'theme') {
      throw new Error('Attendance still has old-format rows. Keep a backup copy, clear rows 2 and below, then run this again.')
    }
    att.getRange(1, 1, 1, 2).setValues([['Date', 'FullName']]).setFontWeight('bold')
    if (att.getMaxColumns() > 2) att.deleteColumns(3, att.getMaxColumns() - 2)
    att.setFrozenRows(1)
  }

  const sh = ss.getSheetByName('Members')
  const have = {}
  sh.getDataRange().getValues().slice(1).forEach(r => { have[String(r[1]).replace(/\s+/g, ' ').trim().toLowerCase()] = true })

  let added = 0
  REGULARS_.forEach(r => {
    if (have[r[0].toLowerCase()]) return
    const id = generateMemberId_(ss)
    sh.appendRow([id, r[0], r[1], r[2], 'N/A', 'N/A', r[3], 'QR-' + id])
    added++
  })
  Logger.log('Attendance set to Date | FullName. Regular members added: ' + added)
}

const REGULARS_ = [
  ["Aaleyah De Castro", 14, "Female", "Avril Lee Laparan"],
  ["Aaron Samuel Quilos", 16, "Male", "Jay Abraham"],
  ["Adrian Jake Nardo", 14, "Male", "Ethan Josh Patal"],
  ["Adriane Carl Dela Peña", 11, "Male", "Ethan Josh Patal"],
  ["Allia Dagatan", 17, "Female", "Carla Esclania"],
  ["Alvir Daniel Jundit", 21, "Male", "Emerson Patal"],
  ["Angelou Jay Deligeno", 14, "Male", "Jessie Ralph Dumandan"],
  ["Annika Zaira Sabanal", 12, "Female", "Carla Esclania"],
  ["Aris Loric Dumandan", 15, "Male", "Jessie Ralph Dumandan"],
  ["Arthea Billones", 18, "Female", "Joan Patal"],
  ["Athena Gail Carbonilla", 11, "Female", "Carla Esclania"],
  ["Avril Lee Laparan", 19, "Female", "Anna Quilos"],
  ["Billy Orbita", 13, "Male", "Alvir Daniel Jundit"],
  ["Carl Yee", 23, "Male", "Emerson Patal"],
  ["Carla Esclania", 14, "Female", "Joan Patal"],
  ["Casie Andrea Carcallas", 14, "Female", "Arthea Billones"],
  ["Christian May Eguna", 21, "Female", "Joan Patal"],
  ["Christian James Zamora", 14, "Male", "Alvir Daniel Jundit"],
  ["Crystal Dagumo", 13, "Female", "Erika Aguanta"],
  ["Dionlee Canoos", 21, "Male", "Carl Yee"],
  ["Dulce Moriene Booc", 12, "Female", "Erika Aguanta"],
  ["Edriane Cagadas", 16, "Male", "Jaime Rodemio"],
  ["Ethan Josh Patal", 17, "Male", "Jay Abraham"],
  ["Ellen Mae Milar", 12, "Female", "Carla Esclania"],
  ["Emerson Amahan", 13, "Male", "Jessie Ralph Dumandan"],
  ["Emmanuel Joseph Patal", 10, "Male", "Alvir Daniel Jundit"],
  ["Gwendelyn M. Dagook", 14, "Female", "Erika Aguanta"],
  ["Ian Ferenal", 16, "Male", "Emerson Patal"],
  ["Ian Guilaran", 17, "Male", "Edriane Cagadas"],
  ["Iñigo P. Davao", 11, "Male", "Jessie Ralph Dumandan"],
  ["Irene Ann Nazareno", 14, "Female", "Erika Aguanta"],
  ["Jacob Rabanes", 11, "Male", "Alvir Daniel Jundit"],
  ["Jairus Samuel Quiben", 14, "Male", "Alvir Daniel Jundit"],
  ["Jamella Benavides", 12, "Female", "Carla Esclania"],
  ["Janna Nicole Lasala", 13, "Female", "Arthea Billones"],
  ["Jay Francis Abraham", 21, "Male", "Bong Quilos"],
  ["John Carlo Nazareno", 22, "Male", "Emerson Patal"],
  ["Jeo Gray Mamalis", 22, "Male", "Franklin Flores"],
  ["Jezriel James Buhayan", 14, "Male", "Jessie Ralph Dumandan"],
  ["Jocelyn Milar", 11, "Female", "Carla Esclania"],
  ["John Paul Bantilan", 15, "Male", "Jessie Ralph Dumandan"],
  ["John Arnel Dagatan", 10, "Male", "Ethan Josh Patal"],
  ["John Wayne Ibon", 13, "Male", "Jessie Ralph Dumandan"],
  ["John Nethan Narvasa", 13, "Male", "Alvir Daniel Jundit"],
  ["John Rey Nazareno", 16, "Male", "Alvir Daniel Jundit"],
  ["Jonilyn Marie Paclibar", 12, "Female", "Erika Aguanta"],
  ["Jubel Mawas", 17, "Male", "Jaime Rodemio"],
  ["Keffer Bryle Ababat", 9, "Male", "Ethan Josh Patal"],
  ["Ken Espartero", 17, "Male", "Ethan Josh Patal"],
  ["Kriel James Dagook", 13, "Male", "Alvir Daniel Jundit"],
  ["Laurence Cainoy", 15, "Male", "Zyr Asombrado"],
  ["Lee Adriane Fernandez", 20, "Male", "Jay Abraham"],
  ["Leydan Remerata", 16, "Male", "Zyr Asombrado"],
  ["Lhyriane Mouie Paco", 14, "Female", "Avril Lee Laparan"],
  ["Luis Thirdy Suscano", 14, "Male", "Aaron Quilos"],
  ["Ma. Samara Luniel Banadera", 13, "Female", "Chan Eguna"],
  ["Marian Dagatan", 21, "Female", "Carla Esclania"],
  ["Markhy Vincent Rollo", 15, "Male", "Aaron Quilos"],
  ["Mary Cris Estaco", 14, "Female", "Carla Esclania"],
  ["Maxin Colin Domdom", 21, "Female", "Chan Eguna"],
  ["Miguel Peralta", 17, "Male", "Ethan Josh Patal"],
  ["Mike Jason Guinang", 13, "Male", "Ethan Josh Patal"],
  ["Nathan Lloyd Rollo", 11, "Male", "Aaron Quilos"],
  ["Natnat Narvasa", 13, "Female", "Alvir Daniel Jundit"],
  ["Niel E. Rollan", 12, "Male", "Ethan Josh Patal"],
  ["Onuu Quiben", 13, "Male", "Alvir Daniel Jundit"],
  ["Princess Nicole Alcantara", 12, "Female", "Erika Aguanta"],
  ["Reneil Tudtud", 15, "Male", "Jubel Mawas"],
  ["Rey Laurence Gacuma", 16, "Male", "Zyr Asombrado"],
  ["Ritchell Mawas", 13, "Female", "Juvelyn Zulita"],
  ["Roseleo B. Guinang", 12, "Male", "Ethan Josh Patal"],
  ["Rudel Singson", 13, "Male", "Jessie Ralph Dumandan"],
  ["Ryniel Toleran", 17, "Male", "Joey Mamalis"],
  ["Samartha Dizon", 19, "Female", "Joan Patal"],
  ["Shanna Isabel Pandia", 16, "Female", "Carla Esclania"],
  ["Vincent Remerata", 16, "Male", "Zyr Asombrado"],
  ["Zaijhon Asombrado", 15, "Male", "John Carlo Nazareno"],
  ["Zekesha D. Eguna", 12, "Female", "Erika Aguanta"]
]

/* =========================================
   QR SCAN ATTENDANCE
========================================= */

function scan_(user, req) {
  if (ROLES[user.role].write.indexOf('attendance') < 0) throw new Error('Not allowed')
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const id = String(req.id || '').trim().toLowerCase().replace(/\s/g, '')
  const members = ss.getSheetByName('Members').getDataRange().getValues()
  const m = members.slice(1).filter(r => String(r[0]).trim().toLowerCase().replace(/\s/g, '') === id)[0]
  if (!m) return { success: false, error: 'Member not found' }

  const tz = Session.getScriptTimeZone()
  const todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd')

  const lock = LockService.getScriptLock()
  lock.waitLock(15000)
  try {
    const sh = ss.getSheetByName('Attendance')
    const att = sh.getDataRange().getValues()
    const duplicate = att.slice(1).some(r => {
      if (!r[0] || String(r[1]).trim().toLowerCase() !== String(m[1]).trim().toLowerCase()) return false
      const d = new Date(r[0])
      return !isNaN(d) && Utilities.formatDate(d, tz, 'yyyy-MM-dd') === todayStr
    })
    if (duplicate) return { success: true, duplicate: true }

    sh.appendRow([new Date(), m[1]])
    sh.getRange(sh.getLastRow(), 1).setNumberFormat('mmmm d, yyyy')
    log_(user, 'ADD', 'Attendance', 'QR scan: ' + m[1] + ' (' + m[0] + ')')
    return { success: true, duplicate: false }
  } finally {
    lock.releaseLock()
  }
}

/* =========================================
   WELCOME QR EMAIL
========================================= */

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function sendWelcomeQR_(user, req) {
  if (!ROLES[user.role].mail) throw new Error('Not allowed')
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sh = ss.getSheetByName('FollowUp')
  if (!sh) return { success: false, error: 'FollowUp sheet not found' }

  const tz = Session.getScriptTimeZone()
  const selectedDate = String(req.date || '').trim()
  const seen = {}
  const rows = sh.getDataRange().getValues().slice(1).filter(row => {
    if (selectedDate) {
      if (!row[0]) return false
      const d = new Date(row[0])
      if (isNaN(d) || Utilities.formatDate(d, tz, 'yyyy-MM-dd') !== selectedDate) return false
    }
    const email = String(row[8] || '').trim().toLowerCase()
    if (!email || !String(row[9] || '').trim() || seen[email]) return false
    seen[email] = true
    return true
  })

  const quota = MailApp.getRemainingDailyQuota()
  if (rows.length > quota) {
    return { success: false, error: 'Only ' + quota + ' emails left in today\'s Google mail quota, but ' + rows.length + ' are queued. Pick a single date or try tomorrow.' }
  }
  if (!rows.length) return { success: true, total: 0, failed: 0 }

  const templateBlob = UrlFetchApp.fetch(CFG.WELCOME_TEMPLATE_URL).getBlob().setName('template.png')
  let sent = 0, failed = 0

  rows.forEach(row => {
    try {
      const fullName = esc_(String(row[1] || '').trim())
      const leader = esc_(String(row[4] || 'NO LEADER'))
      const memberId = String(row[9]).trim()
      const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' +
        encodeURIComponent('TRCF_MEMBER:' + memberId)
      const qrBlob = UrlFetchApp.fetch(qrUrl, { muteHttpExceptions: true }).getBlob().setName('qr.png')

      MailApp.sendEmail({
        to: String(row[8]).trim(),
        subject: 'TRCF Youth Jam Welcome QR',
        htmlBody: welcomeHtml_(fullName, leader),
        inlineImages: { template: templateBlob, qr: qrBlob },
        name: 'TRCF Youth Jam',
      })
      sent++
    } catch (err) {
      failed++
    }
  })

  log_(user, 'ADD', 'FollowUp', 'Sent welcome QR to ' + sent + ' people' + (failed ? ' (' + failed + ' failed)' : ''))
  return { success: true, total: sent, failed: failed }
}

function welcomeHtml_(fullName, leader) {
  const cell = 'align="center" valign="bottom" height="24" style="height:24px;color:#000;font-size:13px;font-weight:bold;font-family:Arial,sans-serif;text-transform:uppercase;line-height:16px;padding-bottom:2px;"'
  return '' +
    '<div style="font-family:Arial,sans-serif;background:#f4f7ff;padding:30px;text-align:center;">' +
    '<h2 style="margin-bottom:10px;">Welcome to TRCF Youth Jam 🙌</h2>' +
    '<p>Hello <b>' + fullName + '</b></p>' +
    '<p>Thank you for joining! Here is your QR Pass.</p>' +
    '<table align="center" cellpadding="0" cellspacing="0" border="0" width="380" height="475" style="width:380px;height:475px;background-image:url(\'cid:template\');background-size:cover;background-position:center;border-radius:20px;overflow:hidden;">' +
    '<tr><td height="107" style="height:107px;font-size:1px;line-height:1px;">&nbsp;</td></tr>' +
    '<tr><td align="center" valign="top"><img src="cid:qr" width="145" height="145" style="display:block;border:none;margin:0 auto;" /></td></tr>' +
    '<tr><td height="44" style="height:44px;font-size:1px;line-height:1px;">&nbsp;</td></tr>' +
    '<tr><td ' + cell + '>' + fullName + '</td></tr>' +
    '<tr><td height="20" style="height:20px;font-size:1px;line-height:1px;">&nbsp;</td></tr>' +
    '<tr><td ' + cell + '>' + leader + '</td></tr>' +
    '<tr><td height="106" style="height:106px;font-size:1px;line-height:1px;">&nbsp;</td></tr>' +
    '</table>' +
    '<div style="height:35px;"></div>' +
    '<p>Please save/screenshot your QR Code for attendance scanning.</p>' +
    '<p>God bless ❤️</p></div>'
}

/* =========================================
   PUSH NOTIFICATIONS (OneSignal)
========================================= */

function notify_(user, req) {
  if (!ROLES[user.role].notify) throw new Error('Not allowed')
  const apiKey = PropertiesService.getScriptProperties().getProperty('ONESIGNAL_API_KEY')
  if (!apiKey) return { success: false, error: 'ONESIGNAL_API_KEY is not set in Script properties' }

  const usernames = (Array.isArray(req.usernames) ? req.usernames : [])
    .map(u => String(u).trim().toLowerCase()).filter(Boolean)
  if (!usernames.length) return { success: false, error: 'No accounts selected' }

  const accounts = readAccounts_()
  const devices = devicesByAccount_()
  const requests = []
  const reached = {}

  usernames.forEach(u => {
    const acct = accounts.filter(a => a.username === u)[0]
    if (!acct || acct.status !== 'active') return
    const name = acct.name.split(' ')[0] || 'friend'
    ;(devices[u] || []).forEach(id => {
      reached[u] = true
      requests.push({
        url: 'https://api.onesignal.com/notifications',
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Key ' + apiKey },
        muteHttpExceptions: true,
        payload: JSON.stringify({
          app_id: CFG.ONESIGNAL_APP_ID,
          include_subscription_ids: [id],
          target_channel: 'push',
          headings: { en: 'TRCF Youth Jam Reminder' },
          contents: { en: 'Hi, ' + name + '! Please don\'t forget to update our Youth Jam Database 🙌 Thank you, ' + name + '. God bless you! ❤️' },
        }),
      })
    })
  })

  const noDevice = usernames.filter(u => !reached[u])
  if (!requests.length) {
    return { success: false, error: 'None of the selected accounts has a device registered for notifications yet. They need to log in on the installed app first.' }
  }

  const results = UrlFetchApp.fetchAll(requests)
  let ok = 0
  let firstError = ''
  results.forEach(r => {
    let body = {}
    try { body = JSON.parse(r.getContentText() || '{}') } catch (e) { body = {} }
    // OneSignal can answer 200 without creating a message (e.g. device unsubscribed)
    const accepted = r.getResponseCode() < 300 && body.id && !(body.errors && Object.keys(body.errors).length)
    if (accepted) { ok++; return }
    if (!firstError) {
      const e = body.errors
      firstError = Array.isArray(e) ? e.join('; ') : (e ? JSON.stringify(e) : 'HTTP ' + r.getResponseCode())
    }
  })
  log_(user, 'ADD', 'Users', 'Sent reminder to ' + Object.keys(reached).join(', ') + ' (' + ok + '/' + requests.length + ' devices accepted)')
  return {
    success: ok > 0, sent: ok, total: requests.length,
    accounts: Object.keys(reached).length, skipped: noDevice,
    error: ok ? '' : 'OneSignal did not deliver: ' + firstError,
  }
}

function saveDevice_(user, req) {
  const id = String(req.onesignalId || '').trim()
  if (!id) return { success: false, error: 'Missing OneSignal ID' }
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users')
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const data = sh.getDataRange().getValues()
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][3]) === id) {
        // same device, possibly a different person logging in: re-link it to this account
        const n = String(data[i][0] || '').trim()
        if (!n || n === 'Unknown User') sh.getRange(i + 1, 1).setValue(user.name)
        sh.getRange(i + 1, 3).setValue(user.role)
        sh.getRange(i + 1, 9).setValue(user.username)
        return { success: true }
      }
    }
    sh.appendRow([
      user.name, '', user.role, id, 'active',
      safeText_(String(req.device || '').slice(0, 40)), safeText_(String(req.browser || '').slice(0, 200)), new Date(), user.username,
    ])
    return { success: true }
  } finally {
    lock.releaseLock()
  }
}

/* =========================================
   MANUAL EDITS IN THE SHEET (still supported)
========================================= */

function onEdit(e) {
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(5000)) return
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const sheet = e.range.getSheet()
    const sheetName = sheet.getName()
    if (sheetName === 'HISTORY_LOG' || sheetName === 'Accounts') return

    const row = e.range.getRow()
    if (row === 1) return

    const logSheet = ss.getSheetByName('HISTORY_LOG')
    if (logSheet) {
      const oldValue = e.oldValue || ''
      const newValue = e.range.getValue()
      let action = 'EDIT', text = 'Edited'
      if (oldValue === '') { action = 'ADD'; text = 'Added' }
      if (newValue === '') { action = 'DELETE'; text = 'Deleted' }
      const details = text + ' ' + sheetName + ' Row ' + row
      const last = logSheet.getLastRow()
      if (!(last > 1 && logSheet.getRange(last, 5).getValue() === details)) {
        logSheet.appendRow([new Date().toISOString(), Session.getActiveUser().getEmail() || 'Unknown User', action, sheetName, details])
      }
    }
  } finally {
    lock.releaseLock()
  }
}

/* =========================================
   HELPERS
========================================= */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
