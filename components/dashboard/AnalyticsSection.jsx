'use client'
import React, { useState } from 'react'

export default function AnalyticsSection({
  stickers,
  isPremium,
  pageProfile,
  hasRealData,
  displayChartData,
  isMounted
}) {
  // Local state to handle simple tooltips on our native chart
  const [hoveredDay, setHoveredDay] = useState(null);

  // Calculate the highest tap day so we can scale the chart bars dynamically
  const maxTaps = Math.max(...displayChartData.map(d => d.taps), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%', animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        
        {/* TOTAL TAPS */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Total Hardware Taps</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: 0 }}>
            {stickers.reduce((acc, s) => acc + (s.tap_count || 0), 0)}
          </p>
        </div>
        
        {/* PROFILE VIEWS */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
            <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Digital Profile Views</p>
            {!isPremium && <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>}
          </div>
          
          {isPremium ? (
            <p style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: 0 }}>
              {pageProfile.profile_views || 0}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '38px' }}>
               <p style={{ fontSize: '32px', fontWeight: '800', color: '#d1d5db', margin: 0, filter: 'blur(6px)', opacity: 0.5, userSelect: 'none' }}>
                 {pageProfile.profile_views || 342}
               </p>
               <button onClick={() => alert("Stripe checkout coming soon!")} style={{ position: 'absolute', padding: '8px 16px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                 🔒 Unlock to View
               </button>
            </div>
          )}
        </div>

        {/* BEST PERFORMING */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Best Performing Tag</p>
          <p style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: 0 }}>
            {stickers.length > 0 ? [...stickers].sort((a,b) => (b.tap_count || 0) - (a.tap_count || 0))[0]?.id || 'N/A' : 'N/A'}
          </p>
        </div>
      </div>

      {isPremium ? (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: 0 }}>Tap Activity</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>Daily performance over the last 7 days</p>
            </div>
            {hasRealData ? (
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#3b82f6', backgroundColor: '#eff6ff', padding: '6px 12px', borderRadius: '100px', letterSpacing: '1px' }}>LIVE DATA</span>
            ) : (
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', backgroundColor: '#fef3c7', padding: '6px 12px', borderRadius: '100px', letterSpacing: '1px' }}>DEMO DATA</span>
            )}
          </div>

          {/* --- NATIVE ZERO-DEPENDENCY CHART --- */}
          {isMounted && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '250px', paddingBottom: '20px', borderBottom: '1px dashed #e5e7eb', position: 'relative' }}>
              {displayChartData.map((day, index) => {
                // Calculate height percentage relative to the max taps (cap at 100%)
                const heightPercent = maxTaps === 0 ? 0 : Math.max((day.taps / maxTaps) * 100, 2); 
                const isHovered = hoveredDay === index;

                return (
                  <div 
                    key={index} 
                    onMouseEnter={() => setHoveredDay(index)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', position: 'relative', cursor: 'pointer' }}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div style={{ position: 'absolute', top: '-35px', backgroundColor: '#111', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', zIndex: 10, whiteSpace: 'nowrap', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', animation: 'fadeIn 0.2s' }}>
                        {day.taps} Taps
                      </div>
                    )}

                    {/* Chart Bar */}
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 10%' }}>
                      <div style={{ 
                        width: '100%', 
                        maxWidth: '40px', 
                        height: `${heightPercent}%`, 
                        backgroundColor: isHovered ? '#2563eb' : '#3b82f6', 
                        borderRadius: '6px 6px 0 0', 
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: hasRealData ? 1 : 0.6
                      }} />
                    </div>

                    {/* X-Axis Label */}
                    <div style={{ position: 'absolute', bottom: '-25px', fontSize: '12px', fontWeight: '600', color: isHovered ? '#111' : '#9ca3af', transition: 'color 0.2s' }}>
                      {day.name}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb', width: '100%' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📈</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111', marginBottom: '10px' }}>Advanced Analytics</h2>
          <p style={{ color: '#6b7280', fontSize: '16px', maxWidth: '400px', margin: '0 auto 30px auto' }}>
            Track your profile visits, link clicks, and view daily performance charts over time.
          </p>
          <div style={{ display: 'inline-block', backgroundColor: '#fef9c3', color: '#854d0e', padding: '6px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', marginBottom: '20px' }}>
            PREMIUM FEATURE
          </div>
          <button onClick={() => alert("Stripe checkout coming soon!")} style={{ display: 'block', margin: '0 auto', padding: '14px 24px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
            Upgrade to Unlock Charts
          </button>
        </div>
      )}
    </div>
  )
}
