'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'

export default function Dashboard() {
  const [stickers, setStickers] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStickers = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('nfc_stickers')
          .select('*')
          .eq('owner_id', user.id)
        setStickers(data || [])
      }
      setLoading(false)
    }
    fetchStickers()
  }, [])

  const updateLink = async (id, newUrl) => {
    const { error } = await supabase
      .from('nfc_stickers')
      .update({ target_url: newUrl })
      .eq('id', id)
    
    if (!error) alert("Link updated successfully!")
  }

  if (loading) return <p>Loading your stickers...</p>

  return (
    <div style={{ padding: '20px', color: 'white', background: '#111', minHeight: '100vh' }}>
      <h1>My Link Supply Dashboard</h1>
      {stickers.length === 0 ? (
        <p>You don't own any stickers yet. Go to /claim to add one!</p>
      ) : (
        stickers.map(s => (
          <div key={s.id} style={{ border: '1px solid #333', padding: '15px', margin: '10px 0' }}>
            <h3>Sticker ID: {s.id}</h3>
            <input 
              defaultValue={s.target_url} 
              onBlur={(e) => updateLink(s.id, e.target.value)}
              style={{ padding: '8px', width: '300px', color: 'black' }}
            />
            <p style={{ fontSize: '12px', color: '#888' }}>Tip: Click out of the box to save.</p>
          </div>
        ))
      )}
    </div>
  )
}
