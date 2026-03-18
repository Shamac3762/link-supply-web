'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function PremiumDashboard() {
  const [stickers, setStickers] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState({}) // Tracks "Saving..." status for each sticker

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    // 1. Fetch user's name from your new CRM table
    const { data: customerData } = await supabase
      .from('customers')
      .select('first_name')
      .eq('id', session.user.id)
      .single()

    if (customerData) setProfile(customerData)

    // 2. Fetch all stickers owned by this user
    const { data: stickerData } = await supabase
      .from('nfc_stickers')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('id', { ascending: true })

    if (stickerData) setStickers(stickerData)
    setLoading(false)
  }

  const handleUpdateUrl = async (id, newUrl) => {
    setSaveStatus({ ...saveStatus, [id]: 'Saving...' })
    
    const { error } = await supabase
      .from('nfc_stickers')
      .update({ target_url: newUrl })
      .eq('id', id)

    if (error) {
      setSaveStatus({ ...saveStatus, [id]: 'Error updating!' })
    } else {
      setSaveStatus({ ...saveStatus, [id]: 'Saved! ✓' })
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [id]: '' })), 2000)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', color: '#666' }}>Loading your workspace...</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
      
      {/* Navigation Bar */}
      <nav style={{ backgroundColor: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111', margin: 0 }}>Link Supply.</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#666', fontWeight: '500' }}>
            Welcome, {profile?.first_name || 'User'}
          </span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Log Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', color: '#111', margin: 0 }}>Your Tags</h2>
          <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
            {stickers.length} Active Tags
          </span>
        </div>

        {stickers.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '50px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h3 style={{ color: '#111', marginBottom: '10px' }}>No tags found.</h3>
            <p style={{ color: '#666' }}>You haven't linked any Link Supply tags to your account yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {stickers.map((sticker) => (
              <div key={sticker.id} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#111' }}>Tag: {sticker.id}</span>
                  <a href={`/go/${sticker.id}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#0070f3', textDecoration: 'none', fontWeight: '500' }}>Test Link ↗</a>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>Where should this tag redirect to?</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="url" 
                      defaultValue={sticker.target_url || ''}
                      placeholder="https://instagram.com/yourprofile"
                      onChange={(e) => {
                        // We copy the array and update just this one so the local state holds the text
                        const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: e.target.value } : s)
                        setStickers(updated)
                      }}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', backgroundColor: '#f9f9f9', color: '#333' }}
                    />
                    <button 
                      onClick={() => handleUpdateUrl(sticker.id, sticker.target_url)}
                      style={{ padding: '0 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', minWidth: '100px' }}
                    >
                      {saveStatus[sticker.id] || 'Save'}
                    </button>
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
