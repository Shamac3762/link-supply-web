'use client'

export default function TeamAdminSection({ teamMembers }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Total Employees</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: 0 }}>120</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Active Tags</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#059669', margin: 0 }}>112</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Unassigned Tags</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b', margin: 0 }}>8</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ padding: '25px 30px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: '0 0 5px 0' }}>Employee Directory</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Manage profiles and assign NFC tags instantly.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Search employees..." style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }} />
            <button onClick={() => alert("This will open a modal to type in a new employee name and email.")} style={{ padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}>+ Add Employee</button>
          </div>
        </div>

        <div className="b2b-table-wrapper">
          <table className="b2b-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Job Title</th>
                <th>Assigned Tag</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#4b5563', fontSize: '14px' }}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#111' }}>{member.name}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{member.title}</td>
                  <td>
                    {member.tag !== 'Unassigned' ? (
                      <span style={{ fontWeight: '600', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '4px 10px', borderRadius: '20px', fontSize: '13px' }}>{member.tag}</span>
                    ) : (
                      <span style={{ fontWeight: '600', color: '#f59e0b', backgroundColor: '#fef3c7', padding: '4px 10px', borderRadius: '20px', fontSize: '13px' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    {member.status === 'active' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#059669' }}><span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></span> Active</span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}><span style={{ width: '8px', height: '8px', backgroundColor: '#9ca3af', borderRadius: '50%' }}></span> Pending Setup</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => alert(`Edit panel for ${member.name} opening...`)} style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', cursor: 'pointer', fontSize: '14px', padding: '8px 12px' }}>Edit Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
