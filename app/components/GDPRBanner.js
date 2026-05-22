'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function GDPRBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if they have already accepted when the component loads
    const consent = localStorage.getItem('linksupply_gdpr_consent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('linksupply_gdpr_consent', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)',
      maxWidth: '600px',
      backgroundColor: '#111111',
      color: '#ffffff',
      padding: '20px 24px',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: '1px solid #333'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🍪 We value your privacy
        </h3>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#a1a1aa' }}>
          We use strictly necessary cookies to keep you logged in and secure. We also use anonymous tracking to provide your dashboard analytics. By clicking "Accept", you consent to our use of these tools.
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Link href="/privacy" style={{ color: '#a1a1aa', fontSize: '13px', textDecoration: 'none', marginRight: 'auto' }}>
          Read Privacy Policy
        </Link>
        <button 
          onClick={() => setIsVisible(false)} 
          style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#ffffff', border: '1px solid #333', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          Decline Optional
        </button>
        <button 
          onClick={handleAccept} 
          style={{ padding: '10px 20px', backgroundColor: '#ffffff', color: '#111111', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px rgba(255,255,255,0.1)' }}
        >
          Accept All
        </button>
      </div>
    </div>
  )
}
