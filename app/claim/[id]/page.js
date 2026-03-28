'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'

export default function SecureClaimPage() {
  const params = useParams()
  const stickerId = params?.id // This is the ugly url_slug from the URL
  
  const [displayId, setDisplayId] = useState('') // 🔥 NEW: Stores the clean LS-005 ID
  const [activationCode, setActivationCode] = useState('')
  const [status, setStatus] = useState('')
  const [checking, setChecking] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const initializeClaim = async () => {
      // 1. Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setStatus("Redirecting to account creation...")
        return router.push(`/login?view=signup&claim=${stickerId}`) 
      }

      // 🔥 2. UX FIX: Fetch the clean, human-readable ID to display to the customer
      const { data: tagData } = await supabase
        .from('nfc_stickers')
        .select('id')
        .eq('url_slug', stickerId)
        .single()
        
      if (tagData) {
        setDisplayId(tagData.id) // e.g., LS-005
      }

      setChecking(false)
    }
    
    initializeClaim()
  }, [router, stickerId]) 

  const handleClaim = async () => {
    if (!activationCode || activationCode.length < 6) {
      return setStatus("Please enter your full Activation Code.")
    }

    setStatus("Verifying Activation Code...")
    const { data: { user } } = await supabase.auth.getUser()

    // THE DEFAULT URL: Hardcoded to your homepage for all new tags
    const defaultUrl = 'https://www.linksupply.co.uk/'

    // THE VAULT DOOR: Checks url_slug and activation_code, then assigns the target_url
    const { error, data } = await supabase
      .from('nfc_stickers')
      .update({ 
        owner_id: user.id,
        target_url: defaultUrl
      })
      .eq('url_slug', stickerId) 
      .eq('activation_code', activationCode.toUpperCase()) 
      .is('owner_id', null) 
      .select() 

    if (error || !data || data.length === 0) {
      setStatus("Error: Invalid Code or this item is already claimed.")
    } else {
      setStatus("Success! Item secured. Taking you to your dashboard...")
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  if (checking) return <div style={{ padding: '50px', background: '#111', color: 'white', minHeight: '100vh' }}>Loading...</div>

  return (
    <div style={{ padding: '50px', textAlign: 'center', background: '#111', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Claim Your Tag</h1>
      
      {/* 🔥 UX FIX: Now displays LS-005 instead of the ugly slug! */}
      <h2 style={{ color: '#0070f3', marginBottom: '30px', letterSpacing: '1px' }}>
        TAG: {displayId || 'Loading...'}
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          maxLength="8"
          placeholder="e.g. DEF9BFC0" 
          value={activationCode}
          onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
          style={{ 
            padding: '12px', 
            width: '200px', 
            textAlign: 'center', 
            fontSize: '18px', 
            letterSpacing: '2px',
            color: 'black',
            borderRadius: '5px',
            border: 'none',
            textTransform: 'uppercase'
          }}
        />
      </div>

      <button 
        onClick={handleClaim} 
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#fff', 
          color: '#000', 
          border: 'none',
          borderRadius: '5px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Secure & Link Account
      </button>
      
      <p style={{ marginTop: '20px', color: '#ff4d4d' }}>{status}</p>
    </div>
  )
}
