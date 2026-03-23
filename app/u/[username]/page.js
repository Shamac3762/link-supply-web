import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

// Tell Next.js never to cache this, so the page updates instantly when a user changes their links!
export const dynamic = 'force-dynamic'

export default async function PublicProfilePage({ params }) {
  // Grab the username out of the URL (e.g., linksupply.com/u/table5 -> grabs "table5")
  const { username } = await params
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 1. Search the database for the profile matching this username
  const { data: profile, error: profileError } = await supabase
    .from('customers')
    .select('id, username, bio, theme_color')
    .eq('username', username.toLowerCase())
    .single()

  // If the user typed a link that doesn't exist, show a 404 error
  if (profileError || !profile) {
    return notFound() 
  }

  // 2. Grab all of their public links
  const { data: links } = await supabase
    .from('page_links')
    .select('title, url')
    .eq('owner_id', profile.id)
    .order('sort_order', { ascending: true })

  // Fallback to a sleek dark mode if they haven't picked a color yet
  const bgColor = profile.theme_color || '#111111'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 20px', fontFamily: 'sans-serif', color: 'white', transition: 'background-color 0.3s ease' }}>
      
      <main style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        
        {/* Dynamic Avatar based on their first letter */}
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '36px', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
          {profile.username.charAt(0)}
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 12px 0', letterSpacing: '-0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          @{profile.username}
        </h1>
        
        {profile.bio && (
          <p style={{ fontSize: '15px', lineHeight: '1.6', opacity: 0.9, marginBottom: '35px', padding: '0 10px', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            {profile.bio}
          </p>
        )}

        {/* The Magic Link Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {links && links.length > 0 ? (
            links.map((link, index) => (
              <a 
                key={index} 
                href={link.url} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'block', width: '100%', padding: '18px 20px', backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.25)', borderRadius: '12px', color: 'white', textDecoration: 'none', fontSize: '16px', fontWeight: '600', transition: 'all 0.2s', backdropFilter: 'blur(10px)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
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
