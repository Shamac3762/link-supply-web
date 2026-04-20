'use client'
import { useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OnboardingFlow() {
  const [ig, setIg] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const finishOnboarding = async (saveData) => {
    setLoading(true)
    
    // 1. Grab the claim ID if they tapped a physical tag
    const params = new URLSearchParams(window.location.search)
    const claimId = params.get('claim')
    const finalDestination = claimId ? `/dashboard?claim=${claimId}` : '/dashboard'

    // 2. Save the socials if they didn't click skip
    if (saveData && (ig || tiktok)) {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const linksToInsert = []
        
        // Clean up inputs (remove '@' if they typed it) and format into full URLs
        if (ig) {
          const cleanIg = ig.replace('@', '').trim()
          linksToInsert.push({ owner_id: session.user.id, title: 'Instagram', url: `https://instagram.com/${cleanIg}`, sort_order: 0 })
        }
        if (tiktok) {
          const cleanTiktok = tiktok.replace('@', '').trim()
          linksToInsert.push({ owner_id: session.user.id, title: 'TikTok', url: `https://tiktok.com/@${cleanTiktok}`, sort_order: 1 })
        }

        // Push directly into your existing page_links table
        if (linksToInsert.length > 0) {
          await supabase.from('page_links').insert(linksToInsert)
        }
      }
    }

    // 3. Send them to their dashboard to activate the tag
    router.push(finalDestination)
  }

  const inputContainerStyle = { 
    display: 'flex', alignItems: 'center', backgroundColor: '#f9fafb', 
    border: '1px solid #d1d5db', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' 
  }

  const inputStyle = { 
    flex: 1, padding: '14px 14px 14px 5px', border: 'none', backgroundColor: 'transparent', 
    fontSize: '16px', color: '#111', outline: 'none' 
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' }}>
      
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        
        {/* Brand Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ textDecoration: 'none', display: 'inline-block' }}>
            <h1 style={{ 
              fontFamily: '"Myriad Pro", "Segoe UI", Roboto, sans-serif', fontSize: '28px', color: '#111', 
              margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'baseline', justifyContent: 'center'
            }}>
              <span style={{ fontWeight: '700' }}>Link</span>
              <span style={{ fontWeight: '400' }}>Supply.</span>
            </h1>
          </div>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
          Connect your socials
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '15px', lineHeight: '1.5' }}>
          Add your top platforms now to instantly populate your digital business card.
        </p>

        {/* Instagram Input */}
        <div style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#4b5563', marginBottom: '6px', fontWeight: '700' }}>Instagram Username</label>
          <div style={inputContainerStyle}>
            <span style={{ padding: '14px 5px 14px 16px', color: '#9ca3af', fontWeight: '600', fontSize: '16px' }}>@</span>
            <input type="text" placeholder="yourbrand" value={ig} onChange={(e) => setIg(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* TikTok Input */}
        <div style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#4b5563', marginBottom: '6px', fontWeight: '700' }}>TikTok Username</label>
          <div style={inputContainerStyle}>
            <span style={{ padding: '14px 5px 14px 16px', color: '#9ca3af', fontWeight: '600', fontSize: '16px' }}>@</span>
            <input type="text" placeholder="yourbrand" value={tiktok} onChange={(e) => setTiktok(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
          <button 
            disabled={loading} 
            onClick={() => finishOnboarding(true)} 
            style={{ width: '100%', padding: '16px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', transition: '0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            {loading ? 'Securing Vault...' : 'Continue'}
          </button>
          
          {/* Faded Skip Button */}
          <button 
            disabled={loading} 
            onClick={() => finishOnboarding(false)} 
            style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#9ca3af', border: 'none', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', transition: 'color 0.2s' }}
            onMouseOver={(e) => e.target.style.color = '#4b5563'}
            onMouseOut={(e) => e.target.style.color = '#9ca3af'}
          >
            Skip for now
          </button>
        </div>

      </div>
    </div>
  )
}
