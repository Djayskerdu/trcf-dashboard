export async function POST(req) {
  try {
    const data = await req.json()

    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbwVqkiZV-GeRhgVRiE6l5S5fTeJ1F0TvYpNhEZhwWBrxUL7poEi8Yioy57dSRLDmr1x/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )

    const text = await res.text()

    return Response.json({
      success: true,
      response: text,
    })

  } catch (err) {
    return Response.json({
      success: false,
      error: err.toString(),
    })
  }
}