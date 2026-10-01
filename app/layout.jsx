import './globals.css'
import './rebrand.css'
import './mobile.css'
import './sidebar-rail.css'
import './events-popup.css'
import Script from 'next/script'
import OneSignalClient from './OneSignalClient'

export const metadata = {
  title: 'TRCF Youth Jam DATABASE',
  description: 'TRCF Youth Jam Dashboard',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',   // lets the app use the notch area; safe-area padding is in mobile.css
  themeColor: '#070b1f',
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

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
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