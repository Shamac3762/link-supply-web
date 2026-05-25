'use client'

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
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
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

        <div style={{ marginTop: '35px', borderTop: '1px solid #e5e7eb', paddingTop: '25px' }}>
          <button onClick={handleSaveProfile} style={{ padding: '16px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', width: '100%', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {saveStatus.profile || '🚀 Update Public Profile'}
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <div className="header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Your Links</h2>
          <span style={{ fontSize: '14px', fontWeight: '600', color: isAtLimit && displayLimit !== 'Unlimited' ? '#dc2626' : '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>{pageLinks.length} / {displayLimit} Used</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Add all the links you want to display.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
          {pageLinks.length === 0 ? <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '10px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No links added yet.</div> : pageLinks.map((link) => (
              <div key={link.id} className="link-row">
                <div style={{ width: '100%', overflow: 'hidden' }}><p style={{ fontWeight: '700', color: '#111', margin: '0 0 5px 0' }}>{link.title}</p><p style={{ color: '#6b7280', fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.url}</p></div>
                <button onClick={() => handleDeleteLink(link.id)} style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Delete</button>
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
          <form onSubmit={handleAddLink} className="responsive-stack" style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '12px' }}>
            <input required type="text" placeholder="Link Title" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }} />
            <input required type="url" placeholder="https://..." value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} style={{ flex: 2, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }} />
            <button type="submit" style={{ padding: '14px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>+ Add Link</button>
          </form>
        )}
      </div>
    </div>
  )
}
