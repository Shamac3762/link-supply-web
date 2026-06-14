'use client'
import { useState } from 'react'

export default function PricingSection({ userId, userTier }) {
  // 0 = 25 Tags, 1 = 50 Tags, 2 = 75 Tags, 3 = 150 Tags
  const [tierIndex, setTierIndex] = useState(0); 
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Asset Mapping Logic
  const assetOptions = [25, 50, 75, 150];
  const currentAssets = assetOptions[tierIndex];

  const businessPrices = {
    25: { mo: '29.99', yr: '240.00' },
    50: { mo: '49.99', yr: '400.00' },
    75: { mo: '69.99', yr: '560.00' },
    150: { mo: '99.99', yr: '800.00' }
  };

  const currentBusinessPrice = isAnnual ? businessPrices[currentAssets].yr : businessPrices[currentAssets].mo;
  const currentProPrice = isAnnual ? '40.00' : '4.99';
  const priceLabel = isAnnual ? '/yr' : '/mo';

  // Prevent duplicate purchases
  const isAlreadyPro = userTier === 'pro';
  const isAlreadyBusiness = userTier === 'business';

  const handleUpgrade = async (planType) => {
    if (!userId) {
      alert("Please wait for your session to load or log in again.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          planType: planType,
          interval: isAnnual ? 'year' : 'month'
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url; 
      } else {
        alert("Checkout Error: " + (data.error || "Unknown error"));
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to initiate secure checkout connection.");
      setIsLoading(false);
    }
  };

  const cardStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' };
  const listItemStyle = { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: '1.4' };
  const checkIcon = <span style={{ color: '#059669', fontWeight: '800', flexShrink: 0, marginTop: '2px' }}>✓</span>;
  const crossIcon = <span style={{ color: '#9ca3af', fontWeight: '800', flexShrink: 0, marginTop: '2px' }}>✕</span>;

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Upgrade Your Workspace</h2>
          <p style={{ fontSize: '16px', color: '#4b5563', maxWidth: '600px', margin: '0 auto 20px auto' }}>Choose the perfect plan to grow your network, or scale up to manage physical assets globally.</p>
          
          {/* ANNUAL VS MONTHLY TOGGLE */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginTop: '20px', marginBottom: '20px' }}>
            <span style={{ fontSize: '15px', fontWeight: isAnnual ? '500' : '700', color: isAnnual ? '#6b7280' : '#111' }}>Month-to-Month Rolling</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              style={{ width: '60px', height: '32px', borderRadius: '20px', backgroundColor: '#111', border: 'none', cursor: 'pointer', position: 'relative', padding: '4px' }}
            >
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '4px', left: isAnnual ? '32px' : '4px', transition: 'left 0.3s ease' }} />
            </button>
            <span style={{ fontSize: '15px', fontWeight: isAnnual ? '700' : '500', color: isAnnual ? '#111' : '#6b7280' }}>
              12-Month Annual Account <span style={{ color: '#059669', fontSize: '12px', fontWeight: '700', backgroundColor: '#d1fae5', padding: '2px 8px', borderRadius: '10px', marginLeft: '5px' }}>Save Big</span>
            </span>
          </div>

          <div style={{ display: 'inline-block', backgroundColor: '#fef3c7', color: '#b45309', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', border: '1px solid #fde68a' }}>
            ⚠️ Hardware (NFC Cards, Keyrings, Signs) is charged separately at a one-off fee.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
          
          {/* BASIC TIER */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 10px 0' }}>Basic</h3>
            <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: '14px', minHeight: '40px' }}>Essential networking for individuals.</p>
            <div style={{ fontSize: '42px', fontWeight: '800', color: '#111', marginBottom: '30px' }}>£0<span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#4b5563' }}>
              <li style={listItemStyle}>{checkIcon} <span>1 Digital Business Card</span></li>
              <li style={listItemStyle}>{checkIcon} <span>Up to 2 Social/Web Links</span></li>
              <li style={listItemStyle}>{checkIcon} <span>Standard Dark & Light Themes</span></li>
              <li style={listItemStyle}>{checkIcon} <span>24-Hour Tap Analytics</span></li>
              <li style={{...listItemStyle, color: '#9ca3af', textDecoration: 'line-through'}}>{crossIcon} <span>Custom Theme Branding</span></li>
              <li style={{...listItemStyle, color: '#9ca3af', textDecoration: 'line-through'}}>{crossIcon} <span>Lead Generation (Save Contact)</span></li>
              <li style={{...listItemStyle, color: '#9ca3af', textDecoration: 'line-through'}}>{crossIcon} <span>Dynamic External Routing</span></li>
            </ul>
            <button disabled style={{ marginTop: 'auto', padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#4b5563', fontWeight: '700', cursor: 'not-allowed', fontSize: '14px' }}>
              Current Plan
            </button>
          </div>

          {/* PRO TIER */}
          <div style={{...cardStyle, border: isAlreadyPro ? '1px solid #e5e7eb' : '2px solid #111', boxShadow: isAlreadyPro ? 'none' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            {!isAlreadyPro && !isAlreadyBusiness && (
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#111', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Most Popular</div>
            )}
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 10px 0' }}>Pro</h3>
            <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: '14px', minHeight: '40px' }}>Powerful tools for creators and solo brokers.</p>
            <div style={{ fontSize: '42px', fontWeight: '800', color: '#111', marginBottom: '30px' }}>£{currentProPrice}<span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>{priceLabel}</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#4b5563' }}>
              <li style={listItemStyle}>{checkIcon} <span><strong>Up to 5 Connected Tags/QRs</strong></span></li>
              <li style={listItemStyle}>{checkIcon} <span>Unlimited Links & Destinations</span></li>
              <li style={listItemStyle}>{checkIcon} <span>Fully Custom Theme Branding</span></li>
              <li style={listItemStyle}>{checkIcon} <span>Lead Generation (Save Contact)</span></li>
              <li style={listItemStyle}>{checkIcon} <span>Advanced Lifetime Analytics</span></li>
              <li style={listItemStyle}>{checkIcon} <span>Remove "Link Supply" Branding</span></li>
            </ul>
            <button 
              onClick={() => handleUpgrade('pro')}
              disabled={isLoading || isAlreadyPro || isAlreadyBusiness}
              style={{ marginTop: 'auto', padding: '12px', width: '100%', borderRadius: '10px', border: 'none', backgroundColor: isAlreadyPro ? '#10b981' : (isAlreadyBusiness ? '#e5e7eb' : '#4f46e5'), color: (isAlreadyBusiness && !isAlreadyPro) ? '#9ca3af' : 'white', fontWeight: '700', cursor: (isLoading || isAlreadyPro || isAlreadyBusiness) ? 'not-allowed' : 'pointer', fontSize: '14px', transition: 'all 0.2s' }} 
            >
              {isAlreadyPro ? '✓ Current Plan' : (isLoading ? 'Loading...' : 'Upgrade to Pro')}
            </button>
          </div>

          {/* BUSINESS TIER (Interactive) */}
          <div style={{...cardStyle, backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#065f46', margin: '0 0 10px 0' }}>Business Workspace</h3>
            <p style={{ color: '#047857', margin: '0 0 20px 0', fontSize: '14px', minHeight: '40px' }}>Complete dashboard to manage physical assets.</p>
            
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>Hardware Slots:</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#111' }}>{currentAssets} Tags/QRs</span>
              </div>
              
              {/* SLIDER 0 to 3 mapped to index */}
              <input 
                type="range" min="0" max="3" step="1" 
                value={tierIndex} onChange={(e) => setTierIndex(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#10b981' }} 
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>25</span>
                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>50</span>
                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>75</span>
                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>150</span>
              </div>
            </div>

            <div style={{ fontSize: '42px', fontWeight: '800', color: '#065f46', marginBottom: '30px' }}>£{currentBusinessPrice}<span style={{ fontSize: '14px', color: '#047857', fontWeight: '500' }}>{priceLabel}</span></div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#047857' }}>
              <li style={listItemStyle}>{checkIcon} <span><strong>Up to {currentAssets} Connected Assets</strong></span></li>
              <li style={listItemStyle}>{checkIcon} <span>Centralized Manager Dashboard</span></li>
              <li style={listItemStyle}>{checkIcon} <span>Bulk Link Management</span></li>
              <li style={listItemStyle}>{checkIcon} <span>View Real-Time Scan Analytics</span></li>
              <li style={listItemStyle}>{checkIcon} <span>Enterprise-Grade Security</span></li>
              <li style={listItemStyle}>{checkIcon} <strong>Plus all Pro features</strong></li>
            </ul>
            <button 
              onClick={() => handleUpgrade(`business_${currentAssets}`)}
              disabled={isLoading || (isAlreadyBusiness && currentAssets === 25)} /* Basic lock logic if they are already on this tier */
              style={{ marginTop: 'auto', padding: '12px', width: '100%', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: '700', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}
            >
              {isLoading ? 'Loading...' : `Upgrade to Business`}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
