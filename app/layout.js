export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Start cookieyes banner */}
        <script 
          id="cookieyes" 
          type="text/javascript" 
          src="https://cdn-cookieyes.com/client_data/a79521861388a137a5eb727b0e0233b6/script.js"
        ></script>
        {/* End cookieyes banner */}
      </head>
      <body>{children}</body>
    </html>
  )
}
