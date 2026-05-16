export async function POST(req) {
  try {
    const data = await req.json()

    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbxKpZdL1wzbjmtTGAprLywJ6pgLX0B-M6FSNw90hSK0el6-v0dsZ0hNSo8lf5SHfG-g/exec",
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