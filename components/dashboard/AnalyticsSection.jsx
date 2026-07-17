'use client'
import React, { useState } from 'react'

export default function AnalyticsSection({
  stickers = [],
  isPremium,
  pageProfile = {},
  displayChartData = [],
  isMounted,
  timeRange = '7d', 
  setTimeRange = () => {},
  onUpgradeClick = () => {}
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const totalHardwareTaps = stickers.reduce((acc, s) => acc + (s.tap_count || 0), 0);
  const chartTotalTaps = (displayChartData || []).reduce((acc, d) => acc + (d.taps || 0), 0);
  const hasChartData = chartTotalTaps > 0;
  const maxTaps = hasChartData ? Math.max(...displayChartData.map(d => d.taps)) : 1;
  const dataCount = displayChartData?.length || 7;
  const barMaxWidth = dataCount > 10 ? '12px' : '40px';
  const showAllLabels = dataCount <= 7;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%', animation: 'fadeIn 0.3s ease-in-out' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>Total Hardware Scans</p>
          <p style={{ fontSize: '36px', fontWeight: '800', color: '#111', margin: 0, letterSpacing: '-1px' }}>
            {totalHardwareTaps.toLocaleString()}
          </p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
            <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Digital Profile Views</p>
            {!isPremium && <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '12px' }}>PRO</span>}
          </div>
          
          {isPremium ? (
            <p style={{ fontSize: '36px', fontWeight: '800', color: '#111', margin: 0, letterSpacing: '-1px' }}>
              {(pageProfile.profile_views || 0).toLocaleString()}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '42px' }}>
               <p style={{ fontSize: '36px', fontWeight: '800', color: '#d1d5db', margin: 0, filter: 'blur(5px)', opacity: 0.6, userSelect: 'none' }}>
                 1,204
               </p>
               <button onClick={onUpgradeClick} style={{ position: 'absolute', padding: '8px 18px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                 🔒 Unlock Views
               </button>
            </div>
          )}
        </div>

        {/* BEST PERFORMING */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>Top Performing Tag</p>
          <div style={{ margin: '8px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stickers.length > 0 ? (() => {
              const topSticker = [...stickers].sort((a,b) => (b.tap_count || 0) - (a.tap_count || 0))[0];
              return (
                <>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: '#111' }}>
                    {topSticker.id}
                  </span>
                  {topSticker.tag_name && topSticker.tag_name !== topSticker.id && (
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#6b7280', marginLeft: '6px' }}>
                      ({topSticker.tag_name})
                    </span>
                  )}
                </>
              );
            })() : (
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#111' }}>None Active</span>
            )}
          </div>
        </div>
      </div>

      {isPremium ? (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: 0, letterSpacing: '-0.5px' }}>Engagement Activity</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0', fontWeight: '500' }}>Physical hardware scans over time</p>
            </div>
            <div style={{ backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
              {['7d', '30d', '6m'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    padding: '6px 16px', borderRadius: '6px', border: 'none', fontSize: '13px',
                    fontWeight: timeRange === range ? '700' : '600',
                    backgroundColor: timeRange === range ? 'white' : 'transparent',
                    color: timeRange === range ? '#111' : '#6b7280',
                    boxShadow: timeRange === range ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase'
                  }}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '6 Months'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: '280px', position: 'relative' }}>
            {!hasChartData ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e5e7eb', borderRadius: '12px', backgroundColor: '#f9fafb' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.5 }}>📊</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#374151', margin: '0 0 5px 0' }}>Awaiting Data</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, maxWidth: '300px', textAlign: 'center' }}>
                  Your chart will appear here as soon as your hardware receives its first scan.
                </p>
              </div>
            ) : (
              isMounted && (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '240px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0, pointerEvents: 'none' }}>
                    <div style={{ borderTop: '1px dashed #f3f4f6', width: '100%' }}></div>
                    <div style={{ borderTop: '1px dashed #f3f4f6', width: '100%' }}></div>
                    <div style={{ borderTop: '1px dashed #f3f4f6', width: '100%' }}></div>
                  </div>

                  {displayChartData.map((dataPoint, index) => {
                    const heightPercent = maxTaps === 0 ? 0 : Math.max((dataPoint.taps / maxTaps) * 100, 2); 
                    const isHovered = hoveredDay === index;

                    return (
                      <div 
                        key={index} 
                        onMouseEnter={() => setHoveredDay(index)}
                        onMouseLeave={() => setHoveredDay(null)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', position: 'relative', cursor: 'pointer', zIndex: 10 }}
                      >
                        {isHovered && (
                          <div style={{ position: 'absolute', top: '-55px', backgroundColor: '#111', color: 'white', padding: '8px 12px', borderRadius: '8px', zIndex: 20, whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', animation: 'fadeIn 0.15s', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700' }}>{dataPoint.taps} Total Scans</div>
                            {(dataPoint.nfc !== undefined || dataPoint.qr !== undefined) && (
                              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: '600' }}>
                                {dataPoint.nfc !== undefined && <span style={{ color: '#60a5fa' }}>📱 {dataPoint.nfc} NFC</span>}
                                {dataPoint.qr !== undefined && <span style={{ color: '#a78bfa' }}>📷 {dataPoint.qr} QR</span>}
                              </div>
                            )}
                            <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>{dataPoint.fullDate || dataPoint.name}</div>
                          </div>
                        )}
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                          <div style={{ width: '100%', maxWidth: barMaxWidth, height: `${heightPercent}%`, backgroundColor: isHovered ? '#2563eb' : '#3b82f6', borderRadius: '4px 4px 0 0', transition: 'all 0.2s ease-out' }} />
                        </div>
                        <div style={{ position: 'absolute', bottom: '-25px', fontSize: '11px', fontWeight: '600', color: isHovered ? '#111' : '#9ca3af', transition: 'color 0.2s', opacity: (showAllLabels || index % Math.ceil(dataCount / 6) === 0 || isHovered) ? 1 : 0 }}>
                          {dataPoint.name}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb', width: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📈</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Advanced Analytics</h2>
          <p style={{ color: '#6b7280', fontSize: '16px', maxWidth: '400px', margin: '0 auto 30px auto', lineHeight: '1.5' }}>
            Track your profile visits, hardware scans, and view daily performance charts over time.
          </p>
          <div style={{ display: 'inline-block', backgroundColor: '#fef9c3', color: '#854d0e', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', marginBottom: '25px', letterSpacing: '0.5px' }}>
            PREMIUM FEATURE
          </div>
          <button onClick={onUpgradeClick} style={{ display: 'block', margin: '0 auto', padding: '14px 28px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            Upgrade to Unlock Charts
          </button>
        </div>
      )}
    </div>
  )
}
