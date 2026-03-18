'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'

export default function SecureClaimPage() {
  const params = useParams()
  const stickerId = params?.id 
  
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState('')
  const [checking, setChecking] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setStatus("Redirecting to login...")
        router.push('/login')
      } else {
        setChecking(false)
      }
    }
    checkUser()
  }, [router])

  const handleClaim = async () => {
    if (!pin || pin.length < 4) {
      return setStatus("Please enter your 4-digit PIN.")
    }

    setStatus("Verifying PIN...")
    const { data: { user } } = await supabase.auth.getUser()

    // THE VAULT DOOR: We now check the ID *and* the exact PIN
    const { error, data } = await supabase
      .from('nfc_stickers')
      .update({ owner_id: user.id })
      .eq('id', stickerId)
      .eq('claim_pin', pin) // Must match the PIN exactly
      .is('owner_id', null) 
      .select() // Ask Supabase to return the row if successful

    if (error || !data || data.length === 0) {
      setStatus("Error: Invalid PIN or this sticker is already claimed.")
    } else {
      setStatus("Success! PIN accepted. Taking you to your dashboard...")
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  if (checking) return <div style={{ padding: '50px', background: '#111', color: 'white', minHeight: '100vh' }}>Loading...</div>

  return (
    <div style={{ padding: '50px', textAlign: 'center', background: '#111', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Claim Your Tag</h1>
      <h2 style={{ color: '#0070f3', marginBottom: '30px' }}>ID: {stickerId}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          maxLength="4"
          placeholder="Enter 4-Digit PIN" 
          onChange={(e) => setPin(e.target.value)}
          style={{ 
            padding: '12px', 
            width: '200px', 
            textAlign: 'center', 
            fontSize: '18px', 
            letterSpacing: '5px',
            color: 'black',
            borderRadius: '5px',
            border: 'none'
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
