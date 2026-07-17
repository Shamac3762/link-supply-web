'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'

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
  const [mintType, setMintType] = useState('qr_code') 
  const [customMintType, setCustomMintType] = useState('')
  const [isMinting, setIsMinting] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  // Filter & Sort State
  const [inventoryFilter, setInventoryFilter] = useState('all') 
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState('all') 
  const [inventorySort, setInventorySort] = useState('newest') 

  // QR STUDIO STATE
  const [selectedIds, setSelectedIds] = useState([])
  const [showQRStudio, setShowQRStudio] = useState(false)
  
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
    const { data: customerData } = await supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(100)
    const { data: tapData } = await supabase.from('nfc_taps').select('*, nfc_stickers(id, name)').order('created_at', { ascending: false }).limit(10)
    const { data: inventoryData } = await supabase.from('nfc_stickers').select('*').order('created_at', { ascending: false }).limit(500) 

    if (customerData) {
      setCustomers(customerData)
      setKpis(prev => ({ ...prev, totalUsers: customerData.length, proUsers: customerData.filter(c => c.tier !== 'free').length }))
    }
    
    if (tapData) setPulseFeed(tapData)
    if (inventoryData) setInventory(inventoryData)
  }

  const handleMintAssets = async () => {
    const finalProductType = mintType === 'custom' ? customMintType.toLowerCase().replace(/[^a-z0-9]/g, '_') : mintType;
    if (!finalProductType) return alert("Please specify a product type to mint.");

    setIsMinting(true)
    
    try {
      let prefix = 'ST-';
      if (finalProductType === 'qr_code') prefix = 'QR-';
      else if (finalProductType === 'sticker') prefix = 'ST-';
      else prefix = finalProductType.substring(0, 2).toUpperCase() + '-';

      let assetType = 'nfc';
      if (finalProductType.includes('qr')) assetType = 'qr';

      const { count } = await supabase.from('nfc_stickers').select('*', { count: 'exact', head: true }).eq('product_type', finalProductType)
      const startIndex = (count || 0) + 1
      const assetsToMint = []

      for (let i = 0; i < mintAmount; i++) {
        const sequentialNum = String(startIndex + i).padStart(3, '0')
        assetsToMint.push({
          id: `${prefix}${sequentialNum}`,
          url_slug: Math.random().toString(36).substring(2, 10),
          activation_code: Math.floor(Math.random() * 900000 + 100000).toString(),
          lifecycle_status: 'inventory',
          product_type: finalProductType,
          asset_type: assetType, 
          name: `${prefix}${sequentialNum} (Inventory)`
        })
      }

      const { error } = await supabase.from('nfc_stickers').insert(assetsToMint)
      if (error) throw error
      
      alert(`Successfully minted ${mintAmount} new ${finalProductType.replace('_', ' ').toUpperCase()} assets!`)
      
      if (mintType === 'custom') {
        setMintType(finalProductType);
        setCustomMintType('');
      }
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

  // Checkbox Selection Logic
  const handleSelectAll = (e, filteredList) => {
    if (e.target.checked) setSelectedIds(filteredList.map(item => item.id))
    else setSelectedIds([])
  }

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id))
    else setSelectedIds([...selectedIds, id])
  }

  // 📥 PERFECT VECTOR SVG DOWNLOAD LOGIC
  const handleDownloadSVG = (assetId) => {
    const svgElement = document.getElementById(`qr-${assetId}`);
    if (!svgElement) return;
    
    // Extract perfect vector math directly from the DOM, which now includes the rotated text!
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Trigger hidden download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assetId}.svg`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const uniqueProductTypes = [...new Set(inventory.map(item => item.product_type))].filter(Boolean);
  if (!uniqueProductTypes.includes('qr_code')) uniqueProductTypes.unshift('qr_code');
  if (!uniqueProductTypes.includes('sticker')) uniqueProductTypes.push('sticker');
  const finalProductTypes = [...new Set(uniqueProductTypes)];

  const filteredAndSortedInventory = inventory
    .filter((item) => {
      let statusMatch = true;
      if (inventoryFilter === 'active') statusMatch = item.lifecycle_status === 'active';
      if (inventoryFilter === 'inventory') statusMatch = item.lifecycle_status !== 'active';
      let typeMatch = true;
      if (inventoryTypeFilter !== 'all') typeMatch = item.product_type === inventoryTypeFilter;
      return statusMatch && typeMatch;
    })
    .sort((a, b) => {
      if (inventorySort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (inventorySort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (inventorySort === 'a-z') return a.id.localeCompare(b.id);
      if (inventorySort === 'z-a') return b.id.localeCompare(a.id);
      return 0;
    });

  // 🖨️ QR PRINT STUDIO VIEW
  if (showQRStudio) {
    const selectedAssets = inventory.filter(i => selectedIds.includes(i.id));
    return (
      <div style={{ backgroundColor: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif', color: 'black' }}>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; -webkit-print-color-adjust: exact; }
            @page { margin: 15mm; }
          }
        `}</style>
        
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '2px solid #f3f4f6' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 5px 0' }}>QR Print Studio</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>Showing {selectedAssets.length} selected assets. The ID is embedded securely inside the SVG file.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowQRStudio(false)} style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#111', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Back to Dashboard</button>
            <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>🖨️ Print Full Grid</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '40px' }}>
          {selectedAssets.map(asset => (
            <div key={asset.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', breakInside: 'avoid', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '16px', backgroundColor: '#f9fafb' }}>
              
              {/* 🎨 MASTER SVG: Adjusted width, tighter spacing, smaller font */}
              <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center' }}>
                <svg 
                  id={`qr-${asset.id}`} 
                  width="200" 
                  height="180" 
                  viewBox="0 0 200 180" 
                  xmlns="http://www.w3.org/2000/svg" 
                  style={{ backgroundColor: 'white' }}
                >
                  {/* The actual QR Code */}
                  <svg width="180" height="180" x="0" y="0">
                    <QRCodeSVG 
                      value={`https://linksupply.co.uk/go/${asset.url_slug}`} 
                      size={180}
                      level="H" 
                      includeMargin={true}
                    />
                  </svg>
                  
                  {/* The Rotated ID Text (closer to QR, smaller text) */}
                  <g transform="translate(190, 160) rotate(-90)">
                    <text 
                      x="0" 
                      y="0" 
                      fontFamily="monospace, sans-serif" 
                      fontSize="14" 
                      fill="#111111" 
                      fontWeight="bold"
                      letterSpacing="1"
                    >
                      ID:{asset.id}
                    </text>
                  </g>
                </svg>
              </div>
              
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '15px 0 15px 0', fontWeight: '500' }}>
                linksupply.co.uk
              </p>
              
              {/* SVG DOWNLOAD BUTTON */}
              <button 
                className="no-print"
                onClick={() => handleDownloadSVG(asset.id)} 
                style={{ width: '100%', padding: '8px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', color: '#374151', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              >
                ⬇️ Download .SVG
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- UNAUTHORIZED / LOADING STATES ---
  if (unauthorized) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h1>🛑 Access Denied</h1></div>
  if (loading) return <div style={{ padding: '40px' }}>Authenticating Admin...</div>

  // --- STYLES ---
  const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }
  const tableHeaderStyle = { textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }
  const tableCellStyle = { padding: '16px', fontSize: '14px', color: '#111', borderBottom: '1px solid #f3f4f6' }

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif', padding: '40px', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111', margin: '0 0 5px 0' }}>Link Supply Command Center</h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '15px' }}>Welcome back, Boss.</p>
          </div>
          <button onClick={loadDashboardData} style={{ padding: '10px 16px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
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
            
            {/* MINTING STATION */}
            <div style={{...cardStyle, border: '2px solid #111'}}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', marginBottom: '15px' }}>🏭 Inventory Minting</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Generate secure hardware slugs instantly.</p>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <select 
                  value={mintType} 
                  onChange={(e) => setMintType(e.target.value)}
                  style={{ flex: 1, minWidth: '130px', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600' }}
                >
                  {finalProductTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                  <option value="custom">➕ Create New Type...</option>
                </select>
                <input 
                  type="number" 
                  value={mintAmount} 
                  onChange={(e) => setMintAmount(Number(e.target.value))}
                  style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}
                />
                {mintType === 'custom' && (
                  <input 
                    type="text" 
                    placeholder="e.g. Acrylic Sign" 
                    value={customMintType}
                    onChange={(e) => setCustomMintType(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', marginTop: '5px' }}
                  />
                )}
              </div>
              <button 
                onClick={handleMintAssets}
                disabled={isMinting}
                style={{ width: '100%', padding: '12px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: isMinting ? 'not-allowed' : 'pointer' }}
              >
                {isMinting ? 'Minting...' : `Mint ${mintAmount} Assets`}
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
                        {tap.nfc_stickers?.name && tap.nfc_stickers.name !== tap.tag_id && (
                          <span style={{ color: '#6b7280', fontWeight: '500', marginLeft: '4px' }}>
                            ({tap.nfc_stickers.name})
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
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Select tags to generate pure vector SVGs, or copy encoding links.</p>
            </div>
            
            {/* FILTER & SORT UI */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select 
                value={inventoryTypeFilter} 
                onChange={(e) => setInventoryTypeFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', fontWeight: '600', backgroundColor: '#f9fafb', color: '#374151', cursor: 'pointer', outline: 'none' }}
              >
                <option value="all">Type: All</option>
                {finalProductTypes.map(type => (
                  <option key={type} value={type}>
                    Type: {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>

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
                  <th style={{...tableHeaderStyle, width: '40px'}}>
                    <input 
                      type="checkbox" 
                      onChange={(e) => handleSelectAll(e, filteredAndSortedInventory)} 
                      checked={selectedIds.length > 0 && selectedIds.length === filteredAndSortedInventory.length}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th style={tableHeaderStyle}>Hardware ID</th>
                  <th style={tableHeaderStyle}>Type</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Programming Link</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedInventory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                      No hardware matches these filters.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedInventory.map((item) => (
                    <tr key={item.id} style={{ backgroundColor: selectedIds.includes(item.id) ? '#f0fdf4' : 'transparent' }}>
                      <td style={tableCellStyle}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
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
                            style={{ padding: '6px 12px', backgroundColor: copiedId === item.id ? '#10b981' : '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', minWidth: '70px' }}
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
        
        {/* FLOATING ACTION BAR FOR SELECTED ITEMS */}
        {selectedIds.length > 0 && (
          <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#111', color: 'white', padding: '15px 30px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 100, animation: 'fadeInUp 0.3s' }}>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>{selectedIds.length} assets selected</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setSelectedIds([])} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #4b5563', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setShowQRStudio(true)} style={{ padding: '8px 20px', backgroundColor: 'white', color: '#111', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>🎨 Open QR Studio</button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          @keyframes fadeInUp {
            from { transform: translate(-50%, 20px); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}
