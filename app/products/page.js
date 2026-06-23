'use client'
import React, { useState } from 'react'
import Link from 'next/link'

// ============================================================================
// 🛒 MASTER PRODUCT CATALOG
// Add, remove, or edit products here. The UI will automatically generate the cards.
// ============================================================================
const PRODUCT_CATALOG = [
  {
    id: 'nfc-card-matte',
    name: 'The Essential Card',
    price: '14.99',
    category: 'Individuals',
    badge: 'Most Popular',
    description: 'Our signature matte-black PVC smart card. Extremely durable, universally compatible, and instantly routes to your digital profile.',
    features: ['Premium Matte Finish', 'Embedded NFC + QR Code', 'Unlimited Taps'],
    accentColor: 'linear-gradient(135deg, #111 0%, #374151 100%)', // Used for image placeholder
    icon: '💳'
  },
  {
    id: 'custom-id-badge',
    name: 'Custom NFC ID Badge',
    price: '24.99',
    category: 'Teams',
    badge: 'Enterprise',
    description: 'Standardize your corporate identity. Fully customized with your company logo, employee name, and role. Perfect for sales fleets.',
    features: ['Full-Color Edge Printing', 'Lanyard Hole Cutout', 'Bulk Team Provisioning'],
    accentColor: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    icon: '🪪'
  },
  {
    id: 'smart-keyring',
    name: 'Smart Keyring',
    price: '19.99',
    category: 'Individuals',
    badge: 'On The Go',
    description: 'A rugged, waterproof NFC keyring. Attach it to your car keys or bag for instant networking anywhere, without reaching for your wallet.',
    features: ['Reinforced Metal Ring', 'Waterproof Epoxy Resin', 'Compact 30mm Design'],
    accentColor: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    icon: '🔑'
  },
  {
    id: 'table-tag',
    name: 'Smart Venue Tag',
    price: '9.99',
    category: 'Venues',
    badge: 'Hospitality',
    description: 'Industrial-grade adhesive NFC tags designed for restaurant tables, retail counters, or real estate signs. Route to menus or reviews instantly.',
    features: ['Industrial 3M Adhesive', 'Scratch & Spill Resistant', 'Scannable from 2 inches'],
    accentColor: 'linear-gradient(135deg, #9a3412 0%, #f59e0b 100%)',
    icon: '🏷️'
  },
  {
    id: 'agency-sign',
    name: 'Premium Display Sign',
    price: '49.99',
    category: 'Venues',
    badge: 'Agencies',
    description: 'A stunning acrylic desk stand for lobbies, events, and trade shows. Features a high-contrast QR code and a dual-NFC embedded base.',
    features: ['A5 Frosted Acrylic', 'Dual NFC Tap Zones', 'High-Resolution QR Print'],
    accentColor: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
    icon: '🪧'
  }
];

