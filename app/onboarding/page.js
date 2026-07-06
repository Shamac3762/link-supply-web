'use client'
import { useState, Suspense } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function OnboardingContent() {
  const [step, setStep] = useState(1)
  const [ig, setIg] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const claimId = searchParams.get('claim')
  const finalDestination = claimId ? `/dashboard?claim=${claimId}` : '/dashboard'

  const saveSocialsAndContinue = async (saveData) => {
    setLoading(true)
    
    if (saveData && (ig || tiktok)) {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const linksToInsert = []
        
        if (ig) {
          const cleanIg = ig.replace('@', '').trim()
          linksToInsert.push({ owner_id: session.user.id, title: 'Instagram', url: `https://instagram.com/${cleanIg}`, sort_order: 0 })
        }
        if (tiktok) {
          const cleanTiktok = tiktok.replace('@', '').trim()
          linksToInsert.push({ owner_id: session.user.id, title: 'TikTok', url: `https://tiktok.com/@${cleanTiktok}`, sort_order: 1 })
        }

        if (linksToInsert.length > 0) {
          await supabase.from('page_links').insert(linksToInsert)
        }
      }
    }

    setLoading(false)
    setStep(2) 
  }

  const handleCheckout = async (interval) => {
    setLoading(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error("No active session found")
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          planType: 'pro',
          interval: interval 
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Stripe Error:", data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error("Checkout request failed:", err);
      setLoading(false);
    }
  }

  const finishFree = () => {
    setLoading(true)
    router.push(finalDestination)
  }

  const inputContainerStyle = { 
    display: 'flex', alignItems: 'center', backgroundColor: '#f9fafb', 
    border: '1px solid #d1d5db', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' 
  }

  const inputStyle = { 
    flex: 1, padding: '14px 14px 14px 5px', border: 'none', backgroundColor: 'transparent', 
    fontSize: '16px', color: '#111', outline: 'none' 
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif', padding: '20px' }}>
      
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: step === 1 ? '420px' : '800px', textAlign: 'center', transition: 'max-width 0.3s ease' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontFamily: '"Myriad Pro", "Segoe UI", Roboto, sans-serif', fontSize: '28px', color: '#111', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
            <span style={{ fontWeight: '700' }}>Link</span><span style={{ fontWeight: '400' }}>Supply.</span>
          </h1>
        </div>

        {step === 1 ? (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Connect your socials</h2>
            <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '15px', lineHeight: '1.5' }}>Add your top platforms now to instantly populate your digital business card.</p>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#4b5563', marginBottom: '6px', fontWeight: '700' }}>Instagram Username</label>
              <div style={inputContainerStyle}>
                <span style={{ padding: '14px 5px 14px 16px', color: '#9ca3af', fontWeight: '600', fontSize: '16px' }}>@</span>
                <input type="text" placeholder="yourbrand" value={ig} onChange={(e) => setIg(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#4b5563', marginBottom: '6px', fontWeight: '700' }}>TikTok Username</label>
              <div style={inputContainerStyle}>
                <span style={{ padding: '14px 5px 14px 16px', color: '#9ca3af', fontWeight: '600', fontSize: '16px' }}>@</span>
                <input type="text" placeholder="yourbrand" value={tiktok} onChange={(e) => setTiktok(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <button disabled={loading} onClick={() => saveSocialsAndContinue(true)} style={{ width: '100%', padding: '16px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', transition: '0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {loading ? 'Securing Vault...' : 'Continue'}
              </button>
              <button disabled={loading} onClick={() => saveSocialsAndContinue(false)} style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#9ca3af', border: 'none', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', transition: 'color 0.2s' }}>
                Skip for now
              </button>
            </div>
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#111', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Upgrade to Pro</h2>
            <p style={{ color: '#6b7280', marginBottom: '40px', fontSize: '16px' }}>Unlock custom themes, analytics, and unlimited links.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '30px 20px', textAlign: 'center', backgroundColor: '#fff' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>Monthly Rolling</h3>
                <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '5px' }}>£4.99<span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>/mo</span></div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Flexible 30-day contract. Cancel anytime.</p>
                <button onClick={() => handleCheckout('month')} style={{ width: '100%', padding: '12px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Select Monthly</button>
              </div>

              <div style={{ border: '2px solid #3b82f6', borderRadius: '16px', padding: '30px 20px', textAlign: 'center', backgroundColor: '#eff6ff', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#3b82f6', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>BEST VALUE</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: '#1e3a8a' }}>Annual Pro</h3>
                <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '5px', color: '#1e3a8a' }}>£3.99<span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '500' }}>/mo</span></div>
                <p style={{ fontSize: '13px', color: '#3b82f6', marginBottom: '20px' }}>Billed as £47.88/year. Save 20%.</p>
                <button onClick={() => handleCheckout('year')} style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>Select Annual</button>
              </div>

            </div>

            <button onClick={finishFree} style={{ background: 'none', border: 'none', color: '#6b7280', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
              No thanks, stay on the Free tier
            </button>
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  )
}

export default function OnboardingFlow() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
