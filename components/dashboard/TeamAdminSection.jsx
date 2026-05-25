'use client'
import { useState } from 'react'

// Notice we added supabase, companyId, and refreshData to the props here!
export default function TeamAdminSection({ teamMembers, supabase, companyId, refreshData }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpTitle, setNewEmpTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Added loading state

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!companyId) return alert("Error: No company ID found for this account.");
    
    setIsSubmitting(true);
    
    try {
      // 1. Generate a random URL slug/username for the new employee
      const cleanBase = newEmpName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const randomStr = Math.random().toString(36).substring(2, 6);
      const newUsername = `${cleanBase}${randomStr}`;

      // 2. Insert the new employee into your database
      const { error } = await supabase.from('customers').insert([{
        display_name: newEmpName,
        display_email: newEmpEmail,
        job_title: newEmpTitle,
        company_id: companyId,
        username: newUsername,
        profile_status: 'live' // Automatically make their profile live
      }]);

      if (error) throw error;

      // 3. Close the modal, clear the form, and refresh the table!
      setShowAddModal(false);
      setNewEmpName('');
      setNewEmpEmail('');
      setNewEmpTitle('');
      refreshData(); 
      
    } catch (error) {
      alert("Database Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box', marginBottom: '15px' };
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
      
      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111' }}>Add New Employee</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            
            <form onSubmit={handleAddEmployee}>
              <label style={labelStyle}>Full Name</label>
              <input required type="text" placeholder="e.g. John Doe" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} style={inputStyle} />
              
              <label style={labelStyle}>Work Email</label>
              <input required type="email" placeholder="john@company.com" value={newEmpEmail} onChange={(e) => setNewEmpEmail(e.target.value)} style={inputStyle} />
              
              <label style={labelStyle}>Job Title</label>
              <input required type="text" placeholder="e.g. Sales Director" value={newEmpTitle} onChange={(e) => setNewEmpTitle(e.target.value)} style={inputStyle} />

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="button" disabled={isSubmitting} onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 2, padding: '12px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Metrics Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Total Employees</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: 0 }}>{teamMembers.length}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Active Tags</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#059669', margin: 0 }}>
            {teamMembers.filter(m => m.tag !== 'Unassigned').length}
          </p>
        </div>
      </div>

      {/* The Main Employee Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ padding: '25px 30px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: '0 0 5px 0' }}>Employee Directory</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Manage profiles and assign NFC tags instantly.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}>+ Add Employee</button>
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
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                    No employees added yet. Click "+ Add Employee" to start building your team.
                  </td>
                </tr>
              ) : teamMembers.map((member) => (
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
                      <button style={{ fontWeight: '700', color: '#f59e0b', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer' }}>+ Assign Tag</button>
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
                    <button style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', cursor: 'pointer', fontSize: '14px', padding: '8px 12px' }}>Edit Profile</button>
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
