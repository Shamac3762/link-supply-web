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
  
  // 🔥 NEW: Added display_name to state
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

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchData()
    const params = new URLSearchParams(window.location.search)
    const urlClaimId = params.get('claim')
    if (urlClaimId) {
      setClaimId(urlClaimId)
      setActiveTab('hardware') 
    }
  }, [])

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      const params = new URLSearchParams(window.location.search)
      const claimParam = params.get('claim')
      if (claimParam) return router.push(`/login?claim=${claimParam}`)
      return router.push('/login') 
    }

    const firstName = session.user.user_metadata?.first_name
    
    // 🔥 NEW: Fetch display_name
    const { data: customerData } = await supabase
      .from('customers')
      .select('username, display_name, bio, theme_color, max_links, profile_picture_url, job_title, company, phone_number, display_email')
      .eq('id', session.user.id)
      .single()

    setProfile({ first_name: firstName })
    if (customerData) {
      setPageProfile({
        username: customerData.username || '',
        display_name: customerData.display_name || '',
        bio: customerData.bio || '',
        theme_color: customerData.theme_color || '#111111',
        profile_picture_url: customerData.profile_picture_url || '',
        job_title: customerData.job_title || '',
        company: customerData.company || '',
        phone_number: customerData.phone_number || '',
        display_email: customerData.display_email || ''
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
    if (!claimId || claimPin.length < 8) return setClaimMessage("Please enter a valid Tag ID and 8-character Activation Code.")
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

  const handleSaveProfile = async () => {
    setSaveStatus({ ...saveStatus, profile: 'Saving...' })
    const { data: { session } } = await supabase.auth.getSession()
    const cleanUsername = pageProfile.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    
    // 🔥 NEW: Save display_name to database
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

  const isAtLimit = pageLinks.length >= maxLinks
  const displayLimit = maxLinks > 100 ? 'Unlimited' : maxLinks
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>Loading Workspace...</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
      <nav style={{ backgroundColor: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#111', margin: 0, letterSpacing: '-0.5px' }}>Link Supply.</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#4b5563', fontWeight: '500', fontSize: '15px' }}>Hello, {profile?.first_name || 'User'}</span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Log Out</button>
        </div>
      </nav>

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', backgroundColor: '#e5e7eb', padding: '6px', borderRadius: '12px' }}>
          <button onClick={() => setActiveTab('hardware')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'hardware' ? 'white' : 'transparent', color: activeTab === 'hardware' ? '#111' : '#6b7280', boxShadow: activeTab === 'hardware' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>My Hardware Tags</button>
          <button onClick={() => setActiveTab('page')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'page' ? 'white' : 'transparent', color: activeTab === 'page' ? '#111' : '#6b7280', boxShadow: activeTab === 'page' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>My Premium Page</button>
        </div>

        {activeTab === 'hardware' && (
          // ... (Hardware tab unchanged)
          <div>
            <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', marginBottom: '40px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', fontWeight: '700' }}>Activate a New Tag</h2>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>Enter the Tag ID and the 8-character Activation Code included in your packaging.</p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Tag ID (e.g. LS-005)" value={claimId} onChange={(e) => setClaimId(e.target.value.toUpperCase())} style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111', minWidth: '200px' }} />
                <input type="text" maxLength="8" placeholder="8-Char Code" value={claimPin} onChange={(e) => setClaimPin(e.target.value.toUpperCase())} style={{ width: '160px', padding: '12px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase' }} />
                <button onClick={handleActivateTag} disabled={isClaiming} style={{ padding: '0 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', minWidth: '140px' }}>{isClaiming ? 'Verifying...' : 'Link to Account'}</button>
              </div>
              {claimMessage && <p style={{ marginTop: '15px', color: claimMessage.includes('Success') ? '#34d399' : '#f87171', fontWeight: '600', fontSize: '14px' }}>{claimMessage}</p>}
            </div>

            <h2 style={{ fontSize: '24px', color: '#111', margin: '0 0 20px 0', fontWeight: '700', letterSpacing: '-0.5px' }}>Your Products</h2>
            {stickers.length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb' }}><p style={{ color: '#6b7280' }}>Activate your first tag above to get started.</p></div>
            ) : (
              <div style={{ display: 'grid', gap: '25px' }}>
                {stickers.map((sticker) => (
                  <div key={sticker.id} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ fontSize: '20px', fontWeight: '700', color: '#111' }}>{sticker.id}</span></div>
                      <a href={`/go/${sticker.url_slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600', padding: '8px 16px', backgroundColor: '#e0e7ff', borderRadius: '8px' }}>Preview Link ↗</a>
                    </div>
                    <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <label style={labelStyle}>Tag Name (Optional)</label>
                        <input type="text" defaultValue={sticker.tag_name || ''} placeholder="e.g., Table 5" onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, tag_name: e.target.value } : s); setStickers(updated) }} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Destination URL</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <input type="url" defaultValue={sticker.target_url || ''} placeholder="https://your-link.com" onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: e.target.value } : s); setStickers(updated) }} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '16px', color: '#111', outline: 'none' }} />
                          <button onClick={() => handleSaveHardwareChanges(sticker.id, sticker.target_url, sticker.tag_name)} style={{ padding: '0 24px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', minWidth: '140px' }}>{saveStatus[sticker.id] || 'Save Changes'}</button>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>💡 Pro Tip: Point this to <b>{typeof window !== 'undefined' ? window.location.host : 'linksupply.com'}/u/{pageProfile.username || 'your-username'}</b></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'page' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Page Identity</h2>
                <button onClick={handleSaveProfile} style={{ padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{saveStatus.profile || 'Save All Profile Info'}</button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* 🔥 NEW: Display Name Input */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Full Name / Display Name</label>
                  <input type="text" value={pageProfile.display_name} placeholder="e.g. John Doe or Acme Corp" onChange={(e) => setPageProfile({...pageProfile, display_name: e.target.value})} style={inputStyle} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Public Username (URL)</label>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 14px' }}>
                    <span style={{ color: '#6b7280', fontSize: '16px' }}>{typeof window !== 'undefined' ? window.location.host : 'linksupply.com'}/u/</span>
                    <input type="text" value={pageProfile.username} placeholder="mybrand" onChange={(e) => setPageProfile({...pageProfile, username: e.target.value})} style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', fontSize: '16px', color: '#111', outline: 'none', fontWeight: '600' }} />
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
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', marginBottom: '5px' }}>Digital Business Card</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Fill these out to add a "Save to Contacts" button to your profile.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={labelStyle}>Job Title</label><input type="text" value={pageProfile.job_title} placeholder="e.g. Sales Director" onChange={(e) => setPageProfile({...pageProfile, job_title: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Company / Business Name</label><input type="text" value={pageProfile.company} placeholder="e.g. Acme Corp or Freelance" onChange={(e) => setPageProfile({...pageProfile, company: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Phone Number</label><input type="tel" value={pageProfile.phone_number} placeholder="+44 7700 900077" onChange={(e) => setPageProfile({...pageProfile, phone_number: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Display Email</label><input type="email" value={pageProfile.display_email} placeholder="hello@example.com" onChange={(e) => setPageProfile({...pageProfile, display_email: e.target.value})} style={inputStyle} /></div>
              </div>
            </div>

            {/* ... (Links Section Remains Unchanged) ... */}
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Your Links</h2>
                <span style={{ fontSize: '14px', fontWeight: '600', color: isAtLimit && maxLinks <= 100 ? '#dc2626' : '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>{pageLinks.length} / {displayLimit} Used</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Add all the links you want to display to your customers.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                {pageLinks.length === 0 ? <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '10px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No links added yet.</div> : pageLinks.map((link) => (
                    <div key={link.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
                      <div><p style={{ fontWeight: '700', color: '#111', margin: '0 0 5px 0' }}>{link.title}</p><p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>{link.url}</p></div>
                      <button onClick={() => handleDeleteLink(link.id)} style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Delete</button>
                    </div>
                ))}
              </div>

              {isAtLimit ? (
                <div style={{ padding: '30px', backgroundColor: '#111', color: 'white', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔒</div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '700' }}>Unlock Unlimited Links</h3>
                  <button onClick={() => alert("Stripe checkout coming soon!")} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', transition: '0.2s', width: '100%' }}>Upgrade to Premium — £5/mo</button>
                </div>
              ) : (
                <form onSubmit={handleAddLink} style={{ display: 'flex', gap: '15px', backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '12px', flexWrap: 'wrap' }}>
                  <input required type="text" placeholder="Link Title" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }} />
                  <input required type="url" placeholder="https://..." value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} style={{ flex: 2, minWidth: '200px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }} />
                  <button type="submit" style={{ padding: '0 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', minWidth: '120px' }}>+ Add Link</button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
