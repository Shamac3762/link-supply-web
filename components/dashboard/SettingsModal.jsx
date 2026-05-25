'use client'

export default function SettingsModal({
  setShowSettings,
  newPassword,
  setNewPassword,
  handleUpdatePassword,
  pageProfile,
  handleToggleRememberMe,
  handleDeleteAccount,
  settingsMessage,
  setSettingsMessage
}) {
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Account Settings</h2>
          <button onClick={() => {setShowSettings(false); setSettingsMessage('')}} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <label style={labelStyle}>Change Password</label>
          <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{...inputStyle, marginBottom: '10px'}} />
          <button onClick={handleUpdatePassword} style={{ width: '100%', padding: '10px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Update Password</button>
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', paddingBottom: '10px' }}>
          <h3 style={{ fontSize: '16px', color: '#111', margin: '0 0 15px 0' }}>Security Preferences</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#111' }}>Keep me signed in</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Remember this device for future visits.</p>
            </div>
            <button onClick={() => handleToggleRememberMe(pageProfile.remember_me)} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: pageProfile.remember_me ? '#059669' : '#e5e7eb', position: 'relative', transition: 'background-color 0.2s ease' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', left: pageProfile.remember_me ? '22px' : '2px', transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '10px' }}>
          <h3 style={{ fontSize: '16px', color: '#dc2626', margin: '0 0 10px 0' }}>Danger Zone</h3>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>Permanently delete your account and data to comply with GDPR.</p>
          <button onClick={handleDeleteAccount} style={{ width: '100%', padding: '10px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Delete Account</button>
        </div>
        {settingsMessage && <p style={{ marginTop: '15px', color: settingsMessage.includes('Success') ? '#059669' : '#dc2626', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>{settingsMessage}</p>}
      </div>
    </div>
  )
}
