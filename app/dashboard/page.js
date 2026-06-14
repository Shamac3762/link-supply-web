'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link' 

import SettingsModal from '../../components/dashboard/SettingsModal'
import HardwareSection from '../../components/dashboard/HardwareSection'
import PageProfileSection from '../../components/dashboard/PageProfileSection'
import AnalyticsSection from '../../components/dashboard/AnalyticsSection'
import TeamAdminSection from '../../components/dashboard/TeamAdminSection'
import PricingSection from '../../components/dashboard/PricingSection' 

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
  const [userId, setUserId] = useState(null)
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const [stickers, setStickers] = useState([])
  const [chartData, setChartData] = useState([]) 
  const [claimId, setClaimId] = useState('')
  const [claimPin, setClaimPin] = useState('')
  const [claimMessage, setClaimMessage] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)
  
  const [pageProfile, setPageProfile] = useState({ 
    username: '', display_name: '', bio: '', theme_color: '#111111',
    profile_picture_url: '', job_title: '', company: '', phone_number: '', display_email: '',
    profile_status: 'live', remember_me: false, tier: 'free', show_save_contact: true, profile_views: 0
  })
  const [pageLinks, setPageLinks] = useState([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  const [profile, setProfile] = useState(null)
  const [companyId, setCompanyId] = useState(null)
  const [companyName, setCompanyName] = useState('') 
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
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    setIsMounted(true)
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    setUserId(session.user.id)

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
      .select('username, display_name, bio, theme_color, max_links, profile_picture_url, job_title, company, phone_number, display_email, profile_status, remember_me, tier, show_save_contact, profile_views, company_id')
      .eq('id', session.user.id)
      .single()

    setProfile({ first_name: firstName })
    setCompanyId(customerData?.company_id)

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

    let currentStickers = [];
    const { data: stickerData } = await supabase.from('nfc_stickers').select('*').eq('owner_id', session.user.id).order('id', { ascending: true })
    if (stickerData) {
      setStickers(stickerData);
      currentStickers = stickerData;
    }

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

    if (customerData?.company_id) {
      const { data: compData } = await supabase.from('companies').select('company_name').eq('id', customerData.company_id).single();
      if (compData) setCompanyName(compData.company_name);

      const { data: teamData = [] } = await supabase
        .from('customers')
        .select('id, display_name, display_email, job_title, profile_status, username') 
        .eq('company_id', customerData.company_id);

      if (teamData) {
        setTeamMembers(teamData.map(member => {
          const assignedTag = currentStickers.find(s => s.target_url && s.target_url.includes(`/u/${member.username}`));

          return {
            id: member.id,
            username: member.username, 
            name: member.display_name || 'Unnamed User',
            email: member.display_email || 'No email',
            title: member.job_title || 'No title',
            tag: assignedTag ? assignedTag.id : 'Unassigned',
            status: member.profile_status === 'live' ? 'active' : 'pending'
          }
        }));
      }
    }

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
        id: session.user.id, display_name: pageProfile.display_name, bio: pageProfile.bio, theme_color: pageProfile.theme_color, 
        profile_picture_url: pageProfile.profile_picture_url, job_title: pageProfile.job_title, company: pageProfile.company, 
        phone_number: pageProfile.phone_number, display_email: pageProfile.display_email, profile_status: pageProfile.profile_status, 
        remember_me: pageProfile.remember_me, show_save_contact: pageProfile.show_save_contact
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

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false); 
  }

  const isAtLimit = pageLinks.length >= maxLinks
  const displayLimit = maxLinks > 100 ? 'Unlimited' : maxLinks
  const isPremium = pageProfile.tier !== 'free';

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
        .responsive-nav { padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; background-color: white; position: relative; z-index: 50; }
        .responsive-tabs { display: flex; gap: 10px; margin-bottom: 30px; background-color: #e5e7eb; padding: 6px; border-radius: 12px; overflow-x: auto; white-space: nowrap; }
        
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; }
        .responsive-stack { display: flex; gap: 12px; width: 100%; max-width: 100%; }
        .link-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; }
        .url-input-container { display: flex; align-items: center; background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; width: 100%; }
        .url-prefix { color: #6b7280; font-size: 15px; padding: 14px; font-weight: 500; border-right: 1px solid #e5e7eb; background-color: #f3f4f6; white-space: nowrap; }
        .b2b-table { width: 100%; border-collapse: collapse; text-align: left; }
        .b2b-table th { padding: 16px 20px; background-color: #f9fafb; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; font-weight: 700; }
        .b2b-table td { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; color: #111; font-size: 14px; }
        .b2b-table tr:last-child td { border-bottom: none; }
        .b2b-table tr:hover { background-color: #f9fafb; }

        .mobile-menu-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; backdrop-filter: blur(2px); }
        .mobile-menu-drawer { display: none; position: fixed; top: 0; right: 0; bottom: 0; width: 280px; background: white; z-index: 50; flex-direction: column; padding: 20px; box-shadow: -5px 0 25px rgba(0,0,0,0.1); transform: translateX(100%); transition: transform 0.3s ease-in-out; }
        .mobile-menu-drawer.open { transform: translateX(0); }
        
        .hamburger-btn { display: none; background: none; border: none; font-size: 24px; cursor: pointer; color: #111; padding: 5px; }

        @media (max-width: 768px) {
          .responsive-nav { padding: 15px 20px; }
          .desktop-nav-elements { display: none !important; }
          .hamburger-btn { display: block; }
          .responsive-tabs { display: none; }
          .mobile-menu-overlay { display: block; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
          .mobile-menu-overlay.open { opacity: 1; pointer-events: auto; }
          .mobile-menu-drawer { display: flex; }
          
          .responsive-grid { grid-template-columns: 1fr; }
          .responsive-stack { flex-direction: column; align-items: stretch; }
          .responsive-stack > input, .responsive-stack > button { width: 100% !important; max-width: 100% !important; }
          .header-stack { flex-direction: column; align-items: flex-start !important; gap: 15px; width: 100%; flex-wrap: wrap; }
          .header-stack .actions { width: 100%; display: flex; justify-content: space-between; }
          .link-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .link-row button { width: 100%; }
          .url-input-container { flex-direction: column; align-items: stretch; }
          .url-prefix { border-right: none; border-bottom: 1px solid #e5e7eb; font-size: 13px; padding: 10px 14px; }
          .b2b-table-wrapper { overflow-x: auto; }

          /* NEW MOBILE ADJUSTMENTS FOR HEADER VISIBILITY */
          .main-content { margin: 20px auto !important; padding: 0 15px !important; }
          .dashboard-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; margin-bottom: 20px !important; }
        }
      `}</style>

      {showSettings && (
        <SettingsModal 
          setShowSettings={setShowSettings} newPassword={newPassword} setNewPassword={setNewPassword}
          handleUpdatePassword={handleUpdatePassword} pageProfile={pageProfile} handleToggleRememberMe={handleToggleRememberMe}
          handleDeleteAccount={handleDeleteAccount} settingsMessage={settingsMessage} setSettingsMessage={setSettingsMessage}
        />
      )}

      {/* --- MOBILE SIDE DRAWER MENU --- */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)} />
      <div className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '18px', fontWeight: '800' }}>Menu</span>
          <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        {/* MOBILE ONLY: GREETING & TIER BADGE IN MENU */}
        <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Hi, {pageProfile.display_name || pageProfile.username || 'User'} 👋
          </h2>
          <span style={{ 
            fontSize: '11px', fontWeight: '800', backgroundColor: isPremium ? '#d1fae5' : '#f3f4f6', 
            color: isPremium ? '#065f46' : '#6b7280', padding: '4px 10px', borderRadius: '20px', 
            textTransform: 'uppercase', border: isPremium ? '1px solid #86efac' : '1px solid #e5e7eb',
            display: 'inline-block'
          }}>
            {pageProfile.tier} Workspace
          </span>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => handleTabClick('hardware')} style={{ textAlign: 'left', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '16px', backgroundColor: activeTab === 'hardware' ? '#f3f4f6' : 'transparent', color: activeTab === 'hardware' ? '#111' : '#4b5563' }}>My Hardware</button>
          <button onClick={() => handleTabClick('page')} style={{ textAlign: 'left', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '16px', backgroundColor: activeTab === 'page' ? '#f3f4f6' : 'transparent', color: activeTab === 'page' ? '#111' : '#4b5563' }}>My Page</button>
          <button onClick={() => handleTabClick('analytics')} style={{ textAlign: 'left', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '16px', backgroundColor: activeTab === 'analytics' ? '#f3f4f6' : 'transparent', color: activeTab === 'analytics' ? '#111' : '#4b5563' }}>📈 Analytics</button>
          <button onClick={() => handleTabClick('pricing')} style={{ textAlign: 'left', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '16px', backgroundColor: activeTab === 'pricing' ? '#111' : 'transparent', color: activeTab === 'pricing' ? 'white' : '#4b5563' }}>⭐ {isPremium ? 'My Plan' : 'Upgrade'}</button>
          {isPremium && (
            <button onClick={() => handleTabClick('team')} style={{ textAlign: 'left', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '16px', backgroundColor: activeTab === 'team' ? '#f3f4f6' : 'transparent', color: activeTab === 'team' ? '#111' : '#4b5563' }}>🏢 Team Admin</button>
          )}
        </nav>
        
        <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => { setIsMobileMenuOpen(false); setShowSettings(true); }} style={{ padding: '10px', backgroundColor: '#f3f4f6', color: '#111', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}>⚙️ Settings</button>
          <button onClick={handleLogout} style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}>Log Out</button>
        </div>
      </div>
      {/* ---------------------------------- */}

      {/* ULTRA-CLEAN TOP NAVIGATION */}
      <nav className="responsive-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{ fontFamily: '"Myriad Pro", "Segoe UI", Roboto, sans-serif', fontSize: '22px', color: '#111', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontWeight: '700' }}>Link</span><span style={{ fontWeight: '400' }}>Supply.</span>
            </div>
          </Link>
        </div>
        
        <button 
          className="hamburger-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        <div className="desktop-nav-elements" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setShowSettings(true)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#111', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>⚙️ Settings</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Log Out</button>
        </div>
      </nav>

      <main className="main-content" style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', width: '100%' }}>
        
        {/* NEW DASHBOARD HEADER: GREETING & TIER BADGE */}
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>
              Welcome back, {pageProfile.display_name || pageProfile.username || 'User'} 👋
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>Manage your workspace, hardware, and digital network.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              fontSize: '12px', fontWeight: '800', backgroundColor: isPremium ? '#d1fae5' : '#f3f4f6', 
              color: isPremium ? '#065f46' : '#6b7280', padding: '6px 14px', borderRadius: '20px', 
              textTransform: 'uppercase', border: isPremium ? '1px solid #86efac' : '1px solid #e5e7eb',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              {pageProfile.tier} Workspace
            </span>
          </div>
        </div>

        {/* HORIZONTAL TABS (Desktop Only) */}
        <div className="responsive-tabs">
          <button onClick={() => setActiveTab('hardware')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'hardware' ? 'white' : 'transparent', color: activeTab === 'hardware' ? '#111' : '#6b7280', boxShadow: activeTab === 'hardware' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>My Hardware</button>
          <button onClick={() => setActiveTab('page')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'page' ? 'white' : 'transparent', color: activeTab === 'page' ? '#111' : '#6b7280', boxShadow: activeTab === 'page' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>My Page</button>
          <button onClick={() => setActiveTab('analytics')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'analytics' ? 'white' : 'transparent', color: activeTab === 'analytics' ? '#111' : '#6b7280', boxShadow: activeTab === 'analytics' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>📈 Analytics</button>
          
          <button onClick={() => setActiveTab('pricing')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'pricing' ? '#111' : 'transparent', color: activeTab === 'pricing' ? 'white' : '#6b7280', transition: 'all 0.2s' }}>⭐ {isPremium ? 'My Plan' : 'Upgrade'}</button>
          
          {isPremium && (
            <button onClick={() => setActiveTab('team')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'team' ? 'white' : 'transparent', color: activeTab === 'team' ? '#111' : '#6b7280', boxShadow: activeTab === 'team' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>🏢 Team Admin</button>
          )}
        </div>

        {activeTab === 'hardware' && (
          <HardwareSection 
            claimId={claimId} setClaimId={setClaimId} claimPin={claimPin} setClaimPin={setClaimPin}
            handleActivateTag={handleActivateTag} claimMessage={claimMessage} stickers={stickers}
            setStickers={setStickers} isPremium={isPremium} pageProfile={pageProfile}
            handleToggleActive={handleToggleActive} handleSaveHardwareChanges={handleSaveHardwareChanges} saveStatus={saveStatus}
          />
        )}

        {activeTab === 'page' && (
          <PageProfileSection 
            pageProfile={pageProfile} setPageProfile={setPageProfile} getContrastColor={getContrastColor}
            fileInputRef={fileInputRef} handleImageUpload={handleImageUpload} isUploading={isUploading}
            isPremium={isPremium} handleSaveProfile={handleSaveProfile} saveStatus={saveStatus}
            pageLinks={pageLinks} isAtLimit={isAtLimit} displayLimit={displayLimit} handleDeleteLink={handleDeleteLink}
            newLinkTitle={newLinkTitle} setNewLinkTitle={setNewLinkTitle} newLinkUrl={newLinkUrl} setNewLinkUrl={setNewLinkUrl}
            handleAddLink={handleAddLink}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsSection 
            stickers={stickers} isPremium={isPremium} pageProfile={pageProfile}
            hasRealData={hasRealData} displayChartData={displayChartData} isMounted={isMounted}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingSection userId={userId} userTier={pageProfile.tier} />
        )}

        {activeTab === 'team' && isPremium && (
          <TeamAdminSection 
            teamMembers={teamMembers} 
            supabase={supabase} 
            companyId={companyId} 
            companyName={companyName}
            stickers={stickers} 
            refreshData={fetchData} 
          />
        )}
      </main>
    </div>
  )
}
