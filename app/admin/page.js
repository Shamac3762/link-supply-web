'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'

// 🔒 SECURITY: Replace this with your actual admin email
const ADMIN_EMAIL = 'fitmentuk@outlook.com' 

export default function MasterAdminPanel() {
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  
  // Dashboard Data State
  const [customers, setCustomers] = useState([])
  const [pulseFeed, setPulseFeed] = useState([])
  const [inventory, setInventory] = useState([])
  const [kpis, setKpis] = useState({ totalUsers: 0, proUsers: 0, totalScans: 0 })
  
  // Minting State
  const [mintAmount, setMintAmount] = useState(50)
  const [mintType, setMintType] = useState('qr') // 'qr' or 'nfc'
  const [isMinting, setIsMinting] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  // 🎛️ NEW: Filter & Sort State
  const [inventoryFilter, setInventoryFilter] = useState('all') // 'all', 'active', 'inventory'
  const [inventorySort, setInventorySort] = useState('newest') // 'newest', 'oldest', 'a-z', 'z-a'
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session || session.user.email !== ADMIN_EMAIL) {
      setUnauthorized(true)
      setTimeout(() => router.push('/'), 2000)
      return
    }

    await loadDashboardData()
    setLoading(false)
  }

  const loadDashboardData = async () => {
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      
    const { data: tapData } = await supabase
      .from('nfc_taps')
      .select('*, nfc_stickers(id, tag_name)')
      .order('created_at', { ascending: false })
      .limit(10)

    // Bumped limit to 500 so you can filter a larger batch of inventory
    const { data: inventoryData } = await supabase
      .from('nfc_stickers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500) 

    if (customerData) {
      setCustomers(customerData)
      setKpis(prev => ({ 
        ...prev, 
        totalUsers: customerData.length,
        proUsers: customerData.filter(c => c.tier !== 'free').length 
      }))
    }
    
    if (tapData) setPulseFeed(tapData)
    if (inventoryData) setInventory(inventoryData)
  }

  const handleMintAssets = async () => {
    setIsMinting(true)
    
    try {
      const prefix = mintType === 'qr' ? 'QR-' : 'ST-'
      const productType = mintType === 'qr' ? 'qr_code' : 'sticker'

      const { count } = await supabase
        .from('nfc_stickers')
        .select('*', { count: 'exact', head: true })
        .eq('product_type', productType)

      const startIndex = (count || 0) + 1
      const assetsToMint = []

      for (let i = 0; i < mintAmount; i++) {
        const sequentialNum = String(startIndex + i).padStart(3, '0')
        assetsToMint.push({
          id: `${prefix}${sequentialNum}`,
          url_slug: Math.random().toString(36).substring(2, 10),
          activation_code: Math.floor(Math.random() * 900000 + 100000).toString(),
          lifecycle_status: 'inventory',
          product_type: productType,
          tag_name: `${prefix}${sequentialNum} (Inventory)`
        })
      }

      const { error } = await supabase.from('nfc_stickers').insert(assetsToMint)

      if (error) throw error
      alert(`Successfully minted ${mintAmount} new ${mintType.toUpperCase()} assets!`)
      
      loadDashboardData() 
      
    } catch (error) {
      console.error("Minting error:", error)
      alert("Failed to mint assets. Check console.")
    }
    
    setIsMinting(false)
  }

  const handleCopyProgrammingLink = (slug, id) => {
    const fullUrl = `https://linksupply.co.uk/go/${slug}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 🧮 NEW: Dynamic Sorting and Filtering Logic
  const filteredAndSortedInventory = inventory
    .filter((item) => {
      if (inventoryFilter === 'all') return true;
      if (inventoryFilter === 'active') return item.lifecycle_status === 'active';
      if (inventoryFilter === 'inventory') return item.lifecycle_status !== 'active';
      return true;
    })
    .sort((a, b) => {
      if (inventorySort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (inventorySort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (inventorySort === 'a-z') return a.id.localeCompare(b.id);
      if (inventorySort === 'z-a') return b.id.localeCompare(a.id);
      return 0;
    });

  if (unauthorized) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛑</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Access Denied</h1>
          <p style={{ color: '#9ca3af', marginTop: '10px' }}>Redirecting to public homepage...</p>
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>Authenticating Admin...</div>

  const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }
  const tableHeaderStyle = { textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }
  const tableCellStyle = { padding: '16px', fontSize: '14px', color: '#111', borderBottom: '1px solid #f3f4f6' }

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif', padding: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111', margin: '0 0 5px 0' }}>Link Supply Command Center</h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '15px' }}>Welcome back, Boss.</p>
          </div>
          <button onClick={loadDashboardData} style={{ padding: '10px 16px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            🔄 Refresh Data
          </button>
        </div>

        {/* TOP KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={cardStyle}>
            <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Total Customers</p>
            <p style={{ fontSize: '36px', fontWeight: '800', color: '#111', margin: 0 }}>{kpis.totalUsers}</p>
          </div>
          <div style={cardStyle}>
            <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Paid Subscribers</p>
            <p style={{ fontSize: '36px', fontWeight: '800', color: '#059669', margin: 0 }}>{kpis.proUsers}</p>
          </div>
          <div style={cardStyle}>
            <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Global Hardware Scans</p>
            <p style={{ fontSize: '36px', fontWeight: '800', color: '#3b82f6', margin: 0 }}>{pulseFeed.length * 14} <span style={{fontSize:'14px', color:'#9ca3af'}}>(est)</span></p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', alignItems: 'start', marginBottom: '30px' }}>
          
          {/* LEFT COLUMN: CRM */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', marginBottom: '20px' }}>Customer CRM</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>User</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Tier</th>
                    <th style={tableHeaderStyle}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((cust) => (
                    <tr key={cust.id}>
                      <td style={{...tableCellStyle, fontWeight: '600'}}>{cust.display_name || 'Anonymous'}</td>
                      <td style={tableCellStyle}>{cust.display_email}</td>
                      <td style={tableCellStyle}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase',
                          backgroundColor: cust.tier === 'pro' ? '#d1fae5' : (cust.tier === 'free' ? '#f3f4f6' : '#dbeafe'),
                          color: cust.tier === 'pro' ? '#065f46' : (cust.tier === 'free' ? '#4b5563' : '#1e40af')
                        }}>
                          {cust.tier}
                        </span>
                      </td>
                      <td style={{...tableCellStyle, color: '#6b7280', fontSize: '13px'}}>{new Date(cust.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT COLUMN: PULSE & MINTING */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* ASSET MINTING STATION */}
            <div style={{...cardStyle, border: '2px solid #111'}}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', marginBottom: '15px' }}>🏭 Inventory Minting</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Generate secure hardware slugs instantly.</p>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <select 
                  value={mintType} 
                  onChange={(e) => setMintType(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600' }}
                >
                  <option value="qr">Dynamic QR Codes</option>
                  <option value="nfc">NFC Stickers/Cards</option>
                </select>
                <input 
                  type="number" 
                  value={mintAmount} 
                  onChange={(e) => setMintAmount(Number(e.target.value))}
                  style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}
                />
              </div>
              <button 
                onClick={handleMintAssets}
                disabled={isMinting}
                style={{ width: '100%', padding: '12px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: isMinting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              >
                {isMinting ? 'Minting...' : `Mint ${mintAmount} ${mintType.toUpperCase()}s`}
              </button>
            </div>

            {/* LIVE PULSE FEED */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Live Pulse
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pulseFeed.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#9ca3af' }}>No recent activity detected.</p>
                ) : pulseFeed.map((tap, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', borderBottom: i !== pulseFeed.length -1 ? '1px solid #f3f4f6' : 'none', paddingBottom: i !== pulseFeed.length -1 ? '15px' : '0' }}>
                    <div style={{ fontSize: '20px' }}>{tap.scan_method === 'qr' ? '📷' : '📱'}</div>
                    <div>
                      <p style={{ margin: '0 0 3px 0', fontSize: '14px', color: '#111', fontWeight: '600' }}>
                        {tap.tag_id}
                        {tap.nfc_stickers?.tag_name && tap.nfc_stickers.tag_name !== tap.tag_id && (
                          <span style={{ color: '#6b7280', fontWeight: '500', marginLeft: '4px' }}>
                            ({tap.nfc_stickers.tag_name})
                          </span>
                        )} was scanned
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                        {new Date(tap.created_at).toLocaleTimeString()} via {tap.scan_method === 'qr' ? 'Camera' : 'NFC'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* HARDWARE PROGRAMMING & INVENTORY TABLE */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', margin: '0 0 4px 0' }}>Hardware Programming & Inventory</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Copy the exact encoding links for your physical NFC and QR production.</p>
            </div>
            
            {/* 🎛️ NEW: FILTER & SORT UI */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                value={inventoryFilter} 
                onChange={(e) => setInventoryFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', fontWeight: '600', backgroundColor: '#f9fafb', color: '#374151', cursor: 'pointer', outline: 'none' }}
              >
                <option value="all">Status: All</option>
                <option value="active">Status: Active</option>
                <option value="inventory">Status: Inactive / Unassigned</option>
              </select>

              <select 
                value={inventorySort} 
                onChange={(e) => setInventorySort(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', fontWeight: '600', backgroundColor: '#f9fafb', color: '#374151', cursor: 'pointer', outline: 'none' }}
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="a-z">Sort: ID (A to Z)</option>
                <option value="z-a">Sort: ID (Z to A)</option>
              </select>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Hardware ID</th>
                  <th style={tableHeaderStyle}>Type</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Programming Link</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedInventory.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                      No hardware matches these filters.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedInventory.map((item) => (
                    <tr key={item.id}>
                      <td style={{...tableCellStyle, fontWeight: '700'}}>{item.id}</td>
                      <td style={{...tableCellStyle, textTransform: 'capitalize'}}>{item.product_type.replace('_', ' ')}</td>
                      <td style={tableCellStyle}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase',
                          backgroundColor: item.lifecycle_status === 'active' ? '#d1fae5' : '#f3f4f6',
                          color: item.lifecycle_status === 'active' ? '#065f46' : '#4b5563'
                        }}>
                          {item.lifecycle_status}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <code style={{ backgroundColor: '#f3f4f6', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', color: '#374151', flex: 1, display: 'inline-block', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            https://linksupply.co.uk/go/{item.url_slug}
                          </code>
                          <button 
                            onClick={() => handleCopyProgrammingLink(item.url_slug, item.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: copiedId === item.id ? '#10b981' : '#111',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              minWidth: '70px'
                            }}
                          >
                            {copiedId === item.id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <style>{`
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
        `}</style>
      </div>
    </div>
  )
}
