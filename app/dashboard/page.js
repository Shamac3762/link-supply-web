'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'

// HELPER: Contrast Engine
function getContrastColor(hexcolor) {
  if (!hexcolor || hexcolor.startsWith('linear') || hexcolor.startsWith('radial')) return 'white';
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#111111' : 'white'; 
}

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
    
    const { data: customerData } = await supabase
      .from('customers')
      .select('username, display_name, bio, theme_color, max_links, profile_picture_url, job_title, company, phone_number, display_email')
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
      company: customerData?.company || '', phone_number: customerData?.phone_number || '', display_email: customerData?.display_email || ''
    })
    
    if (customerData?.max_links !== undefined) setMaxLinks(customerData.max_links)

    const { data: stickerData } = await supabase.from('nfc_stickers').select('*').eq('owner_id', session.user.id).order('id', { ascending: true })
    if (stickerData) setStickers(stickerData)

    const { data: linksData } = await supabase.from('page_links').select('*').eq('owner_id', session.user.id).order('sort_order', { ascending: true })
    if (linksData) setPageLinks(linksData)

    setLoading(false)
  }

  const handleActivateTag = async () => {
    if (!claimId || claimPin.length < 8) return setClaimMessage("Invalid Tag ID or Code.")
    setIsClaiming(true); setClaimMessage("Verifying...")
    const { data: { session } } = await supabase.auth.getSession()
    const defaultUrl = `https://linksupply.co.uk/u/${pageProfile.username}`;
    const { error, data } = await supabase.from('nfc_stickers')
      .update({ owner_id: session.user.id, target_url: defaultUrl })
      .eq('id', claimId.toUpperCase()).eq('activation_code', claimPin).is('owner_id', null).select()

    if (error || !data || data.length === 0) setClaimMessage("Activation failed.")
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
    const { error } = await supabase.from('nfc_stickers').update({ is_active: newState }).eq('id', id)
    if (!error) fetchData()
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
    if (!error) { setPageProfile({ ...pageProfile, username: cleanUsername }); setSaveStatus({ ...saveStatus, profile: 'Saved! ✓' }); setTimeout(() => setSaveStatus((prev) => ({ ...prev, profile: '' })), 2000) }
  }

  const handleAddLink = async (e) => {
    e.preventDefault()
    if (!newLinkTitle || !newLinkUrl || pageLinks.length >= maxLinks) return
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('page_links').insert([{ owner_id: session.user.id, title: newLinkTitle, url: newLinkUrl, sort_order: pageLinks.length }])
    if (!error) { setNewLinkTitle(''); setNewLinkUrl(''); fetchData() }
  }

  const handleDeleteLink = async (linkId) => {
    const { error } = await supabase.from('page_links').delete().eq('id', linkId)
    if (!error) fetchData()
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const isAtLimit = pageLinks.length >= maxLinks
  const displayLimit = maxLinks > 100 ? 'Unlimited' : maxLinks
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', paddingBottom: '50px', overflowX: 'hidden' }}>
      
      <style>{`
        * { box-sizing: border-box; }
        .responsive-nav { padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; background-color: white; }
        .responsive-tabs { display: flex; gap: 10px; margin-bottom: 30px; background-color: #e5e7eb; padding: 6px; border-radius: 12px; }
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; }
        .responsive-stack { display: flex; gap: 12px; width: 100%; }
        .link-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; }
        .url-input-container { display: flex; align-items: center; background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; width: 100%; }
        .url-prefix { color: #6b7280; font-size: 15px; padding: 14px; font-weight: 500; border-right: 1px solid #e5e7eb; background-color: #f3f4f6; white-space: nowrap; }

        @media (max-width: 600px) {
          .responsive-nav { padding: 15px 20px; flex-direction: column; gap: 15px; }
          .responsive-tabs { flex-direction: column; }
          .responsive-grid { grid-template-columns: 1fr; }
          .responsive-stack { flex-direction: column; align-items: stretch; }
          .responsive-stack > input, .responsive-stack > button { width: 100% !important; max-width: 100% !important; }
          .header-stack { flex-direction: column; align-items: flex-start !important; gap: 15px; width: 100%; }
          .link-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .url-input-container { flex-direction: column; align-items: stretch; }
          .url-prefix { border-right: none; border-bottom: 1px solid #e5e7eb; font-size: 13px; padding: 10px 14px; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="responsive-nav">
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#111', margin: 0 }}>Link Supply.</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setShowSettings(true)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>⚙️ Settings</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Log Out</button>
        </div>
      </nav>

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        <div className="responsive-tabs">
          <button onClick={() => setActiveTab('hardware')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', backgroundColor: activeTab === 'hardware' ? 'white' : 'transparent', color: activeTab === 'hardware' ? '#111' : '#6b7280' }}>My Hardware Tags</button>
          <button onClick={() => setActiveTab('page')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', backgroundColor: activeTab === 'page' ? 'white' : 'transparent', color: activeTab === 'page' ? '#111' : '#6b7280' }}>My Premium Page</button>
        </div>

        {activeTab === 'hardware' && (
          <div style={{ width: '100%' }}>
            {/* ACTIVATE SECTION */}
            <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', marginBottom: '40px', color: 'white', width: '100%' }}>
              <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', fontWeight: '700' }}>Activate a New Tag</h2>
              <div className="responsive-stack" style={{ marginTop: '20px' }}>
                <input type="text" placeholder="Tag ID" value={claimId} onChange={(e) => setClaimId(e.target.value.toUpperCase())} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none' }} />
                <input type="text" maxLength="8" placeholder="Code" value={claimPin} onChange={(e) => setClaimPin(e.target.value.toUpperCase())} style={{ width: '120px', padding: '14px', borderRadius: '8px', border: 'none', textAlign: 'center' }} />
                <button onClick={handleActivateTag} style={{ padding: '14px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700' }}>Link Tag</button>
              </div>
              {claimMessage && <p style={{ marginTop: '10px', fontSize: '14px' }}>{claimMessage}</p>}
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>Your Products</h2>
            <div style={{ display: 'grid', gap: '25px', width: '100%' }}>
              {stickers.map((sticker) => {
                const isEnabled = sticker.is_active !== false;
                return (
                  <div key={sticker.id} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800' }}>{sticker.id}</span>
                      <button onClick={() => handleToggleActive(sticker.id, isEnabled)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '700', backgroundColor: isEnabled ? '#d1fae5' : '#fee2e2', color: isEnabled ? '#059669' : '#dc2626' }}>{isEnabled ? '🟢 Active' : '🔴 Disabled'}</button>
                    </div>
                    
                    <div style={{ width: '100%' }}>
                      <label style={labelStyle}>Destination URL</label>
                      <div className="responsive-stack">
                        <input type="url" defaultValue={sticker.target_url} onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: e.target.value } : s); setStickers(updated) }} style={{...inputStyle, flex: 1}} />
                        <button onClick={() => handleSaveHardwareChanges(sticker.id, sticker.target_url, sticker.tag_name)} style={{ padding: '12px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600' }}>{saveStatus[sticker.id] || 'Save'}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'page' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Page Identity</h2>
              <div className="responsive-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" value={pageProfile.display_name} onChange={(e) => setPageProfile({...pageProfile, display_name: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Public Username</label>
                  <div className="url-input-container">
                    <span className="url-prefix">linksupply.co.uk/u/</span>
                    <input type="text" value={pageProfile.username} onChange={(e) => setPageProfile({...pageProfile, username: e.target.value})} style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: 'transparent', fontSize: '16px', color: '#111', outline: 'none', fontWeight: '600' }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Brand Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input type="color" value={pageProfile.theme_color} onChange={(e) => setPageProfile({...pageProfile, theme_color: e.target.value})} style={{ width: '50px', height: '50px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                    <div style={{ padding: '8px 15px', borderRadius: '8px', backgroundColor: pageProfile.theme_color, color: getContrastColor(pageProfile.theme_color), fontSize: '12px', fontWeight: 'bold' }}>Preview</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Business Card Details</h2>
              <div className="responsive-grid">
                <input type="text" placeholder="Job Title" value={pageProfile.job_title} onChange={(e) => setPageProfile({...pageProfile, job_title: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Company" value={pageProfile.company} onChange={(e) => setPageProfile({...pageProfile, company: e.target.value})} style={inputStyle} />
                <input type="tel" placeholder="Phone" value={pageProfile.phone_number} onChange={(e) => setPageProfile({...pageProfile, phone_number: e.target.value})} style={inputStyle} />
                <input type="email" placeholder="Email" value={pageProfile.display_email} onChange={(e) => setPageProfile({...pageProfile, display_email: e.target.value})} style={inputStyle} />
              </div>
              <button onClick={handleSaveProfile} style={{ marginTop: '30px', padding: '16px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', width: '100%', fontSize: '16px' }}>{saveStatus.profile || 'Update Public Profile'}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
