import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

// This function detects the platform and returns a clean, white SVG icon
function getLinkIcon(url) {
  const u = url.toLowerCase();
  
  // Instagram
  if (u.includes('instagram.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
  
  // LinkedIn
  if (u.includes('linkedin.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>;
  
  // X (Twitter)
  if (u.includes('x.com') || u.includes('twitter.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>;
  
  // Facebook
  if (u.includes('facebook.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
  
  // WhatsApp
  if (u.includes('wa.me') || u.includes('whatsapp.com')) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>;

  // Default Link Icon for anything else
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
}

export default async function PublicProfilePage({ params }) {
  const { username } = await params
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 🔥 FETCH: Added display_name to the data pull
  const { data: profile, error: profileError } = await supabase
    .from('customers')
    .select('id, username, display_name, bio, theme_color, profile_picture_url, job_title, company, phone_number, display_email')
    .eq('username', username.toLowerCase())
    .single()

  if (profileError || !profile) {
    return notFound() 
  }

  const { data: links } = await supabase
    .from('page_links')
    .select('title, url')
    .eq('owner_id', profile.id)
    .order('sort_order', { ascending: true })

  const bgColor = profile.theme_color || '#111111'
  
  // 🔥 LOGIC: Check if this should act as a Business Card
  const isBusinessCard = profile.phone_number || profile.display_email
  
  // 🔥 ENGINE: Ensure the vCard uses the proper Full Name and EXACT Domain
  let vcardData = ''
  if (isBusinessCard) {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.display_name || profile.username}
TITLE:${profile.job_title || ''}
ORG:${profile.company || ''}
TEL;TYPE=CELL:${profile.phone_number || ''}
EMAIL;TYPE=WORK:${profile.display_email || ''}
URL:https://linksupply.co.uk/u/${profile.username}
END:VCARD`.replace(/\n/g, '\r\n')
    vcardData = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 20px', fontFamily: 'sans-serif', color: 'white', transition: 'background-color 0.3s ease' }}>
      
      <style>{`
        .premium-link {
  display: flex; 
  align-items: center; 
  justify-content: center; 
  width: 100%; 
  padding: 16px 20px;
  background-color: rgba(255, 255, 255, 0.12); /* Slightly brighter */
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px; /* More rounded for premium feel */
  color: white; 
  text-decoration: none; 
  font-size: 16px; 
  font-weight: 600;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px); 
  -webkit-backdrop-filter: blur(12px);
  box-sizing: border-box;
}

.premium-link:hover { 
  background-color: rgba(255, 255, 255, 0.22); 
  transform: scale(1.02); /* Subtle pop effect */
  border-color: rgba(255, 255, 255, 0.4);
}
        
        .contact-btn {
          display: block; width: 100%; padding: 18px 20px;
          background-color: white; color: ${bgColor}; border: none;
          border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 800;
          transition: all 0.2s ease; box-shadow: 0 8px 15px rgba(0,0,0,0.2);
          box-sizing: border-box; text-align: center; margin-bottom: 25px;
        }
        .contact-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
      `}</style>

      <main style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        
        {/* 🔥 UI: Conditionally render the Profile Picture OR the Initials */}
        {profile.profile_picture_url ? (
          <img 
            src={profile.profile_picture_url} 
            alt={profile.display_name || profile.username}
            style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)', marginBottom: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
          />
        ) : (
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '36px', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
            {(profile.display_name || profile.username).charAt(0)}
          </div>
        )}

        {/* 🔥 UI: Display the Full Name, fallback to username if blank */}
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 5px 0', letterSpacing: '-0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          {profile.display_name || profile.username}
        </h1>

        {/* 🔥 UI: Conditionally render Job Title and Company cleanly */}
        {(profile.job_title || profile.company) && (
          <h2 style={{ fontSize: '15px', fontWeight: '600', opacity: 0.9, margin: '0 0 15px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {profile.job_title}
            {profile.job_title && profile.company && <span style={{ margin: '0 8px', opacity: 0.5 }}>•</span>}
            {profile.company}
          </h2>
        )}
        
        {profile.bio && (
          <p style={{ fontSize: '15px', lineHeight: '1.6', opacity: 0.9, marginBottom: '30px', padding: '0 10px', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            {profile.bio}
          </p>
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 🔥 UI: The Magic "Save to Contacts" Button */}
          {isBusinessCard && (
            <a href={vcardData} download={`${profile.display_name || profile.username}.vcf`} className="contact-btn">
              📥 Save to Contacts
            </a>
          )}

          {links && links.length > 0 ? (
            links.map((link, index) => (
              <a key={index} href={link.url} target="_blank" rel="noreferrer" className="premium-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                {/* This calls the icon engine */}
                <span style={{ display: 'flex', opacity: 0.8 }}>{getLinkIcon(link.url)}</span>
                <span>{link.title}</span>
                </a>
            ))}
                      
            ))
          ) : (
            <p style={{ opacity: 0.7, fontSize: '14px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px' }}>No links available yet.</p>
          )}
        </div>

      </main>

      <footer style={{ marginTop: 'auto', paddingTop: '50px', opacity: 0.6, fontSize: '13px', fontWeight: '600' }}>
        <a href="/" style={{ color: 'white', textDecoration: 'none', letterSpacing: '0.5px' }}>⚡ Powered by Link Supply</a>
      </footer>
    </div>
  )
}
