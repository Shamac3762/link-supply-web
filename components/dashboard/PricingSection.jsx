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

  const cardStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' };
  const checkStyle = { color: '#059669', fontWeight: 'bold', marginRight: '10px' };

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Upgrade Your Workspace</h2>
          <p style={{ fontSize: '16px', color: '#4b5563', maxWidth: '600px', margin: '0 auto 20px auto' }}>Choose the perfect plan to grow your network, or scale up to manage an entire global team.</p>
          <div style={{ display: 'inline-block', backgroundColor: '#fef3c7', color: '#b45309', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', border: '1px solid #fde68a' }}>
            ⚠️ Hardware (NFC Cards, Keyrings, Stickers) is charged separately at a one-off fee.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
          
          {/* B2C: FREE TIER */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 10px 0' }}>Basic</h3>
            <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: '14px', minHeight: '40px' }}>Essential networking for individuals.</p>
            <div style={{ fontSize: '42px', fontWeight: '800', color: '#111', marginBottom: '30px' }}>£0<span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#4b5563', fontSize: '14px' }}>
              <li><span style={checkStyle}>✓</span> 1 Digital Business Card</li>
              <li><span style={checkStyle}>✓</span> Up to 2 Social/Web Links</li>
              <li><span style={checkStyle}>✓</span> Standard Dark & Light Themes</li>
              <li><span style={checkStyle}>✓</span> 24-Hour Tap Analytics</li>
            </ul>
            <button style={{ marginTop: 'auto', padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#4b5563', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Current Plan</button>
          </div>

          {/* B2C: PRO TIER */}
          <div style={{...cardStyle, border: '2px solid #111', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#111', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Most Popular</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 10px 0' }}>Pro</h3>
            <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: '14px', minHeight: '40px' }}>Powerful tools for creators and founders.</p>
            <div style={{ fontSize: '42px', fontWeight: '800', color: '#111', marginBottom: '30px' }}>£4.99<span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#4b5563', fontSize: '14px' }}>
              <li><span style={checkStyle}>✓</span> Unlimited Links & Destinations</li>
              <li><span style={checkStyle}>✓</span> Fully Custom Theme Branding</li>
              <li><span style={checkStyle}>✓</span> Lead Generation (Save Contact)</li>
              <li><span style={checkStyle}>✓</span> Advanced Engagement Insights</li>
            </ul>
            <button style={{ marginTop: 'auto', padding: '12px', width: '100%', borderRadius: '10px', border: 'none', backgroundColor: '#4f46e5', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'} onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}>Upgrade to Pro</button>
          </div>

          {/* B2B: TEAMS TIER (Interactive) */}
          <div style={{...cardStyle, backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#065f46', margin: '0 0 10px 0' }}>Teams (B2B)</h3>
            <p style={{ color: '#047857', margin: '0 0 20px 0', fontSize: '14px', minHeight: '40px' }}>Seamless networking for entire organizations.</p>
            
            {/* Interactive Slider */}
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>Team Size:</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#111' }}>{teamSize} Employees</span>
              </div>
              <input 
                type="range" min="1" max="1500" step="1" 
                value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#10b981' }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>Price per user:</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>£{pricePerUser}</span>
              </div>
            </div>

            <div style={{ fontSize: '42px', fontWeight: '800', color: '#065f46', marginBottom: '30px' }}>£{totalMonthly}<span style={{ fontSize: '14px', color: '#047857', fontWeight: '500' }}>/mo</span></div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#047857', fontSize: '14px' }}>
              <li><span style={checkStyle}>✓</span> Centralized Manager Dashboard</li>
              <li><span style={checkStyle}>✓</span> Instant Hardware Reassignment</li>
              <li><span style={checkStyle}>✓</span> Enterprise-Grade GDPR Security</li>
              <li><span style={checkStyle}>✓</span> <strong>Plus all Pro features per employee</strong></li>
            </ul>
            <button style={{ marginTop: 'auto', padding: '12px', width: '100%', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.target.style.backgroundColor = '#059669'} onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}>Contact Sales</button>
          </div>

        </div>
      </div>
    </div>
  )
}
