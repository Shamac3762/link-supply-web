'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function PremiumDashboard() {
  const [stickers, setStickers] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState({}) 
  
  const [claimId, setClaimId] = useState('')
  const [claimPin, setClaimPin] = useState('')
  const [claimMessage, setClaimMessage] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchData()
    const params = new URLSearchParams(window.location.search)
    const urlClaimId = params.get('claim')
    if (urlClaimId) setClaimId(urlClaimId)
  }, [])

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return router.push('/login') 

    const { data: customerData } = await supabase
      .from('customers')
      .select('first_name')
      .eq('id', session.user.id)
      .single()
    if (customerData) setProfile(customerData)

    const { data: stickerData } = await supabase
      .from('nfc_stickers')
      .select('id, target_url, product_type, tap_count, last_tapped_at, url_slug, tag_name')
      .eq('owner_id', session.user.id)
      .order('id', { ascending: true })

    if (stickerData) setStickers(stickerData)
    setLoading(false)
  }

  const handleActivateTag = async () => {
    if (!claimId || claimPin.length < 4) {
      return setClaimMessage("Please enter a valid Tag ID and 4-digit PIN.")
    }
    setIsClaiming(true)
    setClaimMessage("Verifying vault...")

    const { data: { session } } = await supabase.auth.getSession()

    const { error, data } = await supabase
      .from('nfc_stickers')
      .update({ owner_id: session.user.id }) 
      .eq('id', claimId.toUpperCase())       
      .eq('claim_pin', claimPin)             
      .is('owner_id', null)                  
      .select()

    if (error || !data || data.length === 0) {
      setClaimMessage("Error: Invalid PIN, wrong ID, or tag is already owned.")
    } else {
      setClaimMessage("Success! Tag linked to your account. ✓")
      setClaimId('')
      setClaimPin('')
      fetchData() 
      setTimeout(() => setClaimMessage(''), 3000)
    }
    setIsClaiming(false)
  }

  // UPDATED: Now saves BOTH the URL and the Tag Name at the same time
  const handleSaveChanges = async (id, newUrl, newName) => {
    setSaveStatus({ ...saveStatus, [id]: 'Saving...' })
    const { error } = await supabase
      .from('nfc_stickers')
      .update({ target_url: newUrl, tag_name: newName })
      .eq('id', id)
      
    if (error) setSaveStatus({ ...saveStatus, [id]: 'Error!' })
    else {
      setSaveStatus({ ...saveStatus, [id]: 'Saved! ✓' })
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [id]: '' })), 2000)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatType = (type) => {
    if (!type) return "Tag"
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Never Scanned"
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    return new Date(dateString).toLocaleDateString('en-US', options)
  }

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
        
        <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', marginTop: '40px', marginBottom: '40px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', fontWeight: '700' }}>Activate a New Tag</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>Enter the Tag ID and the 4-digit PIN included in your packaging.</p>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Tag ID (e.g. LS-005)" 
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111', minWidth: '200px' }}
            />
            <input 
              type="text" 
              maxLength="4"
              placeholder="4-Digit PIN" 
              value={claimPin}
              onChange={(e) => setClaimPin(e.target.value)}
              style={{ width: '150px', padding: '12px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111', textAlign: 'center', letterSpacing: '3px' }}
            />
            <button 
              onClick={handleActivateTag}
              disabled={isClaiming}
              style={{ padding: '0 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', minWidth: '140px' }}
            >
              {isClaiming ? 'Verifying...' : 'Link to Account'}
            </button>
          </div>
          {claimMessage && <p style={{ marginTop: '15px', color: claimMessage.includes('Success') ? '#34d399' : '#f87171', fontWeight: '600', fontSize: '14px' }}>{claimMessage}</p>}
        </div>

        <h2 style={{ fontSize: '24px', color: '#111', margin: '0 0 20px 0', fontWeight: '700', letterSpacing: '-0.5px' }}>Your Products</h2>

        {stickers.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <h3 style={{ color: '#111', marginBottom: '10px', fontSize: '20px' }}>Your workspace is empty.</h3>
            <p style={{ color: '#6b7280' }}>Activate your first Link Supply tag above to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '25px' }}>
            {stickers.map((sticker) => (
              <div key={sticker.id} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: sticker.tap_count > 0 ? '#10b981' : '#d1d5db', boxShadow: sticker.tap_count > 0 ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none' }}></div>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#111' }}>{sticker.id}</span>
                    <span style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid #e5e7eb' }}>
                      {formatType(sticker.product_type)}
                    </span>
                  </div>
                  <a href={`/go/${sticker.url_slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600', padding: '8px 16px', backgroundColor: '#e0e7ff', borderRadius: '8px' }}>Preview Link ↗</a>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '13px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Total Scans</span>
                    <span style={{ fontSize: '32px', fontWeight: '800', color: '#111', lineHeight: '1' }}>{sticker.tap_count || 0}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '13px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Last Active</span>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'end', height: '32px' }}>
                      {formatDate(sticker.last_tapped_at)}
                    </span>
                  </div>
                </div>

                {/* NEW CONFIGURATION SECTION: Name & URL */}
                <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>Tag Name (Optional)</label>
                    <input 
                      type="text" 
                      defaultValue={sticker.tag_name || ''}
                      placeholder="e.g., Table 5, Front Desk, Main Wallet"
                      onChange={(e) => {
                        const updated = stickers.map(s => s.id === sticker.id ? { ...s, tag_name: e.target.value } : s)
                        setStickers(updated)
                      }}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>Destination URL</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input 
                        type="url" 
                        defaultValue={sticker.target_url || ''}
                        placeholder="https://your-link.com"
                        onChange={(e) => {
                          const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: e.target.value } : s)
                          setStickers(updated)
                        }}
                        style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '16px', color: '#111', outline: 'none' }}
                      />
                      <button 
                        onClick={() => handleSaveChanges(sticker.id, sticker.target_url, sticker.tag_name)}
                        style={{ padding: '0 24px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', minWidth: '140px', transition: 'background 0.2s' }}
                      >
                        {saveStatus[sticker.id] || 'Save Changes'}
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
