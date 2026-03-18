'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'

export default function SmartClaimPage() {
  const params = useParams()
  // React requires unwrapping params in Next.js 16+, so we use React.use() or access it directly if simple. 
  // For client components, standard params.id usually works, but let's handle it safely.
  const stickerId = params?.id 
  
  const [status, setStatus] = useState('')
  const [checking, setChecking] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Check if the user is actually logged in before they try to claim
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
    setStatus("Linking to your account...")
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('nfc_stickers')
      .update({ owner_id: user.id })
      .eq('id', stickerId)
      .is('owner_id', null) // CRITICAL: Only claim if it has no owner

    if (error) {
      console.error(error)
      setStatus("Error: This sticker might already be claimed or doesn't exist.")
    } else {
      setStatus("Success! Taking you to your dashboard...")
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  if (checking) return <div style={{ padding: '50px', color: 'white', background: '#111', minHeight: '100vh' }}>Loading...</div>

  return (
    <div style={{ padding: '50px', textAlign: 'center', background: '#111', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Claim Your Tag</h1>
      <h2 style={{ color: '#0070f3', marginBottom: '30px' }}>ID: {stickerId}</h2>
      
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
        Link to my Account
      </button>
      
      <p style={{ marginTop: '20px', color: '#888' }}>{status}</p>
    </div>
  )
}
