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
  
  // 🔥 AI ADDITIONS (Minimum changes)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const [pageProfile, setPageProfile] = useState({ 
    username: '', display_name: '', bio: '', theme_color: '#111111',
    profile_picture_url: '', job_title: '', company: '', phone_number: '', display_email: '',
    bg_css: '' // Added for AI
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
      const { data: tagData } = await supabase
        .from('nfc_stickers')
        .select('id')
        .eq('url_slug', claimParam)
        .single()
      if (tagData) setClaimId(tagData.id) 
    }

    const firstName = session.user.user_metadata?.first_name || '';
    const lastName = session.user.user_metadata?.last_name || '';
    const defaultDisplayName = `${firstName} ${lastName}`.trim();
    
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
      company: customerData?.company || '', phone_number: customerData?.phone_number || '', display_email: customerData?.display_email || '',
      bg_css: customerData?.bg_css || ''
    })
    
    if (customerData?.max_links !== undefined) setMaxLinks(customerData.max_links)

    const { data: stickerData } = await supabase.from('nfc_stickers').select('*').eq('owner_id', session.user.id).order('id', { ascending: true })
    if (stickerData) setStickers(stickerData)

    const { data: linksData } = await supabase.from('page_links').select('*').eq('owner_id', session.user.id).order('sort_order', { ascending: true })
    if (linksData) setPageLinks(linksData)

    setLoading(false)
  }

  // 🔥 AI LOGIC (Injected)
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
        alert("AI Background Generated! ✨")
      }
    } catch (error) {
      alert("AI Error. Try again.")
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
    if (error || !data || data.length === 0) setClaimMessage("Error: Invalid Code, wrong ID, or tag is already owned.")
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
        job_title: pageProfile.job_title, company: pageProfile.company, phone_number: pageProfile.phone_number, display_email: pageProfile.display_email,
        bg_css: pageProfile.bg_css // Keep AI background
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
    const confirmDelete = window.confirm("GDPR NOTICE: Are you absolutely sure?")
    if (confirmDelete) { setSettingsMessage("Contact support to finalize."); }
  }

  const isAtLimit = pageLinks.length >= maxLinks
  const displayLimit = maxLinks > 100 ? 'Unlimited' : maxLinks
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>Loading...</div>

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
          .responsive-stack { flex-direction: column; }
        }
      `}</style>

      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <h2>Settings</h2>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
            <button onClick={handleUpdatePassword} style={{ width: '100%', padding: '10px', marginTop: '10px' }}>Update</button>
            <button onClick={() => setShowSettings(false)} style={{ marginTop: '10px' }}>Close</button>
          </div>
        </div>
      )}

      <nav className="responsive-nav">
        <h1>Link Supply.</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setShowSettings(true)}>⚙️ Settings</button>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        <div className="responsive-tabs">
          <button onClick={() => setActiveTab('hardware')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'hardware' ? 'white' : 'transparent' }}>Hardware</button>
          <button onClick={() => setActiveTab('page')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'page' ? 'white' : 'transparent' }}>Page</button>
        </div>

        {activeTab === 'hardware' && (
          <div>
            <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', color: 'white' }}>
              <h2>Activate Tag</h2>
              <div className="responsive-stack">
                <input type="text" value={claimId} onChange={(e) => setClaimId(e.target.value.toUpperCase())} style={{ flex: 1, padding: '10px' }} />
                <input type="text" value={claimPin} onChange={(e) => setClaimPin(e.target.value.toUpperCase())} style={{ width: '100px', padding: '10px' }} />
                <button onClick={handleActivateTag}>Link Tag</button>
              </div>
            </div>
            {stickers.map(sticker => (
              <div key={sticker.id} style={{ backgroundColor: 'white', padding: '20px', marginTop: '20px', borderRadius: '10px' }}>
                <strong>{sticker.id}</strong>
                <input type="url" defaultValue={sticker.target_url} onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: e.target.value } : s); setStickers(updated) }} style={inputStyle} />
                <button onClick={() => handleSaveHardwareChanges(sticker.id, sticker.target_url, sticker.tag_name)}>Save</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'page' && (
          <div>
            {/* 🔥 AI BOX (Only Addition) */}
            <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', color: 'white', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>AI Assistant</h2>
              <div className="responsive-stack">
                <input type="text" placeholder="Describe vibe..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} style={{ flex: 1, padding: '10px' }} />
                <button onClick={handleGenerateAIBG} disabled={isGenerating}>{isGenerating ? '...' : 'Magic'}</button>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px' }}>
              <h2>Page Identity</h2>
              <input type="text" value={pageProfile.display_name} onChange={(e) => setPageProfile({...pageProfile, display_name: e.target.value})} style={inputStyle} />
              <input type="color" value={pageProfile.theme_color} onChange={(e) => setPageProfile({...pageProfile, theme_color: e.target.value})} style={{ marginTop: '10px' }} />
              <button onClick={handleSaveProfile} style={{ width: '100%', marginTop: '20px' }}>{saveStatus.profile || 'Save'}</button>
            </div>
            
            <div style={{ backgroundColor: 'white', padding: '30px', marginTop: '20px', borderRadius: '16px' }}>
              <h2>Links</h2>
              {pageLinks.map(link => (
                <div key={link.id} className="link-row" style={{ marginTop: '10px' }}>
                  <span>{link.title}</span>
                  <button onClick={() => handleDeleteLink(link.id)}>Delete</button>
                </div>
              ))}
              {!isAtLimit && (
                <form onSubmit={handleAddLink} style={{ marginTop: '20px' }}>
                  <input placeholder="Title" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} />
                  <input placeholder="URL" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} />
                  <button type="submit">Add</button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
