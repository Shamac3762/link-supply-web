'use client'
import { useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function PremiumLoginPage() {
  const [isSignUp, setIsSignUp] = useState(false) // Toggles between Login and Register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      // REGISTRATION LOGIC
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { first_name: firstName, last_name: lastName } // Sends name to your new CRM
        }
      })
      if (error) setMessage(error.message)
      else setMessage('Success! Welcome to Link Supply. You can now log in.')
    } else {
      // LOGIN LOGIC
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage("Invalid email or password.")
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  // Modern UI Styles
  const inputStyle = {
    padding: '14px', borderRadius: '8px', border: '1px solid #ddd', 
    width: '100%', marginBottom: '15px', fontSize: '16px', color: '#333',
    backgroundColor: '#f9f9f9'
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' }}>
      
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111', marginBottom: '5px' }}>
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h1>
        <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
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
          <input required type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

          <button disabled={loading} type="submit" style={{ 
            width: '100%', padding: '14px', backgroundColor: '#111', color: 'white', 
            border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', 
            cursor: 'pointer', transition: '0.2s', marginTop: '10px' 
          }}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <p style={{ color: '#ff4d4d', marginTop: '15px', fontSize: '14px' }}>{message}</p>

        <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }} 
              style={{ background: 'none', border: 'none', color: '#0070f3', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px' }}
            >
              {isSignUp ? 'Log in here' : 'Sign up here'}
            </button>
          </p>
        </div>
      </div>

    </div>
  )
}
