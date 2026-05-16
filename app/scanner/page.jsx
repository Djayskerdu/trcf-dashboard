'use client'

import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

const API_URL =
  'YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL'

export default function ScannerPage() {

  const [scanResult, setScanResult] =
    useState('')

  const [status, setStatus] =
    useState('Ready to Scan')

  useEffect(() => {

    const scanner =
      new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: 260,
        },
        false
      )

    scanner.render(

      async (decodedText) => {

        try {

          setStatus('Processing...')

          const response = await fetch(
            API_URL,
            {
              method: 'POST',

              headers: {
                'Content-Type': 'application/json',
              },

              body: JSON.stringify({
                memberId: decodedText,
              }),
            }
          )

          const data =
            await response.json()

          if (data.success) {

            setScanResult(data.name)

            setStatus(
              `${data.name} attendance recorded`
            )

          } else {

            setStatus(data.message)

          }

        } catch (err) {

          console.log(err)

          setStatus(
            'Error connecting to server'
          )

        }

      },

      (error) => {
        console.log(error)
      }

    )

    return () => {
      scanner.clear()
    }

  }, [])

  return (

    <main className="scanner-page">

      <div className="scanner-container">

        <h1>TRCF QR Attendance</h1>

        <p className="scanner-subtitle">
          Scan Member QR Code
        </p>

        <div id="reader" />

        <div className="scan-status">

          <h2>{status}</h2>

          {scanResult && (

            <div className="scan-success">

              <span>✅ Member:</span>

              <strong>{scanResult}</strong>

            </div>

          )}

        </div>

      </div>

    </main>
  )
}