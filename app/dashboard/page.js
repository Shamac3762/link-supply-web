'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function PremiumDashboard() {
  const [activeTab, setActiveTab] = useState('hardware') 
  
  const [stickers, setStickers] = useState([])
  const [claimId, setClaimId] = useState('')
  const [claimPin, setClaimPin] = useState('')
  const [claimMessage, setClaimMessage] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)
  
  const [pageProfile, setPageProfile] = useState({ 
    username: '', display_name: '', bio: '', theme_color: '#111111',
    profile_picture_url: '', job_title: '', company: '', phone_number: '', display_email: ''
  })
  const [pageLinks, setPageLinks] = useState([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  const [profile, setProfile] = useState(null)
  const [maxLinks, setMaxLinks] = useState(2)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState({}) 

  // 🔥 NEW STATE FOR SETTINGS MODAL
  const [showSettings, setShowSettings] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [settingsMessage, setSettingsMessage] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    const params = new URLSearchParams(window.location.search)
    const claimParam = params.get('claim')

    if (!session) {
      if (claimParam) return router.push(`/login?view=signup&claim=${claimParam}`)
      return router.push('/login') 
    }

    // 🔥 THE UX FIX: The Translation Layer
    if (claimParam) {
      setActiveTab('hardware')
      // Secretly look up the real ID using the slug
      const { data: tagData } = await supabase
        .from('nfc_stickers')
        .select('id')
        .eq('url_slug', claimParam)
        .single()
        
      if (tagData) {
        setClaimId(tagData.id) // Pre-fills the box with the beautiful ID!
      }
    }

    const firstName = session.user.user_metadata?.first_name
    
    const { data: customerData } = await supabase
      .from('customers')
      .select('username, display_name, bio, theme_color, max_links, profile_picture_url, job_title, company, phone_number, display_email')
      .eq('id', session.user.id)
      .single()

    setProfile({ first_name: firstName })
    if (customerData) {
      setPageProfile({
        username: customerData.username || '', display_name: customerData.display_name || '',
        bio: customerData.bio || '', theme_color: customerData.theme_color || '#111111',
        profile_picture_url: customerData.profile_picture_url || '', job_title: customerData.job_title || '',
        company: customerData.company || '', phone_number: customerData.phone_number || '', display_email: customerData.display_email || ''
      })
      if (customerData.max_links !== undefined) setMaxLinks(customerData.max_links)
    }

    const { data: stickerData } = await supabase.from('nfc_stickers').select('*').eq('owner_id', session.user.id).order('id', { ascending: true })
    if (stickerData) setStickers(stickerData)

    const { data: linksData } = await supabase.from('page_links').select('*').eq('owner_id', session.user.id).order('sort_order', { ascending: true })
    if (linksData) setPageLinks(linksData)

    setLoading(false)
  }

  const handleActivateTag = async () => {
    if (!claimId || claimPin.length < 8) return setClaimMessage("Please enter a valid Tag ID and 8-char Code.")
    setIsClaiming(true); setClaimMessage("Verifying vault...")
    const { data: { session } } = await supabase.auth.getSession()

    const { error, data } = await supabase.from('nfc_stickers').update({ owner_id: session.user.id }).eq('id', claimId.toUpperCase()).eq('activation_code', claimPin).is('owner_id', null).select()
    if (error || !data || data.length === 0) setClaimMessage("Error: Invalid Code, wrong ID, or tag is already owned.")
    else { setClaimMessage("Success! Tag linked to your account. ✓"); setClaimId(''); setClaimPin(''); fetchData(); setTimeout(() => setClaimMessage(''), 3000) }
    setIsClaiming(false)
  }

  const handleSaveHardwareChanges = async (id, newUrl, newName) => {
    setSaveStatus({ ...saveStatus, [id]: 'Saving...' })
    const { error } = await supabase.from('nfc_stickers').update({ target_url: newUrl, tag_name: newName }).eq('id', id)
    if (error) setSaveStatus({ ...saveStatus, [id]: 'Error!' })
    else { setSaveStatus({ ...saveStatus, [id]: 'Saved! ✓' }); setTimeout(() => setSaveStatus((prev) => ({ ...prev, [id]: '' })), 2000) }
  }

  const handleToggleActive = async (id, currentState) => {
    const newState = !currentState 
    setStickers(stickers.map(s => s.id === id ? { ...s, is_active: newState } : s))
    const { error } = await supabase.from('nfc_stickers').update({ is_active: newState }).eq('id', id)
    if (error) {
      setStickers(stickers.map(s => s.id === id ? { ...s, is_active: currentState } : s))
      alert("Failed to update hardware status.")
    }
  }

  const handleSaveProfile = async () => {
    setSaveStatus({ ...saveStatus, profile: 'Saving...' })
    const { data: { session } } = await supabase.auth.getSession()
    const cleanUsername = pageProfile.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    
    const { error } = await supabase.from('customers').upsert({ 
        id: session.user.id, username: cleanUsername, display_name: pageProfile.display_name,
        bio: pageProfile.bio, theme_color: pageProfile.theme_color, profile_picture_url: pageProfile.profile_picture_url,
        job_title: pageProfile.job_title, company: pageProfile.company, phone_number: pageProfile.phone_number, display_email: pageProfile.display_email
      })

    if (error) { alert("Database Error: " + error.message); setSaveStatus({ ...saveStatus, profile: 'Error!' }) } 
    else { setPageProfile({ ...pageProfile, username: cleanUsername }); setSaveStatus({ ...saveStatus, profile: 'Saved! ✓' }); setTimeout(() => setSaveStatus((prev) => ({ ...prev, profile: '' })), 2000) }
  }

  const handleAddLink = async (e) => {
    e.preventDefault()
    if (!newLinkTitle || !newLinkUrl) return
    if (pageLinks.length >= maxLinks) return alert("Link limit reached.")
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('page_links').insert([{ owner_id: session.user.id, title: newLinkTitle, url: newLinkUrl, sort_order: pageLinks.length }])
    if (!error) { setNewLinkTitle(''); setNewLinkUrl(''); fetchData() }
  }

  const handleDeleteLink = async (linkId) => {
    const { error } = await supabase.from('page_links').delete().eq('id', linkId)
    if (!error) fetchData()
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return setSettingsMessage("Password must be at least 6 characters.")
    setSettingsMessage("Updating...")
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setSettingsMessage("Error updating password: " + error.message)
    else { setSettingsMessage("Password updated successfully! ✓"); setNewPassword('') }
  }

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "GDPR NOTICE: Are you absolutely sure you want to permanently delete your account?\n\nThis will immediately sever all your physical NFC tags from this profile. This action cannot be undone."
    )
    
    if (confirmDelete) {
      setSettingsMessage("Deleting account...")
      alert("Account scheduled for deletion. Please contact support to finalize.")
    }
  }

  const isAtLimit = pageLinks.length >= maxLinks
  const displayLimit = maxLinks > 100 ? 'Unlimited' : maxLinks
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>Loading Workspace...</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
      
      <style>{`
        * { box-sizing: border-box; }
        .responsive-nav { padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; background-color: white; }
        .responsive-tabs { display: flex; gap: 10px; margin-bottom: 30px; background-color: #e5e7eb; padding: 6px; border-radius: 12px; }
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .responsive-stack { display: flex; gap: 12px; }
        .link-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; }
        
        @media (max-width: 600px) {
          .responsive-nav { padding: 15px 20px; flex-direction: column; gap: 15px; }
          .responsive-tabs { flex-direction: column; }
          .responsive-grid { grid-template-columns: 1fr; }
          .responsive-stack { flex-direction: column; align-items: stretch; }
          .responsive-stack > input, .responsive-stack > button { width: 100% !important; max-width: 100% !important; }
          .header-stack { flex-direction: column; align-items: flex-start !important; gap: 15px; }
          .header-stack .actions { width: 100%; display: flex; justify-content: space-between; }
          .link-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .link-row button { width: 100%; }
        }
      `}</style>

      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Account Settings</h2>
              <button onClick={() => {setShowSettings(false); setSettingsMessage('')}} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <label style={labelStyle}>Change Password</label>
              <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{...inputStyle, marginBottom: '10px'}} />
              <button onClick={handleUpdatePassword} style={{ width: '100%', padding: '10px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Update Password</button>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '16px', color: '#dc2626', margin: '0 0 10px 0' }}>Danger Zone</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>Permanently delete your account and data to comply with GDPR data privacy regulations.</p>
              <button onClick={handleDeleteAccount} style={{ width: '100%', padding: '10px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Delete Account</button>
            </div>
            
            {settingsMessage && <p style={{ marginTop: '15px', color: settingsMessage.includes('Success') ? '#059669' : '#dc2626', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>{settingsMessage}</p>}
          </div>
        </div>
      )}

      <nav className="responsive-nav">
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#111', margin: 0, letterSpacing: '-0.5px' }}>Link Supply.</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: '#4b5563', fontWeight: '500', fontSize: '15px', display: 'none' }}>Hello, {profile?.first_name || 'User'}</span>
          <button onClick={() => setShowSettings(true)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#111', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>⚙️ Settings</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Log Out</button>
        </div>
      </nav>

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        <div className="responsive-tabs">
          <button onClick={() => setActiveTab('hardware')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'hardware' ? 'white' : 'transparent', color: activeTab === 'hardware' ? '#111' : '#6b7280', boxShadow: activeTab === 'hardware' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>My Hardware Tags</button>
          <button onClick={() => setActiveTab('page')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'page' ? 'white' : 'transparent', color: activeTab === 'page' ? '#111' : '#6b7280', boxShadow: activeTab === 'page' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>My Premium Page</button>
        </div>

        {activeTab === 'hardware' && (
          <div>
            <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', marginBottom: '40px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', fontWeight: '700' }}>Activate a New Tag</h2>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>Enter the Tag ID and the 8-character Activation Code.</p>
              <div className="responsive-stack">
                <input type="text" placeholder="Tag ID (e.g. LS-005)" value={claimId} onChange={(e) => setClaimId(e.target.value.toUpperCase())} style={{ flex: 1, padding: '14px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111' }} />
                <input type="text" maxLength="8" placeholder="8-Char Code" value={claimPin} onChange={(e) => setClaimPin(e.target.value.toUpperCase())} style={{ width: '160px', padding: '14px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111', textAlign: 'center', letterSpacing: '2px' }} />
                <button onClick={handleActivateTag} disabled={isClaiming} style={{ padding: '14px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>{isClaiming ? 'Verifying...' : 'Link to Account'}</button>
              </div>
              {claimMessage && <p style={{ marginTop: '15px', color: claimMessage.includes('Success') ? '#34d399' : '#f87171', fontWeight: '600', fontSize: '14px' }}>{claimMessage}</p>}
            </div>

            <h2 style={{ fontSize: '24px', color: '#111', margin: '0 0 20px 0', fontWeight: '700', letterSpacing: '-0.5px' }}>Your Products</h2>
            {stickers.length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb' }}><p style={{ color: '#6b7280' }}>Activate your first tag above to get started.</p></div>
            ) : (
              <div style={{ display: 'grid', gap: '25px' }}>
                {stickers.map((sticker) => {
                  const isEnabled = sticker.is_active !== false;
                  return (
                    <div key={sticker.id} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '20px', opacity: isEnabled ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                      
                      <div className="header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px', fontWeight: '700', color: '#111', textDecoration: isEnabled ? 'none' : 'line-through' }}>{sticker.id}</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>
                            {sticker.tap_count || 0} Taps
                          </span>
                        </div>
                        <a href={`/go/${sticker.url_slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600', padding: '8px 16px', backgroundColor: '#e0e7ff', borderRadius: '8px', textAlign: 'center', width: 'auto' }}>Preview Link ↗</a>
                      </div>

                      <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                          <label style={labelStyle}>Tag Name (Optional)</label>
                          <input disabled={!isEnabled} type="text" defaultValue={sticker.tag_name || ''} placeholder="e.g., Table 5" onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, tag_name: e.target.value } : s); setStickers(updated) }} style={inputStyle} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{...labelStyle, marginBottom: 0}}>Destination URL</label>
                            <button
                              onClick={() => handleToggleActive(sticker.id, isEnabled)}
                              style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', backgroundColor: isEnabled ? '#d1fae5' : '#fee2e2', color: isEnabled ? '#059669' : '#dc2626', transition: 'all 0.2s' }}
                            >
                              {isEnabled ? '🟢 Active' : '🔴 Disabled'}
                            </button>
                          </div>
                          <div className="responsive-stack">
                            <input disabled={!isEnabled} type="url" defaultValue={sticker.target_url || ''} placeholder="https://your-link.com" onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: e.target.value } : s); setStickers(updated) }} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '16px', color: '#111', outline: 'none' }} />
                            <button disabled={!isEnabled} onClick={() => handleSaveHardwareChanges(sticker.id, sticker.target_url, sticker.tag_name)} style={{ padding: '14px 24px', backgroundColor: isEnabled ? '#111' : '#9ca3af', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: isEnabled ? 'pointer' : 'not-allowed' }}>{saveStatus[sticker.id] || 'Save Changes'}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'page' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <div className="header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Page Identity</h2>
              </div>
              
              <div className="responsive-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Full Name / Display Name</label>
                  <input type="text" value={pageProfile.display_name} placeholder="e.g. John Doe" onChange={(e) => setPageProfile({...pageProfile, display_name: e.target.value})} style={inputStyle} />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Public Username (URL)</label>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '10px', overflow: 'hidden' }}>
                    <span style={{ color: '#6b7280', fontSize: '15px', padding: '14px 0 14px 14px', fontWeight: '500', borderRight: '1px solid #e5e7eb', backgroundColor: '#f3f4f6' }}>
                      linksupply.co.uk/u/
                    </span>
                    <input type="text" value={pageProfile.username} placeholder="mybrand" onChange={(e) => setPageProfile({...pageProfile, username: e.target.value})} style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: 'transparent', fontSize: '16px', color: '#111', outline: 'none', fontWeight: '600' }} />
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Profile Picture URL (Optional)</label>
                  <input type="text" value={pageProfile.profile_picture_url} placeholder="https://example.com/my-photo.jpg" onChange={(e) => setPageProfile({...pageProfile, profile_picture_url: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Short Bio</label>
                  <textarea value={pageProfile.bio} placeholder="Welcome to my profile!" onChange={(e) => setPageProfile({...pageProfile, bio: e.target.value})} rows="2" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={labelStyle}>Brand Color</label>
                  <input type="color" value={pageProfile.theme_color} onChange={(e) => setPageProfile({...pageProfile, theme_color: e.target.value})} style={{ width: '50px', height: '50px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                </div>
              </div>

              <div style={{ marginTop: '25px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <button onClick={handleSaveProfile} style={{ padding: '14px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', width: '100%', fontSize: '16px' }}>
                  {saveStatus.profile || 'Save Profile Info'}
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', marginBottom: '5px' }}>Digital Business Card</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Fill these out to add a "Save to Contacts" button to your profile.</p>
              <div className="responsive-grid">
                <div><label style={labelStyle}>Job Title</label><input type="text" value={pageProfile.job_title} placeholder="e.g. Sales Director" onChange={(e) => setPageProfile({...pageProfile, job_title: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Company / Business</label><input type="text" value={pageProfile.company} placeholder="e.g. Acme Corp" onChange={(e) => setPageProfile({...pageProfile, company: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Phone Number</label><input type="tel" value={pageProfile.phone_number} placeholder="+44 7700 900077" onChange={(e) => setPageProfile({...pageProfile, phone_number: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Display Email</label><input type="email" value={pageProfile.display_email} placeholder="hello@example.com" onChange={(e) => setPageProfile({...pageProfile, display_email: e.target.value})} style={inputStyle} /></div>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <div className="header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Your Links</h2>
                <span style={{ fontSize: '14px', fontWeight: '600', color: isAtLimit && maxLinks <= 100 ? '#dc2626' : '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>{pageLinks.length} / {displayLimit} Used</span>
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
                  <button onClick={() => alert("Stripe checkout coming soon!")} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', width: '100%' }}>Upgrade to Premium — £5/mo</button>
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
        )}
      </main>
    </div>
  )
}
