'use client'
import { useState } from 'react'

export default function PricingSection() {
  const [teamSize, setTeamSize] = useState(15);

  // Dynamic B2B Pricing Logic
  let pricePerUser = 7.99;
  if (teamSize >= 50 && teamSize < 100) pricePerUser = 5.99;
  if (teamSize >= 100 && teamSize < 500) pricePerUser = 3.99;
  if (teamSize >= 500 && teamSize < 1000) pricePerUser = 2.49;
  if (teamSize >= 1000) pricePerUser = 1.49;

  const totalMonthly = (teamSize * pricePerUser).toFixed(2);

  const cardStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'relative' };
  const checkStyle = { color: '#059669', fontWeight: 'bold', marginRight: '10px' };

  return (
    <section style={{ padding: '80px 20px', backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '42px', fontWeight: '800', color: '#111', margin: '0 0 15px 0', letterSpacing: '-1px' }}>Simple, transparent pricing.</h2>
          <p style={{ fontSize: '18px', color: '#4b5563', maxWidth: '600px', margin: '0 auto 20px auto' }}>Choose the perfect plan for yourself or scale up to manage your entire global team.</p>
          <div style={{ display: 'inline-block', backgroundColor: '#fef3c7', color: '#b45309', padding: '10px 20px', borderRadius: '30px', fontSize: '14px', fontWeight: '700', border: '1px solid #fde68a' }}>
            ⚠️ Disclaimer: Physical hardware (NFC Cards, Keyrings, Stickers) is charged separately at a one-off fee.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          
          {/* B2C: FREE TIER */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 10px 0' }}>Basic</h3>
            <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: '14px', minHeight: '40px' }}>For individuals starting out.</p>
            <div style={{ fontSize: '48px', fontWeight: '800', color: '#111', marginBottom: '30px' }}>£0<span style={{ fontSize: '16px', color: '#6b7280', fontWeight: '500' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#4b5563', fontSize: '15px' }}>
              <li><span style={checkStyle}>✓</span> 1 Digital Profile (/u/username)</li>
              <li><span style={checkStyle}>✓</span> Up to 2 Social/Web Links</li>
              <li><span style={checkStyle}>✓</span> Standard Dark/Light Theme</li>
              <li><span style={checkStyle}>✓</span> 7-Day Tap Analytics</li>
            </ul>
            <button style={{ marginTop: 'auto', padding: '14px', width: '100%', borderRadius: '12px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#111', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}>Get Started Free</button>
          </div>

          {/* B2C: PRO TIER */}
          <div style={{...cardStyle, border: '2px solid #111', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#111', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Most Popular</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 10px 0' }}>Pro</h3>
            <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: '14px', minHeight: '40px' }}>For creators and solo entrepreneurs.</p>
            <div style={{ fontSize: '48px', fontWeight: '800', color: '#111', marginBottom: '30px' }}>£4.99<span style={{ fontSize: '16px', color: '#6b7280', fontWeight: '500' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#4b5563', fontSize: '15px' }}>
              <li><span style={checkStyle}>✓</span> Unlimited Links</li>
              <li><span style={checkStyle}>✓</span> Custom Theme Colors & Branding</li>
              <li><span style={checkStyle}>✓</span> Lead Capture (Save Contact)</li>
              <li><span style={checkStyle}>✓</span> Advanced Lifetime Analytics</li>
            </ul>
            <button style={{ marginTop: 'auto', padding: '14px', width: '100%', borderRadius: '12px', border: 'none', backgroundColor: '#111', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}>Upgrade to Pro</button>
          </div>

          {/* B2B: TEAMS TIER (Interactive) */}
          <div style={{...cardStyle, backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#065f46', margin: '0 0 10px 0' }}>Teams (B2B)</h3>
            <p style={{ color: '#047857', margin: '0 0 20px 0', fontSize: '14px', minHeight: '40px' }}>For businesses scaling their networking.</p>
            
            {/* Interactive Slider */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563' }}>Team Size:</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#111' }}>{teamSize} Employees</span>
              </div>
              <input 
                type="range" min="1" max="1500" step="1" 
                value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#10b981' }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Price per user:</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>£{pricePerUser}</span>
              </div>
            </div>

            <div style={{ fontSize: '48px', fontWeight: '800', color: '#065f46', marginBottom: '30px' }}>£{totalMonthly}<span style={{ fontSize: '16px', color: '#047857', fontWeight: '500' }}>/mo</span></div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#047857', fontSize: '15px' }}>
              <li><span style={checkStyle}>✓</span> <strong>Enterprise Manager Dashboard</strong></li>
              <li><span style={checkStyle}>✓</span> Instant Employee Onboarding</li>
              <li><span style={checkStyle}>✓</span> Hardware Tag Reassignment</li>
              <li><span style={checkStyle}>✓</span> GDPR Data Privacy Controls</li>
            </ul>
            <button style={{ marginTop: 'auto', padding: '14px', width: '100%', borderRadius: '12px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>Contact Sales</button>
          </div>

        </div>
      </div>
    </section>
  )
}
