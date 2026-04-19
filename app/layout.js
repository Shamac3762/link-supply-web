export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        
        {/* --- GLOBAL NAVIGATION BAR --- */}
        <nav style={{ padding: '20px 40px', borderBottom: '1px solid #eaeaea', display: 'flex', alignItems: 'center' }}>
          
          {/* Your New Logo Snippet */}
          <a href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <h1 style={{ 
              fontFamily: '"Myriad Pro", "Segoe UI", Roboto, sans-serif', 
              fontSize: '24px', 
              color: '#111', 
              margin: 0, 
              letterSpacing: '-0.5px', 
              display: 'flex', 
              alignItems: 'baseline' 
            }}>
              <span style={{ fontWeight: '700' }}>Link</span>
              <span style={{ fontWeight: '400' }}>Supply.</span>
            </h1>
          </a>

        </nav>

        {/* --- PAGE CONTENT --- */}
        <main>
          {children}
        </main>

      </body>
    </html>
  )
}
