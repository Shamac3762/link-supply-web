'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { notFound } from 'next/navigation'
import Link from 'next/link' 

// 🔥 HELPER: Ensures icon visibility regardless of brand color
function getLinkIcon(url) {
  const u = url.toLowerCase();
  if (u.includes('instagram.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
  if (u.includes('linkedin.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>;
  if (u.includes('x.com') || u.includes('twitter.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>;
  if (u.includes('facebook.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
  if (u.includes('wa.me') || u.includes('whatsapp.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>;
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
}

function getContrastColor(hexcolor) {
  if (!hexcolor || hexcolor.startsWith('linear') || hexcolor.startsWith('radial')) return 'white';
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#111111' : 'white'; 
}

export default function PublicProfilePage({ params }) {
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [hideFloater, setHideFloater] = useState(false); 
  
  const footerRef = useRef(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { username } = await params;
      const { data: profileData } = await supabase.from('customers').select('*').eq('username', username.toLowerCase()).single();
      if (!profileData) return setProfile('not_found');
      
      await supabase.rpc('increment_profile_views', { profile_username: username.toLowerCase() });
      
      const { data: linksData } = await supabase.from('page_links').select('*').eq('owner_id', profileData.id).order('sort_order', { ascending: true });
      
      let linkLimit = 2;
      if (profileData.tier !== 'free') {
          linkLimit = (profileData.max_links && profileData.max_links > 15) ? profileData.max_links : 15;
      }
      
      setProfile(profileData); 
      setLinks((linksData || []).slice(0, linkLimit)); 
      setLoading(false);
    }
    loadProfile();
  }, [params]);

  // 🔥 Flawless scroll detection: calculates exact pixel position of the footer
  useEffect(() => {
    const checkCollision = () => {
      if (!footerRef.current) return;
      const footerRect = footerRef.current.getBoundingClientRect();
      
      // If the top of the footer enters the bottom of the screen, hide the floating button
      if (footerRect.top <= window.innerHeight) {
        setHideFloater(true);
      } else {
        setHideFloater(false);
      }
    };

    window.addEventListener('scroll', checkCollision, { passive: true });
    window.addEventListener('resize', checkCollision);
    
    // Quick checks after load to ensure state is accurate
    setTimeout(checkCollision, 100);
    setTimeout(checkCollision, 500);

    return () => {
      window.removeEventListener('scroll', checkCollision);
      window.removeEventListener('resize', checkCollision);
    };
  }, [loading, profile]);

  if (profile === 'not_found') return notFound();
  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>Loading...</div>;

  const baseColor = profile.theme_color || '#111111';
  const textColor = getContrastColor(baseColor);
  const showBranding = profile.tier === 'free' || !profile.remove_branding;

  // Inline styling constants for guaranteed rendering (fixes Next.js CSS bugs)
  const glassBorder = `1px solid ${textColor === 'white' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`;
  const glassBackground = textColor === 'white' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  if (profile.profile_status === 'coming_soon') {
    return (
      <div style={{ 
        minHeight: '100vh', backgroundColor: baseColor,
        backgroundImage: profile.bg_css || `radial-gradient(at 0% 0%, rgba(0,0,0,0.4) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0,0,0,0.3) 0px, transparent 50%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: textColor, position: 'relative', overflowX: 'hidden' 
      }}>
        <style dangerouslySetInnerHTML={{ __html: `html, body { margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; }` }} />
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: glassBackground, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: glassBorder, marginBottom: '30px' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 12px 0', letterSpacing: '-0.5px', textAlign: 'center' }}>@{profile.username}</h1>
        <p style={{ fontSize: '15px', fontWeight: '500', opacity: 0.7, margin: 0, textAlign: 'center', maxWidth: '280px', lineHeight: '1.6' }}>This page is currently being prepared.</p>
      </div>
    )
  }

  const handleSaveContact = (e) => {
    e.preventDefault();
    const vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${profile.display_name || profile.username}\r\nTITLE:${profile.job_title || ''}\r\nORG:${profile.company || ''}\r\nTEL;TYPE=CELL:${profile.phone_number || ''}\r\nEMAIL;TYPE=WORK:${profile.display_email || ''}\r\nURL:https://linksupply.co.uk/u/${profile.username}\r\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      window.location.assign(url);
    } else {
      const link = document.createElement('a'); link.href = url; link.download = `${profile.display_name || profile.username}.vcf`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const profileUrl = typeof window !== 'undefined' ? window.location.href : `https://linksupply.co.uk/u/${profile.username}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(profileUrl)}&margin=10`;

  const handleShare = async () => {
    if (navigator.share) { navigator.share({ title: profile.display_name || profile.username, url: window.location.href }); } 
    else { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }
  };

  return (
    <div style={{ 
      minHeight: '100vh', backgroundColor: baseColor,
      backgroundImage: profile.bg_css || `radial-gradient(at 0% 0%, rgba(0,0,0,0.4) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0,0,0,0.3) 0px, transparent 50%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
      color: textColor, position: 'relative', overflowX: 'hidden' 
    }}>
      {/* Strict global CSS reset to prevent white border edges */}
      <style dangerouslySetInnerHTML={{ __html: `html, body { margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; background-color: ${baseColor}; }` }} />

      {/* Dynamic Cover Photo */}
      {profile.cover_photo_url && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '200px', backgroundImage: `url(${profile.cover_photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottomLeftRadius: '35px', borderBottomRightRadius: '35px', zIndex: 0 }} />
      )}

      {/* Top action triggers (Inline Borders applied) */}
      <div onClick={() => setShowQr(true)} style={{ position: 'absolute', top: '20px', left: '20px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: glassBackground, border: glassBorder, borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 10, color: textColor }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      </div>

      <div onClick={handleShare} style={{ position: 'absolute', top: '20px', right: '20px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: glassBackground, border: glassBorder, borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 10, color: textColor }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: '1 0 auto', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '60px 20px 40px 20px', zIndex: 1 }}>
        
        {/* Profile Picture */}
        {profile.profile_picture_url ? (
          <img src={profile.profile_picture_url} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: `4px solid ${textColor === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`, marginBottom: '22px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', marginTop: profile.cover_photo_url ? '80px' : '0' }} />
        ) : (
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: glassBackground, border: `4px solid ${textColor === 'white' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', fontWeight: '800', marginBottom: '22px', marginTop: profile.cover_photo_url ? '80px' : '0' }}>
            {(profile.display_name || profile.username).charAt(0)}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>{profile.display_name || profile.username}</h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.47 4.89L18.24 4.56L19.47 8.16L23 9.7L21.84 13.33L23.75 16.63L20.35 18.27L18.89 21.73L15.19 20.81L12 23L8.81 20.81L5.11 21.73L3.65 18.27L0.25 16.63L2.16 13.33L1 9.7L4.53 8.16L5.76 4.56L9.53 4.89L12 2Z" fill="#3b82f6" fillOpacity="1" stroke={textColor} strokeWidth="1.5"/>
            <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {(profile.job_title || profile.company) && (
          <h2 style={{ fontSize: '13px', fontWeight: '700', opacity: 0.7, margin: '0 0 25px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {profile.job_title} {profile.job_title && profile.company && '•'} {profile.company}
          </h2>
        )}
        
        {profile.bio && <p style={{ fontSize: '16px', lineHeight: '1.6', opacity: 0.85, marginBottom: '40px', padding: '0 20px' }}>{profile.bio}</p>}

        {/* Links Container */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {profile.show_save_contact !== false && (
            <button onClick={handleSaveContact} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '18px 20px', backgroundColor: textColor === 'white' ? 'white' : '#111111', color: textColor === 'white' ? baseColor : 'white', borderRadius: '100px', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', marginBottom: '14px', boxShadow: '0 8px 24px -6px rgba(0,0,0,0.3)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
              Save to Contacts
            </button>
          )}

          {links.map((link, index) => (
            <a key={index} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%', padding: '18px 20px', backgroundColor: glassBackground, border: glassBorder, borderRadius: '18px', color: textColor, textDecoration: 'none', fontSize: '16px', fontWeight: '600', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <span style={{ display: 'flex', opacity: 0.8 }}>{getLinkIcon(link.url)}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.title}</span>
            </a>
          ))}
        </div>
      </main>

      {/* Floating Acquisition Button (Fades out flawlessly based on intersection calculation) */}
      {showBranding && (
        <a href="https://linksupply.co.uk" style={{ position: 'fixed', bottom: '30px', left: '50%', transform: hideFloater ? 'translate(-50%, 15px)' : 'translateX(-50%)', opacity: hideFloater ? 0 : 1, pointerEvents: hideFloater ? 'none' : 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: glassBackground, border: glassBorder, borderRadius: '100px', color: textColor, textDecoration: 'none', fontSize: '14px', fontWeight: '700', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', zIndex: 100, transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '16px' }}>⚡</span>
          <span>Get your free digital profile</span>
        </a>
      )}

      {/* Static Footer (Now in normal document flow, preventing overlay bugs!) */}
      <a ref={footerRef} href="/login" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: textColor, opacity: 0.6, textDecoration: 'none', padding: '40px 0 30px 0', transition: 'opacity 0.2s ease', zIndex: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '700' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          LinkSupply
        </span>
        <span style={{ fontSize: '10px', fontWeight: '600', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Manage your page
        </span>
      </a>

      {/* QR Modal */}
      {showQr && (
        <div onClick={() => setShowQr(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '35px 30px', borderRadius: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '320px', width: '100%' }}>
            <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '20px', marginBottom: '20px' }}>
              <img src={qrImageUrl} alt="QR Code" style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }} />
            </div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: '800', color: '#111' }}>@{profile.username}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Scan to view profile</p>
          </div>
          <button onClick={() => setShowQr(false)} style={{ marginTop: '30px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '50%', width: '56px', height: '56px', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>&times;</button>
        </div>
      )}

    </div>
  )
}
