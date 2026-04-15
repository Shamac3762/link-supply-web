'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { notFound } from 'next/navigation'

function getLinkIcon(url) {
  const u = url.toLowerCase();
  if (u.includes('instagram.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
  if (u.includes('linkedin.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>;
  if (u.includes('x.com') || u.includes('twitter.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>;
  if (u.includes('facebook.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
  if (u.includes('wa.me') || u.includes('whatsapp.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>;
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
}

export default function PublicProfilePage({ params }) {
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { username } = await params;
      const { data: profileData } = await supabase.from('customers').select('*').eq('username', username.toLowerCase()).single();
      if (!profileData) return setProfile('not_found');
      const { data: linksData } = await supabase.from('page_links').select('*').eq('owner_id', profileData.id).order('sort_order', { ascending: true });
      setProfile(profileData); setLinks(linksData || []); setLoading(false);
    }
    loadProfile();
  }, [params]);

  if (profile === 'not_found') return notFound();
  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>Loading...</div>;

  const baseColor = profile.theme_color || '#111111';
  const isBusinessCard = profile.phone_number || profile.display_email;
  const vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${profile.display_name || profile.username}\r\nTITLE:${profile.job_title || ''}\r\nORG:${profile.company || ''}\r\nTEL;TYPE=CELL:${profile.phone_number || ''}\r\nEMAIL;TYPE=WORK:${profile.display_email || ''}\r\nURL:https://linksupply.co.uk/u/${profile.username}\r\nEND:VCARD`;
  const vcardData = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`;

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({ title: profile.display_name || profile.username, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href); alert("Link copied!");
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: baseColor,
      // MESH GRADIENT LOGIC: Blends the theme color with deep shadows
      backgroundImage: `radial-gradient(at 0% 0%, rgba(0,0,0,0.4) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0,0,0,0.3) 0px, transparent 50%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: 'white', position: 'relative', overflowX: 'hidden' 
    }}>
      
      <style>{`
        * { box-sizing: border-box; }
        
        /* Smooth Entrance Animation */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        main { animation: fadeIn 0.8s ease-out forwards; }

        .premium-link {
          display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; max-width: 100%; padding: 18px 20px;
          background-color: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px; color: white; text-decoration: none; font-size: 16px; font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        }
        .premium-link:active { transform: scale(0.97); background-color: rgba(255, 255, 255, 0.15); }
        
        .contact-btn {
          display: block; width: 100%; max-width: 100%; padding: 18px 20px; background-color: white; color: ${baseColor}; 
          border-radius: 18px; text-decoration: none; font-size: 16px; font-weight: 800; text-align: center;
          margin-bottom: 30px; box-shadow: 0 15px 30px rgba(0,0,0,0.25); transition: all 0.2s ease;
        }
        .contact-btn:active { transform: scale(0.97); }

        .share-trigger {
          position: absolute; top: 20px; right: 20px; width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%; cursor: pointer; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          z-index: 10;
        }
      `}</style>

      <div onClick={handleShare} className="share-trigger">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      </div>

      <main style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        
        {profile.profile_picture_url ? (
          <img src={profile.profile_picture_url} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.2)', marginBottom: '22px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} />
        ) : (
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', fontWeight: '800', marginBottom: '22px' }}>
            {(profile.display_name || profile.username).charAt(0)}
          </div>
        )}

        {/* VERIFIED BADGE LOGIC */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
            {profile.display_name || profile.username}
          </h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.47 4.89L18.24 4.56L19.47 8.16L23 9.7L21.84 13.33L23.75 16.63L20.35 18.27L18.89 21.73L15.19 20.81L12 23L8.81 20.81L5.11 21.73L3.65 18.27L0.25 16.63L2.16 13.33L1 9.7L4.53 8.16L5.76 4.56L9.53 4.89L12 2Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5"/>
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
          {isBusinessCard && (
            <a href={vcardData} download={`${profile.display_name || profile.username}.vcf`} className="contact-btn">
              📥 Save to Contacts
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

      <footer style={{ marginTop: 'auto', paddingTop: '80px', opacity: 0.4, fontSize: '11px', fontWeight: '800', letterSpacing: '2px' }}>
        <a href="/" style={{ color: 'white', textDecoration: 'none' }}>⚡ POWERED BY LINKSUPPLY</a>
      </footer>
    </div>
  )
}
