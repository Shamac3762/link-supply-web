'use client'
import { useState } from 'react'

export default function PricingSection({ userId, userTier }) {
  const [pricingMode, setPricingMode] = useState('tags');
  const [tierIndex, setTierIndex] = useState(0);  
  const [teamSize, setTeamSize] = useState(15);   
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- HARDWARE TAGS LOGIC ---
  const assetOptions = [25, 50, 75, 150];
  const currentAssets = assetOptions[tierIndex];
  const businessPrices = {
    25: { mo: '29.99', yr: '240.00' },
    50: { mo: '49.99', yr: '400.00' },
    75: { mo: '69.99', yr: '560.00' },
    150: { mo: '99.99', yr: '800.00' }
  };
  
  const businessMonthlyEquivalent = (Number(businessPrices[currentAssets].yr) / 12).toFixed(2);
  const activeBusinessMonthlyPrice = isAnnual ? businessMonthlyEquivalent : businessPrices[currentAssets].mo;
  const totalBusinessAnnualBilled = businessPrices[currentAssets].yr;

  // --- TEAMS (EMPLOYEES) LOGIC ---
  let baseMonthlyPrice = 7.99;
  if (teamSize >= 50 && teamSize < 100) baseMonthlyPrice = 5.99;
  if (teamSize >= 100 && teamSize < 500) baseMonthlyPrice = 3.99;
  if (teamSize >= 500 && teamSize < 1000) baseMonthlyPrice = 2.49;
  if (teamSize >= 1000) baseMonthlyPrice = 1.49;

  const activePricePerUser = isAnnual ? (baseMonthlyPrice * 0.8).toFixed(2) : baseMonthlyPrice.toFixed(2);
  const totalTeamsMonthly = (teamSize * activePricePerUser).toFixed(2);
  const totalTeamsAnnualBilled = (totalTeamsMonthly * 12).toFixed(2);

  // --- PRO LOGIC ---
  const currentProPrice = isAnnual ? '40.00' : '4.99';
  const priceLabel = isAnnual ? '/yr' : '/mo';

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

  const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' };
  const listItemStyle = { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: '1.4' };
  const checkIcon = <span style={{ color: '#059669', fontWeight: '800', flexShrink: 0, marginTop: '2px' }}>✓</span>;
  const crossIcon = <span style={{ color: '#9ca3af', fontWeight: '800', flexShrink: 0, marginTop: '2px' }}>✕</span>;

  // --- PACKAGED TOGGLES FOR RESPONSIVE PLACEMENT ---
  const billingTogglesNode = (
    <div style={{ width: '100%' }}>
      {/* COMPACT MASTER TOGGLE */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
        <div style={{ backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '30px', display: 'inline-flex', gap: '5px' }}>
          <button 
            onClick={() => setPricingMode('tags')}
            style={{ padding: '8px 20px', borderRadius: '24px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: pricingMode === 'tags' ? 'white' : 'transparent', color: pricingMode === 'tags' ? '#111' : '#6b7280', boxShadow: pricingMode === 'tags' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
          >
            For Venues & Agencies
          </button>
          <button 
            onClick={() => setPricingMode('teams')}
            style={{ padding: '8px 20px', borderRadius: '24px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: pricingMode === 'teams' ? 'white' : 'transparent', color: pricingMode === 'teams' ? '#111' : '#6b7280', boxShadow: pricingMode === 'teams' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
          >
            For Teams & Employees
          </button>
        </div>
      </div>

      {/* DYNAMIC HELPER TEXT - COMPACT */}
      <div style={{ minHeight: '38px', marginBottom: '15px', color: '#4b5563', fontSize: '13px', lineHeight: '1.4', maxWidth: '500px', margin: '0 auto 15px auto', textAlign: 'center' }}>
        {pricingMode === 'tags' ? (
          <span style={{ animation: 'fadeIn 0.3s' }}>
            <strong style={{ color: '#111' }}>Ideal for:</strong> Real Estate, Restaurants, Retail, and Event Spaces.<br/>
            Deploy physical smart tags, manage routing, and track engagement.
          </span>
        ) : (
          <span style={{ animation: 'fadeIn 0.3s' }}>
            <strong style={{ color: '#111' }}>Ideal for:</strong> Sales Fleets (e.g., AA), Corporate Staff, and Enterprise Identity.<br/>
            Standardize digital profiles and secure enterprise data at scale.
          </span>
        )}
      </div>

      {/* ANNUAL VS MONTHLY TOGGLE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '15px' }}>
        <span style={{ fontSize: '14px', fontWeight: isAnnual ? '500' : '700', color: isAnnual ? '#6b7280' : '#111' }}>Month-to-Month</span>
        <button 
          onClick={() => setIsAnnual(!isAnnual)}
          style={{ width: '50px', height: '28px', borderRadius: '20px', backgroundColor: '#111', border: 'none', cursor: 'pointer', position: 'relative', padding: '3px' }}
        >
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: isAnnual ? '25px' : '3px', transition: 'left 0.3s ease' }} />
        </button>
        <span style={{ fontSize: '14px', fontWeight: isAnnual ? '700' : '500', color: isAnnual ? '#111' : '#6b7280' }}>
          Annual Account <span style={{ color: '#059669', fontSize: '11px', fontWeight: '800', backgroundColor: '#d1fae5', padding: '2px 6px', borderRadius: '8px', marginLeft: '4px' }}>SAVE 20%</span>
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.3s ease-in-out', padding: '20px 0' }}>
      <style>{`
        .desktop-toggles { display: block; }
        .mobile-toggles { display: none; }
        @media (max-width: 850px) {
          .desktop-toggles { display: none; }
          .mobile-toggles { display: block; margin-top: 10px; margin-bottom: 20px; border-top: 1px dashed #d1d5db; padding-top: 25px; }
        }
      `}</style>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#111', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Upgrade Your Workspace</h2>
          
          <div className="desktop-toggles">
            {billingTogglesNode}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* CARD 1: BASIC TIER */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 8px 0' }}>Basic</h3>
            <p style={{ color: '#6b7280', margin: '0 0 15px 0', fontSize: '13px', minHeight: '38px' }}>Essential networking for individuals.</p>
            <div style={{ fontSize: '38px', fontWeight: '800', color: '#111', marginBottom: '25px' }}>£0<span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', color: '#4b5563' }}>
              <li style={listItemStyle}>{checkIcon} <span>1 Smart Profile (Link-in-Bio)</span></li>
              <li style={listItemStyle}>{checkIcon} <span>Up to 2 Social/Web Links</span></li>
              <li style={listItemStyle}>{checkIcon} <span>Standard Themes</span></li>
              <li style={{...listItemStyle, color: '#9ca3af', textDecoration: 'line-through'}}>{crossIcon} <span>Custom Theme Branding</span></li>
              <li style={{...listItemStyle, color: '#9ca3af', textDecoration: 'line-through'}}>{crossIcon} <span>Dynamic External Routing</span></li>
            </ul>
            <button disabled style={{ marginTop: 'auto', padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#4b5563', fontWeight: '700', cursor: 'not-allowed', fontSize: '14px' }}>
              Current Plan
            </button>
          </div>

          {/* CARD 2: PRO TIER */}
          <div style={{...cardStyle, border: isAlreadyPro ? '1px solid #e5e7eb' : '2px solid #111', boxShadow: isAlreadyPro ? 'none' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            {!isAlreadyPro && !isAlreadyBusiness && (
              <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#111', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Most Popular</div>
            )}
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 8px 0' }}>Pro</h3>
            <p style={{ color: '#6b7280', margin: '0 0 15px 0', fontSize: '13px', minHeight: '38px' }}>Powerful tools for solo professionals.</p>
            
            {/* NEW INLINE PRO TOGGLE */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '38px', fontWeight: '800', color: isAnnual ? '#059669' : '#111', transition: 'color 0.3s ease', lineHeight: '1' }}>
                £{currentProPrice}<span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>{priceLabel}</span>
              </div>
              
              <div style={{ backgroundColor: '#f3f4f6', padding: '3px', borderRadius: '20px', display: 'flex', alignItems: 'center' }}>
                <button onClick={() => setIsAnnual(false)} style={{ padding: '4px 10px', borderRadius: '16px', border: 'none', fontSize: '11px', fontWeight: '700', backgroundColor: !isAnnual ? 'white' : 'transparent', color: !isAnnual ? '#111' : '#6b7280', boxShadow: !isAnnual ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Monthly</button>
                <button onClick={() => setIsAnnual(true)} style={{ padding: '4px 10px', borderRadius: '16px', border: 'none', fontSize: '11px', fontWeight: '700', backgroundColor: isAnnual ? '#d1fae5' : 'transparent', color: isAnnual ? '#065f46' : '#6b7280', boxShadow: isAnnual ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Yearly</button>
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', color: '#4b5563' }}>
              <li style={listItemStyle}>{checkIcon} <span><strong>Up to 5 Connected Tags/QRs</strong></span></li>
              <li style={listItemStyle}>{checkIcon} <span>Fully Custom Smart Profile</span></li>
              <li style={listItemStyle}>{checkIcon} <span>Lead Generation (Save Contact)</span></li>
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

          {/* CARD 3 WRAPPER: DYNAMIC B2B/ASSET TIER */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            <div className="mobile-toggles">
              {billingTogglesNode}
            </div>

            {pricingMode === 'tags' ? (
              <div style={{...cardStyle, backgroundColor: '#f0fdf4', border: '1px solid #86efac', animation: 'fadeIn 0.3s', flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#065f46', margin: '0 0 8px 0' }}>Business Workspace</h3>
                <p style={{ color: '#047857', margin: '0 0 15px 0', fontSize: '13px', minHeight: '38px' }}>Manage physical assets at scale.</p>
                
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Hardware Slots:</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#111' }}>{currentAssets} Tags & QRs</span>
                  </div>
                  <input 
                    type="range" min="0" max="3" step="1" 
                    value={tierIndex} onChange={(e) => setTierIndex(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#10b981' }} 
                  />
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <div style={{ fontSize: '38px', fontWeight: '800', color: '#065f46' }}>£{activeBusinessMonthlyPrice}<span style={{ fontSize: '14px', color: '#047857', fontWeight: '500' }}>/mo</span></div>
                  {isAnnual && <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', fontWeight: '600' }}>Billed annually at £{totalBusinessAnnualBilled}</div>}
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', color: '#047857' }}>
                  <li style={listItemStyle}>{checkIcon} <span><strong>Up to {currentAssets} Connected Assets</strong></span></li>
                  <li style={listItemStyle}>{checkIcon} <span>Centralized Manager Dashboard</span></li>
                  <li style={listItemStyle}>{checkIcon} <span>Bulk Link Management</span></li>
                  <li style={listItemStyle}>{checkIcon} <strong>Plus all Pro features</strong></li>
                </ul>
                <button 
                  onClick={() => handleUpgrade(`business_${currentAssets}`)}
                  disabled={isLoading || (isAlreadyBusiness && currentAssets === 25)}
                  style={{ marginTop: 'auto', padding: '12px', width: '100%', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: '700', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}
                >
                  {isLoading ? 'Loading...' : `Upgrade to Business`}
                </button>
              </div>
            ) : (
              <div style={{...cardStyle, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', animation: 'fadeIn 0.3s', flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a8a', margin: '0 0 8px 0' }}>Enterprise Teams</h3>
                <p style={{ color: '#1d4ed8', margin: '0 0 15px 0', fontSize: '13px', minHeight: '38px' }}>Seamless networking for corporate staff.</p>
                
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #dbeafe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Team Size:</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#111' }}>{teamSize} Employees</span>
                  </div>
                  <input 
                    type="range" min="1" max="1500" step="1" 
                    value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#3b82f6' }} 
                  />
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <div style={{ fontSize: '38px', fontWeight: '800', color: '#1e3a8a' }}>£{totalTeamsMonthly}<span style={{ fontSize: '14px', color: '#1d4ed8', fontWeight: '500' }}>/mo</span></div>
                  {isAnnual && <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', fontWeight: '600' }}>Billed annually at £{totalTeamsAnnualBilled}</div>}
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', color: '#1d4ed8' }}>
                  <li style={listItemStyle}>{checkIcon} <span><strong>Up to 3 Connected Tags per Employee</strong></span></li>
                  <li style={listItemStyle}>{checkIcon} <span>Centralized HR Manager Dashboard</span></li>
                  <li style={listItemStyle}>{checkIcon} <span>Instant Hardware Reassignment</span></li>
                  <li style={listItemStyle}>{checkIcon} <strong>Enterprise-Grade Security</strong></li>
                </ul>
                <button 
                  onClick={() => window.location.href = 'mailto:support@linksupply.co.uk?subject=Enterprise Pricing Inquiry'}
                  style={{ marginTop: 'auto', padding: '12px', width: '100%', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' }}
                >
                  Contact Sales
                </button>
              </div>
            )}
          </div>

        </div>
        
        {/* HARDWARE CROSS-SELL BANNER */}
        <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>
            <span style={{ fontSize: '16px', marginRight: '5px' }}>📦</span> 
            <strong>Note:</strong> Physical NFC cards and hardware are purchased separately. 
            <a href="/products" style={{ display: 'inline-block', color: '#4f46e5', fontWeight: '700', textDecoration: 'none', marginLeft: '8px', padding: '6px 12px', backgroundColor: '#e0e7ff', borderRadius: '8px', transition: 'background-color 0.2s' }}>
              Shop Hardware Store ↗
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}
