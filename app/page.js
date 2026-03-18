import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ 
      backgroundColor: '#000', 
      color: '#fff', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      fontFamily: 'sans-serif' 
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>LINK SUPPLY</h1>
      <p style={{ color: '#888', marginBottom: '30px' }}>Professional NFC Management</p>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link href="/login" style={{ 
          padding: '12px 24px', 
          backgroundColor: '#fff', 
          color: '#000', 
          textDecoration: 'none', 
          borderRadius: '5px',
          fontWeight: 'bold' 
        }}>
          Customer Login
        </Link>
      </div>
    </div>
  )
}
