'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AnalyticsSection({
  stickers,
  isPremium,
  pageProfile,
  hasRealData,
  displayChartData,
  isMounted
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Total Hardware Taps</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: 0 }}>
            {stickers.reduce((acc, s) => acc + (s.tap_count || 0), 0)}
          </p>
        </div>
        
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
               <button onClick={() => alert("Stripe checkout coming soon!")} style={{ position: 'absolute', padding: '8px 16px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                 🔒 Unlock to View
               </button>
            </div>
          )}
        </div>

        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Best Performing Tag</p>
          <p style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: 0 }}>
            {stickers.length > 0 ? [...stickers].sort((a,b) => (b.tap_count || 0) - (a.tap_count || 0))[0]?.id || 'N/A' : 'N/A'}
          </p>
        </div>
      </div>

      {isPremium ? (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', width: '100%', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
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

          <div style={{ width: '100%', height: '300px', minHeight: '300px', position: 'relative' }}>
            {isMounted && (
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={displayChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTaps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: '600'}} dy={10} />
                  <YAxis hide={true} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: '700' }} cursor={{ stroke: '#3b82f6', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="taps" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTaps)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
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
