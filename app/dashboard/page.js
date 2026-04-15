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
  
  // AI STATES
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const [pageProfile, setPageProfile] = useState({ 
    username: '', display_name: '', bio: '', theme_color: '#111111',
    profile_picture_url: '', job_title: '', company: '', phone_number: '', 
    display_email: '', bg_css: '' // 🔥 Added bg_css
  })
  const [pageLinks, setPageLinks] = useState([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  const [profile, setProfile] = useState(null)
  const [maxLinks, setMaxLinks] = useState(2)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState({}) 

  const [showSettings, setShowSettings] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [settingsMessage, setSettingsMessage] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const generateDefaultUsername = (firstName, lastName) => {
    const f = (firstName || '').charAt(0).toLowerCase();
    const l = (lastName || '').substring(0, 5).toLowerCase();
    const cleanBase = `${f}${l}`.replace(/[^a-z0-9]/g, '');
    const randomStr = Math.random().toString(36).substring(2, 5);
    return cleanBase ? `${cleanBase}${randomStr}` : `user${Math.random().toString(36).substring(2, 8)}`;
  }

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const params = new URLSearchParams(window.location.search)
    const claimParam = params.get('claim')

    if (!session) {
      if (claimParam) return router.push(`/login?view=signup&claim=${claimParam}`)
      return router.push('/login') 
    }

    if (claimParam) {
      setActiveTab('hardware')
      const { data: tagData } = await supabase.from('nfc_stickers').select('id').eq('url_slug', claimParam).single()
      if (tagData) setClaimId(tagData.id) 
    }

    const firstName = session.user.user_metadata?.first_name || '';
    const lastName = session.user.user_metadata?.last_name || '';
    const defaultDisplayName = `${firstName} ${lastName}`.trim();
    
    // 🔥 FETCH: Added bg_css to selection
    const { data: customerData } = await supabase
      .from('customers')
      .select('username, display_name, bio, theme_color, max_links, profile_picture_url, job_title, company, phone_number, display_email, bg_css')
      .eq('id', session.user.id)
      .single()

    setProfile({ first_name: firstName })

    let currentUsername = customerData?.username;
    let currentDisplayName = customerData?.display_name;
    let requiresBackgroundSave = false;

    if (!currentUsername) {
      currentUsername = generateDefaultUsername(firstName, lastName);
      requiresBackgroundSave = true;
    }

    if (!currentDisplayName && defaultDisplayName) {
      currentDisplayName = defaultDisplayName;
      requiresBackgroundSave = true;
    }

    if (requiresBackgroundSave) {
      await supabase.from('customers').upsert({
        id: session.user.id,
        username: currentUsername,
        display_name: currentDisplayName,
        theme_color: customerData?.theme_color || '#111111'
      });
    }

    setPageProfile({
      username: currentUsername, 
      display_name: currentDisplayName || '',
      bio: customerData?.bio || '', theme_color: customerData?.theme_color || '#111111',
      profile_picture_url: customerData?.profile_picture_url || '', job_title: customerData?.job_title || '',
      company: customerData?.company || '', phone_number: customerData?.phone_number || '', 
      display_email: customerData?.display_email || '', bg_css: customerData?.bg_css || ''
    })
    
    if (customerData?.max_links !== undefined) setMaxLinks(customerData.max_links)

    const { data: stickerData } = await supabase.from('nfc_stickers').select('*').eq('owner_id', session.user.id).order('id', { ascending: true })
    if (stickerData) setStickers(stickerData)

    const { data: linksData } = await supabase.from('page_links').select('*').eq('owner_id', session.user.id).order('sort_order', { ascending: true })
    if (linksData) setPageLinks(linksData)

    setLoading(false)
  }

  // 🔥 AI GENERATION LOGIC
  const handleGenerateAIBG = async () => {
    if (!aiPrompt) return alert("Please enter a vibe first!")
    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json()
      if (data.cssCode) {
        setPageProfile({ ...pageProfile, bg_css: data.cssCode })
        const { data: { session } } = await supabase.auth.getSession()
        await supabase.from('customers').update({ bg_css: data.cssCode }).eq('id', session.user.id)
        setAiPrompt('')
        alert("AI Background Generated! ✨ Check your public profile to see it.")
      }
    } catch (error) {
      alert("AI was too busy. Please try again in a moment.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleActivateTag = async () => {
    if (!claimId || claimPin.length < 8) return setClaimMessage("Please enter a valid Tag ID and 8-char Code.")
    setIsClaiming(true); setClaimMessage("Verifying vault...")
    const { data: { session } } = await supabase.auth.getSession()
    const defaultUrl = `https://linksupply.co.uk/u/${pageProfile.username}`;
    const { error, data } = await supabase.from('nfc_stickers')
      .update({ owner_id: session.user.id, target_url: defaultUrl })
      .eq('id', claimId.toUpperCase())
      .eq('activation_code', claimPin)
      .is('owner_id', null)
      .select()
    if (error || !data || data.length === 0) setClaimMessage("Error: Invalid Code or wrong ID.")
    else { setClaimMessage("Success! ✓"); setClaimId(''); setClaimPin(''); fetchData(); setTimeout(() => setClaimMessage(''), 3000) }
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
      alert("Failed to update.")
    }
  }

  const handleSaveProfile = async () => {
    setSaveStatus({ ...saveStatus, profile: 'Saving...' })
    const { data: { session } } = await supabase.auth.getSession()
    const cleanUsername = pageProfile.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    const { error } = await supabase.from('customers').upsert({ 
        id: session.user.id, username: cleanUsername, display_name: pageProfile.display_name,
        bio: pageProfile.bio, theme_color: pageProfile.theme_color, profile_picture_url: pageProfile.profile_picture_url,
        job_title: pageProfile.job_title, company: pageProfile.company, phone_number: pageProfile.phone_number, 
        display_email: pageProfile.display_email, bg_css: pageProfile.bg_css
      })
    if (error) { alert("Error: " + error.message); setSaveStatus({ ...saveStatus, profile: 'Error!' }) } 
    else { setSaveStatus({ ...saveStatus, profile: 'Saved! ✓' }); setTimeout(() => setSaveStatus((prev) => ({ ...prev, profile: '' })), 2000) }
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
    if (newPassword.length < 6) return setSettingsMessage("Too short.")
    setSettingsMessage("Updating...")
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setSettingsMessage("Error: " + error.message)
    else { setSettingsMessage("Success! ✓"); setNewPassword('') }
  }

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("GDPR NOTICE: Permanently delete account and all NFC links?")
    if (confirmDelete) { setSettingsMessage("Contact support to finalize."); }
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
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; }
        .responsive-stack { display: flex; gap: 12px; }
        .link-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; }
        .url-input-container { display: flex; align-items: center; background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; width: 100%; }
        .url-prefix { color: #6b7280; font-size: 15px; padding: 14px; font-weight: 500; border-right: 1px solid #e5e7eb; background-color: #f3f4f6; white-space: nowrap; }

        @media (max-width: 600px) {
          .responsive-nav { padding: 15px 20px; flex-direction: column; gap: 15px; }
          .responsive-tabs { flex-direction: column; }
          .responsive-grid { grid-template-columns: 1fr; }
          .responsive-stack { flex-direction: column; align-items: stretch; }
          .responsive-stack > input, .responsive-stack > button { width: 100% !important; }
          .header-stack { flex-direction: column; align-items: flex-start !important; }
          .link-row { flex-direction: column; align-items: flex-start; gap: 15px; }
        }
      `}</style>

      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Settings</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            <label style={labelStyle}>Change Password</label>
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{...inputStyle, marginBottom: '10px'}} />
            <button onClick={handleUpdatePassword} style={{ width: '100%', padding: '10px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px' }}>Update</button>
            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '20px', paddingTop: '20px' }}>
              <button onClick={handleDeleteAccount} style={{ width: '100%', padding: '10px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px' }}>Delete Account (GDPR)</button>
            </div>
          </div>
        </div>
      )}

      <nav className="responsive-nav">
        <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Link Supply.</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setShowSettings(true)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px' }}>⚙️ Settings</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px' }}>Log Out</button>
        </div>
      </nav>

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        <div className="responsive-tabs">
          <button onClick={() => setActiveTab('hardware')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', backgroundColor: activeTab === 'hardware' ? 'white' : 'transparent' }}>Hardware Tags</button>
          <button onClick={() => setActiveTab('page')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', backgroundColor: activeTab === 'page' ? 'white' : 'transparent' }}>Premium Page</button>
        </div>

        {activeTab === 'hardware' && (
          <div>
            <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', marginBottom: '40px', color: 'white' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Activate a New Tag</h2>
              <div className="responsive-stack" style={{ marginTop: '15px' }}>
                <input type="text" placeholder="Tag ID" value={claimId} onChange={(e) => setClaimId(e.target.value.toUpperCase())} style={{ flex: 1, padding: '14px', borderRadius: '8px', color: '#111' }} />
                <input type="text" maxLength="8" placeholder="8-Char Code" value={claimPin} onChange={(e) => setClaimPin(e.target.value.toUpperCase())} style={{ width: '160px', padding: '14px', borderRadius: '8px', color: '#111', textAlign: 'center' }} />
                <button onClick={handleActivateTag} disabled={isClaiming} style={{ padding: '14px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700' }}>Link Tag</button>
              </div>
              {claimMessage && <p style={{ marginTop: '15px', color: claimMessage.includes('Success') ? '#34d399' : '#f87171' }}>{claimMessage}</p>}
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>Your Products</h2>
            {stickers.map((sticker) => (
              <div key={sticker.id} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ fontWeight: '800' }}>{sticker.id} ({sticker.tap_count || 0} Taps)</span>
                  <button onClick={() => handleToggleActive(sticker.id, sticker.is_active)} style={{ background: 'none', border: 'none', color: sticker.is_active ? '#059669' : '#dc2626', fontWeight: '700' }}>{sticker.is_active ? '🟢 Active' : '🔴 Disabled'}</button>
                </div>
                <input type="url" defaultValue={sticker.target_url} onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: e.target.value } : s); setStickers(updated) }} style={inputStyle} />
                <button onClick={() => handleSaveHardwareChanges(sticker.id, sticker.target_url, sticker.tag_name)} style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px' }}>{saveStatus[sticker.id] || 'Save Destination'}</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'page' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* 🔥 AI DESIGN ASSISTANT SECTION */}
            <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', fontWeight: '700' }}>AI Design Assistant</h2>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>Describe your brand vibe (e.g., "80s Neon", "Luxury Gold", "Ocean Mist") to generate a custom background.</p>
              
              <div className="responsive-stack">
                <input 
                  type="text" 
                  placeholder="Describe your vibe..." 
                  value={aiPrompt} 
                  onChange={(e) => setAiPrompt(e.target.value)} 
                  style={{ flex: 1, padding: '14px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111' }} 
                />
                <button 
                  onClick={handleGenerateAIBG} 
                  disabled={isGenerating}
                  style={{ padding: '14px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {isGenerating ? 'Designing...' : 'Magic Generate'}
                </button>
              </div>
              
              {pageProfile.bg_css && (
                <button 
                  onClick={() => { setPageProfile({ ...pageProfile, bg_css: '' }); handleSaveProfile(); }}
                  style={{ marginTop: '15px', background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Reset to Default Mesh
                </button>
              )}
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Page Identity</h2>
              <div className="responsive-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Display Name</label>
                  <input type="text" value={pageProfile.display_name} onChange={(e) => setPageProfile({...pageProfile, display_name: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Profile Picture URL</label>
                  <input type="text" value={pageProfile.profile_picture_url} onChange={(e) => setPageProfile({...pageProfile, profile_picture_url: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Brand Color</label>
                  <input type="color" value={pageProfile.theme_color} onChange={(e) => setPageProfile({...pageProfile, theme_color: e.target.value})} style={{ width: '50px', height: '50px', border: 'none', borderRadius: '8px' }} />
                </div>
              </div>
              <button onClick={handleSaveProfile} style={{ marginTop: '25px', padding: '14px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', width: '100%', fontWeight: '700' }}>
                {saveStatus.profile || 'Save Profile Info'}
              </button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Your Links ({pageLinks.length} / {displayLimit})</h2>
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pageLinks.map((link) => (
                  <div key={link.id} className="link-row">
                    <div style={{ overflow: 'hidden' }}><strong>{link.title}</strong><br/><small>{link.url}</small></div>
                    <button onClick={() => handleDeleteLink(link.id)} style={{ color: '#dc2626', border: 'none', background: 'none', fontWeight: '700' }}>Delete</button>
                  </div>
                ))}
              </div>
              {!isAtLimit && (
                <form onSubmit={handleAddLink} className="responsive-stack" style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '12px' }}>
                  <input required placeholder="Title" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} style={inputStyle} />
                  <input required placeholder="URL" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} style={inputStyle} />
                  <button type="submit" style={{ padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px' }}>+ Add</button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
      <footer style={{ textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
        GDPR Compliant • Data secured by Supabase
      </footer>
    </div>
  )
}
