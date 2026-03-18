'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ClaimPage() {
  const [stickerId, setStickerId] = useState('')
  const [status, setStatus] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleClaim = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setStatus("Please login first!")
      return router.push('/login')
    }

    const { error } = await supabase
      .from('nfc_stickers')
      .update({ owner_id: user.id })
      .eq('id', stickerId)
      .is('owner_id', null) // Only allow claiming if it doesn't have an owner yet

    if (error) setStatus("Error claiming sticker. It might already be owned.")
    else {
      setStatus("Success! Redirecting to dashboard...")
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <div style={{ padding: '50px', textAlign: 'center', background: '#111', color: 'white', minHeight: '100vh' }}>
      <h1>Claim Your Sticker</h1>
      <input 
        placeholder="Enter Sticker ID (e.g. LS-001)" 
        onChange={(e) => setStickerId(e.target.value)}
        style={{ padding: '10px', width: '250px', marginBottom: '10px', color: 'black' }}
      />
      <br />
      <button onClick={handleClaim} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Link to my Account
      </button>
      <p>{status}</p>
    </div>
  )
}
