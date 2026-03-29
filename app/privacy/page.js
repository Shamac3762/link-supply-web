import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif', padding: '40px 20px', color: '#111' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        
        <Link href="/login" style={{ display: 'inline-block', marginBottom: '20px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
          &larr; Back
        </Link>

        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '10px', letterSpacing: '-0.5px' }}>Privacy Policy</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '30px' }}>Last Updated: March 2026</p>

        <div style={{ lineHeight: '1.6', fontSize: '15px', color: '#374151' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>1. Introduction</h2>
          <p style={{ marginBottom: '15px' }}>At Link Supply, we are committed to protecting your privacy and ensuring your data is handled securely and in compliance with the General Data Protection Regulation (UK GDPR and EU GDPR). This policy explains how we collect, use, and protect your personal data.</p>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>2. Information We Collect</h2>
          <ul style={{ marginBottom: '15px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}><strong>Account Information:</strong> When you register, we collect your name, email address, and account password (securely hashed).</li>
            <li style={{ marginBottom: '8px' }}><strong>Profile Data:</strong> Information you voluntarily provide to display on your digital business card, including your job title, company name, phone number, display email, bio, profile pictures, and external URLs.</li>
            <li style={{ marginBottom: '8px' }}><strong>Hardware Analytics:</strong> We collect anonymous interaction data, such as the number of times your NFC tags have been tapped, to provide you with dashboard analytics.</li>
            <li style={{ marginBottom: '8px' }}><strong>Payment Information:</strong> If you purchase hardware or a Premium subscription, your payment details are processed securely by our third-party payment provider (e.g., Stripe). We do not store full credit card details on our servers.</li>
          </ul>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>3. How We Use Your Data</h2>
          <p style={{ marginBottom: '15px' }}>We use your data to:</p>
          <ul style={{ marginBottom: '15px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Provide, maintain, and improve the Link Supply dashboard and routing services.</li>
            <li style={{ marginBottom: '8px' }}>Display your chosen information when a third party taps your NFC tag or visits your public profile URL.</li>
            <li style={{ marginBottom: '8px' }}>Process transactions and send related billing information.</li>
            <li style={{ marginBottom: '8px' }}>Communicate with you regarding account updates, security alerts, and customer support.</li>
          </ul>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>4. Data Sharing and Third-Party Processors</h2>
          <p style={{ marginBottom: '15px' }}>We do not sell your personal data. We may share your data with trusted third-party service providers (such as hosting platforms and payment processors) strictly for the purpose of operating our business. These providers are bound by strict data processing agreements.</p>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>5. Public Visibility</h2>
          <p style={{ marginBottom: '15px' }}>Please be aware that any information you add to your Page Identity and Digital Business Card sections is intended for public display. When someone scans your Link Supply product or visits your custom URL, this data will be visible to them.</p>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>6. Your GDPR Rights</h2>
          <p style={{ marginBottom: '15px' }}>Under the GDPR, you have the right to:</p>
          <ul style={{ marginBottom: '15px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li style={{ marginBottom: '8px' }}><strong>Rectification:</strong> Update or correct inaccurate data via your dashboard.</li>
            <li style={{ marginBottom: '8px' }}><strong>Erasure ("Right to be Forgotten"):</strong> You may permanently delete your account and sever all physical tags from your profile via the "Danger Zone" in your Account Settings.</li>
            <li style={{ marginBottom: '8px' }}><strong>Data Portability:</strong> Request an export of your data.</li>
          </ul>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>7. Data Retention</h2>
          <p style={{ marginBottom: '15px' }}>We retain your personal information only for as long as your account is active or as needed to provide you with our services, comply with legal obligations, or resolve disputes. If you delete your account, your data is permanently purged from our active databases.</p>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '30px', marginBottom: '10px', color: '#111' }}>8. Contact Us</h2>
          <p style={{ marginBottom: '15px' }}>If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact our Data Protection Officer at: privacy@linksupply.co.uk</p>
        </div>
      </div>
    </div>
  )
}
