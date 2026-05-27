'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { notFound } from 'next/navigation'
import Link from 'next/link' 

// 🔥 HELPER: This ensures text is always visible regardless of the brand color
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
  const [showQr, setShowQr] = useState(false); // 🔥 NEW: QR Modal State
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { username } = await params;
      const { data: profileData } = await supabase.from('customers').select('*').eq('username', username.toLowerCase()).single();
      if (!profileData) return setProfile('not_found');
      
      const { error: rpcError } = await supabase.rpc('increment_profile_views', { profile_username: username.toLowerCase() });
      if (rpcError) console.error("❌ SUPABASE TRACKING ERROR:", rpcError.message);
      
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

  if (profile === 'not_found') return notFound();
  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>Loading...</div>;

  const baseColor = profile.theme_color || '#111111';
  const textColor = getContrastColor(baseColor);
  
  if (profile.profile_status === 'coming_soon') {
    return (
      <div style={{ 
        minHeight: '100vh', backgroundColor: baseColor,
        backgroundImage: profile.bg_css || `radial-gradient(at 0% 0%, rgba(0,0,0,0.4) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0,0,0,0.3) 0px, transparent 50%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: textColor, position: 'relative', overflowX: 'hidden' 
      }}>
        <style>{`
          @keyframes subtlePulse {
            0% { opacity: 0.5; transform: scale(0.95); }
            50% { opacity: 1; transform: scale(1); }
            100% { opacity: 0.5; transform: scale(0.95); }
          }
          .premium-lock { animation: subtlePulse 3.5s infinite ease-in-out; margin-bottom: 30px; }
        `}</style>
        
        <div className="premium-lock" style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          backgroundColor: textColor === 'white' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', 
          border: `1px solid ${textColor === 'white' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
          display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)'
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 12px 0', letterSpacing: '-0.5px', textAlign: 'center' }}>
          @{profile.username}
        </h1>
        <p style={{ fontSize: '15px', fontWeight: '500', opacity: 0.7, margin: 0, textAlign: 'center', maxWidth: '280px', lineHeight: '1.6' }}>
          This page is currently being prepared. Please check back soon.
        </p>

        {profile.tier === 'free' && (
          <footer style={{ position: 'absolute', bottom: '40px', opacity: 0.4, fontSize: '11px', fontWeight: '800', letterSpacing: '2px' }}>
            <a href="/" style={{ color: textColor, textDecoration: 'none' }}>⚡ POWERED BY LINKSUPPLY</a>
          </footer>
        )}
      </div>
    )
  }

  const showContactBtn = profile.show_save_contact !== false;
  const vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${profile.display_name || profile.username}\r\nTITLE:${profile.job_title || ''}\r\nORG:${profile.company || ''}\r\nTEL;TYPE=CELL:${profile.phone_number || ''}\r\nEMAIL;TYPE=WORK:${profile.display_email || ''}\r\nURL:https://linksupply.co.uk/u/${profile.username}\r\nEND:VCARD`;
  const vcardData = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`;

  // 🔥 URL to generate the dynamic QR Code image
  const profileUrl = typeof window !== 'undefined' ? window.location.href : `https://linksupply.co.uk/u/${profile.username}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(profileUrl)}&margin=10`;

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({ title: profile.display_name || profile.username, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href); alert("Link copied!");
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', backgroundColor: baseColor,
      backgroundImage: profile.bg_css || `radial-gradient(at 0% 0%, rgba(0,0,0,0.4) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0,0,0,0.3) 0px, transparent 50%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
      color: textColor, position: 'relative', overflowX: 'hidden' 
    }}>
      
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalFadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(15px); } }
        @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        
        main { animation: fadeIn 0.8s ease-out forwards; }

        .premium-link {
          display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; max-width: 100%; padding: 18px 20px;
          background-color: ${textColor === 'white' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}; 
          border: 1px solid ${textColor === 'white' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 18px; color: ${textColor}; text-decoration: none; font-size: 16px; font-weight: 600;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        }
        .premium-link:active { transform: scale(0.97); background-color: rgba(255, 255, 255, 0.15); }
        
        .contact-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; max-width: 100%; padding: 18px 20px; 
          background-color: ${textColor === 'white' ? 'white' : '#111111'}; color: ${textColor === 'white' ? baseColor : 'white'}; 
          border-radius: 100px; text-decoration: none; font-size: 16px; font-weight: 700; text-align: center;
          margin-bottom: 30px; box-shadow: 0 8px 24px -6px rgba(0,0,0,0.3); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .contact-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 28px -8px rgba(0,0,0,0.4); }
        .contact-btn:active { transform: scale(0.96); box-shadow: 0 4px 12px -4px rgba(0,0,0,0.3); }

        .action-trigger {
          position: absolute; top: 20px; width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: ${textColor === 'white' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; 
          border: 1px solid ${textColor === 'white' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 50%; cursor: pointer; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          z-index: 10; color: ${textColor}; transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .action-trigger:active { transform: scale(0.92); }
        
        .qr-modal {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;
          background-color: rgba(0,0,0,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 20px; animation: modalFadeIn 0.3s forwards;
        }
        .qr-card {
          background-color: white; padding: 35px 30px; border-radius: 32px; display: flex; flex-direction: column; align-items: center;
          box-shadow: 0 30px 60px -15px rgba(0,0,0,0.6); animation: popIn 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; max-width: 320px; width: 100%;
        }
      `}</style>

      {/* 🔥 THE NEW QR BUTTON (Top Left) */}
      <div onClick={() => setShowQr(true)} className="action-trigger" style={{ left: '20px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      </div>

      {/* THE SHARE BUTTON (Top Right) */}
      <div onClick={handleShare} className="action-trigger" style={{ right: '20px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      </div>

      <main style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        
        {profile.profile_picture_url ? (
          <img src={profile.profile_picture_url} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: `4px solid ${textColor === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`, marginBottom: '22px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} />
        ) : (
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: `${textColor === 'white' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`, border: `2px solid ${textColor === 'white' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', fontWeight: '800', marginBottom: '22px' }}>
            {(profile.display_name || profile.username).charAt(0)}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
            {profile.display_name || profile.username}
          </h1>
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

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {showContactBtn && (
            <a href={vcardData} download={`${profile.display_name || profile.username}.vcf`} className="contact-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Save to Contacts
            </a>
          )}

          {links.map((link, index) => (
            <a key={index} href={link.url} target="_blank" rel="noreferrer" className="premium-link">
              <span style={{ display: 'flex', opacity: 0.8 }}>{getLinkIcon(link.url)}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.title}</span>
            </a>
          ))}
        </div>
      </main>

      {/* MARKETING: Hidden for Premium Users */}
      {profile.tier === 'free' && (
        <footer style={{ marginTop: 'auto', paddingTop: '80px', opacity: 0.4, fontSize: '11px', fontWeight: '800', letterSpacing: '2px' }}>
          <a href="/" style={{ color: textColor, textDecoration: 'none' }}>⚡ POWERED BY LINKSUPPLY</a>
        </footer>
      )}

      {/* 🔥 THE CINEMATIC QR MODAL OVERLAY */}
      {showQr && (
        <div className="qr-modal" onClick={() => setShowQr(false)}>
          <div className="qr-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
              <img src={qrImageUrl} alt="Profile QR Code" style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }} />
            </div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: '800', color: '#111' }}>@{profile.username}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Scan to view profile</p>
          </div>
          
          {/* Close Button below the card */}
          <button onClick={() => setShowQr(false)} style={{ marginTop: '30px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%', width: '56px', height: '56px', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'} onMouseOut={(e) => e.target.style.transform = 'scale(1)'}>
            &times;
          </button>
        </div>
      )}

    </div>
  )
}
