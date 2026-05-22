'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link' 
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
  const [isMounted, setIsMounted] = useState(false)
  
  const [stickers, setStickers] = useState([])
  const [chartData, setChartData] = useState([]) 
  const [claimId, setClaimId] = useState('')
  const [claimPin, setClaimPin] = useState('')
  const [claimMessage, setClaimMessage] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)
  
  const [pageProfile, setPageProfile] = useState({ 
    username: '', display_name: '', bio: '', theme_color: '#111111',
    profile_picture_url: '', job_title: '', company: '', phone_number: '', display_email: '',
    profile_status: 'live',
    remember_me: false,
    tier: 'free',
    show_save_contact: true,
    profile_views: 0
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
  
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
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
      .select('username, display_name, bio, theme_color, max_links, profile_picture_url, job_title, company, phone_number, display_email, profile_status, remember_me, tier, show_save_contact, profile_views')
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
      await supabase.from('customers').upsert({ id: session.user.id, username: currentUsername, display_name: currentDisplayName, theme_color: customerData?.theme_color || '#111111' });
    }

    setPageProfile({
      username: currentUsername, 
      display_name: currentDisplayName || '',
      bio: customerData?.bio || '', theme_color: customerData?.theme_color || '#111111',
      profile_picture_url: customerData?.profile_picture_url || '', job_title: customerData?.job_title || '',
      company: customerData?.company || '', phone_number: customerData?.phone_number || '', display_email: customerData?.display_email || '',
      profile_status: customerData?.profile_status || 'live',
      remember_me: customerData?.remember_me || false,
      tier: customerData?.tier || 'free',
      show_save_contact: customerData?.show_save_contact !== false,
      profile_views: customerData?.profile_views || 0 
    })
    
    const userTier = customerData?.tier || 'free';
    let dynamicLimit = 2; 
    
    if (userTier !== 'free') {
        dynamicLimit = (customerData?.max_links && customerData.max_links > 15) ? customerData.max_links : 15;
    }
    setMaxLinks(dynamicLimit);

    const { data: stickerData } = await supabase.from('nfc_stickers').select('*').eq('owner_id', session.user.id).order('id', { ascending: true })
    if (stickerData) setStickers(stickerData)

    const { data: linksData } = await supabase.from('page_links').select('*').eq('owner_id', session.user.id).order('sort_order', { ascending: true })
    if (linksData) setPageLinks(linksData)

    const { data: tapLogs } = await supabase
      .from('nfc_taps')
      .select('tapped_at')
      .eq('owner_id', session.user.id)
      .gte('tapped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return { name: d.toLocaleDateString('en-GB', { weekday: 'short' }), taps: 0, fullDate: d.toDateString() };
    }).reverse();

    if (tapLogs) {
      tapLogs.forEach(log => {
        const dateStr = new Date(log.tapped_at).toDateString();
        const day = days.find(d => d.fullDate === dateStr);
        if (day) day.taps++;
      });
    }
    setChartData(days);

    setLoading(false)
  }

  const handleToggleRememberMe = async (currentValue) => {
    const newValue = !currentValue;
    setPageProfile({ ...pageProfile, remember_me: newValue });
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('customers').update({ remember_me: newValue }).eq('id', session.user.id);
  }

  const handleActivateTag = async () => {
    if (!claimId || claimPin.length < 6) return setClaimMessage("Please enter a valid Tag ID and 6-digit PIN.")
    setIsClaiming(true); setClaimMessage("Verifying vault...")
    const { data: { session } } = await supabase.auth.getSession()
    const defaultUrl = `https://linksupply.co.uk/u/${pageProfile.username}`;
    
    const { error, data } = await supabase
      .from('nfc_stickers')
      .update({ owner_id: session.user.id, target_url: defaultUrl, lifecycle_status: 'active' }) 
      .eq('id', claimId.toUpperCase())
      .eq('activation_code', claimPin)
      .is('owner_id', null)
      .select()

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

  const handleToggleActive = async (id, currentState) => {
    const newState = !currentState 
    setStickers(stickers.map(s => s.id === id ? { ...s, is_active: newState } : s))
    const { error } = await supabase.from('nfc_stickers').update({ is_active: newState }).eq('id', id)
    if (error) { setStickers(stickers.map(s => s.id === id ? { ...s, is_active: currentState } : s)); alert("Failed to update hardware status.") }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const compressedFile = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500; 
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
              resolve(new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.8);
          };
        };
      });

      const fileName = `${session.user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressedFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      setPageProfile({ ...pageProfile, profile_picture_url: publicUrl });
      
    } catch (error) {
      alert("Error uploading image: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaveStatus({ ...saveStatus, profile: 'Saving...' })
    const { data: { session } } = await supabase.auth.getSession()
    
    let cleanUsername = pageProfile.username;
    const isPremium = pageProfile.tier !== 'free';
    
    const updateData = { 
        id: session.user.id, display_name: pageProfile.display_name,
        bio: pageProfile.bio, theme_color: pageProfile.theme_color, profile_picture_url: pageProfile.profile_picture_url,
        job_title: pageProfile.job_title, company: pageProfile.company, phone_number: pageProfile.phone_number, display_email: pageProfile.display_email,
        profile_status: pageProfile.profile_status, remember_me: pageProfile.remember_me,
        show_save_contact: pageProfile.show_save_contact
    }

    if (isPremium) {
        cleanUsername = pageProfile.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
        updateData.username = cleanUsername;
    }

    const { error } = await supabase.from('customers').upsert(updateData)

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
    const confirmDelete = window.confirm("GDPR NOTICE: Are you absolutely sure you want to permanently delete your account?\n\nThis will immediately sever all your physical NFC tags from this profile. This action cannot be undone.")
    if (confirmDelete) { setSettingsMessage("Deleting account..."); alert("Account scheduled for deletion. Please contact support to finalize.") }
  }

  const isAtLimit = pageLinks.length >= maxLinks
  const displayLimit = maxLinks > 100 ? 'Unlimited' : maxLinks
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }
  const isPremium = pageProfile.tier !== 'free';

  // 🔥 Pre-calculate chart data outside the render block to prevent hydration crashes
  const hasRealData = (chartData || []).reduce((acc, d) => acc + (d.taps || 0), 0) > 0;
  const displayChartData = hasRealData ? chartData : [
    { name: 'Mon', taps: 12 }, { name: 'Tue', taps: 19 }, { name: 'Wed', taps: 15 }, 
    { name: 'Thu', taps: 25 }, { name: 'Fri', taps: 22 }, { name: 'Sat', taps: 35 }, { name: 'Sun', taps: 28 }
  ];

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>Loading Workspace...</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', paddingBottom: '50px', overflowX: 'hidden', width: '100%' }}>
      <style>{`
        * { box-sizing: border-box; }
        .responsive-nav { padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; background-color: white; }
        .responsive-tabs { display: flex; gap: 10px; margin-bottom: 30px; background-color: #e5e7eb; padding: 6px; border-radius: 12px; }
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; }
        .responsive-stack { display: flex; gap: 12px; width: 100%; max-width: 100%; }
        .link-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; }
        .url-input-container { display: flex; align-items: center; background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; width: 100%; }
        .url-prefix { color: #6b7280; font-size: 15px; padding: 14px; font-weight: 500; border-right: 1px solid #e5e7eb; background-color: #f3f4f6; white-space: nowrap; }

        @media (max-width: 600px) {
          .responsive-nav { padding: 15px 20px; flex-direction: column; gap: 15px; }
          .responsive-tabs { flex-direction: column; }
          .responsive-grid { grid-template-columns: 1fr; }
          .responsive-stack { flex-direction: column; align-items: stretch; }
          .responsive-stack > input, .responsive-stack > button { width: 100% !important; max-width: 100% !important; }
          .header-stack { flex-direction: column; align-items: flex-start !important; gap: 15px; width: 100%; flex-wrap: wrap; }
          .header-stack .actions { width: 100%; display: flex; justify-content: space-between; }
          .link-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .link-row button { width: 100%; }
          .url-input-container { flex-direction: column; align-items: stretch; }
          .url-prefix { border-right: none; border-bottom: 1px solid #e5e7eb; font-size: 13px; padding: 10px 14px; }
        }
      `}</style>

      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Account Settings</h2>
              <button onClick={() => {setShowSettings(false); setSettingsMessage('')}} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <label style={labelStyle}>Change Password</label>
              <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{...inputStyle, marginBottom: '10px'}} />
              <button onClick={handleUpdatePassword} style={{ width: '100%', padding: '10px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Update Password</button>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', color: '#111', margin: '0 0 15px 0' }}>Security Preferences</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#111' }}>Keep me signed in</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Remember this device for future visits.</p>
                </div>
                <button onClick={() => handleToggleRememberMe(pageProfile.remember_me)} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: pageProfile.remember_me ? '#059669' : '#e5e7eb', position: 'relative', transition: 'background-color 0.2s ease' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', left: pageProfile.remember_me ? '22px' : '2px', transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '10px' }}>
              <h3 style={{ fontSize: '16px', color: '#dc2626', margin: '0 0 10px 0' }}>Danger Zone</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>Permanently delete your account and data to comply with GDPR.</p>
              <button onClick={handleDeleteAccount} style={{ width: '100%', padding: '10px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Delete Account</button>
            </div>
            {settingsMessage && <p style={{ marginTop: '15px', color: settingsMessage.includes('Success') ? '#059669' : '#dc2626', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>{settingsMessage}</p>}
          </div>
        </div>
      )}

      <nav className="responsive-nav">
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <div style={{ fontFamily: '"Myriad Pro", "Segoe UI", Roboto, sans-serif', fontSize: '22px', color: '#111', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontWeight: '700' }}>Link</span><span style={{ fontWeight: '400' }}>Supply.</span>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setShowSettings(true)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#111', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>⚙️ Settings</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Log Out</button>
        </div>
      </nav>

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', width: '100%' }}>
        <div className="responsive-tabs">
          <button onClick={() => setActiveTab('hardware')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'hardware' ? 'white' : 'transparent', color: activeTab === 'hardware' ? '#111' : '#6b7280', boxShadow: activeTab === 'hardware' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>My Hardware Tags</button>
          <button onClick={() => setActiveTab('page')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'page' ? 'white' : 'transparent', color: activeTab === 'page' ? '#111' : '#6b7280', boxShadow: activeTab === 'page' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>My Premium Page</button>
          <button onClick={() => setActiveTab('analytics')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'analytics' ? 'white' : 'transparent', color: activeTab === 'analytics' ? '#111' : '#6b7280', boxShadow: activeTab === 'analytics' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>📈 Analytics</button>
        </div>

        {activeTab === 'hardware' && (
          <div style={{ width: '100%', maxWidth: '100%' }}>
            <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', marginBottom: '40px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', fontWeight: '700' }}>Activate a New Tag</h2>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>Enter the Tag ID and the 6-digit Activation PIN.</p>
              <div className="responsive-stack">
                <input type="text" placeholder="Tag ID (e.g. ST-005)" value={claimId} onChange={(e) => setClaimId(e.target.value.toUpperCase())} style={{ flex: 1, padding: '14px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111' }} />
                <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength="6" placeholder="6-Digit PIN" value={claimPin} onChange={(e) => setClaimPin(e.target.value.replace(/\D/g, ''))} style={{ width: '160px', padding: '14px 16px', borderRadius: '8px', border: 'none', fontSize: '16px', color: '#111', textAlign: 'center', letterSpacing: '4px' }} />
                <button onClick={handleActivateTag} disabled={isClaiming} style={{ padding: '14px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>{isClaiming ? 'Verifying...' : 'Link to Account'}</button>
              </div>
              {claimMessage && <p style={{ marginTop: '15px', color: claimMessage.includes('Success') ? '#34d399' : '#f87171', fontWeight: '600', fontSize: '14px' }}>{claimMessage}</p>}
            </div>

            <h2 style={{ fontSize: '24px', color: '#111', margin: '0 0 20px 0', fontWeight: '700', letterSpacing: '-0.5px' }}>Your Products</h2>
            {stickers.length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb', width: '100%' }}><p style={{ color: '#6b7280' }}>Activate your first tag above to get started.</p></div>
            ) : (
              <div style={{ display: 'grid', gap: '25px', width: '100%' }}>
                {stickers.map((sticker) => {
                  const isEnabled = sticker.is_active !== false;
                  return (
                    <div key={sticker.id} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '20px', opacity: isEnabled ? 1 : 0.6, transition: 'opacity 0.2s', width: '100%', overflow: 'hidden' }}>
                      <div className="header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px', fontWeight: '700', color: '#111', textDecoration: isEnabled ? 'none' : 'line-through' }}>{sticker.id}</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{sticker.tap_count || 0} Taps</span>
                        </div>
                        <a href={`/go/${sticker.url_slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600', padding: '8px 16px', backgroundColor: '#e0e7ff', borderRadius: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>Preview Link ↗</a>
                      </div>
                      <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                        <div>
                          <label style={labelStyle}>Tag Name (Optional)</label>
                          <input disabled={!isEnabled} type="text" defaultValue={sticker.tag_name || ''} placeholder="e.g., Table 5" onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, tag_name: e.target.value } : s); setStickers(updated) }} style={inputStyle} />
                        </div>
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <label style={{...labelStyle, marginBottom: 0}}>Destination URL</label>
                              {!isPremium && <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '12px' }}>PRO</span>}
                            </div>
                            <button onClick={() => handleToggleActive(sticker.id, isEnabled)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', backgroundColor: isEnabled ? '#d1fae5' : '#fee2e2', color: isEnabled ? '#059669' : '#dc2626', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                              {isEnabled ? '🟢 Active' : '🔴 Disabled'}
                            </button>
                          </div>
                          <div className="responsive-stack">
                            <input disabled={!isEnabled || !isPremium} type="url" value={!isPremium ? `https://linksupply.co.uk/u/${pageProfile.username}` : (sticker.target_url || '')} onChange={(e) => { const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: e.target.value } : s); setStickers(updated) }} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '16px', color: !isPremium ? '#6b7280' : '#111', backgroundColor: !isPremium ? '#f3f4f6' : 'white', outline: 'none' }} />
                            {!isPremium ? (
                              <button onClick={() => alert("Custom hardware routing is a paid feature. Upgrade to unlock!")} style={{ padding: '14px 24px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>Unlock Routing</button>
                            ) : (
                              <button disabled={!isEnabled} onClick={() => handleSaveHardwareChanges(sticker.id, sticker.target_url, sticker.tag_name)} style={{ padding: '14px 24px', backgroundColor: isEnabled ? '#111' : '#9ca3af', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: isEnabled ? 'pointer' : 'not-allowed' }}>{saveStatus[sticker.id] || 'Save Changes'}</button>
                            )}
                          </div>
                          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '10px', lineHeight: '1.4' }}>
                            {!isPremium 
                              ? <span><strong>💡 Locked:</strong> On the Free tier, your hardware is permanently linked to your digital profile. Upgrade to Pro to route this tag to a custom website or menu.</span>
                              : <span>
                                  <strong>💡 Tip:</strong> To share your digital business card, set this to <strong>https://linksupply.co.uk/u/{pageProfile.username}</strong>, or enter any custom website. 
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const profileUrl = `https://linksupply.co.uk/u/${pageProfile.username}`;
                                      const updated = stickers.map(s => s.id === sticker.id ? { ...s, target_url: profileUrl } : s); 
                                      setStickers(updated);
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', cursor: 'pointer', padding: 0, marginLeft: '6px', fontSize: '13px' }}
                                  >
                                    Auto-fill profile link
                                  </button>
                                </span>
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'page' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
            
            <div style={{ backgroundColor: 'white', padding: '25px 30px', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 5px 0' }}>Profile Status</h2>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Control if your page is visible to the public.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <a href={`/u/${pageProfile.username}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600', padding: '10px 18px', backgroundColor: '#e0e7ff', borderRadius: '100px', textAlign: 'center', whiteSpace: 'nowrap', transition: 'all 0.2s ease' }}>Preview Page ↗</a>
                <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '6px', borderRadius: '100px' }}>
                  <button onClick={() => { setPageProfile({...pageProfile, profile_status: 'live'}); }} style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: pageProfile.profile_status === 'live' ? 'white' : 'transparent', color: pageProfile.profile_status === 'live' ? '#111' : '#6b7280', boxShadow: pageProfile.profile_status === 'live' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>🟢 Live</button>
                  <button onClick={() => { setPageProfile({...pageProfile, profile_status: 'coming_soon'}); }} style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: pageProfile.profile_status === 'coming_soon' ? 'white' : 'transparent', color: pageProfile.profile_status === 'coming_soon' ? '#111' : '#6b7280', boxShadow: pageProfile.profile_status === 'coming_soon' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>🚧 Coming Soon</button>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 20px 0' }}>Page Identity</h2>
              <div className="responsive-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Full Name / Display Name</label>
                  <input type="text" value={pageProfile.display_name} placeholder="e.g. John Doe" onChange={(e) => setPageProfile({...pageProfile, display_name: e.target.value})} style={inputStyle} />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <label style={{...labelStyle, marginBottom: 0}}>Public Username (URL)</label>
                    {!isPremium && <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '12px' }}>PRO</span>}
                  </div>
                  <div className="url-input-container" style={{ backgroundColor: !isPremium ? '#f3f4f6' : '#f9fafb' }}>
                    <span className="url-prefix" style={{ backgroundColor: !isPremium ? '#e5e7eb' : '#f3f4f6' }}>linksupply.co.uk/u/</span>
                    <input disabled={!isPremium} type="text" value={pageProfile.username} placeholder="mybrand" onChange={(e) => setPageProfile({...pageProfile, username: e.target.value})} style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: 'transparent', fontSize: '16px', color: !isPremium ? '#6b7280' : '#111', outline: 'none', fontWeight: '600' }} />
                  </div>
                  {!isPremium && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>Custom URLs are locked on the Free tier.</p>}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Profile Picture</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    style={{ display: 'none' }} 
                  />
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={pageProfile.profile_picture_url} 
                      placeholder="https://... or click upload" 
                      onChange={(e) => setPageProfile({...pageProfile, profile_picture_url: e.target.value})} 
                      style={{ ...inputStyle, flex: 1 }} 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current.click()} 
                      disabled={isUploading}
                      style={{ 
                        padding: '12px 20px', 
                        backgroundColor: '#f3f4f6', 
                        color: '#111', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px', 
                        fontWeight: '700', 
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isUploading ? '⏳ Compressing...' : '📷 Upload Photo'}
                    </button>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Short Bio</label>
                  <textarea value={pageProfile.bio} placeholder="Welcome to my profile!" onChange={(e) => setPageProfile({...pageProfile, bio: e.target.value})} rows="2" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={labelStyle}>Brand Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input type="color" value={pageProfile.theme_color} onChange={(e) => setPageProfile({...pageProfile, theme_color: e.target.value})} style={{ width: '50px', height: '50px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                    <div style={{ padding: '8px 15px', borderRadius: '8px', backgroundColor: pageProfile.theme_color, color: getContrastColor(pageProfile.theme_color), fontSize: '12px', fontWeight: 'bold', border: '1px solid #e5e7eb' }}>Preview Text</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', marginBottom: '5px' }}>Digital Business Card</h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Add your info so people can save you to their phone.</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f9fafb', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <label style={{ fontSize: '14px', color: '#4b5563', fontWeight: '600', cursor: 'pointer' }} htmlFor="contactToggle">
                    Show Contact Button
                  </label>
                  <button 
                    id="contactToggle"
                    onClick={() => setPageProfile({ ...pageProfile, show_save_contact: !pageProfile.show_save_contact })}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: pageProfile.show_save_contact ? '#059669' : '#d1d5db', position: 'relative', transition: 'background-color 0.2s ease' }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', left: pageProfile.show_save_contact ? '22px' : '2px', transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                  </button>
                </div>
              </div>

              <div className="responsive-grid">
                <div>
                  <label style={labelStyle}>Job Title</label>
                  <input type="text" value={pageProfile.job_title} placeholder="e.g. Sales Director" onChange={(e) => setPageProfile({...pageProfile, job_title: e.target.value})} style={inputStyle} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <label style={{...labelStyle, marginBottom: 0}}>Company / Business</label>
                    {!isPremium && <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>}
                  </div>
                  <input disabled={!isPremium} type="text" value={pageProfile.company} placeholder="e.g. Acme Corp" onChange={(e) => setPageProfile({...pageProfile, company: e.target.value})} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : 'white', cursor: !isPremium ? 'not-allowed' : 'text'}} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <label style={{...labelStyle, marginBottom: 0}}>Phone Number</label>
                    {!isPremium && <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>}
                  </div>
                  <input disabled={!isPremium} type="tel" value={pageProfile.phone_number} placeholder="+44 7700 900077" onChange={(e) => setPageProfile({...pageProfile, phone_number: e.target.value})} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : 'white', cursor: !isPremium ? 'not-allowed' : 'text'}} />
                </div>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <label style={{...labelStyle, marginBottom: 0}}>Display Email</label>
                    {!isPremium && <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>}
                  </div>
                  <input disabled={!isPremium} type="email" value={pageProfile.display_email} placeholder="hello@example.com" onChange={(e) => setPageProfile({...pageProfile, display_email: e.target.value})} style={{...inputStyle, backgroundColor: !isPremium ? '#f3f4f6' : 'white', cursor: !isPremium ? 'not-allowed' : 'text'}} />
                </div>
              </div>

              <div style={{ marginTop: '35px', borderTop: '1px solid #e5e7eb', paddingTop: '25px' }}>
                <button onClick={handleSaveProfile} style={{ padding: '16px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', width: '100%', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {saveStatus.profile || '🚀 Update Public Profile'}
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <div className="header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Your Links</h2>
                <span style={{ fontSize: '14px', fontWeight: '600', color: isAtLimit && maxLinks <= 100 ? '#dc2626' : '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>{pageLinks.length} / {displayLimit} Used</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Add all the links you want to display.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                {pageLinks.length === 0 ? <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '10px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No links added yet.</div> : pageLinks.map((link) => (
                    <div key={link.id} className="link-row">
                      <div style={{ width: '100%', overflow: 'hidden' }}><p style={{ fontWeight: '700', color: '#111', margin: '0 0 5px 0' }}>{link.title}</p><p style={{ color: '#6b7280', fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.url}</p></div>
                      <button onClick={() => handleDeleteLink(link.id)} style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Delete</button>
                    </div>
                ))}
              </div>

              {isAtLimit ? (
                <div style={{ padding: '30px', backgroundColor: '#111', color: 'white', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔒</div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '700' }}>Unlock Unlimited Links</h3>
                  <button onClick={() => alert("Stripe checkout coming soon!")} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', width: '100%' }}>Upgrade to Premium</button>
                </div>
              ) : (
                <form onSubmit={handleAddLink} className="responsive-stack" style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '12px' }}>
                  <input required type="text" placeholder="Link Title" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }} />
                  <input required type="url" placeholder="https://..." value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} style={{ flex: 2, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }} />
                  <button type="submit" style={{ padding: '14px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>+ Add Link</button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div key="analytics-tab" style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Total Hardware Taps</p>
                <p style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: 0 }}>
                  {stickers.reduce((acc, s) => acc + (s.tap_count || 0), 0)}
                </p>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                  <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Digital Profile Views</p>
                  {!isPremium && <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>}
                </div>
                
                {isPremium ? (
                  <p style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: 0 }}>
                    {pageProfile.profile_views || 0}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '38px' }}>
                     <p style={{ fontSize: '32px', fontWeight: '800', color: '#d1d5db', margin: 0, filter: 'blur(6px)', opacity: 0.5, userSelect: 'none' }}>
                       {pageProfile.profile_views || 342}
                     </p>
                     <button onClick={() => alert("Stripe checkout coming soon!")} style={{ position: 'absolute', padding: '8px 16px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                       🔒 Unlock to View
                     </button>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Best Performing Tag</p>
                <p style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: 0 }}>
                  {stickers.length > 0 ? [...stickers].sort((a,b) => (b.tap_count || 0) - (a.tap_count || 0))[0]?.id || 'N/A' : 'N/A'}
                </p>
              </div>
            </div>

            {isPremium ? (
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', width: '100%', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: 0 }}>Tap Activity</h2>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>Daily performance over the last 7 days</p>
                  </div>
                  {hasRealData ? (
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#3b82f6', backgroundColor: '#eff6ff', padding: '6px 12px', borderRadius: '100px', letterSpacing: '1px' }}>LIVE DATA</span>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', backgroundColor: '#fef3c7', padding: '6px 12px', borderRadius: '100px', letterSpacing: '1px' }}>DEMO DATA</span>
                  )}
                </div>

                <div style={{ width: '100%', height: '300px', minHeight: '300px', position: 'relative' }}>
                  {isMounted && (
                    <ResponsiveContainer width="99%" height="100%">
                      <AreaChart 
                        data={displayChartData} 
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorTaps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: '600'}} dy={10} />
                        <YAxis hide={true} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: '700' }} cursor={{ stroke: '#3b82f6', strokeWidth: 2 }} />
                        <Area type="monotone" dataKey="taps" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTaps)" animationDuration={1500} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb', width: '100%' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📈</div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111', marginBottom: '10px' }}>Advanced Analytics</h2>
                <p style={{ color: '#6b7280', fontSize: '16px', maxWidth: '400px', margin: '0 auto 30px auto' }}>
                  Track your profile visits, link clicks, and view daily performance charts over time.
                </p>
                <div style={{ display: 'inline-block', backgroundColor: '#fef9c3', color: '#854d0e', padding: '6px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', marginBottom: '20px' }}>
                  PREMIUM FEATURE
                </div>
                <button onClick={() => alert("Stripe checkout coming soon!")} style={{ display: 'block', margin: '0 auto', padding: '14px 24px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                  Upgrade to Unlock Charts
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
