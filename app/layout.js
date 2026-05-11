import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script 
          id="cookieyes" 
          src=<script id="cookieyes" type="text/javascript" src="https://cdn-cookieyes.com/client_data/a79521861388a137a5eb727b0e0233b6/script.js"></script>
          strategy="afterInteractive" 
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
