'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function PremiumDashboard() {
  const [activeTab, setActiveTab] = useState('hardware') // 'hardware' or 'page'
  
  // Hardware State
  const [stickers, setStickers] = useState([])
  const [claimId, setClaimId] = useState('')
  const [claimPin, setClaimPin] = useState('')
  const [claimMessage, setClaimMessage] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)
  
  // Premium Page State
  const [pageProfile, setPageProfile] = useState({ username: '', bio: '', theme_color: '#111111' })
  const [pageLinks, setPageLinks] = useState([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  // Global State
  const [profile, setProfile] = useState(null)
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
      setActiveTab('hardware') // Auto-switch to hardware tab if claiming
    }
  }, [])

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return router.push('/login') 

    const firstName = session.user.user_metadata?.first_name
    
    // 1. Fetch Customer Profile (including new premium page data)
    const { data: customerData } = await supabase
      .from('customers')
      .select('username, bio, theme_color')
      .eq('id', session.user.id)
      .single()

    setProfile({ first_name: firstName })
    if (customerData) {
      setPageProfile({
        username: customerData.username || '',
        bio: customerData.bio || '',
        theme_color: customerData.theme_color || '#111111'
      })
    }

    // 2. Fetch Hardware Tags
    const { data: stickerData } = await supabase
      .from('nfc_stickers')
      .select('id, target_url, product_type, tap_count, last_tapped_at, url_slug, tag_name')
      .eq('owner_id', session.user.id)
      .order('id', { ascending: true })
    if (stickerData) setStickers(stickerData)

    // 3. Fetch Premium Page Links
    const { data: linksData } = await supabase
      .from('page_links')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('sort_order', { ascending: true })
    if (linksData) setPageLinks(linksData)

    setLoading(false)
  }

  // --- HARDWARE FUNCTIONS ---
  const handleActivateTag = async () => {
    if (!claimId || claimPin.length < 4) return setClaimMessage("Please enter a valid Tag ID and 4-digit PIN.")
    setIsClaiming(true)
    setClaimMessage("Verifying vault...")
    const { data: { session } } = await supabase.auth.getSession()

    const { error, data } = await supabase.from('nfc_stickers')
      .update({ owner_id: session.user.id }) 
      .eq('id', claimId.toUpperCase()).eq('claim_pin', claimPin).is('owner_id', null).select()

    if (error || !data || data.length === 0) {
      setClaimMessage("Error: Invalid PIN, wrong ID, or tag is already owned.")
    } else {
      setClaimMessage("Success! Tag linked to your account. ✓")
      setClaimId(''); setClaimPin(''); fetchData(); setTimeout(() => setClaimMessage(''), 3000)
    }
    setIsClaiming(false)
  }

  const handleSaveHardwareChanges = async (id, newUrl, newName) => {
    setSaveStatus({ ...saveStatus, [id]: 'Saving...' })
    const { error } = await supabase.from('nfc_stickers').update({ target_url: newUrl, tag_name: newName }).eq('id', id)
    if (error) setSaveStatus({ ...saveStatus, [id]: 'Error!' })
    else {
      setSaveStatus({ ...saveStatus, [id]: 'Saved! ✓' })
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [id]: '' })), 2000)
    }
  }

  // --- PREMIUM PAGE FUNCTIONS ---
  const handleSaveProfile = async () => {
    setSaveStatus({ ...saveStatus, profile: 'Saving...' })
    const { data: { session } } = await supabase.auth.getSession()
    
    // Clean username (lowercase, no spaces)
    const cleanUsername = pageProfile.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    
    // THE FIX: We use UPSERT to create the row if it doesn't exist yet!
    const { error } = await supabase.from('customers')
      .upsert({ 
        id: session.user.id, 
        username: cleanUsername, 
        bio: pageProfile.bio, 
        theme_color: pageProfile.theme_color 
      })

    if (error) {
      alert("Database Error: " + error.message)
      setSaveStatus({ ...saveStatus, profile: 'Error!' })
    } else {
      setPageProfile({ ...pageProfile, username: cleanUsername })
      setSaveStatus({ ...saveStatus, profile: 'Saved! ✓' })
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, profile: '' })), 2000)
    }
  }

  const handleAddLink = async (e) => {
    e.preventDefault()
    if (!newLinkTitle || !newLinkUrl) return
    const { data: { session } } = await supabase.auth.getSession()

    const { error } = await supabase.from('page_links').insert([{ 
      owner_id: session.user.id, 
      title: newLinkTitle, 
      url: newLinkUrl,
      sort_order: pageLinks.length 
    }])

    if (!error) {
      setNewLinkTitle('')
      setNewLinkUrl('')
      fetchData() // Refresh list
    }
  }

  const handleDeleteLink = async (linkId) => {
    const { error } = await supabase.from('page_links').delete().eq('id', linkId)
    if (!error) fetchData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>Loading Workspace...</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
      
      {/* NAVBAR */}
      <nav style={{ backgroundColor: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#111', margin: 0, letterSpacing: '-0.5px' }}>Link Supply.</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#4b5563', fontWeight: '500', fontSize: '15px' }}>Hello, {profile?.first_name || 'User'}</span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Log Out</button>
        </div>
      </nav>

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        
        {/* TAB CONTROLS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', backgroundColor: '#e5e7eb', padding: '6px', borderRadius: '12px' }}>
          <button 
            onClick={() => setActiveTab('hardware')}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'hardware' ? 'white' : 'transparent', color: activeTab === 'hardware' ? '#111' : '#6b7280', boxShadow: activeTab === 'hardware' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
          >
            My Hardware Tags
          </button>
          <button 
            onClick={() => setActiveTab('page')}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'page' ? 'white' : 'transparent', color: activeTab === 'page' ? '#111' : '#6b7280', boxShadow: activeTab === 'page' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
          >
            My Premium Page
          </button>
        </div>

        {/* ==========================================
            TAB 1: HARDWARE MANAGEMENT 
        ========================================== */}
        {activeTab === 'hardware' && (
          <div>
            <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', marginBottom: '40px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', fontWeight: '700' }}>Activate a New Tag</h2>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>Enter the Tag ID and the 4-digit PIN included in your packaging.</p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Tag ID (e.g. LS-005)" value={claimId} onChange={(e) => setClaimId(e.target.value)} style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111', minWidth: '200px' }} />
                <input type="text" maxLength="4" placeholder="4-Digit PIN" value={claimPin} onChange={(e) => setClaimPin(e.target.value)} style={{ width: '150px', padding: '12px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111', textAlign: 'center', letterSpacing: '3px' }} />
                <button onClick={handleActivateTag} disabled={isClaiming} style={{ padding: '0 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', minWidth: '140px' }}>
                  {isClaiming ? 'Verifying...' : 'Link to Account'}
                </button>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: '#111' }}>{sticker.id}</span>
                      </div>
                      <a href={`/go/${sticker.url_slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600', padding: '8px 16px', backgroundColor: '#e0e7ff', borderRadius: '8px' }}>Preview Link ↗</a>
                    </div>
                    <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>Tag Name (Optional)</label>
                        <input type="text" defaultValue={sticker.tag_name || ''} placeholder="e.g., Table 5" onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, tag_name: e.target.value } : s); setStickers(updated) }} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>Destination URL</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <input type="url" defaultValue={sticker.target_url || ''} placeholder="https://your-link.com" onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: e.target.value } : s); setStickers(updated) }} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '16px', color: '#111', outline: 'none' }} />
                          <button onClick={() => handleSaveHardwareChanges(sticker.id, sticker.target_url, sticker.tag_name)} style={{ padding: '0 24px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', minWidth: '140px' }}>{saveStatus[sticker.id] || 'Save Changes'}</button>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>💡 Pro Tip: Point this to <b>{typeof window !== 'undefined' ? window.location.host : 'linksupply.com'}/u/{pageProfile.username || 'your-username'}</b> to use your new Premium Page!</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 2: PREMIUM PAGE EDITOR 
        ========================================== */}
        {activeTab === 'page' && (
          <div>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', marginBottom: '20px' }}>Page Identity</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>Public Username (URL)</label>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 14px' }}>
                    <span style={{ color: '#6b7280', fontSize: '16px' }}>{typeof window !== 'undefined' ? window.location.host : 'linksupply.com'}/u/</span>
                    <input type="text" value={pageProfile.username} placeholder="mybrand" onChange={(e) => setPageProfile({...pageProfile, username: e.target.value})} style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', fontSize: '16px', color: '#111', outline: 'none', fontWeight: '600' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>Short Bio</label>
                  <textarea value={pageProfile.bio} placeholder="Welcome to our restaurant! Check out our menus and socials below." onChange={(e) => setPageProfile({...pageProfile, bio: e.target.value})} rows="3" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>Brand Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input type="color" value={pageProfile.theme_color} onChange={(e) => setPageProfile({...pageProfile, theme_color: e.target.value})} style={{ width: '50px', height: '50px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                    <button onClick={handleSaveProfile} style={{ padding: '12px 24px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>{saveStatus.profile || 'Save Profile Info'}</button>
                  </div>
                </div>

              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', marginBottom: '5px' }}>Your Links</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Add all the links you want to display to your customers.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                {pageLinks.length === 0 ? (
                  <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '10px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No links added yet. Create your first one below!</div>
                ) : (
                  pageLinks.map((link) => (
                    <div key={link.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
                      <div>
                        <p style={{ fontWeight: '700', color: '#111', margin: '0 0 5px 0' }}>{link.title}</p>
                        <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>{link.url}</p>
                      </div>
                      <button onClick={() => handleDeleteLink(link.id)} style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Delete</button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddLink} style={{ display: 'flex', gap: '15px', backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '12px', flexWrap: 'wrap' }}>
                <input required type="text" placeholder="Link Title (e.g. Dinner Menu)" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }} />
                <input required type="url" placeholder="https://..." value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} style={{ flex: 2, minWidth: '200px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }} />
                <button type="submit" style={{ padding: '0 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', minWidth: '120px' }}>+ Add Link</button>
              </form>
            </div>
            
          </div>
        )}

      </main>
    </div>
  )
}
