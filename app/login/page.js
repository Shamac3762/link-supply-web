'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link' // 🔥 Added Link import for the logo

export default function PremiumLoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Compliance States
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [rememberMe, setRememberMe] = useState(false) 
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('view') === 'signup') {
      setIsSignUp(true)
    }
  }, [])

  const handleAuth = async (e) => {
    e.preventDefault()
    
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
        
        // Log them in
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        
        if (!signInError) {
          await supabase.from('customers').upsert({ id: data.user.id, remember_me: rememberMe });
          router.push(redirectUrl)
        } else {
          setMessage('Success! Please check your email to verify your account.')
        }
      }
    } else {
      // Logic for standard 
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage("Invalid email or password.")
      } else {
        await supabase.from('customers').upsert({ id: data.user.id, remember_me: rememberMe });
        router.push(redirectUrl) 
      }
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
        
        {/* 🔥 NEW BRANDING: Centered Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <h1 style={{ 
              fontFamily: '"Myriad Pro", "Segoe UI", Roboto, sans-serif', 
              fontSize: '28px', 
              color: '#111', 
              margin: 0, 
              letterSpacing: '-0.5px', 
              display: 'flex', 
              alignItems: 'baseline',
              justifyContent: 'center'
            }}>
              <span style={{ fontWeight: '700' }}>Link</span>
              <span style={{ fontWeight: '400' }}>Supply.</span>
            </h1>
          </Link>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', margin: '0 0 5px 0' }}>
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h2>
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

          {/* LEGAL UI: Terms & Remember Me Blocks */}
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            
            {/* Remember Me Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isSignUp ? '10px' : '0' }}>
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer', minWidth: '16px', minHeight: '16px' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '13px', color: '#4b5563', fontWeight: '500', cursor: 'pointer' }}>
                Keep me signed in
              </label>
            </div>

            {isSignUp ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px' }}>
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
               <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '15px', marginBottom: '0' }}>
                 By logging in, you agree to our <a href="/terms" target="_blank" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Service</a>.
               </p>
            )}
          </div>

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
                setAgreedToTerms(false);
                setRememberMe(false); // Reset on flip
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
