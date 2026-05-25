'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link' 

// Import your brand new components cleanly here:
import SettingsModal from '../../components/dashboard/SettingsModal'
import HardwareSection from '../../components/dashboard/HardwareSection'
import PageProfileSection from '../../components/dashboard/PageProfileSection'
import AnalyticsSection from '../../components/dashboard/AnalyticsSection'
import TeamAdminSection from '../../components/dashboard/TeamAdminSection'

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
    profile_status: 'live', remember_me: false, tier: 'free', show_save_contact: true, profile_views: 0
  })
  const [pageLinks, setPageLinks] = useState([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  const [profile, setProfile] = useState(null)
  const [companyId, setCompanyId] = useState(null) // 🔥 Added for B2B
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

  // 🔥 Starts empty now because we are fetching real data
  const [teamMembers, setTeamMembers] = useState([]);

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
      .select('username, display_name, bio, theme_color, max_links, profile_picture_url, job_title, company, phone_number, display_email, profile_status, remember_me, tier, show_save_contact, profile_views, company_id')
      .eq('id', session.user.id)
      .single()

    setProfile({ first_name: firstName })
    setCompanyId(customerData?.company_id) // 🔥 Store the company ID for B2B logic

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

    // 🔥 NEW B2B FETCH: Get the real employees for the manager's company
    if (customerData?.company_id) {
      const { data: teamData } = await supabase
        .from('customers')
        .select('id, display_name, display_email, job_title, profile_status')
        .eq('company_id', customerData.company_id);

      if (teamData) {
        setTeamMembers(teamData.map(member => ({
          id: member.id,
          name: member.display_name || 'Unnamed User',
          email: member.display_email || 'No email',
          title: member.job_title || 'No title',
          tag: 'Unassigned', // We will wire this up to real tags later
          status: member.profile_status === 'live' ? 'active' : 'pending'
        })));
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
          const
