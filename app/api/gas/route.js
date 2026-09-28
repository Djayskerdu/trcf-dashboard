// Server-side proxy to the Google Apps Script backend.
// The browser only ever talks to /api/gas (no CORS issues, script URL stays server-side).

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // bulk QR emails can take a while

const GAS_URL =
  process.env.GAS_URL ||
  'https://script.google.com/macros/s/AKfycbyOrJ6PAmXP9jxNfaLA8Mnfzl0z8eZYm-4lbkV7XGFDCYJqqG06hTtSt7bYj-vql50/exec'

export async function POST(req) {
  try {
    const body = await req.text()

    if (body.length > 200_000) {
      return Response.json({ success: false, error: 'Request too large' }, { status: 413 })
    }

    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',
      cache: 'no-store',
    })

    const text = await res.text()

    try {
      JSON.parse(text)
    } catch {
      return Response.json(
        { success: false, error: 'Backend did not return JSON. Check the Apps Script deployment.' },
        { status: 502 }
      )
    }

    return new Response(text, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}
