export async function POST(req) {
  try {
    const data = await req.json()

    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbwLvAZMAFLRMltL2unl5NEzeO0qJZTfsF7tGtAbQvMxv5VARqWuWrWYqtAZPBlQ7VFv/exec",
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