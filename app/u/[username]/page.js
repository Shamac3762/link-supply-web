import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PublicProfilePage({ params }) {
  const { username } = await params
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 🔥 NEW: Fetching the new Business Card fields
  const { data: profile, error: profileError } = await supabase
    .from('customers')
    .select('id, username, bio, theme_color, profile_picture_url, job_title, company, phone_number, display_email')
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
  
  // 🔥 ENGINE: Instantly generate the .vcf contact file string
  let vcardData = ''
  if (isBusinessCard) {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.company || profile.username}
TITLE:${profile.job_title || ''}
ORG:${profile.company || ''}
TEL;TYPE=CELL:${profile.phone_number || ''}
EMAIL;TYPE=WORK:${profile.display_email || ''}
URL:https://${process.env.NEXT_PUBLIC_VERCEL_URL || 'linksupply.com'}/u/${profile.username}
END:VCARD`.replace(/\n/g, '\r\n')
    vcardData = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 20px', fontFamily: 'sans-serif', color: 'white', transition: 'background-color 0.3s ease' }}>
      
      <style>{`
        .premium-link {
          display: block; width: 100%; padding: 18px 20px;
          background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px; color: white; text-decoration: none; font-size: 16px; font-weight: 600;
          transition: all 0.2s ease; backdrop-filter: blur(10px); box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          box-sizing: border-box; text-align: center;
        }
        .premium-link:hover { background-color: rgba(255, 255, 255, 0.2); transform: translateY(-2px); }
        
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
            alt={profile.username}
            style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)', marginBottom: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
          />
        ) : (
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '36px', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
            {profile.username.charAt(0)}
          </div>
        )}

        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 5px 0', letterSpacing: '-0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          {profile.username}
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
            <a href={vcardData} download={`${profile.username}.vcf`} className="contact-btn">
              📥 Save to Contacts
            </a>
          )}

          {links && links.length > 0 ? (
            links.map((link, index) => (
              <a key={index} href={link.url} target="_blank" rel="noreferrer" className="premium-link">
                {link.title}
              </a>
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
