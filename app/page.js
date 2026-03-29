import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif', color: '#111' }}>
      
      <style>{`
        * { box-sizing: border-box; }
        .hero-text { font-size: 56px; line-height: 1.1; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; align-items: center; }
        
        @media (max-width: 900px) {
          .grid-3 { grid-template-columns: 1fr; }
          .grid-2 { grid-template-columns: 1fr; }
          .hero-text { font-size: 40px; }
        }
      `}</style>

      {/* --- NAVIGATION --- */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 5%', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Link Supply.</div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>
            Log In
          </Link>
          <Link href="/login?view=signup" style={{ padding: '10px 20px', backgroundColor: '#111', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', transition: '0.2s' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header style={{ padding: '100px 5%', textAlign: 'center', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 className="hero-text" style={{ fontWeight: '800', marginBottom: '20px', letterSpacing: '-1px' }}>
            Share your world with a single tap.
          </h1>
          <p style={{ fontSize: '20px', color: '#6b7280', marginBottom: '40px', lineHeight: '1.5' }}>
            The ultimate digital business card and smart NFC ecosystem. Connect instantly, share unlimited links, and leave a lasting impression without saying a word.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login?view=signup" style={{ padding: '16px 32px', backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '18px', boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)' }}>
              Create Your Profile
            </Link>
            <Link href="#use-cases" style={{ padding: '16px 32px', backgroundColor: '#f3f4f6', color: '#111', textDecoration: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '18px', border: '1px solid #d1d5db' }}>
              See How It Works
            </Link>
          </div>
        </div>
      </header>

      {/* --- HOW IT WORKS --- */}
      <section style={{ padding: '80px 5%', backgroundColor: '#111', color: 'white', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '50px' }}>Three steps to the future of networking.</h2>
        <div className="grid-3" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ padding: '30px', backgroundColor: '#1f2937', borderRadius: '16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>🛒</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>1. Get Your Tag</h3>
            <p style={{ color: '#9ca3af', lineHeight: '1.5' }}>Purchase a premium Link Supply NFC card, sticker, or keychain.</p>
          </div>
          <div style={{ padding: '30px', backgroundColor: '#1f2937', borderRadius: '16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚙️</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>2. Setup Your Vault</h3>
            <p style={{ color: '#9ca3af', lineHeight: '1.5' }}>Create your free digital profile. Add your contact info, social links, and bio.</p>
          </div>
          <div style={{ padding: '30px', backgroundColor: '#1f2937', borderRadius: '16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>📲</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>3. Tap to Connect</h3>
            <p style={{ color: '#9ca3af', lineHeight: '1.5' }}>Have anyone tap your tag with their smartphone to instantly share your profile.</p>
          </div>
        </div>
      </section>

      {/* --- USE CASES --- */}
      <section id="use-cases" style={{ padding: '100px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '15px', letterSpacing: '-0.5px' }}>Built for every industry.</h2>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>Whether you are closing deals or serving meals, Link Supply adapts to you.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
          
          {/* B2B / Professionals */}
          <div className="grid-2">
            <div>
              <div style={{ display: 'inline-block', padding: '10px 15px', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '20px', fontWeight: '700', fontSize: '14px', marginBottom: '15px' }}>B2B & Networking</div>
              <h3 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '15px', lineHeight: '1.2' }}>The last business card you will ever need.</h3>
              <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', marginBottom: '20px' }}>
                Stop printing paper cards that end up in the trash. With Link Supply, one tap saves your contact information directly into your client's phone. Share your LinkedIn, company website, and portfolio instantly during meetings and conferences.
              </p>
            </div>
            <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🤝</div>
              <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#111' }}>"Save to Contacts"</h4>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '10px' }}>Convert handshakes into permanent connections.</p>
            </div>
          </div>

          {/* Hospitality */}
          <div className="grid-2">
            <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🍽️</div>
              <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#111' }}>"Tap for Menu & WiFi"</h4>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '10px' }}>Boost 5-star Google Reviews automatically.</p>
            </div>
            <div>
              <div style={{ display: 'inline-block', padding: '10px 15px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '20px', fontWeight: '700', fontSize: '14px', marginBottom: '15px' }}>Restaurants & Hospitality</div>
              <h3 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '15px', lineHeight: '1.2' }}>Modernize your dining experience.</h3>
              <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', marginBottom: '20px' }}>
                Place a Link Supply NFC sticker on your tables. Customers can tap to instantly view your digital menu, connect to the guest Wi-Fi, or leave a Google Review. It is clean, efficient, and entirely managed from your dashboard.
              </p>
            </div>
          </div>

          {/* Events / Creators */}
          <div className="grid-2">
            <div>
              <div style={{ display: 'inline-block', padding: '10px 15px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '20px', fontWeight: '700', fontSize: '14px', marginBottom: '15px' }}>Events, Creators & Car Meets</div>
              <h3 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '15px', lineHeight: '1.2' }}>Turn physical presence into digital followers.</h3>
              <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', marginBottom: '20px' }}>
                At a car meet, trade show, or pop-up shop? Stick an NFC tag on your car window or booth. Enthusiasts can tap your tag to instantly follow your Instagram, view your vehicle specs, or buy your merch online.
              </p>
            </div>
            <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🏎️</div>
              <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#111' }}>"Follow on Instagram"</h4>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '10px' }}>Grow your audience effortlessly in the real world.</p>
            </div>
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb', padding: '60px 5%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '20px' }}>Link Supply.</h2>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <Link href="/terms" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>Terms & Conditions</Link>
            <Link href="/privacy" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>Privacy Policy</Link>
            <Link href="/login" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>Dashboard Login</Link>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>© {new Date().getFullYear()} Link Supply. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
