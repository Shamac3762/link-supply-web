'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else setMessage('Check your email for a confirmation link!')
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else router.push('/dashboard')
  }

  return (
    <div style={{ padding: '50px', textAlign: 'center', background: '#111', color: 'white', minHeight: '100vh' }}>
      <h1>Link Supply Login</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
        <input 
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ padding: '10px', color: 'black' }} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ padding: '10px', color: 'black' }} 
        />
        <button onClick={handleLogin} style={{ padding: '10px', cursor: 'pointer' }}>Login</button>
        <button onClick={handleSignUp} style={{ padding: '10px', background: 'none', color: 'white', border: '1px solid white', cursor: 'pointer' }}>Sign Up</button>
      </div>
      <p>{message}</p>
    </div>
  )
}