export default function ProductsPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  // Derive unique categories from the catalog automatically
  const categories = ['All', ...Array.from(new Set(PRODUCT_CATALOG.map(p => p.category)))];

  // Filter the products based on the active tab
  const displayedProducts = activeFilter === 'All' 
    ? PRODUCT_CATALOG 
    : PRODUCT_CATALOG.filter(p => p.category === activeFilter);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '"Myriad Pro", "Segoe UI", Roboto, Helvetica, Arial, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        /* Premium Nav */
        .store-nav { padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; background-color: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 50; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .logo { font-size: 22px; color: #111; letter-spacing: -0.5px; display: flex; align-items: baseline; text-decoration: none; }
        
        /* Filter Tabs */
        .filter-container { display: flex; justify-content: center; margin: -20px auto 40px auto; position: relative; z-index: 20; }
        .filter-tabs { display: inline-flex; background: white; padding: 6px; border-radius: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; overflow-x: auto; max-width: 100%; }
        .filter-btn { padding: 10px 24px; border-radius: 24px; border: none; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
        
        /* Product Grid */
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; padding: 0 20px 80px 20px; max-width: 1200px; margin: 0 auto; }
        
        /* Product Card Animations */
        .product-card { background: white; border-radius: 24px; border: 1px solid #e5e7eb; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; position: relative; }
        .product-card:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border-color: #d1d5db; }
        
        /* Image Placeholder Area */
        .product-image-container { height: 260px; width: 100%; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .product-image-container::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent); transform: skewX(-20deg); transition: 0.7s; opacity: 0; }
        .product-card:hover .product-image-container::after { left: 200%; opacity: 1; }
        
        .product-info { padding: 30px; display: flex; flex-direction: column; flex-grow: 1; }
        
        /* Buttons */
        .buy-btn { width: 100%; padding: 14px; border-radius: 12px; border: none; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; margin-top: auto; }
        .btn-primary { background-color: #111; color: white; }
        .btn-primary:hover { background-color: #374151; transform: scale(1.02); }
        .btn-outline { background-color: white; color: #111; border: 2px solid #111; font-weight: 800; }
        .btn-outline:hover { background-color: #f3f4f6; }

        @media (max-width: 768px) {
          .store-nav { padding: 15px 20px; }
          .hero-section { padding: 80px 20px !important; }
          .hero-title { font-size: 40px !important; }
          .filter-container { padding: 0 20px; justify-content: flex-start; margin-top: -25px; }
        }
      `}</style>

      {/* --- NAVIGATION --- */}
      <nav className="store-nav">
        <Link href="/" className="logo">
          <span style={{ fontWeight: '800' }}>Link</span><span style={{ fontWeight: '400' }}>Supply.</span>
        </Link>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button className="buy-btn btn-outline" style={{ padding: '8px 24px', width: 'auto' }}>Dashboard</button>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="hero-section" style={{ backgroundColor: '#111', color: 'white', padding: '120px 20px 100px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(17,17,17,0) 70%)', pointerEvents: 'none' }}></div>
        
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '800px', margin: '0 auto' }}>
          <span style={{ color: '#a1a1aa', fontWeight: '800', letterSpacing: '2px', fontSize: '12px', textTransform: 'uppercase', marginBottom: '20px', display: 'inline-block', border: '1px solid #3f3f46', padding: '6px 14px', borderRadius: '20px' }}>
            Hardware Store
          </span>
          <h1 className="hero-title" style={{ fontSize: '64px', fontWeight: '800', letterSpacing: '-2px', marginBottom: '25px', lineHeight: '1.05' }}>
            The physical key to your digital identity.
          </h1>
          <p style={{ fontSize: '18px', color: '#9ca3af', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
            Premium NFC cards, signage, and tags designed to bridge the gap between the physical world and your Link Supply workspace.
          </p>
        </div>
      </section>

      {/* --- DYNAMIC FILTER TABS --- */}
      <div className="filter-container">
        <div className="filter-tabs">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className="filter-btn"
              style={{
                backgroundColor: activeFilter === category ? '#111' : 'transparent',
                color: activeFilter === category ? 'white' : '#6b7280',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* --- AUTOMATED PRODUCT GRID --- */}
      <main className="product-grid" style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
        {displayedProducts.map((product) => (
          <div key={product.id} className="product-card">
            
            {/* Dynamic Badge */}
            {product.badge && (
              <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#111', color: 'white', fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '20px', zIndex: 10, textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                {product.badge}
              </div>
            )}

            {/* Image Placeholder (Uses the dynamic accentColor from the catalog) */}
            <div className="product-image-container" style={{ background: product.accentColor }}>
              <div style={{ fontSize: '72px', filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.2))', transform: 'rotate(-5deg)', transition: 'transform 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-5deg) scale(1)'}>
                {product.icon}
              </div>
            </div>

            {/* Product Information */}
            <div className="product-info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: 0, letterSpacing: '-0.5px', paddingRight: '10px' }}>{product.name}</h3>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#111' }}>£{product.price}</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', marginBottom: '25px', minHeight: '63px' }}>
                {product.description}
              </p>
              
              {/* Dynamic Feature List */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', fontSize: '13px', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {product.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#10b981', fontWeight: '800', fontSize: '14px' }}>✓</span> {feature}
                  </li>
                ))}
              </ul>

              <button 
                className="buy-btn btn-primary" 
                onClick={() => alert(`Stripe Checkout for ${product.name} coming soon!`)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* --- TRUST & FEATURES FOOTER --- */}
      <section style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '15px' }}>⚡️</div>
            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#111', marginBottom: '10px', letterSpacing: '-0.5px' }}>No App Required</h4>
            <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>Works instantly with all modern iOS and Android smartphones right out of the box.</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '15px' }}>☁️</div>
            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#111', marginBottom: '10px', letterSpacing: '-0.5px' }}>Cloud Managed</h4>
            <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>Update your hardware's destination link anytime from your dashboard. Never order a replacement again.</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '15px' }}>🔒</div>
            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#111', marginBottom: '10px', letterSpacing: '-0.5px' }}>Secure Technology</h4>
            <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>Read-only NFC chips ensure your data and routing logic remain completely tamper-proof.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
