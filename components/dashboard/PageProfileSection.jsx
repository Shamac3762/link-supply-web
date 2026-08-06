'use client'
import { useState, useEffect } from 'react'
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

  // --- ORIGINAL CLEAN STYLES ---
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' };

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
    const { data } = await supabase.from('page_links').insert([{
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

  // --- ↕️ ROCK-SOLID SORTING ---
  const moveLink = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === localLinks.length - 1) return;

    const newLinks = [...localLinks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];
    
    const updatedLinks = newLinks.map((link, i) => ({ ...link, sort_order: i }));
    setLocalLinks(updatedLinks);

    const updates = updatedLinks.map(l => ({ id: l.id, owner_id: l.owner_id, title: l.title, url: l.url, sort_order: l.sort_order }));
    await supabase.from('page_links').upsert(updates);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
      
      {/* 1. Profile Status */}
      <div style={{ backgroundColor: 'white', padding: '25px 30px', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 5px 0' }}>Profile Status</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Control if your page is visible to the public.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <a href={`/u/${pageProfile.username}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600', padding: '10px 18px', backgroundColor: '#e0e7ff', borderRadius: '100px', textAlign: 'center', whiteSpace: 'nowrap', transition: 'all 0.2s ease' }}>Preview Page ↗</a>
          <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '6px', borderRadius: '100px' }}>
            <button onClick={() => { setPageProfile({...pageProfile, profile_status: 'live'}); }} style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: pageProfile.profile_status === 'live' ? 'white' : 'transparent', color: pageProfile.profile_status === 'live' ? '#111' : '#6b7280', boxShadow: pageProfile.profile_status === 'live' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>🟢 Live</button>
            <button onClick={() => { setPageProfile({...pageProfile, profile_status: 'coming_soon'}); }} style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: pageProfile.profile_status === 'coming_soon' ? 'white' : 'transparent', color: pageProfile.profile_status === 'coming_soon' ? '#111' : '#6b7280', boxShadow: pageProfile.profile_status === 'coming_soon' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>🚧 Coming Soon</button>
          </div>
        </div>
      </div>

      {/* 2. Page Identity */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 20px 0' }}>Page Identity</h2>
        <div className="responsive-grid">
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Full Name / Display Name</label>
            <input type="text" value={pageProfile.display_name} placeholder="e.g. John Doe" onChange={(e) => setPageProfile({...pageProfile, display_name: e.target.value})} style={inputStyle} />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <label style={{...labelStyle, marginBottom: 0}}>Public Username (URL)</label>
              {!isPremium && <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '12px' }}>PRO</span>}
            </div>
            <div className="url-input-container" style={{ backgroundColor: !isPremium ? '#f3f4f6' : '#f9fafb' }}>
              <span className="url-prefix" style={{ backgroundColor: !isPremium ? '#e5e7eb' : '#f3f4f6' }}>linksupply.co.uk/u/</span>
              <input disabled={!isPremium} type="text" value={pageProfile.username} placeholder="mybrand" onChange={(e) => setPageProfile({...pageProfile, username: e.target.value})} style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: 'transparent', fontSize: '16px', color: !isPremium ? '#6b7280' : '#111', outline: 'none', fontWeight: '600' }} />
            </div>
            {!isPremium && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>Custom URLs are locked on the Free tier.</p>}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Profile Picture</label>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="text" value={pageProfile.profile_picture_url} placeholder="https://... or click upload" onChange={(e) => setPageProfile({...pageProfile, profile_picture_url: e.target.value})} style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading} style={{ padding: '12px 20px', backgroundColor: '#f3f4f6', color: '#111', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '700', cursor: isUploading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {isUploading ? '⏳ Compressing...' : '📷 Upload Photo'}
              </button>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Short Bio</label>
            <textarea value={pageProfile.bio} placeholder="Welcome to my profile!" onChange={(e) => setPageProfile({...pageProfile, bio: e.target.value})} rows="2" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>Brand Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input type="color" value={pageProfile.theme_color} onChange={(e) => setPageProfile({...pageProfile, theme_color: e.target.value})} style={{ width: '50px', height: '50px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
              <div style={{ padding: '8px 15px', borderRadius: '8px', backgroundColor: pageProfile.theme_color, color: getContrastColor(pageProfile.theme_color), fontSize: '12px', fontWeight: 'bold', border: '1px solid #e5e7eb' }}>Preview Text</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Digital Business Card Info */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', marginBottom: '5px' }}>Digital Business Card</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Add your info so people can save you to their phone.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f9fafb', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <label style={{ fontSize: '14px', color: '#4b5563', fontWeight: '600', cursor: 'pointer' }} htmlFor="contactToggle">Show Contact Button</label>
            <button id="contactToggle" onClick={() => setPageProfile({ ...pageProfile, show_save_contact: !pageProfile.show_save_contact })} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: pageProfile.show_save_contact ? '#059669' : '#d1d5db', position: 'relative', transition: 'background-color 0.2s ease' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', left: pageProfile.show_save_contact ? '22px' : '2px', transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
            </button>
          </div>
        </div>

        <div className="responsive-grid">
          <div>
            <label style={labelStyle}>Job Title</label>
            <input type="text" value={pageProfile.job_title} placeholder="e.g. Sales Director" onChange={(e) => setPageProfile({...pageProfile, job_title: e.target.value})} style={inputStyle} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{...labelStyle, marginBottom: 0}}>Company / Business</label>
              {!isPremium && <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>}
            </div>
            <input disabled={!isPremium} type="text" value={pageProfile.company} placeholder="e.g. Acme Corp" onChange={(e) => setPageProfile({...pageProfile, company: e.target.value})} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : 'white', cursor: !isPremium ? 'not-allowed' : 'text'}} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{...labelStyle, marginBottom: 0}}>Phone Number</label>
              {!isPremium && <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>}
            </div>
            <input disabled={!isPremium} type="tel" value={pageProfile.phone_number} placeholder="+44 7700 900077" onChange={(e) => setPageProfile({...pageProfile, phone_number: e.target.value})} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : 'white', cursor: !isPremium ? 'not-allowed' : 'text'}} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{...labelStyle, marginBottom: 0}}>Display Email</label>
              {!isPremium && <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>}
            </div>
            <input disabled={!isPremium} type="email" value={pageProfile.display_email} placeholder="hello@example.com" onChange={(e) => setPageProfile({...pageProfile, display_email: e.target.value})} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : 'white', cursor: !isPremium ? 'not-allowed' : 'text'}} />
          </div>
        </div>
      </div>

      {/* 4. Your Links (Up/Down Buttons on the Far-Left) */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <div className="header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Your Links</h2>
          <span style={{ fontSize: '14px', fontWeight: '600', color: isAtLimit && displayLimit !== 'Unlimited' ? '#dc2626' : '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>{localLinks.length} / {displayLimit} Used</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Add and reorder buttons for your profile using the arrows on the left.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
          {localLinks.length === 0 ? <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '10px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No links added yet.</div> : localLinks.map((link, index) => (
              <div key={link.id} className="link-row" style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
                
                {/* ⬆️ ⬇️ SORT ARROWS ON FAR LEFT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginRight: '16px', alignItems: 'center' }}>
                  <button type="button" onClick={() => moveLink(index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', padding: '2px', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#d1d5db' : '#111', display: 'flex' }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
                  </button>
                  <button type="button" onClick={() => moveLink(index, 'down')} disabled={index === localLinks.length - 1} style={{ background: 'none', border: 'none', padding: '2px', cursor: index === localLinks.length - 1 ? 'not-allowed' : 'pointer', color: index === localLinks.length - 1 ? '#d1d5db' : '#111', display: 'flex' }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontWeight: '700', color: '#111', margin: '0 0 5px 0' }}>{link.title}</p>
                  <p style={{ color: '#6b7280', fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.url}</p>
                </div>
                
                <button type="button" onClick={() => handleFrictionlessDeleteLink(link.id)} style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Delete</button>
              </div>
          ))}
        </div>

        {isAtLimit ? (
          <div style={{ padding: '30px', backgroundColor: '#111', color: 'white', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔒</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '700' }}>Unlock Unlimited Links</h3>
            <button type="button" onClick={() => alert("Stripe checkout coming soon!")} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', width: '100%' }}>Upgrade to Premium</button>
          </div>
        ) : (
          <form onSubmit={handleFrictionlessAddLink} className="responsive-stack" style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '12px', display: 'flex', gap: '12px', width: '100%' }}>
            <input required type="text" placeholder="Link Title" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input required type="url" placeholder="https://..." value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} style={{ ...inputStyle, flex: 2 }} />
            <button type="submit" disabled={!newLinkTitle || !newLinkUrl} style={{ padding: '14px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: (!newLinkTitle || !newLinkUrl) ? 'not-allowed' : 'pointer' }}>+ Add Link</button>
          </form>
        )}
      </div>

      {/* 5. Massive Save Button */}
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={handleSaveProfile} 
          style={{ 
            padding: '18px 20px', 
            backgroundColor: '#111', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            fontWeight: '800', 
            cursor: 'pointer', 
            width: '100%', 
            fontSize: '18px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
          }}
        >
          {saveStatus.profile || '🚀 Update Public Profile'}
        </button>
      </div>

      {/* 6. Branding Settings (Compact Box placed under Save Button) */}
      <div style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#374151', margin: 0 }}>Link Supply Branding</h3>
            {!isPremium && (
              <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '2px 6px', borderRadius: '10px', textTransform: 'uppercase' }}>
                PRO
              </span>
            )}
          </div>
          <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
            Display the "Get your free digital profile" footer watermark on your public page.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', cursor: isPremium ? 'pointer' : 'not-allowed' }} htmlFor="brandingToggle">Show Branding</label>
          <button 
            id="brandingToggle" 
            type="button"
            onClick={() => {
              if (!isPremium) {
                alert("Please upgrade to a Pro or Business plan to remove Link Supply branding.");
                return;
              }
              setPageProfile({ ...pageProfile, remove_branding: !pageProfile.remove_branding });
            }} 
            disabled={!isPremium}
            style={{ 
              width: '38px', height: '22px', borderRadius: '12px', border: 'none', 
              cursor: isPremium ? 'pointer' : 'not-allowed', 
              backgroundColor: !pageProfile.remove_branding ? '#059669' : '#d1d5db', 
              position: 'relative', transition: 'background-color 0.2s ease',
              opacity: !isPremium ? 0.6 : 1
            }}
          >
            <div style={{ 
              width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', 
              left: !pageProfile.remove_branding ? '18px' : '2px', 
              transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
            }} />
          </button>
        </div>
      </div>

    </div>
  )
}
