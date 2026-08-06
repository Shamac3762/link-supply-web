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
  handleSaveProfile, // We still use this for the auto-save
  saveStatus,
  pageLinks,
  isAtLimit,
  displayLimit,
  // We will override the parent link functions locally to stop the page from redirecting/refreshing
  handleDeleteLink, 
  newLinkTitle,
  setNewLinkTitle,
  newLinkUrl,
  setNewLinkUrl,
  handleAddLink
}) {
  const supabase = createClient()

  // 🍞 TOAST NOTIFICATION STATE
  const [toastMessage, setToastMessage] = useState(null)

  // 🔗 LOCAL LINK STATE (For frictionless drag & drop)
  const [localLinks, setLocalLinks] = useState([])
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  // Sync parent links to local state on load
  useEffect(() => {
    if (pageLinks) setLocalLinks(pageLinks.sort((a, b) => a.sort_order - b.sort_order));
  }, [pageLinks])

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' };

  // --- 🪄 MAGIC AUTO-SAVE FUNCTION ---
  const triggerAutoSave = (message = "✅ Profile updated") => {
    handleSaveProfile(); // Triggers your parent's save function silently
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }

  const handleToggleChange = (updates) => {
    setPageProfile(prev => ({ ...prev, ...updates }));
    setTimeout(() => triggerAutoSave(), 100); // Slight delay ensures state updates before saving
  }

  // --- 🔗 FRICTIONLESS LINK MANAGEMENT ---
  const handleFrictionlessAddLink = async (e) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl) return;

    let cleanUrl = newLinkUrl;
    try {
      const urlObj = new URL(newLinkUrl);
      cleanUrl = `${urlObj.origin}${urlObj.pathname}`;
    } catch {}

    // Instantly add to UI for immediate feedback
    const tempLink = { id: Date.now().toString(), title: newLinkTitle, url: cleanUrl, sort_order: localLinks.length };
    setLocalLinks([...localLinks, tempLink]);
    setNewLinkTitle('');
    setNewLinkUrl('');

    // Save to database silently
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('page_links').insert([{
      owner_id: user.id, 
      title: tempLink.title,
      url: tempLink.url,
      sort_order: tempLink.sort_order
    }]).select();

    if (data) {
      // Replace temp ID with real DB ID
      setLocalLinks(prev => prev.map(l => l.id === tempLink.id ? data[0] : l));
      triggerAutoSave("🔗 Link added!");
    }
  }

  const handleFrictionlessDeleteLink = async (id) => {
    // Instantly remove from UI
    setLocalLinks(localLinks.filter(l => l.id !== id));
    // Remove from DB silently
    await supabase.from('page_links').delete().eq('id', id);
    triggerAutoSave("🗑️ Link removed");
  }

  // --- 🤏 DRAG AND DROP SORTING ---
  const handleSort = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    // 1. Reorder locally
    let _localLinks = [...localLinks];
    const draggedItemContent = _localLinks.splice(dragItem.current, 1)[0];
    _localLinks.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    setLocalLinks(_localLinks);

    // 2. Build updates array
    const updates = _localLinks.map((link, index) => ({
      id: link.id,
      owner_id: link.owner_id,
      title: link.title,
      url: link.url,
      sort_order: index
    }));

    // 3. Save to database silently
    await supabase.from('page_links').upsert(updates);
    triggerAutoSave("↕️ Order saved");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%', paddingBottom: '100px' }}>
      
      {/* GLOBAL STYLES FOR ANIMATIONS */}
      <style>{`
        @keyframes fadeInUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .drag-row { transition: background-color 0.2s, transform 0.1s; }
        .drag-row:hover { background-color: #f9fafb !important; }
        .drag-row:active { transform: scale(0.99); cursor: grabbing !important; }
      `}</style>

      {/* 🍞 FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#111', color: 'white', padding: '14px 28px', borderRadius: '100px',
          fontWeight: '700', fontSize: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          zIndex: 9999, animation: 'fadeInUp 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Profile Status */}
      <div style={{ backgroundColor: 'white', padding: '25px 30px', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 5px 0' }}>Profile Status</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Control if your page is visible to the public.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <a href={`/u/${pageProfile.username}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600', padding: '10px 18px', backgroundColor: '#e0e7ff', borderRadius: '100px', textAlign: 'center', whiteSpace: 'nowrap', transition: 'all 0.2s ease' }}>Preview Page ↗</a>
          <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '6px', borderRadius: '100px' }}>
            <button onClick={() => handleToggleChange({ profile_status: 'live' })} style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: pageProfile.profile_status === 'live' ? 'white' : 'transparent', color: pageProfile.profile_status === 'live' ? '#111' : '#6b7280', boxShadow: pageProfile.profile_status === 'live' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>🟢 Live</button>
            <button onClick={() => handleToggleChange({ profile_status: 'coming_soon' })} style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: pageProfile.profile_status === 'coming_soon' ? 'white' : 'transparent', color: pageProfile.profile_status === 'coming_soon' ? '#111' : '#6b7280', boxShadow: pageProfile.profile_status === 'coming_soon' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>🚧 Coming Soon</button>
          </div>
        </div>
      </div>

      {/* Page Identity */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 20px 0' }}>Page Identity</h2>
        <div className="responsive-grid">
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Full Name / Display Name</label>
            <input type="text" value={pageProfile.display_name} placeholder="e.g. John Doe" onChange={(e) => setPageProfile({...pageProfile, display_name: e.target.value})} onBlur={() => triggerAutoSave()} style={inputStyle} />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <label style={{...labelStyle, marginBottom: 0}}>Public Username (URL)</label>
              {!isPremium && <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '12px' }}>PRO</span>}
            </div>
            <div className="url-input-container" style={{ backgroundColor: !isPremium ? '#f3f4f6' : '#f9fafb', display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '10px', overflow: 'hidden' }}>
              <span className="url-prefix" style={{ backgroundColor: !isPremium ? '#e5e7eb' : '#f3f4f6', padding: '14px', color: '#6b7280', borderRight: '1px solid #d1d5db' }}>linksupply.co.uk/u/</span>
              <input disabled={!isPremium} type="text" value={pageProfile.username} placeholder="mybrand" onChange={(e) => setPageProfile({...pageProfile, username: e.target.value})} onBlur={() => triggerAutoSave()} style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: 'transparent', fontSize: '16px', color: !isPremium ? '#6b7280' : '#111', outline: 'none', fontWeight: '600' }} />
            </div>
            {!isPremium && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>Custom URLs are locked on the Free tier.</p>}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Profile Picture</label>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="text" value={pageProfile.profile_picture_url} placeholder="https://... or click upload" onChange={(e) => setPageProfile({...pageProfile, profile_picture_url: e.target.value})} onBlur={() => triggerAutoSave()} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
              <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading} style={{ padding: '12px 20px', backgroundColor: '#f3f4f6', color: '#111', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '700', cursor: isUploading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {isUploading ? '⏳ Compressing...' : '📷 Upload Photo'}
              </button>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '15px' }}>
            <label style={labelStyle}>Short Bio</label>
            <textarea value={pageProfile.bio} placeholder="Welcome to my profile!" onChange={(e) => setPageProfile({...pageProfile, bio: e.target.value})} onBlur={() => triggerAutoSave()} rows="2" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={labelStyle}>Brand Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input type="color" value={pageProfile.theme_color} onChange={(e) => setPageProfile({...pageProfile, theme_color: e.target.value})} onBlur={() => triggerAutoSave()} style={{ width: '50px', height: '50px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
              <div style={{ padding: '8px 15px', borderRadius: '8px', backgroundColor: pageProfile.theme_color, color: getContrastColor(pageProfile.theme_color), fontSize: '12px', fontWeight: 'bold', border: '1px solid #e5e7eb' }}>Preview Text</div>
            </div>
          </div>
        </div>
      </div>

      {/* Branding Settings */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Link Supply Branding</h2>
              {!isPremium && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '800', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  PRO
                </span>
              )}
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, maxWidth: '450px' }}>
              Display the "Get your free digital profile" floater at the bottom of your public page.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f9fafb', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <label style={{ fontSize: '14px', color: '#4b5563', fontWeight: '600', cursor: isPremium ? 'pointer' : 'not-allowed' }} htmlFor="brandingToggle">Show Branding</label>
            <button 
              id="brandingToggle" 
              onClick={() => {
                if (!isPremium) return alert("Please upgrade to a Pro plan to remove branding.");
                handleToggleChange({ remove_branding: !pageProfile.remove_branding });
              }} 
              disabled={!isPremium}
              style={{ 
                width: '44px', height: '24px', borderRadius: '12px', border: 'none', 
                cursor: isPremium ? 'pointer' : 'not-allowed', 
                backgroundColor: !pageProfile.remove_branding ? '#059669' : '#d1d5db', 
                position: 'relative', transition: 'background-color 0.2s ease',
                opacity: !isPremium ? 0.6 : 1
              }}
            >
              <div style={{ 
                width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', 
                left: !pageProfile.remove_branding ? '22px' : '2px', 
                transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
              }} />
            </button>
          </div>
        </div>
        
        {!isPremium && (
          <div style={{ padding: '15px', backgroundColor: '#fef9c3', borderRadius: '12px', border: '1px solid #fde047', display: 'flex', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#854d0e', fontWeight: '600' }}>
              Want a fully white-labeled profile? Upgrade to Pro to remove Link Supply watermarks.
            </p>
          </div>
        )}
      </div>

      {/* Digital Business Card Info */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', marginBottom: '5px' }}>Digital Business Card</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Add your info so people can save you to their phone.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f9fafb', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <label style={{ fontSize: '14px', color: '#4b5563', fontWeight: '600', cursor: 'pointer' }} htmlFor="contactToggle">Show Contact Button</label>
            <button id="contactToggle" onClick={() => handleToggleChange({ show_save_contact: !pageProfile.show_save_contact })} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: pageProfile.show_save_contact ? '#059669' : '#d1d5db', position: 'relative', transition: 'background-color 0.2s ease' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', left: pageProfile.show_save_contact ? '22px' : '2px', transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Job Title</label>
            <input type="text" value={pageProfile.job_title} placeholder="e.g. Sales Director" onChange={(e) => setPageProfile({...pageProfile, job_title: e.target.value})} onBlur={() => triggerAutoSave()} style={inputStyle} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{...labelStyle, marginBottom: 0}}>Company / Business</label>
              {!isPremium && <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>}
            </div>
            <input disabled={!isPremium} type="text" value={pageProfile.company} placeholder="e.g. Acme Corp" onChange={(e) => setPageProfile({...pageProfile, company: e.target.value})} onBlur={() => triggerAutoSave()} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : 'white', cursor: !isPremium ? 'not-allowed' : 'text'}} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{...labelStyle, marginBottom: 0}}>Phone Number</label>
              {!isPremium && <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>}
            </div>
            <input disabled={!isPremium} type="tel" value={pageProfile.phone_number} placeholder="+44 7700 900077" onChange={(e) => setPageProfile({...pageProfile, phone_number: e.target.value})} onBlur={() => triggerAutoSave()} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : 'white', cursor: !isPremium ? 'not-allowed' : 'text'}} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{...labelStyle, marginBottom: 0}}>Display Email</label>
              {!isPremium && <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>}
            </div>
            <input disabled={!isPremium} type="email" value={pageProfile.display_email} placeholder="hello@example.com" onChange={(e) => setPageProfile({...pageProfile, display_email: e.target.value})} onBlur={() => triggerAutoSave()} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : 'white', cursor: !isPremium ? 'not-allowed' : 'text'}} />
          </div>
        </div>
      </div>

      {/* 🤏 FRICTIONLESS DRAG & DROP LINKS */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <div className="header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Your Links</h2>
          <span style={{ fontSize: '14px', fontWeight: '600', color: isAtLimit && displayLimit !== 'Unlimited' ? '#dc2626' : '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>{localLinks.length} / {displayLimit} Used</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Drag and drop using the grip icon to reorder your links.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
          {localLinks.length === 0 ? (
            <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '10px', textAlign: 'center', color: '#6b7280', fontSize: '14px', border: '1px dashed #d1d5db' }}>No links added yet.</div>
          ) : localLinks.map((link, index) => (
              <div 
                key={link.id} 
                className="drag-row"
                draggable
                onDragStart={() => (dragItem.current = index)}
                onDragEnter={() => (dragOverItem.current = index)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
                style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', cursor: 'grab', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
              >
                {/* ⠿ Grip Icon */}
                <div style={{ padding: '15px 10px 15px 15px', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
                
                <div style={{ flex: 1, padding: '12px 10px', overflow: 'hidden' }}>
                  <p style={{ fontWeight: '700', color: '#111', margin: '0 0 3px 0', fontSize: '15px' }}>{link.title}</p>
                  <p style={{ color: '#6b7280', fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.url}</p>
                </div>
                
                <div style={{ padding: '10px 15px' }}>
                  <button onClick={() => handleFrictionlessDeleteLink(link.id)} style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: '0.2s' }}>Delete</button>
                </div>
              </div>
          ))}
        </div>

        {isAtLimit ? (
          <div style={{ padding: '30px', backgroundColor: '#111', color: 'white', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔒</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '700' }}>Unlock Unlimited Links</h3>
            <button onClick={() => alert("Stripe checkout coming soon!")} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', width: '100%' }}>Upgrade to Premium</button>
          </div>
        ) : (
          <form onSubmit={handleFrictionlessAddLink} style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', fontWeight: '700', color: '#111' }}>Add New Link</h3>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <input required type="text" placeholder="Title (e.g. LinkedIn)" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '200px' }} />
              <input required type="url" placeholder="https://..." value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: '250px' }} />
              <button type="submit" disabled={!newLinkTitle || !newLinkUrl} style={{ padding: '14px 24px', backgroundColor: (!newLinkTitle || !newLinkUrl) ? '#d1d5db' : '#111', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: (!newLinkTitle || !newLinkUrl) ? 'not-allowed' : 'pointer', minWidth: '120px', transition: '0.2s' }}>
                + Add
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
