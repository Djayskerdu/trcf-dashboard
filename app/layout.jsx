import './globals.css'
import Script from 'next/script'
import OneSignalClient from './OneSignalClient'

export const metadata = {
  title: 'TRCF Youth Jam DATABASE',
  description: 'TRCF Youth Jam Dashboard',
}

export default function RootLayout({
  children,
}) {

  return (

    <html lang="en">

      <head>

        <link
          rel="manifest"
          href="/manifest.json"
        />

        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />

      </head>

      <body>

        <OneSignalClient />

        {children}

      </body>

    </html>
  )
}