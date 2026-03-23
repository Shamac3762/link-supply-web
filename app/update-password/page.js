'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('Verifying secure link...')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(true) 
  
  // 🔥 THE SHIELD: This stops React from double-firing the security code
  const hasAttempted = useRef(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const setupSession = async () => {
      // If we already verified the code, stop immediately to prevent the double-fire bug
      if (hasAttempted.current) return
      hasAttempted.current = true

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        // Trade the single-use code for a real session
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          setIsError(true)
          setMessage('This reset link is invalid or has expired. Please request a new one.')
          setLoading(false)
          return
        }
        
        // Success! We hide the code from the web address so it stays clean
        window.history.replaceState({}, document.title, window.location.pathname)
      }
      
      // Give Supabase a split second to lock in the new session
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setIsError(true)
          setMessage('No active session found. Please request a new reset link.')
          setLoading(false)
        } else {
          setIsError(false)
          setMessage('') 
          setLoading(false) // Unlocks the form!
        }
      }, 500)
    }

    setupSession()
  }, [])

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setIsError(true)
      setMessage(error.message)
      setLoading(false)
    } else {
      setIsError(false)
      setMessage('Password updated successfully! Redirecting to workspace...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111', marginBottom: '10px', textAlign: 'center' }}>Set New Password</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', marginBottom: '30px' }}>
          Your identity has been verified. Please enter your new password below.
        </p>
        
        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>New Password</label>
            <input 
              type="password" 
              required
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '16px', boxSizing: 'border-box', backgroundColor: loading ? '#f9fafb' : 'white' }}
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', backgroundColor: loading ? '#9ca3af' : '#111', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            {loading ? 'Verifying...' : 'Update Password'}
          </button>
        </form>

        {message && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: isError ? '#fef2f2' : '#ecfdf5', color: isError ? '#dc2626' : '#059669', borderRadius: '8px', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
