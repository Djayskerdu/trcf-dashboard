const KEY = 'trcf_session'

export function loadSession() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    return s && s.token && s.user ? s : null
  } catch {
    return null
  }
}

export function saveSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(KEY)
}

export class AuthError extends Error {}

/**
 * POST an action to the Apps Script backend (through /api/gas).
 * Resolves with the response object; throws Error(message) on failure.
 * An expired/invalid session clears itself and fires "trcf-auth-expired".
 */
export async function api(action, payload = {}) {
  const token = loadSession()?.token

  const res = await fetch('/api/gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, ...payload }),
  })

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('Unreadable response from server')
  }

  if (data.code === 'AUTH') {
    clearSession()
    window.dispatchEvent(new Event('trcf-auth-expired'))
    throw new AuthError(data.error || 'Please log in')
  }

  if (!data.success) throw new Error(data.error || 'Something went wrong')

  return data
}
