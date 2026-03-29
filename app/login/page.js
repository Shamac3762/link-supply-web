'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function PremiumLoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  // 🔥 NEW: State to track the Terms & Conditions checkbox
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  // Listen for the ?view=signup parameter and flip the UI
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('view') === 'signup') {
      setIsSignUp(true)
    }
  }, [])

  const handleAuth = async (e) => {
    e.preventDefault()
    
    // 🔥 NEW: Validation check for the Terms & Conditions during Sign Up
    if (isSignUp && !agreedToTerms) {
      setMessage('Please agree to the Terms & Conditions to create your account.')
      return
    }

    setLoading(true)
    setMessage('')

    const params = new URLSearchParams(window.location.search)
    const claimId = params.get('claim')
    const redirectUrl = claimId ? `/dashboard?claim=${claimId}` : '/dashboard'

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { first_name: firstName, last_name: lastName } 
        }
      })
      
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Account created! Securing your vault...')
        
        // Silently log them in right after creation
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        
        if (!signInError) {
          router.push(redirectUrl) // Teleport to dashboard with the Tag ID!
        } else {
          // Fallback in case your Supabase requires Email Verification first
          setMessage('Success! Please check your email to verify your account.')
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage("Invalid email or password.")
      else router.push(redirectUrl) 
    }
    setLoading(false)
  }

  const inputStyle = {
    padding: '14px', borderRadius: '8px', border: '1px solid #ddd', 
    width: '100%', marginBottom: '15px', fontSize: '16px', color: '#333',
    backgroundColor: '#f9f9f9', boxSizing: 'border-box'
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' }}>
      
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111', marginBottom: '5px' }}>
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '14px' }}>
          {isSignUp ? 'Register to manage your NFC tags.' : 'Enter your details to access your dashboard.'}
        </p>

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <input required placeholder="First Name" onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
              <input required placeholder="Last Name" onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
            </div>
          )}
          
          <input required type="email" placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input required type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, marginBottom: isSignUp ? '5px' : '15px' }} />

          {!isSignUp && (
            <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '15px' }}>
              <a href="/forgot-password" style={{ fontSize: '13px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600' }}>Forgot password?</a>
            </div>
          )}

          {/* 🔥 NEW: The Legal/Compliance UI Blocks */}
          {isSignUp ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px', marginBottom: '20px', textAlign: 'left' }}>
              <input 
                type="checkbox" 
                id="terms" 
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer', minWidth: '16px', minHeight: '16px' }}
              />
              <label htmlFor="terms" style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                I agree to the Link Supply <a href="/terms" target="_blank" style={{ color: '#111', textDecoration: 'underline', fontWeight: '500' }}>Terms & Conditions</a> and <a href="/privacy" target="_blank" style={{ color: '#111', textDecoration: 'underline', fontWeight: '500' }}>Privacy Policy</a>.
              </label>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '0', marginBottom: '20px' }}>
              By logging in, you agree to our <a href="/terms" target="_blank" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Service</a>.
            </p>
          )}

          <button disabled={loading} type="submit" style={{ 
            width: '100%', padding: '14px', backgroundColor: '#111', color: 'white', 
            border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', 
            cursor: loading ? 'not-allowed' : 'pointer', transition: '0.2s', marginTop: '5px' 
          }}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        {message && <p style={{ color: message.includes('Securing') || message.includes('Success') ? '#059669' : '#dc2626', marginTop: '15px', fontSize: '14px', fontWeight: '500', padding: '10px', backgroundColor: message.includes('Securing') || message.includes('Success') ? '#d1fae5' : '#fee2e2', borderRadius: '8px' }}>{message}</p>}

        <div style={{ marginTop: '30px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button"
              onClick={() => { 
                setIsSignUp(!isSignUp); 
                setMessage(''); 
                setAgreedToTerms(false); // Reset terms checkbox when toggling
              }} 
              style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', cursor: 'pointer', marginLeft: '5px', fontSize: '14px' }}
            >
              {isSignUp ? 'Log in here' : 'Sign up here'}
            </button>
          </p>
        </div>
      </div>

    </div>
  )
}
