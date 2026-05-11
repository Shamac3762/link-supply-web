import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script 
          id="cookieyes" 
          src="PASTE_YOUR_URL_HERE" 
          strategy="afterInteractive" 
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
