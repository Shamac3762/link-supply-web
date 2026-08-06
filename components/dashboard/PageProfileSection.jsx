'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'

export default function PageProfileSection({
  pageProfile,
  setPageProfile,
  getContrastColor,
  fileInputRef,
  handleImageUpload,
  isUploading,
  isPremium,
  handleSaveProfile, 
  saveStatus,
  pageLinks,
  isAtLimit,
  displayLimit,
  handleDeleteLink, 
  newLinkTitle,
  setNewLinkTitle,
  newLinkUrl,
  setNewLinkUrl,
  handleAddLink
}) {
  const supabase = createClient()

  // 🔗 LOCAL LINK STATE (For frictionless sorting)
  const [localLinks, setLocalLinks] = useState([])

  // Sync parent links to local state on load
  useEffect(() => {
    if (pageLinks) setLocalLinks(pageLinks.sort((a, b) => a.sort_order - b.sort_order));
  }, [pageLinks])

  // --- PREMIUM APPLE-STYLE CSS VARIABLES ---
  const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '16px', color: '#111', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f9fafb', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' };

  // --- 🔗 FRICTIONLESS LINK MANAGEMENT ---
  const handleFrictionlessAddLink = async (e) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl) return;

    let cleanUrl = newLinkUrl;
    try {
      const urlObj = new URL(newLinkUrl);
      cleanUrl = `${urlObj.origin}${urlObj.pathname}`;
    } catch {}

    const tempLink = { id: Date.now().toString(), title: newLinkTitle, url: cleanUrl, sort_order: localLinks.length };
    setLocalLinks([...localLinks, tempLink]);
    setNewLinkTitle('');
    setNewLinkUrl('');

    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('page_links').insert([{
      owner_id: user.id, 
      title: tempLink.title,
      url: tempLink.url,
      sort_order: tempLink.sort_order
    }]).select();

    if (data) {
      setLocalLinks(prev => prev.map(l => l.id === tempLink.id ? data[0] : l));
    }
  }

  const handleFrictionlessDeleteLink = async (id) => {
    setLocalLinks(localLinks.filter(l => l.id !== id));
    await supabase.from('page_links').delete().eq('id', id);
  }

  // --- ↕️ ROCK-SOLID MOBILE SORTING ---
  const moveLink = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === localLinks.length - 1) return;

    const newLinks = [...localLinks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap array elements
    [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];
    
    // Re-assign sort_order
    const updatedLinks = newLinks.map((link, i) => ({ ...link, sort_order: i }));
    setLocalLinks(updatedLinks);

    // Silently update database
    const updates = updatedLinks.map(l => ({ id: l.id, owner_id: l.owner_id, title: l.title, url: l.url, sort_order: l.sort_order }));
    await supabase.from('page_links').upsert(updates);
  }

  // Apple-style toggle renderer
  const renderAppleToggle = (isOn, onClick, disabled = false) => (
    <button 
      type="button"
      onClick={onClick} 
      disabled={disabled}
      style={{ 
        width: '50px', height: '30px', borderRadius: '15px', border: 'none', 
        cursor: disabled ? 'not-allowed' : 'pointer', 
        backgroundColor: isOn ? '#34c759' : '#e5e7eb', // Apple Green
        position: 'relative', transition: 'background-color 0.2s ease',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <div style={{ 
        width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', 
        left: isOn ? '22px' : '2px', 
        transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' 
      }} />
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', width: '100%', paddingBottom: '40px' }}>
      
      {/* 1. Profile Status */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', margin: '0 0 4px 0' }}>Profile Status</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Public visibility of your page.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <a href={`/u/${pageProfile.username}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#007aff', textDecoration: 'none', fontWeight: '600' }}>Preview ↗</a>
          <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '12px' }}>
            <button onClick={() => setPageProfile({...pageProfile, profile_status: 'live'})} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: '0.2s', backgroundColor: pageProfile.profile_status === 'live' ? 'white' : 'transparent', color: pageProfile.profile_status === 'live' ? '#111' : '#6b7280', boxShadow: pageProfile.profile_status === 'live' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>🟢 Live</button>
            <button onClick={() => setPageProfile({...pageProfile, profile_status: 'coming_soon'})} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: '0.2s', backgroundColor: pageProfile.profile_status === 'coming_soon' ? 'white' : 'transparent', color: pageProfile.profile_status === 'coming_soon' ? '#111' : '#6b7280', boxShadow: pageProfile.profile_status === 'coming_soon' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>🚧 Coming Soon</button>
          </div>
        </div>
      </div>

      {/* 2. Page Identity */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', margin: '0 0 20px 0' }}>Identity</h2>
        <div className="responsive-grid">
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Display Name</label>
            <input type="text" value={pageProfile.display_name} placeholder="e.g. John Doe" onChange={(e) => setPageProfile({...pageProfile, display_name: e.target.value})} style={inputStyle} />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <label style={{...labelStyle, marginBottom: 0}}>Public Username URL</label>
              {!isPremium && <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '2px 6px', borderRadius: '6px' }}>PRO</span>}
            </div>
            <div style={{ backgroundColor: !isPremium ? '#f3f4f6' : '#f9fafb', display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <span style={{ padding: '14px', color: '#9ca3af', borderRight: '1px solid #e5e7eb', backgroundColor: '#f3f4f6' }}>linksupply.co.uk/u/</span>
              <input disabled={!isPremium} type="text" value={pageProfile.username} onChange={(e) => setPageProfile({...pageProfile, username: e.target.value})} style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: 'transparent', fontSize: '16px', color: !isPremium ? '#9ca3af' : '#111', outline: 'none', fontWeight: '600' }} />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Profile Picture</label>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="text" value={pageProfile.profile_picture_url} placeholder="Image URL or upload..." onChange={(e) => setPageProfile({...pageProfile, profile_picture_url: e.target.value})} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
              <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading} style={{ padding: '14px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: isUploading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {isUploading ? '⏳...' : 'Upload'}
              </button>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            <label style={labelStyle}>Short Bio</label>
            <textarea value={pageProfile.bio} placeholder="Welcome to my profile!" onChange={(e) => setPageProfile({...pageProfile, bio: e.target.value})} rows="2" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={labelStyle}>Brand Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input type="color" value={pageProfile.theme_color} onChange={(e) => setPageProfile({...pageProfile, theme_color: e.target.value})} style={{ width: '44px', height: '44px', padding: '0', border: 'none', borderRadius: '12px', cursor: 'pointer', overflow: 'hidden' }} />
              <div style={{ padding: '10px 16px', borderRadius: '10px', backgroundColor: pageProfile.theme_color, color: getContrastColor(pageProfile.theme_color), fontSize: '13px', fontWeight: 'bold' }}>Preview</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Digital Business Card Info */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', marginBottom: '4px' }}>Business Card</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Contact details for the "Save" button.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '14px', color: '#111', fontWeight: '600' }}>Enable Button</label>
            {renderAppleToggle(pageProfile.show_save_contact, () => setPageProfile({ ...pageProfile, show_save_contact: !pageProfile.show_save_contact }))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Job Title</label>
            <input type="text" value={pageProfile.job_title} onChange={(e) => setPageProfile({...pageProfile, job_title: e.target.value})} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Company</label>
            <input disabled={!isPremium} type="text" value={pageProfile.company} onChange={(e) => setPageProfile({...pageProfile, company: e.target.value})} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : '#f9fafb', opacity: !isPremium ? 0.6 : 1}} />
          </div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input disabled={!isPremium} type="tel" value={pageProfile.phone_number} onChange={(e) => setPageProfile({...pageProfile, phone_number: e.target.value})} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : '#f9fafb', opacity: !isPremium ? 0.6 : 1}} />
          </div>
          <div>
            <label style={labelStyle}>Email Address</label>
            <input disabled={!isPremium} type="email" value={pageProfile.display_email} onChange={(e) => setPageProfile({...pageProfile, display_email: e.target.value})} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : '#f9fafb', opacity: !isPremium ? 0.6 : 1}} />
          </div>
        </div>
      </div>

      {/* 4. SEAMLESS LINKS WITH CHEVRON SORTING */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', margin: '0 0 4px 0' }}>Your Links</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Add and reorder buttons for your profile.</p>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: isAtLimit && displayLimit !== 'Unlimited' ? '#ff3b30' : '#6b7280', backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '12px' }}>{localLinks.length} / {displayLimit}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
          {localLinks.length === 0 ? (
            <div style={{ padding: '25px', backgroundColor: '#f9fafb', borderRadius: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', border: '1px dashed #d1d5db' }}>No links added yet.</div>
          ) : localLinks.map((link, index) => (
              <div key={link.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                
                {/* UP / DOWN ARROWS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginRight: '15px' }}>
                  <button onClick={() => moveLink(index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', padding: '4px', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#d1d5db' : '#111', display: 'flex' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
                  </button>
                  <button onClick={() => moveLink(index, 'down')} disabled={index === localLinks.length - 1} style={{ background: 'none', border: 'none', padding: '4px', cursor: index === localLinks.length - 1 ? 'not-allowed' : 'pointer', color: index === localLinks.length - 1 ? '#d1d5db' : '#111', display: 'flex' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                </div>
                
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontWeight: '700', color: '#111', margin: '0 0 4px 0', fontSize: '15px' }}>{link.title}</p>
                  <p style={{ color: '#6b7280', fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.url}</p>
                </div>
                
                <button onClick={() => handleFrictionlessDeleteLink(link.id)} style={{ background: 'none', color: '#ff3b30', border: 'none', padding: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Remove</button>
              </div>
          ))}
        </div>

        {isAtLimit ? (
          <div style={{ padding: '25px', backgroundColor: '#f9fafb', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '800', color: '#111' }}>Link Limit Reached</h3>
            <button onClick={() => alert("Upgrade coming soon!")} style={{ padding: '12px 24px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Upgrade to Premium</button>
          </div>
        ) : (
          <form onSubmit={handleFrictionlessAddLink} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input required type="text" placeholder="Title (e.g. Website)" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '150px' }} />
            <input required type="url" placeholder="https://" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: '200px' }} />
            <button type="submit" disabled={!newLinkTitle || !newLinkUrl} style={{ padding: '14px 24px', backgroundColor: (!newLinkTitle || !newLinkUrl) ? '#e5e7eb' : '#007aff', color: (!newLinkTitle || !newLinkUrl) ? '#9ca3af' : 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: (!newLinkTitle || !newLinkUrl) ? 'not-allowed' : 'pointer', transition: '0.2s' }}>
              Add
            </button>
          </form>
        )}
      </div>

      {/* 5. Link Supply Branding (Moved to bottom) */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', margin: '0 0 4px 0' }}>Link Supply Branding</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, maxWidth: '400px' }}>
            {isPremium ? 'Toggle the watermark at the bottom of your public page.' : 'Upgrade to Pro to remove Link Supply watermarks.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '14px', color: '#111', fontWeight: '600' }}>Show Branding</label>
          {renderAppleToggle(
            !pageProfile.remove_branding, 
            () => setPageProfile({ ...pageProfile, remove_branding: !pageProfile.remove_branding }),
            !isPremium
          )}
        </div>
      </div>

      {/* 6. THE MASSIVE SAVE BUTTON */}
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => handleSaveProfile(pageProfile)} 
          style={{ 
            padding: '20px', 
            backgroundColor: '#111', 
            color: 'white', 
            border: 'none', 
            borderRadius: '16px', 
            fontWeight: '800', 
            cursor: 'pointer', 
            width: '100%', 
            fontSize: '18px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {saveStatus.profile || 'Update Public Profile'}
        </button>
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '15px' }}>
          Changes to your page are not visible to the public until you update.
        </p>
      </div>

    </div>
  )
}
