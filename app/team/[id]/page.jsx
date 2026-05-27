'use client'
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Adjust this import to match your standard Supabase setup
import Head from 'next/head';

export default function CompanyDirectory() {
  const params = useParams();
  const companyId = params.id;
  const supabase = createClientComponentClient(); // Adjust if you use a different initialized client

  const [companyName, setCompanyName] = useState('Loading...');
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchDirectoryData();
    }
  }, [companyId]);

  const fetchDirectoryData = async () => {
    setIsLoading(true);
    try {
      // 1. Get Company Details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('company_name')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompanyName(companyData.company_name);

      // 2. Get All Active Employees
      const { data: employeeData, error: employeeError } = await supabase
        .from('customers')
        .select('display_name, job_title, username, profile_picture_url, theme_color')
        .eq('company_id', companyId)
        .eq('profile_status', 'live')
        .order('display_name', { ascending: true });

      if (employeeError) throw employeeError;
      setTeamMembers(employeeData || []);
    } catch (error) {
      console.error("Error fetching directory:", error);
      setCompanyName('Company Not Found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${companyName} - Team Directory`,
      text: `Meet the team at ${companyName}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Directory link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', color: '#111' }}>
        <div style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '2px', textTransform: 'uppercase', animation: 'pulse 1.5s infinite' }}>Loading Directory...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfcfc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Head>
        <title>{companyName} | Team Directory</title>
      </Head>

      {/* PREMIUM HEADER HERO */}
      <div style={{ backgroundColor: '#111', color: 'white', padding: '80px 20px 60px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '120%', height: '200%', background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: '900', letterSpacing: '-1.5px', margin: '0 0 15px 0', lineHeight: '1.1' }}>
            {companyName}
          </h1>
          <p style={{ fontSize: '18px', color: '#a1a1aa', margin: '0 0 30px 0', fontWeight: '500' }}>
            Official Team Directory
          </p>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button onClick={handleShare} style={{ padding: '12px 24px', backgroundColor: 'white', color: '#111', border: 'none', borderRadius: '30px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              Share Directory
            </button>
            <button onClick={() => setShowQR(true)} style={{ padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '30px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', backdropFilter: 'blur(10px)' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6zM15 9h6M9 15v6"/></svg>
              QR Code
            </button>
          </div>
        </div>
      </div>

      {/* TEAM GRID */}
      <div style={{ maxWidth: '1100px', margin: '-40px auto 60px auto', padding: '0 20px', position: 'relative', zIndex: 20 }}>
        {teamMembers.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '50px', textAlign: 'center', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #f4f4f5' }}>
            <h3 style={{ fontSize: '20px', color: '#111', margin: '0 0 10px 0' }}>No team members found.</h3>
            <p style={{ color: '#71717a', margin: 0 }}>Employees added to this workspace will appear here automatically.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
            {teamMembers.map((member) => (
              <a 
                key={member.username} 
                href={`/u/${member.username}`} 
                style={{ 
                  textDecoration: 'none', color: 'inherit', display: 'block', backgroundColor: 'white', 
                  borderRadius: '24px', padding: '25px', border: '1px solid #f4f4f5', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.03)', transition: 'all 0.3s ease', cursor: 'pointer',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.03)'; }}
              >
                {/* Subtle top color bar based on their theme */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', backgroundColor: member.theme_color || '#111' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  {member.profile_picture_url ? (
                    <img src={member.profile_picture_url} alt={member.display_name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f4f4f5' }} />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: member.theme_color || '#111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800' }}>
                      {member.display_name.charAt(0)}
                    </div>
                  )}
                  
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.display_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#71717a', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.job_title || 'Team Member'}
                    </p>
                  </div>

                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* QR CODE MODAL */}
      {showQR && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '32px', textAlign: 'center', maxWidth: '350px', width: '100%', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setShowQR(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f4f4f5', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: '800', color: '#111' }}>Scan to View</h3>
            <p style={{ color: '#71717a', fontSize: '14px', margin: '0 0 25px 0' }}>{companyName} Directory</p>
            
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '20px', border: '2px solid #f4f4f5', display: 'inline-block', marginBottom: '20px' }}>
              {/* Replace this placeholder image with your actual QR code component (e.g., react-qr-code) using window.location.href as the value */}
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${typeof window !== 'undefined' ? window.location.href : ''}`} alt="QR Code" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '10px' }} />
            </div>
            
            <button onClick={handleShare} style={{ width: '100%', padding: '14px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
              Copy Link
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
