import Link from 'next/link'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif', padding: '40px 20px', color: '#111' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        
        <Link href="/login" style={{ display: 'inline-block', marginBottom: '20px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
          &larr; Back
        </Link>

        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '10px', letterSpacing: '-0.5px' }}>Terms and Conditions</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '30px' }}>Last Updated: March 2026</p>

        <div style={{ lineHeight: '1.6', fontSize: '15px', color: '#374151' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>1. Introduction</h2>
          <p style={{ marginBottom: '15px' }}>Welcome to Link Supply ("we," "our," or "us"). These Terms and Conditions govern your use of our website (linksupply.co.uk), digital dashboard, and physical NFC hardware products (collectively, the "Services"). By purchasing our products or registering for an account, you agree to be bound by these Terms.</p>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>2. Account Registration and Security</h2>
          <p style={{ marginBottom: '15px' }}>To access the Link Supply dashboard and link your physical tags, you must register for an account. You agree to provide accurate, current, and complete information. You are responsible for safeguarding your password and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>3. Hardware Products, Shipping, and Returns</h2>
          <ul style={{ marginBottom: '15px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}><strong>Purchases:</strong> All orders of Link Supply NFC tags are subject to acceptance and availability.</li>
            <li style={{ marginBottom: '8px' }}><strong>Returns & Refunds:</strong> We accept returns of undamaged hardware within 30 days of receipt for a full refund. Custom-printed or engraved products are non-refundable unless defective.</li>
            <li style={{ marginBottom: '8px' }}><strong>Warranty:</strong> We provide a 1-year limited warranty against manufacturing defects in our NFC hardware. This does not cover physical damage, water damage, or normal wear and tear.</li>
          </ul>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>4. Premium Subscriptions</h2>
          <p style={{ marginBottom: '15px' }}>Certain features (such as unlimited links and advanced analytics) are available via our Premium subscription tier.</p>
          <ul style={{ marginBottom: '15px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}><strong>Billing:</strong> Subscriptions are billed in advance on a recurring monthly or annual basis.</li>
            <li style={{ marginBottom: '8px' }}><strong>Cancellations:</strong> You may cancel your Premium subscription at any time through your dashboard settings. Cancellations take effect at the end of the current billing cycle. No partial refunds are provided.</li>
          </ul>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>5. Acceptable Use and User Content</h2>
          <p style={{ marginBottom: '15px' }}>You retain all ownership rights to the content, links, and information you add to your digital profile ("User Content"). However, you agree not to use the Services to:</p>
          <ul style={{ marginBottom: '15px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Host or transmit illegal, malicious, or deceptive content (e.g., malware, phishing links).</li>
            <li style={{ marginBottom: '8px' }}>Share sexually explicit, defamatory, or discriminatory material.</li>
            <li style={{ marginBottom: '8px' }}>Impersonate any person or business.</li>
          </ul>
          <p style={{ marginBottom: '15px' }}>We reserve the right to suspend or terminate accounts and disable hardware links immediately and without notice if you violate these terms.</p>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>6. Limitation of Liability</h2>
          <p style={{ marginBottom: '15px' }}>To the maximum extent permitted by law, Link Supply shall not be liable for any indirect, incidental, special, or consequential damages, including lost profits, lost data, or business interruption arising from your use of the Services or hardware. The Services are provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind.</p>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>7. Governing Law</h2>
          <p style={{ marginBottom: '15px' }}>These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>8. Contact</h2>
          <p style={{ marginBottom: '15px' }}>For legal inquiries, please contact us at: legal@linksupply.co.uk</p>
        </div>
      </div>
    </div>
  )
}
