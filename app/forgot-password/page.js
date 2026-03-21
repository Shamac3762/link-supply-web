'use client'
import { useState } from 'react'
import { createClient } from '../../utils/supabase/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleResetRequest = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    // This tells Supabase to email them, and then send them to our new Update Password page
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setIsError(true)
      setMessage(error.message)
    } else {
      setIsError(false)
      setMessage('Check your email! We sent you a secure reset link.')
      setEmail('')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111', marginBottom: '10px', textAlign: 'center' }}>Reset Password</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', marginBottom: '30px' }}>Enter your email and we will send you a secure link to reset your password.</p>
        
        <form onSubmit={handleResetRequest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '16px', boxSizing: 'border-box' }}
              placeholder="you@company.com"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {message && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: isError ? '#fef2f2' : '#ecfdf5', color: isError ? '#dc2626' : '#059669', borderRadius: '8px', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <a href="/login" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>← Back to Login</a>
        </div>
      </div>
    </div>
  )
}
