'use client'
import { useEffect, useState } from 'react'

export default function QrBatchGenerator() {
  const [qrs, setQrs] = useState([])

  useEffect(() => {
    // Generate the array of 50 QR IDs (QR-001 through QR-050)
    const batch = Array.from({ length: 50 }, (_, i) => {
      const num = String(i + 1).padStart(3, '0')
      return `QR-${num}`
    })
    setQrs(batch)
  }, [])

  return (
    <div style={{ padding: '40px', backgroundColor: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Admin Controls - Hidden automatically when printing */}
      <div className="no-print" style={{ marginBottom: '50px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111', marginBottom: '10px' }}>Batch QR Generator</h1>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Press <strong>Cmd/Ctrl + P</strong> to print this page or save as a PDF.</p>
        <button onClick={() => window.print()} style={{ padding: '12px 24px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '16px' }}>
          Print / Save PDF
        </button>
      </div>

      {/* The Printable Grid */}
      <div style={{ 
        display: 'grid', 
        // Widened the minimum column size slightly to accommodate the side-by-side layout
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
        gap: '40px 20px',
        justifyItems: 'center'
      }}>
        {qrs.map(id => {
          const url = `https://linksupply.co.uk/go/${id}?m=qr`
          const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&margin=0`

          return (
            <div key={id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '15px', pageBreakInside: 'avoid' }}>
              <img src={qrImageSrc} alt={id} style={{ width: '120px', height: '120px' }} />
              
              {/* Rotated Text on the Right */}
              <span style={{ 
                fontSize: '18px', 
                fontWeight: '800', 
                fontFamily: 'monospace', 
                color: '#111', 
                letterSpacing: '2px',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)', // Rotates it to read from bottom to top
                whiteSpace: 'nowrap'
              }}>
                {id}
              </span>
            </div>
          )
        })}
      </div>

      {/* CSS to clean up the page when printing */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; margin: 0; padding: 0; }
          @page { margin: 0.5cm; }
        }
      `}</style>
    </div>
  )
}
