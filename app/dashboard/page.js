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

  const [companyId, setCompanyId] = useState(null)
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
    if (!session) return router.push('/login') 

    const { data: customerData } = await supabase
      .from('customers')
      .select('username, display_name, bio, theme_color, max_links, profile_picture_url, job_title, company, phone_number, display_email, profile_status, remember_me, tier, show_save_contact, profile_views, company_id')
      .eq('id', session.user.id)
      .single()

    setCompanyId(customerData?.company_id)

    setPageProfile({
      username: customerData?.username || '', 
      display_name: customerData?.display_name || '',
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
    setMaxLinks(userTier !== 'free' ? (customerData?.max_links > 15 ? customerData.max_links : 15) : 2);

    const { data: stickerData } = await supabase.from('nfc_stickers').select('*').eq('owner_id', session.user.id).order('id', { ascending: true })
    if (stickerData) setStickers(stickerData)

    const { data: linksData } = await supabase.from('page_links').select('*').eq('owner_id', session.user.id).order('sort_order', { ascending: true })
    if (linksData) setPageLinks(linksData)

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
          tag: 'Unassigned',
          status: member.profile_status === 'live' ? 'active' : 'pending'
        })));
      }
    }
    setLoading(false)
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

  // ... (Keep all your existing helper functions like handleSaveProfile, etc., here)
  // I have omitted them for brevity, but make sure they are included in your full file.

  return (
    // ... (Your JSX structure remains the same as previously validated)
    <div>{/* Shell content */}</div>
  )
}
