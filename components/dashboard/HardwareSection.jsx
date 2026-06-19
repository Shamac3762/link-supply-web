'use client'

export default function HardwareSection({
  claimId,
  setClaimId,
  claimPin,
  setClaimPin,
  handleActivateTag,
  claimMessage,
  stickers,
  setStickers,
  isPremium,
  pageProfile,
  handleToggleActive,
  handleSaveHardwareChanges,
  saveStatus,
  maxLinks // <-- Added this prop to receive the limit from PremiumDashboard
}) {
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' };

  // --- NEW CAPACITY CALCULATIONS ---
  // Safe fallback if maxLinks isn't ready
  const limit = maxLinks || (isPremium ? 5 : 2);
  const totalTags = stickers.length;
  const isOverLimit = isPremium && totalTags > limit;
  const progressPercent = Math.min((totalTags / limit) * 100, 100);
  
  let progressColor = '#10b981'; // Green
  if (totalTags === limit) progressColor = '#f59e0b'; // Yellow
  if (totalTags > limit) progressColor = '#ef4444'; // Red

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', marginBottom: '40px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', fontWeight: '700' }}>Activate a New Tag</h2>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>Enter the Tag ID and the 6-digit Activation PIN.</p>
        <div className="responsive-stack">
          <input type="text" placeholder="Tag ID (e.g. ST-005)" value={claimId} onChange={(e) => setClaimId(e.target.value.toUpperCase())} style={{ flex: 1, padding: '14px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111' }} />
          <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength="6" placeholder="6-Digit PIN" value={claimPin} onChange={(e) => setClaimPin(e.target.value.replace(/\D/g, ''))} style={{ width: '160px', padding: '14px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111', textAlign: 'center', letterSpacing: '4px' }} />
          <button onClick={handleActivateTag} style={{ padding: '14px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Link to Account</button>
        </div>
        {claimMessage && <p style={{ marginTop: '15px', color: claimMessage.includes('Success') ? '#34d399' : '#f87171', fontWeight: '600', fontSize: '14px' }}>{claimMessage}</p>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', color: '#111', margin: '0', fontWeight: '700', letterSpacing: '-0.5px' }}>Your Products</h2>
        
        {/* --- NEW CAPACITY TRACKER UI --- */}
        {isPremium && (
          <div style={{ textAlign: 'right', width: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: '5px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', color: progressColor }}>{totalTags}</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>/ {limit} Slots Used</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: progressColor, borderRadius: '4px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}
      </div>

      {stickers.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb', width: '100%' }}><p style={{ color: '#6b7280' }}>Activate your first tag above to get started.</p></div>
      ) : (
        <div style={{ display: 'grid', gap: '25px', width: '100%' }}>
          {stickers.map((sticker, index) => {
            const isEnabled = sticker.is_active !== false;
            // --- NEW SOFT LOCK LOGIC ---
            // Only lock if they are premium AND the tag index exceeds their specific plan limit.
            const isSoftLocked = isPremium && index >= limit; 

            return (
              <div key={sticker.id} style={{ 
                backgroundColor: isSoftLocked ? '#f9fafb' : 'white', // Grey background if locked
                padding: '30px', 
                borderRadius: '16px', 
                border: isSoftLocked ? '1px dashed #d1d5db' : '1px solid #e5e7eb', // Dashed border if locked
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', 
                display: 'flex', flexDirection: 'column', gap: '20px', 
                opacity: isEnabled ? 1 : 0.6, transition: 'opacity 0.2s', width: '100%', overflow: 'hidden' 
              }}>
                <div className="header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#111', textDecoration: isEnabled ? 'none' : 'line-through' }}>{sticker.id}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{sticker.tap_count || 0} Taps</span>
                    
                    {/* NEW SOFT LOCK BADGE */}
                    {isSoftLocked && (
                       <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         🔒 Soft-Locked
                       </span>
                    )}
                  </div>
                  <a href={`/go/${sticker.url_slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600', padding: '8px 16px', backgroundColor: '#e0e7ff', borderRadius: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>Preview Link ↗</a>
                </div>
                <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                  <div>
                    <label style={labelStyle}>Tag Name (Optional)</label>
                    <input disabled={!isEnabled || isSoftLocked} type="text" defaultValue={sticker.tag_name || ''} placeholder="e.g., Table 5" onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, tag_name: e.target.value } : s); setStickers(updated) }} style={{...inputStyle, backgroundColor: isSoftLocked ? '#f3f4f6' : 'white', color: isSoftLocked ? '#9ca3af' : '#111'}} />
                  </div>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{...labelStyle, marginBottom: 0}}>Destination URL</label>
                        {!isPremium && <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '12px' }}>PRO</span>}
                      </div>
                      <button disabled={isSoftLocked} onClick={() => handleToggleActive(sticker.id, isEnabled)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: isSoftLocked ? 'not-allowed' : 'pointer', backgroundColor: isEnabled ? '#d1fae5' : '#fee2e2', color: isEnabled ? '#059669' : '#dc2626', transition: 'all 0.2s', whiteSpace: 'nowrap', opacity: isSoftLocked ? 0.5 : 1 }}>
                        {isEnabled ? '🟢 Active' : '🔴 Disabled'}
                      </button>
                    </div>
                    <div className="responsive-stack">
                      {/* Pinned to profile if not premium OR if Soft Locked */}
                      <input disabled={!isEnabled || !isPremium || isSoftLocked} type="url" value={(!isPremium || isSoftLocked) ? `https://linksupply.co.uk/u/${pageProfile.username}` : (sticker.target_url || '')} onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: e.target.value } : s); setStickers(updated) }} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '16px', color: (!isPremium || isSoftLocked) ? '#6b7280' : '#111', backgroundColor: (!isPremium || isSoftLocked) ? '#f3f4f6' : 'white', outline: 'none' }} />
                      
                      {!isPremium ? (
                        <button onClick={() => alert("Custom hardware routing is a paid feature. Upgrade to unlock!")} style={{ padding: '14px 24px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>Unlock Routing</button>
                      ) : isSoftLocked ? (
                         <button onClick={() => alert("You have exceeded your plan's hardware limit. Upgrade your workspace to unlock custom routing for this tag.")} style={{ padding: '14px 24px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>Upgrade Plan</button>
                      ) : (
                        <button disabled={!isEnabled} onClick={() => handleSaveHardwareChanges(sticker.id, sticker.target_url, sticker.tag_name)} style={{ padding: '14px 24px', backgroundColor: isEnabled ? '#111' : '#9ca3af', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: isEnabled ? 'pointer' : 'not-allowed' }}>{saveStatus[sticker.id] || 'Save Changes'}</button>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '10px', lineHeight: '1.4' }}>
                      {!isPremium 
                        ? <span><strong>💡 Locked:</strong> On the Free tier, your hardware is permanently linked to your digital profile. Upgrade to Pro to route this tag to a custom website or menu.</span>
                        : isSoftLocked
                        ? <span style={{color: '#dc2626'}}><strong>⚠️ Over Limit:</strong> This hardware exceeds your current {limit}-tag plan limit. It is locked to your profile until you upgrade your workspace.</span>
                        : <span>
                            <strong>💡 Tip:</strong> To share your digital business card, set this to <strong>https://linksupply.co.uk/u/{pageProfile.username}</strong>, or enter any custom website. 
                            <button 
                              type="button"
                              onClick={() => {
                                const profileUrl = `https://linksupply.co.uk/u/${pageProfile.username}`;
                                const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: profileUrl } : s); 
                                setStickers(updated);
                              }}
                              style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', cursor: 'pointer', padding: 0, marginLeft: '6px', fontSize: '13px' }}
                            >
                              Auto-fill profile link
                            </button>
                          </span>
                      }
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}
